import { EquipoResponse } from './EquipoResponse';

export interface FlotaDetalleResponse {
    idFlota: number;
    codFlota: string;
    nombreFlota: string;
    tipoControl: string;
    idModelo: number;
    nombreModelo: string;
    nombreMarca: string;
    nombreTipo: string;
    totalEquipos: number;
    equipos: EquipoResponse[];
}
