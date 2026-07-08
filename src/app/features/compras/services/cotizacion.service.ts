import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { Observable } from 'rxjs';
import { ApiResponse } from '../../../core/interfaces/ApiResponse';
import { CotizacionRequest, CotizacionResponse } from '../models/cotizacion';

@Injectable({
  providedIn: 'root'
})
export class CotizacionService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/Compras/cotizacion`;

  listar(): Observable<ApiResponse<CotizacionResponse[]>> {
    return this.http.get<ApiResponse<CotizacionResponse[]>>(this.apiUrl);
  }

  obtenerPorId(id: number): Observable<ApiResponse<CotizacionResponse>> {
    return this.http.get<ApiResponse<CotizacionResponse>>(`${this.apiUrl}/${id}`);
  }

  crear(data: CotizacionRequest): Observable<ApiResponse<CotizacionResponse>> {
    return this.http.post<ApiResponse<CotizacionResponse>>(this.apiUrl, data);
  }

  actualizar(id: number, data: any): Observable<ApiResponse<CotizacionResponse>> {
    return this.http.put<ApiResponse<CotizacionResponse>>(`${this.apiUrl}/${id}`, data);
  }

  aprobar(id: number): Observable<ApiResponse<CotizacionResponse>> {
    return this.http.post<ApiResponse<CotizacionResponse>>(`${this.apiUrl}/${id}/aprobar`, {});
  }
}
