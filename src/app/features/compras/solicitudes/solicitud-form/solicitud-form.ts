import { Component, OnInit, inject, signal, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators
} from '@angular/forms';
import { Router } from '@angular/router';

import { SolpedService } from '../../services/solped.service';
import { ProveedorService } from '../../services/proveedor.service';
import { MaterialService } from '../../../almacen/services/material.service';
import { CategoriaMaterialService } from '../../../almacen/services/categoria-material.service';
import { UnidadMedidaService } from '../../../almacen/services/unidad-medida.service';
import { AuthService } from '../../../../core/services/auth.service';
import { UserSession } from '../../../../core/interfaces/auth';

import { ProveedorResponse } from '../../models/proveedor';
import { MaterialResponse } from '../../../almacen/models/material';
import { CategoriaMaterialResponse } from '../../../almacen/models/categoria-material';
import { UnidadMedidaResponse } from '../../../almacen/models/unidad-medida';
import { SolicitudPedidoRequest, SolicitudPedidoDetalleRequest } from '../../models/solped';

/* ─── Tipo de ítem en la tabla ───────────────────────── */
export interface ItemSolped {
  // producto
  es_nuevo_producto: boolean;
  id_material: number | null;
  cod_materia: string;
  nombre: string;
  id_categoria: number | null;
  nombre_categoria: string;
  id_unidad: number | null;
  nombre_unidad: string;
  stock_minimo: number;
  cantidad_pedida: number;
  precio_referencial: number;
  especificaciones: string;
  // proveedor
  es_nuevo_proveedor: boolean;
  ruc_proveedor: string;
  razon_social_proveedor: string;
}

@Component({
  standalone: true,
  selector: 'app-solicitud-form',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './solicitud-form.html',
  styleUrls: ['./solicitud-form.css']
})
export class SolicitudForm implements OnInit {
  private fb         = inject(FormBuilder);
  private solpedSvc  = inject(SolpedService);
  private provSvc    = inject(ProveedorService);
  private matSvc     = inject(MaterialService);
  private catSvc     = inject(CategoriaMaterialService);
  private unidadSvc  = inject(UnidadMedidaService);
  private authSvc    = inject(AuthService);
  private router     = inject(Router);
  private platformId = inject(PLATFORM_ID);

  /* ── Usuario logueado ── */
  usuarioActual = signal<UserSession | null>(null);

  /* ── Catálogos ── */
  proveedores  = signal<ProveedorResponse[]>([]);
  materiales   = signal<MaterialResponse[]>([]);
  categorias   = signal<CategoriaMaterialResponse[]>([]);
  unidades     = signal<UnidadMedidaResponse[]>([]);

  /* ── Tabla acumulativa ── */
  items = signal<ItemSolped[]>([]);

  /* ── Estado UI ── */
  submitting    = signal(false);
  errorMessage  = signal('');
  successMsg    = signal('');
  proveedorVerificado = signal<ProveedorResponse | null>(null);
  buscandoRuc   = signal(false);

  /* ── Formulario de cabecera ── */
  cabForm!: FormGroup;

  /* ── Formulario de proveedor ── */
  provForm!: FormGroup;
  mostrarFormProveedor = signal(false);

  /* ── Formulario de producto ── */
  prodForm!: FormGroup;
  materialSeleccionado = signal<MaterialResponse | null>(null);
  mostrarModalMaterial = signal(false);
  materialBusqueda     = signal('');
  materialesFiltrados  = signal<MaterialResponse[]>([]);

  /* ── Modo producto ── */
  modoNuevo = signal(false);  // false = catálogo, true = nuevo producto

  ngOnInit() {
    this.initForms();
    if (isPlatformBrowser(this.platformId)) {
      // Cargar usuario logueado
      const sesion = this.authSvc.getSesion();
      this.usuarioActual.set(sesion);
      if (sesion?.dni) {
        this.cabForm.patchValue({ dni_empleado: sesion.dni });
      }
      this.cargarCatalogos();
    }
  }

  /* ─── Inicializar formularios ─── */
  private initForms() {
    this.cabForm = this.fb.group({
      dni_empleado: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(8), Validators.pattern(/^\d+$/)]]
    });

    this.provForm = this.fb.group({
      ruc_buscar:     [''],
      ruc:            ['', [Validators.required, Validators.minLength(11), Validators.maxLength(11)]],
      razon_social:   ['', Validators.required],
      nombre_comercial: [''],
      direccion:      [''],
      correo:         ['', Validators.email],
      telefono:       [''],
      estado:         ['ACTIVO']
    });

    this.prodForm = this.fb.group({
      // producto del catálogo o nuevo
      id_material:    [null],
      cod_materia:    [''],
      nombre:         ['', Validators.required],
      id_categoria:   [null, Validators.required],
      id_unidad:      [null, Validators.required],
      stock_minimo:   [0, [Validators.required, Validators.min(0)]],
      cantidad_pedida:[1, [Validators.required, Validators.min(0.01)]],
      precio_referencial: [0, [Validators.required, Validators.min(0)]],
      especificaciones: ['']
    });
  }

  /* ─── Cargar catálogos ─── */
  private cargarCatalogos() {
    this.provSvc.listar().subscribe({ next: r => this.proveedores.set(r.data || []) });
    this.matSvc.getMateriales().subscribe({ next: r => {
      this.materiales.set(r.data || []);
      this.materialesFiltrados.set(r.data || []);
    }});
    this.catSvc.getCategorias().subscribe({ next: r => this.categorias.set(r.data || []) });
    this.unidadSvc.getUnidades().subscribe({ next: r => this.unidades.set(r.data || []) });
  }

  /* ─── SECCIÓN PROVEEDOR ─── */
  buscarProveedor() {
    const ruc = this.provForm.get('ruc_buscar')?.value?.trim();
    if (!ruc) return;
    this.buscandoRuc.set(true);
    this.proveedorVerificado.set(null);
    this.mostrarFormProveedor.set(false);

    // Buscar en el catálogo local primero
    const local = this.proveedores().find(p => p.ruc === ruc);
    if (local) {
      this.proveedorVerificado.set(local);
      this.buscandoRuc.set(false);
      this.provForm.patchValue({ ruc: local.ruc, razon_social: local.razon_social });
      return;
    }

    // Si no existe, intentar en API
    this.provSvc.getProveedorByRuc(ruc).subscribe({
      next: r => {
        this.proveedorVerificado.set(r.data);
        this.provForm.patchValue({ ruc: r.data?.ruc, razon_social: r.data?.razon_social });
        this.buscandoRuc.set(false);
      },
      error: () => {
        // No existe → habilitar formulario de registro
        this.mostrarFormProveedor.set(true);
        this.provForm.patchValue({ ruc: ruc });
        this.buscandoRuc.set(false);
      }
    });
  }

  registrarProveedor() {
    if (this.provForm.invalid) {
      this.provForm.markAllAsTouched();
      return;
    }
    const v = this.provForm.value;
    const req = { ruc: v.ruc, razon_social: v.razon_social, nombre_comercial: v.nombre_comercial, direccion: v.direccion, correo: v.correo, telefono: v.telefono, estado: 'ACTIVO' };
    this.provSvc.createProveedor(req).subscribe({
      next: r => {
        this.proveedorVerificado.set(r.data);
        this.mostrarFormProveedor.set(false);
        this.successMsg.set('Proveedor registrado correctamente');
        setTimeout(() => this.successMsg.set(''), 3000);
        this.proveedores.update(list => [r.data!, ...list]);
      },
      error: err => {
        this.errorMessage.set(err.error?.message || 'Error al registrar proveedor');
        setTimeout(() => this.errorMessage.set(''), 4000);
      }
    });
  }

  limpiarProveedor() {
    this.proveedorVerificado.set(null);
    this.mostrarFormProveedor.set(false);
    this.provForm.reset({ estado: 'ACTIVO' });
  }

  /* ─── SECCIÓN PRODUCTO ─── */
  usarCatalogo() {
    this.modoNuevo.set(false);
    this.prodForm.reset({ stock_minimo: 0, cantidad_pedida: 1, precio_referencial: 0 });
    this.materialSeleccionado.set(null);
  }

  usarNuevo() {
    this.modoNuevo.set(true);
    this.prodForm.reset({ id_material: null, stock_minimo: 0, cantidad_pedida: 1, precio_referencial: 0 });
    this.materialSeleccionado.set(null);
  }

  abrirModalMaterial() {
    this.materialBusqueda.set('');
    this.materialesFiltrados.set(this.materiales());
    this.mostrarModalMaterial.set(true);
  }

  filtrarMateriales(ev: Event) {
    const q = (ev.target as HTMLInputElement).value.toLowerCase();
    this.materialBusqueda.set(q);
    this.materialesFiltrados.set(
      q ? this.materiales().filter(m => m.descripcion.toLowerCase().includes(q) || m.cod_materia.toLowerCase().includes(q))
        : this.materiales()
    );
  }

  seleccionarDelCatalogo(m: MaterialResponse) {
    this.materialSeleccionado.set(m);
    this.mostrarModalMaterial.set(false);
    const cat = this.categorias().find(c => c.id_categoria === m.id_categoria);
    const uni = this.unidades().find(u => u.id_unidad === m.id_unidad);
    this.prodForm.patchValue({
      id_material:  m.id_material,
      cod_materia:  m.cod_materia,
      nombre:       m.descripcion,
      id_categoria: m.id_categoria,
      id_unidad:    m.id_unidad
    });
  }

  agregarItem() {
    if (!this.proveedorVerificado()) {
      this.errorMessage.set('Debes seleccionar o registrar un proveedor antes de agregar productos.');
      setTimeout(() => this.errorMessage.set(''), 4000);
      return;
    }

    this.prodForm.markAllAsTouched();
    if (this.prodForm.invalid) return;

    const v = this.prodForm.value;
    const prov = this.proveedorVerificado()!;
    const cat  = this.categorias().find(c => c.id_categoria === v.id_categoria);
    const uni  = this.unidades().find(u => u.id_unidad === v.id_unidad);

    const item: ItemSolped = {
      es_nuevo_producto:    this.modoNuevo(),
      id_material:          v.id_material ?? null,
      cod_materia:          v.cod_materia || '-',
      nombre:               v.nombre,
      id_categoria:         v.id_categoria,
      nombre_categoria:     cat?.nombre_categoria || '-',
      id_unidad:            v.id_unidad,
      nombre_unidad:        uni?.nombre_unidad || '-',
      stock_minimo:         v.stock_minimo,
      cantidad_pedida:      v.cantidad_pedida,
      precio_referencial:   v.precio_referencial,
      especificaciones:     v.especificaciones || '',
      es_nuevo_proveedor:   false,
      ruc_proveedor:        prov.ruc,
      razon_social_proveedor: prov.razon_social
    };

    this.items.update(list => {
      // Buscar si el producto ya existe para el mismo proveedor
      const idx = list.findIndex(i => 
        i.ruc_proveedor === item.ruc_proveedor &&
        (
          (i.id_material != null && item.id_material != null && i.id_material === item.id_material) || 
          (i.id_material == null && item.id_material == null && i.nombre.trim().toLowerCase() === item.nombre.trim().toLowerCase())
        )
      );

      if (idx !== -1) {
        // Producto existe, solo sumar cantidad (y opcionalmente actualizar precio)
        const newList = [...list];
        newList[idx].cantidad_pedida += item.cantidad_pedida;
        newList[idx].precio_referencial = item.precio_referencial; // Mantener el último precio ingresado
        if (item.especificaciones) {
           newList[idx].especificaciones = item.especificaciones; // Mantener última especificación
        }
        return newList;
      }
      
      // Producto nuevo, agregar a la lista
      return [...list, item];
    });

    // Limpiar sólo el producto
    this.prodForm.reset({ id_material: null, stock_minimo: 0, cantidad_pedida: 1, precio_referencial: 0 });
    this.materialSeleccionado.set(null);
    if (!this.modoNuevo()) this.modoNuevo.set(false);
  }

  quitarItem(i: number) {
    this.items.update(list => list.filter((_, idx) => idx !== i));
  }

  get totalReferencial(): number {
    return this.items().reduce((sum, it) => sum + it.precio_referencial * it.cantidad_pedida, 0);
  }

  /* ─── GUARDAR SOLICITUD ─── */
  guardar() {
    this.cabForm.markAllAsTouched();
    if (this.cabForm.invalid) {
      this.errorMessage.set('Por favor, ingresa tu DNI válido (8 dígitos) en el Paso 1.');
      setTimeout(() => this.errorMessage.set(''), 4000);
      return;
    }

    if (this.items().length === 0) {
      this.errorMessage.set('Debes agregar al menos un producto a la solicitud.');
      setTimeout(() => this.errorMessage.set(''), 4000);
      return;
    }

    this.submitting.set(true);

    const prov = this.proveedorVerificado()!;
    const detalles: SolicitudPedidoDetalleRequest[] = this.items().map(it => ({
      id_material:        it.id_material,
      cod_materia:        it.cod_materia,
      nombre:             it.nombre,
      id_categoria:       it.id_categoria,
      id_unidad:          it.id_unidad,
      stock_minimo:       it.stock_minimo,
      cantidad_pedida:    it.cantidad_pedida,
      precio_referencial: it.precio_referencial,
      ruc_proveedor:      it.ruc_proveedor,
      nuevo_proveedor:    { 
        ruc: it.ruc_proveedor, 
        razon_social: it.razon_social_proveedor,
        nombre_comercial: prov.nombre_comercial || 'No especificado',
        direccion: prov.direccion || 'No especificada',
        correo: prov.correo || 'sin-correo@empresa.com',
        telefono: prov.telefono || '000000000',
        estado: prov.estado || 'ACTIVO'
      },
      es_nuevo_producto:  it.es_nuevo_producto,
      especificaciones:   it.especificaciones
    }));

    const req: SolicitudPedidoRequest = {
      dni_empleado: this.cabForm.value.dni_empleado,
      detalles
    };

    this.solpedSvc.crear(req).subscribe({
      next: () => {
        this.submitting.set(false);
        this.router.navigate(['/GestionCompras/solicitudes']);
      },
      error: err => {
        this.submitting.set(false);
        
        // Extraer los errores de validación de ASP.NET Core si existen
        let errorMsg = 'Error al guardar la solicitud.';
        if (err.error?.errors) {
          // Flatten the errors object into a string
          const validationErrors = Object.entries(err.error.errors)
            .map(([field, messages]) => `${field}: ${messages}`)
            .join(' | ');
          errorMsg = `Validación falló: ${validationErrors}`;
        } else if (err.error?.message) {
          errorMsg = err.error.message;
        } else if (err.error && typeof err.error === 'string') {
          errorMsg = err.error;
        }
        
        console.error("Backend 400 Error Details:", err.error);
        alert("ERROR DEL BACKEND:\n\n" + JSON.stringify(err.error, null, 2));
        
        this.errorMessage.set(errorMsg);
        setTimeout(() => this.errorMessage.set(''), 10000);
      }
    });
  }


  cancelar() {
    this.router.navigate(['/GestionCompras/solicitudes']);
  }

  /* ── Helpers ── */
  isInvalid(form: FormGroup, field: string) {
    const c = form.get(field);
    return c?.invalid && c?.touched;
  }
}
