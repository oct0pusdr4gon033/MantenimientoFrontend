import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import * as XLSX from 'xlsx';
import { PlanMantenimientoService } from '../../services/plan-mantenimiento.service';
import { EstrategiaService } from '../../services/estrategia.service';
import { ActividadSistemaService } from '../../services/actividad-sistema.service';
import { SistemaEquipoService } from '../../services/sistema-equipo.service';
import { MaterialService } from '../../../almacen/services/material.service';
import { RolService } from '../../../m-administracion/empleados/services/Rol.service';

import { EstrategiaResponse, EstrategiaDetalleResponse } from '../../models/EstrategiaResponse';
import { ActividadSistemaResponse } from '../../models/actividad-sistema';
import { SistemaEquipoResponse } from '../../models/sistema-equipo';
import { MaterialResponse } from '../../../almacen/models/material';
import { RolResponse } from '../../../m-administracion/empleados/models/RolResponse';
import { 
  PlanMantenimientoRequest, 
  PlanMantenimientoUpdateRequest,
  PlanMantenimientoActividadResponse,
  SelectedPersonalRow 
} from '../../models/plan-mantenimiento';

@Component({
  selector: 'app-plan-mantenimiento-form',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './plan-mantenimiento-form.html',
  styleUrls: ['./plan-mantenimiento-form.css']
})
export class PlanMantenimientoFormComponent implements OnInit {
  private svc = inject(PlanMantenimientoService);
  private estSvc = inject(EstrategiaService);
  private actSvc = inject(ActividadSistemaService);
  private sistSvc = inject(SistemaEquipoService);
  private matSvc = inject(MaterialService);
  private rolSvc = inject(RolService);
  
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  // ── Modos e Identificadores ────────────────────────────────
  idPlan: number = 0;
  isEditMode: boolean = false;
  cargando = signal(false);
  guardando = signal(false);

  // ── Listas Generales (para catálogos) ───────────────────────
  estrategias = signal<EstrategiaResponse[]>([]);
  detallesFiltrados = signal<EstrategiaDetalleResponse[]>([]);
  roles = signal<RolResponse[]>([]);

  // ── Campos de Formulario Base ──────────────────────────────
  selectedEstrategiaId: number = 0;
  estado: boolean = true;
  fecha_creacion: string = new Date().toISOString().substring(0, 16); // format for datetime-local

  // ── Colección Única (Hoja de Ruta) ──────────────────────────
  selectedActividades = signal<PlanMantenimientoActividadResponse[]>([]);
  selectedPersonales = signal<SelectedPersonalRow[]>([]);

  // ── Modal de Selección de Actividades (Manual) ─────────────
  showActividadModal = signal(false);
  sistemas = signal<SistemaEquipoResponse[]>([]);
  sistemaSeleccionadoId = signal<number>(0);
  actividadesDeSistema = signal<ActividadSistemaResponse[]>([]);
  todasLasActividades: ActividadSistemaResponse[] = []; // caché local para filtrado
  actividadesChequeadas = signal<Set<number>>(new Set());
  modalTipoPmId = signal<number>(0);

  // ── Modal de Selección de Materiales (Asignar a Fila) ──────
  showMaterialModal = signal(false);
  todosLosMateriales = signal<MaterialResponse[]>([]);
  filtroMaterialBusqueda = signal('');
  materialSeleccionado: MaterialResponse | null = null;
  cantidadMaterial: number = 1;
  editingRowIndexForMaterial = signal<number | null>(null);

  // ── Sección Personal (Inline Combobox) ─────────────────────
  rolSeleccionadoId: number = 0;
  cantidadPersonal: number = 1;

  // Notificaciones
  mensajeError = signal('');
  mensajeExito = signal('');

  // ── Filtro Reactivo de Materiales ──────────────────────────
  materialesFiltrados = computed(() => {
    const q = this.filtroMaterialBusqueda().toLowerCase().trim();
    if (!q) return this.todosLosMateriales();
    return this.todosLosMateriales().filter(m => 
      m.cod_materia.toLowerCase().includes(q) || 
      m.descripcion.toLowerCase().includes(q)
    );
  });

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.idPlan = Number(idParam);
      this.isEditMode = true;
    }

    // Leer parámetros de consulta si vienen desde la pantalla de detalle de estrategia
    this.route.queryParams.subscribe(params => {
      if (params['id_estrategia']) {
        this.selectedEstrategiaId = Number(params['id_estrategia']);
      }
    });

    this.cargarCatalogos();
  }

  cargarCatalogos(): void {
    this.cargando.set(true);

    this.estSvc.listar().subscribe({
      next: (estData: any) => {
        const estList = Array.isArray(estData) ? estData : (estData?.data ?? []);
        this.estrategias.set(estList);

        if (this.selectedEstrategiaId > 0) {
          const est = estList.find((e: any) => e.id_estrategia === this.selectedEstrategiaId);
          if (est) {
            this.detallesFiltrados.set(est.detalles ?? []);
          }
        }

        this.rolSvc.listar().subscribe({
          next: (rolRes) => {
            this.roles.set(rolRes.data ?? []);

            this.sistSvc.getSistemas().subscribe({
              next: (sistRes) => {
                this.sistemas.set(sistRes.data ?? []);

                this.actSvc.getActividades().subscribe({
                  next: (actRes) => {
                    this.todasLasActividades = actRes.data ?? [];

                    this.matSvc.getMateriales().subscribe({
                      next: (matRes) => {
                        this.todosLosMateriales.set(matRes.data ?? []);
                        
                        if (this.isEditMode) {
                          this.cargarPlanExistente();
                        } else {
                          this.cargando.set(false);
                        }
                      },
                      error: () => this.tratarErrorCarga()
                    });
                  },
                  error: () => this.tratarErrorCarga()
                });
              },
              error: () => this.tratarErrorCarga()
            });
          },
          error: () => this.tratarErrorCarga()
        });
      },
      error: () => this.tratarErrorCarga()
    });
  }

  tratarErrorCarga(): void {
    this.mostrarError('Error al cargar la información requerida de catálogos.');
    this.cargando.set(false);
  }

  cargarPlanExistente(): void {
    this.svc.getById(this.idPlan).subscribe({
      next: (res) => {
        this.cargando.set(false);
        const plan = res.data;
        if (!plan) {
          this.mostrarError('El plan solicitado no existe o no se pudo leer.');
          return;
        }

        this.estado = plan.estado;
        this.selectedEstrategiaId = plan.id_estrategia;
        
        if (plan.fecha_creacion) {
          const date = new Date(plan.fecha_creacion);
          const offset = date.getTimezoneOffset();
          const localDate = new Date(date.getTime() - (offset * 60 * 1000));
          this.fecha_creacion = localDate.toISOString().substring(0, 16);
        }

        const matchedEst = this.estrategias().find(e => e.id_estrategia === plan.id_estrategia);
        if (matchedEst) {
          this.detallesFiltrados.set(matchedEst.detalles ?? []);
        }

        // Cargar Actividades (Hoja de Ruta)
        const planActividades = plan.actividades.map(a => ({
          id_plan_mant: a.id_plan_mant,
          id_actividad: a.id_actividad,
          nombre_actividad: a.nombre_actividad || '',
          descripcion_actividad: a.descripcion_actividad || '',
          cod_sistema: a.cod_sistema || '',
          id_detalle_estrg: a.id_detalle_estrg,
          tipo_pm: a.tipo_pm || '',
          id_material: a.id_material,
          cod_materia: a.cod_materia,
          descripcion_material: a.descripcion_material,
          cantidad: a.cantidad
        }));
        this.selectedActividades.set(planActividades);

        // Cargar Personal
        const planPersonal = plan.personales.map(p => ({
          id_rol: p.id_rol,
          nombre_rol: p.nombre_rol || 'Rol',
          cantidad: p.cantidad
        }));
        this.selectedPersonales.set(planPersonal);
      },
      error: () => {
        this.mostrarError('Error al leer los datos del plan de mantenimiento.');
        this.cargando.set(false);
      }
    });
  }

  onEstrategiaChange(): void {
    const estId = Number(this.selectedEstrategiaId);
    const est = this.estrategias().find(e => e.id_estrategia === estId);
    if (est) {
      this.detallesFiltrados.set(est.detalles ?? []);
    } else {
      this.detallesFiltrados.set([]);
    }
    // Limpiar actividades seleccionadas si cambia la estrategia ya que las anteriores pertenecían a otra estrategia
    this.selectedActividades.set([]);
  }

  // ── Lógica de Excel ────────────────────────────────────────
  onExcelUpload(event: any): void {
    const file = event.target.files[0];
    if (!file) return;

    if (this.selectedEstrategiaId <= 0) {
      this.mostrarError('Debe seleccionar una Estrategia antes de importar la Hoja de Ruta.');
      event.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = (e: any) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        const rawRows: any[] = XLSX.utils.sheet_to_json(worksheet);
        
        if (rawRows.length === 0) {
          this.mostrarError('El archivo Excel está vacío.');
          return;
        }

        const resolvedActividades: PlanMantenimientoActividadResponse[] = [];
        const details = this.detallesFiltrados();
        const systems = this.sistemas();
        const materials = this.todosLosMateriales();
        const activities = this.todasLasActividades;

        for (const row of rawRows) {
          const colPm = row['TIPO PM'] || row['Tipo PM'] || row['tipo pm'] || '';
          const colAct = row['ACTIVIDAD'] || row['Actividad'] || row['actividad'] || '';
          const colSist = row['COD-SISTEMA'] || row['Cod-Sistema'] || row['cod-sistema'] || row['COD_SISTEMA'] || row['SISTEMA'] || '';
          const colMat = row['MATERIAL'] || row['Material'] || row['material'] || '';
          const colCant = row['CANTIDAD'] || row['Cantidad'] || row['cantidad'] || null;

          if (!colAct || !colSist) continue;

          // 1. Resolver PM Level
          const normPm = String(colPm).toLowerCase().replace(/\s+/g, '');
          const matchedDetail = details.find(d => d.tipo_pm.toLowerCase().replace(/\s+/g, '') === normPm) 
            || details[0];
          
          const id_detalle_estrg = matchedDetail ? matchedDetail.id_detalle_estrg : 0;
          const tipo_pm = matchedDetail ? matchedDetail.tipo_pm : String(colPm);

          // 2. Resolver Sistema
          const normSist = String(colSist).trim().toLowerCase();
          const matchedSystem = systems.find(s => s.cod_sist.trim().toLowerCase() === normSist);
          const cod_sistema = matchedSystem ? matchedSystem.cod_sist : String(colSist);

          // 3. Resolver Actividad
          const normAct = String(colAct).trim().toLowerCase();
          const matchedAct = activities.find(a => 
            a.nombre_actividad.trim().toLowerCase() === normAct && 
            (matchedSystem ? a.id_sistema === matchedSystem.id_sistema : true)
          );

          let id_actividad = 0;
          let nombre_actividad = String(colAct).trim();
          let descripcion_actividad = String(colAct).trim();

          if (matchedAct) {
            id_actividad = matchedAct.id_actividad;
            nombre_actividad = matchedAct.nombre_actividad;
            descripcion_actividad = matchedAct.descripcion;
          }

          // 4. Resolver Material
          let id_material: number | null = null;
          let cod_materia: string | undefined = undefined;
          let descripcion_material: string | undefined = undefined;
          let cantidad: number | null = null;

          const colMatStr = String(colMat || '').trim();
          const normMatLower = colMatStr.toLowerCase();
          const isIgnorableMaterial = !colMatStr || normMatLower === '-' || normMatLower === 'ninguno' || 
                                     normMatLower === 'ningun' || normMatLower === 'ningún' || 
                                     normMatLower === 'ningun material' || normMatLower === 'ningún material' || 
                                     normMatLower === 'n/a' || normMatLower === 'na' || 
                                     normMatLower === 'sin material' || normMatLower === 's/m' || 
                                     normMatLower === 'no aplica';

          if (colMat && !isIgnorableMaterial) {
            const matchedMat = materials.find(m => 
              m.cod_materia.trim().toLowerCase() === normMatLower || 
              m.descripcion.trim().toLowerCase() === normMatLower
            );

            if (matchedMat) {
              id_material = matchedMat.id_material;
              cod_materia = matchedMat.cod_materia;
              descripcion_material = matchedMat.descripcion;
              cantidad = colCant ? Number(colCant) : 1;
            } else {
              cod_materia = colMatStr;
              descripcion_material = '(Material no encontrado)';
              cantidad = colCant ? Number(colCant) : 1;
            }
          }

          resolvedActividades.push({
            id_plan_mant: 0,
            id_actividad,
            nombre_actividad,
            descripcion_actividad,
            cod_sistema,
            id_detalle_estrg,
            tipo_pm,
            id_material,
            cod_materia,
            descripcion_material,
            cantidad
          });
        }

        let unregisteredSystemsCount = 0;
        let unregisteredMaterialsCount = 0;

        resolvedActividades.forEach(a => {
          const normSist = (a.cod_sistema || '').trim().toLowerCase();
          const systemExists = systems.some(s => s.cod_sist.trim().toLowerCase() === normSist);
          if (!systemExists) {
            unregisteredSystemsCount++;
          }

          if (a.cod_materia && !a.id_material) {
            unregisteredMaterialsCount++;
          }
        });

        this.selectedActividades.set(resolvedActividades);

        if (unregisteredSystemsCount > 0 || unregisteredMaterialsCount > 0) {
          let warningMsg = `Se importaron ${resolvedActividades.length} actividades, pero se detectaron inconsistencias con la Base de Datos: `;
          if (unregisteredSystemsCount > 0) {
            warningMsg += `[${unregisteredSystemsCount}] actividad(es) usan sistemas no registrados. `;
          }
          if (unregisteredMaterialsCount > 0) {
            warningMsg += `[${unregisteredMaterialsCount}] material(es) no están registrados. `;
          }
          warningMsg += 'Por favor, revise y resuelva las filas marcadas (en rojo/amarillo) antes de guardar el plan.';
          this.mostrarError(warningMsg);
        } else {
          this.mostrarExito(`Se importaron ${resolvedActividades.length} actividades correctamente.`);
        }
      } catch (err: any) {
        this.mostrarError('Error al leer el archivo Excel: ' + err.message);
      }
      event.target.value = '';
    };

    reader.readAsArrayBuffer(file);
  }

  sistemaExiste(cod: string | undefined): boolean {
    if (!cod) return false;
    const norm = cod.trim().toLowerCase();
    return this.sistemas().some(s => s.cod_sist.trim().toLowerCase() === norm);
  }


  // ── Lógica de Actividades Manuales ────────────────────────
  abrirActividadModal(): void {
    if (this.selectedEstrategiaId <= 0) {
      this.mostrarError('Debe seleccionar una Estrategia primero.');
      return;
    }
    this.sistemaSeleccionadoId.set(0);
    this.actividadesDeSistema.set([]);
    this.modalTipoPmId.set(this.detallesFiltrados().length > 0 ? this.detallesFiltrados()[0].id_detalle_estrg : 0);
    
    const actualSet = new Set<number>();
    this.selectedActividades().forEach(a => {
      if (a.id_actividad > 0) {
        actualSet.add(a.id_actividad);
      }
    });
    this.actividadesChequeadas.set(actualSet);

    this.showActividadModal.set(true);
  }

  cerrarActividadModal(): void {
    this.showActividadModal.set(false);
  }

  onSistemaChange(): void {
    const sistId = Number(this.sistemaSeleccionadoId());
    if (sistId > 0) {
      const filtered = this.todasLasActividades.filter(a => a.id_sistema === sistId && a.estado);
      this.actividadesDeSistema.set(filtered);
    } else {
      this.actividadesDeSistema.set([]);
    }
  }

  toggleActividadCheck(idActividad: number): void {
    const current = new Set(this.actividadesChequeadas());
    if (current.has(idActividad)) {
      current.delete(idActividad);
    } else {
      current.add(idActividad);
    }
    this.actividadesChequeadas.set(current);
  }

  confirmarActividades(): void {
    const checking = this.actividadesChequeadas();
    const currentList = [...this.selectedActividades()];
    const details = this.detallesFiltrados();
    const systems = this.sistemas();

    const selectedPmId = Number(this.modalTipoPmId());
    const matchedDetail = details.find(d => d.id_detalle_estrg === selectedPmId);
    const tipo_pm = matchedDetail ? matchedDetail.tipo_pm : '-';

    checking.forEach(id => {
      const alreadyExists = currentList.some(a => a.id_actividad === id && a.id_detalle_estrg === selectedPmId);
      if (alreadyExists) return;

      const act = this.todasLasActividades.find(a => a.id_actividad === id);
      if (act) {
        const sys = systems.find(s => s.id_sistema === act.id_sistema);
        currentList.push({
          id_plan_mant: 0,
          id_actividad: act.id_actividad,
          nombre_actividad: act.nombre_actividad,
          descripcion_actividad: act.descripcion,
          cod_sistema: sys ? sys.cod_sist : '-',
          id_detalle_estrg: selectedPmId,
          tipo_pm: tipo_pm,
          id_material: null,
          cod_materia: undefined,
          descripcion_material: undefined,
          cantidad: null
        });
      }
    });

    this.selectedActividades.set(currentList);
    this.cerrarActividadModal();
  }

  removerActividad(index: number): void {
    const list = [...this.selectedActividades()];
    list.splice(index, 1);
    this.selectedActividades.set(list);
  }

  onRowPmChange(index: number, newPmId: any): void {
    const list = [...this.selectedActividades()];
    const pmId = Number(newPmId);
    const matchedDetail = this.detallesFiltrados().find(d => d.id_detalle_estrg === pmId);
    if (matchedDetail) {
      list[index].id_detalle_estrg = pmId;
      list[index].tipo_pm = matchedDetail.tipo_pm;
      this.selectedActividades.set(list);
    }
  }

  // ── Lógica de Materiales por Fila ──────────────────────────
  abrirMaterialModal(index: number): void {
    this.editingRowIndexForMaterial.set(index);
    const row = this.selectedActividades()[index];
    this.materialSeleccionado = null;
    this.cantidadMaterial = row.cantidad || 1;
    this.filtroMaterialBusqueda.set('');
    this.showMaterialModal.set(true);
  }

  cerrarMaterialModal(): void {
    this.showMaterialModal.set(false);
    this.editingRowIndexForMaterial.set(null);
  }

  seleccionarMaterial(material: MaterialResponse): void {
    this.materialSeleccionado = material;
  }

  agregarMaterialConfirmado(): void {
    if (!this.materialSeleccionado) {
      this.mostrarError('Debe seleccionar un material de la lista.');
      return;
    }
    if (this.cantidadMaterial <= 0) {
      this.mostrarError('La cantidad debe ser mayor que cero.');
      return;
    }

    const index = this.editingRowIndexForMaterial();
    if (index !== null) {
      const list = [...this.selectedActividades()];
      list[index].id_material = this.materialSeleccionado.id_material;
      list[index].cod_materia = this.materialSeleccionado.cod_materia;
      list[index].descripcion_material = this.materialSeleccionado.descripcion;
      list[index].cantidad = this.cantidadMaterial;
      this.selectedActividades.set(list);
    }
    this.cerrarMaterialModal();
  }

  quitarMaterialDeActividad(index: number): void {
    const list = [...this.selectedActividades()];
    list[index].id_material = null;
    list[index].cod_materia = undefined;
    list[index].descripcion_material = undefined;
    list[index].cantidad = null;
    this.selectedActividades.set(list);
  }

  // ── Lógica de Personal (Inline) ───────────────────────────
  agregarPersonal(): void {
    const rolId = Number(this.rolSeleccionadoId);
    if (rolId <= 0) {
      this.mostrarError('Debe seleccionar un rol de personal.');
      return;
    }
    if (this.cantidadPersonal <= 0) {
      this.mostrarError('La cantidad de personas debe ser mayor que cero.');
      return;
    }

    const matchedRol = this.roles().find(r => r.id_rol === rolId);
    if (!matchedRol) return;

    const list = [...this.selectedPersonales()];
    const existIndex = list.findIndex(p => p.id_rol === rolId);

    if (existIndex > -1) {
      list[existIndex].cantidad += this.cantidadPersonal;
    } else {
      list.push({
        id_rol: matchedRol.id_rol,
        nombre_rol: matchedRol.nombre_rol,
        cantidad: this.cantidadPersonal
      });
    }

    this.selectedPersonales.set(list);
    this.rolSeleccionadoId = 0;
    this.cantidadPersonal = 1;
  }

  removerPersonal(index: number): void {
    const list = [...this.selectedPersonales()];
    list.splice(index, 1);
    this.selectedPersonales.set(list);
  }

  // ── Envío de Formulario (Guardar) ──────────────────────────
  guardar(): void {
    if (Number(this.selectedEstrategiaId) <= 0) {
      this.mostrarError('Debe seleccionar una Estrategia.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (this.selectedActividades().length === 0) {
      this.mostrarError('Debe registrar al menos una actividad en la hoja de ruta.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    // Validar si hay sistemas o materiales no registrados en la base de datos
    const systems = this.sistemas();
    const unregisteredSystems: string[] = [];
    const unregisteredMaterials: string[] = [];

    this.selectedActividades().forEach(a => {
      // Validar Sistema
      const normSist = (a.cod_sistema || '').trim().toLowerCase();
      const systemExists = systems.some(s => s.cod_sist.trim().toLowerCase() === normSist);
      if (!systemExists && normSist && !unregisteredSystems.includes(a.cod_sistema!)) {
        unregisteredSystems.push(a.cod_sistema!);
      }

      // Validar Material
      if (a.cod_materia && !a.id_material) {
        if (!unregisteredMaterials.includes(a.cod_materia)) {
          unregisteredMaterials.push(a.cod_materia);
        }
      }
    });

    if (unregisteredSystems.length > 0 || unregisteredMaterials.length > 0) {
      let errorMsg = 'No se puede guardar el plan: ';
      if (unregisteredSystems.length > 0) {
        errorMsg += `Sistemas no registrados en la BD: [${unregisteredSystems.join(', ')}]. `;
      }
      if (unregisteredMaterials.length > 0) {
        errorMsg += `Materiales no registrados en la BD: [${unregisteredMaterials.join(', ')}]. `;
      }
      errorMsg += 'Por favor, resuelva las filas marcadas o elimine esos elementos antes de guardar.';
      
      this.mostrarError(errorMsg);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    this.guardando.set(true);
    this.mensajeError.set('');

    const actsPayload = this.selectedActividades().map(a => ({
      id_actividad: a.id_actividad,
      nombre_actividad: a.id_actividad === 0 ? a.nombre_actividad : undefined,
      cod_sistema: a.id_actividad === 0 ? a.cod_sistema : undefined,
      id_detalle_estrg: a.id_detalle_estrg,
      id_material: a.id_material || null,
      cantidad: a.cantidad || null
    }));

    const persPayload = this.selectedPersonales().map(p => ({
      id_rol: p.id_rol,
      cantidad: p.cantidad
    }));

    if (this.isEditMode) {
      const payload: PlanMantenimientoUpdateRequest = {
        id_estrategia: Number(this.selectedEstrategiaId),
        estado: this.estado,
        actividades: actsPayload,
        personales: persPayload
      };

      this.svc.update(this.idPlan, payload).subscribe({
        next: (res) => {
          this.guardando.set(false);
          if (res.success) {
            this.mostrarExito('Plan de mantenimiento actualizado correctamente.');
            setTimeout(() => this.regresar(), 1500);
          } else {
            this.mostrarError(res.message || 'Error al guardar cambios.');
          }
        },
        error: (err) => {
          this.guardando.set(false);
          console.error('Error al guardar plan (update):', err);
          console.error('Error details (update):', JSON.stringify(err.error));
          const backendMsg = err?.error?.message || err?.error?.title || (err?.error?.errors ? JSON.stringify(err.error.errors) : null) || err?.message || 'Error de comunicación.';
          this.mostrarError(backendMsg);
        }
      });
    } else {
      const payload: PlanMantenimientoRequest = {
        id_estrategia: Number(this.selectedEstrategiaId),
        fecha_creacion: this.fecha_creacion ? new Date(this.fecha_creacion).toISOString() : undefined,
        estado: this.estado,
        actividades: actsPayload,
        personales: persPayload
      };

      this.svc.create(payload).subscribe({
        next: (res) => {
          this.guardando.set(false);
          if (res.success) {
            this.mostrarExito('Plan de mantenimiento registrado correctamente.');
            setTimeout(() => this.regresar(), 1500);
          } else {
            this.mostrarError(res.message || 'Error al registrar el plan.');
          }
        },
        error: (err) => {
          this.guardando.set(false);
          console.error('Error al guardar plan (create):', err);
          console.error('Error details (create):', JSON.stringify(err.error));
          const backendMsg = err?.error?.message || err?.error?.title || (err?.error?.errors ? JSON.stringify(err.error.errors) : null) || err?.message || 'Error de comunicación.';
          this.mostrarError(backendMsg);
        }
      });
    }
  }

  regresar(): void {
    this.router.navigate(['/GestionMantenimiento/plan-mantenimiento']);
  }

  private mostrarError(msg: string): void {
    this.mensajeExito.set('');
    this.mensajeError.set(msg);
    setTimeout(() => this.mensajeError.set(''), 5000);
  }

  private mostrarExito(msg: string): void {
    this.mensajeError.set('');
    this.mensajeExito.set(msg);
    setTimeout(() => this.mensajeExito.set(''), 3000);
  }
}
