import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AreaOperacionService } from '../../m-flota/services/AreaOperacion.service';
import { AreaOperacionResponse } from '../../m-flota/models/AreaOperacionResponse';
import { AreaOperacionRequest } from '../../m-flota/models/AreaOperacionRequest';

type ModalMode = 'crear' | 'editar' | null;

@Component({
  standalone: true,
  selector: 'app-area-operacion',
  imports: [CommonModule, FormsModule],
  templateUrl: './area-operacion.component.html',
  styleUrls: ['./area-operacion.component.css']
})
export class AreaOperacionComponent implements OnInit {

  // ── Estado principal ───────────────────────────────────────
  areas = signal<AreaOperacionResponse[]>([]);
  cargando = signal(false);
  modalMode = signal<ModalMode>(null);
  guardando = signal(false);
  eliminandoCod = signal<string | null>(null);

  // ── Filtros ────────────────────────────────────────────────
  filtroBusqueda = signal('');
  filtroTipo = signal<'nombre' | 'codigo'>('nombre');

  // ── Filtrado reactivo ──────────────────────────────────────
  areasFiltradas = computed(() => {
    const q = this.filtroBusqueda().toLowerCase().trim();
    if (!q) return this.areas();
    return this.areas().filter(a =>
      a.nombreArea.toLowerCase().includes(q) ||
      a.codigoArea.toLowerCase().includes(q)
    );
  });

  // ── Formulario ─────────────────────────────────────────────
  form: AreaOperacionRequest = { codigoArea: '', nombreArea: '' };
  codigoOriginal = '';           // guarda el código antes de editar
  mensajeError = '';
  mensajeExito = '';

  // ── Modal de confirmación de eliminación ───────────────────
  areaAEliminar: AreaOperacionResponse | null = null;

  constructor(private svc: AreaOperacionService) { }

  ngOnInit(): void {
    this.cargarAreas();
  }

  // ── CRUD ──────────────────────────────────────────────────

  cargarAreas(): void {
    this.cargando.set(true);
    this.svc.listarAreas().subscribe({
      next: (res) => {
        this.areas.set(res.data ?? []);
        this.cargando.set(false);
      },
      error: () => {
        this.mostrarError('No se pudo cargar la lista de áreas.');
        this.cargando.set(false);
      }
    });
  }

  guardar(): void {
    if (!this.form.codigoArea.trim() || !this.form.nombreArea.trim()) {
      this.mensajeError = 'Todos los campos son obligatorios.';
      return;
    }
    this.guardando.set(true);
    this.mensajeError = '';

    const operacion = this.modalMode() === 'crear'
      ? this.svc.agregarArea(this.form)
      : this.svc.actualizarArea(this.codigoOriginal, this.form);

    operacion.subscribe({
      next: (res) => {
        this.guardando.set(false);
        if (res.success) {
          this.mostrarExito(this.modalMode() === 'crear' ? 'Área creada correctamente.' : 'Área actualizada correctamente.');
          this.cerrarModal();
          this.cargarAreas();
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

  confirmarEliminar(area: AreaOperacionResponse): void {
    this.areaAEliminar = area;
  }

  eliminar(): void {
    if (!this.areaAEliminar) return;
    const cod = this.areaAEliminar.codigoArea;
    this.eliminandoCod.set(cod);
    this.areaAEliminar = null;

    this.svc.eliminarArea(cod).subscribe({
      next: (res) => {
        this.eliminandoCod.set(null);
        if (res.success) {
          this.mostrarExito('Área eliminada.');
          this.cargarAreas();
        } else {
          this.mostrarError(res.message || 'No se pudo eliminar.');
        }
      },
      error: () => {
        this.eliminandoCod.set(null);
        this.mostrarError('Error de conexión al eliminar.');
      }
    });
  }


  // ── Modal ──────────────────────────────────────────────────

  abrirCrear(): void {
    this.form = { codigoArea: '', nombreArea: '' };
    this.codigoOriginal = '';
    this.mensajeError = '';
    this.modalMode.set('crear');
  }

  abrirEditar(area: AreaOperacionResponse): void {
    this.form = { codigoArea: area.codigoArea, nombreArea: area.nombreArea };
    this.codigoOriginal = area.codigoArea;
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
