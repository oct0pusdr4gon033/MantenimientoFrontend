export interface ValeCreateRequest {
  id_ot: number | null;
  solicitado_por: string; // Nombre + Apellido1
  observaciones: string | null;
  materiales: ValeMaterialRequest[];
}

export interface ValeUpdateRequest {
  solicitado_por: string;
  observaciones: string | null;
  materiales: ValeMaterialRequest[];
}

export interface ValeMaterialRequest {
  id_material: number;
  cantidad_solicitada: number;
}

export interface ValeResponse {
  id_vale: number;
  cod_vale: string;
  id_ot: number | null;
  cod_ot: string | null;
  cod_equipo: string | null;
  estado: 'PENDIENTE' | 'DESPACHADO';
  fecha_creacion: string;
  fecha_despacho: string | null;
  solicitado_por: string;
  despachado_por: string | null;
  observaciones: string | null;
  materiales: ValeMaterialResponse[];
}

export interface ValeMaterialResponse {
  id_vale_material: number;
  id_material: number;
  cod_materia: string;
  descripcion: string;
  cantidad_solicitada: number;
  cantidad_despachada: number | null;
}

export interface ValeDispatchRequest {
  despachado_por: string; // Nombre + Apellido1
  materiales: ValeDispatchItemRequest[];
}

export interface ValeDispatchItemRequest {
  id_vale_material: number;
  cantidad_despachada: number;
}

export interface ReservedMaterialResponse {
  id_material: number;
  cod_materia: string;
  descripcion: string;
  cantidad_reservada: number;
}
