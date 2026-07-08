export interface MovimientoInventarioResponse {
  id_movimiento: number;
  id_material: number;
  fecha: string;
  tipo_movimiento: 'ENTRADA' | 'SALIDA';
  cantidad: number;
  saldo_stock: number;
  origen_tipo: 'INICIAL' | 'ENTRADA_MANUAL' | 'NOTA_SALIDA' | 'AJUSTE';
  origen_referencia: string;
  responsable: string;
  observaciones: string | null;
  cod_ot: string | null; // Muestra la OT vinculada si la salida viene de un vale de OT
}

export interface StockInflowRequest {
  cantidad: number;
  responsable: string;
  observaciones: string | null;
}
