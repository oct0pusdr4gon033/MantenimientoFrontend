import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ApiResponse } from '../../../core/interfaces/ApiResponse';
import { ExpedienteRequest } from '../models/ExpedienteRequest';
import { ExpedienteDocumentoRequest } from '../models/ExpedienteDocumentoRequest';
import { ExpedienteResponse } from '../models/ExpedienteResponse';
import { ExpedienteDocumentoResponse } from '../models/ExpedienteDocumentoResponse';

@Injectable({
  providedIn: 'root'
})
export class ExpedienteService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/Expediente`;

  /** Lista todos los expedientes con sus documentos */
  listar(): Observable<ApiResponse<ExpedienteResponse[]>> {
    return this.http.get<ApiResponse<ExpedienteResponse[]>>(`${this.apiUrl}/listar`);
  }

  /** Busca el expediente de un equipo por el ID del equipo */
  buscarPorEquipo(idEquipo: number): Observable<ApiResponse<ExpedienteResponse>> {
    return this.http.get<ApiResponse<ExpedienteResponse>>(`${this.apiUrl}/buscar/equipo/${idEquipo}`);
  }

  /** Busca un expediente por su código */
  buscarPorCodigo(codigo: string): Observable<ApiResponse<ExpedienteResponse>> {
    return this.http.get<ApiResponse<ExpedienteResponse>>(`${this.apiUrl}/buscar/codigo/${codigo}`);
  }

  /** Crea un nuevo expediente para un equipo */
  crear(request: ExpedienteRequest): Observable<ApiResponse<string>> {
    return this.http.post<ApiResponse<string>>(`${this.apiUrl}/crear`, request);
  }

  /** Inserta un documento al expediente */
  insertarDocumento(request: ExpedienteDocumentoRequest): Observable<ApiResponse<string>> {
    return this.http.post<ApiResponse<string>>(`${this.apiUrl}/insertar-documento`, request);
  }

  /** Obtiene el detalle de un documento del expediente por su ID */
  obtenerDocumento(id: number): Observable<ApiResponse<ExpedienteDocumentoResponse>> {
    return this.http.get<ApiResponse<ExpedienteDocumentoResponse>>(`${this.apiUrl}/documento/${id}`);
  }

  /** Actualiza un documento existente */
  actualizarDocumento(id: number, request: ExpedienteDocumentoRequest): Observable<ApiResponse<string>> {
    return this.http.put<ApiResponse<string>>(`${this.apiUrl}/documento/${id}`, request);
  }
}
