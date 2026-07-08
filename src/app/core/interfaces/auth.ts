// Enum con todos los roles del sistema
export enum RolUsuario {
  // Administración
  ADMINISTRADOR      = 'ADMINISTRADOR',

  // Compras
  JEFE_COMPRAS       = 'JEFE_COMPRAS',
  ASISTENTE_COMPRAS  = 'ASISTENTE_COMPRAS',
  ANALISTA_COMPRAS   = 'ANALISTA_COMPRAS',

  // Almacén
  JEFE_ALMACEN       = 'JEFE_ALMACEN',
  ASISTENTE_ALMACEN  = 'ASISTENTE_ALMACEN',
  OPERARIO_ALMACEN   = 'OPERARIO_ALMACEN',

  // Mantenimiento
  JEFE_MANTENIMIENTO       = 'JEFE_MANTENIMIENTO',
  TECNICO_MANTENIMIENTO    = 'TECNICO_MANTENIMIENTO',
  ASISTENTE_MANTENIMIENTO  = 'ASISTENTE_MANTENIMIENTO',

  // Flota
  JEFE_FLOTA       = 'JEFE_FLOTA',
  ASISTENTE_FLOTA  = 'ASISTENTE_FLOTA',
  CONDUCTOR        = 'CONDUCTOR',
}

// Módulos del sistema
export type Modulo = 'ADMINISTRACION' | 'COMPRAS' | 'ALMACEN' | 'MANTENIMIENTO' | 'FLOTA';

// Mapeo rol → módulo
export const ROL_MODULO_MAP: Record<RolUsuario, Modulo> = {
  [RolUsuario.ADMINISTRADOR]:            'ADMINISTRACION',

  [RolUsuario.JEFE_COMPRAS]:             'COMPRAS',
  [RolUsuario.ASISTENTE_COMPRAS]:        'COMPRAS',
  [RolUsuario.ANALISTA_COMPRAS]:         'COMPRAS',

  [RolUsuario.JEFE_ALMACEN]:            'ALMACEN',
  [RolUsuario.ASISTENTE_ALMACEN]:       'ALMACEN',
  [RolUsuario.OPERARIO_ALMACEN]:        'ALMACEN',

  [RolUsuario.JEFE_MANTENIMIENTO]:      'MANTENIMIENTO',
  [RolUsuario.TECNICO_MANTENIMIENTO]:   'MANTENIMIENTO',
  [RolUsuario.ASISTENTE_MANTENIMIENTO]: 'MANTENIMIENTO',

  [RolUsuario.JEFE_FLOTA]:              'FLOTA',
  [RolUsuario.ASISTENTE_FLOTA]:         'FLOTA',
  [RolUsuario.CONDUCTOR]:               'FLOTA',
};

// Ruta base por módulo
export const MODULO_RUTA_MAP: Record<Modulo, string> = {
  ADMINISTRACION: '/GestionAdministracion',
  COMPRAS:        '/GestionCompras',
  ALMACEN:        '/GestionAlmacen',
  MANTENIMIENTO:  '/GestionMantenimiento',
  FLOTA:          '/GestionFlota',
};

// DTO que se envía al backend para Login
export interface LoginRequest {
  email: string;
  password: string;
}

// DTO que devuelve el backend
export interface LoginResponse {
  token: string;
}

// Interfaz para mapear los Claims del JWT cuando se decodifica
export interface DecodedToken {
  Nombre?: string;
  Apellido1?: string;
  Apellido2?: string;
  Dni?: string;
  Cargo?: string;
  Rol?: string;
  'http://schemas.microsoft.com/ws/2008/06/identity/claims/role'?: string;
  role?: string;
  email?: string;
  exp?: number;
}

// Mantenemos UserSession para la UI, pero se generará al vuelo desde el Token
export interface UserSession {
  token: string;
  rol: RolUsuario;
  nombre: string;
  apellido1: string;
  apellido2: string;
  apellidos: string;  // apellido1 + apellido2 concatenados
  dni: string;
  cargo: string;
  email: string;
}
