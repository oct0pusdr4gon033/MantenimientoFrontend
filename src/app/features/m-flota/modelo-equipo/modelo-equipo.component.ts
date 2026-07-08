import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ModeloEquipoService } from '../services/ModeloEquipo.service';
import { MarcaEquipoService } from '../services/MarcaEquipo.service';
import { TipoEquipoService } from '../services/TipoEquipo.service';
import { ModeloEquipoResponse } from '../models/ModeloEquipoResponse';
import { ModeloEquipoRequest } from '../models/ModeloEquipoRequest';
import { MarcaEquipoResponse } from '../models/MarcaEquipoResponse';
import { TipoEquipoResponse } from '../models/TipoEquipoResponse';

type ModalMode = 'crear' | 'editar' | null;

@Component({
  standalone: true,
  selector: 'app-modelo-equipo',
  imports: [CommonModule, FormsModule],
  templateUrl: './modelo-equipo.component.html',
  styleUrls: ['./modelo-equipo.component.css']
})
export class ModeloEquipoComponent implements OnInit {

  // ── Estado principal ───────────────────────────────────────
  modelos = signal<ModeloEquipoResponse[]>([]);
  marcas = signal<MarcaEquipoResponse[]>([]);
  tipos = signal<TipoEquipoResponse[]>([]);
  cargando = signal(false);
  modalMode = signal<ModalMode>(null);
  guardando = signal(false);

  // ── Filtros ────────────────────────────────────────────────
  filtroBusqueda = signal('');

  // ── Filtrado reactivo ──────────────────────────────────────
  modelosFiltrados = computed(() => {
    const q = this.filtroBusqueda().toLowerCase().trim();
    if (!q) return this.modelos();
    return this.modelos().filter(m =>
      m.nombreModelo.toLowerCase().includes(q) ||
      m.nombreMarca.toLowerCase().includes(q) ||
      m.nombreTipo.toLowerCase().includes(q)
    );
  });

  // ── Formulario ─────────────────────────────────────────────
  form: ModeloEquipoRequest = { idMarca: 0, idTipoEqp: 0, nombreModelo: '' };
  idOriginal: number = 0;
  mensajeError = '';
  mensajeExito = '';

  constructor(
    private svc: ModeloEquipoService,
    private marcaSvc: MarcaEquipoService,
    private tipoSvc: TipoEquipoService
  ) { }

  ngOnInit(): void {
    this.cargarModelos();
    this.cargarCatalogos();
  }

  // ── Carga de datos ─────────────────────────────────────────

  cargarModelos(): void {
    this.cargando.set(true);
    this.svc.listar().subscribe({
      next: (res) => {
        this.modelos.set(res.data ?? []);
        this.cargando.set(false);
      },
      error: () => {
        this.mostrarError('No se pudo cargar la lista de modelos.');
        this.cargando.set(false);
      }
    });
  }

  cargarCatalogos(): void {
    this.marcaSvc.listar().subscribe({
      next: (res) => this.marcas.set(res.data ?? []),
      error: () => { }
    });
    this.tipoSvc.listar().subscribe({
      next: (res) => this.tipos.set(res.data ?? []),
      error: () => { }
    });
  }

  // ── CRUD ──────────────────────────────────────────────────

  guardar(): void {
    if (!this.form.nombreModelo.trim()) {
      this.mensajeError = 'El nombre del modelo es obligatorio.';
      return;
    }
    if (!this.form.idMarca) {
      this.mensajeError = 'Debe seleccionar una marca.';
      return;
    }
    if (!this.form.idTipoEqp) {
      this.mensajeError = 'Debe seleccionar un tipo de equipo.';
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
          this.mostrarExito(this.modalMode() === 'crear' ? 'Modelo creado correctamente.' : 'Modelo actualizado correctamente.');
          this.cerrarModal();
          this.cargarModelos();
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
    this.form = { idMarca: 0, idTipoEqp: 0, nombreModelo: '' };
    this.idOriginal = 0;
    this.mensajeError = '';
    this.modalMode.set('crear');
  }

  abrirEditar(modelo: ModeloEquipoResponse): void {
    this.form = { idMarca: modelo.idMarca, idTipoEqp: modelo.idTipoEqp, nombreModelo: modelo.nombreModelo };
    this.idOriginal = modelo.idModelo;
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
