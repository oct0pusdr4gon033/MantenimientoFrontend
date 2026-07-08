import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import * as XLSX from 'xlsx';

// Servicios
import { OrdenTrabajoService } from '../../services/orden-trabajo.service';
import { MaterialService } from '../../../almacen/services/material.service';

// Interfaces / Modelos
import { OrdenTrabajoResponse, CambiarEstadoOTRequest, OTMaterialCierreRequest, OTPersonalResponse, EmpleadoDisponibleResponse } from '../../models/orden-trabajo';
import { MaterialResponse } from '../../../almacen/models/material';

@Component({
  selector: 'app-ot-detalle',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './ot-detalle.html',
  styleUrls: ['./ot-detalle.css']
})
export class OTDetalleComponent implements OnInit {
  private svc = inject(OrdenTrabajoService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private matSvc = inject(MaterialService);

  idOt: number = 0;
  ot = signal<OrdenTrabajoResponse | null>(null);
  cargando = signal(false);
  guardando = signal(false);
  mensajeError = signal('');
  mensajeExito = signal('');

  // Control de Modal de Cierre
  showCierreModal = signal(false);
  horometroCierre = signal<number | null>(null);
  observacionesCierre = signal('');
  horaIntervencionCierre = signal<string>('');

  // Control de Modales de Edición Extra
  showAddActividadModal = signal(false);
  showAddMaterialModal = signal(false);
  showAddPersonalModal = signal(false);

  // Formulario de Actividad Extra
  nuevaActividadNombre = signal('');
  nuevaActividadSistema = signal('');
  nuevaActividadTipoPm = signal('General');

  // Formulario de Material Extra
  materialesCatalog = signal<MaterialResponse[]>([]);
  busquedaMaterialCatalog = signal('');
  nuevoMaterialId = signal<number | null>(null);
  nuevoMaterialCantidad = signal<number>(1);

  // Formulario de Personal Extra
  empleadosCatalog = signal<EmpleadoDisponibleResponse[]>([]);
  busquedaPersonalCatalog = signal('');
  nuevoPersonalDni = signal<string | null>(null);

  // Selector de personal filtrado
  empleadosCatalogFiltrados = computed(() => {
    const q = this.busquedaPersonalCatalog().toLowerCase().trim();
    if (!q) return this.empleadosCatalog();
    return this.empleadosCatalog().filter(e =>
      e.dni_empleado.includes(q) ||
      e.nombre.toLowerCase().includes(q) ||
      e.apellido1.toLowerCase().includes(q) ||
      (e.apellido2 && e.apellido2.toLowerCase().includes(q)) ||
      e.nombreRol.toLowerCase().includes(q)
    );
  });

  empleadoSeleccionado = computed(() => {
    const dni = this.nuevoPersonalDni();
    if (!dni) return null;
    return this.empleadosCatalog().find(e => e.dni_empleado === dni) || null;
  });

  // Selector de material filtrado
  materialesCatalogFiltrados = computed(() => {
    const q = this.busquedaMaterialCatalog().toLowerCase().trim();
    if (!q) return this.materialesCatalog();
    return this.materialesCatalog().filter(m =>
      m.cod_materia?.toLowerCase().includes(q) ||
      m.descripcion?.toLowerCase().includes(q)
    );
  });

  materialSeleccionado = computed(() => {
    const id = this.nuevoMaterialId();
    if (!id) return null;
    return this.materialesCatalog().find(m => m.id_material === id) || null;
  });

  // Estado temporal de edición para el cierre
  materialesCierre = signal<Map<number, number>>(new Map()); // id_ot_material -> cantidad_utilizada
  actividadesCompletadas = signal<Set<number>>(new Set()); // id_ot_actividad

  ngOnInit() {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.idOt = Number(idParam);
      this.cargarDetalle();
      this.cargarCatalogoMateriales();
    }
  }

  cargarCatalogoMateriales() {
    this.matSvc.getMateriales().subscribe({
      next: (res) => this.materialesCatalog.set(res.data ?? []),
      error: () => this.mostrarError('No se pudo cargar el catálogo de repuestos.')
    });
  }

  cargarDetalle() {
    this.cargando.set(true);
    this.svc.getById(this.idOt).subscribe({
      next: (res) => {
        this.ot.set(res.data ?? null);
        this.cargando.set(false);
        this.inicializarDatosCierre();
      },
      error: () => {
        this.mostrarError('No se pudo cargar el detalle de la orden de trabajo.');
        this.cargando.set(false);
      }
    });
  }

  inicializarDatosCierre() {
    const data = this.ot();
    if (!data) return;

    // Inicializar materiales
    const matMap = new Map<number, number>();
    data.materiales.forEach(m => {
      matMap.set(m.id_ot_material, m.cantidad_utilizada ?? m.cantidad_requerida);
    });
    this.materialesCierre.set(matMap);

    // Inicializar actividades
    const actSet = new Set<number>();
    data.actividades.forEach(a => {
      if (a.estado_ejecucion === 'COMPLETADA') {
        actSet.add(a.id_ot_actividad);
      }
    });
    this.actividadesCompletadas.set(actSet);

    // Sugerir horómetro
    this.horometroCierre.set(data.horometro_al_momento);

    // Inicializar hora de intervención
    if (data.hora_intervencion) {
      const d = new Date(data.hora_intervencion);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const hours = String(d.getHours()).padStart(2, '0');
      const minutes = String(d.getMinutes()).padStart(2, '0');
      this.horaIntervencionCierre.set(`${year}-${month}-${day}T${hours}:${minutes}`);
    } else {
      this.horaIntervencionCierre.set('');
    }
  }

  // --- Transición de Estados Básica ---
  iniciarTrabajo() {
    this.guardando.set(true);
    const req: CambiarEstadoOTRequest = {
      nuevo_estado: 'ACTIVA',
      materiales_utilizados: [],
      ids_actividades_completadas: []
    };
    this.svc.cambiarEstado(this.idOt, req).subscribe({
      next: (res) => {
        this.ot.set(res.data ?? null);
        this.mostrarExito('La Orden de Trabajo se ha iniciado y está ACTIVA.');
        this.guardando.set(false);
      },
      error: (err) => {
        this.mostrarError(this.obtenerErrorMsg(err, 'Error al iniciar la orden de trabajo.'));
        this.guardando.set(false);
      }
    });
  }

  anularTrabajo() {
    if (!confirm('¿Está seguro de que desea anular esta Orden de Trabajo? Esta acción no se puede deshacer.')) return;
    this.guardando.set(true);
    const req: CambiarEstadoOTRequest = {
      nuevo_estado: 'INACTIVA',
      materiales_utilizados: [],
      ids_actividades_completadas: []
    };
    this.svc.cambiarEstado(this.idOt, req).subscribe({
      next: (res) => {
        this.ot.set(res.data ?? null);
        this.mostrarExito('La Orden de Trabajo ha sido ANULADA.');
        this.guardando.set(false);
      },
      error: (err) => {
        this.mostrarError(this.obtenerErrorMsg(err, 'Error al anular la orden de trabajo.'));
        this.guardando.set(false);
      }
    });
  }

  enviarARevision() {
    this.guardando.set(true);
    // Para revisión podemos enviar la lista actual de actividades marcadas como completadas temporalmente
    const data = this.ot();
    const completadasList = data?.actividades
      .filter(a => a.estado_ejecucion === 'COMPLETADA')
      .map(a => a.id_ot_actividad) ?? [];

    const req: CambiarEstadoOTRequest = {
      nuevo_estado: 'EN_REVISION',
      materiales_utilizados: [],
      ids_actividades_completadas: completadasList
    };
    this.svc.cambiarEstado(this.idOt, req).subscribe({
      next: (res) => {
        this.ot.set(res.data ?? null);
        this.mostrarExito('Trabajos enviados para su revisión y aprobación.');
        this.guardando.set(false);
      },
      error: (err) => {
        this.mostrarError(this.obtenerErrorMsg(err, 'Error al enviar a revisión.'));
        this.guardando.set(false);
      }
    });
  }

  // --- Flujo de Cierre (Modal) ---
  abrirCierreModal() {
    this.inicializarDatosCierre();
    this.showCierreModal.set(true);
  }

  cerrarCierreModal() {
    this.showCierreModal.set(false);
  }

  toggleActividadCierre(idAct: number) {
    const s = new Set(this.actividadesCompletadas());
    if (s.has(idAct)) s.delete(idAct);
    else s.add(idAct);
    this.actividadesCompletadas.set(s);
  }

  actualizarMaterialCantidadCierre(idMat: number, cant: number) {
    if (cant < 0) return;
    const m = new Map(this.materialesCierre());
    m.set(idMat, cant);
    this.materialesCierre.set(m);
  }

  procesarCierre() {
    const horometro = this.horometroCierre();
    const otData = this.ot();
    if (!otData) return;

    if (!horometro || horometro < otData.horometro_al_momento) {
      this.mostrarError(`El horómetro de cierre no puede ser menor al horómetro inicial (${otData.horometro_al_momento} H).`);
      return;
    }

    if (otData.tipo_ot === 'CORRECTIVA' && !this.horaIntervencionCierre()) {
      this.mostrarError('Debe especificar la hora en que se empezó a intervenir el equipo.');
      return;
    }

    this.guardando.set(true);

    // Mapear materiales
    const materialesReq: OTMaterialCierreRequest[] = [];
    this.materialesCierre().forEach((cantidad, id_ot_material) => {
      materialesReq.push({ id_ot_material, cantidad_utilizada: cantidad });
    });

    const req: CambiarEstadoOTRequest = {
      nuevo_estado: 'CERRADA',
      horometro_cierre: horometro,
      observaciones: this.observacionesCierre(),
      materiales_utilizados: materialesReq,
      ids_actividades_completadas: Array.from(this.actividadesCompletadas()),
      hora_intervencion: otData.tipo_ot === 'CORRECTIVA' && this.horaIntervencionCierre() ? new Date(this.horaIntervencionCierre()).toISOString() : undefined
    };

    this.svc.cambiarEstado(this.idOt, req).subscribe({
      next: (res) => {
        this.ot.set(res.data ?? null);
        this.mostrarExito('La Orden de Trabajo ha sido CERRADA y aprobada correctamente.');
        this.cerrarCierreModal();
        this.guardando.set(false);
      },
      error: (err) => {
        this.mostrarError(this.obtenerErrorMsg(err, 'Error al cerrar la orden de trabajo.'));
        this.guardando.set(false);
      }
    });
  }

  // --- Exportación ---
  exportarExcel() {
    const data = this.ot();
    if (!data) return;

    const info = [
      { Campo: 'Código OT', Valor: data.cod_ot },
      { Campo: 'Tipo OT', Valor: data.tipo_ot },
      { Campo: 'Forma Generación', Valor: data.forma_generacion },
      { Campo: 'Estado', Valor: data.estado },
      { Campo: 'Equipo', Valor: data.cod_equipo },
      { Campo: 'Placa Equipo', Valor: data.placa_equipo },
      { Campo: 'Flota', Valor: data.nombre_flota },
      { Campo: 'Horómetro al Generar', Valor: `${data.horometro_al_momento} H` },
      { Campo: 'Horómetro de Cierre', Valor: data.horometro_corte ? `${data.horometro_corte} H` : 'Pendiente' },
      { Campo: 'Fecha Creación', Valor: this.formatearFecha(data.fecha_creacion) },
      { Campo: 'Fecha Atención', Valor: data.fecha_atencion ? this.formatearFecha(data.fecha_atencion) : 'Pendiente' },
      { Campo: 'Hora de Intervención (Correctiva)', Valor: data.hora_intervencion ? this.formatearFecha(data.hora_intervencion) : 'N/A' },
      { Campo: 'Horómetro de Falla (Correctiva)', Valor: data.horometro_falla ? `${data.horometro_falla} H` : 'N/A' },
      { Campo: 'Sistema Afectado', Valor: data.nombre_sistema ?? 'N/A' },
      { Campo: 'Subsistema Afectado', Valor: data.nombre_subsistema ?? 'N/A' },
      { Campo: 'Descripción de Falla', Valor: data.descripcion_falla ?? 'N/A' },
      { Campo: 'Observaciones', Valor: data.observaciones ?? '' }
    ];

    const wsInfo = XLSX.utils.json_to_sheet(info);

    const actividades = data.actividades.map(a => ({
      'Actividad': a.nombre_actividad,
      'Sistema': a.cod_sistema ?? 'N/A',
      'PM Asociado': a.tipo_pm ?? 'General',
      'Estado': a.estado_ejecucion,
      'Observación Técnica': a.observacion_tecnica ?? ''
    }));
    const wsActividades = XLSX.utils.json_to_sheet(actividades);

    const materiales = data.materiales.map(m => ({
      'Código': m.cod_materia ?? 'N/A',
      'Descripción': m.descripcion_material,
      'Cantidad Requerida': m.cantidad_requerida,
      'Cantidad Utilizada': m.cantidad_utilizada ?? 0
    }));
    const wsMateriales = XLSX.utils.json_to_sheet(materiales);

    const personal = data.personal.map(p => ({
      'DNI': p.dni_empleado,
      'Nombre Técnico': p.nombre_empleado,
      'Rol': p.rol ?? 'Técnico'
    }));
    const wsPersonal = XLSX.utils.json_to_sheet(personal);

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, wsInfo, 'Información General');
    XLSX.utils.book_append_sheet(wb, wsActividades, 'Hoja de Ruta (Actividades)');
    if (materiales.length > 0) XLSX.utils.book_append_sheet(wb, wsMateriales, 'Repuestos y Materiales');
    if (personal.length > 0) XLSX.utils.book_append_sheet(wb, wsPersonal, 'Personal Técnico');

    XLSX.writeFile(wb, `${data.cod_ot}.xlsx`);
    this.mostrarExito('Datos exportados a Excel.');
  }

  exportarPDF() {
    const data = this.ot();
    const tituloOriginal = document.title;
    if (data) {
      document.title = data.cod_ot;
    }
    window.print();
    setTimeout(() => {
      document.title = tituloOriginal;
    }, 100);
  }

  // --- Auxiliares ---
  regresar() {
    this.router.navigate(['/GestionMantenimiento/orden-trabajo']);
  }

  getEstadoClass(estado: string | undefined): string {
    if (!estado) return '';
    const map: Record<string, string> = {
      PENDIENTE:   'estado-pendiente',
      ACTIVA:      'estado-activa',
      EN_REVISION: 'estado-revision',
      CERRADA:     'estado-cerrada',
      INACTIVA:    'estado-inactiva'
    };
    return map[estado] ?? '';
  }

  getEstadoLabel(estado: string | undefined): string {
    if (!estado) return '';
    const map: Record<string, string> = {
      PENDIENTE:   'Pendiente',
      ACTIVA:      'Activa',
      EN_REVISION: 'En Revisión',
      CERRADA:     'Cerrada',
      INACTIVA:    'Inactiva'
    };
    return map[estado] ?? estado;
  }

  formatearFecha(fecha: string | undefined): string {
    if (!fecha) return '-';
    return new Date(fecha).toLocaleDateString('es-PE', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  }

  esEditable(): boolean {
    const estado = this.ot()?.estado;
    return estado === 'PENDIENTE' || estado === 'ACTIVA' || estado === 'EN_REVISION';
  }

  // --- Gestión de Actividades Extra ---
  abrirAddActividadModal() {
    this.nuevaActividadNombre.set('');
    this.nuevaActividadSistema.set('');
    this.nuevaActividadTipoPm.set('General');
    this.showAddActividadModal.set(true);
  }

  cerrarAddActividadModal() {
    this.showAddActividadModal.set(false);
  }

  agregarActividad() {
    const nombre = this.nuevaActividadNombre().trim();
    if (!nombre) {
      this.mostrarError('El nombre de la actividad es requerido.');
      return;
    }

    this.guardando.set(true);
    const req = {
      nombre_actividad: nombre,
      cod_sistema: this.nuevaActividadSistema().trim(),
      tipo_pm: this.nuevaActividadTipoPm().trim()
    };

    this.svc.addActividadExtra(this.idOt, req).subscribe({
      next: (res) => {
        const currentOt = this.ot();
        if (currentOt && res.data) {
          const updatedOt = {
            ...currentOt,
            actividades: [...currentOt.actividades, res.data]
          };
          this.ot.set(updatedOt);
        }
        this.mostrarExito('Actividad adicional agregada con éxito.');
        this.cerrarAddActividadModal();
        this.guardando.set(false);
      },
      error: (err) => {
        this.mostrarError(this.obtenerErrorMsg(err, 'Error al agregar la actividad.'));
        this.guardando.set(false);
      }
    });
  }

  removerActividad(idActividad: number) {
    if (!confirm('¿Está seguro de que desea eliminar esta actividad de la orden de trabajo?')) return;
    this.guardando.set(true);
    this.svc.removeActividadExtra(idActividad).subscribe({
      next: () => {
        const currentOt = this.ot();
        if (currentOt) {
          const updatedOt = {
            ...currentOt,
            actividades: currentOt.actividades.filter(a => a.id_ot_actividad !== idActividad)
          };
          this.ot.set(updatedOt);
        }
        this.mostrarExito('Actividad eliminada con éxito.');
        this.guardando.set(false);
      },
      error: (err) => {
        this.mostrarError(this.obtenerErrorMsg(err, 'Error al eliminar la actividad.'));
        this.guardando.set(false);
      }
    });
  }

  // --- Gestión de Materiales Extra ---
  abrirAddMaterialModal() {
    this.busquedaMaterialCatalog.set('');
    this.nuevoMaterialId.set(null);
    this.nuevoMaterialCantidad.set(1);
    this.showAddMaterialModal.set(true);
  }

  cerrarAddMaterialModal() {
    this.showAddMaterialModal.set(false);
  }

  seleccionarMaterialDelCatalogo(mat: MaterialResponse) {
    this.nuevoMaterialId.set(mat.id_material);
  }

  agregarMaterial() {
    const idMat = this.nuevoMaterialId();
    const cant = this.nuevoMaterialCantidad();

    if (!idMat) {
      this.mostrarError('Debe seleccionar un material del catálogo.');
      return;
    }
    if (cant <= 0) {
      this.mostrarError('La cantidad requerida debe ser mayor a cero.');
      return;
    }

    this.guardando.set(true);
    const req = {
      id_material_ref: idMat,
      cantidad_requerida: cant
    };

    this.svc.addMaterialExtra(this.idOt, req).subscribe({
      next: (res) => {
        const currentOt = this.ot();
        if (currentOt && res.data) {
          const updatedOt = {
            ...currentOt,
            materiales: [...currentOt.materiales, res.data]
          };
          this.ot.set(updatedOt);
        }
        this.mostrarExito('Material adicional agregado con éxito.');
        this.cerrarAddMaterialModal();
        this.guardando.set(false);
      },
      error: (err) => {
        this.mostrarError(this.obtenerErrorMsg(err, 'Error al agregar el material.'));
        this.guardando.set(false);
      }
    });
  }

  removerMaterial(idMaterial: number) {
    if (!confirm('¿Está seguro de que desea eliminar este material/repuesto de la orden de trabajo?')) return;
    this.guardando.set(true);
    this.svc.removeMaterialExtra(idMaterial).subscribe({
      next: () => {
        const currentOt = this.ot();
        if (currentOt) {
          const updatedOt = {
            ...currentOt,
            materiales: currentOt.materiales.filter(m => m.id_ot_material !== idMaterial)
          };
          this.ot.set(updatedOt);
        }
        this.mostrarExito('Material eliminado con éxito.');
        this.guardando.set(false);
      },
      error: (err) => {
        this.mostrarError(this.obtenerErrorMsg(err, 'Error al eliminar el material.'));
        this.guardando.set(false);
      }
    });
  }

  // --- Gestión de Personal Extra ---
  abrirAddPersonalModal() {
    this.busquedaPersonalCatalog.set('');
    this.nuevoPersonalDni.set(null);
    this.showAddPersonalModal.set(true);
    this.cargarTecnicosDisponibles();
  }

  cerrarAddPersonalModal() {
    this.showAddPersonalModal.set(false);
  }

  cargarTecnicosDisponibles() {
    this.svc.getTecnicosDisponibles(this.idOt).subscribe({
      next: (res) => this.empleadosCatalog.set(res.data ?? []),
      error: () => this.mostrarError('No se pudo cargar el catálogo de técnicos.')
    });
  }

  seleccionarPersonalDelCatalogo(emp: EmpleadoDisponibleResponse) {
    if (!emp.disponible) return;
    this.nuevoPersonalDni.set(emp.dni_empleado);
  }

  agregarPersonal() {
    const dni = this.nuevoPersonalDni();
    if (!dni) {
      this.mostrarError('Debe seleccionar un técnico de la lista.');
      return;
    }

    this.guardando.set(true);
    this.svc.addPersonalExtra(this.idOt, { dni_empleado: dni }).subscribe({
      next: (res) => {
        const currentOt = this.ot();
        if (currentOt && res.data) {
          const updatedOt = {
            ...currentOt,
            personal: [...currentOt.personal, res.data]
          };
          this.ot.set(updatedOt);
        }
        this.mostrarExito('Técnico asignado con éxito.');
        this.cerrarAddPersonalModal();
        this.guardando.set(false);
      },
      error: (err) => {
        this.mostrarError(this.obtenerErrorMsg(err, 'Error al asignar el técnico.'));
        this.guardando.set(false);
      }
    });
  }

  removerPersonal(idOtPersonal: number) {
    if (!confirm('¿Está seguro de que desea retirar a este técnico de la orden de trabajo?')) return;
    this.guardando.set(true);
    this.svc.removePersonalExtra(idOtPersonal).subscribe({
      next: () => {
        const currentOt = this.ot();
        if (currentOt) {
          const updatedOt = {
            ...currentOt,
            personal: currentOt.personal.filter(p => p.id_ot_personal !== idOtPersonal)
          };
          this.ot.set(updatedOt);
        }
        this.mostrarExito('Técnico retirado con éxito.');
        this.guardando.set(false);
      },
      error: (err) => {
        this.mostrarError(this.obtenerErrorMsg(err, 'Error al retirar al técnico.'));
        this.guardando.set(false);
      }
    });
  }

  private obtenerErrorMsg(err: any, defaultMsg: string): string {
    return err?.error?.message ?? err?.error?.Message ?? err?.error?.title ?? defaultMsg;
  }

  private mostrarError(msg: string) {
    this.mensajeError.set(msg);
    setTimeout(() => this.mensajeError.set(''), 5000);
  }

  private mostrarExito(msg: string) {
    this.mensajeExito.set(msg);
    setTimeout(() => this.mensajeExito.set(''), 3000);
  }
}
