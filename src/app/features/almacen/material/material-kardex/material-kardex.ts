import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MaterialService } from '../../services/material.service';
import { AuthService } from '../../../../core/services/auth.service';
import { MaterialResponse } from '../../models/material';
import { MovimientoInventarioResponse } from '../../models/kardex';

@Component({
  selector: 'app-material-kardex',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './material-kardex.html',
  styleUrls: ['./material-kardex.css']
})
export class MaterialKardexComponent implements OnInit {
  private materialService = inject(MaterialService);
  private authService = inject(AuthService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  // States
  materialId = signal<number | null>(null);
  material = signal<MaterialResponse | null>(null);
  movimientos = signal<MovimientoInventarioResponse[]>([]);

  cargando = signal<boolean>(true);
  cargandoMovimientos = signal<boolean>(true);
  guardandoEntrada = signal<boolean>(false);

  mensajeError = signal<string | null>(null);
  mensajeExito = signal<string | null>(null);

  // Modal State
  modalAbierto = signal<boolean>(false);
  cantidadEntrada = signal<number | null>(null);
  observacionesEntrada = signal<string>('');
  responsableEntrada = signal<string>('');

  ngOnInit(): void {
    // Obtener y formatear el responsable de la sesión activa
    const sesion = this.authService.getSesion();
    if (sesion) {
      const nombreCompleto = `${sesion.nombre} ${sesion.apellidos}`.trim();
      this.responsableEntrada.set(nombreCompleto);
    } else {
      this.responsableEntrada.set('Usuario Desconocido');
    }

    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      const id = Number(idParam);
      this.materialId.set(id);
      this.cargarMaterialYMovimientos(id);
    } else {
      this.mensajeError.set('ID de material no provisto.');
      this.cargando.set(false);
      this.cargandoMovimientos.set(false);
    }
  }

  cargarMaterialYMovimientos(id: number): void {
    this.cargando.set(true);
    this.cargandoMovimientos.set(true);
    this.mensajeError.set(null);

    // Cargar material (buscándolo de la lista completa)
    this.materialService.getMateriales().subscribe({
      next: (res) => {
        if (res.success && res.data) {
          const mat = res.data.find(m => m.id_material === id);
          if (mat) {
            this.material.set(mat);
          } else {
            this.mensajeError.set('No se encontró el material solicitado.');
          }
        } else {
          this.mensajeError.set(res.message || 'Error al cargar detalles del material.');
        }
        this.cargando.set(false);
      },
      error: (err) => {
        this.mensajeError.set(err.error?.message || 'Error de conexión.');
        this.cargando.set(false);
      }
    });

    // Cargar movimientos del Kardex
    this.materialService.getKardex(id).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.movimientos.set(res.data);
        } else {
          this.mensajeError.set(res.message || 'Error al cargar el historial del Kardex.');
        }
        this.cargandoMovimientos.set(false);
      },
      error: (err) => {
        this.mensajeError.set(err.error?.message || 'Error de conexión al cargar Kardex.');
        this.cargandoMovimientos.set(false);
      }
    });
  }

  abrirModal(): void {
    this.cantidadEntrada.set(null);
    this.observacionesEntrada.set('');
    this.modalAbierto.set(true);
  }

  cerrarModal(): void {
    this.modalAbierto.set(false);
  }

  registrarEntrada(): void {
    const id = this.materialId();
    if (!id) return;

    this.mensajeError.set(null);
    this.mensajeExito.set(null);

    const cant = this.cantidadEntrada();
    if (!cant || cant <= 0) {
      this.mensajeError.set('Debe ingresar una cantidad mayor a 0.');
      return;
    }

    this.guardandoEntrada.set(true);

    const request = {
      cantidad: cant,
      responsable: this.responsableEntrada(),
      observaciones: this.observacionesEntrada() || null
    };

    this.materialService.registrarEntradaStock(id, request).subscribe({
      next: (res) => {
        if (res.success) {
          this.mensajeExito.set('Entrada de stock registrada exitosamente.');
          this.cerrarModal();

          // Recargar datos
          setTimeout(() => {
            this.cargarMaterialYMovimientos(id);
          }, 1000);
        } else {
          this.mensajeError.set(res.message || 'Error al registrar la entrada de stock.');
        }
        this.guardandoEntrada.set(false);
      },
      error: (err) => {
        this.mensajeError.set(err.error?.message || 'Error de conexión con el servidor.');
        this.guardandoEntrada.set(false);
      }
    });
  }

  volver(): void {
    this.router.navigate(['/GestionAlmacen/material/kardex']); // O a la vista de inventario si existiera
  }

  verVale(codVale: string): void {
    // Extraer ID o redirigir buscando el vale por código
    // Para simplificar, la ruta es `/GestionAlmacen/vale` y allí pueden filtrar. 
    // Pero si tenemos un endpoint por ID, sería mejor. Por ahora, nos quedamos con ir al listado de vales.
    this.router.navigate(['/GestionAlmacen/vale']);
  }

  verOt(codOt: string): void {
    // Si viene de un vale de OT, podemos buscar el id_ot. Para simplificar, podemos buscar la OT o navegar a la lista
    // En este caso, buscaremos si podemos navegar a la ruta del detalle de la OT en Mantenimiento si es supervisor, 
    // o en Almacén si tiene permisos. La ruta `/GestionAlmacen` no suele ver OTs, pero `/GestionMantenimiento/orden-trabajo/detalle/:id` sí.
    // Naveguemos directamente a la lista de OTs en mantenimiento si el rol lo permite, o simplemente al listado.
    // Dejémoslo con navegación a la lista de OTs.
    this.router.navigate(['/GestionMantenimiento/orden-trabajo']);
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
