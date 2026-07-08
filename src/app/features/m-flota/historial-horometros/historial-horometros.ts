import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HistorialHorometroService } from '../services/HistorialHorometro.service';
import { EquipoService } from '../services/Equipo.service';
import { HistorialHorometroResponse } from '../models/HistorialHorometroResponse';
import { EmpleadoResponse } from '../../m-administracion/empleados/models/EmpleadoResponse';
import { EquipoResponse } from '../models/EquipoResponse';
import { Router, ActivatedRoute } from '@angular/router';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-historial-horometros',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './historial-horometros.html',
  styleUrl: './historial-horometros.css',
})
export class HistorialHorometros implements OnInit {
  // Lista de datos
  historiales = signal<HistorialHorometroResponse[]>([]);
  historialesFiltrados = signal<HistorialHorometroResponse[]>([]);
  equipos = signal<EquipoResponse[]>([]);
  empleados = signal<EmpleadoResponse[]>([]);

  // Estados de la UI
  cargando = signal(true);
  filtroBusqueda = signal('');
  mensajeError = '';
  mensajeExito = '';

  constructor(
    private historialService: HistorialHorometroService,
    private equipoService: EquipoService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.cargarDatos();
  }

  cargarDatos() {
    this.cargando.set(true);

    // Cargar equipos
    this.equipoService.listar().subscribe({
      next: (res) => {
        this.equipos.set(res.data || []);
        // Cargar historial
        this.cargarHistoriales();
      },
      error: () => {
        console.error('Error al cargar equipos');
        // Cargar historial
        this.cargarHistoriales();
      }
    });

    // Cargar equipos y luego historial
    this.equipoService.listar().subscribe({
      next: (res) => {
        this.equipos.set(res.data || []);
        // Cargar historial
        this.cargarHistoriales();
      },
      error: () => {
        console.error('Error al cargar equipos');
        // Cargar historial
        this.cargarHistoriales();
      }
    });
  }

  cargarHistoriales() {
    this.historialService.obtenerTodos().subscribe({
      next: (res) => {
        // Ordenamos por fecha descendente
        const data = (res.data || []).sort((a, b) => new Date(b.fecha_registro).getTime() - new Date(a.fecha_registro).getTime());
        this.historiales.set(data);
        
        const q = this.route.snapshot.queryParamMap.get('q');
        if (q) {
          this.filtroBusqueda.set(q);
          this.onFiltroChange(q);
        } else {
          this.historialesFiltrados.set(data);
        }
        
        this.cargando.set(false);
      },
      error: () => {
        this.mensajeError = 'Error al cargar los horómetros.';
        this.cargando.set(false);
      }
    });
  }

  // --- Filtros ---
  onFiltroChange(valor: string) {
    this.filtroBusqueda.set(valor);
    const filterValue = valor.toLowerCase().trim();
    if (!filterValue) {
      this.historialesFiltrados.set(this.historiales());
      return;
    }
    
    // Filtramos cruzando con equipos para poder buscar por código, placa, etc.
    const filtrados = this.historiales().filter(h => {
      const eqp = this.obtenerEquipoPorId(h.id_equipo);
      const codigoMatch = h.codigo_hist.toLowerCase().includes(filterValue);
      const equipoMatch = eqp ? eqp.codEqp.toLowerCase().includes(filterValue) || eqp.placaEqp.toLowerCase().includes(filterValue) : false;
      const modeloMatch = eqp ? eqp.nombreModelo.toLowerCase().includes(filterValue) : false;
      
      return codigoMatch || equipoMatch || modeloMatch;
    });
    this.historialesFiltrados.set(filtrados);
  }

  limpiarFiltro() {
    this.filtroBusqueda.set('');
    this.historialesFiltrados.set(this.historiales());
  }

  // --- Funciones Auxiliares ---
  obtenerEquipoPorId(id: number): EquipoResponse | undefined {
    return this.equipos().find(e => e.idEquipo === id);
  }

  verDetalle(historial: HistorialHorometroResponse) {
    this.router.navigate(['/GestionFlota/historial-horometros/detalle', historial.codigo_hist]);
  }

  // --- Navegación ---
  abrirCrear() {
    this.router.navigate(['/GestionFlota/historial-horometros/registrar']);
  }
}
