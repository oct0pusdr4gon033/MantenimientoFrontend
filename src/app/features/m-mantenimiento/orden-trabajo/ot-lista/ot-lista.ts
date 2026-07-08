import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { OrdenTrabajoService } from '../../services/orden-trabajo.service';
import { OrdenTrabajoResponse } from '../../models/orden-trabajo';

@Component({
  selector: 'app-ot-lista',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './ot-lista.html',
  styleUrls: ['./ot-lista.css']
})
export class OTListaComponent implements OnInit {
  private svc    = inject(OrdenTrabajoService);
  private router = inject(Router);

  ordenes   = signal<OrdenTrabajoResponse[]>([]);
  cargando  = signal(false);
  mensajeExito = signal('');
  mensajeError = signal('');

  // Filtros
  filtroBusqueda = signal('');
  filtroEstado   = signal<string>('TODOS');
  filtroTipo     = signal<string>('TODOS');

  ordenesFiltradas = computed(() => {
    let list = this.ordenes();

    const estado = this.filtroEstado();
    if (estado !== 'TODOS') list = list.filter(o => o.estado === estado);

    const tipo = this.filtroTipo();
    if (tipo !== 'TODOS') list = list.filter(o => o.tipo_ot === tipo);

    const q = this.filtroBusqueda().toLowerCase().trim();
    if (q) {
      list = list.filter(o =>
        o.cod_ot?.toLowerCase().includes(q) ||
        o.placa_equipo?.toLowerCase().includes(q) ||
        o.cod_equipo?.toLowerCase().includes(q) ||
        o.nombre_flota?.toLowerCase().includes(q) ||
        o.titulo_estrategia?.toLowerCase().includes(q)
      );
    }
    return list;
  });

  ngOnInit() { this.cargarDatos(); }

  cargarDatos() {
    this.cargando.set(true);
    this.svc.getAll().subscribe({
      next: res => { this.ordenes.set(res.data ?? []); this.cargando.set(false); },
      error: ()  => { this.mostrarError('No se pudo cargar las órdenes de trabajo.'); this.cargando.set(false); }
    });
  }

  abrirCrear()                { this.router.navigate(['/GestionMantenimiento/orden-trabajo/crear']); }
  abrirDetalle(id: number)    { this.router.navigate([`/GestionMantenimiento/orden-trabajo/detalle/${id}`]); }

  limpiarFiltros() {
    this.filtroBusqueda.set('');
    this.filtroEstado.set('TODOS');
    this.filtroTipo.set('TODOS');
  }

  getEstadoClass(estado: string): string {
    const map: Record<string, string> = {
      PENDIENTE:   'estado-pendiente',
      ACTIVA:      'estado-activa',
      EN_REVISION: 'estado-revision',
      CERRADA:     'estado-cerrada',
      INACTIVA:    'estado-inactiva'
    };
    return map[estado] ?? '';
  }

  getEstadoLabel(estado: string): string {
    const map: Record<string, string> = {
      PENDIENTE:   'Pendiente',
      ACTIVA:      'Activa',
      EN_REVISION: 'En Revisión',
      CERRADA:     'Cerrada',
      INACTIVA:    'Inactiva'
    };
    return map[estado] ?? estado;
  }

  formatearFecha(fecha: string | undefined): string {
    if (!fecha) return '-';
    return new Date(fecha).toLocaleDateString('es-PE', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  }

  private mostrarError(msg: string) {
    this.mensajeError.set(msg);
    setTimeout(() => this.mensajeError.set(''), 4000);
  }
  private mostrarExito(msg: string) {
    this.mensajeExito.set(msg);
    setTimeout(() => this.mensajeExito.set(''), 3000);
  }
}
