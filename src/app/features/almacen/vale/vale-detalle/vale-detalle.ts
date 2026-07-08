import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ValeService } from '../../services/vale.service';
import { AuthService } from '../../../../core/services/auth.service';
import { ValeResponse, ValeDispatchRequest } from '../../models/vale';

@Component({
  selector: 'app-vale-detalle',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './vale-detalle.html',
  styleUrls: ['./vale-detalle.css']
})
export class ValeDetalleComponent implements OnInit {
  private valeService = inject(ValeService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  // States
  vale = signal<ValeResponse | null>(null);
  cargando = signal<boolean>(true);
  despachando = signal<boolean>(false);
  mensajeError = signal<string | null>(null);
  mensajeExito = signal<string | null>(null);

  isAlmacen = signal<boolean>(true);
  despachadoPor = signal<string>('');

  // Map to bind dispatch quantities input
  cantidadesDespacho = signal<{ [key: number]: number }>({});

  // Edit state for Maintenance
  editando = signal<boolean>(false);
  materialesEdit = signal<{ id_material: number; cod_materia: string; descripcion: string; cantidad_solicitada: number; original_cantidad: number }[]>([]);
  guardandoCambios = signal<boolean>(false);

  ngOnInit(): void {
    const path = this.router.url;
    this.isAlmacen.set(path.includes('GestionAlmacen'));

    // Obtener y formatear el despachador de la sesión activa
    const sesion = this.authService.getSesion();
    if (sesion) {
      const nombreCompleto = `${sesion.nombre} ${sesion.apellidos}`.trim();
      this.despachadoPor.set(nombreCompleto);
    } else {
      this.despachadoPor.set('Usuario Desconocido');
    }

    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.cargarVale(Number(idParam));
    } else {
      this.mensajeError.set('ID del vale no provisto.');
      this.cargando.set(false);
    }
  }

  cargarVale(id: number): void {
    this.cargando.set(true);
    this.mensajeError.set(null);

    this.valeService.getValeById(id).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.vale.set(res.data);

          // Inicializar las cantidades a despachar con la solicitada por defecto
          const cants: { [key: number]: number } = {};
          res.data.materiales.forEach(m => {
            cants[m.id_vale_material] = m.cantidad_solicitada;
          });
          this.cantidadesDespacho.set(cants);
        } else {
          this.mensajeError.set(res.message || 'Error al cargar los detalles del vale');
        }
        this.cargando.set(false);
      },
      error: (err) => {
        this.mensajeError.set(err.error?.message || 'Error de conexión con el servidor');
        this.cargando.set(false);
      }
    });
  }

  actualizarCantidadDespacho(idValeMat: number, val: number): void {
    if (val < 0) return;
    this.cantidadesDespacho.update(cants => ({
      ...cants,
      [idValeMat]: val
    }));
  }

  despachar(): void {
    const v = this.vale();
    if (!v) return;

    this.mensajeError.set(null);
    this.mensajeExito.set(null);

    // Validar las cantidades ingresadas
    const items = v.materiales.map(m => {
      const cantDesp = this.cantidadesDespacho()[m.id_vale_material];
      return {
        id_vale_material: m.id_vale_material,
        cantidad_despachada: cantDesp,
        nombre: m.descripcion,
        solicitada: m.cantidad_solicitada
      };
    });

    for (const item of items) {
      if (item.cantidad_despachada === undefined || item.cantidad_despachada === null) {
        this.mensajeError.set(`Debe especificar una cantidad a despachar para "${item.nombre}".`);
        return;
      }
      if (item.cantidad_despachada < 0) {
        this.mensajeError.set(`La cantidad a despachar para "${item.nombre}" no puede ser negativa.`);
        return;
      }
      if (item.cantidad_despachada > item.solicitada) {
        this.mensajeError.set(`La cantidad a despachar para "${item.nombre}" (${item.cantidad_despachada}) no puede superar a la solicitada (${item.solicitada}).`);
        return;
      }
    }

    this.despachando.set(true);

    const request: ValeDispatchRequest = {
      despachado_por: this.despachadoPor(),
      materiales: items.map(i => ({
        id_vale_material: i.id_vale_material,
        cantidad_despachada: i.cantidad_despachada
      }))
    };

    this.valeService.despacharVale(v.id_vale, request).subscribe({
      next: (res) => {
        if (res.success) {
          this.mensajeExito.set('El vale ha sido despachado exitosamente y convertido en Nota de Salida.');
          setTimeout(() => {
            this.cargarVale(v.id_vale);
          }, 1500);
        } else {
          this.mensajeError.set(res.message || 'Error al procesar el despacho del vale.');
        }
        this.despachando.set(false);
      },
      error: (err) => {
        this.mensajeError.set(err.error?.message || 'Error de conexión con el servidor.');
        this.despachando.set(false);
      }
    });
  }

  iniciarEdicion(): void {
    const v = this.vale();
    if (!v) return;
    this.materialesEdit.set(v.materiales.map(m => ({
      id_material: m.id_material,
      cod_materia: m.cod_materia,
      descripcion: m.descripcion,
      cantidad_solicitada: m.cantidad_solicitada,
      original_cantidad: m.cantidad_solicitada
    })));
    this.editando.set(true);
    this.mensajeError.set(null);
    this.mensajeExito.set(null);
  }

  cancelarEdicion(): void {
    this.editando.set(false);
    this.materialesEdit.set([]);
  }

  quitarMaterial(idMaterial: number): void {
    this.materialesEdit.update(list => list.filter(m => m.id_material !== idMaterial));
  }

  actualizarCantidadEdit(idMaterial: number, nuevaCant: number): void {
    this.materialesEdit.update(list => list.map(m => {
      if (m.id_material === idMaterial) {
        // Enforce subtracting/decreasing quantity: nuevaCant cannot exceed original_cantidad
        const cant = Math.min(Math.max(nuevaCant, 0.01), m.original_cantidad);
        return { ...m, cantidad_solicitada: cant };
      }
      return m;
    }));
  }

  guardarEdicion(): void {
    const v = this.vale();
    if (!v) return;

    const editList = this.materialesEdit();
    if (editList.length === 0) {
      this.mensajeError.set('El vale debe tener al menos un material.');
      return;
    }

    // Check if any quantity exceeds the original
    for (const item of editList) {
      if (item.cantidad_solicitada > item.original_cantidad) {
        this.mensajeError.set(`No puede aumentar la cantidad de ${item.descripcion}. Solo se permite restar.`);
        return;
      }
      if (item.cantidad_solicitada <= 0) {
        this.mensajeError.set(`La cantidad para ${item.descripcion} debe ser mayor a 0.`);
        return;
      }
    }

    this.guardandoCambios.set(true);
    this.mensajeError.set(null);

    const request = {
      solicitado_por: v.solicitado_por,
      observaciones: v.observaciones,
      materiales: editList.map(m => ({
        id_material: m.id_material,
        cantidad_solicitada: m.cantidad_solicitada
      }))
    };

    this.valeService.updateVale(v.id_vale, request).subscribe({
      next: (res) => {
        if (res.success) {
          this.mensajeExito.set('Vale actualizado exitosamente.');
          this.editando.set(false);
          this.cargarVale(v.id_vale);
        } else {
          this.mensajeError.set(res.message || 'Error al actualizar el vale.');
        }
        this.guardandoCambios.set(false);
      },
      error: (err) => {
        this.mensajeError.set(err.error?.message || 'Error al conectar con el servidor.');
        this.guardandoCambios.set(false);
      }
    });
  }

  imprimir(): void {
    const data = this.vale();
    const tituloOriginal = document.title;
    if (data) {
      document.title = data.cod_vale;
    }
    window.print();
    setTimeout(() => {
      document.title = tituloOriginal;
    }, 100);
  }

  volver(): void {
    const parentPath = this.isAlmacen() ? 'GestionAlmacen' : 'GestionMantenimiento';
    this.router.navigate([`/${parentPath}/vale`]);
  }

  verOt(): void {
    const v = this.vale();
    if (v && v.id_ot) {
      const parentPath = this.isAlmacen() ? 'GestionAlmacen' : 'GestionMantenimiento';
      this.router.navigate([`/${parentPath}/orden-trabajo/detalle`, v.id_ot]);
    }
  }

  formatearFecha(fechaStr: string | null | undefined): string {
    if (!fechaStr) return '-';
    const date = new Date(fechaStr);
    return date.toLocaleString('es-PE', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}
