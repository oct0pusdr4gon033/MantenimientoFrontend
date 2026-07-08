import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from '../../../shared/components/sidebar/sidebar.component';
import { MenuItem } from '../../../core/interfaces/menu-item';

@Component({
  standalone: true,
  selector: 'app-almacen-layout',
  imports: [RouterOutlet, SidebarComponent],
  template: `
    <div class="module-shell">
      <app-sidebar
        [menuItems]="menuItems"
        moduloNombre="Gestión de Almacén"
        moduloColor="#10b981">
      </app-sidebar>
      <div class="module-content">
        <header class="module-topbar">
          <span class="topbar-title">Gestión de Almacén</span>
          <span class="topbar-badge" style="background: rgba(16, 185, 129, 0.1); color: #10b981;">ALMACÉN</span>
        </header>
        <main class="module-main">
          <router-outlet />
        </main>
      </div>
    </div>
  `,
  styleUrls: ['../../../shared/components/module-layout/module-layout.css']
})
export class AlmacenLayoutComponent {
  menuItems: MenuItem[] = [
    { nombre: 'dashboard',          texto: 'Dashboard',               icono: 'dashboard',       url: '/GestionAlmacen/dashboard' },
    { nombre: 'registrar-material', texto: 'Registrar Material',      icono: 'add_box',         url: '/GestionAlmacen/material/registrar' },
    { nombre: 'vale',               texto: 'Vales y Notas de Salida', icono: 'receipt_long',    url: '/GestionAlmacen/vale' },
    { nombre: 'materiales-reservados', texto: 'Materiales Reservados', icono: 'bookmark',        url: '/GestionAlmacen/materiales-reservados' },
    { nombre: 'kardex',             texto: 'Kardex',                  icono: 'inventory',       url: '/GestionAlmacen/material/kardex' },
    { nombre: 'categoria-material', texto: 'Categoría Material',     icono: 'category',        url: '/GestionAlmacen/categoria-material' },
    { nombre: 'unidad-medida',      texto: 'Unidad de Medida',        icono: 'square_foot',     url: '/GestionAlmacen/unidad-medida' },
  ];
}
