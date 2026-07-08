export interface MaterialRequest {
  id_unidad: number;
  id_categoria: number;
  cod_materia: string;
  descripcion: string;
  stock: number;
  estado: string; // 'AGOTADO' | 'STOCK' | 'MINIMO' | 'ACTIVO' | 'INACTIVO'
}

export interface MaterialUpdateRequest {
  id_unidad: number;
  id_categoria: number;
  cod_materia: string;
  descripcion: string;
  estado: string;
}

export interface MaterialResponse {
  id_material: number;
  id_unidad: number;
  nombre_unidad: string;
  id_categoria: number;
  nombre_categoria: string;
  cod_materia: string;
  descripcion: string;
  stock: number;
  estado: string;
}
