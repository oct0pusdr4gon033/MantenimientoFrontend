export interface EquipoResponse {
    idEquipo: number;
    codEqp: string;
    placaEqp: string;
    numSerie: string;
    horometroInicial: number;
    horometroActual: number;
    estadoOperativo: string;
    // Área de operación
    codAreaOpe: string;
    nombreArea: string;
    // Flota
    idFlota: number;
    codFlota: string;
    nombreFlota: string;
    // Modelo / Marca / Tipo
    nombreModelo: string;
    nombreMarca: string;
    nombreTipo: string;
}
