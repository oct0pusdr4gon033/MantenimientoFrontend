import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink, Router } from '@angular/router';
import { EstrategiaService } from '../../services/estrategia.service';
import { EstrategiaResponse } from '../../models/EstrategiaResponse';

@Component({
  selector: 'app-estrategia-detalle-ver',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './estrategia-detalle-ver.html',
  styleUrls: [
    '../../../../shared/components/module-layout/module-layout.css',
    '../estrategia-lista/estrategia-lista.css',
    './estrategia-detalle-ver.css'
  ]
})
export class EstrategiaDetalleVer implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private estrategiaService = inject(EstrategiaService);

  estrategia = signal<EstrategiaResponse | null>(null);
  cargando = signal(true);
  error = signal(false);

  ngOnInit() {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.cargarEstrategia(Number(idParam));
    } else {
      this.error.set(true);
      this.cargando.set(false);
    }
  }

  cargarEstrategia(id: number) {
    this.cargando.set(true);
    this.estrategiaService.buscarPorId(id).subscribe({
      next: (data: any) => {
        // Handle standard or nested responses
        const obj = data.data ? data.data : data;
        this.estrategia.set(obj);
        this.cargando.set(false);
      },
      error: (err) => {
        console.error(err);
        this.error.set(true);
        this.cargando.set(false);
      }
    });
  }

  crearPlanDesdeEstrategia(detalle: any): void {
    const id_estrategia = this.estrategia()?.id_estrategia;
    const id_detalle_estrg = detalle.id_detalle_estrg;
    this.router.navigate(['/GestionMantenimiento/plan-mantenimiento/crear'], {
      queryParams: {
        id_estrategia,
        id_detalle_estrg
      }
    });
  }
}
