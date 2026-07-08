import { Component, OnInit, inject, signal, PLATFORM_ID } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe, isPlatformBrowser } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';

import { OrdenCompraService } from '../../services/orden-compra.service';
import { ProveedorService } from '../../services/proveedor.service';
import { MaterialService } from '../../../almacen/services/material.service';
import { OrdenCompraResponse } from '../../models/orden-compra';
import { ProveedorResponse } from '../../models/proveedor';
import { MaterialResponse } from '../../../almacen/models/material';

@Component({
  standalone: true,
  selector: 'app-orden-detalle',
  imports: [CommonModule],
  providers: [CurrencyPipe, DatePipe],
  templateUrl: './orden-detalle.html',
  styleUrls: ['./orden-detalle.css']
})
export class OrdenDetalleComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private service = inject(OrdenCompraService);
  private proveedorService = inject(ProveedorService);
  private materialService = inject(MaterialService);
  private platformId = inject(PLATFORM_ID);

  orden = signal<OrdenCompraResponse | null>(null);
  proveedorDetalle = signal<ProveedorResponse | null>(null);
  unidadesMap = signal<Record<number, string>>({});
  loading = signal(true);
  errorMessage = signal('');
  successMessage = signal('');
  procesando = signal(false);

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
        const o = res.data || null;
        this.orden.set(o);
        
        if (o) {
          // Cargar detalles del proveedor
          if (o.ruc_proveedor) {
            this.proveedorService.getProveedorByRuc(o.ruc_proveedor).subscribe(pRes => {
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
        this.errorMessage.set('Error al cargar la orden de compra');
        this.loading.set(false);
      }
    });
  }

  aprobarOrden() {
    const o = this.orden();
    if (!o) return;

    if (confirm('¿Estás seguro de aprobar esta orden de compra?')) {
      this.procesando.set(true);
      this.service.aprobar(o.id_orden_compra).subscribe({
        next: (res) => {
          this.successMessage.set('Orden de compra aprobada correctamente');
          this.procesando.set(false);
          this.cargarDetalle(o.id_orden_compra);
          setTimeout(() => this.successMessage.set(''), 4000);
        },
        error: (err) => {
          this.procesando.set(false);
          this.errorMessage.set(err.error?.message || 'Error al aprobar orden de compra');
          setTimeout(() => this.errorMessage.set(''), 4000);
        }
      });
    }
  }

  volver() {
    this.router.navigate(['/GestionCompras/ordenes']);
  }

  imprimirOrden() {
    const o = this.orden();
    if (!o) return;

    const originalTitle = document.title;
    document.title = o.nro_orden || `OC-${o.id_orden_compra}`;

    setTimeout(() => {
      window.print();
      document.title = originalTitle;
    }, 150);
  }
}
