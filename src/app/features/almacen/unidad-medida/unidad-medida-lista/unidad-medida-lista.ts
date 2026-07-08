import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { UnidadMedidaService } from '../../services/unidad-medida.service';
import { UnidadMedidaResponse, UnidadMedidaRequest } from '../../models/unidad-medida';

type ModalMode = 'crear' | 'editar' | null;

@Component({
  selector: 'app-unidad-medida-lista',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './unidad-medida-lista.html',
  styleUrls: ['./unidad-medida-lista.css']
})
export class UnidadMedidaListaComponent implements OnInit {
  private svc = inject(UnidadMedidaService);

  // ── Estado principal ───────────────────────────────────────
  unidades = signal<UnidadMedidaResponse[]>([]);
  cargando = signal(false);
  modalMode = signal<ModalMode>(null);
  guardando = signal(false);

  // ── Filtros ────────────────────────────────────────────────
  filtroBusqueda = signal('');

  // ── Filtrado reactivo ──────────────────────────────────────
  unidadesFiltradas = computed(() => {
    const q = this.filtroBusqueda().toLowerCase().trim();
    if (!q) return this.unidades();
    return this.unidades().filter(u =>
      (u.nombre_unidad && u.nombre_unidad.toLowerCase().includes(q)) ||
      (u.abreviatura && u.abreviatura.toLowerCase().includes(q))
    );
  });

  // ── Formulario ─────────────────────────────────────────────
  form: UnidadMedidaRequest = this.getDefaultForm();
  idOriginal: number = 0;           // guarda el ID antes de editar
  mensajeError = '';
  mensajeExito = '';

  ngOnInit(): void {
    this.cargarUnidades();
  }

  cargarUnidades(): void {
    this.cargando.set(true);
    this.svc.getUnidades().subscribe({
      next: (res) => {
        this.unidades.set(res.data ?? []);
        this.cargando.set(false);
      },
      error: () => {
        this.mostrarError('No se pudo cargar la lista de unidades de medida.');
        this.cargando.set(false);
      }
    });
  }

  guardar(): void {
    if (!this.form.nombre_unidad.trim() || !this.form.abreviatura.trim()) {
      this.mensajeError = 'El nombre y la abreviatura de la unidad son obligatorios.';
      return;
    }

    this.guardando.set(true);
    this.mensajeError = '';

    const dataToSend: UnidadMedidaRequest = {
      nombre_unidad: this.form.nombre_unidad.trim(),
      abreviatura: this.form.abreviatura.trim().toUpperCase()
    };

    const operacion = this.modalMode() === 'crear'
      ? this.svc.createUnidad(dataToSend)
      : this.svc.updateUnidad(this.idOriginal, dataToSend);

    operacion.subscribe({
      next: (res) => {
        this.guardando.set(false);
        if (res.success) {
          this.mostrarExito(this.modalMode() === 'crear' ? 'Unidad de medida creada correctamente.' : 'Unidad de medida actualizada correctamente.');
          this.cerrarModal();
          this.cargarUnidades();
        } else {
          this.mensajeError = res.message || 'Error al guardar.';
        }
      },
      error: (err) => {
        this.guardando.set(false);
        this.mensajeError = err?.error?.message || 'Error al conectar con el servidor o nombre duplicado.';
      }
    });
  }

  abrirCrear(): void {
    this.form = this.getDefaultForm();
    this.idOriginal = 0;
    this.mensajeError = '';
    this.modalMode.set('crear');
  }

  abrirEditar(unidad: UnidadMedidaResponse): void {
    this.form = {
      nombre_unidad: unidad.nombre_unidad,
      abreviatura: unidad.abreviatura
    };
    this.idOriginal = unidad.id_unidad;
    this.mensajeError = '';
    this.modalMode.set('editar');
  }

  cerrarModal(): void {
    this.modalMode.set(null);
    this.mensajeError = '';
  }

  private getDefaultForm(): UnidadMedidaRequest {
    return {
      nombre_unidad: '',
      abreviatura: ''
    };
  }

  onFiltroChange(valor: string): void {
    this.filtroBusqueda.set(valor);
  }

  limpiarFiltro(): void {
    this.filtroBusqueda.set('');
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
