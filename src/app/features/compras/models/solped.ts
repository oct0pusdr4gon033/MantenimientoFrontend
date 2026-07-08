export interface SolicitudPedidoRequest {
  dni_empleado: string;
  detalles: SolicitudPedidoDetalleRequest[];
}

export interface SolicitudPedidoDetalleRequest {
  id_material?: number | null;
  cod_materia?: string;
  nombre?: string;
  id_categoria?: number | null;
  id_unidad?: number | null;
  stock_minimo: number;
  cantidad_pedida: number;
  ruc_proveedor: string;
  nuevo_proveedor?: any;
  es_nuevo_producto: boolean;
  especificaciones?: string;
  precio_referencial?: number;
}

export interface SolicitudPedidoResponse {
  id_solicitud_pedido: number;
  cod_solicitud: string;
  dni_empleado: string;
  nombre_empleado: string;
  fecha_creacion: string | Date;
  estado: string;
  detalles: SolicitudPedidoDetalleResponse[];
}

export interface SolicitudPedidoDetalleResponse {
  id_detalle: number;
  id_material?: number | null;
  cod_materia: string;
  nombre: string;
  id_categoria?: number | null;
  nombre_categoria: string;
  id_unidad?: number | null;
  nombre_unidad: string;
  stock_minimo: number;
  cantidad_pedida: number;
  ruc_proveedor: string;
  razon_social_proveedor: string;
  es_nuevo_producto: boolean;
  especificaciones: string;
  precio_referencial?: number;
}
