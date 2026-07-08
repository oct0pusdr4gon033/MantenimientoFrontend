import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from '../../../../shared/components/sidebar/sidebar.component';
import { MenuItem } from '../../../../core/interfaces/menu-item';

@Component({
  standalone: true,
  selector: 'app-administracion-layout',
  imports: [RouterOutlet, SidebarComponent],
  template: `
    <div class="module-shell">
      <app-sidebar
        [menuItems]="menuItems"
        moduloNombre="Administración"
        moduloColor="#0ea5e9">
      </app-sidebar>
      <div class="module-content">
        <header class="module-topbar">
          <span class="topbar-title">Administración del Sistema</span>
          <span class="topbar-badge" style="background: rgba(14, 165, 233, 0.1); color: #0ea5e9;">ADMIN</span>
        </header>
        <main class="module-main">
          <router-outlet />
        </main>
      </div>
    </div>
  `,
  styleUrls: ['../../../../shared/components/module-layout/module-layout.css']
})
export class AdministracionLayout {
  menuItems: MenuItem[] = [
    { nombre: 'dashboard', texto: 'Dashboard', icono: 'dashboard', url: '/GestionAdministracion/dashboard' },
    { nombre: 'empleado', texto: 'Personal / Empleados', icono: 'group', url: '/GestionAdministracion/empleado' },
    { nombre: 'expedientes-empleados', texto: 'Expedientes de Personal', icono: 'folder_shared', url: '/GestionAdministracion/expedientes-empleados' },
    { nombre: 'tipo-documento-empleado', texto: 'Tipos de Documento RRHH', icono: 'description', url: '/GestionAdministracion/tipo-documento-empleado' },
    { nombre: 'rol', texto: 'Roles y Permisos', icono: 'admin_panel_settings', url: '/GestionAdministracion/rol' },
  ];
}
