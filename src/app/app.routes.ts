import { Routes } from '@angular/router';
import { LoginComponent } from './features/auth/login/login.component';
import { ComprasLayoutComponent } from './features/compras/layout/compras-layout.component';
import { AlmacenLayoutComponent } from './features/almacen/layout/almacen-layout.component';
import { FlotaLayoutComponent } from './features/flota/layout/flota-layout.component';
import { DashboardPlaceholderComponent } from './shared/components/dashboard-placeholder/dashboard-placeholder.component';
import { AlmacenDashboardComponent } from './features/almacen/dashboard/almacen-dashboard';
import { FlotaDashboardComponent } from './features/m-flota/dashboard/flota-dashboard';
import { AdminDashboardComponent } from './features/m-administracion/dashboard/admin-dashboard';
import { ComprasDashboardComponent } from './features/compras/dashboard/compras-dashboard';
import { MantenimientoDashboardComponent } from './features/m-mantenimiento/dashboard/mantenimiento-dashboard';
import { AreaOperacionComponent } from './features/m-mantenimiento/area-operacion/area-operacion.component';
import { TipoEquipoComponent } from './features/m-flota/tipo-equipo/tipo-equipo.component';
import { MarcaEquipoComponent } from './features/m-flota/marca-equipo/marca-equipo.component';
import { ModeloEquipoComponent } from './features/m-flota/modelo-equipo/modelo-equipo.component';
import { EquipoComponent } from './features/m-flota/equipo/equipo.component';
import { FlotaComponent } from './features/m-flota/flota/flota.component';
import { FlotaDetalleComponent } from './features/m-flota/flota-detalle/flota-detalle.component';
import { ExpedienteDetalleComponent } from './features/m-flota/expediente-detalle/expediente-detalle.component';
import { DocumentoDetalleComponent } from './features/m-flota/documento-detalle/documento-detalle.component';

import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';

import { Expedientes } from './features/m-flota/expedientes/expedientes';
import { TipoDocumento } from './features/m-flota/tipo-documento/tipo-documento';

import { HistorialHorometros } from './features/m-flota/historial-horometros/historial-horometros';

export const routes: Routes = [
  // Punto de entrada
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },

  // ── Compras ──────────────────────────────────────────────
  {
    path: 'GestionCompras',
    component: ComprasLayoutComponent,
    canActivate: [authGuard, roleGuard],
    data: { modulo: 'GestionCompras' },
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: ComprasDashboardComponent },
      { path: 'ordenes', loadComponent: () => import('./features/compras/ordenes-compra/orden-lista/orden-lista').then(m => m.OrdenListaComponent) },
      { path: 'ordenes/crear', loadComponent: () => import('./features/compras/ordenes-compra/orden-form/orden-form').then(m => m.OrdenFormComponent) },
      { path: 'ordenes/detalle/:id', loadComponent: () => import('./features/compras/ordenes-compra/orden-detalle/orden-detalle').then(m => m.OrdenDetalleComponent) },
      { path: 'proveedores', loadComponent: () => import('./features/compras/proveedores/proveedor-lista/proveedor-lista').then(m => m.ProveedorListaComponent) },
      { path: 'cotizaciones', loadComponent: () => import('./features/compras/cotizaciones/cotizacion-lista/cotizacion-lista').then(m => m.CotizacionListaComponent) },
      { path: 'cotizaciones/crear', loadComponent: () => import('./features/compras/cotizaciones/cotizacion-form/cotizacion-form').then(m => m.CotizacionFormComponent) },
      { path: 'cotizaciones/detalle/:id', loadComponent: () => import('./features/compras/cotizaciones/cotizacion-detalle/cotizacion-detalle').then(m => m.CotizacionDetalleComponent) },
      { path: 'solicitudes', loadComponent: () => import('./features/compras/solicitudes/solicitud-lista/solicitud-lista').then(m => m.SolicitudLista) },
      { path: 'solicitudes/crear', loadComponent: () => import('./features/compras/solicitudes/solicitud-form/solicitud-form').then(m => m.SolicitudForm) },
      { path: 'solicitudes/detalle/:id', loadComponent: () => import('./features/compras/solicitudes/solicitud-detalle/solicitud-detalle').then(m => m.SolicitudDetalle) }
    ]
  },

  // ── Almacén ───────────────────────────────────────────────
  {
    path: 'GestionAlmacen',
    component: AlmacenLayoutComponent,
    canActivate: [authGuard, roleGuard],
    data: { modulo: 'GestionAlmacen' },
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: AlmacenDashboardComponent },
      { path: 'material/registrar', loadComponent: () => import('./features/almacen/material/registrar-material/registrar-material').then(m => m.RegistrarMaterialComponent) },
      { path: 'nota-salida/generar', loadComponent: () => import('./features/almacen/nota-salida/generar-nota-salida/generar-nota-salida').then(m => m.GenerarNotaSalidaComponent) },
      { path: 'vale', loadComponent: () => import('./features/almacen/vale/vale-lista/vale-lista').then(m => m.ValeListaComponent) },
      { path: 'vale/crear', loadComponent: () => import('./features/almacen/vale/vale-form/vale-form').then(m => m.ValeFormComponent) },
      { path: 'vale/detalle/:id', loadComponent: () => import('./features/almacen/vale/vale-detalle/vale-detalle').then(m => m.ValeDetalleComponent) },
      { path: 'materiales-reservados', loadComponent: () => import('./features/almacen/vale/materiales-reservados/materiales-reservados').then(m => m.MaterialesReservadosComponent) },
      { path: 'material/kardex', loadComponent: () => import('./features/almacen/material/kardex-general/kardex-general').then(m => m.KardexGeneralComponent) },
      { path: 'material/kardex/:id', loadComponent: () => import('./features/almacen/material/material-kardex/material-kardex').then(m => m.MaterialKardexComponent) },
      { path: 'categoria-material', loadComponent: () => import('./features/almacen/categoria-material/categoria-material-lista/categoria-material-lista').then(m => m.CategoriaMaterialListaComponent) },
      { path: 'unidad-medida', loadComponent: () => import('./features/almacen/unidad-medida/unidad-medida-lista/unidad-medida-lista').then(m => m.UnidadMedidaListaComponent) },
    ]
  },

  // ── Mantenimiento ─────────────────────────────────────────
  {
    path: 'GestionMantenimiento',
    loadComponent: () => import('./features/m-mantenimiento/layout/mantenimiento-layout/mantenimiento-layout').then(m => m.MantenimientoLayout),
    canActivate: [authGuard, roleGuard],
    data: { modulo: 'GestionMantenimiento' },
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: MantenimientoDashboardComponent },
      { path: 'orden-trabajo', loadComponent: () => import('./features/m-mantenimiento/orden-trabajo/ot-lista/ot-lista').then(m => m.OTListaComponent) },
      { path: 'orden-trabajo/crear', loadComponent: () => import('./features/m-mantenimiento/orden-trabajo/ot-form/ot-form').then(m => m.OTFormComponent) },
      { path: 'orden-trabajo/detalle/:id', loadComponent: () => import('./features/m-mantenimiento/orden-trabajo/ot-detalle/ot-detalle').then(m => m.OTDetalleComponent) },
      { path: 'vale', loadComponent: () => import('./features/almacen/vale/vale-lista/vale-lista').then(m => m.ValeListaComponent) },
      { path: 'vale/crear', loadComponent: () => import('./features/almacen/vale/vale-form/vale-form').then(m => m.ValeFormComponent) },
      { path: 'vale/detalle/:id', loadComponent: () => import('./features/almacen/vale/vale-detalle/vale-detalle').then(m => m.ValeDetalleComponent) },
      { path: 'sistema-equipo', loadComponent: () => import('./features/m-mantenimiento/sistema-equipo/sistema-equipo-lista/sistema-equipo-lista').then(m => m.SistemaEquipoListaComponent) },
      { path: 'actividad-sistema', loadComponent: () => import('./features/m-mantenimiento/actividad-sistema/actividad-sistema-lista/actividad-sistema-lista').then(m => m.ActividadSistemaListaComponent) },
      { path: 'estrategia', loadComponent: () => import('./features/m-mantenimiento/estrategia/estrategia-lista/estrategia-lista').then(m => m.EstrategiaLista) },
      { path: 'estrategia/crear', loadComponent: () => import('./features/m-mantenimiento/estrategia/estrategia-crear/estrategia-crear').then(m => m.EstrategiaCrear) },
      { path: 'estrategia/:idEstrategia/detalle/crear', loadComponent: () => import('./features/m-mantenimiento/estrategia/estrategia-detalle-crear/estrategia-detalle-crear').then(m => m.EstrategiaDetalleCrear) },
      { path: 'estrategia/detalle/:id', loadComponent: () => import('./features/m-mantenimiento/estrategia/estrategia-detalle-ver/estrategia-detalle-ver').then(m => m.EstrategiaDetalleVer) },
      { path: 'plan-mantenimiento', loadComponent: () => import('./features/m-mantenimiento/plan-mantenimiento/plan-mantenimiento-lista/plan-mantenimiento-lista').then(m => m.PlanMantenimientoListaComponent) },
      { path: 'plan-mantenimiento/crear', loadComponent: () => import('./features/m-mantenimiento/plan-mantenimiento/plan-mantenimiento-form/plan-mantenimiento-form').then(m => m.PlanMantenimientoFormComponent) },
      { path: 'plan-mantenimiento/editar/:id', loadComponent: () => import('./features/m-mantenimiento/plan-mantenimiento/plan-mantenimiento-form/plan-mantenimiento-form').then(m => m.PlanMantenimientoFormComponent) },
      { path: 'plan-mantenimiento/detalle/:id', loadComponent: () => import('./features/m-mantenimiento/plan-mantenimiento/plan-mantenimiento-detalle/plan-mantenimiento-detalle').then(m => m.PlanMantenimientoDetalleComponent) },
      { path: 'calendario', loadComponent: () => import('./features/m-mantenimiento/calendario/calendario-mantenimiento').then(m => m.CalendarioMantenimientoComponent) },
    ]
  },

  // ── Administración ────────────────────────────────────────
  {
    path: 'GestionAdministracion',
    loadComponent: () => import('./features/m-administracion/layout/administracion-layout/administracion-layout').then(m => m.AdministracionLayout),
    canActivate: [authGuard, roleGuard],
    data: { modulo: 'GestionAdministracion' },
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: AdminDashboardComponent },
      { path: 'empleado', loadComponent: () => import('./features/m-administracion/empleados/empleado/empleado').then(m => m.Empleado) },
      { path: 'rol', loadComponent: () => import('./features/m-administracion/empleados/rol/rol').then(m => m.Rol) },
      { path: 'tipo-documento-empleado', loadComponent: () => import('./features/m-administracion/empleados/tipo-documento-empleado/tipo-documento-empleado').then(m => m.TipoDocumentoEmpleadoComponent) },
      { path: 'expedientes-empleados', loadComponent: () => import('./features/m-administracion/empleados/expedientes-empleados/expedientes-empleados').then(m => m.ExpedientesEmpleadosComponent) },
      { path: 'expediente-empleado/detalle/:dni', loadComponent: () => import('./features/m-administracion/empleados/expediente-empleado-detalle/expediente-empleado-detalle').then(m => m.ExpedienteEmpleadoDetalleComponent) },
      { path: 'expediente-empleado/detalle/:dni/documento/:codigoExp/:idDocumento', loadComponent: () => import('./features/m-administracion/empleados/documento-empleado-detalle/documento-empleado-detalle').then(m => m.DocumentoEmpleadoDetalleComponent) },
    ]
  },

  // ── Flota ─────────────────────────────────────────────────
  {
    path: 'GestionFlota',
    component: FlotaLayoutComponent,
    canActivate: [authGuard, roleGuard],
    data: { modulo: 'GestionFlota' },
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: FlotaDashboardComponent },
      { path: 'flotas', component: FlotaComponent },
      { path: 'flotas/detalle/:id', component: FlotaDetalleComponent },
      { path: 'equipos', component: EquipoComponent },
      { path: 'area-operacion', component: AreaOperacionComponent },
      { path: 'tipo-equipo', component: TipoEquipoComponent },
      { path: 'marca-equipo', component: MarcaEquipoComponent },
      { path: 'modelo-equipo', component: ModeloEquipoComponent },
      { path: 'expedientes', component: Expedientes },
      { path: 'tipo-documento', component: TipoDocumento },
      { path: 'expediente/:idEquipo', component: ExpedienteDetalleComponent },
      { path: 'expediente/:idEquipo/documento/:idDocumento', component: DocumentoDetalleComponent },
      { path: 'historial-horometros', component: HistorialHorometros },
      { path: 'historial-horometros/registrar', loadComponent: () => import('./features/m-flota/historial-horometros/historial-crear/historial-crear').then(m => m.HistorialCrear) },
      { path: 'historial-horometros/detalle/:codigoHist', loadComponent: () => import('./features/m-flota/historial-detalle/historial-detalle').then(m => m.HistorialDetalle) },
    ]
  },

  // Fallback
  { path: '**', redirectTo: 'login' }
];
