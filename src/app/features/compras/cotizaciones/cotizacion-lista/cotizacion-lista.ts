import { Component, OnInit, inject, signal, PLATFORM_ID } from '@angular/core';
import { CommonModule, DatePipe, CurrencyPipe, isPlatformBrowser } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { CotizacionService } from '../../services/cotizacion.service';
import { CotizacionResponse } from '../../models/cotizacion';

@Component({
  standalone: true,
  selector: 'app-cotizacion-lista',
  imports: [CommonModule, RouterModule],
  providers: [DatePipe, CurrencyPipe],
  templateUrl: './cotizacion-lista.html',
  styleUrls: ['./cotizacion-lista.css']
})
export class CotizacionListaComponent implements OnInit {
  private service = inject(CotizacionService);
  private router = inject(Router);
  private platformId = inject(PLATFORM_ID);

  cotizaciones = signal<CotizacionResponse[]>([]);
  loading = signal(false);
  errorMessage = signal('');
  successMessage = signal('');

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.cargarCotizaciones();
    }
  }

  cargarCotizaciones() {
    this.loading.set(true);
    this.service.listar().subscribe({
      next: (res) => {
        setTimeout(() => {
          this.cotizaciones.set(res.data || []);
          this.loading.set(false);
        }, 0);
      },
      error: (err) => {
        setTimeout(() => {
          this.errorMessage.set('Error al cargar cotizaciones');
          this.loading.set(false);
        }, 0);
      }
    });
  }

  crearCotizacion() {
    this.router.navigate(['/GestionCompras/cotizaciones/crear']);
  }

  verDetalle(id: number) {
    this.router.navigate(['/GestionCompras/cotizaciones/detalle', id]);
  }

  aprobarCotizacion(id: number) {
    if (confirm('¿Estás seguro de aprobar esta cotización? Se generará una Orden de Compra automáticamente.')) {
      this.service.aprobar(id).subscribe({
        next: (res) => {
          this.successMessage.set(res.message || 'Cotización aprobada');
          this.cargarCotizaciones();
          setTimeout(() => this.successMessage.set(''), 3000);
        },
        error: (err) => {
          this.errorMessage.set(err.error?.message || 'Error al aprobar cotización');
          setTimeout(() => this.errorMessage.set(''), 3000);
        }
      });
    }
  }
}
