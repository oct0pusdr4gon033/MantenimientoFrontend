export interface EmpleadoRequest {
    dni_empleado: string;
    codigo_empleado?: string;
    nombre: string;
    apellido1: string;
    apellido2?: string;
    telf?: string;
    email?: string;
    id_rol: number;
    estado?: boolean;
    password_hash?: string;
}
