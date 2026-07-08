import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { Observable } from 'rxjs';
import { ApiResponse } from '../../../core/interfaces/ApiResponse';
import { CategoriaMaterialRequest, CategoriaMaterialResponse } from '../models/categoria-material';

@Injectable({
  providedIn: 'root'
})
export class CategoriaMaterialService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/CategoriaMaterial`;

  getCategorias(): Observable<ApiResponse<CategoriaMaterialResponse[]>> {
    return this.http.get<ApiResponse<CategoriaMaterialResponse[]>>(this.apiUrl);
  }

  createCategoria(data: CategoriaMaterialRequest): Observable<ApiResponse<CategoriaMaterialResponse>> {
    return this.http.post<ApiResponse<CategoriaMaterialResponse>>(this.apiUrl, data);
  }

  updateCategoria(id: number, data: CategoriaMaterialRequest): Observable<ApiResponse<CategoriaMaterialResponse>> {
    return this.http.put<ApiResponse<CategoriaMaterialResponse>>(`${this.apiUrl}/${id}`, data);
  }
}
