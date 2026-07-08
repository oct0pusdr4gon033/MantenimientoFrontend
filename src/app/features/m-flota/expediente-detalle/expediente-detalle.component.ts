import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { ExpedienteService } from '../services/Expediente.service';
import { EquipoService } from '../services/Equipo.service';
import { TipoDocumentoService } from '../services/TipoDocumento.service';

import { StorageService } from '../services/Storage.service';

import { ExpedienteResponse } from '../models/ExpedienteResponse';
import { ExpedienteDocumentoResponse } from '../models/ExpedienteDocumentoResponse';
import { ExpedienteRequest } from '../models/ExpedienteRequest';
import { ExpedienteDocumentoRequest } from '../models/ExpedienteDocumentoRequest';
import { TipoDocumentoResponse } from '../models/TipoDocumentoResponse';
import { EquipoResponse } from '../models/EquipoResponse';

type ModalMode = 'crear-expediente' | 'agregar-documento' | 'editar-documento' | null;

@Component({
  standalone: true,
  selector: 'app-expediente-detalle',
  imports: [CommonModule, FormsModule],
  templateUrl: './expediente-detalle.component.html',
  styleUrl: './expediente-detalle.component.css'
})
export class ExpedienteDetalleComponent implements OnInit {

  // ── Estado ──────────────────────────────────────────────────
  idEquipo: number = 0;
  equipo = signal<EquipoResponse | null>(null);
  expediente = signal<ExpedienteResponse | null>(null);
  tiposDocumento = signal<TipoDocumentoResponse[]>([]);

  cargando = signal(true);
  guardando = signal(false);
  subiendoArchivo = signal(false);
  modalMode = signal<ModalMode>(null);

  mensajeExito = '';
  mensajeError = '';

  // ── Formulario crear expediente ──────────────────────────────
  formExpediente: ExpedienteRequest = { codigoExp: '', idEquipo: 0 };

  // ── Formulario agregar documento ─────────────────────────────
  formDocumento: ExpedienteDocumentoRequest = this.docVacio();
  idDocumentoEdit: number | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private expedienteSvc: ExpedienteService,
    private equipoSvc: EquipoService,
    private tipoDocSvc: TipoDocumentoService,
    private storageSvc: StorageService
  ) { }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('idEquipo');
    if (!id || isNaN(+id)) {
      this.mensajeError = 'ID de equipo no válido.';
      this.cargando.set(false);
      return;
    }
    this.idEquipo = +id;
    this.cargarDatos();
    this.cargarTiposDocumento();
  }

  // ── Carga ────────────────────────────────────────────────────

  cargarDatos(): void {
    this.cargando.set(true);

    // Cargar equipo
    this.equipoSvc.buscarPorId(this.idEquipo).subscribe({
      next: (res) => {
        if (res.success && res.data) this.equipo.set(res.data);
      },
      error: () => { }
    });

    // Cargar expediente del equipo
    this.expedienteSvc.buscarPorEquipo(this.idEquipo).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.expediente.set(res.data);
        } else {
          this.expediente.set(null);
        }
        this.cargando.set(false);
      },
      error: () => {
        this.expediente.set(null);
        this.cargando.set(false);
      }
    });
  }

  cargarTiposDocumento(): void {
    this.tipoDocSvc.listar().subscribe({
      next: (res) => this.tiposDocumento.set(res.data ?? []),
      error: () => { }
    });
  }

  // ── Navegación ───────────────────────────────────────────────

  volver(): void {
    this.router.navigate(['/GestionFlota/equipos']);
  }

  verDocumento(doc: ExpedienteDocumentoResponse): void {
    this.router.navigate(['/GestionFlota/expediente', this.idEquipo, 'documento', doc.idExpedienteDocumento]);
  }

  // ── Modal Crear Expediente ───────────────────────────────────

  abrirCrearExpediente(): void {
    this.formExpediente = { codigoExp: '', idEquipo: this.idEquipo };
    this.mensajeError = '';
    this.modalMode.set('crear-expediente');
  }

  guardarExpediente(): void {
    if (!this.formExpediente.codigoExp.trim()) {
      this.mensajeError = 'El código del expediente es obligatorio.';
      return;
    }
    this.guardando.set(true);
    this.mensajeError = '';
    this.expedienteSvc.crear(this.formExpediente).subscribe({
      next: (res) => {
        this.guardando.set(false);
        if (res.success) {
          this.mostrarExito('Expediente creado correctamente.');
          this.cerrarModal();
          this.cargarDatos();
        } else {
          this.mensajeError = res.message || 'Error al crear el expediente.';
        }
      },
      error: () => {
        this.guardando.set(false);
        this.mensajeError = 'Error de conexión.';
      }
    });
  }

  // ── Modal Agregar Documento ──────────────────────────────────

  abrirAgregarDocumento(): void {
    const exp = this.expediente();
    if (!exp) return;
    this.formDocumento = this.docVacio();
    this.formDocumento.codigoExp = exp.codigoExp;
    this.formDocumento.fechaRegistro = new Date().toISOString().split('T')[0];
    this.idDocumentoEdit = null;
    this.mensajeError = '';
    this.modalMode.set('agregar-documento');
  }

  abrirEditarDocumento(doc: ExpedienteDocumentoResponse): void {
    const exp = this.expediente();
    if (!exp) return;
    this.idDocumentoEdit = doc.idExpedienteDocumento;
    this.formDocumento = {
      codigoExp: exp.codigoExp,
      codTipoDocumento: doc.codTipoDocumento,
      fechaRegistro: new Date(doc.fechaRegistro).toISOString().split('T')[0],
      fechaVencimiento: new Date(doc.fechaVencimiento).toISOString().split('T')[0],
      documentoUrl: doc.documentoUrl || ''
    };
    this.mensajeError = '';
    this.modalMode.set('editar-documento');
  }

  onFileSelected(event: any): void {
    const file: File = event.target.files[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      this.mensajeError = 'Solo se permiten archivos PDF.';
      return;
    }

    this.subiendoArchivo.set(true);
    this.mensajeError = '';

    // Subir el archivo al módulo de expedientes (version v1)
    this.storageSvc.uploadFile(file, 'expedientes', 'v1').subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.formDocumento.documentoUrl = res.data;
          this.mostrarExito('Archivo subido al servidor correctamente.');
        } else {
          this.mensajeError = res.message || 'Error al subir el archivo.';
        }
        this.subiendoArchivo.set(false);
      },
      error: () => {
        this.mensajeError = 'Error de conexión al subir archivo.';
        this.subiendoArchivo.set(false);
      }
    });
  }

  guardarDocumento(): void {
    if (!this.formDocumento.codTipoDocumento) {
      this.mensajeError = 'Seleccione el tipo de documento.';
      return;
    }
    if (!this.formDocumento.fechaRegistro) {
      this.mensajeError = 'La fecha de registro es obligatoria.';
      return;
    }
    if (!this.formDocumento.fechaVencimiento) {
      this.mensajeError = 'La fecha de vencimiento es obligatoria.';
      return;
    }
    if (this.formDocumento.fechaVencimiento <= this.formDocumento.fechaRegistro) {
      this.mensajeError = 'La fecha de vencimiento debe ser posterior a la de registro.';
      return;
    }

    this.guardando.set(true);
    this.mensajeError = '';

    if (this.modalMode() === 'agregar-documento') {
      this.expedienteSvc.insertarDocumento(this.formDocumento).subscribe({
        next: (res) => {
          this.guardando.set(false);
          if (res.success) {
            this.mostrarExito('Documento agregado correctamente.');
            this.cerrarModal();
            this.cargarDatos();
          } else {
            this.mensajeError = res.message || 'Error al agregar el documento.';
          }
        },
        error: () => {
          this.guardando.set(false);
          this.mensajeError = 'Error de conexión.';
        }
      });
    } else if (this.modalMode() === 'editar-documento' && this.idDocumentoEdit) {
      this.expedienteSvc.actualizarDocumento(this.idDocumentoEdit, this.formDocumento).subscribe({
        next: (res) => {
          this.guardando.set(false);
          if (res.success) {
            this.mostrarExito('Documento actualizado correctamente.');
            this.cerrarModal();
            this.cargarDatos();
          } else {
            this.mensajeError = res.message || 'Error al actualizar el documento.';
          }
        },
        error: () => {
          this.guardando.set(false);
          this.mensajeError = 'Error de conexión.';
        }
      });
    }
  }

  cerrarModal(): void {
    this.modalMode.set(null);
    this.mensajeError = '';
  }

  // ── Helpers ──────────────────────────────────────────────────

  badgeVencido(doc: ExpedienteDocumentoResponse): string {
    const hoy = new Date();
    const venc = new Date(doc.fechaVencimiento);
    const diff = Math.ceil((venc.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
    if (diff < 0)  return 'badge-vencido';
    if (diff <= 30) return 'badge-por-vencer';
    return 'badge-vigente';
  }

  textoVencimiento(doc: ExpedienteDocumentoResponse): string {
    const hoy = new Date();
    const venc = new Date(doc.fechaVencimiento);
    const diff = Math.ceil((venc.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
    if (diff < 0)  return 'Vencido';
    if (diff === 0) return 'Vence hoy';
    if (diff <= 30) return `Vence en ${diff} día(s)`;
    return 'Vigente';
  }

  private docVacio(): ExpedienteDocumentoRequest {
    return {
      codigoExp: '',
      codTipoDocumento: '',
      fechaRegistro: '',
      fechaVencimiento: '',
      documentoUrl: ''
    };
  }

  private mostrarExito(msg: string): void {
    this.mensajeError = '';
    this.mensajeExito = msg;
    setTimeout(() => this.mensajeExito = '', 3500);
  }
}
