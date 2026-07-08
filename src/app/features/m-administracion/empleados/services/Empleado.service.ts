import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { ApiResponse } from '../../../../core/interfaces/ApiResponse';
import { EmpleadoResponse } from '../models/EmpleadoResponse';
import { EmpleadoRequest } from '../models/EmpleadoRequest';

@Injectable({
  providedIn: 'root'
})
export class EmpleadoService {
  private readonly apiUrl = `${environment.apiUrl}/Empleado`;

  constructor(private http: HttpClient) {}

  obtenerActivos(): Observable<ApiResponse<EmpleadoResponse[]>> {
    return this.http.get<ApiResponse<EmpleadoResponse[]>>(`${this.apiUrl}/activos`);
  }

  listar(): Observable<ApiResponse<EmpleadoResponse[]>> {
    return this.http.get<ApiResponse<EmpleadoResponse[]>>(this.apiUrl);
  }

  obtenerPorDni(dni: string): Observable<ApiResponse<EmpleadoResponse>> {
    return this.http.get<ApiResponse<EmpleadoResponse>>(`${this.apiUrl}/${dni}`);
  }

  crear(request: EmpleadoRequest): Observable<ApiResponse<EmpleadoResponse>> {
    return this.http.post<ApiResponse<EmpleadoResponse>>(this.apiUrl, request);
  }

  actualizar(dni: string, request: EmpleadoRequest): Observable<ApiResponse<EmpleadoResponse>> {
    return this.http.put<ApiResponse<EmpleadoResponse>>(`${this.apiUrl}/${dni}`, request);
  }

  eliminar(dni: string): Observable<ApiResponse<boolean>> {
    return this.http.delete<ApiResponse<boolean>>(`${this.apiUrl}/${dni}`);
  }
}
