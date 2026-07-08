import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { PlanMantenimientoService } from '../../services/plan-mantenimiento.service';
import { EstrategiaService } from '../../services/estrategia.service';
import { PlanMantenimientoResponse } from '../../models/plan-mantenimiento';
import { EstrategiaResponse } from '../../models/EstrategiaResponse';

@Component({
  selector: 'app-plan-mantenimiento-lista',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './plan-mantenimiento-lista.html',
  styleUrls: ['./plan-mantenimiento-lista.css']
})
export class PlanMantenimientoListaComponent implements OnInit {
  private svc = inject(PlanMantenimientoService);
  private estSvc = inject(EstrategiaService);
  private router = inject(Router);

  // ── Estado ────────────────────────────────────────────────
  planes = signal<PlanMantenimientoResponse[]>([]);
  estrategias = signal<EstrategiaResponse[]>([]);
  cargando = signal(false);

  // ── Filtros ───────────────────────────────────────────────
  filtroBusqueda = signal('');
  estadoFiltro = signal<'TODOS' | 'ACTIVO' | 'INACTIVO'>('TODOS');

  // ── Modal de Confirmación de Borrado ──────────────────────
  planParaEliminar = signal<PlanMantenimientoResponse | null>(null);
  eliminando = signal(false);

  // Notificaciones
  mensajeExito = signal('');
  mensajeError = signal('');

  // ── Filtrado reactivo ──────────────────────────────────────
  planesFiltrados = computed(() => {
    let list = this.planes();

    // Filtro por Estado
    const est = this.estadoFiltro();
    if (est !== 'TODOS') {
      const activeBool = est === 'ACTIVO';
      list = list.filter(p => p.estado === activeBool);
    }

    // Filtro por Texto de Búsqueda
    const q = this.filtroBusqueda().toLowerCase().trim();
    if (q) {
      list = list.filter(p => {
        // Encontrar info de la estrategia
        const infoEst = this.getEstrategiaTexto(p.id_estrategia).toLowerCase();
        const dateStr = this.formatearFecha(p.fecha_creacion).toLowerCase();
        return infoEst.includes(q) || dateStr.includes(q) || p.id_plan_mant.toString() === q;
      });
    }

    return list;
  });

  ngOnInit(): void {
    this.cargarDatos();
  }

  cargarDatos(): void {
    this.cargando.set(true);

    // Primero cargamos las estrategias para el mapeo
    this.estSvc.listar().subscribe({
      next: (estData: any) => {
        const list = Array.isArray(estData) ? estData : (estData?.data ?? []);
        this.estrategias.set(list);

        // Luego cargamos los planes
        this.svc.getAll().subscribe({
          next: (res) => {
            this.planes.set(res.data ?? []);
            this.cargando.set(false);
          },
          error: (err) => {
            this.mostrarError('No se pudo cargar la lista de planes de mantenimiento.');
            this.cargando.set(false);
          }
        });
      },
      error: () => {
        this.mostrarError('No se pudo cargar la lista de estrategias.');
        this.cargando.set(false);
      }
    });
  }

  // ── Ayudantes de Mapeo ─────────────────────────────────────
  getEstrategiaTexto(idDetalle: number): string {
    const listEst = this.estrategias();
    for (const est of listEst) {
      const det = est.detalles?.find(d => d.id_detalle_estrg === idDetalle);
      if (det) {
        return `${est.cod_estrategia} - ${est.titulo_estrategia}`;
      }
    }
    return `Detalle #${idDetalle}`;
  }

  getUmbralTexto(idDetalle: number): string {
    const listEst = this.estrategias();
    for (const est of listEst) {
      const det = est.detalles?.find(d => d.id_detalle_estrg === idDetalle);
      if (det) {
        return `${det.umbral_mant} ${det.uni_med} (${det.tipo_pm})`;
      }
    }
    return `-`;
  }

  obtenerPmsIncluidos(plan: PlanMantenimientoResponse): string {
    if (!plan || !plan.actividades || plan.actividades.length === 0) {
      return '-';
    }
    const pms = plan.actividades
      .map(a => a.tipo_pm)
      .filter((value, index, self) => value && self.indexOf(value) === index);
    
    return pms.length > 0 ? pms.join(', ') : '-';
  }

  formatearFecha(fecha: string | Date): string {
    if (!fecha) return '-';
    const date = new Date(fecha);
    return date.toLocaleDateString('es-PE', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  // ── Acciones CRUD ──────────────────────────────────────────
  abrirCrear(): void {
    this.router.navigate(['/GestionMantenimiento/plan-mantenimiento/crear']);
  }

  abrirEditar(id: number): void {
    this.router.navigate([`/GestionMantenimiento/plan-mantenimiento/editar/${id}`]);
  }

  abrirDetalle(id: number): void {
    this.router.navigate([`/GestionMantenimiento/plan-mantenimiento/detalle/${id}`]);
  }

  solicitarEliminacion(plan: PlanMantenimientoResponse): void {
    this.planParaEliminar.set(plan);
  }

  cerrarConfirmacion(): void {
    this.planParaEliminar.set(null);
  }

  confirmarEliminar(): void {
    const plan = this.planParaEliminar();
    if (!plan) return;

    this.eliminando.set(true);
    this.svc.delete(plan.id_plan_mant).subscribe({
      next: (res) => {
        this.eliminando.set(false);
        this.cerrarConfirmacion();
        if (res.success) {
          this.mostrarExito('Plan de mantenimiento eliminado correctamente.');
          this.cargarDatos();
        } else {
          this.mostrarError(res.message || 'No se pudo eliminar el plan.');
        }
      },
      error: (err) => {
        this.eliminando.set(false);
        this.cerrarConfirmacion();
        this.mostrarError(err?.error?.message || 'Error de conexión.');
      }
    });
  }

  // ── Filtros ────────────────────────────────────────────────
  onFiltroChange(valor: string): void {
    this.filtroBusqueda.set(valor);
  }

  onEstadoFiltroChange(event: any): void {
    this.estadoFiltro.set(event.target.value);
  }

  limpiarFiltro(): void {
    this.filtroBusqueda.set('');
    this.estadoFiltro.set('TODOS');
  }

  // ── Notificaciones ─────────────────────────────────────────
  private mostrarError(msg: string): void {
    this.mensajeExito.set('');
    this.mensajeError.set(msg);
    setTimeout(() => this.mensajeError.set(''), 4000);
  }

  private mostrarExito(msg: string): void {
    this.mensajeError.set('');
    this.mensajeExito.set(msg);
    setTimeout(() => this.mensajeExito.set(''), 3000);
  }
}
