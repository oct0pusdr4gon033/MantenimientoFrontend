import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MaterialService } from '../../services/material.service';
import { CategoriaMaterialService } from '../../services/categoria-material.service';
import { UnidadMedidaService } from '../../services/unidad-medida.service';
import { MaterialRequest, MaterialUpdateRequest, MaterialResponse } from '../../models/material';
import { CategoriaMaterialResponse } from '../../models/categoria-material';
import { UnidadMedidaResponse } from '../../models/unidad-medida';

type ModalMode = 'crear' | 'editar' | null;

@Component({
  selector: 'app-registrar-material',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './registrar-material.html',
  styleUrls: ['./registrar-material.css']
})
export class RegistrarMaterialComponent implements OnInit {
  private svcMaterial = inject(MaterialService);
  private svcCategoria = inject(CategoriaMaterialService);
  private svcUnidad = inject(UnidadMedidaService);

  // ── Estado principal ───────────────────────────────────────
  materiales = signal<MaterialResponse[]>([]);
  categorias = signal<CategoriaMaterialResponse[]>([]);
  unidades = signal<UnidadMedidaResponse[]>([]);
  cargando = signal(false);
  modalMode = signal<ModalMode>(null);
  guardando = signal(false);

  // ── Filtros ────────────────────────────────────────────────
  filtroTexto = signal('');
  filtroCategoria = signal<number | null>(null);
  filtroUnidad = signal<number | null>(null);
  filtroEstado = signal<string>('');

  // ── Filtrado reactivo ──────────────────────────────────────
  materialesFiltrados = computed(() => {
    const q = this.filtroTexto().toLowerCase().trim();
    const cat = this.filtroCategoria();
    const unid = this.filtroUnidad();
    const est = this.filtroEstado();

    return this.materiales().filter(m => {
      const matchesText = !q || 
        (m.cod_materia && m.cod_materia.toLowerCase().includes(q)) ||
        (m.descripcion && m.descripcion.toLowerCase().includes(q));
      
      const matchesCat = !cat || m.id_categoria === cat;
      const matchesUnid = !unid || m.id_unidad === unid;
      const matchesEst = !est || m.estado === est;

      return matchesText && matchesCat && matchesUnid && matchesEst;
    });
  });

  // ── Formulario ─────────────────────────────────────────────
  form: MaterialRequest = this.getDefaultForm();
  idOriginal: number = 0;           // guarda el ID antes de editar
  mensajeError = '';
  mensajeExito = '';

  // Lista de estados fijos para materiales
  estadosDisponibles = ['STOCK', 'MINIMO', 'AGOTADO', 'ACTIVO', 'INACTIVO'];

  ngOnInit(): void {
    this.cargarCategorias();
    this.cargarUnidades();
    this.cargarMateriales();
  }

  cargarCategorias(): void {
    this.svcCategoria.getCategorias().subscribe({
      next: (res) => this.categorias.set(res.data ?? []),
      error: () => this.mostrarError('Error al cargar categorías de materiales.')
    });
  }

  cargarUnidades(): void {
    this.svcUnidad.getUnidades().subscribe({
      next: (res) => this.unidades.set(res.data ?? []),
      error: () => this.mostrarError('Error al cargar unidades de medida.')
    });
  }

  cargarMateriales(): void {
    this.cargando.set(true);
    this.svcMaterial.getMateriales().subscribe({
      next: (res) => {
        this.materiales.set(res.data ?? []);
        this.cargando.set(false);
      },
      error: () => {
        this.mostrarError('No se pudo cargar la lista de materiales.');
        this.cargando.set(false);
      }
    });
  }

  guardar(): void {
    if (!this.form.cod_materia.trim() || !this.form.descripcion.trim() || !this.form.estado) {
      this.mensajeError = 'El código, descripción y estado son obligatorios.';
      return;
    }
    if (this.form.id_categoria <= 0 || this.form.id_unidad <= 0) {
      this.mensajeError = 'Debe seleccionar una categoría y una unidad de medida.';
      return;
    }
    if (this.modalMode() === 'crear' && (this.form.stock === undefined || this.form.stock < 0)) {
      this.mensajeError = 'El stock inicial debe ser mayor o igual a cero.';
      return;
    }

    // Validar código de material (alfanumérico y guiones, máx 50 caracteres)
    const codTrimmed = this.form.cod_materia.trim().toUpperCase();
    if (!/^[A-Z0-9\-]+$/.test(codTrimmed)) {
      this.mensajeError = 'El código de material debe ser alfanumérico (pueden usarse guiones).';
      return;
    }

    this.guardando.set(true);
    this.mensajeError = '';

    if (this.modalMode() === 'crear') {
      const data: MaterialRequest = {
        id_unidad: this.form.id_unidad,
        id_categoria: this.form.id_categoria,
        cod_materia: codTrimmed,
        descripcion: this.form.descripcion.trim(),
        stock: this.form.stock,
        estado: this.form.estado
      };

      this.svcMaterial.createMaterial(data).subscribe({
        next: (res) => {
          this.guardando.set(false);
          if (res.success) {
            this.mostrarExito('Material creado correctamente.');
            this.cerrarModal();
            this.cargarMateriales();
          } else {
            this.mensajeError = res.message || 'Error al guardar.';
          }
        },
        error: (err) => {
          this.guardando.set(false);
          this.mensajeError = err?.error?.message || 'Error al registrar el material. ¿Código duplicado?';
        }
      });
    } else {
      const data: MaterialUpdateRequest = {
        id_unidad: this.form.id_unidad,
        id_categoria: this.form.id_categoria,
        cod_materia: codTrimmed,
        descripcion: this.form.descripcion.trim(),
        estado: this.form.estado
      };

      this.svcMaterial.updateMaterial(this.idOriginal, data).subscribe({
        next: (res) => {
          this.guardando.set(false);
          if (res.success) {
            this.mostrarExito('Material actualizado correctamente.');
            this.cerrarModal();
            this.cargarMateriales();
          } else {
            this.mensajeError = res.message || 'Error al actualizar.';
          }
        },
        error: (err) => {
          this.guardando.set(false);
          this.mensajeError = err?.error?.message || 'Error al actualizar el material.';
        }
      });
    }
  }

  abrirCrear(): void {
    this.form = this.getDefaultForm();
    this.idOriginal = 0;
    this.mensajeError = '';
    this.modalMode.set('crear');
  }

  abrirEditar(mat: MaterialResponse): void {
    this.form = {
      id_unidad: mat.id_unidad,
      id_categoria: mat.id_categoria,
      cod_materia: mat.cod_materia,
      descripcion: mat.descripcion,
      stock: mat.stock, // se incluye en el form local pero estará deshabilitado en HTML
      estado: mat.estado
    };
    this.idOriginal = mat.id_material;
    this.mensajeError = '';
    this.modalMode.set('editar');
  }

  cerrarModal(): void {
    this.modalMode.set(null);
    this.mensajeError = '';
  }

  private getDefaultForm(): MaterialRequest {
    return {
      id_unidad: 0,
      id_categoria: 0,
      cod_materia: '',
      descripcion: '',
      stock: 0,
      estado: 'STOCK'
    };
  }

  onFiltroTextoChange(valor: string): void {
    this.filtroTexto.set(valor);
  }

  onFiltroCategoriaChange(valor: string): void {
    const id = valor ? Number(valor) : null;
    this.filtroCategoria.set(id);
  }

  onFiltroUnidadChange(valor: string): void {
    const id = valor ? Number(valor) : null;
    this.filtroUnidad.set(id);
  }

  onFiltroEstadoChange(valor: string): void {
    this.filtroEstado.set(valor);
  }

  limpiarFiltros(): void {
    this.filtroTexto.set('');
    this.filtroCategoria.set(null);
    this.filtroUnidad.set(null);
    this.filtroEstado.set('');
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
