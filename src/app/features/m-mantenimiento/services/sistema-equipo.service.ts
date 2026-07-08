import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { Observable } from 'rxjs';
import { SistemaEquipoRequest, SistemaEquipoResponse, SistemaEquipoUpdateRequest, SubSistemaResponse } from '../models/sistema-equipo';

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

@Injectable({
  providedIn: 'root'
})
export class SistemaEquipoService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/SistemaEquipo`;

  getSistemas(): Observable<ApiResponse<SistemaEquipoResponse[]>> {
    return this.http.get<ApiResponse<SistemaEquipoResponse[]>>(this.apiUrl);
  }

  createSistema(data: SistemaEquipoRequest): Observable<ApiResponse<SistemaEquipoResponse>> {
    return this.http.post<ApiResponse<SistemaEquipoResponse>>(this.apiUrl, data);
  }

  updateSistema(id: number, data: SistemaEquipoUpdateRequest): Observable<ApiResponse<SistemaEquipoResponse>> {
    return this.http.put<ApiResponse<SistemaEquipoResponse>>(`${this.apiUrl}/${id}`, data);
  }

  getSubsistemas(idSistema: number): Observable<ApiResponse<SubSistemaResponse[]>> {
    return this.http.get<ApiResponse<SubSistemaResponse[]>>(`${this.apiUrl}/${idSistema}/subsistemas`);
  }
}
