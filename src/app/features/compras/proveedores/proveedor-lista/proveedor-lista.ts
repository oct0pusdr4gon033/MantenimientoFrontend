import { Component, OnInit, OnDestroy, inject, PLATFORM_ID, signal } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ProveedorService } from '../../services/proveedor.service';
import { 
  ProveedorResponse, 
  CategoriaProveedorResponse, 
  ProveedorContactoResponse,
  ProveedorRequest,
  ProveedorContactoRequest
} from '../../models/proveedor';

@Component({
  standalone: true,
  selector: 'app-proveedor-lista',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './proveedor-lista.html',
  styleUrls: ['./proveedor-lista.css']
})
export class ProveedorListaComponent implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private service = inject(ProveedorService);
  private platformId = inject(PLATFORM_ID);

  // ── Signals (Angular 21 reactive state — immune to NG0100) ─
  proveedores = signal<ProveedorResponse[]>([]);
  categorias = signal<CategoriaProveedorResponse[]>([]);
  loading = signal(false);
  submitting = signal(false);

  // ── Modals & Contexts ─────────────────────────────────────
  showProveedorModal = signal(false);
  showContactoModal = signal(false);
  isEditingProveedor = signal(false);
  isEditingContacto = signal(false);
  selectedProveedor = signal<ProveedorResponse | null>(null);
  selectedContacto = signal<ProveedorContactoResponse | null>(null);

  // ── Forms ─────────────────────────────────────────────────
  filterForm!: FormGroup;
  proveedorForm!: FormGroup;
  contactoForm!: FormGroup;

  // ── Alerts ────────────────────────────────────────────────
  successMessage = signal('');
  errorMessage = signal('');
  private toastTimeout: any;

  // Selected categories for checkboxes in create/edit
  formCategoriasSelected = signal<string[]>([]);

  ngOnInit() {
    this.initFilterForm();
    this.initProveedorForm();
    this.initContactoForm();
    if (isPlatformBrowser(this.platformId)) {
      // Removing queueMicrotask to avoid CD timing issues. 
      // State changes will be pushed to macrotasks where needed.
      this.cargarCategorias();
      this.cargarProveedores();
    }
  }

  ngOnDestroy() {
    if (this.toastTimeout) clearTimeout(this.toastTimeout);
  }

  // ── Form Initializers ─────────────────────────────────────
  private initFilterForm() {
    this.filterForm = this.fb.group({
      ruc: [''],
      razonSocial: [''],
      codCat: ['']
    });
  }

  private initProveedorForm() {
    this.proveedorForm = this.fb.group({
      ruc: ['', [Validators.required, Validators.pattern(/^\d{11}$/)]],
      razon_social: ['', Validators.required],
      nombre_comercial: [''],
      direccion: [''],
      correo: ['', [Validators.email]],
      telefono: [''],
      estado: ['ACTIVO', Validators.required]
    });
  }

  private initContactoForm() {
    this.contactoForm = this.fb.group({
      nombre: ['', Validators.required],
      apellido1: ['', Validators.required],
      apellido2: [''],
      correo: ['', [Validators.email]],
      telefono: [''],
      estado: ['ACTIVO', Validators.required]
    });
  }

  // ── Loaders ──────────────────────────────────────────────
  cargarProveedores() {
    // Push loading state change to next macrotask to avoid NG0100 during init/fast-fetch
    setTimeout(() => this.loading.set(true), 0);
    const { ruc, razonSocial, codCat } = this.filterForm.value;

    const hasFilters = (ruc && ruc.trim()) || (razonSocial && razonSocial.trim()) || (codCat && codCat.trim());
    const query$ = hasFilters
      ? this.service.buscarProveedores(ruc, razonSocial, codCat)
      : this.service.listar();

    query$.subscribe({
      next: (res) => {
        this.proveedores.set(res.data || []);
        setTimeout(() => this.loading.set(false), 0);
      },
      error: (err) => {
        this.showToast('error', 'Error al cargar proveedores: ' + (err.error?.message || err.message));
        setTimeout(() => this.loading.set(false), 0);
      }
    });
  }

  cargarCategorias() {
    this.service.getCategorias().subscribe({
      next: (res) => {
        this.categorias.set(res.data || []);
      },
      error: () => {
        this.showToast('error', 'Error al cargar categorías');
      }
    });
  }

  // ── Supplier CRUD Actions ────────────────────────────────
  abrirNuevoProveedorModal() {
    this.isEditingProveedor.set(false);
    this.proveedorForm.reset({ estado: 'ACTIVO' });
    this.proveedorForm.get('ruc')?.enable();
    this.formCategoriasSelected.set([]);
    this.showProveedorModal.set(true);
  }

  abrirEditarProveedorModal(p: ProveedorResponse) {
    this.isEditingProveedor.set(true);
    this.selectedProveedor.set(p);
    this.proveedorForm.reset({
      ruc: p.ruc,
      razon_social: p.razon_social,
      nombre_comercial: p.nombre_comercial,
      direccion: p.direccion,
      correo: p.correo,
      telefono: p.telefono,
      estado: p.estado
    });
    this.proveedorForm.get('ruc')?.disable(); // RUC is PK, cannot be modified
    this.formCategoriasSelected.set([...p.categorias]);
    this.showProveedorModal.set(true);
  }

  cerrarProveedorModal() {
    this.showProveedorModal.set(false);
    this.selectedProveedor.set(null);
    this.formCategoriasSelected.set([]);
  }

  onCategoryChange(codCat: string, event: Event) {
    const isChecked = (event.target as HTMLInputElement).checked;
    if (isChecked) {
      if (!this.formCategoriasSelected().includes(codCat)) {
        this.formCategoriasSelected.update(cats => [...cats, codCat]);
      }
    } else {
      this.formCategoriasSelected.update(cats => cats.filter(c => c !== codCat));
    }
  }

  isCategoryChecked(codCat: string): boolean {
    return this.formCategoriasSelected().includes(codCat);
  }

  guardarProveedor() {
    if (this.proveedorForm.invalid) {
      this.proveedorForm.markAllAsTouched();
      return;
    }

    setTimeout(() => this.submitting.set(true), 0);
    const formValue = this.proveedorForm.getRawValue();
    const request: ProveedorRequest = {
      ruc: formValue.ruc,
      razon_social: formValue.razon_social,
      nombre_comercial: formValue.nombre_comercial,
      direccion: formValue.direccion,
      correo: formValue.correo,
      telefono: formValue.telefono,
      estado: formValue.estado,
      categorias: this.formCategoriasSelected()
    };

    if (this.isEditingProveedor() && this.selectedProveedor()) {
      this.service.updateProveedor(this.selectedProveedor()!.ruc, request).subscribe({
        next: (res) => {
          this.showToast('success', 'Proveedor actualizado correctamente.');
          if (res.data) {
            this.proveedores.update(list =>
              list.map(p => p.ruc === res.data!.ruc ? res.data! : p)
            );
          }
          this.cerrarProveedorModal();
          setTimeout(() => this.submitting.set(false), 0);
        },
        error: (err) => {
          this.showToast('error', 'Error al actualizar proveedor: ' + (err.error?.message || err.message));
          setTimeout(() => this.submitting.set(false), 0);
        }
      });
    } else {
      this.service.createProveedor(request).subscribe({
        next: (res) => {
          this.showToast('success', 'Proveedor registrado correctamente.');
          if (res.data) {
            this.proveedores.update(list => [...list, res.data!]);
          }
          this.cerrarProveedorModal();
          setTimeout(() => this.submitting.set(false), 0);
        },
        error: (err) => {
          this.showToast('error', 'Error al registrar proveedor: ' + (err.error?.message || err.message));
          setTimeout(() => this.submitting.set(false), 0);
        }
      });
    }
  }

  // ── Contact CRUD Actions ──────────────────────────────────
  abrirContactosModal(p: ProveedorResponse) {
    this.selectedProveedor.set(p);
    this.showContactoModal.set(true);
    this.cancelarEdicionContacto();
  }

  cerrarContactosModal() {
    this.showContactoModal.set(false);
    this.selectedProveedor.set(null);
    this.cancelarEdicionContacto();
  }

  editarContacto(c: ProveedorContactoResponse) {
    this.isEditingContacto.set(true);
    this.selectedContacto.set(c);
    this.contactoForm.reset({
      nombre: c.nombre,
      apellido1: c.apellido1,
      apellido2: c.apellido2,
      correo: c.correo,
      telefono: c.telefono,
      estado: c.estado
    });
  }

  cancelarEdicionContacto() {
    this.isEditingContacto.set(false);
    this.selectedContacto.set(null);
    this.contactoForm.reset({ estado: 'ACTIVO' });
  }

  guardarContacto() {
    if (this.contactoForm.invalid || !this.selectedProveedor()) {
      this.contactoForm.markAllAsTouched();
      return;
    }

    setTimeout(() => this.submitting.set(true), 0);
    const request: ProveedorContactoRequest = this.contactoForm.value;

    if (this.isEditingContacto() && this.selectedContacto()) {
      this.service.updateContacto(this.selectedContacto()!.id_contacto, request).subscribe({
        next: (res) => {
          this.showToast('success', 'Contacto actualizado correctamente.');
          if (res.data) {
            this.actualizarContactoEnListaLocal(res.data);
          }
          this.cancelarEdicionContacto();
          setTimeout(() => this.submitting.set(false), 0);
        },
        error: (err) => {
          this.showToast('error', 'Error al actualizar contacto: ' + (err.error?.message || err.message));
          setTimeout(() => this.submitting.set(false), 0);
        }
      });
    } else {
      this.service.addContacto(this.selectedProveedor()!.ruc, request).subscribe({
        next: (res) => {
          this.showToast('success', 'Contacto agregado correctamente.');
          if (res.data) {
            this.agregarContactoAListaLocal(res.data);
          }
          this.cancelarEdicionContacto();
          setTimeout(() => this.submitting.set(false), 0);
        },
        error: (err) => {
          this.showToast('error', 'Error al registrar contacto: ' + (err.error?.message || err.message));
          setTimeout(() => this.submitting.set(false), 0);
        }
      });
    }
  }

  private agregarContactoAListaLocal(contacto: ProveedorContactoResponse) {
    const p = this.selectedProveedor();
    if (p) {
      // Update the signal list to reflect the new contact count
      this.proveedores.update(list =>
        list.map(item => item.ruc === p.ruc
          ? { ...item, contactos: [...item.contactos, contacto] }
          : item
        )
      );
      // Keep selectedProveedor in sync for the open modal
      this.selectedProveedor.set({
        ...p,
        contactos: [...p.contactos, contacto]
      });
    }
  }

  private actualizarContactoEnListaLocal(contacto: ProveedorContactoResponse) {
    const p = this.selectedProveedor();
    if (p) {
      const updatedContactos = p.contactos.map(c =>
        c.id_contacto === contacto.id_contacto ? contacto : c
      );
      // Update the signal list
      this.proveedores.update(list =>
        list.map(item => item.ruc === p.ruc
          ? { ...item, contactos: updatedContactos }
          : item
        )
      );
      // Keep selectedProveedor in sync for the open modal
      this.selectedProveedor.set({ ...p, contactos: updatedContactos });
    }
  }

  // ── Helper UI Methods ──────────────────────────────────────
  limpiarFiltros() {
    this.filterForm.reset();
    this.cargarProveedores();
  }

  getCategoriasString(p: ProveedorResponse): string {
    return p.categorias && p.categorias.length > 0 ? p.categorias.join(', ') : 'Ninguna';
  }

  showToast(type: 'success' | 'error', msg: string) {
    if (type === 'success') {
      this.successMessage.set(msg);
      this.errorMessage.set('');
    } else {
      this.errorMessage.set(msg);
      this.successMessage.set('');
    }

    if (this.toastTimeout) clearTimeout(this.toastTimeout);
    this.toastTimeout = setTimeout(() => {
      this.successMessage.set('');
      this.errorMessage.set('');
    }, 4000);
  }
}
