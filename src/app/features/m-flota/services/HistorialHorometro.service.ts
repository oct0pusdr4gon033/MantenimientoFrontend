import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ApiResponse } from '../../../core/interfaces/ApiResponse';
import { HistorialHorometroRequest } from '../models/HistorialHorometroRequest';
import { HistorialHorometroResponse } from '../models/HistorialHorometroResponse';

@Injectable({
  providedIn: 'root'
})
export class HistorialHorometroService {
  private readonly apiUrl = `${environment.apiUrl}/HistorialHorometro`;

  constructor(private http: HttpClient) {}

  obtenerTodos(): Observable<ApiResponse<HistorialHorometroResponse[]>> {
    return this.http.get<ApiResponse<HistorialHorometroResponse[]>>(this.apiUrl);
  }

  obtenerPorEquipo(idEquipo: number): Observable<ApiResponse<HistorialHorometroResponse[]>> {
    return this.http.get<ApiResponse<HistorialHorometroResponse[]>>(`${this.apiUrl}/equipo/${idEquipo}`);
  }

  obtenerPorCodigo(codigo: string): Observable<ApiResponse<HistorialHorometroResponse>> {
    return this.http.get<ApiResponse<HistorialHorometroResponse>>(`${this.apiUrl}/${codigo}`);
  }

  crear(request: HistorialHorometroRequest): Observable<ApiResponse<HistorialHorometroResponse>> {
    return this.http.post<ApiResponse<HistorialHorometroResponse>>(this.apiUrl, request);
  }
}
