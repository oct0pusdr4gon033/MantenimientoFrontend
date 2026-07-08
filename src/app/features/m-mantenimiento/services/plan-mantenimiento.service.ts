import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ApiResponse } from '../../../core/interfaces/ApiResponse';
import {
  PlanMantenimientoRequest,
  PlanMantenimientoUpdateRequest,
  PlanMantenimientoResponse,
  PlanMantenimientoActividadRequest,
  PlanMantenimientoActividadResponse,
  PlanMantenimientoPersonalRequest,
  PlanMantenimientoPersonalResponse
} from '../models/plan-mantenimiento';

@Injectable({
  providedIn: 'root'
})
export class PlanMantenimientoService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/PlanMantenimiento`;

  getAll(): Observable<ApiResponse<PlanMantenimientoResponse[]>> {
    return this.http.get<ApiResponse<PlanMantenimientoResponse[]>>(this.apiUrl);
  }

  getById(id: number): Observable<ApiResponse<PlanMantenimientoResponse>> {
    return this.http.get<ApiResponse<PlanMantenimientoResponse>>(`${this.apiUrl}/${id}`);
  }

  create(request: PlanMantenimientoRequest): Observable<ApiResponse<PlanMantenimientoResponse>> {
    return this.http.post<ApiResponse<PlanMantenimientoResponse>>(this.apiUrl, request);
  }

  update(id: number, request: PlanMantenimientoUpdateRequest): Observable<ApiResponse<PlanMantenimientoResponse>> {
    return this.http.put<ApiResponse<PlanMantenimientoResponse>>(`${this.apiUrl}/${id}`, request);
  }

  delete(id: number): Observable<ApiResponse<boolean>> {
    return this.http.delete<ApiResponse<boolean>>(`${this.apiUrl}/${id}`);
  }

  // Granular endpoints
  addActividad(id: number, request: PlanMantenimientoActividadRequest): Observable<ApiResponse<PlanMantenimientoActividadResponse>> {
    return this.http.post<ApiResponse<PlanMantenimientoActividadResponse>>(`${this.apiUrl}/${id}/actividades`, request);
  }

  removeActividad(idPlanActividad: number): Observable<ApiResponse<boolean>> {
    return this.http.delete<ApiResponse<boolean>>(`${this.apiUrl}/actividades/${idPlanActividad}`);
  }

  addPersonal(id: number, request: PlanMantenimientoPersonalRequest): Observable<ApiResponse<PlanMantenimientoPersonalResponse>> {
    return this.http.post<ApiResponse<PlanMantenimientoPersonalResponse>>(`${this.apiUrl}/${id}/personal`, request);
  }

  removePersonal(idPlanPersonal: number): Observable<ApiResponse<boolean>> {
    return this.http.delete<ApiResponse<boolean>>(`${this.apiUrl}/personal/${idPlanPersonal}`);
  }
}
