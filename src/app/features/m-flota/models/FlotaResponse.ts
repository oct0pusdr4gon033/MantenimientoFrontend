export interface FlotaResponse {
    idFlota: number;
    codFlota: string;
    nombreFlota: string;
    tipoControl: string;
    // Jerarquía del modelo
    idModelo: number;
    nombreModelo: string;
    nombreMarca: string;
    nombreTipo: string;
}
