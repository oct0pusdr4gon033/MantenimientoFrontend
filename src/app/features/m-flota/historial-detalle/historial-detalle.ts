import { Component, OnInit, signal } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { HistorialHorometroService } from '../services/HistorialHorometro.service';
import { EquipoService } from '../services/Equipo.service';
import { EmpleadoService } from '../../m-administracion/empleados/services/Empleado.service';
import { HistorialHorometroResponse } from '../models/HistorialHorometroResponse';
import { EquipoResponse } from '../models/EquipoResponse';
import { EmpleadoResponse } from '../../m-administracion/empleados/models/EmpleadoResponse';

@Component({
  selector: 'app-historial-detalle',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './historial-detalle.html',
  styleUrl: './historial-detalle.css',
})
export class HistorialDetalle implements OnInit {
  codigoHistorial = '';
  
  registroActual = signal<HistorialHorometroResponse | null>(null);
  equipo = signal<EquipoResponse | null>(null);
  conductor = signal<EmpleadoResponse | null>(null);
  historialEquipo = signal<HistorialHorometroResponse[]>([]);

  cargando = signal(true);
  mensajeError = '';

  constructor(
    private route: ActivatedRoute,
    private historialService: HistorialHorometroService,
    private equipoService: EquipoService,
    private empleadoService: EmpleadoService,
    private location: Location
  ) {}

  ngOnInit(): void {
    this.codigoHistorial = this.route.snapshot.paramMap.get('codigoHist') || '';
    if (this.codigoHistorial) {
      this.cargarDatosGenerales();
    } else {
      this.mensajeError = 'No se proporcionó un código válido.';
      this.cargando.set(false);
    }
  }

  volver() {
    this.location.back();
  }

  cargarDatosGenerales() {
    this.cargando.set(true);

    this.historialService.obtenerPorCodigo(this.codigoHistorial).subscribe({
      next: (res) => {
        if (res.data) {
          this.registroActual.set(res.data);
          this.cargarRelaciones(res.data.id_equipo, res.data.dni_conductor);
        } else {
          this.mensajeError = 'No se encontró el registro indicado.';
          this.cargando.set(false);
        }
      },
      error: () => {
        this.mensajeError = 'Error al cargar el registro base.';
        this.cargando.set(false);
      }
    });
  }

  cargarRelaciones(idEquipo: number, dniConductor: string) {
    // 1. Cargar Equipo
    this.equipoService.buscarPorId(idEquipo).subscribe({
      next: (res) => this.equipo.set(res.data)
    });

    // 2. Cargar Conductor
    this.empleadoService.obtenerPorDni(dniConductor).subscribe({
      next: (res) => this.conductor.set(res.data)
    });

    // 3. Cargar todo el historial del equipo
    this.historialService.obtenerPorEquipo(idEquipo).subscribe({
      next: (res) => {
        const sorted = (res.data || []).sort((a, b) => new Date(b.fecha_registro).getTime() - new Date(a.fecha_registro).getTime());
        this.historialEquipo.set(sorted);
        this.cargando.set(false);
      },
      error: () => {
        this.cargando.set(false);
      }
    });
  }
}
