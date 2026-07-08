import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ValeService } from '../../services/vale.service';
import { MaterialService } from '../../services/material.service';
import { OrdenTrabajoService } from '../../../m-mantenimiento/services/orden-trabajo.service';
import { AuthService } from '../../../../core/services/auth.service';
import { MaterialResponse } from '../../models/material';
import { OrdenTrabajoResponse } from '../../../m-mantenimiento/models/orden-trabajo';
import { ValeCreateRequest } from '../../models/vale';

interface SelectedMaterialItem {
  material: MaterialResponse;
  cantidad: number;
}

@Component({
  selector: 'app-vale-form',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './vale-form.html',
  styleUrls: ['./vale-form.css']
})
export class ValeFormComponent implements OnInit {
  private valeService = inject(ValeService);
  private materialService = inject(MaterialService);
  private otService = inject(OrdenTrabajoService);
  private authService = inject(AuthService);
  private router = inject(Router);

  // States
  isAlmacen = signal<boolean>(true);
  cargando = signal<boolean>(false);
  guardando = signal<boolean>(false);
  mensajeError = signal<string | null>(null);
  mensajeExito = signal<string | null>(null);

  // Catalogos
  todosLosMateriales = signal<MaterialResponse[]>([]);
  todasLasOts = signal<OrdenTrabajoResponse[]>([]);
  valesExistentes = signal<any[]>([]);

  // Form Fields
  tipoVale = signal<'OT' | 'LIBRE'>('OT');
  otSeleccionadaId = signal<number | null>(null);
  observaciones = signal<string>('');
  solicitadoPor = signal<string>('');

  // Selected Materials List
  materialesSeleccionados = signal<SelectedMaterialItem[]>([]);

  // Temporary selectors for adding a material
  materialSeleccionadoId = signal<number | null>(null);
  cantidadASeleccionar = signal<number>(1);
  busquedaMaterial = signal<string>('');

  // Computed signals
  otsDisponibles = computed(() => {
    const ots = this.todasLasOts();
    const vales = this.valesExistentes();
    
    // Obtener los ids de las OTs que ya tienen un vale
    const idsOtConVale = new Set(
      vales
        .map(v => v.id_ot)
        .filter((id): id is number => id !== null && id !== undefined)
    );

    // Filtrar OTs que no estén cerradas y que no tengan un vale asociado
    return ots.filter(ot => 
      ot.estado !== 'CERRADA' && 
      ot.estado !== 'INACTIVA' && 
      !idsOtConVale.has(ot.id_ot)
    );
  });

  materialesFiltrados = computed(() => {
    const list = this.todosLosMateriales();
    const query = this.busquedaMaterial().toLowerCase().trim();
    if (!query) return list;
    return list.filter(m => 
      m.cod_materia.toLowerCase().includes(query) || 
      m.descripcion.toLowerCase().includes(query)
    );
  });

  materialSeleccionado = computed(() => {
    const id = this.materialSeleccionadoId();
    if (!id) return null;
    return this.todosLosMateriales().find(m => m.id_material === id) || null;
  });

  ngOnInit(): void {
    const path = this.router.url;
    this.isAlmacen.set(path.includes('GestionAlmacen'));
    
    // Obtener y formatear el usuario solicitante (Nombre Apellido1)
    const sesion = this.authService.getSesion();
    if (sesion) {
      const nombreCompleto = `${sesion.nombre} ${sesion.apellidos}`.trim();
      this.solicitadoPor.set(nombreCompleto);
    } else {
      this.solicitadoPor.set('Usuario Desconocido');
    }

    this.cargarCatalogos();
  }

  cargarCatalogos(): void {
    this.cargando.set(true);
    this.mensajeError.set(null);

    // Cargar todo en paralelo
    this.materialService.getMateriales().subscribe({
      next: (matsRes) => {
        if (matsRes.success) {
          this.todosLosMateriales.set(matsRes.data || []);
        }
        
        this.otService.getAll().subscribe({
          next: (otsRes) => {
            if (otsRes.success) {
              this.todasLasOts.set(otsRes.data || []);
            }

            this.valeService.getVales().subscribe({
              next: (valesRes) => {
                if (valesRes.success) {
                  this.valesExistentes.set(valesRes.data || []);
                }
                this.cargando.set(false);
              },
              error: () => {
                this.mensajeError.set('Error al cargar la lista de vales.');
                this.cargando.set(false);
              }
            });
          },
          error: () => {
            this.mensajeError.set('Error al cargar las Órdenes de Trabajo.');
            this.cargando.set(false);
          }
        });
      },
      error: () => {
        this.mensajeError.set('Error al cargar el catálogo de materiales.');
        this.cargando.set(false);
      }
    });
  }

  setTipoVale(tipo: 'OT' | 'LIBRE'): void {
    this.tipoVale.set(tipo);
    if (tipo === 'LIBRE') {
      this.otSeleccionadaId.set(null);
    }
  }

  seleccionarMaterial(id: number): void {
    this.materialSeleccionadoId.set(id);
    this.cantidadASeleccionar.set(1);
    this.busquedaMaterial.set(''); // Limpia busqueda para mostrar el seleccionado
  }

  agregarMaterial(): void {
    const mat = this.materialSeleccionado();
    if (!mat) {
      this.mensajeError.set('Seleccione un material válido.');
      return;
    }

    const cant = this.cantidadASeleccionar();
    if (cant <= 0) {
      this.mensajeError.set('La cantidad a solicitar debe ser mayor a 0.');
      return;
    }

    // Comprobar si ya existe en la lista
    const yaExiste = this.materialesSeleccionados().some(
      item => item.material.id_material === mat.id_material
    );

    if (yaExiste) {
      this.mensajeError.set('Este material ya ha sido agregado. Modifíquelo o elimínelo de la lista.');
      return;
    }

    this.mensajeError.set(null);
    this.materialesSeleccionados.update(list => [
      ...list,
      { material: mat, cantidad: cant }
    ]);

    // Resetear seleccion temporal
    this.materialSeleccionadoId.set(null);
    this.cantidadASeleccionar.set(1);
    this.busquedaMaterial.set('');
  }

  eliminarMaterial(idMaterial: number): void {
    this.materialesSeleccionados.update(list => 
      list.filter(item => item.material.id_material !== idMaterial)
    );
  }

  actualizarCantidadItem(idMaterial: number, nuevaCant: number): void {
    if (nuevaCant <= 0) return;
    this.materialesSeleccionados.update(list => 
      list.map(item => 
        item.material.id_material === idMaterial 
          ? { ...item, cantidad: nuevaCant } 
          : item
      )
    );
  }

  guardar(): void {
    this.mensajeError.set(null);
    this.mensajeExito.set(null);

    // Validar OT si es requerido
    if (this.tipoVale() === 'OT' && !this.otSeleccionadaId()) {
      this.mensajeError.set('Debe seleccionar una Orden de Trabajo.');
      return;
    }

    // Validar materiales
    if (this.materialesSeleccionados().length === 0) {
      this.mensajeError.set('Debe agregar al menos un material al vale.');
      return;
    }

    this.guardando.set(true);

    const request: ValeCreateRequest = {
      id_ot: this.otSeleccionadaId(),
      solicitado_por: this.solicitadoPor(),
      observaciones: this.observaciones() || null,
      materiales: this.materialesSeleccionados().map(item => ({
        id_material: item.material.id_material,
        cantidad_solicitada: item.cantidad
      }))
    };

    this.valeService.createVale(request).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.mensajeExito.set(`Vale ${res.data.cod_vale} creado con éxito.`);
          setTimeout(() => {
            this.cancelar();
          }, 1500);
        } else {
          this.mensajeError.set(res.message || 'Error al guardar el vale.');
          this.guardando.set(false);
        }
      },
      error: (err) => {
        this.mensajeError.set(err.error?.message || 'Error de conexión con el servidor.');
        this.guardando.set(false);
      }
    });
  }

  cancelar(): void {
    const parentPath = this.isAlmacen() ? 'GestionAlmacen' : 'GestionMantenimiento';
    this.router.navigate([`/${parentPath}/vale`]);
  }
}
