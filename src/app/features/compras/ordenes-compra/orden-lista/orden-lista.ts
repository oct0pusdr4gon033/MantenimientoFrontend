import { Component, OnInit, inject, signal, PLATFORM_ID } from '@angular/core';
import { CommonModule, DatePipe, CurrencyPipe, isPlatformBrowser } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { OrdenCompraService } from '../../services/orden-compra.service';
import { OrdenCompraResponse } from '../../models/orden-compra';

@Component({
  standalone: true,
  selector: 'app-orden-lista',
  imports: [CommonModule, RouterModule],
  providers: [DatePipe, CurrencyPipe],
  templateUrl: './orden-lista.html',
  styleUrls: ['./orden-lista.css']
})
export class OrdenListaComponent implements OnInit {
  private service = inject(OrdenCompraService);
  private router = inject(Router);
  private platformId = inject(PLATFORM_ID);

  ordenes = signal<OrdenCompraResponse[]>([]);
  loading = signal(false);
  errorMessage = signal('');
  successMessage = signal('');

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.cargarOrdenes();
    }
  }

  cargarOrdenes() {
    this.loading.set(true);
    this.service.listar().subscribe({
      next: (res) => {
        setTimeout(() => {
          this.ordenes.set(res.data || []);
          this.loading.set(false);
        }, 0);
      },
      error: (err) => {
        setTimeout(() => {
          this.errorMessage.set('Error al cargar órdenes de compra');
          this.loading.set(false);
        }, 0);
      }
    });
  }

  crearOrdenManual() {
    this.router.navigate(['/GestionCompras/ordenes/crear']);
  }

  verDetalle(id: number) {
    this.router.navigate(['/GestionCompras/ordenes/detalle', id]);
  }
}
