import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { Observable } from 'rxjs';
import { ApiResponse } from '../../../core/interfaces/ApiResponse';
import { UnidadMedidaRequest, UnidadMedidaResponse } from '../models/unidad-medida';

@Injectable({
  providedIn: 'root'
})
export class UnidadMedidaService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/UnidadMedida`;

  getUnidades(): Observable<ApiResponse<UnidadMedidaResponse[]>> {
    return this.http.get<ApiResponse<UnidadMedidaResponse[]>>(this.apiUrl);
  }

  createUnidad(data: UnidadMedidaRequest): Observable<ApiResponse<UnidadMedidaResponse>> {
    return this.http.post<ApiResponse<UnidadMedidaResponse>>(this.apiUrl, data);
  }

  updateUnidad(id: number, data: UnidadMedidaRequest): Observable<ApiResponse<UnidadMedidaResponse>> {
    return this.http.put<ApiResponse<UnidadMedidaResponse>>(`${this.apiUrl}/${id}`, data);
  }
}
