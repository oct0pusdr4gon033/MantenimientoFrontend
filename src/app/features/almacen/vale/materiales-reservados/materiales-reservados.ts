import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ValeService } from '../../services/vale.service';
import { ReservedMaterialResponse } from '../../models/vale';

@Component({
  selector: 'app-materiales-reservados',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './materiales-reservados.html',
  styleUrls: ['./materiales-reservados.css']
})
export class MaterialesReservadosComponent implements OnInit {
  private valeService = inject(ValeService);
  private router = inject(Router);

  // States
  materialesReservados = signal<ReservedMaterialResponse[]>([]);
  cargando = signal<boolean>(true);
  mensajeError = signal<string | null>(null);

  // Search Filter
  filtroBusqueda = signal<string>('');

  ngOnInit(): void {
    this.cargarReservados();
  }

  cargarReservados(): void {
    this.cargando.set(true);
    this.mensajeError.set(null);

    this.valeService.getMaterialesReservados().subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.materialesReservados.set(res.data);
        } else {
          this.mensajeError.set(res.message || 'Error al cargar los materiales reservados');
        }
        this.cargando.set(false);
      },
      error: (err) => {
        this.mensajeError.set(err.error?.message || 'Error de conexión con el servidor');
        this.cargando.set(false);
      }
    });
  }

  // Filtrado local en base al buscador
  get materialesReservadosFiltrados(): ReservedMaterialResponse[] {
    const query = this.filtroBusqueda().toLowerCase().trim();
    const list = this.materialesReservados();
    if (!query) return list;
    return list.filter(m => 
      m.cod_materia.toLowerCase().includes(query) || 
      m.descripcion.toLowerCase().includes(query)
    );
  }

  verKardex(idMaterial: number): void {
    this.router.navigate([`/GestionAlmacen/material/kardex`, idMaterial]);
  }

  volver(): void {
    this.router.navigate(['/GestionAlmacen/dashboard']);
  }
}
