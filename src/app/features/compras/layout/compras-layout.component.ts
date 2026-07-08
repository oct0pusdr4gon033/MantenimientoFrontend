import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from '../../../shared/components/sidebar/sidebar.component';
import { MenuItem } from '../../../core/interfaces/menu-item';

@Component({
  standalone: true,
  selector: 'app-compras-layout',
  imports: [RouterOutlet, SidebarComponent],
  template: `
    <div class="module-shell">
      <app-sidebar
        [menuItems]="menuItems"
        moduloNombre="Gestión de Compras"
        moduloColor="#3b82f6">
      </app-sidebar>
      <div class="module-content">
        <header class="module-topbar">
          <span class="topbar-title">Gestión de Compras</span>
          <span class="topbar-badge" style="background: rgba(59, 130, 246, 0.1); color: #3b82f6;">COMPRAS</span>
        </header>
        <main class="module-main">
          <router-outlet />
        </main>
      </div>
    </div>
  `,
  styleUrls: ['../../../shared/components/module-layout/module-layout.css']
})
export class ComprasLayoutComponent {
  menuItems: MenuItem[] = [
    { nombre: 'dashboard',         texto: 'Dashboard',          icono: 'dashboard',       url: '/GestionCompras/dashboard' },
    { nombre: 'ordenes',           texto: 'Órdenes de Compra',  icono: 'shopping_cart',   url: '/GestionCompras/ordenes' },
    { nombre: 'proveedores',       texto: 'Proveedores',        icono: 'store',           url: '/GestionCompras/proveedores' },
    { nombre: 'solicitudes',       texto: 'Solicitudes',        icono: 'assignment',      url: '/GestionCompras/solicitudes' },
    { nombre: 'cotizaciones',      texto: 'Cotizaciones',       icono: 'request_quote',   url: '/GestionCompras/cotizaciones' },
    { nombre: 'reportes',          texto: 'Reportes',           icono: 'bar_chart',       url: '/GestionCompras/reportes' },
  ];
}
