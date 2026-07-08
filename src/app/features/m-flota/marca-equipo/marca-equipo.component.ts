import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MarcaEquipoService } from '../services/MarcaEquipo.service';
import { MarcaEquipoResponse } from '../models/MarcaEquipoResponse';
import { MarcaEquipoRequest } from '../models/MarcaEquipoRequest';

type ModalMode = 'crear' | 'editar' | null;

@Component({
  standalone: true,
  selector: 'app-marca-equipo',
  imports: [CommonModule, FormsModule],
  templateUrl: './marca-equipo.component.html',
  styleUrls: ['./marca-equipo.component.css']
})
export class MarcaEquipoComponent implements OnInit {

  // ── Estado principal ───────────────────────────────────────
  marcas = signal<MarcaEquipoResponse[]>([]);
  cargando = signal(false);
  modalMode = signal<ModalMode>(null);
  guardando = signal(false);

  // ── Filtros ────────────────────────────────────────────────
  filtroBusqueda = signal('');

  // ── Filtrado reactivo ──────────────────────────────────────
  marcasFiltradas = computed(() => {
    const q = this.filtroBusqueda().toLowerCase().trim();
    if (!q) return this.marcas();
    return this.marcas().filter(m =>
      m.nombreMarca.toLowerCase().includes(q) ||
      m.idMarca.toString().includes(q)
    );
  });

  // ── Formulario ─────────────────────────────────────────────
  form: MarcaEquipoRequest = { nombreMarca: '' };
  idOriginal: number = 0;
  mensajeError = '';
  mensajeExito = '';

  constructor(private svc: MarcaEquipoService) { }

  ngOnInit(): void {
    this.cargarMarcas();
  }

  // ── CRUD ──────────────────────────────────────────────────

  cargarMarcas(): void {
    this.cargando.set(true);
    this.svc.listar().subscribe({
      next: (res) => {
        this.marcas.set(res.data ?? []);
        this.cargando.set(false);
      },
      error: () => {
        this.mostrarError('No se pudo cargar la lista de marcas.');
        this.cargando.set(false);
      }
    });
  }

  guardar(): void {
    if (!this.form.nombreMarca.trim()) {
      this.mensajeError = 'El nombre de la marca es obligatorio.';
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
          this.mostrarExito(this.modalMode() === 'crear' ? 'Marca creada correctamente.' : 'Marca actualizada correctamente.');
          this.cerrarModal();
          this.cargarMarcas();
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
    this.form = { nombreMarca: '' };
    this.idOriginal = 0;
    this.mensajeError = '';
    this.modalMode.set('crear');
  }

  abrirEditar(marca: MarcaEquipoResponse): void {
    this.form = { nombreMarca: marca.nombreMarca };
    this.idOriginal = marca.idMarca;
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
