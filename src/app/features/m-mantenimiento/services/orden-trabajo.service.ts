import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ApiResponse } from '../../../core/interfaces/ApiResponse';
import {
  OrdenTrabajoResponse,
  OrdenTrabajoCreateRequest,
  CambiarEstadoOTRequest,
  OTActividadResponse,
  OTMaterialResponse,
  OTPersonalResponse,
  EmpleadoDisponibleResponse
} from '../models/orden-trabajo';

@Injectable({ providedIn: 'root' })
export class OrdenTrabajoService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/OrdenTrabajo`;

  getAll(): Observable<ApiResponse<OrdenTrabajoResponse[]>> {
    return this.http.get<ApiResponse<OrdenTrabajoResponse[]>>(this.apiUrl);
  }

  getByEquipo(idEquipo: number): Observable<ApiResponse<OrdenTrabajoResponse[]>> {
    return this.http.get<ApiResponse<OrdenTrabajoResponse[]>>(`${this.apiUrl}/equipo/${idEquipo}`);
  }

  getById(id: number): Observable<ApiResponse<OrdenTrabajoResponse>> {
    return this.http.get<ApiResponse<OrdenTrabajoResponse>>(`${this.apiUrl}/${id}`);
  }

  create(request: OrdenTrabajoCreateRequest): Observable<ApiResponse<OrdenTrabajoResponse>> {
    return this.http.post<ApiResponse<OrdenTrabajoResponse>>(this.apiUrl, request);
  }

  cambiarEstado(id: number, request: CambiarEstadoOTRequest): Observable<ApiResponse<OrdenTrabajoResponse>> {
    return this.http.put<ApiResponse<OrdenTrabajoResponse>>(`${this.apiUrl}/${id}/estado`, request);
  }

  getCalendarioEquipo(idEquipo: number): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(`${this.apiUrl}/calendario/equipo/${idEquipo}`);
  }

  addActividadExtra(idOt: number, request: { nombre_actividad: string, cod_sistema?: string, tipo_pm?: string }): Observable<ApiResponse<OTActividadResponse>> {
    return this.http.post<ApiResponse<OTActividadResponse>>(`${this.apiUrl}/${idOt}/actividad`, request);
  }

  removeActividadExtra(idOtActividad: number): Observable<ApiResponse<boolean>> {
    return this.http.delete<ApiResponse<boolean>>(`${this.apiUrl}/actividad/${idOtActividad}`);
  }

  addMaterialExtra(idOt: number, request: { id_material_ref: number, cantidad_requerida: number }): Observable<ApiResponse<OTMaterialResponse>> {
    return this.http.post<ApiResponse<OTMaterialResponse>>(`${this.apiUrl}/${idOt}/material`, request);
  }

  removeMaterialExtra(idOtMaterial: number): Observable<ApiResponse<boolean>> {
    return this.http.delete<ApiResponse<boolean>>(`${this.apiUrl}/material/${idOtMaterial}`);
  }

  addPersonalExtra(idOt: number, request: { dni_empleado: string }): Observable<ApiResponse<OTPersonalResponse>> {
    return this.http.post<ApiResponse<OTPersonalResponse>>(`${this.apiUrl}/${idOt}/personal`, request);
  }

  removePersonalExtra(idOtPersonal: number): Observable<ApiResponse<boolean>> {
    return this.http.delete<ApiResponse<boolean>>(`${this.apiUrl}/personal/${idOtPersonal}`);
  }

  getTecnicosDisponibles(idOt: number): Observable<ApiResponse<EmpleadoDisponibleResponse[]>> {
    return this.http.get<ApiResponse<EmpleadoDisponibleResponse[]>>(`${this.apiUrl}/${idOt}/tecnicos-disponibles`);
  }
}
