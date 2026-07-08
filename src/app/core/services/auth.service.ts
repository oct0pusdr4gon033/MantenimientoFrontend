import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, catchError, map, throwError } from 'rxjs';
import { jwtDecode } from 'jwt-decode';
import { environment } from '../../../environments/environment';
import {
  LoginRequest,
  LoginResponse,
  UserSession,
  RolUsuario,
  Modulo,
  ROL_MODULO_MAP,
  MODULO_RUTA_MAP,
  DecodedToken
} from '../interfaces/auth';

const TOKEN_KEY = 'jwt_token';
const API_BASE  = `${environment.baseUrl}/auth`;

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http       = inject(HttpClient);
  private router     = inject(Router);
  private platformId = inject(PLATFORM_ID);

  private get isBrowser(): boolean {
    return isPlatformBrowser(this.platformId);
  }

  // ── Login con JWT ─────────────────────────────────────────
  login(email: string, contrasena: string): Observable<boolean> {
    const body: LoginRequest = { email, password: contrasena };

    return this.http.post<LoginResponse>(`${API_BASE}/login`, body).pipe(
      map((res: any) => {
        const token = res?.token || res?.Token;
        if (token) {
          this.guardarToken(token);
          this.router.navigate([this.getRutaModulo()]);
          return true;
        }
        return false;
      }),
      catchError((error: HttpErrorResponse) => {
        return throwError(() => error);
      })
    );
  }

  // ── Token Management ──────────────────────────────────────
  private guardarToken(token: string): void {
    if (this.isBrowser) {
      localStorage.setItem(TOKEN_KEY, token);
    }
  }

  getToken(): string | null {
    if (!this.isBrowser) return null;
    return localStorage.getItem(TOKEN_KEY);
  }

  // Genera el UserSession decodificando el token al vuelo
  getSesion(): UserSession | null {
    const token = this.getToken();
    if (!token) return null;

    try {
      const decoded = jwtDecode<DecodedToken>(token);
      
      // Validar si el token ya expiró
      if (decoded.exp && (decoded.exp * 1000) < Date.now()) {
        this.logout();
        return null;
      }

      // Imprimir el token decodificado para ver la estructura exacta que manda el backend
      console.log('JWT Decodificado:', decoded);

      // Extraer el rol considerando varias convenciones comunes
      const rawRol = decoded['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] || decoded.role || decoded.Rol || '';
      
      const rolNormalizado = rawRol.toUpperCase().replace(/\bDE\b/g, '').trim().replace(/\s+/g, '_');
      const rolEncontrado = Object.values(RolUsuario).find(r => r === rolNormalizado) || RolUsuario.CONDUCTOR;

      const apellido1 = decoded.Apellido1 || '';
      const apellido2 = decoded.Apellido2 || '';

      return {
        token: token,
        nombre:    decoded.Nombre   || 'Usuario',
        apellido1: apellido1,
        apellido2: apellido2,
        apellidos: [apellido1, apellido2].filter(Boolean).join(' '),
        dni:       decoded.Dni      || '',
        cargo:     decoded.Cargo    || rolNormalizado.replace(/_/g, ' '),
        rol:       rolEncontrado as RolUsuario,
        email:     decoded.email    || ''
      };
    } catch {
      this.logout();
      return null;
    }
  }


  isAuthenticated(): boolean {
    return !!this.getSesion();
  }

  logout(): void {
    if (this.isBrowser) {
      localStorage.removeItem(TOKEN_KEY);
    }
    this.router.navigate(['/login']);
  }

  // ── Rol y Módulo ──────────────────────────────────────────
  getRol(): RolUsuario | null {
    return this.getSesion()?.rol ?? null;
  }

  getModulo(): Modulo | null {
    const rol = this.getRol();
    return rol ? ROL_MODULO_MAP[rol] : null;
  }

  getRutaModulo(): string {
    const modulo = this.getModulo();
    return modulo ? MODULO_RUTA_MAP[modulo] : '/login';
  }

  tieneAccesoA(rutaBase: string): boolean {
    return this.getRutaModulo().startsWith(rutaBase);
  }
}
