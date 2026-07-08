export interface ExpedienteEmpleadoResponse {
    codigoExpEmp: string;
    dniEmpleado: string;
    nombreCompleto: string;
    codigoEmpleado: string;
    documentos: ExpedienteDocumentoEmpleadoResponse[];
}

export interface ExpedienteDocumentoEmpleadoResponse {
    idExpedienteDocumentoEmp: number;
    codigoExpEmp: string;
    codTipoDocumentoEmp: string;
    nombreTipoDocumento: string;
    fechaRegistro: string;
    fechaVencimiento?: string | null;
    documentoUrl: string;
    estaVencido: boolean;
}

export interface ExpedienteEmpleadoRequest {
    codigoExpEmp: string;
    dniEmpleado: string;
}

export interface ExpedienteDocumentoEmpleadoRequest {
    codigoExpEmp: string;
    codTipoDocumentoEmp: string;
    fechaRegistro: string;
    fechaVencimiento?: string | null;
    documentoUrl?: string;
}

export interface TipoDocumentoEmpleadoResponse {
    codTipoDocumentoEmp: string;
    nombreTipo: string;
}

export interface TipoDocumentoEmpleadoRequest {
    codTipoDocumentoEmp: string;
    nombreTipo: string;
}
