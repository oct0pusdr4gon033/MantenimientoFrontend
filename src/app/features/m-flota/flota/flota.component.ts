import { Component, OnInit, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FlotaService } from '../services/Flota.service';
import { ModeloEquipoService } from '../services/ModeloEquipo.service';
import { FlotaResponse } from '../models/FlotaResponse';
import { FlotaRequest } from '../models/FlotaRequest';
import { FlotaDetalleResponse } from '../models/FlotaDetalleResponse';
import { ModeloEquipoResponse } from '../models/ModeloEquipoResponse';

type ModalMode = 'crear' | 'editar' | null;

@Component({
  standalone: true,
  selector: 'app-flota',
  imports: [CommonModule, FormsModule],
  templateUrl: './flota.component.html',
  styleUrls: ['./flota.component.css']
})
export class FlotaComponent implements OnInit {

  // ── Estado principal ───────────────────────────────────────
  flotas = signal<FlotaResponse[]>([]);
  modelos = signal<ModeloEquipoResponse[]>([]);
  cargando = signal(false);
  modalMode = signal<ModalMode>(null);
  guardando = signal(false);

  // ── Filtros ────────────────────────────────────────────────
  filtroBusqueda = signal('');

  // ── Filtrado reactivo local ────────────────────────────────
  flotasFiltradas = computed(() => {
    const q = this.filtroBusqueda().toLowerCase().trim();
    if (!q) return this.flotas();
    return this.flotas().filter(f =>
      f.codFlota.toLowerCase().includes(q) ||
      f.nombreFlota.toLowerCase().includes(q) ||
      f.nombreModelo.toLowerCase().includes(q) ||
      f.nombreMarca.toLowerCase().includes(q) ||
      f.nombreTipo.toLowerCase().includes(q)
    );
  });

  // ── Formulario ─────────────────────────────────────────────
  form: FlotaRequest = this.formVacio();
  idOriginal: number = 0;
  mensajeError = '';
  mensajeExito = '';

  constructor(
    private svc: FlotaService,
    private modeloSvc: ModeloEquipoService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.cargarFlotas();
    this.cargarModelos();
  }

  // ── Carga de datos ─────────────────────────────────────────

  cargarFlotas(): void {
    this.cargando.set(true);
    this.svc.listar().subscribe({
      next: (res) => {
        this.flotas.set(res.data ?? []);
        this.cargando.set(false);
      },
      error: () => {
        this.mostrarError('No se pudo cargar la lista de flotas.');
        this.cargando.set(false);
      }
    });
  }

  cargarModelos(): void {
    this.modeloSvc.listar().subscribe({
      next: (res) => this.modelos.set(res.data ?? []),
      error: () => { }
    });
  }

  // ── Navegación a Detalle ───────────────────────────────────

  verDetalle(flota: FlotaResponse): void {
    const cod = encodeURIComponent(flota.codFlota.trim());
    this.router.navigate(['/GestionFlota/flotas/detalle', cod]);
  }

  // ── CRUD ──────────────────────────────────────────────────

  guardar(): void {
    if (!this.form.codFlota.trim()) {
      this.mensajeError = 'El código de flota es obligatorio.';
      return;
    }
    if (!this.form.nombreFlota.trim()) {
      this.mensajeError = 'El nombre de la flota es obligatorio.';
      return;
    }
    if (!this.form.idModelo) {
      this.mensajeError = 'Debe seleccionar un modelo de equipo.';
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
          this.mostrarExito(this.modalMode() === 'crear'
            ? 'Flota creada correctamente.'
            : 'Flota actualizada correctamente.');
          this.cerrarModal();
          this.cargarFlotas();
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
    this.form = this.formVacio();
    this.idOriginal = 0;
    this.mensajeError = '';
    this.modalMode.set('crear');
  }

  abrirEditar(flota: FlotaResponse): void {
    this.form = {
      codFlota: flota.codFlota,
      idModelo: flota.idModelo,
      nombreFlota: flota.nombreFlota,
      tipoControl: flota.tipoControl
    };
    this.idOriginal = flota.idFlota;
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

  // ── Badge estado de equipo ─────────────────────────────────

  badgeClass(estado: string): string {
    switch (estado) {
      case 'OPERATIVO':     return 'badge-operativo';
      case 'MANTENIMIENTO': return 'badge-mantenimiento';
      case 'INACTIVO':      return 'badge-inactivo';
      default:              return 'badge-default';
    }
  }

  // ── Helpers ────────────────────────────────────────────────

  private formVacio(): FlotaRequest {
    return { codFlota: '', idModelo: 0, nombreFlota: '', tipoControl: '' };
  }

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
