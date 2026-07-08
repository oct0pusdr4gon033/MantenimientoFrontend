import { Component, OnInit, inject, signal, PLATFORM_ID } from '@angular/core';
import { CommonModule, DatePipe, isPlatformBrowser } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { SolpedService } from '../../services/solped.service';
import { SolicitudPedidoResponse } from '../../models/solped';

@Component({
  standalone: true,
  selector: 'app-solicitud-lista',
  imports: [CommonModule, RouterModule],
  providers: [DatePipe],
  templateUrl: './solicitud-lista.html',
  styleUrls: ['./solicitud-lista.css']
})
export class SolicitudLista implements OnInit {
  private service = inject(SolpedService);
  private router = inject(Router);
  private platformId = inject(PLATFORM_ID);

  solicitudes = signal<SolicitudPedidoResponse[]>([]);
  loading = signal(false);
  errorMessage = signal('');
  successMessage = signal('');

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.cargarSolicitudes();
    }
  }

  cargarSolicitudes() {
    this.loading.set(true);
    this.service.listar().subscribe({
      next: (res) => {
        setTimeout(() => {
          this.solicitudes.set(res.data || []);
          this.loading.set(false);
        }, 0);
      },
      error: (err) => {
        setTimeout(() => {
          this.errorMessage.set('Error al cargar solicitudes de pedido');
          this.loading.set(false);
        }, 0);
      }
    });
  }

  crearSolicitud() {
    this.router.navigate(['/GestionCompras/solicitudes/crear']);
  }

  verDetalle(id: number) {
    this.router.navigate(['/GestionCompras/solicitudes/detalle', id]);
  }

  aprobarSolicitud(id: number) {
    if (confirm('¿Estás seguro de aprobar esta solicitud?')) {
      this.service.aprobar(id).subscribe({
        next: (res) => {
          this.successMessage.set(res.message || 'Solicitud aprobada');
          this.cargarSolicitudes();
          setTimeout(() => this.successMessage.set(''), 3000);
        },
        error: (err) => {
          this.errorMessage.set(err.error?.message || 'Error al aprobar solicitud');
          setTimeout(() => this.errorMessage.set(''), 3000);
        }
      });
    }
  }
}
