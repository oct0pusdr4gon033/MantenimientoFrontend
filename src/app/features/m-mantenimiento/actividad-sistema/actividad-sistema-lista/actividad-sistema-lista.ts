import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ActividadSistemaService } from '../../services/actividad-sistema.service';
import { SistemaEquipoService } from '../../services/sistema-equipo.service';
import { ActividadSistemaResponse, ActividadSistemaRequest, ActividadSistemaUpdateRequest } from '../../models/actividad-sistema';
import { SistemaEquipoResponse } from '../../models/sistema-equipo';

type ModalMode = 'crear' | 'editar' | null;

@Component({
  selector: 'app-actividad-sistema-lista',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './actividad-sistema-lista.html',
  styleUrls: ['./actividad-sistema-lista.css']
})
export class ActividadSistemaListaComponent implements OnInit {
  private svcActividad = inject(ActividadSistemaService);
  private svcSistema = inject(SistemaEquipoService);

  // ── Estado principal ───────────────────────────────────────
  actividades = signal<ActividadSistemaResponse[]>([]);
  sistemas = signal<SistemaEquipoResponse[]>([]);
  cargando = signal(false);
  modalMode = signal<ModalMode>(null);
  guardando = signal(false);

  // ── Filtros ────────────────────────────────────────────────
  filtroBusqueda = signal('');

  // ── Filtrado reactivo (Client-side o se puede usar el API) ─
  actividadesFiltradas = computed(() => {
    const q = this.filtroBusqueda().toLowerCase().trim();
    if (!q) return this.actividades();
    
    // Si queremos buscar también por el nombre del sistema, podríamos mapearlo
    // Pero como la API ya nos devuelve los datos, filtramos por código y nombre de la actividad
    return this.actividades().filter(a =>
      (a.nombre_actividad && a.nombre_actividad.toLowerCase().includes(q)) ||
      (a.cod_act && a.cod_act.toLowerCase().includes(q))
    );
  });

  // ── Formulario ─────────────────────────────────────────────
  form: ActividadSistemaRequest = this.getDefaultForm();
  idOriginal: number = 0;           // guarda el ID antes de editar
  mensajeError = '';
  mensajeExito = '';

  ngOnInit(): void {
    this.cargarSistemas(); // Necesitamos la lista de sistemas para el select
    this.cargarActividades();
  }

  // ── CRUD ──────────────────────────────────────────────────

  cargarSistemas(): void {
    this.svcSistema.getSistemas().subscribe({
      next: (res) => {
        this.sistemas.set(res.data ?? []);
      },
      error: () => {
        this.mostrarError('No se pudo cargar la lista de sistemas.');
      }
    });
  }

  cargarActividades(): void {
    this.cargando.set(true);
    this.svcActividad.getActividades().subscribe({
      next: (res) => {
        this.actividades.set(res.data ?? []);
        this.cargando.set(false);
      },
      error: () => {
        this.mostrarError('No se pudo cargar la lista de actividades.');
        this.cargando.set(false);
      }
    });
  }

  buscarConApi(): void {
    const q = this.filtroBusqueda().trim();
    if (!q) {
        this.cargarActividades();
        return;
    }
    this.cargando.set(true);
    this.svcActividad.buscarActividades(q).subscribe({
      next: (res) => {
        this.actividades.set(res.data ?? []);
        this.cargando.set(false);
      },
      error: () => {
        this.mostrarError('Error al buscar actividades.');
        this.cargando.set(false);
      }
    });
  }

  guardar(): void {
    if (!this.form.id_sistema || !this.form.nombre_actividad.trim() || !this.form.medida_duracion) {
      this.mensajeError = 'El sistema, nombre y la medida de duración son obligatorios.';
      return;
    }
    if (this.form.duracion <= 0) {
      this.mensajeError = 'La duración debe ser mayor a cero.';
      return;
    }

    this.guardando.set(true);
    this.mensajeError = '';

    const operacion = this.modalMode() === 'crear'
      ? this.svcActividad.createActividad(this.form)
      : this.svcActividad.updateActividad(this.idOriginal, {
          nombre_actividad: this.form.nombre_actividad,
          descripcion: this.form.descripcion,
          duracion: this.form.duracion,
          medida_duracion: this.form.medida_duracion,
          estado: this.form.estado
        });

    operacion.subscribe({
      next: (res) => {
        this.guardando.set(false);
        if (res.success) {
          this.mostrarExito(this.modalMode() === 'crear' ? 'Actividad creada correctamente.' : 'Actividad actualizada correctamente.');
          this.cerrarModal();
          // Recargamos la lista usando el estado actual de búsqueda si aplica
          if (this.filtroBusqueda().trim()) {
            this.buscarConApi();
          } else {
            this.cargarActividades();
          }
        } else {
          this.mensajeError = res.message || 'Error al guardar.';
        }
      },
      error: (err) => {
        this.guardando.set(false);
        this.mensajeError = err?.error?.message || 'Error de conexión.';
      }
    });
  }

  // ── Modal ──────────────────────────────────────────────────

  abrirCrear(): void {
    this.form = this.getDefaultForm();
    this.idOriginal = 0;
    this.mensajeError = '';
    this.modalMode.set('crear');
  }

  abrirEditar(actividad: ActividadSistemaResponse): void {
    this.form = {
      id_sistema: actividad.id_sistema,
      nombre_actividad: actividad.nombre_actividad,
      descripcion: actividad.descripcion,
      duracion: actividad.duracion,
      medida_duracion: actividad.medida_duracion,
      estado: actividad.estado
    };
    this.idOriginal = actividad.id_actividad;
    this.mensajeError = '';
    this.modalMode.set('editar');
  }

  cerrarModal(): void {
    this.modalMode.set(null);
    this.mensajeError = '';
  }

  // ── Utilidades ─────────────────────────────────────────────

  private getDefaultForm(): ActividadSistemaRequest {
    return {
      id_sistema: 0,
      nombre_actividad: '',
      descripcion: '',
      duracion: 1,
      medida_duracion: 'MIN',
      estado: true
    };
  }

  getNombreSistema(id_sistema: number): string {
    const sist = this.sistemas().find(s => s.id_sistema === id_sistema);
    return sist ? sist.nombre_sist : 'Desconocido';
  }

  // ── Filtro ─────────────────────────────────────────────────

  onFiltroChange(valor: string): void {
    this.filtroBusqueda.set(valor);
  }

  limpiarFiltro(): void {
    this.filtroBusqueda.set('');
    this.cargarActividades();
  }

  // ── Notificaciones ─────────────────────────────────────────

  private mostrarError(msg: string): void {
    this.mensajeExito = '';
    this.mensajeError = msg;
    setTimeout(() => this.mensajeError = '', 4000);
  }

  private mostrarExito(msg: string): void {
    this.mensajeError = '';
    this.mensajeExito = msg;
    setTimeout(() => this.mensajeExito = '', 3000);
  }
}
