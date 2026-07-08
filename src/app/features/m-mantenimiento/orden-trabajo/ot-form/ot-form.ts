import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';

// Servicios
import { OrdenTrabajoService } from '../../services/orden-trabajo.service';
import { EquipoService } from '../../../m-flota/services/Equipo.service';
import { EmpleadoService } from '../../../m-administracion/empleados/services/Empleado.service';
import { MaterialService } from '../../../almacen/services/material.service';
import { PlanMantenimientoService } from '../../services/plan-mantenimiento.service';
import { SistemaEquipoService } from '../../services/sistema-equipo.service';

// Interfaces / Modelos
import { OrdenTrabajoCreateRequest, MaterialOTForm } from '../../models/orden-trabajo';
import { EquipoResponse } from '../../../m-flota/models/EquipoResponse';
import { EmpleadoResponse } from '../../../m-administracion/empleados/models/EmpleadoResponse';
import { MaterialResponse } from '../../../almacen/models/material';
import { PlanMantenimientoResponse } from '../../models/plan-mantenimiento';
import { SistemaEquipoResponse, SubSistemaResponse } from '../../models/sistema-equipo';

@Component({
  selector: 'app-ot-form',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './ot-form.html',
  styleUrls: ['./ot-form.css']
})
export class OTFormComponent implements OnInit {
  private svc = inject(OrdenTrabajoService);
  private eqpSvc = inject(EquipoService);
  private empSvc = inject(EmpleadoService);
  private matSvc = inject(MaterialService);
  private planSvc = inject(PlanMantenimientoService);
  private sistSvc = inject(SistemaEquipoService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  private queryParamsProcesados = false;

  // Form State
  tipoOt = signal<'PREVENTIVA' | 'CORRECTIVA'>('PREVENTIVA');
  observaciones = signal('');
  cargando = signal(false);
  guardando = signal(false);
  mensajeError = signal('');
  mensajeExito = signal('');

  // Corrective fields
  horaIntervencion = signal<string>('');
  descripcionFalla = signal<string>('');
  sistemaSeleccionadoId = signal<number | null>(null);
  subsistemaSeleccionadoId = signal<number | null>(null);
  horometroFalla = signal<number | null>(null);

  // Entidades Seleccionadas
  equipoSeleccionado = signal<EquipoResponse | null>(null);
  personalSeleccionado = signal<EmpleadoResponse[]>([]);
  materialesSeleccionados = signal<MaterialOTForm[]>([]);
  pmsSeleccionados = signal<number[]>([]); // id_detalle_estrg del PM para Preventiva manual

  // Listas de datos para Catálogos y Modales
  equipos = signal<EquipoResponse[]>([]);
  personal = signal<EmpleadoResponse[]>([]);
  materiales = signal<MaterialResponse[]>([]);
  planes = signal<PlanMantenimientoResponse[]>([]);
  sistemas = signal<SistemaEquipoResponse[]>([]);
  subsistemas = signal<SubSistemaResponse[]>([]);

  // Datos derivados del Equipo Seleccionado (Plan de Mantenimiento asociado)
  planAsociado = signal<PlanMantenimientoResponse | null>(null);

  // Visibilidad de Modales
  showEquipoModal = signal(false);
  showPersonalModal = signal(false);
  showMaterialModal = signal(false);

  // Filtros de búsqueda en Modales
  busquedaEquipo = signal('');
  busquedaPersonal = signal('');
  busquedaMaterial = signal('');

  // Control para añadir cantidad de material
  cantidadMaterialTemp = signal<number>(1);
  materialSeleccionadoTemp = signal<MaterialResponse | null>(null);

  // Computeds para filtrado en modales
  equiposFiltrados = computed(() => {
    const q = this.busquedaEquipo().toLowerCase().trim();
    if (!q) return this.equipos();
    return this.equipos().filter(e =>
      e.codEqp?.toLowerCase().includes(q) ||
      e.placaEqp?.toLowerCase().includes(q) ||
      e.nombreFlota?.toLowerCase().includes(q)
    );
  });

  personalFiltrado = computed(() => {
    const q = this.busquedaPersonal().toLowerCase().trim();
    const yaSeleccionados = this.personalSeleccionado().map(p => p.dni_empleado);
    // Filtrar los que ya están seleccionados
    const list = this.personal().filter(p => !yaSeleccionados.includes(p.dni_empleado));
    if (!q) return list;
    return list.filter(p =>
      p.nombre?.toLowerCase().includes(q) ||
      p.apellido1?.toLowerCase().includes(q) ||
      p.dni_empleado?.toLowerCase().includes(q) ||
      p.nombreRol?.toLowerCase().includes(q)
    );
  });

  materialesFiltrados = computed(() => {
    const q = this.busquedaMaterial().toLowerCase().trim();
    if (!q) return this.materiales();
    return this.materiales().filter(m =>
      m.cod_materia?.toLowerCase().includes(q) ||
      m.descripcion?.toLowerCase().includes(q)
    );
  });

  ngOnInit() {
    this.cargarCatalogos();
  }

  cargarCatalogos() {
    this.cargando.set(true);
    // Cargar Equipos
    this.eqpSvc.listar().subscribe({
      next: (res) => {
        this.equipos.set(res.data ?? []);
        this.procesarQueryParams();
      },
      error: () => this.mostrarError('Error al cargar la lista de equipos.')
    });

    // Cargar Personal (Activos) — Filtrando solo Tecnico Mecanico (id_rol === 10)
    this.empSvc.obtenerActivos().subscribe({
      next: (res) => {
        const todos = res.data ?? [];
        this.personal.set(todos.filter(p => p.id_rol === 10));
      },
      error: () => this.mostrarError('Error al cargar la lista de personal.')
    });

    // Cargar Materiales
    this.matSvc.getMateriales().subscribe({
      next: (res) => this.materiales.set(res.data ?? []),
      error: () => this.mostrarError('Error al cargar catálogo de materiales.')
    });

    // Cargar Planes de Mantenimiento para resolver el plan asociado al equipo
    this.planSvc.getAll().subscribe({
      next: (res) => {
        this.planes.set(res.data ?? []);
        this.cargando.set(false);
        this.procesarQueryParams();
      },
      error: () => {
        this.mostrarError('Error al cargar planes de mantenimiento.');
        this.cargando.set(false);
      }
    });

    // Cargar Sistemas
    this.sistSvc.getSistemas().subscribe({
      next: (res) => this.sistemas.set(res.data ?? []),
      error: () => this.mostrarError('Error al cargar catálogo de sistemas.')
    });
  }

  procesarQueryParams() {
    if (this.queryParamsProcesados) return;
    if (this.equipos().length === 0 || this.planes().length === 0) return;

    this.queryParamsProcesados = true;
    this.route.queryParams.subscribe(params => {
      const idEquipo = Number(params['id_equipo']);
      const idPlanMant = Number(params['id_plan_mant']);
      const tipoPm = params['tipo_pm'];

      if (idEquipo) {
        const matched = this.equipos().find(e => e.idEquipo === idEquipo);
        if (matched) {
          this.seleccionarEquipo(matched);

          // Once planAsociado is resolved, preselect the PM level if passed
          if (idPlanMant && tipoPm) {
            const plan = this.planAsociado();
            if (plan && plan.estrategia?.detalles) {
              const detail = plan.estrategia.detalles.find(d => d.tipo_pm === tipoPm);
              if (detail) {
                this.pmsSeleccionados.set([detail.id_detalle_estrg]);
              }
            }
          }
        }
      }
    });
  }

  // Cargar subsistemas al cambiar de sistema
  onSistemaChange(idSistema: any) {
    const numericId = Number(idSistema);
    if (!numericId) {
      this.sistemaSeleccionadoId.set(null);
      this.subsistemaSeleccionadoId.set(null);
      this.subsistemas.set([]);
      return;
    }

    this.sistemaSeleccionadoId.set(numericId);
    this.subsistemaSeleccionadoId.set(null);
    this.subsistemas.set([]);

    this.sistSvc.getSubsistemas(numericId).subscribe({
      next: (res) => this.subsistemas.set(res.data ?? []),
      error: () => this.mostrarError('Error al cargar subsistemas del sistema seleccionado.')
    });
  }

  onSubsistemaChange(idSubsistema: any) {
    const numericId = Number(idSubsistema);
    this.subsistemaSeleccionadoId.set(numericId || null);
  }

  // Cambiar Tipo OT
  setTipoOt(tipo: 'PREVENTIVA' | 'CORRECTIVA') {
    this.tipoOt.set(tipo);
    if (tipo === 'PREVENTIVA') {
      this.materialesSeleccionados.set([]); // Los materiales de preventiva vienen del plan
    } else {
      this.pmsSeleccionados.set([]); // Las correctivas no tienen PMs
    }
  }

  // --- Modales ---
  abrirEquipoModal() {
    this.busquedaEquipo.set('');
    this.showEquipoModal.set(true);
  }

  cerrarEquipoModal() {
    this.showEquipoModal.set(false);
  }

  seleccionarEquipo(equipo: EquipoResponse) {
    this.equipoSeleccionado.set(equipo);
    this.cerrarEquipoModal();
    this.resolverPlanDeEquipo(equipo);
  }

  resolverPlanDeEquipo(equipo: EquipoResponse) {
    // Buscar un plan activo cuya estrategia esté asociada a este equipo o a su flota
    const plan = this.planes().find(p => p.estado && (
      p.estrategia?.id_equipo === equipo.idEquipo ||
      p.estrategia?.id_flota === equipo.idFlota
    ));

    if (plan) {
      this.planAsociado.set(plan);
      // Preseleccionar los PMs que tiene configurados la estrategia por defecto
      if (plan.estrategia?.detalles) {
        // Por defecto, no marcamos ninguno hasta que el usuario decida,
        // o podemos marcar todos por defecto. Dejémoslo vacío pero listo para seleccionar.
        this.pmsSeleccionados.set([]);
      }
    } else {
      this.planAsociado.set(null);
      this.pmsSeleccionados.set([]);
      if (this.tipoOt() === 'PREVENTIVA') {
        this.mostrarError(`El equipo ${equipo.codEqp} no cuenta con un Plan de Mantenimiento Activo.`);
      }
    }
  }

  abrirPersonalModal() {
    this.busquedaPersonal.set('');
    this.showPersonalModal.set(true);
  }

  cerrarPersonalModal() {
    this.showPersonalModal.set(false);
  }

  seleccionarPersonal(empleado: EmpleadoResponse) {
    const list = this.personalSeleccionado();
    if (!list.find(p => p.dni_empleado === empleado.dni_empleado)) {
      this.personalSeleccionado.set([...list, empleado]);
    }
    this.cerrarPersonalModal();
  }

  removerPersonal(dni: string) {
    this.personalSeleccionado.set(
      this.personalSeleccionado().filter(p => p.dni_empleado !== dni)
    );
  }

  abrirMaterialModal() {
    this.busquedaMaterial.set('');
    this.materialSeleccionadoTemp.set(null);
    this.cantidadMaterialTemp.set(1);
    this.showMaterialModal.set(true);
  }

  cerrarMaterialModal() {
    this.showMaterialModal.set(false);
  }

  seleccionarMaterialTemp(mat: MaterialResponse) {
    this.materialSeleccionadoTemp.set(mat);
  }

  confirmarMaterial() {
    const mat = this.materialSeleccionadoTemp();
    const cant = this.cantidadMaterialTemp();
    if (!mat || cant <= 0) return;

    const actual = this.materialesSeleccionados();
    const repetido = actual.find(m => m.id_material_ref === mat.id_material);

    if (repetido) {
      // Sumar cantidad
      repetido.cantidad_requerida += cant;
      this.materialesSeleccionados.set([...actual]);
    } else {
      // Agregar nuevo
      const nuevo: MaterialOTForm = {
        id_material_ref: mat.id_material,
        cod_materia: mat.cod_materia,
        descripcion_material: mat.descripcion,
        cantidad_requerida: cant
      };
      this.materialesSeleccionados.set([...actual, nuevo]);
    }

    this.cerrarMaterialModal();
  }

  removerMaterial(idMat: number) {
    this.materialesSeleccionados.set(
      this.materialesSeleccionados().filter(m => m.id_material_ref !== idMat)
    );
  }

  togglePM(idDetalle: number) {
    const seleccionados = this.pmsSeleccionados();
    if (seleccionados.includes(idDetalle)) {
      this.pmsSeleccionados.set(seleccionados.filter(id => id !== idDetalle));
    } else {
      this.pmsSeleccionados.set([...seleccionados, idDetalle]);
    }
  }

  decrementarCantidad() {
    this.cantidadMaterialTemp.set(Math.max(1, this.cantidadMaterialTemp() - 1));
  }

  incrementarCantidad() {
    this.cantidadMaterialTemp.set(this.cantidadMaterialTemp() + 1);
  }

  // Guardar Formulario
  guardar() {
    const equipo = this.equipoSeleccionado();
    if (!equipo) {
      this.mostrarError('Debe seleccionar un equipo.');
      return;
    }

    const plan = this.planAsociado();
    if (this.tipoOt() === 'PREVENTIVA' && !plan) {
      this.mostrarError('El equipo debe tener un plan de mantenimiento activo para crear una OT preventiva.');
      return;
    }

    if (this.tipoOt() === 'PREVENTIVA' && this.pmsSeleccionados().length === 0) {
      this.mostrarError('Debe seleccionar al menos un nivel PM (ej: PM1, PM2) para la OT preventiva.');
      return;
    }

    if (this.tipoOt() === 'CORRECTIVA') {
      if (this.horometroFalla() === null || this.horometroFalla()! < 0) {
        this.mostrarError('Debe especificar un horómetro de falla válido.');
        return;
      }
      if (!this.sistemaSeleccionadoId()) {
        this.mostrarError('Debe seleccionar el sistema afectado.');
        return;
      }
      if (!this.subsistemaSeleccionadoId()) {
        this.mostrarError('Debe seleccionar el subsistema afectado.');
        return;
      }
      if (!this.descripcionFalla() || !this.descripcionFalla().trim()) {
        this.mostrarError('Debe describir la falla o el trabajo a realizar.');
        return;
      }
    }

    this.guardando.set(true);

    // Si es correctiva, el backend requiere un id_plan_mant, podemos usar el plan del equipo o 0 si no tiene.
    // Pero como en base de datos id_plan_mant es FK obligatorio de Man_PlanMantenimiento, debemos pasar
    // obligatoriamente un id_plan_mant existente. Si el equipo no tiene plan activo, mostraremos error o buscaremos
    // un plan genérico.
    const planId = plan ? plan.id_plan_mant : 0;
    if (planId === 0) {
      // Si es correctiva y no tiene plan activo, busquemos el primer plan activo del catálogo para no fallar por FK
      const primerPlan = this.planes().find(p => p.estado);
      if (!primerPlan) {
        this.mostrarError('No existen planes de mantenimiento activos en el sistema para asociar la orden de trabajo.');
        this.guardando.set(false);
        return;
      }
    }

    const request: OrdenTrabajoCreateRequest = {
      tipo_ot: this.tipoOt(),
      id_equipo: equipo.idEquipo,
      id_plan_mant: plan ? plan.id_plan_mant : this.planes().find(p => p.estado)!.id_plan_mant,
      observaciones: this.observaciones(),
      creado_por: 'Jefe Mantenimiento', // Simulado o sacado de auth
      ids_detalle_estrg: this.tipoOt() === 'PREVENTIVA' ? this.pmsSeleccionados() : [],
      personal_dni: this.personalSeleccionado().map(p => p.dni_empleado),
      materiales: this.tipoOt() === 'CORRECTIVA' ? this.materialesSeleccionados() : [],
      
      hora_intervencion: this.tipoOt() === 'CORRECTIVA' && this.horaIntervencion() ? new Date(this.horaIntervencion()).toISOString() : undefined,
      descripcion_falla: this.tipoOt() === 'CORRECTIVA' ? this.descripcionFalla() : undefined,
      id_sistema: this.tipoOt() === 'CORRECTIVA' ? this.sistemaSeleccionadoId() || undefined : undefined,
      id_subsistema: this.tipoOt() === 'CORRECTIVA' ? this.subsistemaSeleccionadoId() || undefined : undefined,
      horometro_falla: this.tipoOt() === 'CORRECTIVA' ? this.horometroFalla() || undefined : undefined
    };

    this.svc.create(request).subscribe({
      next: (res) => {
        this.mostrarExito('Orden de trabajo creada exitosamente.');
        setTimeout(() => {
          this.router.navigate(['/GestionMantenimiento/orden-trabajo']);
        }, 1500);
      },
      error: (err) => {
        console.error('[OT-FORM] Error al crear OT:', err);
        console.error('[OT-FORM] Backend response body:', err.error);
        console.error('[OT-FORM] Payload enviado:', request);
        const msg = err.error?.message ?? err.error?.Message ?? err.error?.title ?? JSON.stringify(err.error) ?? 'Error al guardar la orden de trabajo.';
        this.mostrarError(msg);
        this.guardando.set(false);
      }
    });
  }

  cancelar() {
    this.router.navigate(['/GestionMantenimiento/orden-trabajo']);
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
