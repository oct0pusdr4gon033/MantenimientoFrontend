import { EstrategiaResponse } from './EstrategiaResponse';

export interface PlanMantenimientoActividadRequest {
  id_actividad: number;
  nombre_actividad?: string;
  cod_sistema?: string;
  id_detalle_estrg: number;
  id_material?: number | null;
  cantidad?: number | null;
}

export interface PlanMantenimientoActividadResponse {
  id_plan_mant: number;       // parte de la clave compuesta (reemplaza el surrogate id_plan_actividad)
  id_actividad: number;
  nombre_actividad?: string;
  descripcion_actividad?: string;
  cod_sistema?: string;
  id_detalle_estrg: number;
  tipo_pm?: string;
  id_material?: number | null;
  cod_materia?: string;
  descripcion_material?: string;
  cantidad?: number | null;
}

export interface PlanMantenimientoPersonalRequest {
  id_rol: number;
  cantidad: number;
}

export interface PlanMantenimientoPersonalResponse {
  id_plan_personal: number;
  id_rol: number;
  nombre_rol?: string;
  cantidad: number;
}

export interface PlanMantenimientoRequest {
  id_estrategia: number;
  fecha_creacion?: string | Date;
  estado: boolean;
  actividades: PlanMantenimientoActividadRequest[];
  personales: PlanMantenimientoPersonalRequest[];
}

export interface PlanMantenimientoUpdateRequest {
  id_estrategia: number;
  estado: boolean;
  actividades: PlanMantenimientoActividadRequest[];
  personales: PlanMantenimientoPersonalRequest[];
}

export interface PlanMantenimientoResponse {
  id_plan_mant: number;
  id_estrategia: number;
  fecha_creacion: string;
  estado: boolean;
  estrategia?: EstrategiaResponse | null;
  actividades: PlanMantenimientoActividadResponse[];
  personales: PlanMantenimientoPersonalResponse[];
}

export interface SelectedActividadRow {
  id_actividad: number;
  nombre_actividad: string;
  descripcion: string;
  nombre_sistema?: string;
}

export interface SelectedPersonalRow {
  id_rol: number;
  nombre_rol: string;
  cantidad: number;
}
