export interface ExpedienteDocumentoRequest {
    codigoExp: string;
    codTipoDocumento: string;
    fechaRegistro: string;       // ISO date string (YYYY-MM-DD)
    fechaVencimiento: string;    // ISO date string (YYYY-MM-DD)
    documentoUrl: string;
}
