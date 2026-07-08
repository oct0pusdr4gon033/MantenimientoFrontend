import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ApiResponse } from '../../../core/interfaces/ApiResponse';
import { EquipoRequest } from '../models/EquipoRequest';
import { EquipoResponse } from '../models/EquipoResponse';

@Injectable({
  providedIn: 'root'
})
export class EquipoService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/Equipo`;

  // GET: Listar todos los equipos
  listar(): Observable<ApiResponse<EquipoResponse[]>> {
    return this.http.get<ApiResponse<EquipoResponse[]>>(`${this.apiUrl}/listar`);
  }

  // POST: Crear equipo
  crear(request: EquipoRequest): Observable<ApiResponse<string>> {
    return this.http.post<ApiResponse<string>>(`${this.apiUrl}/crear`, request);
  }

  // PUT: Actualizar equipo por ID
  actualizar(id: number, request: EquipoRequest): Observable<ApiResponse<string>> {
    return this.http.put<ApiResponse<string>>(`${this.apiUrl}/actualizar/${id}`, request);
  }

  // GET: Buscar por ID interno
  buscarPorId(id: number): Observable<ApiResponse<EquipoResponse>> {
    return this.http.get<ApiResponse<EquipoResponse>>(`${this.apiUrl}/buscar/id/${id}`);
  }

  // GET: Buscar por código
  buscarPorCodigo(codigo: string): Observable<ApiResponse<EquipoResponse>> {
    return this.http.get<ApiResponse<EquipoResponse>>(`${this.apiUrl}/buscar/codigo/${codigo}`);
  }

  // GET: Buscar por placa
  buscarPorPlaca(placa: string): Observable<ApiResponse<EquipoResponse>> {
    return this.http.get<ApiResponse<EquipoResponse>>(`${this.apiUrl}/buscar/placa/${placa}`);
  }

  // GET: Buscar por área de operación
  buscarPorArea(codArea: string): Observable<ApiResponse<EquipoResponse[]>> {
    return this.http.get<ApiResponse<EquipoResponse[]>>(`${this.apiUrl}/buscar/area/${codArea}`);
  }

  // GET: Buscar por código de flota
  buscarPorFlota(codFlota: string): Observable<ApiResponse<EquipoResponse[]>> {
    return this.http.get<ApiResponse<EquipoResponse[]>>(`${this.apiUrl}/buscar/flota/${codFlota}`);
  }

  // GET: Buscar por tipo de equipo
  buscarPorTipo(idTipoEqp: number): Observable<ApiResponse<EquipoResponse[]>> {
    return this.http.get<ApiResponse<EquipoResponse[]>>(`${this.apiUrl}/buscar/tipo/${idTipoEqp}`);
  }

  // GET: Buscar por marca
  buscarPorMarca(idMarca: number): Observable<ApiResponse<EquipoResponse[]>> {
    return this.http.get<ApiResponse<EquipoResponse[]>>(`${this.apiUrl}/buscar/marca/${idMarca}`);
  }

  // GET: Buscar por modelo
  buscarPorModelo(idModelo: number): Observable<ApiResponse<EquipoResponse[]>> {
    return this.http.get<ApiResponse<EquipoResponse[]>>(`${this.apiUrl}/buscar/modelo/${idModelo}`);
  }
}
