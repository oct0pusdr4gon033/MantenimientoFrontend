import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';

import { HistorialHorometroService } from '../../services/HistorialHorometro.service';
import { EmpleadoService } from '../../../m-administracion/empleados/services/Empleado.service';
import { EquipoService } from '../../services/Equipo.service';

import { HistorialHorometroRequest } from '../../models/HistorialHorometroRequest';
import { EmpleadoResponse } from '../../../m-administracion/empleados/models/EmpleadoResponse';
import { EquipoResponse } from '../../models/EquipoResponse';

@Component({
  selector: 'app-historial-crear',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './historial-crear.html',
  styleUrl: './historial-crear.css',
})
export class HistorialCrear implements OnInit {
  form: FormGroup;
  guardando = signal(false);
  mensajeError = '';

  // Datos para los modales
  equipos = signal<EquipoResponse[]>([]);
  equiposFiltrados = signal<EquipoResponse[]>([]);
  empleados = signal<EmpleadoResponse[]>([]);
  empleadosFiltrados = signal<EmpleadoResponse[]>([]);

  // Estados de los modales
  modalEquipoVisible = signal(false);
  modalConductorVisible = signal(false);

  // Textos de búsqueda
  buscarEquipoTexto = signal('');
  buscarConductorTexto = signal('');

  // Nombres para mostrar en el formulario
  equipoSeleccionadoNombre = signal('');
  conductorSeleccionadoNombre = signal('');

  constructor(
    private fb: FormBuilder,
    private historialService: HistorialHorometroService,
    private empleadoService: EmpleadoService,
    private equipoService: EquipoService,
    private router: Router
  ) {
    this.form = this.fb.group({
      id_equipo: ['', Validators.required],
      dni_conductor: ['', Validators.required],
      lectura_anterior: [{ value: '', disabled: true }, Validators.required],
      lectura_actual: ['', [Validators.required, Validators.min(0)]],
      horas_operadas: [{ value: '', disabled: true }, Validators.required],
      observaciones: ['']
    });

    // Detectar cambios en lectura actual para calcular horas
    this.form.get('lectura_actual')?.valueChanges.subscribe(() => {
      this.calcularHoras();
    });
  }

  ngOnInit(): void {
    this.cargarCatalogos();
  }

  cargarCatalogos() {
    this.equipoService.listar().subscribe({
      next: (res) => {
        const data = res.data || [];
        this.equipos.set(data);
        this.equiposFiltrados.set(data);
      },
      error: () => console.error('Error al cargar equipos')
    });

    this.empleadoService.obtenerActivos().subscribe({
      next: (res) => {
        const data = (res.data || []).filter(e => e.codigo_empleado && e.codigo_empleado.startsWith('COND'));
        this.empleados.set(data);
        this.empleadosFiltrados.set(data);
      },
      error: () => console.error('Error al cargar empleados')
    });
  }

  volver(): void {
    this.router.navigate(['/GestionFlota/historial-horometros']);
  }

  calcularHoras() {
    const anterior = this.form.get('lectura_anterior')?.value;
    const actual = this.form.get('lectura_actual')?.value;
    
    const numAnterior = Number(anterior) || 0;
    const numActual = Number(actual) || 0;
    
    const controlActual = this.form.get('lectura_actual');
    
    if (controlActual?.hasError('menorAnterior')) {
       const { menorAnterior, ...errors } = controlActual.errors || {};
       controlActual.setErrors(Object.keys(errors).length ? errors : null);
    }
    if (controlActual?.hasError('maxHoras')) {
       const { maxHoras, ...errors } = controlActual.errors || {};
       controlActual.setErrors(Object.keys(errors).length ? errors : null);
    }

    if (actual !== null && actual !== '') {
      if (numActual <= numAnterior) {
        this.form.patchValue({ horas_operadas: 0 }, { emitEvent: false });
        controlActual?.setErrors({ ...controlActual.errors, menorAnterior: true });
      } else {
        const horas = numActual - numAnterior;
        this.form.patchValue({ horas_operadas: horas }, { emitEvent: false });
        
        if (horas > 24) {
          controlActual?.setErrors({ ...controlActual.errors, maxHoras: true });
        }
      }
    } else {
      this.form.patchValue({ horas_operadas: 0 }, { emitEvent: false });
    }
  }

  guardar() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.mensajeError = 'Por favor complete todos los campos requeridos correctamente.';
      return;
    }

    const actual = this.form.get('lectura_actual')?.value;
    const anterior = this.form.get('lectura_anterior')?.value;

    if (actual <= anterior) {
      this.mensajeError = 'La lectura actual debe ser mayor a la lectura anterior.';
      return;
    }

    this.guardando.set(true);
    this.mensajeError = '';

    const request: HistorialHorometroRequest = {
      id_equipo: this.form.get('id_equipo')?.value,
      dni_conductor: this.form.get('dni_conductor')?.value,
      lectura_anterior: anterior,
      lectura_actual: actual,
      horas_operadas: this.form.get('horas_operadas')?.value,
      observaciones: this.form.get('observaciones')?.value || ''
    };

    this.historialService.crear(request).subscribe({
      next: (res) => {
        Swal.fire('¡Éxito!', 'Horómetro registrado correctamente.', 'success').then(() => {
          this.volver();
        });
      },
      error: (err) => {
        this.mensajeError = err.error?.message || 'Hubo un error al registrar el horómetro.';
        this.guardando.set(false);
      }
    });
  }

  // --- Lógica Modal de Equipo ---
  limpiarEquipo() {
    this.form.patchValue({
      id_equipo: '',
      lectura_anterior: ''
    });
    this.equipoSeleccionadoNombre.set('');
    this.calcularHoras();
  }

  abrirModalEquipo() {
    this.buscarEquipoTexto.set('');
    this.equiposFiltrados.set(this.equipos());
    this.modalEquipoVisible.set(true);
  }

  cerrarModalEquipo() {
    this.modalEquipoVisible.set(false);
  }

  filtrarEquipos(event: any) {
    const valor = event.target.value.toLowerCase().trim();
    this.buscarEquipoTexto.set(valor);
    if (!valor) {
      this.equiposFiltrados.set(this.equipos());
      return;
    }
    const filtrados = this.equipos().filter(e => 
      e.codEqp.toLowerCase().includes(valor) || 
      (e.placaEqp && e.placaEqp.toLowerCase().includes(valor)) || 
      e.nombreModelo.toLowerCase().includes(valor) || 
      e.nombreMarca.toLowerCase().includes(valor)
    );
    this.equiposFiltrados.set(filtrados);
  }

  seleccionarEquipo(eqp: EquipoResponse) {
    this.form.patchValue({ 
      id_equipo: eqp.idEquipo,
      lectura_anterior: eqp.horometroActual || 0
    });
    this.equipoSeleccionadoNombre.set(eqp.placaEqp || 'Sin Placa');
    this.calcularHoras();
    this.cerrarModalEquipo();
  }

  // --- Lógica Modal de Conductor ---
  limpiarConductor() {
    this.form.patchValue({ dni_conductor: '' });
    this.conductorSeleccionadoNombre.set('');
  }

  abrirModalConductor() {
    this.buscarConductorTexto.set('');
    this.empleadosFiltrados.set(this.empleados());
    this.modalConductorVisible.set(true);
  }

  cerrarModalConductor() {
    this.modalConductorVisible.set(false);
  }

  filtrarConductores(event: any) {
    const valor = event.target.value.toLowerCase().trim();
    this.buscarConductorTexto.set(valor);
    if (!valor) {
      this.empleadosFiltrados.set(this.empleados());
      return;
    }
    const filtrados = this.empleados().filter(e => 
      e.dni_empleado.toLowerCase().includes(valor) || 
      e.nombre.toLowerCase().includes(valor) || 
      e.apellido1.toLowerCase().includes(valor)
    );
    this.empleadosFiltrados.set(filtrados);
  }

  seleccionarConductor(emp: EmpleadoResponse) {
    this.form.patchValue({ dni_conductor: emp.dni_empleado });
    this.conductorSeleccionadoNombre.set(`${emp.nombre} ${emp.apellido1} (${emp.dni_empleado})`);
    this.cerrarModalConductor();
  }
}
