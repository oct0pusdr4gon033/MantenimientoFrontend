export interface EstrategiaDetalleRequest {
    umbral_mant: number;
    tolerancia_inf: number;
    tolerancia_sup: number;
    porcentaje_tol: number;
    nombre_medida: string;
    uni_med: string;
    tipo_pm: string;
}

export interface EstrategiaRequest {
    cod_estrategia: string;
    titulo_estrategia: string;
    id_flota?: number | null;
    id_equipo?: number | null;
    estado: string;
    detalles: EstrategiaDetalleRequest[];
}
