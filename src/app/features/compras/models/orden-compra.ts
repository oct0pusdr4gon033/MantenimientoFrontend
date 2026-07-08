export interface OrdenCompraRequest {
  id_cotizacion?: number | null;
  ruc_proveedor: string;
  detalles: OrdenCompraDetalleRequest[];
}

export interface OrdenCompraDetalleRequest {
  id_material: number;
  cantidad: number;
  precio_unitario: number;
}

export interface OrdenCompraResponse {
  id_orden_compra: number;
  nro_orden: string;
  id_cotizacion?: number | null;
  nro_cotizacion?: string;
  ruc_proveedor: string;
  razon_social_proveedor: string;
  fecha_orden: string | Date;
  estado: string;
  total: number;
  detalles: OrdenCompraDetalleResponse[];
}

export interface OrdenCompraDetalleResponse {
  id_orden_detalle: number;
  id_material: number;
  cod_materia: string;
  descripcion_material: string;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
}
