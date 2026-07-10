import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { forkJoin } from 'rxjs';

import { OrdenTrabajoService }   from '../services/orden-trabajo.service';
import { PlanMantenimientoService } from '../services/plan-mantenimiento.service';
import { AuthService }             from '../../../core/services/auth.service';

import { OrdenTrabajoResponse }   from '../models/orden-trabajo';
import { PlanMantenimientoResponse } from '../models/plan-mantenimiento';

@Component({
  selector: 'app-mantenimiento-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './mantenimiento-dashboard.html',
  styleUrls: ['./mantenimiento-dashboard.css']
})
export class MantenimientoDashboardComponent implements OnInit {
  private otService    = inject(OrdenTrabajoService);
  private planService  = inject(PlanMantenimientoService);
  private authService  = inject(AuthService);
  private router       = inject(Router);

  // ── Usuario ───────────────────────────────────────────────────
  nombreUsuario = signal<string>('');

  // ── Loading / Error ───────────────────────────────────────────
  cargando = signal<boolean>(true);
  error    = signal<string | null>(null);

  // ── Raw data ──────────────────────────────────────────────────
  ordenes = signal<OrdenTrabajoResponse[]>([]);
  planes  = signal<PlanMantenimientoResponse[]>([]);

  // ── KPIs principales ─────────────────────────────────────────
  totalOrdenes      = computed(() => this.ordenes().length);
  ordenesPendientes = computed(() => this.ordenes().filter(o => o.estado === 'PENDIENTE').length);
  ordenesActivas    = computed(() => this.ordenes().filter(o => o.estado === 'ACTIVA').length);
  ordenesRevision   = computed(() => this.ordenes().filter(o => o.estado === 'EN_REVISION').length);
  ordenesCerradas   = computed(() => this.ordenes().filter(o => o.estado === 'CERRADA').length);
  
  totalPlanes       = computed(() => this.planes().length);
  planesActivos     = computed(() => this.planes().filter(p => p.estado).length);

  // ── Distribución por tipo de OT ──────────────────────────────
  otsPreventivas = computed(() => this.ordenes().filter(o => o.tipo_ot === 'PREVENTIVA').length);
  otsCorrectivas = computed(() => this.ordenes().filter(o => o.tipo_ot === 'CORRECTIVA').length);
  
  pctPreventivas = computed(() => {
    const total = this.totalOrdenes() || 1;
    return Math.round((this.otsPreventivas() / total) * 100);
  });
  
  pctCorrectivas = computed(() => {
    const total = this.totalOrdenes() || 1;
    return Math.round((this.otsCorrectivas() / total) * 100);
  });

  // ── OTs Críticas (Pendientes o Activas del tipo CORRECTIVA, top 5)
  otsCriticas = computed(() => 
    this.ordenes()
      .filter(o => o.tipo_ot === 'CORRECTIVA' && (o.estado === 'PENDIENTE' || o.estado === 'ACTIVA'))
      .sort((a, b) => new Date(b.fecha_creacion).getTime() - new Date(a.fecha_creacion).getTime())
      .slice(0, 5)
  );

  // ── Últimas OTs registradas (top 6) ───────────────────────────
  ultimasOTs = computed(() => 
    [...this.ordenes()]
      .sort((a, b) => new Date(b.fecha_creacion).getTime() - new Date(a.fecha_creacion).getTime())
      .slice(0, 6)
  );

  // ── Distribución por Flota de equipos de las OTs ─────────────
  distribucionFlotas = computed(() => {
    const map = new Map<string, number>();
    for (const o of this.ordenes()) {
      const flota = o.nombre_flota || 'Sin Flota';
      map.set(flota, (map.get(flota) ?? 0) + 1);
    }
    const total = this.ordenes().length || 1;
    return Array.from(map.entries())
      .map(([nombre, cantidad]) => ({
        nombre,
        cantidad,
        pct: Math.round((cantidad / total) * 100)
      }))
      .sort((a, b) => b.cantidad - a.cantidad)
      .slice(0, 5);
  });

  // ── Colores de Gráficos ───────────────────────────────────────
  readonly statusColors = ['#f59e0b', '#3b82f6', '#8b5cf6', '#10b981', '#ef4444'];
  readonly colors       = ['#e11d48', '#f43f5e', '#fb7185', '#fda4af', '#ffe4e6'];

  ngOnInit(): void {
    const sesion = this.authService.getSesion();
    if (sesion) {
      this.nombreUsuario.set(`${sesion.nombre} ${sesion.apellidos}`);
    }
    this.cargarDatos();
  }

  cargarDatos(): void {
    this.cargando.set(true);
    this.error.set(null);

    forkJoin({
      ordenes: this.otService.getAll(),
      planes:  this.planService.getAll()
    }).subscribe({
      next: ({ ordenes, planes }) => {
        this.ordenes.set(ordenes.data ?? []);
        this.planes.set(planes.data ?? []);
        this.cargando.set(false);
      },
      error: (err) => {
        console.error('Error al cargar datos de mantenimiento:', err);
        this.error.set('Error al cargar los datos del dashboard de mantenimiento. Verifica la conexión con el servidor.');
        this.cargando.set(false);
      }
    });
  }

  // ── Helpers ───────────────────────────────────────────────────
  getEstadoOTClass(estado: string): string {
    switch (estado?.toUpperCase()) {
      case 'PENDIENTE':   return 'state-pending';
      case 'ACTIVA':      return 'state-active';
      case 'EN_REVISION': return 'state-review';
      case 'CERRADA':     return 'state-closed';
      case 'INACTIVA':    return 'state-inactive';
      default:            return 'state-unknown';
    }
  }

  formatFecha(fechaStr: string | null | undefined): string {
    if (!fechaStr) return '—';
    return new Date(fechaStr).toLocaleDateString('es-PE', {
      day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  }

  porcentajeCompletado(): number {
    if (!this.totalOrdenes()) return 0;
    return Math.round((this.ordenesCerradas() / this.totalOrdenes()) * 100);
  }

  irA(ruta: string): void {
    this.router.navigate([ruta]);
  }
}
