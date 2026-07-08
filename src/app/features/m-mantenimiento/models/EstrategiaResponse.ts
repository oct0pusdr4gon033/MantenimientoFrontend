export interface EstrategiaDetalleResponse {
    id_detalle_estrg: number;
    id_estrategia: number;
    umbral_mant: number;
    tolerancia_inf: number;
    tolerancia_sup: number;
    porcentaje_tol: number;
    nombre_medida: string;
    uni_med: string;
    tipo_pm: string;
}

export interface EstrategiaResponse {
    id_estrategia: number;
    cod_estrategia: string;
    titulo_estrategia: string;
    id_flota?: number | null;
    cod_flota?: string | null;
    nombre_flota?: string | null;
    id_equipo?: number | null;
    cod_equipo?: string | null;
    estado: string;
    detalles: EstrategiaDetalleResponse[];
}
