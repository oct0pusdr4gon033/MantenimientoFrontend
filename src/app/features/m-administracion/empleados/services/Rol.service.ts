import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { ApiResponse } from '../../../../core/interfaces/ApiResponse';
import { RolResponse } from '../models/RolResponse';
import { RolRequest } from '../models/RolRequest';

@Injectable({
  providedIn: 'root'
})
export class RolService {
  private readonly apiUrl = `${environment.apiUrl}/rol`;

  constructor(private http: HttpClient) { }

  listar(): Observable<ApiResponse<RolResponse[]>> {
    return this.http.get<ApiResponse<RolResponse[]>>(this.apiUrl);
  }

  buscarPorId(id: number): Observable<ApiResponse<RolResponse>> {
    return this.http.get<ApiResponse<RolResponse>>(`${this.apiUrl}/${id}`);
  }

  crear(request: RolRequest): Observable<ApiResponse<RolResponse>> {
    return this.http.post<ApiResponse<RolResponse>>(this.apiUrl, request);
  }

  actualizar(id: number, request: RolRequest): Observable<ApiResponse<RolResponse>> {
    return this.http.put<ApiResponse<RolResponse>>(`${this.apiUrl}/${id}`, request);
  }

  eliminar(id: number): Observable<ApiResponse<boolean>> {
    return this.http.delete<ApiResponse<boolean>>(`${this.apiUrl}/${id}`);
  }
}
