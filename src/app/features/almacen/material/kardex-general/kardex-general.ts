import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MaterialService } from '../../services/material.service';
import { MaterialResponse } from '../../models/material';

@Component({
  selector: 'app-kardex-general',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './kardex-general.html',
  styleUrls: ['./kardex-general.css']
})
export class KardexGeneralComponent implements OnInit {
  private materialService = inject(MaterialService);
  private router = inject(Router);

  // States
  materiales = signal<MaterialResponse[]>([]);
  cargando = signal<boolean>(true);
  mensajeError = signal<string | null>(null);

  // Search Filter
  filtroBusqueda = signal<string>('');

  ngOnInit(): void {
    this.cargarMateriales();
  }

  cargarMateriales(): void {
    this.cargando.set(true);
    this.mensajeError.set(null);

    this.materialService.getMateriales().subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.materiales.set(res.data);
        } else {
          this.mensajeError.set(res.message || 'Error al cargar el inventario');
        }
        this.cargando.set(false);
      },
      error: (err) => {
        this.mensajeError.set(err.error?.message || 'Error de conexión con el servidor');
        this.cargando.set(false);
      }
    });
  }

  // Local filter based on search query
  materialesFiltrados = computed(() => {
    const query = this.filtroBusqueda().toLowerCase().trim();
    const list = this.materiales();
    if (!query) return list;
    return list.filter(m =>
      m.cod_materia.toLowerCase().includes(query) ||
      m.descripcion.toLowerCase().includes(query) ||
      m.nombre_categoria.toLowerCase().includes(query)
    );
  });

  verKardex(idMaterial: number): void {
    this.router.navigate([`/GestionAlmacen/material/kardex`, idMaterial]);
  }

  formatearEstado(estado: string): string {
    const map: Record<string, string> = {
      AGOTADO: 'Agotado',
      STOCK: 'En Stock',
      MINIMO: 'Stock Mínimo',
      ACTIVO: 'Activo',
      INACTIVO: 'Inactivo'
    };
    return map[estado] ?? estado;
  }
}
