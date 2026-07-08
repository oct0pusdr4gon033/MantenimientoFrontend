import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from '../../../../shared/components/sidebar/sidebar.component';
import { MenuItem } from '../../../../core/interfaces/menu-item';

@Component({
  standalone: true,
  selector: 'app-mantenimiento-layout',
  imports: [RouterOutlet, SidebarComponent],
  template: `
    <div class="module-shell">
      <app-sidebar
        [menuItems]="menuItems"
        moduloNombre="Gestión de Mantenimiento"
        moduloColor="#e86b1a">
      </app-sidebar>
      <div class="module-content">
        <header class="module-topbar">
          <span class="topbar-title">Gestión de Mantenimiento</span>
          <span class="topbar-badge" style="background: rgba(232, 107, 26, 0.1); color: #e86b1a;">MANTENIMIENTO</span>
        </header>
        <main class="module-main">
          <router-outlet />
        </main>
      </div>
    </div>
  `,
  styleUrls: ['../../../../shared/components/module-layout/module-layout.css']
})
export class MantenimientoLayout {
  menuItems: MenuItem[] = [
    { nombre: 'dashboard', texto: 'Dashboard', icono: 'dashboard', url: '/GestionMantenimiento/dashboard' },
    { nombre: 'orden-trabajo', texto: 'Órdenes de Trabajo', icono: 'build', url: '/GestionMantenimiento/orden-trabajo' },
    { nombre: 'vale', texto: 'Vales de Repuestos', icono: 'receipt_long', url: '/GestionMantenimiento/vale' },
    { nombre: 'estrategia', texto: 'Estrategias Mant.', icono: 'assignment', url: '/GestionMantenimiento/estrategia' },
    { nombre: 'plan-mantenimiento', texto: 'Planes de Mantenimiento', icono: 'assignment_turned_in', url: '/GestionMantenimiento/plan-mantenimiento' },
    { nombre: 'calendario', texto: 'Calendario Mant.', icono: 'calendar_month', url: '/GestionMantenimiento/calendario' },
    { nombre: 'sistema-equipo', texto: 'Sistemas de Equipo', icono: 'settings_applications', url: '/GestionMantenimiento/sistema-equipo' },
    { nombre: 'actividad-sistema', texto: 'Actividades de Sistema', icono: 'build', url: '/GestionMantenimiento/actividad-sistema' }
  ];
}
