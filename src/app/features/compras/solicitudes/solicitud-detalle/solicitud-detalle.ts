import { Component, OnInit, inject, signal, PLATFORM_ID } from '@angular/core';
import { CommonModule, DatePipe, isPlatformBrowser } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { SolpedService } from '../../services/solped.service';
import { ProveedorService } from '../../services/proveedor.service';
import { SolicitudPedidoResponse } from '../../models/solped';
import { ProveedorResponse } from '../../models/proveedor';

@Component({
  standalone: true,
  selector: 'app-solicitud-detalle',
  imports: [CommonModule],
  providers: [DatePipe],
  templateUrl: './solicitud-detalle.html',
  styleUrls: ['./solicitud-detalle.css']
})
export class SolicitudDetalle implements OnInit {
  private service = inject(SolpedService);
  private provSvc = inject(ProveedorService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private platformId = inject(PLATFORM_ID);

  solicitud = signal<SolicitudPedidoResponse | null>(null);
  proveedorCompleto = signal<ProveedorResponse | null>(null);
  loading = signal(false);
  procesando = signal(false);
  errorMessage = signal('');
  successMessage = signal('');

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      const idStr = this.route.snapshot.paramMap.get('id');
      if (idStr) {
        this.cargarDetalle(+idStr);
      } else {
        this.volver();
      }
    }
  }

  cargarDetalle(id: number) {
    this.loading.set(true);
    this.service.obtenerPorId(id).subscribe({
      next: (res) => {
        setTimeout(() => {
          const s = res.data || null;
          this.solicitud.set(s);
          
          if (s && s.detalles && s.detalles.length > 0) {
            const ruc = s.detalles[0].ruc_proveedor;
            if (ruc) {
              this.provSvc.getProveedorByRuc(ruc).subscribe({
                next: (pRes) => this.proveedorCompleto.set(pRes.data || null)
              });
            }
          }

          this.loading.set(false);
        }, 0);
      },
      error: (err) => {
        setTimeout(() => {
          this.errorMessage.set('Error al cargar detalle de solicitud');
          this.loading.set(false);
        }, 0);
      }
    });
  }

  aprobarSolicitud() {
    const s = this.solicitud();
    if (!s) return;

    if (confirm('¿Estás seguro de aprobar esta solicitud de pedido?')) {
      this.procesando.set(true);
      this.service.aprobar(s.id_solicitud_pedido).subscribe({
        next: (res) => {
          this.successMessage.set(res.message || 'Solicitud aprobada correctamente');
          this.cargarDetalle(s.id_solicitud_pedido);
          this.procesando.set(false);
          setTimeout(() => this.successMessage.set(''), 3000);
        },
        error: (err) => {
          this.errorMessage.set(err.error?.message || 'Error al aprobar solicitud');
          this.procesando.set(false);
          setTimeout(() => this.errorMessage.set(''), 3000);
        }
      });
    }
  }

  volver() {
    this.router.navigate(['/GestionCompras/solicitudes']);
  }

  imprimirSolped() {
    const s = this.solicitud();
    if (!s) return;

    // Cambiar título para el nombre del archivo PDF a generar
    const originalTitle = document.title;
    document.title = s.cod_solicitud;

    setTimeout(() => {
      window.print();
      document.title = originalTitle;
    }, 150);
  }
}
