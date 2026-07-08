export interface HistorialHorometroRequest {
    dni_conductor: string;
    id_equipo: number;
    lectura_anterior: number;
    lectura_actual: number;
    horas_operadas: number;
    observaciones: string;
}
