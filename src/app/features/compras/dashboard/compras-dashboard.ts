import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { forkJoin } from 'rxjs';

import { SolpedService }      from '../services/solped.service';
import { CotizacionService }  from '../services/cotizacion.service';
import { OrdenCompraService } from '../services/orden-compra.service';
import { ProveedorService }   from '../services/proveedor.service';
import { AuthService }        from '../../../core/services/auth.service';

import { SolicitudPedidoResponse } from '../models/solped';
import { CotizacionResponse }      from '../models/cotizacion';
import { OrdenCompraResponse }     from '../models/orden-compra';
import { ProveedorResponse }       from '../models/proveedor';

@Component({
  selector: 'app-compras-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './compras-dashboard.html',
  styleUrls: ['./compras-dashboard.css']
})
export class ComprasDashboardComponent implements OnInit {
  private solpedService      = inject(SolpedService);
  private cotizacionService  = inject(CotizacionService);
  private ordenCompraService = inject(OrdenCompraService);
  private proveedorService   = inject(ProveedorService);
  private authService        = inject(AuthService);
  private router             = inject(Router);

  // ── Usuario ───────────────────────────────────────────────────
  nombreUsuario = signal<string>('');

  // ── Loading / Error ───────────────────────────────────────────
  cargando = signal<boolean>(true);
  error    = signal<string | null>(null);

  // ── Raw data ──────────────────────────────────────────────────
  solicitudes  = signal<SolicitudPedidoResponse[]>([]);
  cotizaciones = signal<CotizacionResponse[]>([]);
  ordenes      = signal<OrdenCompraResponse[]>([]);
  proveedores  = signal<ProveedorResponse[]>([]);

  // ── KPIs principales ─────────────────────────────────────────
  totalSolicitudes  = computed(() => this.solicitudes().length);
  totalCotizaciones = computed(() => this.cotizaciones().length);
  totalOrdenes      = computed(() => this.ordenes().length);
  totalProveedores  = computed(() => this.proveedores().length);

  // Solicitudes Pendientes (Aprobación)
  solicitudesPendientes = computed(() => 
    this.solicitudes().filter(s => s.estado === 'PENDIENTE' || s.estado === 'CREADO').length
  );

  // Ordenes de Compra Pendientes / Aprobadas
  ordenesPendientes = computed(() => 
    this.ordenes().filter(o => o.estado === 'PENDIENTE' || o.estado === 'CREADO').length
  );
  
  ordenesAprobadas = computed(() => 
    this.ordenes().filter(o => o.estado === 'APROBADO' || o.estado === 'APROBADA').length
  );

  // Monto acumulado de órdenes aprobadas
  montoTotalAprobado = computed(() => 
    this.ordenes()
      .filter(o => o.estado === 'APROBADO' || o.estado === 'APROBADA')
      .reduce((acc, o) => acc + (o.total ?? 0), 0)
  );

  // ── Últimas órdenes de compra (top 5) ─────────────────────────
  ultimasOrdenes = computed(() => 
    [...this.ordenes()]
      .sort((a, b) => new Date(b.fecha_orden).getTime() - new Date(a.fecha_orden).getTime())
      .slice(0, 5)
  );

  // ── Últimas solicitudes de pedido (top 5) ──────────────────────
  ultimasSolicitudes = computed(() => 
    [...this.solicitudes()]
      .sort((a, b) => new Date(b.fecha_creacion).getTime() - new Date(a.fecha_creacion).getTime())
      .slice(0, 5)
  );

  // ── Distribución de proveedores por categoría ────────────────
  distribucionProveedores = computed(() => {
    const map = new Map<string, number>();
    for (const p of this.proveedores()) {
      const cats = p.categorias && p.categorias.length > 0 ? p.categorias : ['General'];
      for (const cat of cats) {
        map.set(cat, (map.get(cat) ?? 0) + 1);
      }
    }
    const total = this.proveedores().length || 1;
    return Array.from(map.entries())
      .map(([nombre, cantidad]) => ({
        nombre,
        cantidad,
        pct: Math.round((cantidad / total) * 100)
      }))
      .sort((a, b) => b.cantidad - a.cantidad)
      .slice(0, 5);
  });

  // ── Distribución de órdenes por estado ──────────────────────
  distribucionOrdenes = computed(() => {
    const map = new Map<string, number>();
    for (const o of this.ordenes()) {
      const est = o.estado || 'DESCONOCIDO';
      map.set(est, (map.get(est) ?? 0) + 1);
    }
    const total = this.ordenes().length || 1;
    return Array.from(map.entries())
      .map(([nombre, cantidad]) => ({
        nombre,
        cantidad,
        pct: Math.round((cantidad / total) * 100)
      }))
      .sort((a, b) => b.cantidad - a.cantidad);
  });

  // ── Colores de Gráficos ───────────────────────────────────────
  readonly colors = ['#f97316', '#3b82f6', '#10b981', '#8b5cf6', '#ef4444'];
  readonly statusColors = ['#f59e0b', '#10b981', '#ef4444', '#6b7280'];

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
      solicitudes:  this.solpedService.listar(),
      cotizaciones: this.cotizacionService.listar(),
      ordenes:      this.ordenCompraService.listar(),
      proveedores:  this.proveedorService.listar()
    }).subscribe({
      next: ({ solicitudes, cotizaciones, ordenes, proveedores }) => {
        this.solicitudes.set(solicitudes.data ?? []);
        this.cotizaciones.set(cotizaciones.data ?? []);
        this.ordenes.set(ordenes.data ?? []);
        this.proveedores.set(proveedores.data ?? []);
        this.cargando.set(false);
      },
      error: (err) => {
        console.error('Error al cargar datos de compras:', err);
        this.error.set('Error al cargar los datos del dashboard de compras. Verifica la conexión con el servidor.');
        this.cargando.set(false);
      }
    });
  }

  // ── Helpers ───────────────────────────────────────────────────
  getEstadoSolpedClass(estado: string): string {
    switch (estado?.toUpperCase()) {
      case 'PENDIENTE': return 'state-pending';
      case 'APROBADO':
      case 'APROBADA':  return 'state-approved';
      case 'RECHAZADO':
      case 'RECHAZADA': return 'state-rejected';
      case 'CREADO':    return 'state-created';
      default:          return 'state-unknown';
    }
  }

  getEstadoOrdenClass(estado: string): string {
    switch (estado?.toUpperCase()) {
      case 'PENDIENTE': return 'state-pending';
      case 'APROBADO':
      case 'APROBADA':  return 'state-approved';
      case 'RECHAZADO':
      case 'RECHAZADA': return 'state-rejected';
      case 'CREADO':    return 'state-created';
      default:          return 'state-unknown';
    }
  }

  formatFecha(fechaStr: string | Date | null | undefined): string {
    if (!fechaStr) return '—';
    return new Date(fechaStr).toLocaleDateString('es-PE', {
      day: '2-digit', month: 'short', year: 'numeric'
    });
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(value);
  }

  irA(ruta: string): void {
    this.router.navigate([ruta]);
  }
}
