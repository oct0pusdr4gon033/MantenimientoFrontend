import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { forkJoin } from 'rxjs';

import { EmpleadoService }           from '../empleados/services/Empleado.service';
import { RolService }                from '../empleados/services/Rol.service';
import { ExpedienteEmpleadoService } from '../empleados/services/expediente-empleado.service';
import { AuthService }               from '../../../core/services/auth.service';

import { EmpleadoResponse }               from '../empleados/models/EmpleadoResponse';
import { RolResponse }                    from '../empleados/models/RolResponse';
import { ExpedienteEmpleadoResponse,
         ExpedienteDocumentoEmpleadoResponse } from '../empleados/models/ExpedienteEmpleadoModels';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './admin-dashboard.html',
  styleUrls: ['./admin-dashboard.css']
})
export class AdminDashboardComponent implements OnInit {
  private empleadoService   = inject(EmpleadoService);
  private rolService        = inject(RolService);
  private expedienteService = inject(ExpedienteEmpleadoService);
  private authService       = inject(AuthService);
  private router            = inject(Router);

  // ── Usuario ───────────────────────────────────────────────────
  nombreUsuario = signal<string>('');

  // ── Loading / Error ───────────────────────────────────────────
  cargando = signal<boolean>(true);
  error    = signal<string | null>(null);

  // ── Raw data ──────────────────────────────────────────────────
  empleados   = signal<EmpleadoResponse[]>([]);
  roles       = signal<RolResponse[]>([]);
  expedientes = signal<ExpedienteEmpleadoResponse[]>([]);

  // ── KPIs principales ─────────────────────────────────────────
  totalEmpleados   = computed(() => this.empleados().length);
  empleadosActivos = computed(() => this.empleados().filter(e => e.estado).length);
  empleadosInactivos = computed(() => this.empleados().filter(e => !e.estado).length);
  totalRoles       = computed(() => this.roles().length);
  totalExpedientes = computed(() => this.expedientes().length);

  // ── Documentos vencidos y próximos a vencer ───────────────────
  todosLosDocumentos = computed<ExpedienteDocumentoEmpleadoResponse[]>(() =>
    this.expedientes().flatMap(exp => exp.documentos ?? [])
  );

  docsVencidos = computed(() =>
    this.todosLosDocumentos().filter(d => d.estaVencido).length
  );

  docsProximosVencer = computed(() => {
    const hoy     = new Date();
    const en30    = new Date();
    en30.setDate(hoy.getDate() + 30);
    return this.todosLosDocumentos().filter(d => {
      if (!d.fechaVencimiento || d.estaVencido) return false;
      const fv = new Date(d.fechaVencimiento);
      return fv >= hoy && fv <= en30;
    }).length;
  });

  // ── Alertas: documentos vencidos (top 6) ──────────────────────
  alertasVencidos = computed(() =>
    this.todosLosDocumentos()
      .filter(d => d.estaVencido)
      .slice(0, 6)
  );

  // ── Alertas: próximos a vencer (top 6) ────────────────────────
  alertasProximos = computed(() => {
    const hoy  = new Date();
    const en30 = new Date();
    en30.setDate(hoy.getDate() + 30);
    return this.todosLosDocumentos()
      .filter(d => {
        if (!d.fechaVencimiento || d.estaVencido) return false;
        const fv = new Date(d.fechaVencimiento);
        return fv >= hoy && fv <= en30;
      })
      .sort((a, b) =>
        new Date(a.fechaVencimiento!).getTime() - new Date(b.fechaVencimiento!).getTime()
      )
      .slice(0, 6);
  });

  // ── Distribución por rol ──────────────────────────────────────
  distribucionRoles = computed(() => {
    const map = new Map<string, number>();
    for (const e of this.empleados()) {
      const rol = e.nombreRol || 'Sin rol';
      map.set(rol, (map.get(rol) ?? 0) + 1);
    }
    const total = this.empleados().length || 1;
    return Array.from(map.entries())
      .map(([nombre, cantidad]) => ({
        nombre,
        cantidad,
        pct: Math.round((cantidad / total) * 100)
      }))
      .sort((a, b) => b.cantidad - a.cantidad);
  });

  // ── Últimos empleados registrados ─────────────────────────────
  ultimosEmpleados = computed(() =>
    [...this.empleados()].slice(0, 6)
  );

  // ── Colores ───────────────────────────────────────────────────
  readonly rolColors = ['#0ea5e9', '#6366f1', '#10b981', '#f59e0b', '#ec4899', '#f97316'];

  ngOnInit(): void {
    const sesion = this.authService.getSesion();
    if (sesion) this.nombreUsuario.set(`${sesion.nombre} ${sesion.apellidos}`);
    this.cargarDatos();
  }

  cargarDatos(): void {
    this.cargando.set(true);
    this.error.set(null);

    forkJoin({
      empleados:   this.empleadoService.listar(),
      roles:       this.rolService.listar(),
      expedientes: this.expedienteService.obtenerTodos()
    }).subscribe({
      next: ({ empleados, roles, expedientes }) => {
        this.empleados.set(empleados.data ?? []);
        this.roles.set(roles.data ?? []);
        // ExpedienteEmpleadoService.obtenerTodos() devuelve el array directo
        this.expedientes.set(Array.isArray(expedientes) ? expedientes : []);
        this.cargando.set(false);
      },
      error: () => {
        this.error.set('Error al cargar los datos del dashboard. Verifica la conexión con el servidor.');
        this.cargando.set(false);
      }
    });
  }

  // ── Helpers ───────────────────────────────────────────────────
  getNombreCompleto(e: EmpleadoResponse): string {
    return `${e.nombre} ${e.apellido1} ${e.apellido2 ?? ''}`.trim();
  }

  diasParaVencer(fechaStr: string | null | undefined): number {
    if (!fechaStr) return 0;
    const diff = new Date(fechaStr).getTime() - new Date().getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }

  formatFecha(fechaStr: string | null | undefined): string {
    if (!fechaStr) return '—';
    return new Date(fechaStr).toLocaleDateString('es-PE', {
      day: '2-digit', month: 'short', year: 'numeric'
    });
  }

  porcentajeActivos(): number {
    if (!this.totalEmpleados()) return 0;
    return Math.round((this.empleadosActivos() / this.totalEmpleados()) * 100);
  }

  irA(ruta: string): void {
    this.router.navigate([ruta]);
  }
}
