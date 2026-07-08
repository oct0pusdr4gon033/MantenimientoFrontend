import { ApiResponse } from "../interfaces/ApiResponse";

export class ApiResponseHelper<T> implements ApiResponse<T> {

    success: boolean = false;
    message: string = "";
    data: T | null = null;

    constructor(success: boolean, message: string, data: T | null) {
        this.success = success;
        this.message = message;
        this.data = data;
    }
    static fail<T>(message: string): ApiResponse<T> {
        return new ApiResponseHelper<T>(false, message, null);
    }
    static successResult<T>(data: T, mensaje: string = "¡¡Operacion Exitosa!!"): ApiResponse<T> {
        return { success: true, message: mensaje, data };
    }

}