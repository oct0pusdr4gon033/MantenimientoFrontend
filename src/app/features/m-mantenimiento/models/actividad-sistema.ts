export interface ActividadSistemaResponse {
    id_actividad: number;
    cod_act: string;
    id_sistema: number;
    nombre_actividad: string;
    descripcion: string;
    duracion: number;
    medida_duracion: string;
    estado: boolean;
    // Assuming backend might join SistemaEquipo, but let's stick to DTO fields
}

export interface ActividadSistemaRequest {
    id_sistema: number;
    nombre_actividad: string;
    descripcion: string;
    duracion: number;
    medida_duracion: string;
    estado: boolean;
}

export interface ActividadSistemaUpdateRequest {
    nombre_actividad: string;
    descripcion: string;
    duracion: number;
    medida_duracion: string;
    estado: boolean;
}
