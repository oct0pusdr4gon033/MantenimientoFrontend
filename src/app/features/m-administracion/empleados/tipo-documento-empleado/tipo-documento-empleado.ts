import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ExpedienteEmpleadoService } from '../services/expediente-empleado.service';
import { TipoDocumentoEmpleadoResponse, TipoDocumentoEmpleadoRequest } from '../models/ExpedienteEmpleadoModels';

@Component({
  selector: 'app-tipo-documento-empleado',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './tipo-documento-empleado.html',
  styleUrl: './tipo-documento-empleado.css',
})
export class TipoDocumentoEmpleadoComponent implements OnInit {
  private service = inject(ExpedienteEmpleadoService);

  tipos = signal<TipoDocumentoEmpleadoResponse[]>([]);
  cargando = signal<boolean>(false);
  mensajeError = signal<string>('');
  mensajeExito = signal<string>('');

  modalMode = signal<'crear' | 'editar' | null>(null);
  guardando = signal<boolean>(false);

  filtroBusqueda = signal<string>('');

  form: TipoDocumentoEmpleadoRequest = {
    codTipoDocumentoEmp: '',
    nombreTipo: ''
  };

  ngOnInit() {
    this.cargarTipos();
  }

  cargarTipos() {
    this.cargando.set(true);
    this.mensajeError.set('');
    this.service.obtenerTiposDocumento().subscribe({
      next: (res) => {
        this.tipos.set(res || []);
        this.cargando.set(false);
      },
      error: (err) => {
        this.mensajeError.set('Error al cargar los tipos de documento para empleados.');
        this.cargando.set(false);
      }
    });
  }

  tiposFiltrados() {
    const filtro = this.filtroBusqueda().toLowerCase();
    if (!filtro) return this.tipos();
    return this.tipos().filter(t =>
      t.codTipoDocumentoEmp.toLowerCase().includes(filtro) ||
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
    this.form = { codTipoDocumentoEmp: '', nombreTipo: '' };
    this.mensajeError.set('');
    this.modalMode.set('crear');
  }

  cerrarModal() {
    this.modalMode.set(null);
  }

  guardar() {
    if (!this.form.codTipoDocumentoEmp || !this.form.nombreTipo) {
      this.mensajeError.set('Todos los campos son obligatorios.');
      return;
    }

    this.guardando.set(true);
    this.mensajeError.set('');

    this.service.crearTipoDocumento(this.form).subscribe({
      next: (res) => {
        this.mostrarExito('Tipo de documento registrado correctamente.');
        this.cargarTipos();
        this.cerrarModal();
        this.guardando.set(false);
      },
      error: (err) => {
        this.mensajeError.set(err.error?.Message || 'Error al crear el tipo de documento.');
        this.guardando.set(false);
      }
    });
  }

  private mostrarExito(mensaje: string) {
    this.mensajeExito.set(mensaje);
    setTimeout(() => this.mensajeExito.set(''), 3000);
  }
}
