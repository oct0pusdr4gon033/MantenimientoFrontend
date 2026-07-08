import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { Observable } from 'rxjs';
import { ApiResponse } from '../../../core/interfaces/ApiResponse';
import { OrdenCompraRequest, OrdenCompraResponse } from '../models/orden-compra';

@Injectable({
  providedIn: 'root'
})
export class OrdenCompraService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/Compras/orden-compra`;

  listar(): Observable<ApiResponse<OrdenCompraResponse[]>> {
    return this.http.get<ApiResponse<OrdenCompraResponse[]>>(this.apiUrl);
  }

  obtenerPorId(id: number): Observable<ApiResponse<OrdenCompraResponse>> {
    return this.http.get<ApiResponse<OrdenCompraResponse>>(`${this.apiUrl}/${id}`);
  }

  crear(data: OrdenCompraRequest): Observable<ApiResponse<OrdenCompraResponse>> {
    return this.http.post<ApiResponse<OrdenCompraResponse>>(this.apiUrl, data);
  }

  aprobar(id: number): Observable<ApiResponse<boolean>> {
    return this.http.post<ApiResponse<boolean>>(`${this.apiUrl}/${id}/aprobar`, {});
  }

  rechazar(id: number): Observable<ApiResponse<boolean>> {
    return this.http.put<ApiResponse<boolean>>(`${this.apiUrl}/rechazar/${id}`, {});
  }
}
