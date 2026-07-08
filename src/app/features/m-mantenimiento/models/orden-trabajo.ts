// ── Modelos de OT para el frontend ─────────────────────────

export interface OTPlanDetalleResponse {
  id_detalle_estrg: number;
  tipo_pm: string;
  umbral_mant: number;
  uni_med: string;
}

export interface OTActividadResponse {
  id_ot_actividad: number;
  nombre_actividad: string;
  cod_sistema?: string;
  tipo_pm?: string;
  estado_ejecucion: 'PENDIENTE' | 'COMPLETADA';
  observacion_tecnica?: string;
}

export interface OTMaterialResponse {
  id_ot_material: number;
  cod_materia?: string;
  descripcion_material: string;
  cantidad_requerida: number;
  cantidad_utilizada?: number;
}

export interface OTPersonalResponse {
  id_ot_personal: number;
  dni_empleado: string;
  nombre_empleado: string;
  rol?: string;
}

export interface OrdenTrabajoResponse {
  id_ot: number;
  cod_ot: string;
  tipo_ot: 'PREVENTIVA' | 'CORRECTIVA';
  forma_generacion: 'AUTO' | 'MANUAL';
  estado: 'PENDIENTE' | 'ACTIVA' | 'EN_REVISION' | 'CERRADA' | 'INACTIVA';
  horometro_al_momento: number;
  horometro_corte?: number;
  fecha_creacion: string;
  fecha_atencion?: string;
  observaciones?: string;
  creado_por?: string;

  // Correctivas
  hora_intervencion?: string;
  descripcion_falla?: string;
  id_sistema?: number;
  nombre_sistema?: string;
  id_subsistema?: number;
  nombre_subsistema?: string;
  horometro_falla?: number;

  // Equipo
  id_equipo: number;
  cod_equipo: string;
  placa_equipo: string;
  num_serie?: string;
  nombre_flota?: string;
  marca?: string;
  modelo?: string;

  // Plan
  id_plan_mant: number;
  titulo_estrategia?: string;

  pms_incluidos: OTPlanDetalleResponse[];
  actividades: OTActividadResponse[];
  materiales: OTMaterialResponse[];
  personal: OTPersonalResponse[];
}

// ── Requests ────────────────────────────────────────────────

export interface OrdenTrabajoCreateRequest {
  tipo_ot: 'PREVENTIVA' | 'CORRECTIVA';
  id_equipo: number;
  id_plan_mant: number;
  observaciones?: string;
  creado_por?: string;
  ids_detalle_estrg: number[];
  personal_dni?: string[];
  materiales?: MaterialOTForm[];

  // Correctivas
  hora_intervencion?: string;
  descripcion_falla?: string;
  id_sistema?: number;
  id_subsistema?: number;
  horometro_falla?: number;
}

export interface OTMaterialCierreRequest {
  id_ot_material: number;
  cantidad_utilizada: number;
}

export interface CambiarEstadoOTRequest {
  nuevo_estado: string;
  horometro_cierre?: number;
  observaciones?: string;
  materiales_utilizados: OTMaterialCierreRequest[];
  ids_actividades_completadas: number[];
  hora_intervencion?: string;
}

// ── Extras para el form ─────────────────────────────────────

export interface MaterialOTForm {
  id_material_ref: number;
  cod_materia: string;
  descripcion_material: string;
  cantidad_requerida: number;
}

export interface PersonalOTForm {
  dni_empleado: string;
  nombre_empleado: string;
  rol?: string;
}

export interface EmpleadoDisponibleResponse {
  dni_empleado: string;
  codigo_empleado: string;
  nombre: string;
  apellido1: string;
  apellido2: string;
  id_rol: number;
  nombreRol: string;
  disponible: boolean;
  motivo_no_disponible?: string;
  ots_hoy: number;
}

