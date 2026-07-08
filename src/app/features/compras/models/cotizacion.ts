export interface CotizacionRequest {
  id_solicitud_pedido?: number | null;
  ruc_proveedor: string;
  detalles: CotizacionDetalleRequest[];
}

export interface CotizacionDetalleRequest {
  id_material: number;
  cantidad: number;
  precio_unitario: number;
}

export interface CotizacionResponse {
  id_cotizacion: number;
  nro_cotizacion: string;
  id_solicitud_pedido?: number | null;
  cod_solicitud_pedido?: string;
  ruc_proveedor: string;
  razon_social_proveedor: string;
  fecha_cotizacion: string | Date;
  estado: string;
  total: number;
  detalles: CotizacionDetalleResponse[];
}

export interface CotizacionDetalleResponse {
  id_cotizacion_detalle: number;
  id_material: number;
  cod_materia: string;
  descripcion_material: string;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
}
