import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { Observable } from 'rxjs';
import { ApiResponse } from '../../../core/interfaces/ApiResponse';
import { SolicitudPedidoRequest, SolicitudPedidoResponse } from '../models/solped';

@Injectable({
  providedIn: 'root'
})
export class SolpedService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/Compras/solped`;

  listar(): Observable<ApiResponse<SolicitudPedidoResponse[]>> {
    return this.http.get<ApiResponse<SolicitudPedidoResponse[]>>(this.apiUrl);
  }

  obtenerPorId(id: number): Observable<ApiResponse<SolicitudPedidoResponse>> {
    return this.http.get<ApiResponse<SolicitudPedidoResponse>>(`${this.apiUrl}/${id}`);
  }

  crear(data: SolicitudPedidoRequest): Observable<ApiResponse<SolicitudPedidoResponse>> {
    return this.http.post<ApiResponse<SolicitudPedidoResponse>>(this.apiUrl, data);
  }

  aprobar(id: number): Observable<ApiResponse<SolicitudPedidoResponse>> {
    return this.http.post<ApiResponse<SolicitudPedidoResponse>>(`${this.apiUrl}/${id}/aprobar`, {});
  }
}
