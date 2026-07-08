import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TipoDocumentoService } from '../services/TipoDocumento.service';
import { TipoDocumentoResponse } from '../models/TipoDocumentoResponse';
import { TipoDocumentoRequest } from '../models/TipoDocumentoRequest';

@Component({
  selector: 'app-tipo-documento',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './tipo-documento.html',
  styleUrl: './tipo-documento.css',
})
export class TipoDocumento implements OnInit {
  private service = inject(TipoDocumentoService);

  tipos = signal<TipoDocumentoResponse[]>([]);
  cargando = signal<boolean>(false);
  mensajeError = signal<string>('');
  mensajeExito = signal<string>('');

  modalMode = signal<'crear' | 'editar' | null>(null);
  guardando = signal<boolean>(false);

  filtroBusqueda = signal<string>('');

  form: TipoDocumentoRequest = {
    codTipoDocumento: '',
    nombreTipo: ''
  };

  ngOnInit() {
    this.cargarTipos();
  }

  cargarTipos() {
    this.cargando.set(true);
    this.mensajeError.set('');
    this.service.listar().subscribe({
      next: (res) => {
        if (res.success) {
          this.tipos.set(res.data || []);
        } else {
          this.mensajeError.set(res.message);
        }
        this.cargando.set(false);
      },
      error: (err) => {
        this.mensajeError.set('Error al cargar los tipos de documento.');
        this.cargando.set(false);
      }
    });
  }

  tiposFiltrados() {
    const filtro = this.filtroBusqueda().toLowerCase();
    if (!filtro) return this.tipos();
    return this.tipos().filter(t =>
      t.codTipoDocumento.toLowerCase().includes(filtro) ||
      t.nombreTipo.toLowerCase().includes(filtro)
    );
  }

  onFiltroChange(valor: string) {
    this.filtroBusqueda.set(valor);
  }

  limpiarFiltro() {
    this.filtroBusqueda.set('');
  }

  abrirCrear() {
    this.form = { codTipoDocumento: '', nombreTipo: '' };
    this.mensajeError.set('');
    this.modalMode.set('crear');
  }

  abrirEditar(tipo: TipoDocumentoResponse) {
    this.form = {
      codTipoDocumento: tipo.codTipoDocumento,
      nombreTipo: tipo.nombreTipo
    };
    this.mensajeError.set('');
    this.modalMode.set('editar');
  }

  cerrarModal() {
    this.modalMode.set(null);
  }

  guardar() {
    if (!this.form.codTipoDocumento || !this.form.nombreTipo) {
      this.mensajeError.set('Todos los campos son obligatorios.');
      return;
    }

    this.guardando.set(true);
    this.mensajeError.set('');

    if (this.modalMode() === 'crear') {
      this.service.crear(this.form).subscribe({
        next: (res) => {
          if (res.success) {
            this.mostrarExito('Tipo de documento registrado correctamente.');
            this.cargarTipos();
            this.cerrarModal();
          } else {
            this.mensajeError.set(res.message);
          }
          this.guardando.set(false);
        },
        error: (err) => {
          this.mensajeError.set(err.error?.message || 'Error al crear el tipo de documento.');
          this.guardando.set(false);
        }
      });
    } else {
      this.service.actualizar(this.form.codTipoDocumento, this.form).subscribe({
        next: (res) => {
          if (res.success) {
            this.mostrarExito('Tipo de documento actualizado correctamente.');
            this.cargarTipos();
            this.cerrarModal();
          } else {
            this.mensajeError.set(res.message);
          }
          this.guardando.set(false);
        },
        error: (err) => {
          this.mensajeError.set(err.error?.message || 'Error al actualizar el tipo de documento.');
          this.guardando.set(false);
        }
      });
    }
  }

  private mostrarExito(mensaje: string) {
    this.mensajeExito.set(mensaje);
    setTimeout(() => this.mensajeExito.set(''), 3000);
  }
}
