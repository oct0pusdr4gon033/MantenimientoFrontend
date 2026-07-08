import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ExpedienteEmpleadoService } from '../services/expediente-empleado.service';
import { ExpedienteEmpleadoResponse, ExpedienteEmpleadoRequest } from '../models/ExpedienteEmpleadoModels';
import { FormsModule } from '@angular/forms';
import { EmpleadoService } from '../services/Empleado.service';
import { EmpleadoResponse } from '../models/EmpleadoResponse';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-expedientes-empleados',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './expedientes-empleados.html',
  styleUrls: ['./expedientes-empleados.css'],
})
export class ExpedientesEmpleadosComponent implements OnInit {
  private expedienteService = inject(ExpedienteEmpleadoService);
  private router = inject(Router);

  expedientes = signal<ExpedienteEmpleadoResponse[]>([]);
  cargando = signal<boolean>(true);
  filtroBusqueda = signal<string>('');

  // ═══════════════════════════════════════════════════════
  // Modal Crear Expediente
  // ═══════════════════════════════════════════════════════
  private empleadoService = inject(EmpleadoService);
  modalVisible = signal<boolean>(false);
  guardando = signal<boolean>(false);
  mensajeError = signal<string | null>(null);

  formExpediente: ExpedienteEmpleadoRequest = {
    dniEmpleado: '',
    codigoExpEmp: ''
  };

  empleadosDisponibles = signal<EmpleadoResponse[]>([]);
  empleadosFiltrados = signal<EmpleadoResponse[]>([]);
  filtroEmpleado = signal<string>('');
  empleadoSeleccionadoNombre = signal<string>('');

  ngOnInit(): void {
    this.cargarExpedientes();
  }

  cargarExpedientes() {
    this.cargando.set(true);
    this.expedienteService.obtenerTodos().subscribe({
      next: (res) => {
        if (res) {
          this.expedientes.set(res);
        }
        this.cargando.set(false);
      },
      error: (err) => {
        console.error('Error cargando expedientes', err);
        this.cargando.set(false);
      }
    });
  }

  get expedientesFiltrados() {
    const filtro = this.filtroBusqueda().toLowerCase();
    if (!filtro) return this.expedientes();
    return this.expedientes().filter(e => 
      e.codigoExpEmp?.toLowerCase().includes(filtro) ||
      e.nombreCompleto?.toLowerCase().includes(filtro) ||
      e.dniEmpleado?.toLowerCase().includes(filtro)
    );
  }

  verDetalles(codigoExp: string) {
    // Buscar expediente para sacar el DNI
    const exp = this.expedientes().find(e => e.codigoExpEmp === codigoExp);
    if (exp && exp.dniEmpleado) {
      this.router.navigate(['/GestionAdministracion/expediente-empleado/detalle', exp.dniEmpleado]);
    }
  }

  // ═══════════════════════════════════════════════════════
  // Métodos del Modal
  // ═══════════════════════════════════════════════════════

  abrirModalNuevo() {
    this.formExpediente = { dniEmpleado: '', codigoExpEmp: '' };
    this.empleadoSeleccionadoNombre.set('');
    this.filtroEmpleado.set('');
    this.mensajeError.set(null);
    this.modalVisible.set(true);

    this.empleadoService.listar().subscribe({
      next: (res) => {
        if (res.success && res.data) {
          const dnisConExpediente = this.expedientes().map(e => e.dniEmpleado);
          const disponibles = res.data.filter(emp => !dnisConExpediente.includes(emp.dni_empleado));
          this.empleadosDisponibles.set(disponibles);
          this.empleadosFiltrados.set(disponibles);
        }
      }
    });
  }

  cerrarModal() {
    this.modalVisible.set(false);
  }

  filtrarEmpleados(event: any) {
    const texto = event.target.value.toLowerCase();
    this.filtroEmpleado.set(texto);
    if (!texto) {
      this.empleadosFiltrados.set(this.empleadosDisponibles());
      return;
    }
    const filtrados = this.empleadosDisponibles().filter(e => 
      e.nombre.toLowerCase().includes(texto) || 
      e.apellido1.toLowerCase().includes(texto) ||
      e.dni_empleado.toLowerCase().includes(texto)
    );
    this.empleadosFiltrados.set(filtrados);
  }

  seleccionarEmpleado(emp: EmpleadoResponse) {
    this.formExpediente.dniEmpleado = emp.dni_empleado;
    this.empleadoSeleccionadoNombre.set(`${emp.nombre} ${emp.apellido1} - DNI: ${emp.dni_empleado}`);
  }

  guardarExpediente() {
    if (!this.formExpediente.dniEmpleado) {
      this.mensajeError.set('Debe seleccionar un empleado.');
      return;
    }
    if (!this.formExpediente.codigoExpEmp) {
      this.mensajeError.set('El código del expediente es obligatorio.');
      return;
    }

    this.guardando.set(true);
    this.mensajeError.set(null);

    this.expedienteService.crearExpediente(this.formExpediente).subscribe({
      next: () => {
        Swal.fire('Éxito', 'Expediente creado correctamente', 'success');
        this.cerrarModal();
        this.cargarExpedientes();
        this.guardando.set(false);
      },
      error: (err) => {
        this.mensajeError.set(err.error?.message || 'Ocurrió un error al crear el expediente.');
        this.guardando.set(false);
      }
    });
  }
}
