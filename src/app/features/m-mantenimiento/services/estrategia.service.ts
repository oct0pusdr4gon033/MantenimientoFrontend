import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { EstrategiaRequest } from '../models/EstrategiaRequest';
import { EstrategiaResponse } from '../models/EstrategiaResponse';

@Injectable({
  providedIn: 'root'
})
export class EstrategiaService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/Estrategia`;

  listar(): Observable<EstrategiaResponse[]> {
    return this.http.get<EstrategiaResponse[]>(`${this.apiUrl}`);
  }

  buscarPorId(id: number): Observable<EstrategiaResponse> {
    return this.http.get<EstrategiaResponse>(`${this.apiUrl}/${id}`);
  }

  crear(request: EstrategiaRequest): Observable<EstrategiaResponse> {
    return this.http.post<EstrategiaResponse>(`${this.apiUrl}`, request);
  }

  actualizar(id: number, request: { titulo_estrategia: string, estado: string }): Observable<EstrategiaResponse> {
    return this.http.put<EstrategiaResponse>(`${this.apiUrl}/${id}`, request);
  }
}
