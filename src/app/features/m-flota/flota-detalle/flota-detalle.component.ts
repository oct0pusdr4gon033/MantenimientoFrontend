import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { FlotaService } from '../services/Flota.service';
import { EquipoService } from '../services/Equipo.service';
import { AreaOperacionService } from '../services/AreaOperacion.service';

import { FlotaDetalleResponse } from '../models/FlotaDetalleResponse';
import { EquipoResponse } from '../models/EquipoResponse';
import { EquipoRequest } from '../models/EquipoRequest';
import { AreaOperacionResponse } from '../models/AreaOperacionResponse';

type ModalMode = 'crear' | 'editar' | null;

@Component({
  standalone: true,
  selector: 'app-flota-detalle',
  imports: [CommonModule, FormsModule],
  templateUrl: './flota-detalle.component.html',
  styleUrls: ['./flota-detalle.component.css']
})
export class FlotaDetalleComponent implements OnInit {

  // ── Estado de la flota ──────────────────────────────────────
  codFlota: string = '';
  detalle = signal<FlotaDetalleResponse | null>(null);
  cargando = signal(true);
  errorGeneral = signal('');

  // ── Estado del modal de equipos ─────────────────────────────
  areas = signal<AreaOperacionResponse[]>([]);
  modalMode = signal<ModalMode>(null);
  guardando = signal(false);

  readonly estadosOperativos = ['OPERATIVO', 'MANTENIMIENTO', 'INACTIVO'];

  form: EquipoRequest = this.formVacio();
  idOriginal: number = 0;
  mensajeError = '';
  mensajeExito = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private flotaSvc: FlotaService,
    private equipoSvc: EquipoService,
    private areaSvc: AreaOperacionService
  ) { }

  ngOnInit(): void {
    const cod = this.route.snapshot.paramMap.get('id');
    if (!cod) {
      this.errorGeneral.set('Código de flota no válido.');
      this.cargando.set(false);
      return;
    }
    // Si viene codificado en la URL
    this.codFlota = decodeURIComponent(cod);
    this.cargarDetalle();
    this.cargarCatalogos();
  }

  // ── Carga de datos ─────────────────────────────────────────

  cargarDetalle(): void {
    this.cargando.set(true);
    this.errorGeneral.set('');
    this.flotaSvc.detalle(this.codFlota).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.detalle.set(res.data);
        } else {
          this.errorGeneral.set(res.message || 'No se encontró la flota.');
        }
        this.cargando.set(false);
      },
      error: () => {
        this.errorGeneral.set('No se pudo conectar con el servidor (Error 404/500). Verifique si el endpoint existe en su backend.');
        this.cargando.set(false);
      }
    });
  }

  cargarCatalogos(): void {
    this.areaSvc.listarAreas().subscribe({
      next: (res) => this.areas.set(res.data ?? []),
      error: () => { }
    });
  }

  // ── Navegación ─────────────────────────────────────────────

  volverAFlotas(): void {
    this.router.navigate(['/GestionFlota/flotas']);
  }

  // ── Modal y Formulario de Equipo ────────────────────────────

  verHistorialHorometros(eq: EquipoResponse): void {
    this.router.navigate(['/GestionFlota/historial-horometros'], { queryParams: { q: eq.codEqp } });
  }

  abrirCrearEquipo(): void {
    const flotaDetalle = this.detalle();
    if (!flotaDetalle) return;

    this.form = this.formVacio();
    this.form.idFlota = flotaDetalle.idFlota; // Se bloquea al ID de esta flota
    this.idOriginal = 0;
    this.mensajeError = '';
    this.modalMode.set('crear');
  }

  abrirEditarEquipo(eq: EquipoResponse): void {
    const flotaDetalle = this.detalle();
    if (!flotaDetalle) return;

    this.form = {
      idFlota: eq.idFlota,
      codEqp: eq.codEqp,
      placaEqp: eq.placaEqp,
      numSerie: eq.numSerie,
      horometroInicial: eq.horometroInicial,
      horometroActual: eq.horometroActual,
      estadoOperativo: eq.estadoOperativo,
      codAreaOpe: eq.codAreaOpe
    };
    this.idOriginal = eq.idEquipo;
    this.mensajeError = '';
    this.modalMode.set('editar');
  }

  cerrarModal(): void {
    this.modalMode.set(null);
    this.mensajeError = '';
  }

  guardarEquipo(): void {
    if (!this.form.codEqp.trim()) {
      this.mensajeError = 'El código del equipo es obligatorio.';
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
      ? this.equipoSvc.crear(this.form)
      : this.equipoSvc.actualizar(this.idOriginal, this.form);

    operacion.subscribe({
      next: (res) => {
        this.guardando.set(false);
        if (res.success) {
          this.mostrarExito(this.modalMode() === 'crear' ? 'Equipo registrado correctamente.' : 'Equipo actualizado correctamente.');
          this.cerrarModal();
          this.cargarDetalle(); // Recargar la flota para ver los cambios
        } else {
          this.mensajeError = res.message || 'Error al guardar el equipo.';
        }
      },
      error: () => {
        this.guardando.set(false);
        this.mensajeError = 'Error de conexión al guardar.';
      }
    });
  }

  // ── Helpers ────────────────────────────────────────────────

  badgeClass(estado: string): string {
    switch (estado) {
      case 'OPERATIVO':     return 'badge-operativo';
      case 'MANTENIMIENTO': return 'badge-mantenimiento';
      case 'INACTIVO':      return 'badge-inactivo';
      default:              return 'badge-default';
    }
  }

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

  private mostrarExito(msg: string): void {
    this.mensajeError = '';
    this.mensajeExito = msg;
    setTimeout(() => this.mensajeExito = '', 3000);
  }
}
