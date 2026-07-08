import { Component } from '@angular/core';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  standalone: true,
  selector: 'app-dashboard',
  template: `
    <div style="padding:1rem">
      <h2 style="font-family:'Inter',sans-serif;color:#1a1a2e;margin-bottom:.5rem">
        Bienvenido, {{ nombre }}
      </h2>
      <p style="color:#6b7280;font-family:'Inter',sans-serif">
        Módulo en construcción. Selecciona una opción del menú lateral.
      </p>
    </div>
  `
})
export class DashboardPlaceholderComponent {
  nombre = '';
  constructor(auth: AuthService) {
    const s = auth.getSesion();
    this.nombre = s ? `${s.nombre} ${s.apellidos}` : '';
  }
}
