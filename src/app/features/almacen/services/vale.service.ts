import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { Observable } from 'rxjs';
import { ApiResponse } from '../../../core/interfaces/ApiResponse';
import { 
  ValeCreateRequest, 
  ValeUpdateRequest, 
  ValeResponse, 
  ValeDispatchRequest, 
  ReservedMaterialResponse 
} from '../models/vale';

@Injectable({
  providedIn: 'root'
})
export class ValeService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/Vale`;

  getVales(
    estado?: string, 
    fechaInicio?: string, 
    fechaFin?: string, 
    search?: string
  ): Observable<ApiResponse<ValeResponse[]>> {
    let params = new HttpParams();
    if (estado) params = params.set('estado', estado);
    if (fechaInicio) params = params.set('fechaInicio', fechaInicio);
    if (fechaFin) params = params.set('fechaFin', fechaFin);
    if (search) params = params.set('search', search.trim());

    return this.http.get<ApiResponse<ValeResponse[]>>(this.apiUrl, { params });
  }

  getValeById(id: number): Observable<ApiResponse<ValeResponse>> {
    return this.http.get<ApiResponse<ValeResponse>>(`${this.apiUrl}/${id}`);
  }

  getValeByOtId(idOt: number): Observable<ApiResponse<ValeResponse>> {
    return this.http.get<ApiResponse<ValeResponse>>(`${this.apiUrl}/ot/${idOt}`);
  }

  createVale(data: ValeCreateRequest): Observable<ApiResponse<ValeResponse>> {
    return this.http.post<ApiResponse<ValeResponse>>(this.apiUrl, data);
  }

  updateVale(id: number, data: ValeUpdateRequest): Observable<ApiResponse<ValeResponse>> {
    return this.http.put<ApiResponse<ValeResponse>>(`${this.apiUrl}/${id}`, data);
  }

  deleteVale(id: number): Observable<ApiResponse<any>> {
    return this.http.delete<ApiResponse<any>>(`${this.apiUrl}/${id}`);
  }

  despacharVale(id: number, data: ValeDispatchRequest): Observable<ApiResponse<ValeResponse>> {
    return this.http.post<ApiResponse<ValeResponse>>(`${this.apiUrl}/${id}/despachar`, data);
  }

  getMaterialesReservados(): Observable<ApiResponse<ReservedMaterialResponse[]>> {
    return this.http.get<ApiResponse<ReservedMaterialResponse[]>>(`${this.apiUrl}/materiales-reservados`);
  }
}
