import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { EquipoService } from '../services/Equipo.service';
import { FlotaService } from '../services/Flota.service';
import { AreaOperacionService } from '../services/AreaOperacion.service';
import { EquipoResponse } from '../models/EquipoResponse';
import { EquipoRequest } from '../models/EquipoRequest';
import { FlotaResponse } from '../models/FlotaResponse';
import { AreaOperacionResponse } from '../models/AreaOperacionResponse';

type ModalMode = 'crear' | 'editar' | null;

@Component({
  standalone: true,
  selector: 'app-equipo',
  imports: [CommonModule, FormsModule],
  templateUrl: './equipo.component.html',
  styleUrls: ['./equipo.component.css']
})
export class EquipoComponent implements OnInit {

  // ── Estado principal ───────────────────────────────────────
  equipos = signal<EquipoResponse[]>([]);
  flotas = signal<FlotaResponse[]>([]);
  areas = signal<AreaOperacionResponse[]>([]);
  cargando = signal(false);
  modalMode = signal<ModalMode>(null);
  guardando = signal(false);

  // ── Filtros ────────────────────────────────────────────────
  filtroBusqueda = signal('');

  // ── Estados operativos válidos ─────────────────────────────
  readonly estadosOperativos = ['OPERATIVO', 'MANTENIMIENTO', 'INACTIVO'];

  // ── Filtrado reactivo ──────────────────────────────────────
  equiposFiltrados = computed(() => {
    const q = this.filtroBusqueda().toLowerCase().trim();
    if (!q) return this.equipos();
    return this.equipos().filter(e =>
      e.codEqp.toLowerCase().includes(q) ||
      e.placaEqp.toLowerCase().includes(q) ||
      e.nombreModelo.toLowerCase().includes(q) ||
      e.nombreMarca.toLowerCase().includes(q) ||
      e.nombreFlota.toLowerCase().includes(q) ||
      e.estadoOperativo.toLowerCase().includes(q)
    );
  });

  // ── Formulario ─────────────────────────────────────────────
  form: EquipoRequest = this.formVacio();
  idOriginal: number = 0;
  mensajeError = '';
  mensajeExito = '';

  constructor(
    private router: Router,
    private svc: EquipoService,
    private flotaSvc: FlotaService,
    private areaSvc: AreaOperacionService
  ) { }

  ngOnInit(): void {
    this.cargarEquipos();
    this.cargarCatalogos();
  }

  // ── Carga de datos ─────────────────────────────────────────

  cargarEquipos(): void {
    this.cargando.set(true);
    this.svc.listar().subscribe({
      next: (res) => {
        this.equipos.set(res.data ?? []);
        this.cargando.set(false);
      },
      error: () => {
        this.mostrarError('No se pudo cargar la lista de equipos.');
        this.cargando.set(false);
      }
    });
  }

  cargarCatalogos(): void {
    this.flotaSvc.listar().subscribe({
      next: (res) => this.flotas.set(res.data ?? []),
      error: () => { }
    });
    this.areaSvc.listarAreas().subscribe({
      next: (res) => this.areas.set(res.data ?? []),
      error: () => { }
    });
  }

  // ── CRUD ──────────────────────────────────────────────────

  guardar(): void {
    if (!this.form.codEqp.trim()) {
      this.mensajeError = 'El código del equipo es obligatorio.';
      return;
    }
    if (!this.form.idFlota) {
      this.mensajeError = 'Debe seleccionar una flota.';
      return;
    }
    if (!this.form.codAreaOpe.trim()) {
      this.mensajeError = 'Debe seleccionar un área de operación.';
      return;
    }
    if (!this.form.estadoOperativo) {
      this.mensajeError = 'Debe seleccionar un estado operativo.';
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
            ? 'Equipo registrado correctamente.'
            : 'Equipo actualizado correctamente.');
          this.cerrarModal();
          this.cargarEquipos();
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

  abrirEditar(equipo: EquipoResponse): void {
    this.form = {
      idFlota: equipo.idFlota,
      codEqp: equipo.codEqp,
      placaEqp: equipo.placaEqp,
      numSerie: equipo.numSerie,
      horometroInicial: equipo.horometroInicial,
      horometroActual: equipo.horometroActual,
      estadoOperativo: equipo.estadoOperativo,
      codAreaOpe: equipo.codAreaOpe
    };
    this.idOriginal = equipo.idEquipo;
    this.mensajeError = '';
    this.modalMode.set('editar');
  }

  cerrarModal(): void {
    this.modalMode.set(null);
    this.mensajeError = '';
  }

  verExpediente(equipo: EquipoResponse): void {
    this.router.navigate(['/GestionFlota/expediente', equipo.idEquipo]);
  }

  // ── Filtro ─────────────────────────────────────────────────

  onFiltroChange(valor: string): void {
    this.filtroBusqueda.set(valor);
  }

  limpiarFiltro(): void {
    this.filtroBusqueda.set('');
  }

  // ── Badge de estado ────────────────────────────────────────

  badgeClass(estado: string): string {
    switch (estado) {
      case 'OPERATIVO':    return 'badge-operativo';
      case 'MANTENIMIENTO': return 'badge-mantenimiento';
      case 'INACTIVO':     return 'badge-inactivo';
      default:             return 'badge-default';
    }
  }

  // ── Helpers ────────────────────────────────────────────────

  private formVacio(): EquipoRequest {
    return {
      idFlota: 0,
      codEqp: '',
      placaEqp: '',
      numSerie: '',
      horometroInicial: 0,
      horometroActual: 0,
      estadoOperativo: '',
      codAreaOpe: ''
    };
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
