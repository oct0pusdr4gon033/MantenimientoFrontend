import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  standalone: true,
  selector: 'app-orden-trabajo',
  imports: [CommonModule],
  template: `
    <div class="page-container">
      <div class="page-header">
        <h1 class="page-title">Órdenes de Trabajo</h1>
        <p class="page-subtitle">Listado y gestión de órdenes de trabajo de mantenimiento</p>
      </div>
      
      <div class="card p-6 text-center">
        <p class="text-muted-sm">Módulo en construcción...</p>
      </div>
    </div>
  `
})
export class OrdenTrabajoComponent {
}
