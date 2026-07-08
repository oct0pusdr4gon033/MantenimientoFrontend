import { Component, Input, OnInit } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { NgClass, CommonModule } from '@angular/common';
import { MenuItem } from '../../../core/interfaces/menu-item';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  standalone: true,
  selector: 'app-sidebar',
  imports: [RouterLink, RouterLinkActive, NgClass, CommonModule],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent implements OnInit {
  @Input() menuItems: MenuItem[] = [];
  @Input() moduloNombre: string = 'Sistema';
  @Input() moduloColor: string = '#e86b1a';

  nombreUsuario: string = '';
  rolUsuario: string = '';

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    const sesion = this.authService.getSesion();
    if (sesion) {
      this.nombreUsuario = `${sesion.nombre} ${sesion.apellidos}`;
      this.rolUsuario    = sesion.rol.replace(/_/g, ' ');
    }
  }

  logout(): void {
    this.authService.logout();
  }
}