export interface ExpedienteDocumentoResponse {
    idExpedienteDocumento: number;
    codigoExp: string;
    codTipoDocumento: string;
    nombreTipoDocumento: string;
    fechaRegistro: string;        // ISO date string
    fechaVencimiento: string;     // ISO date string
    documentoUrl: string;
    estaVencido: boolean;
}
