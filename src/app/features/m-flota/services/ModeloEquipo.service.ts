import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ApiResponse } from '../../../core/interfaces/ApiResponse';
import { ModeloEquipoRequest } from '../models/ModeloEquipoRequest';
import { ModeloEquipoResponse } from '../models/ModeloEquipoResponse';

@Injectable({
  providedIn: 'root'
})
export class ModeloEquipoService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/ModeloEquipo`;

  // GET: Listar todos los modelos
  listar(): Observable<ApiResponse<ModeloEquipoResponse[]>> {
    return this.http.get<ApiResponse<ModeloEquipoResponse[]>>(`${this.apiUrl}/listar`);
  }

  // POST: Crear nuevo modelo
  crear(request: ModeloEquipoRequest): Observable<ApiResponse<string>> {
    return this.http.post<ApiResponse<string>>(`${this.apiUrl}/crear`, request);
  }

  // PUT: Actualizar modelo por ID
  actualizar(id: number, request: ModeloEquipoRequest): Observable<ApiResponse<string>> {
    return this.http.put<ApiResponse<string>>(`${this.apiUrl}/actualizar/${id}`, request);
  }

  // GET: Buscar modelo por ID
  buscarPorId(id: number): Observable<ApiResponse<ModeloEquipoResponse>> {
    return this.http.get<ApiResponse<ModeloEquipoResponse>>(`${this.apiUrl}/buscar/${id}`);
  }
}
