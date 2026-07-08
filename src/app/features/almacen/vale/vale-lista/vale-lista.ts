import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ValeService } from '../../services/vale.service';
import { ValeResponse } from '../../models/vale';

@Component({
  selector: 'app-vale-lista',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './vale-lista.html',
  styleUrls: ['./vale-lista.css']
})
export class ValeListaComponent implements OnInit {
  private valeService = inject(ValeService);
  private router = inject(Router);
  private activatedRoute = inject(ActivatedRoute);

  // States
  vales = signal<ValeResponse[]>([]);
  cargando = signal<boolean>(false);
  mensajeError = signal<string | null>(null);

  // Filters
  tabActivo = signal<'PENDIENTE' | 'DESPACHADO'>('PENDIENTE');
  filtroFechaInicio = signal<string>('');
  filtroFechaFin = signal<string>('');
  filtroBusqueda = signal<string>('');

  isAlmacen = signal<boolean>(true); // Determina si estamos en el módulo de Almacén o Mantenimiento

  ngOnInit(): void {
    // Detectar en qué módulo estamos para ajustar textos/vistas
    const path = this.router.url;
    this.isAlmacen.set(path.includes('GestionAlmacen'));
    this.cargarVales();
  }

  cargarVales(): void {
    this.cargando.set(true);
    this.mensajeError.set(null);

    // Si queremos filtrar por estado en la API:
    // Pero es mejor traerlos todos y filtrar localmente o hacer query a la API pasándole los filtros.
    this.valeService.getVales(
      this.tabActivo(),
      this.filtroFechaInicio() || undefined,
      this.filtroFechaFin() || undefined,
      this.filtroBusqueda() || undefined
    ).subscribe({
      next: (res) => {
        if (res.success) {
          this.vales.set(res.data || []);
        } else {
          this.mensajeError.set(res.message || 'Error al cargar los vales');
        }
        this.cargando.set(false);
      },
      error: (err) => {
        this.mensajeError.set(err.error?.message || 'Error de conexión con el servidor');
        this.cargando.set(false);
      }
    });
  }

  setTab(tab: 'PENDIENTE' | 'DESPACHADO'): void {
    this.tabActivo.set(tab);
    this.cargarVales();
  }

  buscar(): void {
    this.cargarVales();
  }

  limpiarFiltros(): void {
    this.filtroFechaInicio.set('');
    this.filtroFechaFin.set('');
    this.filtroBusqueda.set('');
    this.cargarVales();
  }

  abrirCrear(): void {
    const parentPath = this.isAlmacen() ? 'GestionAlmacen' : 'GestionMantenimiento';
    this.router.navigate([`/${parentPath}/vale/crear`]);
  }

  abrirDetalle(id: number): void {
    const parentPath = this.isAlmacen() ? 'GestionAlmacen' : 'GestionMantenimiento';
    this.router.navigate([`/${parentPath}/vale/detalle`, id]);
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
