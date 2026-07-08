import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { SistemaEquipoService } from '../../services/sistema-equipo.service';
import { SistemaEquipoResponse, SistemaEquipoRequest, SistemaEquipoUpdateRequest } from '../../models/sistema-equipo';

type ModalMode = 'crear' | 'editar' | null;

@Component({
  selector: 'app-sistema-equipo-lista',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './sistema-equipo-lista.html',
  styleUrls: ['./sistema-equipo-lista.css']
})
export class SistemaEquipoListaComponent implements OnInit {
  private svc = inject(SistemaEquipoService);

  // ── Estado principal ───────────────────────────────────────
  sistemas = signal<SistemaEquipoResponse[]>([]);
  cargando = signal(false);
  modalMode = signal<ModalMode>(null);
  guardando = signal(false);

  // ── Filtros ────────────────────────────────────────────────
  filtroBusqueda = signal('');

  // ── Filtrado reactivo ──────────────────────────────────────
  sistemasFiltrados = computed(() => {
    const q = this.filtroBusqueda().toLowerCase().trim();
    if (!q) return this.sistemas();
    return this.sistemas().filter(s =>
      s.nombre_sist.toLowerCase().includes(q) ||
      s.cod_sist.toLowerCase().includes(q)
    );
  });

  // ── Formulario ─────────────────────────────────────────────
  form: SistemaEquipoRequest = { cod_sist: '', nombre_sist: '' };
  idOriginal: number = 0;           // guarda el ID antes de editar
  mensajeError = '';
  mensajeExito = '';

  ngOnInit(): void {
    this.cargarSistemas();
  }

  // ── CRUD ──────────────────────────────────────────────────

  cargarSistemas(): void {
    this.cargando.set(true);
    this.svc.getSistemas().subscribe({
      next: (res) => {
        this.sistemas.set(res.data ?? []);
        this.cargando.set(false);
      },
      error: () => {
        this.mostrarError('No se pudo cargar la lista de sistemas de equipo.');
        this.cargando.set(false);
      }
    });
  }

  buscarConApi(): void {
    // Client-side filtering is reactive and automatic, so no API call is needed.
  }

  guardar(): void {
    if (!this.form.cod_sist.trim() || !this.form.nombre_sist.trim()) {
      this.mensajeError = 'El código y el nombre son obligatorios.';
      return;
    }
    this.guardando.set(true);
    this.mensajeError = '';

    const operacion = this.modalMode() === 'crear'
      ? this.svc.createSistema(this.form)
      : this.svc.updateSistema(this.idOriginal, { nombre_sist: this.form.nombre_sist });

    operacion.subscribe({
      next: (res) => {
        this.guardando.set(false);
        if (res.success) {
          this.mostrarExito(this.modalMode() === 'crear' ? 'Sistema de equipo creado correctamente.' : 'Sistema de equipo actualizado correctamente.');
          this.cerrarModal();
          this.cargarSistemas();
        } else {
          this.mensajeError = res.message || 'Error al guardar.';
        }
      },
      error: (err) => {
        this.guardando.set(false);
        this.mensajeError = err?.error?.message || 'Error de conexión.';
      }
    });
  }

  // ── Modal ──────────────────────────────────────────────────

  abrirCrear(): void {
    this.form = { cod_sist: '', nombre_sist: '' };
    this.idOriginal = 0;
    this.mensajeError = '';
    this.modalMode.set('crear');
  }

  abrirEditar(sistema: SistemaEquipoResponse): void {
    this.form = { cod_sist: sistema.cod_sist, nombre_sist: sistema.nombre_sist };
    this.idOriginal = sistema.id_sistema;
    this.mensajeError = '';
    this.modalMode.set('editar');
  }

  cerrarModal(): void {
    this.modalMode.set(null);
    this.mensajeError = '';
  }

  // ── Filtro ─────────────────────────────────────────────────

  onFiltroChange(valor: string): void {
    this.filtroBusqueda.set(valor);
  }

  limpiarFiltro(): void {
    this.filtroBusqueda.set('');
  }

  // ── Notificaciones ─────────────────────────────────────────

  private mostrarError(msg: string): void {
    this.mensajeExito = '';
    this.mensajeError = msg;
    setTimeout(() => this.mensajeError = '', 4000);
  }

  private mostrarExito(msg: string): void {
    this.mensajeError = '';
    this.mensajeExito = msg;
    setTimeout(() => this.mensajeExito = '', 3000);
  }
}
