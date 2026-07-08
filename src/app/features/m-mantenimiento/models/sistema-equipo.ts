export interface SistemaEquipoResponse {
    id_sistema: number;
    cod_sist: string;
    nombre_sist: string;
}

export interface SistemaEquipoRequest {
    cod_sist: string;
    nombre_sist: string;
}

export interface SistemaEquipoUpdateRequest {
    nombre_sist: string;
}

export interface SubSistemaResponse {
    id_subsistema: number;
    cod_subsist: string;
    nombre_subsist: string;
    id_sistema: number;
}
