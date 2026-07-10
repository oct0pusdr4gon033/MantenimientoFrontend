import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { forkJoin } from 'rxjs';

import { EquipoService }            from '../services/Equipo.service';
import { FlotaService }             from '../services/Flota.service';
import { HistorialHorometroService } from '../services/HistorialHorometro.service';
import { AuthService }              from '../../../core/services/auth.service';

import { EquipoResponse }            from '../models/EquipoResponse';
import { FlotaResponse }             from '../models/FlotaResponse';
import { HistorialHorometroResponse } from '../models/HistorialHorometroResponse';

@Component({
  selector: 'app-flota-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './flota-dashboard.html',
  styleUrls: ['./flota-dashboard.css']
})
export class FlotaDashboardComponent implements OnInit {
  private equipoService   = inject(EquipoService);
  private flotaService    = inject(FlotaService);
  private horometroService = inject(HistorialHorometroService);
  private authService     = inject(AuthService);
  private router          = inject(Router);

  // ── Usuario ───────────────────────────────────────────────────
  nombreUsuario = signal<string>('');

  // ── Loading / Error ───────────────────────────────────────────
  cargando = signal<boolean>(true);
  error    = signal<string | null>(null);

  // ── Raw data ──────────────────────────────────────────────────
  equipos    = signal<EquipoResponse[]>([]);
  flotas     = signal<FlotaResponse[]>([]);
  horometros = signal<HistorialHorometroResponse[]>([]);

  // ── KPIs Equipos ─────────────────────────────────────────────
  totalEquipos      = computed(() => this.equipos().length);
  equiposOperativos = computed(() => this.equipos().filter(e => e.estadoOperativo === 'OPERATIVO').length);
  equiposMantenimiento = computed(() => this.equipos().filter(e => e.estadoOperativo === 'MANTENIMIENTO').length);
  equiposInactivos  = computed(() => this.equipos().filter(e => e.estadoOperativo === 'INACTIVO').length);
  totalFlotas       = computed(() => this.flotas().length);

  // ── Horometro total (horas acumuladas) ───────────────────────
  totalHorasOperadas = computed(() =>
    this.horometros().reduce((acc, h) => acc + (h.horas_operadas ?? 0), 0)
  );

  // ── Últimos registros de horómetro ────────────────────────────
  ultimosHorometros = computed(() =>
    [...this.horometros()]
      .sort((a, b) => new Date(b.fecha_registro).getTime() - new Date(a.fecha_registro).getTime())
      .slice(0, 6)
  );

  // ── Equipos en alerta (mantenimiento / inactivos) ─────────────
  equiposAlerta = computed(() =>
    this.equipos()
      .filter(e => e.estadoOperativo === 'MANTENIMIENTO' || e.estadoOperativo === 'INACTIVO')
      .slice(0, 6)
  );

  // ── Distribución por flota ────────────────────────────────────
  distribucionFlotas = computed(() => {
    const map = new Map<string, number>();
    for (const e of this.equipos()) {
      const flota = e.nombreFlota || 'Sin flota';
      map.set(flota, (map.get(flota) ?? 0) + 1);
    }
    const total = this.equipos().length || 1;
    return Array.from(map.entries())
      .map(([nombre, cantidad]) => ({
        nombre,
        cantidad,
        pct: Math.round((cantidad / total) * 100)
      }))
      .sort((a, b) => b.cantidad - a.cantidad)
      .slice(0, 5);
  });

  // ── Distribución por tipo de equipo ──────────────────────────
  distribucionTipos = computed(() => {
    const map = new Map<string, number>();
    for (const e of this.equipos()) {
      const tipo = e.nombreTipo || 'Sin tipo';
      map.set(tipo, (map.get(tipo) ?? 0) + 1);
    }
    const total = this.equipos().length || 1;
    return Array.from(map.entries())
      .map(([nombre, cantidad]) => ({
        nombre,
        cantidad,
        pct: Math.round((cantidad / total) * 100)
      }))
      .sort((a, b) => b.cantidad - a.cantidad)
      .slice(0, 5);
  });

  // ── Colores de gráfico ────────────────────────────────────────
  readonly chartColors = ['#6366f1', '#3b82f6', '#10b981', '#f59e0b', '#ef4444'];
  readonly tipoColors  = ['#8b5cf6', '#06b6d4', '#f97316', '#ec4899', '#84cc16'];

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
      equipos:    this.equipoService.listar(),
      flotas:     this.flotaService.listar(),
      horometros: this.horometroService.obtenerTodos()
    }).subscribe({
      next: ({ equipos, flotas, horometros }) => {
        this.equipos.set(equipos.data ?? []);
        this.flotas.set(flotas.data ?? []);
        this.horometros.set(horometros.data ?? []);
        this.cargando.set(false);
      },
      error: () => {
        this.error.set('Error al cargar los datos del dashboard. Verifica la conexión con el servidor.');
        this.cargando.set(false);
      }
    });
  }

  // ── Helpers ───────────────────────────────────────────────────
  getEstadoClass(estado: string): string {
    switch (estado) {
      case 'OPERATIVO':     return 'badge-operativo';
      case 'MANTENIMIENTO': return 'badge-mantenimiento';
      case 'INACTIVO':      return 'badge-inactivo';
      default:              return '';
    }
  }

  getEstadoIcon(estado: string): string {
    switch (estado) {
      case 'OPERATIVO':     return 'check_circle';
      case 'MANTENIMIENTO': return 'build';
      case 'INACTIVO':      return 'cancel';
      default:              return 'help';
    }
  }

  formatFecha(fechaStr: string | null | undefined): string {
    if (!fechaStr) return '—';
    return new Date(fechaStr).toLocaleDateString('es-PE', {
      day: '2-digit', month: 'short', year: 'numeric'
    });
  }

  formatHoras(horas: number): string {
    return horas.toLocaleString('es-PE') + ' h';
  }

  porcentajeOperativos(): number {
    if (!this.totalEquipos()) return 0;
    return Math.round((this.equiposOperativos() / this.totalEquipos()) * 100);
  }

  irA(ruta: string): void {
    this.router.navigate([ruta]);
  }
}
