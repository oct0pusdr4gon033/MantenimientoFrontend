import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { forkJoin } from 'rxjs';
import { MaterialService } from '../services/material.service';
import { ValeService } from '../services/vale.service';
import { AuthService } from '../../../core/services/auth.service';
import { MaterialResponse } from '../models/material';
import { ValeResponse } from '../models/vale';

@Component({
  selector: 'app-almacen-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './almacen-dashboard.html',
  styleUrls: ['./almacen-dashboard.css']
})
export class AlmacenDashboardComponent implements OnInit {
  private materialService = inject(MaterialService);
  private valeService     = inject(ValeService);
  private authService     = inject(AuthService);
  private router          = inject(Router);

  // ── User ──────────────────────────────────────────────────────
  nombreUsuario = signal<string>('');

  // ── Loading / Error ───────────────────────────────────────────
  cargando  = signal<boolean>(true);
  error     = signal<string | null>(null);

  // ── Raw data ──────────────────────────────────────────────────
  materiales    = signal<MaterialResponse[]>([]);
  valesPend     = signal<ValeResponse[]>([]);
  valesDesp     = signal<ValeResponse[]>([]);

  // ── KPIs ─────────────────────────────────────────────────────
  totalMateriales = computed(() => this.materiales().length);
  totalStock      = computed(() => this.materiales().reduce((acc, m) => acc + (m.stock ?? 0), 0));
  materialesAgotados = computed(() => this.materiales().filter(m => m.estado === 'AGOTADO' || m.stock === 0).length);
  materialesMinimo   = computed(() => this.materiales().filter(m => m.estado === 'MINIMO').length);
  valesPendientes    = computed(() => this.valesPend().length);
  valesDespachados   = computed(() => this.valesDesp().length);

  // ── Alertas de stock crítico ──────────────────────────────────
  alertasMateriales = computed(() =>
    this.materiales()
      .filter(m => m.estado === 'AGOTADO' || m.estado === 'MINIMO' || m.stock === 0)
      .slice(0, 6)
  );

  // ── Últimos vales pendientes ──────────────────────────────────
  ultimosValesPend = computed(() => this.valesPend().slice(0, 5));

  // ── Últimos vales despachados ─────────────────────────────────
  ultimosValesDesp = computed(() => this.valesDesp().slice(0, 5));

  // ── Distribución por categoría ────────────────────────────────
  distribucionCategorias = computed(() => {
    const map = new Map<string, number>();
    for (const m of this.materiales()) {
      const cat = m.nombre_categoria || 'Sin categoría';
      map.set(cat, (map.get(cat) ?? 0) + 1);
    }
    const total = this.materiales().length || 1;
    return Array.from(map.entries())
      .map(([nombre, cantidad]) => ({
        nombre,
        cantidad,
        pct: Math.round((cantidad / total) * 100)
      }))
      .sort((a, b) => b.cantidad - a.cantidad)
      .slice(0, 5);
  });

  // ── Categoría colors ──────────────────────────────────────────
  readonly catColors = ['#10b981','#3b82f6','#f59e0b','#8b5cf6','#ef4444'];

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
      materiales: this.materialService.getMateriales(),
      pendientes: this.valeService.getVales('PENDIENTE'),
      despachados: this.valeService.getVales('DESPACHADO')
    }).subscribe({
      next: ({ materiales, pendientes, despachados }) => {
        this.materiales.set(materiales.data ?? []);
        this.valesPend.set(pendientes.data ?? []);
        this.valesDesp.set(despachados.data ?? []);
        this.cargando.set(false);
      },
      error: (err) => {
        this.error.set('Error al cargar los datos del dashboard. Verifica la conexión con el servidor.');
        this.cargando.set(false);
      }
    });
  }

  // ── Helpers ───────────────────────────────────────────────────
  getStockAlertClass(material: MaterialResponse): string {
    if (material.estado === 'AGOTADO' || material.stock === 0) return 'alert-danger';
    if (material.estado === 'MINIMO') return 'alert-warning';
    return '';
  }

  getStockAlertIcon(material: MaterialResponse): string {
    if (material.estado === 'AGOTADO' || material.stock === 0) return 'remove_shopping_cart';
    if (material.estado === 'MINIMO') return 'warning';
    return 'info';
  }

  formatFecha(fechaStr: string | null | undefined): string {
    if (!fechaStr) return '—';
    return new Date(fechaStr).toLocaleDateString('es-PE', {
      day: '2-digit', month: 'short', year: 'numeric'
    });
  }

  irA(ruta: string): void {
    this.router.navigate([ruta]);
  }
}
