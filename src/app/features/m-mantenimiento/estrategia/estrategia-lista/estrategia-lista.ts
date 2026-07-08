import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { EstrategiaService } from '../../services/estrategia.service';
import { EstrategiaResponse } from '../../models/EstrategiaResponse';

@Component({
  selector: 'app-estrategia-lista',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, ReactiveFormsModule],
  templateUrl: './estrategia-lista.html',
  styleUrls: ['./estrategia-lista.css']
})
export class EstrategiaLista implements OnInit {
  private estrategiaService = inject(EstrategiaService);
  private fb = inject(FormBuilder);
  
  estrategias = signal<EstrategiaResponse[]>([]);
  filtroBusqueda = signal('');
  estadoFiltro = signal<string>('TODOS');

  // Edit Modal State
  showEditModal = false;
  estrategiaAEditar: EstrategiaResponse | null = null;
  editForm: FormGroup;

  constructor() {
    this.editForm = this.fb.group({
      titulo_estrategia: ['', Validators.required],
      estado: ['ACTIVO', Validators.required]
    });
  }

  estrategiasFiltradas = computed(() => {
    let filtradas = this.estrategias();
    
    // Filtro por Estado
    const estado = this.estadoFiltro();
    if (estado !== 'TODOS') {
      filtradas = filtradas.filter(e => e.estado === estado);
    }

    // Filtro por Búsqueda (texto)
    const q = this.filtroBusqueda().toLowerCase().trim();
    if (q) {
      filtradas = filtradas.filter(e => {
        const pms = e.detalles?.map(d => d.tipo_pm.toLowerCase()).join(' ') || '';
        return (
          e.cod_estrategia?.toLowerCase().includes(q) ||
          e.titulo_estrategia?.toLowerCase().includes(q) ||
          e.cod_flota?.toLowerCase().includes(q) ||
          e.nombre_flota?.toLowerCase().includes(q) ||
          e.cod_equipo?.toLowerCase().includes(q) ||
          pms.includes(q)
        );
      });
    }

    return filtradas;
  });

  ngOnInit() {
    this.cargarEstrategias();
  }

  cargarEstrategias() {
    this.estrategiaService.listar().subscribe({
      next: (data) => {
        if (Array.isArray(data)) {
          this.estrategias.set(data);
        } else if ((data as any).data) {
          this.estrategias.set((data as any).data);
        }
      },
      error: (err) => console.error(err)
    });
  }

  onFiltroChange(valor: string): void {
    this.filtroBusqueda.set(valor);
  }

  onEstadoFiltroChange(event: any): void {
    this.estadoFiltro.set(event.target.value);
  }

  limpiarFiltro(): void {
    this.filtroBusqueda.set('');
    this.estadoFiltro.set('TODOS');
  }

  // --- Modal Edit Logic ---
  abrirModalEditar(estrategia: EstrategiaResponse) {
    this.estrategiaAEditar = estrategia;
    this.editForm.patchValue({
      titulo_estrategia: estrategia.titulo_estrategia,
      estado: estrategia.estado
    });
    this.showEditModal = true;
  }

  cerrarModalEditar() {
    this.showEditModal = false;
    this.estrategiaAEditar = null;
    this.editForm.reset();
  }

  guardarEdicion() {
    if (this.editForm.invalid || !this.estrategiaAEditar) return;
    
    const request = this.editForm.value;
    const id = this.estrategiaAEditar.id_estrategia;

    this.estrategiaService.actualizar(id, request).subscribe({
      next: () => {
        this.cargarEstrategias(); // Reload table
        this.cerrarModalEditar();
      },
      error: (err) => {
        console.error('Error actualizando estrategia', err);
        alert('Ocurrió un error al actualizar la estrategia');
      }
    });
  }
}
