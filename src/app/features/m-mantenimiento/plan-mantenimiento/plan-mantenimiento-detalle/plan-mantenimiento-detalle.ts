import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { PlanMantenimientoService } from '../../services/plan-mantenimiento.service';
import { PlanMantenimientoResponse } from '../../models/plan-mantenimiento';

@Component({
  selector: 'app-plan-mantenimiento-detalle',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './plan-mantenimiento-detalle.html',
  styleUrls: ['./plan-mantenimiento-detalle.css']
})
export class PlanMantenimientoDetalleComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private svc = inject(PlanMantenimientoService);

  plan = signal<PlanMantenimientoResponse | null>(null);
  cargando = signal(true);
  error = signal(false);

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.cargarDatos(Number(idParam));
    } else {
      this.error.set(true);
      this.cargando.set(false);
    }
  }

  cargarDatos(id: number): void {
    this.cargando.set(true);
    this.svc.getById(id).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.plan.set(res.data);
        } else {
          this.error.set(true);
        }
        this.cargando.set(false);
      },
      error: (err) => {
        console.error(err);
        this.error.set(true);
        this.cargando.set(false);
      }
    });
  }

  formatearFecha(fecha: string | Date | undefined): string {
    if (!fecha) return '-';
    const date = new Date(fecha);
    return date.toLocaleDateString('es-PE', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  obtenerPmsIncluidos(): string {
    const planVal = this.plan();
    if (!planVal || !planVal.actividades || planVal.actividades.length === 0) {
      return '-';
    }
    const pms = planVal.actividades
      .map(a => a.tipo_pm)
      .filter((value, index, self) => value && self.indexOf(value) === index);
    
    return pms.length > 0 ? pms.join(', ') : '-';
  }
}
