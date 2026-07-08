import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { Observable } from 'rxjs';
import { ActividadSistemaResponse, ActividadSistemaRequest, ActividadSistemaUpdateRequest } from '../models/actividad-sistema';

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ActividadSistemaService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/ActividadSistema`;

  getActividades(): Observable<ApiResponse<ActividadSistemaResponse[]>> {
    return this.http.get<ApiResponse<ActividadSistemaResponse[]>>(this.apiUrl);
  }

  buscarActividades(termino: string): Observable<ApiResponse<ActividadSistemaResponse[]>> {
    return this.http.get<ApiResponse<ActividadSistemaResponse[]>>(`${this.apiUrl}/buscar?termino=${termino}`);
  }

  createActividad(data: ActividadSistemaRequest): Observable<ApiResponse<ActividadSistemaResponse>> {
    return this.http.post<ApiResponse<ActividadSistemaResponse>>(this.apiUrl, data);
  }

  updateActividad(id: number, data: ActividadSistemaUpdateRequest): Observable<ApiResponse<ActividadSistemaResponse>> {
    return this.http.put<ApiResponse<ActividadSistemaResponse>>(`${this.apiUrl}/${id}`, data);
  }
}
