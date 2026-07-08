import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { Observable } from 'rxjs';
import { ApiResponse } from '../../../core/interfaces/ApiResponse';
import { MaterialRequest, MaterialUpdateRequest, MaterialResponse } from '../models/material';
import { MovimientoInventarioResponse, StockInflowRequest } from '../models/kardex';

@Injectable({
  providedIn: 'root'
})
export class MaterialService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/Material`;

  getMateriales(): Observable<ApiResponse<MaterialResponse[]>> {
    return this.http.get<ApiResponse<MaterialResponse[]>>(this.apiUrl);
  }

  buscarMateriales(
    cod_materia?: string,
    nombre?: string,
    estado?: string,
    id_unidad?: number,
    id_categoria?: number
  ): Observable<ApiResponse<MaterialResponse[]>> {
    let params = new HttpParams();
    if (cod_materia) params = params.set('cod_materia', cod_materia.trim());
    if (nombre) params = params.set('nombre', nombre.trim());
    if (estado) params = params.set('estado', estado.trim());
    if (id_unidad) params = params.set('id_unidad', id_unidad.toString());
    if (id_categoria) params = params.set('id_categoria', id_categoria.toString());

    return this.http.get<ApiResponse<MaterialResponse[]>>(`${this.apiUrl}/buscar`, { params });
  }

  createMaterial(data: MaterialRequest): Observable<ApiResponse<MaterialResponse>> {
    return this.http.post<ApiResponse<MaterialResponse>>(this.apiUrl, data);
  }

  updateMaterial(id: number, data: MaterialUpdateRequest): Observable<ApiResponse<MaterialResponse>> {
    return this.http.put<ApiResponse<MaterialResponse>>(`${this.apiUrl}/${id}`, data);
  }

  getKardex(id: number): Observable<ApiResponse<MovimientoInventarioResponse[]>> {
    return this.http.get<ApiResponse<MovimientoInventarioResponse[]>>(`${this.apiUrl}/${id}/kardex`);
  }

  registrarEntradaStock(id: number, data: StockInflowRequest): Observable<ApiResponse<MaterialResponse>> {
    return this.http.post<ApiResponse<MaterialResponse>>(`${this.apiUrl}/${id}/entrada`, data);
  }
}
