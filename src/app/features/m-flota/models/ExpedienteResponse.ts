import { ExpedienteDocumentoResponse } from './ExpedienteDocumentoResponse';

export interface ExpedienteResponse {
    codigoExp: string;
    idEquipo: number;
    codEquipo: string;
    placaEquipo: string;
    documentos: ExpedienteDocumentoResponse[];
}
