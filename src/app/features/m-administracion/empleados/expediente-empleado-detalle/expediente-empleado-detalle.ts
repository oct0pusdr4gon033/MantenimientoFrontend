import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { ActivatedRoute, Router } from '@angular/router';
import { ExpedienteEmpleadoService } from '../services/expediente-empleado.service';
import { EmpleadoService } from '../services/Empleado.service';
import { StorageService } from '../../../m-flota/services/Storage.service';

import {
  ExpedienteEmpleadoResponse,
  ExpedienteDocumentoEmpleadoResponse,
  ExpedienteEmpleadoRequest,
  ExpedienteDocumentoEmpleadoRequest,
  TipoDocumentoEmpleadoResponse
} from '../models/ExpedienteEmpleadoModels';

import { EmpleadoResponse } from '../models/EmpleadoResponse';

type ModalMode = 'crear-expediente' | 'agregar-documento' | 'editar-documento' | null;

@Component({
  standalone: true,
  selector: 'app-expediente-empleado-detalle',
  imports: [CommonModule, FormsModule],
  templateUrl: './expediente-empleado-detalle.html',
  styleUrl: './expediente-empleado-detalle.css'
})
export class ExpedienteEmpleadoDetalleComponent implements OnInit {

  // ── Estado ──────────────────────────────────────────────────
  dniEmpleado: string = '';
  empleado = signal<EmpleadoResponse | null>(null);
  expediente = signal<ExpedienteEmpleadoResponse | null>(null);
  tiposDocumento = signal<TipoDocumentoEmpleadoResponse[]>([]);

  cargando = signal(true);
  guardando = signal(false);
  modalMode = signal<ModalMode>(null);

  mensajeExito = '';
  mensajeError = '';

  archivoSeleccionado: File | null = null;
  subiendoArchivo = signal<boolean>(false);
  docEditandoId: number | null = null;

  // ── Formulario crear expediente ──────────────────────────────
  formExpediente: ExpedienteEmpleadoRequest = { codigoExpEmp: '', dniEmpleado: '' };

  // ── Formulario agregar documento ─────────────────────────────
  formDocumento: ExpedienteDocumentoEmpleadoRequest = this.docVacio();

  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private expedienteSvc = inject(ExpedienteEmpleadoService);
  private empleadoSvc = inject(EmpleadoService);
  private storageSvc = inject(StorageService);

  constructor() { }

  ngOnInit(): void {
    const dni = this.route.snapshot.paramMap.get('dni');
    if (!dni) {
      this.mensajeError = 'DNI de empleado no válido.';
      this.cargando.set(false);
      return;
    }
    this.dniEmpleado = dni;
    this.cargarDatos();
    this.cargarTiposDocumento();
  }

  // ── Carga ────────────────────────────────────────────────────

  cargarDatos(): void {
    this.cargando.set(true);

    // Cargar empleado (Asumiendo que existe un método obtenerPorDni, si no, lo ajustaremos)
    // De hecho, en empleadoSvc tenemos listar(). Filtraremos por DNI por ahora o ajustaremos luego si hace falta.
    this.empleadoSvc.listar().subscribe({
      next: (res) => {
        if (res.success && res.data) {
          const emp = res.data.find(e => e.dni_empleado === this.dniEmpleado);
          if (emp) this.empleado.set(emp);
        }
      },
      error: () => { }
    });

    // Cargar expediente del empleado
    this.expedienteSvc.obtenerPorDni(this.dniEmpleado).subscribe({
      next: (res) => {
        if (res) {
          this.expediente.set(res);
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
    this.expedienteSvc.obtenerTiposDocumento().subscribe({
      next: (res) => this.tiposDocumento.set(res ?? []),
      error: () => { }
    });
  }

  // ── Navegación ───────────────────────────────────────────────

  volver(): void {
    this.router.navigate(['/GestionAdministracion/empleado']);
  }

  // ── Modal Crear Expediente ───────────────────────────────────

  abrirCrearExpediente(): void {
    this.formExpediente = { codigoExpEmp: '', dniEmpleado: this.dniEmpleado };
    this.mensajeError = '';
    this.modalMode.set('crear-expediente');
  }

  guardarExpediente(): void {
    if (!this.formExpediente.codigoExpEmp.trim()) {
      this.mensajeError = 'El código del expediente es obligatorio.';
      return;
    }
    this.guardando.set(true);
    this.mensajeError = '';
    this.expedienteSvc.crearExpediente(this.formExpediente).subscribe({
      next: (res) => {
        this.guardando.set(false);
        this.mostrarExito('Expediente creado correctamente.');
        this.cerrarModal();
        this.cargarDatos();
      },
      error: (err) => {
        this.guardando.set(false);
        this.mensajeError = err.error?.Message || 'Error al crear el expediente.';
      }
    });
  }

  // ── Modal Agregar Documento ──────────────────────────────────

  abrirAgregarDocumento(): void {
    const exp = this.expediente();
    if (!exp) return;
    this.formDocumento = this.docVacio();
    this.formDocumento.codigoExpEmp = exp.codigoExpEmp;
    this.formDocumento.fechaRegistro = new Date().toISOString().split('T')[0];
    this.mensajeError = '';
    this.archivoSeleccionado = null;
    this.docEditandoId = null;
    this.modalMode.set('agregar-documento');
  }

  verDocumento(doc: ExpedienteDocumentoEmpleadoResponse): void {
    const dni = this.empleado()?.dni_empleado;
    if (dni) {
      this.router.navigate([
        '/GestionAdministracion/expediente-empleado/detalle',
        dni,
        'documento',
        doc.codigoExpEmp || doc.codigoExpEmp,
        doc.idExpedienteDocumentoEmp || (doc as any).IdExpedienteDocumentoEmp
      ]);
    }
  }

  abrirEditarDocumento(doc: ExpedienteDocumentoEmpleadoResponse): void {
    this.formDocumento = {
      codigoExpEmp: doc.codigoExpEmp,
      codTipoDocumentoEmp: doc.codTipoDocumentoEmp || doc.codTipoDocumentoEmp || '', // Handle camelCase mismatch if any
      fechaRegistro: doc.fechaRegistro ? doc.fechaRegistro.split('T')[0] : '',
      fechaVencimiento: doc.fechaVencimiento ? doc.fechaVencimiento.split('T')[0] : '',
      documentoUrl: doc.documentoUrl
    };

    // Asignar el código de tipo si viene en el campo correcto
    if ((doc as any).codTipoDocumentoEmp) {
      this.formDocumento.codTipoDocumentoEmp = (doc as any).codTipoDocumentoEmp;
    } else if ((doc as any).CodTipoDocumentoEmp) {
      this.formDocumento.codTipoDocumentoEmp = (doc as any).CodTipoDocumentoEmp;
    }

    this.docEditandoId = doc.idExpedienteDocumentoEmp || (doc as any).IdExpedienteDocumentoEmp;
    this.archivoSeleccionado = null;
    this.mensajeError = '';
    this.modalMode.set('editar-documento');
  }

  onArchivoSeleccionado(event: any): void {
    const file = event.target.files[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        this.mensajeError = 'Solo se permiten archivos PDF.';
        this.archivoSeleccionado = null;
        return;
      }
      this.archivoSeleccionado = file;
      this.mensajeError = '';
    }
  }

  guardarDocumento(): void {
    if (!this.formDocumento.codTipoDocumentoEmp) {
      this.mensajeError = 'Seleccione el tipo de documento.';
      return;
    }
    if (!this.formDocumento.fechaRegistro) {
      this.mensajeError = 'La fecha de registro es obligatoria.';
      return;
    }
    if (this.formDocumento.fechaVencimiento && this.formDocumento.fechaVencimiento <= this.formDocumento.fechaRegistro) {
      this.mensajeError = 'La fecha de vencimiento debe ser posterior a la de registro.';
      return;
    }

    if (!this.archivoSeleccionado && !this.formDocumento.documentoUrl) {
      this.mensajeError = 'Debe seleccionar un archivo PDF para cargar.';
      return;
    }

    this.guardando.set(true);
    this.mensajeError = '';

    // Si hay archivo seleccionado, primero subirlo
    if (this.archivoSeleccionado) {
      this.subiendoArchivo.set(true);
      this.storageSvc.uploadFile(this.archivoSeleccionado, 'expediente/empleados').subscribe({
        next: (res: any) => {
          this.subiendoArchivo.set(false);
          if (res.success && res.data) {
            this.formDocumento.documentoUrl = res.data;
            this.ejecutarGuardadoDocumento();
          } else {
            this.guardando.set(false);
            this.mensajeError = res.message || 'Error al subir el archivo al servidor.';
          }
        },
        error: (err: any) => {
          this.subiendoArchivo.set(false);
          this.guardando.set(false);
          this.mensajeError = 'Error de conexión al subir el archivo.';
        }
      });
    } else {
      // Ya tiene URL (edición o manual)
      this.ejecutarGuardadoDocumento();
    }
  }

  private ejecutarGuardadoDocumento(): void {
    if (this.docEditandoId) {
      this.expedienteSvc.actualizarDocumento(this.docEditandoId, this.formDocumento).subscribe({
        next: (res) => {
          this.guardando.set(false);
          this.mostrarExito('Documento actualizado correctamente.');
          this.cerrarModal();
          this.cargarDatos();
        },
        error: (err) => {
          this.guardando.set(false);
          this.mensajeError = err.error?.Message || 'Error al actualizar el documento en base de datos.';
        }
      });
    } else {
      this.expedienteSvc.agregarDocumento(this.formDocumento).subscribe({
        next: (res) => {
          this.guardando.set(false);
          this.mostrarExito('Documento agregado correctamente.');
          this.cerrarModal();
          this.cargarDatos();
        },
        error: (err) => {
          this.guardando.set(false);
          this.mensajeError = err.error?.Message || 'Error al guardar el documento en base de datos.';
        }
      });
    }
  }

  eliminarDocumento(id: number) {
    if (confirm('¿Está seguro de que desea eliminar este documento?')) {
      this.expedienteSvc.eliminarDocumento(id).subscribe({
        next: () => {
          this.mostrarExito('Documento eliminado correctamente.');
          this.cargarDatos();
        },
        error: (err) => {
          this.mensajeError = err.error?.Message || 'Error al eliminar.';
        }
      });
    }
  }

  cerrarModal(): void {
    this.modalMode.set(null);
    this.docEditandoId = null;
    this.mensajeError = '';
  }

  // ── Helpers ──────────────────────────────────────────────────

  badgeVencido(doc: ExpedienteDocumentoEmpleadoResponse): string {
    if (!doc.fechaVencimiento) return 'badge-vigente';
    const hoy = new Date();
    const venc = new Date(doc.fechaVencimiento);
    const diff = Math.ceil((venc.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
    if (diff < 0) return 'badge-vencido';
    if (diff <= 30) return 'badge-por-vencer';
    return 'badge-vigente';
  }

  textoVencimiento(doc: ExpedienteDocumentoEmpleadoResponse): string {
    if (!doc.fechaVencimiento) return 'Sin vencimiento';
    const hoy = new Date();
    const venc = new Date(doc.fechaVencimiento);
    const diff = Math.ceil((venc.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
    if (diff < 0) return 'Vencido';
    if (diff === 0) return 'Vence hoy';
    if (diff <= 30) return `Vence en ${diff} día(s)`;
    return 'Vigente';
  }

  private docVacio(): ExpedienteDocumentoEmpleadoRequest {
    return {
      codigoExpEmp: '',
      codTipoDocumentoEmp: '',
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
