import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse } from '../../../core/interfaces/ApiResponse';
import { TipoDocumentoResponse } from '../models/TipoDocumentoResponse';
import { TipoDocumentoRequest } from '../models/TipoDocumentoRequest';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class TipoDocumentoService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/TipoDocumento`;

  /** Lista todos los tipos de documento */
  listar(): Observable<ApiResponse<TipoDocumentoResponse[]>> {
    return this.http.get<ApiResponse<TipoDocumentoResponse[]>>(`${this.apiUrl}/listar`);
  }

  /** Busca un tipo de documento por su código */
  buscarPorCodigo(codigo: string): Observable<ApiResponse<TipoDocumentoResponse>> {
    return this.http.get<ApiResponse<TipoDocumentoResponse>>(`${this.apiUrl}/buscar/${codigo}`);
  }

  /** Registra un nuevo tipo de documento */
  crear(request: TipoDocumentoRequest): Observable<ApiResponse<TipoDocumentoResponse>> {
    return this.http.post<ApiResponse<TipoDocumentoResponse>>(`${this.apiUrl}/crear`, request);
  }

  /** Actualiza un tipo de documento existente */
  actualizar(codigo: string, request: TipoDocumentoRequest): Observable<ApiResponse<TipoDocumentoResponse>> {
    return this.http.put<ApiResponse<TipoDocumentoResponse>>(`${this.apiUrl}/actualizar/${codigo}`, request);
  }
}
