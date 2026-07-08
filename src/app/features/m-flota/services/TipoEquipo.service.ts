import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ApiResponse } from '../../../core/interfaces/ApiResponse';
import { TipoEquipoRequest } from '../models/TipoEquipoRequest';
import { TipoEquipoResponse } from '../models/TipoEquipoResponse';
@Injectable({
    providedIn: 'root'
})
export class TipoEquipoService {
    private http = inject(HttpClient);
    private apiUrl = `${environment.apiUrl}/TipoEquipo`; // Adjust URL if necessary
    // 1. GET: Listar todos los tipos de equipo
    listar(): Observable<ApiResponse<TipoEquipoResponse[]>> {
        return this.http.get<ApiResponse<TipoEquipoResponse[]>>(`${this.apiUrl}/listar`);
    }
    // 2. POST: Crear nuevo tipo de equipo
    crear(request: TipoEquipoRequest): Observable<ApiResponse<string>> {
        return this.http.post<ApiResponse<string>>(`${this.apiUrl}/crear`, request);
    }
    // 3. PUT: Actualizar tipo de equipo por ID
    actualizar(id: number, request: TipoEquipoRequest): Observable<ApiResponse<string>> {
        return this.http.put<ApiResponse<string>>(`${this.apiUrl}/actualizar/${id}`, request);
    }
    // 4. GET: Buscar por filtro de texto
    buscarPorFiltro(texto: string): Observable<ApiResponse<TipoEquipoResponse[]>> {
        return this.http.get<ApiResponse<TipoEquipoResponse[]>>(`${this.apiUrl}/buscar/filtro/${texto}`);
    }
    // 5. GET: Buscar por ID
    buscarPorId(id: number): Observable<ApiResponse<TipoEquipoResponse>> {
        return this.http.get<ApiResponse<TipoEquipoResponse>>(`${this.apiUrl}/buscar/${id}`);
    }
}
