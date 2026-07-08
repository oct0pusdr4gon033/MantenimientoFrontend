import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { Observable } from 'rxjs';
import { ApiResponse } from '../../../core/interfaces/ApiResponse';
import { 
  ProveedorRequest, 
  ProveedorResponse, 
  ProveedorContactoRequest, 
  ProveedorContactoResponse, 
  CategoriaProveedorResponse 
} from '../models/proveedor';

@Injectable({
  providedIn: 'root'
})
export class ProveedorService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/Proveedor`;

  listar(): Observable<ApiResponse<ProveedorResponse[]>> {
    return this.http.get<ApiResponse<ProveedorResponse[]>>(`${this.apiUrl}/listar`);
  }

  buscarProveedores(ruc?: string, razonSocial?: string, codCat?: string): Observable<ApiResponse<ProveedorResponse[]>> {
    let params = new HttpParams();
    if (ruc) params = params.set('ruc', ruc.trim());
    if (razonSocial) params = params.set('razonSocial', razonSocial.trim());
    if (codCat) params = params.set('codCat', codCat.trim());

    return this.http.get<ApiResponse<ProveedorResponse[]>>(`${this.apiUrl}/buscar`, { params });
  }

  getProveedorByRuc(ruc: string): Observable<ApiResponse<ProveedorResponse>> {
    return this.http.get<ApiResponse<ProveedorResponse>>(`${this.apiUrl}/${ruc}`);
  }

  createProveedor(data: ProveedorRequest): Observable<ApiResponse<ProveedorResponse>> {
    return this.http.post<ApiResponse<ProveedorResponse>>(this.apiUrl, data);
  }

  updateProveedor(ruc: string, data: ProveedorRequest): Observable<ApiResponse<ProveedorResponse>> {
    return this.http.put<ApiResponse<ProveedorResponse>>(`${this.apiUrl}/${ruc}`, data);
  }

  addContacto(ruc: string, data: ProveedorContactoRequest): Observable<ApiResponse<ProveedorContactoResponse>> {
    return this.http.post<ApiResponse<ProveedorContactoResponse>>(`${this.apiUrl}/${ruc}/contacto`, data);
  }

  updateContacto(idContacto: number, data: ProveedorContactoRequest): Observable<ApiResponse<ProveedorContactoResponse>> {
    return this.http.put<ApiResponse<ProveedorContactoResponse>>(`${this.apiUrl}/contacto/${idContacto}`, data);
  }

  getCategorias(): Observable<ApiResponse<CategoriaProveedorResponse[]>> {
    return this.http.get<ApiResponse<CategoriaProveedorResponse[]>>(`${this.apiUrl}/categorias`);
  }
}
