import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from '../../../shared/components/sidebar/sidebar.component';
import { MenuItem } from '../../../core/interfaces/menu-item';

@Component({
  standalone: true,
  selector: 'app-flota-layout',
  imports: [RouterOutlet, SidebarComponent],
  template: `
    <div class="module-shell">
      <app-sidebar
        [menuItems]="menuItems"
        moduloNombre="Gestión de Flota"
        moduloColor="#8b5cf6">
      </app-sidebar>
      <div class="module-content">
        <header class="module-topbar">
          <span class="topbar-title">Gestión de Flota</span>
          <span class="topbar-badge" style="background: rgba(139, 92, 246, 0.1); color: #8b5cf6;">FLOTA</span>
        </header>
        <main class="module-main">
          <router-outlet />
        </main>
      </div>
    </div>
  `,
  styleUrls: ['../../../shared/components/module-layout/module-layout.css']
})
export class FlotaLayoutComponent {
  menuItems: MenuItem[] = [
    { nombre: 'dashboard', texto: 'Dashboard', icono: 'dashboard', url: '/GestionFlota/dashboard' },
    { nombre: 'area-operacion', texto: 'Área de Operación', icono: 'activity_zone', url: '/GestionFlota/area-operacion' },
    { nombre: 'tipo-equipo', texto: 'Tipo de Equipos', icono: 'category', url: '/GestionFlota/tipo-equipo' },
    { nombre: 'marca-equipo', texto: 'Marcas de Equipo', icono: 'verified', url: '/GestionFlota/marca-equipo' },
    { nombre: 'modelo-equipo', texto: 'Modelos de Equipo', icono: 'precision_manufacturing', url: '/GestionFlota/modelo-equipo' },
    { nombre: 'tipo-documento', texto: 'Tipo de Documento', icono: 'description', url: '/GestionFlota/tipo-documento' },
    { nombre: 'flotas', texto: 'Flotas', icono: 'local_shipping', url: '/GestionFlota/flotas' },
    { nombre: 'equipos', texto: 'Equipos', icono: 'construction', url: '/GestionFlota/equipos' },
    { nombre: 'expedientes', texto: 'Expedientes', icono: 'folder', url: '/GestionFlota/expedientes' },
    { nombre: 'historial-horometros', texto: 'Registro Horómetros', icono: 'speed', url: '/GestionFlota/historial-horometros' },
    { nombre: 'reportes', texto: 'Reportes', icono: 'bar_chart', url: '/GestionFlota/reportes' },
  ];
}
