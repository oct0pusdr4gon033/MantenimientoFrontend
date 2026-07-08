import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { PlanMantenimientoService } from '../services/plan-mantenimiento.service';
import { EstrategiaService } from '../services/estrategia.service';
import { PlanMantenimientoResponse, PlanMantenimientoActividadResponse } from '../models/plan-mantenimiento';
import { EstrategiaResponse } from '../models/EstrategiaResponse';

interface EventoMantenimiento {
  id: string; // unique event occurrence id
  fecha: Date;
  fechaStr: string; // YYYY-MM-DD
  idPlan: number;
  plan: PlanMantenimientoResponse;
  estrategia: EstrategiaResponse;
  cod_equipo: string;
  nombre_equipo: string;
  idDetalleEstrg: number;
  tipoPm: string;
  umbral: number;
  uniMed: string;
  actividades: PlanMantenimientoActividadResponse[];
}

@Component({
  selector: 'app-calendario-mantenimiento',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './calendario-mantenimiento.html',
  styleUrls: ['./calendario-mantenimiento.css']
})
export class CalendarioMantenimientoComponent implements OnInit {
  private planSvc = inject(PlanMantenimientoService);
  private estSvc = inject(EstrategiaService);
  private router = inject(Router);

  // ── States ─────────────────────────────────────────────────
  planes = signal<PlanMantenimientoResponse[]>([]);
  estrategias = signal<EstrategiaResponse[]>([]);
  cargando = signal(true);
  vistaActiva = signal<'MES' | 'SEMANA' | 'ANO'>('MES');
  fechaReferencia = signal<Date>(new Date());
  mensajeError = signal('');

  // ── Filters ────────────────────────────────────────────────
  filtroEquipo = signal<string>('');
  filtroPmType = signal<string>('');
  filtroUniMed = signal<string>('');
  busquedaTexto = signal<string>('');

  // ── Event Detail Modal State ───────────────────────────────
  modalAbierto = signal(false);
  eventoSeleccionado = signal<EventoMantenimiento | null>(null);

  // ── Helpers ────────────────────────────────────────────────
  nombreMeses = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];
  nombreDias = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

  ngOnInit(): void {
    this.cargarDatos();
  }

  cargarDatos(): void {
    this.cargando.set(true);
    this.mensajeError.set('');

    this.estSvc.listar().subscribe({
      next: (estData: any) => {
        const estList = Array.isArray(estData) ? estData : (estData?.data ?? []);
        this.estrategias.set(estList);

        this.planSvc.getAll().subscribe({
          next: (planRes) => {
            this.planes.set(planRes.data?.filter(p => p.estado) ?? []);
            this.cargando.set(false);
          },
          error: (err) => {
            this.mensajeError.set('Error al cargar planes de mantenimiento.');
            this.cargando.set(false);
          }
        });
      },
      error: () => {
        this.mensajeError.set('Error al cargar catálogo de estrategias.');
        this.cargando.set(false);
      }
    });
  }

  // ── Reactive PM Projections ────────────────────────────────
  todosLosEventos = computed<EventoMantenimiento[]>(() => {
    const listPlanes = this.planes();
    const listEst = this.estrategias();
    const events: EventoMantenimiento[] = [];

    // Project events up to the end of next year (to ensure enough future occurrences are visible)
    const currentYear = new Date().getFullYear();
    const maxDateLimit = new Date(currentYear + 1, 11, 31); // Dec 31 of next year

    listPlanes.forEach(plan => {
      // Find matching strategy
      const est = listEst.find(e => e.id_estrategia === plan.id_estrategia);
      if (!est) return;

      const startDate = plan.fecha_creacion ? new Date(plan.fecha_creacion) : new Date();
      if (isNaN(startDate.getTime())) return;

      // Group activities by PM Detail
      const pmGroups = new Map<number, PlanMantenimientoActividadResponse[]>();
      plan.actividades.forEach(act => {
        const key = act.id_detalle_estrg;
        if (!pmGroups.has(key)) {
          pmGroups.set(key, []);
        }
        pmGroups.get(key)!.push(act);
      });

      // For each PM, calculate projection interval
      pmGroups.forEach((actividades, idDetalle) => {
        const det = est.detalles?.find(d => d.id_detalle_estrg === idDetalle);
        if (!det) return;

        const umbral = det.umbral_mant;
        const uniMed = det.uni_med.toUpperCase().trim();
        const tipoPm = det.tipo_pm;

        // Calculate days interval
        let daysInterval = 30;
        if (uniMed === 'DIAS' || uniMed === 'DÍAS') {
          daysInterval = umbral;
        } else if (uniMed === 'SEMANAS') {
          daysInterval = umbral * 7;
        } else if (uniMed === 'MESES') {
          daysInterval = umbral * 30.43; // average days in a month
        } else if (uniMed === 'HORAS') {
          // Fallback: assume 8 hours of work per day
          daysInterval = umbral / 8;
        } else if (uniMed === 'KM' || uniMed === 'KILOMETROS' || uniMed === 'KILÓMETROS') {
          // Fallback: assume 100 km traveled per day
          daysInterval = umbral / 100;
        }

        if (daysInterval <= 0) daysInterval = 30;

        // Generate projected occurrences
        let occurrence = 1;
        let eventDate = new Date(startDate.getTime() + (occurrence * daysInterval * 24 * 60 * 60 * 1000));

        // Let's cap the max occurrences to 100 per plan/PM to prevent infinite loops or excessive memory
        while (eventDate <= maxDateLimit && occurrence <= 100) {
          const dateClone = new Date(eventDate);
          const year = dateClone.getFullYear();
          const month = String(dateClone.getMonth() + 1).padStart(2, '0');
          const day = String(dateClone.getDate()).padStart(2, '0');
          const fechaStr = `${year}-${month}-${day}`;

          events.push({
            id: `${plan.id_plan_mant}-${idDetalle}-${occurrence}`,
            fecha: dateClone,
            fechaStr,
            idPlan: plan.id_plan_mant,
            plan,
            estrategia: est,
            cod_equipo: est.cod_equipo || 'S/C',
            nombre_equipo: est.nombre_flota || est.titulo_estrategia,
            idDetalleEstrg: idDetalle,
            tipoPm,
            umbral,
            uniMed,
            actividades
          });

          occurrence++;
          eventDate = new Date(startDate.getTime() + (occurrence * daysInterval * 24 * 60 * 60 * 1000));
        }
      });
    });

    // Sort events by date ascending
    return events.sort((a, b) => a.fecha.getTime() - b.fecha.getTime());
  });

  // ── Event Filters ──────────────────────────────────────────
  eventosFiltrados = computed(() => {
    let list = this.todosLosEventos();

    // Filter by Equipment
    const eq = this.filtroEquipo().toLowerCase().trim();
    if (eq) {
      list = list.filter(e => e.cod_equipo.toLowerCase().includes(eq) || e.nombre_equipo.toLowerCase().includes(eq));
    }

    // Filter by PM Type
    const pm = this.filtroPmType();
    if (pm) {
      list = list.filter(e => e.tipoPm.toUpperCase().trim() === pm.toUpperCase().trim());
    }

    // Filter by Unit
    const unit = this.filtroUniMed();
    if (unit) {
      list = list.filter(e => e.uniMed === unit);
    }

    // Filter by Text Search
    const q = this.busquedaTexto().toLowerCase().trim();
    if (q) {
      list = list.filter(e => 
        e.cod_equipo.toLowerCase().includes(q) ||
        e.nombre_equipo.toLowerCase().includes(q) ||
        e.tipoPm.toLowerCase().includes(q) ||
        e.actividades.some(a => a.nombre_actividad?.toLowerCase().includes(q) || a.descripcion_actividad?.toLowerCase().includes(q))
      );
    }

    return list;
  });

  // Group events by date string (YYYY-MM-DD) for O(1) calendar lookup
  eventosPorFecha = computed(() => {
    const map = new Map<string, EventoMantenimiento[]>();
    this.eventosFiltrados().forEach(event => {
      if (!map.has(event.fechaStr)) {
        map.set(event.fechaStr, []);
      }
      map.get(event.fechaStr)!.push(event);
    });
    return map;
  });

  // ── Month Calendar Grid Calculation ───────────────────────
  diasCalendario = computed(() => {
    const ref = this.fechaReferencia();
    const year = ref.getFullYear();
    const month = ref.getMonth();

    // First day of the month
    const primerDia = new Date(year, month, 1);
    // Last day of the month
    const ultimoDia = new Date(year, month + 1, 0);

    // Number of days in the month
    const totalDias = ultimoDia.getDate();
    // Weekday of the first day (0 = Sunday, 1 = Monday, etc.)
    const startingDay = primerDia.getDay();

    const grid: { fecha: Date | null; diaStr: string; esHoy: boolean; fueraDeMes: boolean; eventos: EventoMantenimiento[] }[] = [];

    const hoy = new Date();
    const hoyStr = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(hoy.getDate()).padStart(2, '0')}`;

    // Previous month filling (padding)
    const prevMonthLast = new Date(year, month, 0).getDate();
    for (let i = startingDay - 1; i >= 0; i--) {
      const prevDate = new Date(year, month - 1, prevMonthLast - i);
      const fStr = this.getDateString(prevDate);
      grid.push({
        fecha: prevDate,
        diaStr: String(prevDate.getDate()),
        esHoy: fStr === hoyStr,
        fueraDeMes: true,
        eventos: this.eventosPorFecha().get(fStr) ?? []
      });
    }

    // Current month days
    for (let dia = 1; dia <= totalDias; dia++) {
      const date = new Date(year, month, dia);
      const fStr = this.getDateString(date);
      grid.push({
        fecha: date,
        diaStr: String(dia),
        esHoy: fStr === hoyStr,
        fueraDeMes: false,
        eventos: this.eventosPorFecha().get(fStr) ?? []
      });
    }

    // Next month filling (padding) to complete 6 rows (42 blocks)
    const remaining = 42 - grid.length;
    for (let i = 1; i <= remaining; i++) {
      const nextDate = new Date(year, month + 1, i);
      const fStr = this.getDateString(nextDate);
      grid.push({
        fecha: nextDate,
        diaStr: String(i),
        esHoy: fStr === hoyStr,
        fueraDeMes: true,
        eventos: this.eventosPorFecha().get(fStr) ?? []
      });
    }

    return grid;
  });

  // ── Weekly View Calculation ────────────────────────────────
  semanaDias = computed(() => {
    const ref = this.fechaReferencia();
    const currentDayOfWeek = ref.getDay();
    // Start week on Monday
    const offset = currentDayOfWeek === 0 ? -6 : 1 - currentDayOfWeek;
    const startOfWeek = new Date(ref.getFullYear(), ref.getMonth(), ref.getDate() + offset);

    const week: { fecha: Date; diaNombre: string; diaNumero: number; fechaStr: string; esHoy: boolean; eventos: EventoMantenimiento[] }[] = [];
    const hoy = new Date();
    const hoyStr = this.getDateString(hoy);

    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek.getTime() + (i * 24 * 60 * 60 * 1000));
      const fStr = this.getDateString(date);
      week.push({
        fecha: date,
        diaNombre: this.nombreDias[date.getDay()],
        diaNumero: date.getDate(),
        fechaStr: fStr,
        esHoy: fStr === hoyStr,
        eventos: this.eventosPorFecha().get(fStr) ?? []
      });
    }

    return week;
  });

  // ── Calendar Navigation Actions ────────────────────────────
  irAnterior(): void {
    const vista = this.vistaActiva();
    const ref = this.fechaReferencia();
    if (vista === 'MES') {
      this.fechaReferencia.set(new Date(ref.getFullYear(), ref.getMonth() - 1, 1));
    } else if (vista === 'SEMANA') {
      this.fechaReferencia.set(new Date(ref.getFullYear(), ref.getMonth(), ref.getDate() - 7));
    } else if (vista === 'ANO') {
      this.fechaReferencia.set(new Date(ref.getFullYear() - 1, 0, 1));
    }
  }

  irSiguiente(): void {
    const vista = this.vistaActiva();
    const ref = this.fechaReferencia();
    if (vista === 'MES') {
      this.fechaReferencia.set(new Date(ref.getFullYear(), ref.getMonth() + 1, 1));
    } else if (vista === 'SEMANA') {
      this.fechaReferencia.set(new Date(ref.getFullYear(), ref.getMonth(), ref.getDate() + 7));
    } else if (vista === 'ANO') {
      this.fechaReferencia.set(new Date(ref.getFullYear() + 1, 0, 1));
    }
  }

  irHoy(): void {
    this.fechaReferencia.set(new Date());
  }

  setVista(vista: 'MES' | 'SEMANA' | 'ANO'): void {
    this.vistaActiva.set(vista);
  }

  // Get dynamic title based on the active view and reference date
  getTituloPeriodo(): string {
    const vista = this.vistaActiva();
    const ref = this.fechaReferencia();
    if (vista === 'MES') {
      return `${this.nombreMeses[ref.getMonth()]} ${ref.getFullYear()}`;
    } else if (vista === 'SEMANA') {
      const week = this.semanaDias();
      const first = week[0].fecha;
      const last = week[6].fecha;
      if (first.getMonth() === last.getMonth()) {
        return `${this.nombreMeses[first.getMonth()]} ${first.getFullYear()}`;
      }
      return `${first.getDate()} ${this.nombreMeses[first.getMonth()]} - ${last.getDate()} ${this.nombreMeses[last.getMonth()]} ${last.getFullYear()}`;
    } else {
      return `Año ${ref.getFullYear()}`;
    }
  }

  // ── Yearly Frequency Calculation ───────────────────────────
  getFrecuenciaMensual(mesIndex: number): number {
    const year = this.fechaReferencia().getFullYear();
    return this.eventosFiltrados().filter(e => {
      const d = e.fecha;
      return d.getFullYear() === year && d.getMonth() === mesIndex;
    }).length;
  }

  // Get active strategies to populate equipment filter
  equiposUnicos = computed(() => {
    const list = this.estrategias();
    const map = new Map<string, string>();
    list.forEach(e => {
      if (e.cod_equipo) {
        map.set(e.cod_equipo, e.nombre_flota || e.titulo_estrategia);
      }
    });
    return Array.from(map.entries()).map(([code, name]) => ({ code, name }));
  });

  // ── Modal Actions ──────────────────────────────────────────
  abrirModal(event: EventoMantenimiento): void {
    this.eventoSeleccionado.set(event);
    this.modalAbierto.set(true);
  }

  cerrarModal(): void {
    this.modalAbierto.set(false);
    this.eventoSeleccionado.set(null);
  }

  generarOT(): void {
    const event = this.eventoSeleccionado();
    if (!event) return;

    this.cerrarModal();

    // Redirect to the Work Order Form prefilled with the equipment ID
    const queryParams: any = {};
    if (event.estrategia.id_equipo) {
      queryParams.id_equipo = event.estrategia.id_equipo;
    }
    
    // We can also pass the plan ID to load activities automatically if needed
    queryParams.id_plan_mant = event.idPlan;
    queryParams.tipo_pm = event.tipoPm;

    this.router.navigate(['/GestionMantenimiento/orden-trabajo/crear'], { queryParams });
  }

  // ── Utility Methods ────────────────────────────────────────
  private getDateString(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  formatearFechaLarga(date: Date | undefined): string {
    if (!date) return '-';
    return date.toLocaleDateString('es-PE', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  seleccionarMesDesdeAno(mesIndex: number): void {
    const ref = this.fechaReferencia();
    this.fechaReferencia.set(new Date(ref.getFullYear(), mesIndex, 1));
    this.vistaActiva.set('MES');
  }

  limpiarFiltros(): void {
    this.filtroEquipo.set('');
    this.filtroPmType.set('');
    this.filtroUniMed.set('');
    this.busquedaTexto.set('');
  }
}
