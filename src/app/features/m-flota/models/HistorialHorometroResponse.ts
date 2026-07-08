export interface HistorialHorometroResponse {
    codigo_hist: string;
    dni_conductor: string;
    id_equipo: number;
    fecha_registro: string;
    lectura_anterior: number;
    lectura_actual: number;
    horas_operadas: number;
    observaciones: string;
}
