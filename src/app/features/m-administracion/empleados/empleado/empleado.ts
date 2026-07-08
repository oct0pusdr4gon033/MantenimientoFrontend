import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { EmpleadoService } from '../services/Empleado.service';
import { RolService } from '../services/Rol.service';
import { EmpleadoResponse } from '../models/EmpleadoResponse';
import { EmpleadoRequest } from '../models/EmpleadoRequest';
import { RolResponse } from '../models/RolResponse';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-empleado',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './empleado.html',
  styleUrl: './empleado.css'
})
export class Empleado implements OnInit {
  empleados = signal<EmpleadoResponse[]>([]);
  roles = signal<RolResponse[]>([]);
  
  cargando = signal<boolean>(true);
  
  modalVisible = signal<boolean>(false);
  modoEdicion = signal<boolean>(false);
  empleadoSeleccionado = signal<EmpleadoResponse | null>(null);

  empleadoForm: FormGroup;
  guardando = signal<boolean>(false);
  private router = inject(Router);

  constructor(
    private empleadoService: EmpleadoService,
    private rolService: RolService,
    private fb: FormBuilder
  ) {
    this.empleadoForm = this.fb.group({
      dni_empleado: ['', [Validators.required, Validators.maxLength(20)]],
      codigo_empleado: [''],
      nombre: ['', Validators.required],
      apellido1: ['', Validators.required],
      apellido2: [''],
      telf: [''],
      email: ['', [Validators.email]],
      id_rol: ['', Validators.required],
      estado: [true],
      password_hash: ['']
    });
  }

  ngOnInit(): void {
    this.cargarRoles();
    this.cargarEmpleados();
  }

  cargarRoles() {
    this.rolService.listar().subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.roles.set(res.data);
        }
      }
    });
  }

  cargarEmpleados() {
    this.cargando.set(true);
    this.empleadoService.listar().subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.empleados.set(res.data);
        }
        this.cargando.set(false);
      },
      error: () => {
        Swal.fire('Error', 'No se pudo cargar la lista de empleados', 'error');
        this.cargando.set(false);
      }
    });
  }

  abrirModalNuevo() {
    this.modoEdicion.set(false);
    this.empleadoSeleccionado.set(null);
    this.empleadoForm.reset({ estado: true });
    // DNI se puede editar si es nuevo
    this.empleadoForm.get('dni_empleado')?.enable();
    this.modalVisible.set(true);
  }

  abrirModalEditar(empleado: EmpleadoResponse) {
    this.modoEdicion.set(true);
    this.empleadoSeleccionado.set(empleado);
    this.empleadoForm.patchValue({
      dni_empleado: empleado.dni_empleado,
      codigo_empleado: empleado.codigo_empleado,
      nombre: empleado.nombre,
      apellido1: empleado.apellido1,
      apellido2: empleado.apellido2,
      telf: empleado.telf,
      email: empleado.email,
      id_rol: empleado.id_rol,
      estado: empleado.estado,
      password_hash: '' // No se carga el hash
    });
    // DNI no se puede editar una vez creado
    this.empleadoForm.get('dni_empleado')?.disable();
    this.modalVisible.set(true);
  }

  cerrarModal() {
    this.modalVisible.set(false);
    this.empleadoForm.reset();
  }

  guardar() {
    if (this.empleadoForm.invalid) return;

    this.guardando.set(true);
    
    // Si dni está disable, al hacer getRawValue obtenemos su valor.
    const request: EmpleadoRequest = this.empleadoForm.getRawValue();

    if (this.modoEdicion() && this.empleadoSeleccionado()) {
      const dni = this.empleadoSeleccionado()!.dni_empleado;
      this.empleadoService.actualizar(dni, request).subscribe({
        next: (res) => {
          if (res.success) {
            Swal.fire('Éxito', 'Empleado actualizado correctamente', 'success');
            this.cerrarModal();
            this.cargarEmpleados();
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
      this.empleadoService.crear(request).subscribe({
        next: (res) => {
          if (res.success) {
            Swal.fire('Éxito', 'Empleado creado correctamente', 'success');
            this.cerrarModal();
            this.cargarEmpleados();
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

  eliminar(empleado: EmpleadoResponse) {
    Swal.fire({
      title: '¿Estás seguro?',
      html: `<p class="confirm-text">Se eliminará el empleado <b>${empleado.nombre} ${empleado.apellido1}</b>.</p>`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.empleadoService.eliminar(empleado.dni_empleado).subscribe({
          next: (res) => {
            if (res.success) {
              Swal.fire('Eliminado', 'Empleado eliminado correctamente', 'success');
              this.cargarEmpleados();
            } else {
              Swal.fire('Error', res.message || 'No se pudo eliminar el empleado', 'error');
            }
          },
          error: () => Swal.fire('Error', 'No se pudo eliminar el empleado', 'error')
        });
      }
    });
  }

  verExpediente(dni: string) {
    this.router.navigate(['/GestionAdministracion/expediente-empleado/detalle', dni]);
  }
}
