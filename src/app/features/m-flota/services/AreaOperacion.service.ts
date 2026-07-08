import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ApiResponse } from '../../../core/interfaces/ApiResponse';
import { AreaOperacionResponse } from '../models/AreaOperacionResponse';
import { AreaOperacionRequest } from '../models/AreaOperacionRequest';

@Injectable({
    providedIn: 'root'
})
export class AreaOperacionService {

    private http = inject(HttpClient)
    private apiUrl = `${environment.apiUrl}/AreaOperacion`;


    //crear areas 
    // 1. POST: Agregar nueva
    agregarArea(request: AreaOperacionRequest): Observable<ApiResponse<string>> {
        return this.http.post<ApiResponse<string>>(`${this.apiUrl}/agregar`, request);
    }

    //listar areas
    // 2. GET   : Listar todas las áreas
    listarAreas(): Observable<ApiResponse<AreaOperacionResponse[]>> {
        return this.http.get<ApiResponse<AreaOperacionResponse[]>>(`${this.apiUrl}/listar`)
    }
    //buscar codigo
    // 3. GET: Buscar por Código
    buscarPorCodigo(codigo: string): Observable<ApiResponse<AreaOperacionResponse>> {
        return this.http.get<ApiResponse<AreaOperacionResponse>>(`${this.apiUrl}/buscar/codigo/${codigo}`);
    }
    //buscar nonbre
    // 4. GET: Buscar por Nombre
    buscarPorNombre(nombre: string): Observable<ApiResponse<AreaOperacionResponse[]>> {
        return this.http.get<ApiResponse<AreaOperacionResponse[]>>(`${this.apiUrl}/buscar/nombre/${nombre}`);
    }

    // 5. PUT: Actualizar área por Código
    actualizarArea(codigo: string, request: AreaOperacionRequest): Observable<ApiResponse<string>> {
        return this.http.put<ApiResponse<string>>(`${this.apiUrl}/actualizar/${codigo}`, request);
    }

    // 6. DELETE: Eliminar área por Código
    eliminarArea(codigo: string): Observable<ApiResponse<string>> {
        return this.http.delete<ApiResponse<string>>(`${this.apiUrl}/eliminar/${codigo}`);
    }

}
