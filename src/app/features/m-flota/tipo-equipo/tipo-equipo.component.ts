import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TipoEquipoService } from '../services/TipoEquipo.service';
import { TipoEquipoResponse } from '../models/TipoEquipoResponse';
import { TipoEquipoRequest } from '../models/TipoEquipoRequest';

type ModalMode = 'crear' | 'editar' | null;

@Component({
  standalone: true,
  selector: 'app-tipo-equipo',
  imports: [CommonModule, FormsModule],
  templateUrl: './tipo-equipo.component.html',
  styleUrls: ['./tipo-equipo.component.css']
})
export class TipoEquipoComponent implements OnInit {

  // ── Estado principal ───────────────────────────────────────
  tipos = signal<TipoEquipoResponse[]>([]);
  cargando = signal(false);
  modalMode = signal<ModalMode>(null);
  guardando = signal(false);

  // ── Filtros ────────────────────────────────────────────────
  filtroBusqueda = signal('');

  // ── Filtrado reactivo ──────────────────────────────────────
  tiposFiltrados = computed(() => {
    const q = this.filtroBusqueda().toLowerCase().trim();
    if (!q) return this.tipos();
    return this.tipos().filter(t =>
      t.nombreTipo.toLowerCase().includes(q) ||
      t.codigoEquipo.toLowerCase().includes(q)
    );
  });

  // ── Formulario ─────────────────────────────────────────────
  form: TipoEquipoRequest = { codigoEquipo: '', nombreTipo: '' };
  idOriginal: number = 0;           // guarda el ID antes de editar
  mensajeError = '';
  mensajeExito = '';

  constructor(private svc: TipoEquipoService) { }

  ngOnInit(): void {
    this.cargarTipos();
  }

  // ── CRUD ──────────────────────────────────────────────────

  cargarTipos(): void {
    this.cargando.set(true);
    this.svc.listar().subscribe({
      next: (res) => {
        this.tipos.set(res.data ?? []);
        this.cargando.set(false);
      },
      error: () => {
        this.mostrarError('No se pudo cargar la lista de tipos de equipo.');
        this.cargando.set(false);
      }
    });
  }

  buscarConApi(): void {
    const q = this.filtroBusqueda().trim();
    if (!q) {
        this.cargarTipos();
        return;
    }
    this.cargando.set(true);
    this.svc.buscarPorFiltro(q).subscribe({
      next: (res) => {
        this.tipos.set(res.data ?? []);
        this.cargando.set(false);
      },
      error: () => {
        this.mostrarError('Error al buscar tipos de equipo.');
        this.cargando.set(false);
      }
    });
  }

  guardar(): void {
    if (!this.form.codigoEquipo.trim() || !this.form.nombreTipo.trim()) {
      this.mensajeError = 'El código y el nombre son obligatorios.';
      return;
    }
    this.guardando.set(true);
    this.mensajeError = '';

    const operacion = this.modalMode() === 'crear'
      ? this.svc.crear(this.form)
      : this.svc.actualizar(this.idOriginal, this.form);

    operacion.subscribe({
      next: (res) => {
        this.guardando.set(false);
        if (res.success) {
          this.mostrarExito(this.modalMode() === 'crear' ? 'Tipo de equipo creado correctamente.' : 'Tipo de equipo actualizado correctamente.');
          this.cerrarModal();
          this.cargarTipos();
        } else {
          this.mensajeError = res.message || 'Error al guardar.';
        }
      },
      error: () => {
        this.guardando.set(false);
        this.mensajeError = 'Error de conexión.';
      }
    });
  }

  // ── Modal ──────────────────────────────────────────────────

  abrirCrear(): void {
    this.form = { codigoEquipo: '', nombreTipo: '' };
    this.idOriginal = 0;
    this.mensajeError = '';
    this.modalMode.set('crear');
  }

  abrirEditar(tipo: TipoEquipoResponse): void {
    this.form = { codigoEquipo: tipo.codigoEquipo, nombreTipo: tipo.nombreTipo };
    this.idOriginal = tipo.idTipoEqp;
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
