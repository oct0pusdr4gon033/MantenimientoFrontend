import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ApiResponse } from '../../../core/interfaces/ApiResponse';

@Injectable({
  providedIn: 'root'
})
export class StorageService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/Storage`;

  /**
   * Sube un archivo al backend
   * @param file El archivo seleccionado por el usuario
   * @param modulo Módulo al que pertenece (ej. 'expedientes', 'ot/OT-001')
   * @param version Versión de la API/Storage (por defecto 'v1')
   */
  uploadFile(file: File, modulo: string, version: string = 'v1'): Observable<ApiResponse<string>> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('modulo', modulo);
    formData.append('version', version);

    return this.http.post<ApiResponse<string>>(`${this.apiUrl}/upload`, formData);
  }
}
