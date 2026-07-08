import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { CategoriaMaterialService } from '../../services/categoria-material.service';
import { CategoriaMaterialResponse, CategoriaMaterialRequest } from '../../models/categoria-material';

type ModalMode = 'crear' | 'editar' | null;

@Component({
  selector: 'app-categoria-material-lista',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './categoria-material-lista.html',
  styleUrls: ['./categoria-material-lista.css']
})
export class CategoriaMaterialListaComponent implements OnInit {
  private svc = inject(CategoriaMaterialService);

  // ── Estado principal ───────────────────────────────────────
  categorias = signal<CategoriaMaterialResponse[]>([]);
  cargando = signal(false);
  modalMode = signal<ModalMode>(null);
  guardando = signal(false);

  // ── Filtros ────────────────────────────────────────────────
  filtroBusqueda = signal('');

  // ── Filtrado reactivo ──────────────────────────────────────
  categoriasFiltradas = computed(() => {
    const q = this.filtroBusqueda().toLowerCase().trim();
    if (!q) return this.categorias();
    return this.categorias().filter(c =>
      (c.nombre_categoria && c.nombre_categoria.toLowerCase().includes(q)) ||
      (c.cod_cat && c.cod_cat.toLowerCase().includes(q))
    );
  });

  // ── Formulario ─────────────────────────────────────────────
  form: CategoriaMaterialRequest = this.getDefaultForm();
  idOriginal: number = 0;           // guarda el ID antes de editar
  mensajeError = '';
  mensajeExito = '';

  ngOnInit(): void {
    this.cargarCategorias();
  }

  cargarCategorias(): void {
    this.cargando.set(true);
    this.svc.getCategorias().subscribe({
      next: (res) => {
        this.categorias.set(res.data ?? []);
        this.cargando.set(false);
      },
      error: () => {
        this.mostrarError('No se pudo cargar la lista de categorías.');
        this.cargando.set(false);
      }
    });
  }

  guardar(): void {
    if (!this.form.cod_cat.trim() || !this.form.nombre_categoria.trim()) {
      this.mensajeError = 'El código y el nombre de la categoría son obligatorios.';
      return;
    }
    
    // Validar código de categoría (solo letras y números, sin espacios, máx 20 caracteres)
    const codTrimmed = this.form.cod_cat.trim().toUpperCase();
    if (!/^[A-Z0-9]+$/.test(codTrimmed)) {
      this.mensajeError = 'El código de categoría debe ser alfanumérico sin espacios.';
      return;
    }

    this.guardando.set(true);
    this.mensajeError = '';

    const dataToSend: CategoriaMaterialRequest = {
      cod_cat: codTrimmed,
      nombre_categoria: this.form.nombre_categoria.trim()
    };

    const operacion = this.modalMode() === 'crear'
      ? this.svc.createCategoria(dataToSend)
      : this.svc.updateCategoria(this.idOriginal, dataToSend);

    operacion.subscribe({
      next: (res) => {
        this.guardando.set(false);
        if (res.success) {
          this.mostrarExito(this.modalMode() === 'crear' ? 'Categoría creada correctamente.' : 'Categoría actualizada correctamente.');
          this.cerrarModal();
          this.cargarCategorias();
        } else {
          this.mensajeError = res.message || 'Error al guardar.';
        }
      },
      error: (err) => {
        this.guardando.set(false);
        this.mensajeError = err?.error?.message || 'Error al conectar con el servidor o código duplicado.';
      }
    });
  }

  abrirCrear(): void {
    this.form = this.getDefaultForm();
    this.idOriginal = 0;
    this.mensajeError = '';
    this.modalMode.set('crear');
  }

  abrirEditar(cat: CategoriaMaterialResponse): void {
    this.form = {
      cod_cat: cat.cod_cat,
      nombre_categoria: cat.nombre_categoria
    };
    this.idOriginal = cat.id_categoria;
    this.mensajeError = '';
    this.modalMode.set('editar');
  }

  cerrarModal(): void {
    this.modalMode.set(null);
    this.mensajeError = '';
  }

  private getDefaultForm(): CategoriaMaterialRequest {
    return {
      cod_cat: '',
      nombre_categoria: ''
    };
  }

  onFiltroChange(valor: string): void {
    this.filtroBusqueda.set(valor);
  }

  limpiarFiltro(): void {
    this.filtroBusqueda.set('');
  }

  private mostrarError(msg: string): void {
    this.mensajeExito = '';
    this.mensajeError = msg;
    setTimeout(() => this.mensajeError = '', 4000);
  }

  private mostrarExito(msg: string): void {
    this.mensajeError = '';
    this.mensajeExito = msg;
    setTimeout(() => this.mensajeExito = '', 3000);
  }
}
