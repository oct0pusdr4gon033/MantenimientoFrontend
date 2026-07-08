import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RolService } from '../services/Rol.service';
import { RolResponse } from '../models/RolResponse';
import { RolRequest } from '../models/RolRequest';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-rol',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './rol.html',
  styleUrl: './rol.css'
})
export class Rol implements OnInit {
  roles = signal<RolResponse[]>([]);
  cargando = signal<boolean>(true);
  
  modalVisible = signal<boolean>(false);
  modoEdicion = signal<boolean>(false);
  rolSeleccionado = signal<RolResponse | null>(null);

  rolForm: FormGroup;
  guardando = signal<boolean>(false);

  constructor(
    private rolService: RolService,
    private fb: FormBuilder
  ) {
    this.rolForm = this.fb.group({
      nombre_rol: ['', Validators.required],
      prefijo: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    this.cargarRoles();
  }

  cargarRoles() {
    this.cargando.set(true);
    this.rolService.listar().subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.roles.set(res.data);
        }
        this.cargando.set(false);
      },
      error: () => {
        Swal.fire('Error', 'No se pudo cargar la lista de roles', 'error');
        this.cargando.set(false);
      }
    });
  }

  abrirModalNuevo() {
    this.modoEdicion.set(false);
    this.rolSeleccionado.set(null);
    this.rolForm.reset();
    this.modalVisible.set(true);
  }

  abrirModalEditar(rol: RolResponse) {
    this.modoEdicion.set(true);
    this.rolSeleccionado.set(rol);
    this.rolForm.patchValue({
      nombre_rol: rol.nombre_rol,
      prefijo: rol.prefijo
    });
    this.modalVisible.set(true);
  }

  cerrarModal() {
    this.modalVisible.set(false);
    this.rolForm.reset();
  }

  guardar() {
    if (this.rolForm.invalid) return;

    this.guardando.set(true);
    const request: RolRequest = this.rolForm.value;

    if (this.modoEdicion() && this.rolSeleccionado()) {
      const id = this.rolSeleccionado()!.id_rol;
      this.rolService.actualizar(id, request).subscribe({
        next: (res) => {
          if (res.success) {
            Swal.fire('Éxito', 'Rol actualizado correctamente', 'success');
            this.cerrarModal();
            this.cargarRoles();
          } else {
            Swal.fire('Error', res.message || 'Error al actualizar', 'error');
          }
          this.guardando.set(false);
        },
        error: () => {
          Swal.fire('Error', 'Ocurrió un error en el servidor', 'error');
          this.guardando.set(false);
        }
      });
    } else {
      this.rolService.crear(request).subscribe({
        next: (res) => {
          if (res.success) {
            Swal.fire('Éxito', 'Rol creado correctamente', 'success');
            this.cerrarModal();
            this.cargarRoles();
          } else {
            Swal.fire('Error', res.message || 'Error al crear', 'error');
          }
          this.guardando.set(false);
        },
        error: () => {
          Swal.fire('Error', 'Ocurrió un error en el servidor', 'error');
          this.guardando.set(false);
        }
      });
    }
  }

  eliminar(rol: RolResponse) {
    Swal.fire({
      title: '¿Estás seguro?',
      html: `<p class="confirm-text">Se eliminará el rol <b>${rol.nombre_rol}</b>. Esta acción no se puede deshacer.</p>`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.rolService.eliminar(rol.id_rol).subscribe({
          next: (res) => {
            if (res.success) {
              Swal.fire('Eliminado', 'Rol eliminado correctamente', 'success');
              this.cargarRoles();
            } else {
              Swal.fire('Error', res.message || 'No se pudo eliminar el rol', 'error');
            }
          },
          error: () => Swal.fire('Error', 'No se pudo eliminar el rol', 'error')
        });
      }
    });
  }
}
