import { Component, OnInit, inject, signal, PLATFORM_ID } from '@angular/core';
import { CommonModule, CurrencyPipe, isPlatformBrowser } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { Router } from '@angular/router';

import { CotizacionService } from '../../services/cotizacion.service';
import { ProveedorService } from '../../services/proveedor.service';
import { MaterialService } from '../../../almacen/services/material.service';
import { SolpedService } from '../../services/solped.service';

import { ProveedorResponse } from '../../models/proveedor';
import { MaterialResponse } from '../../../almacen/models/material';
import { CotizacionRequest, CotizacionDetalleRequest } from '../../models/cotizacion';
import { SolicitudPedidoResponse } from '../../models/solped';

@Component({
  standalone: true,
  selector: 'app-cotizacion-form',
  imports: [CommonModule, ReactiveFormsModule],
  providers: [CurrencyPipe],
  templateUrl: './cotizacion-form.html',
  styleUrls: ['./cotizacion-form.css']
})
export class CotizacionFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private cotizacionService = inject(CotizacionService);
  private proveedorService = inject(ProveedorService);
  private materialService = inject(MaterialService);
  private solpedService = inject(SolpedService);
  private router = inject(Router);
  private platformId = inject(PLATFORM_ID);

  cotizacionForm!: FormGroup;
  proveedores = signal<ProveedorResponse[]>([]);
  solpedsActivas = signal<SolicitudPedidoResponse[]>([]);
  
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
      this.cargarSolpeds();
    }
  }

  private initForm() {
    this.cotizacionForm = this.fb.group({
      ruc_proveedor: ['', Validators.required],
      id_solicitud_pedido: [null],
      detalles: this.fb.array([], Validators.required)
    });
  }

  get detallesFormArray() {
    return this.cotizacionForm.get('detalles') as FormArray;
  }

  cargarProveedores() {
    this.proveedorService.listar().subscribe({
      next: (res) => {
        this.proveedores.set(res.data || []);
      }
    });
  }

  cargarSolpeds() {
    this.solpedService.listar().subscribe({
      next: (res) => {
        // Asumiendo que el estado es 'ACTIVA', 'ACTIVO' o similar
        const activas = (res.data || []).filter(s => s.estado?.toUpperCase().includes('ACTIV') || s.estado === 'PENDIENTE');
        this.solpedsActivas.set(activas);
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
    // Check if already added
    const exists = this.detallesFormArray.controls.some(
      ctrl => ctrl.get('id_material')?.value === material.id_material
    );
    
    if (exists) {
      alert('Este material ya fue agregado a la cotización.');
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

    // Update subtotal automatically when quantity or price changes
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

  get totalCotizacion(): number {
    let t = 0;
    this.detallesFormArray.controls.forEach(ctrl => {
      t += ctrl.get('subtotal')?.value || 0;
    });
    return t;
  }

  guardar() {
    if (this.cotizacionForm.invalid || this.detallesFormArray.length === 0) {
      alert('Por favor complete todos los campos requeridos y agregue al menos un material.');
      return;
    }

    this.submitting.set(true);
    const formValue = this.cotizacionForm.value;

    const request: CotizacionRequest = {
      ruc_proveedor: formValue.ruc_proveedor,
      id_solicitud_pedido: formValue.id_solicitud_pedido ? Number(formValue.id_solicitud_pedido) : null,
      detalles: formValue.detalles.map((d: any) => ({
        id_material: d.id_material,
        cantidad: d.cantidad,
        precio_unitario: d.precio_unitario
      }))
    };

    this.cotizacionService.crear(request).subscribe({
      next: () => {
        this.submitting.set(false);
        this.router.navigate(['/GestionCompras/cotizaciones']);
      },
      error: (err) => {
        this.submitting.set(false);
        this.errorMessage.set(err.error?.message || 'Error al guardar la cotización');
        setTimeout(() => this.errorMessage.set(''), 4000);
      }
    });
  }

  cancelar() {
    this.router.navigate(['/GestionCompras/cotizaciones']);
  }
}
