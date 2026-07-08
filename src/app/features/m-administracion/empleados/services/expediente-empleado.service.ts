import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';

import {
  ExpedienteEmpleadoResponse,
  ExpedienteEmpleadoRequest,
  TipoDocumentoEmpleadoResponse,
  TipoDocumentoEmpleadoRequest,
  ExpedienteDocumentoEmpleadoResponse,
  ExpedienteDocumentoEmpleadoRequest
} from '../models/ExpedienteEmpleadoModels';

@Injectable({
  providedIn: 'root'
})
export class ExpedienteEmpleadoService {
  private apiUrl = `${environment.baseUrl}/ExpedienteEmpleado`;

  constructor(private http: HttpClient) {}

  // --- Expedientes ---
  obtenerTodos(): Observable<ExpedienteEmpleadoResponse[]> {
    return this.http.get<ExpedienteEmpleadoResponse[]>(this.apiUrl);
  }

  obtenerPorCodigo(codigo: string): Observable<ExpedienteEmpleadoResponse> {
    return this.http.get<ExpedienteEmpleadoResponse>(`${this.apiUrl}/${codigo}`);
  }

  obtenerPorDni(dni: string): Observable<ExpedienteEmpleadoResponse> {
    return this.http.get<ExpedienteEmpleadoResponse>(`${this.apiUrl}/dni/${dni}`);
  }

  crearExpediente(request: ExpedienteEmpleadoRequest): Observable<ExpedienteEmpleadoResponse> {
    return this.http.post<ExpedienteEmpleadoResponse>(this.apiUrl, request);
  }

  // --- Tipos de Documento ---
  obtenerTiposDocumento(): Observable<TipoDocumentoEmpleadoResponse[]> {
    return this.http.get<TipoDocumentoEmpleadoResponse[]>(`${this.apiUrl}/tipos`);
  }

  crearTipoDocumento(request: TipoDocumentoEmpleadoRequest): Observable<TipoDocumentoEmpleadoResponse> {
    return this.http.post<TipoDocumentoEmpleadoResponse>(`${this.apiUrl}/tipos`, request);
  }

  // --- Detalles de Documento ---
  obtenerDocumentos(codigoExp: string): Observable<ExpedienteDocumentoEmpleadoResponse[]> {
    return this.http.get<ExpedienteDocumentoEmpleadoResponse[]>(`${this.apiUrl}/${codigoExp}/documentos`);
  }

  agregarDocumento(request: ExpedienteDocumentoEmpleadoRequest): Observable<ExpedienteDocumentoEmpleadoResponse> {
    return this.http.post<ExpedienteDocumentoEmpleadoResponse>(`${this.apiUrl}/documentos`, request);
  }

  actualizarDocumento(id: number, request: ExpedienteDocumentoEmpleadoRequest): Observable<ExpedienteDocumentoEmpleadoResponse> {
    return this.http.put<ExpedienteDocumentoEmpleadoResponse>(`${this.apiUrl}/documentos/${id}`, request);
  }

  eliminarDocumento(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/documentos/${id}`);
  }
}
