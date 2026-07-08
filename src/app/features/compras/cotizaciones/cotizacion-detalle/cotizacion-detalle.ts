import { Component, OnInit, inject, signal, PLATFORM_ID } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { CotizacionService } from '../../services/cotizacion.service';
import { ProveedorService } from '../../services/proveedor.service';
import { MaterialService } from '../../../almacen/services/material.service';
import { CotizacionResponse, CotizacionDetalleResponse } from '../../models/cotizacion';
import { ProveedorResponse } from '../../models/proveedor';
import { MaterialResponse } from '../../../almacen/models/material';

@Component({
  standalone: true,
  selector: 'app-cotizacion-detalle',
  imports: [CommonModule, FormsModule],
  providers: [CurrencyPipe, DatePipe],
  templateUrl: './cotizacion-detalle.html',
  styleUrls: ['./cotizacion-detalle.css']
})
export class CotizacionDetalleComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private service = inject(CotizacionService);
  private proveedorService = inject(ProveedorService);
  private materialService = inject(MaterialService);
  private platformId = inject(PLATFORM_ID);

  cotizacion = signal<CotizacionResponse | null>(null);
  proveedorDetalle = signal<ProveedorResponse | null>(null);
  unidadesMap = signal<Record<number, string>>({});
  loading = signal(true);
  errorMessage = signal('');
  successMessage = signal('');
  procesando = signal(false);

  // Edición
  modoEdicion = signal(false);
  preciosEditados = signal<Record<number, number>>({});

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      const id = this.route.snapshot.paramMap.get('id');
      if (id) {
        this.cargarDetalle(Number(id));
      } else {
        this.volver();
      }
    }
  }

  cargarDetalle(id: number) {
    this.loading.set(true);
    this.service.obtenerPorId(id).subscribe({
      next: (res) => {
        const c = res.data || null;
        this.cotizacion.set(c);
        
        if (c) {
          // Inicializar precios para edición
          const precios: Record<number, number> = {};
          c.detalles.forEach(d => precios[d.id_cotizacion_detalle] = d.precio_unitario);
          this.preciosEditados.set(precios);

          if (c.ruc_proveedor) {
            this.proveedorService.getProveedorByRuc(c.ruc_proveedor).subscribe(pRes => {
              this.proveedorDetalle.set(pRes.data || null);
            });
          }

          // Cargar materiales para obtener la unidad de medida
          this.materialService.getMateriales().subscribe(mRes => {
            const materiales = mRes.data || [];
            const mapa: Record<number, string> = {};
            materiales.forEach(m => mapa[m.id_material] = m.nombre_unidad);
            this.unidadesMap.set(mapa);
          });
        }

        this.loading.set(false);
      },
      error: (err) => {
        this.errorMessage.set('Error al cargar la cotización');
        this.loading.set(false);
      }
    });
  }

  activarEdicion() {
    this.modoEdicion.set(true);
  }

  cancelarEdicion() {
    this.modoEdicion.set(false);
    // Restaurar precios
    const c = this.cotizacion();
    if (c) {
      const precios: Record<number, number> = {};
      c.detalles.forEach(d => precios[d.id_cotizacion_detalle] = d.precio_unitario);
      this.preciosEditados.set(precios);
    }
  }

  guardarPrecios() {
    const c = this.cotizacion();
    if (!c) return;

    this.procesando.set(true);
    const precios = this.preciosEditados();
    
    const request = {
      detalles: c.detalles.map(d => ({
        id_cotizacion_detalle: d.id_cotizacion_detalle,
        precio_unitario: precios[d.id_cotizacion_detalle] || 0
      }))
    };

    this.service.actualizar(c.id_cotizacion, request).subscribe({
      next: (res) => {
        this.successMessage.set('Precios actualizados correctamente');
        this.modoEdicion.set(false);
        this.procesando.set(false);
        this.cargarDetalle(c.id_cotizacion);
        setTimeout(() => this.successMessage.set(''), 3000);
      },
      error: (err) => {
        this.errorMessage.set(err.error?.message || 'Error al actualizar precios');
        this.procesando.set(false);
        setTimeout(() => this.errorMessage.set(''), 4000);
      }
    });
  }

  calcularTotalEditado(): number {
    const c = this.cotizacion();
    if (!c) return 0;
    const precios = this.preciosEditados();
    let total = 0;
    c.detalles.forEach(d => {
      total += d.cantidad * (precios[d.id_cotizacion_detalle] || 0);
    });
    return total;
  }

  aprobarCotizacion() {
    const c = this.cotizacion();
    if (!c) return;

    if (confirm('¿Estás seguro de aprobar esta cotización? Se generará una Orden de Compra automáticamente.')) {
      this.procesando.set(true);
      this.service.aprobar(c.id_cotizacion).subscribe({
        next: (res) => {
          this.successMessage.set(res.message || 'Cotización aprobada');
          this.procesando.set(false);
          this.cargarDetalle(c.id_cotizacion);
          setTimeout(() => this.successMessage.set(''), 4000);
        },
        error: (err) => {
          this.procesando.set(false);
          this.errorMessage.set(err.error?.message || 'Error al aprobar cotización');
          setTimeout(() => this.errorMessage.set(''), 4000);
        }
      });
    }
  }

  volver() {
    this.router.navigate(['/GestionCompras/cotizaciones']);
  }

  imprimirCotizacion() {
    const c = this.cotizacion();
    if (!c) return;

    const originalTitle = document.title;
    document.title = c.nro_cotizacion;

    setTimeout(() => {
      window.print();
      document.title = originalTitle;
    }, 150);
  }
}
