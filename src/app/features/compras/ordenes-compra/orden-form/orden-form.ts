import { Component, OnInit, inject, signal, PLATFORM_ID } from '@angular/core';
import { CommonModule, CurrencyPipe, isPlatformBrowser } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { Router } from '@angular/router';

import { OrdenCompraService } from '../../services/orden-compra.service';
import { ProveedorService } from '../../services/proveedor.service';
import { MaterialService } from '../../../almacen/services/material.service';
import { CotizacionService } from '../../services/cotizacion.service';

import { ProveedorResponse } from '../../models/proveedor';
import { MaterialResponse } from '../../../almacen/models/material';
import { OrdenCompraRequest } from '../../models/orden-compra';
import { CotizacionResponse } from '../../models/cotizacion';

@Component({
  standalone: true,
  selector: 'app-orden-form',
  imports: [CommonModule, ReactiveFormsModule],
  providers: [CurrencyPipe],
  templateUrl: './orden-form.html',
  styleUrls: ['./orden-form.css']
})
export class OrdenFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private ordenService = inject(OrdenCompraService);
  private proveedorService = inject(ProveedorService);
  private materialService = inject(MaterialService);
  private cotizacionService = inject(CotizacionService);
  private router = inject(Router);
  private platformId = inject(PLATFORM_ID);

  ordenForm!: FormGroup;
  proveedores = signal<ProveedorResponse[]>([]);
  cotizacionesActivas = signal<CotizacionResponse[]>([]);

  // Material selector modal
  showMaterialModal = signal(false);
  materiales = signal<MaterialResponse[]>([]);
  materialesFiltrados = signal<MaterialResponse[]>([]);
  materialSearchQuery = signal('');

  submitting = signal(false);
  errorMessage = signal('');

  ngOnInit() {
    this.initForm();
    if (isPlatformBrowser(this.platformId)) {
      this.cargarProveedores();
      this.cargarMateriales();
      this.cargarCotizaciones();
    }
  }

  private initForm() {
    this.ordenForm = this.fb.group({
      ruc_proveedor: ['', Validators.required],
      id_cotizacion: [null],
      detalles: this.fb.array([], Validators.required)
    });
  }

  get detallesFormArray() {
    return this.ordenForm.get('detalles') as FormArray;
  }

  cargarProveedores() {
    this.proveedorService.listar().subscribe({
      next: (res) => {
        this.proveedores.set(res.data || []);
      }
    });
  }

  cargarCotizaciones() {
    this.cotizacionService.listar().subscribe({
      next: (res) => {
        const activas = (res.data || []).filter(c => c.estado === 'PENDIENTE' || c.estado === 'APROBADO');
        this.cotizacionesActivas.set(activas);
      }
    });
  }

  cargarMateriales() {
    this.materialService.getMateriales().subscribe({
      next: (res) => {
        this.materiales.set(res.data || []);
        this.materialesFiltrados.set(res.data || []);
      }
    });
  }

  // ── Material Modal ──
  abrirModalMaterial() {
    this.materialSearchQuery.set('');
    this.materialesFiltrados.set(this.materiales());
    this.showMaterialModal.set(true);
  }

  cerrarModalMaterial() {
    this.showMaterialModal.set(false);
  }

  filtrarMateriales(event: Event) {
    const query = (event.target as HTMLInputElement).value.toLowerCase();
    this.materialSearchQuery.set(query);
    if (!query) {
      this.materialesFiltrados.set(this.materiales());
      return;
    }
    const filtrados = this.materiales().filter(m =>
      m.descripcion.toLowerCase().includes(query) ||
      m.cod_materia.toLowerCase().includes(query)
    );
    this.materialesFiltrados.set(filtrados);
  }

  seleccionarMaterial(material: MaterialResponse) {
    const exists = this.detallesFormArray.controls.some(
      ctrl => ctrl.get('id_material')?.value === material.id_material
    );

    if (exists) {
      alert('Este material ya fue agregado a la orden.');
      return;
    }

    const detalleGroup = this.fb.group({
      id_material: [material.id_material, Validators.required],
      cod_materia: [material.cod_materia],
      descripcion: [material.descripcion],
      cantidad: [1, [Validators.required, Validators.min(0.01)]],
      precio_unitario: [0, [Validators.required, Validators.min(0)]],
      subtotal: [0]
    });

    detalleGroup.valueChanges.subscribe(val => {
      const q = val.cantidad || 0;
      const p = val.precio_unitario || 0;
      detalleGroup.get('subtotal')?.setValue(q * p, { emitEvent: false });
    });

    this.detallesFormArray.push(detalleGroup);
    this.cerrarModalMaterial();
  }

  removerDetalle(index: number) {
    this.detallesFormArray.removeAt(index);
  }

  get totalOrden(): number {
    let t = 0;
    this.detallesFormArray.controls.forEach(ctrl => {
      t += ctrl.get('subtotal')?.value || 0;
    });
    return t;
  }

  guardar() {
    if (this.ordenForm.invalid || this.detallesFormArray.length === 0) {
      alert('Por favor complete todos los campos requeridos y agregue al menos un material.');
      return;
    }

    this.submitting.set(true);
    const formValue = this.ordenForm.value;

    const request: OrdenCompraRequest = {
      ruc_proveedor: formValue.ruc_proveedor,
      id_cotizacion: formValue.id_cotizacion ? Number(formValue.id_cotizacion) : null,
      detalles: formValue.detalles.map((d: any) => ({
        id_material: d.id_material,
        cantidad: d.cantidad,
        precio_unitario: d.precio_unitario
      }))
    };

    this.ordenService.crear(request).subscribe({
      next: () => {
        this.submitting.set(false);
        this.router.navigate(['/GestionCompras/ordenes']);
      },
      error: (err) => {
        this.submitting.set(false);
        this.errorMessage.set(err.error?.message || 'Error al guardar la orden de compra');
        setTimeout(() => this.errorMessage.set(''), 4000);
      }
    });
  }

  cancelar() {
    this.router.navigate(['/GestionCompras/ordenes']);
  }
}
