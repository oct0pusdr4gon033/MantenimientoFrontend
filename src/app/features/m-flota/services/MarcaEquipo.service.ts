import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ApiResponse } from '../../../core/interfaces/ApiResponse';
import { MarcaEquipoRequest } from '../models/MarcaEquipoRequest';
import { MarcaEquipoResponse } from '../models/MarcaEquipoResponse';

@Injectable({
  providedIn: 'root'
})
export class MarcaEquipoService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/MarcaEquipo`;

  // GET: Listar todas las marcas
  listar(): Observable<ApiResponse<MarcaEquipoResponse[]>> {
    return this.http.get<ApiResponse<MarcaEquipoResponse[]>>(`${this.apiUrl}/listar`);
  }

  // POST: Crear nueva marca
  crear(request: MarcaEquipoRequest): Observable<ApiResponse<string>> {
    return this.http.post<ApiResponse<string>>(`${this.apiUrl}/crear`, request);
  }

  // PUT: Actualizar marca por ID
  actualizar(id: number, request: MarcaEquipoRequest): Observable<ApiResponse<string>> {
    return this.http.put<ApiResponse<string>>(`${this.apiUrl}/actualizar/${id}`, request);
  }
}
