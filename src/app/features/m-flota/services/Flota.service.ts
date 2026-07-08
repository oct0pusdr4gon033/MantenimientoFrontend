import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ApiResponse } from '../../../core/interfaces/ApiResponse';
import { FlotaRequest } from '../models/FlotaRequest';
import { FlotaResponse } from '../models/FlotaResponse';
import { FlotaDetalleResponse } from '../models/FlotaDetalleResponse';

@Injectable({
  providedIn: 'root'
})
export class FlotaService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/Flota`;

  // GET: Listar todas las flotas
  listar(): Observable<ApiResponse<FlotaResponse[]>> {
    return this.http.get<ApiResponse<FlotaResponse[]>>(`${this.apiUrl}/listar`);
  }

  // GET: Buscar por ID interno
  buscarPorId(id: number): Observable<ApiResponse<FlotaResponse>> {
    return this.http.get<ApiResponse<FlotaResponse>>(`${this.apiUrl}/buscar/id/${id}`);
  }

  // GET: Buscar por código único (ej: FL-001)
  buscarPorCodigo(codFlota: string): Observable<ApiResponse<FlotaResponse>> {
    return this.http.get<ApiResponse<FlotaResponse>>(`${this.apiUrl}/buscar/codigo/${codFlota}`);
  }

  // GET: Buscar por tipo de equipo (ej: CAMION)
  buscarPorTipo(nombreTipo: string): Observable<ApiResponse<FlotaResponse[]>> {
    return this.http.get<ApiResponse<FlotaResponse[]>>(`${this.apiUrl}/buscar/tipo/${nombreTipo}`);
  }

  // GET: Buscar por modelo (búsqueda parcial)
  buscarPorModelo(nombreModelo: string): Observable<ApiResponse<FlotaResponse[]>> {
    return this.http.get<ApiResponse<FlotaResponse[]>>(`${this.apiUrl}/buscar/modelo/${nombreModelo}`);
  }

  // GET: Detalle completo: datos de la flota + todos sus equipos
  detalle(codFlota: string): Observable<ApiResponse<FlotaDetalleResponse>> {
    const cod = encodeURIComponent(codFlota.trim());
    return this.http.get<ApiResponse<FlotaDetalleResponse>>(`${this.apiUrl}/detalle/${cod}`);
  }

  // POST: Crear flota (valida código único)
  crear(request: FlotaRequest): Observable<ApiResponse<string>> {
    return this.http.post<ApiResponse<string>>(`${this.apiUrl}/crear`, request);
  }

  // PUT: Actualizar flota por ID
  actualizar(id: number, request: FlotaRequest): Observable<ApiResponse<string>> {
    return this.http.put<ApiResponse<string>>(`${this.apiUrl}/actualizar/${id}`, request);
  }
}
