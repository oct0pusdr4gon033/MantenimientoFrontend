export interface ProveedorContactoRequest {
  nombre: string;
  apellido1: string;
  apellido2?: string;
  correo?: string;
  telefono?: string;
  estado: string;
}

export interface ProveedorContactoResponse {
  id_contacto: number;
  ruc_proveedor: string;
  nombre: string;
  apellido1: string;
  apellido2: string;
  correo: string;
  telefono: string;
  estado: string;
}

export interface ProveedorRequest {
  ruc: string;
  razon_social: string;
  nombre_comercial?: string;
  direccion?: string;
  correo?: string;
  telefono?: string;
  estado: string;
  categorias?: string[];
}

export interface ProveedorResponse {
  ruc: string;
  razon_social: string;
  nombre_comercial: string;
  direccion: string;
  correo: string;
  telefono: string;
  estado: string;
  categorias: string[];
  contactos: ProveedorContactoResponse[];
}

export interface CategoriaProveedorResponse {
  cod_cat: string;
  nombre_cat: string;
}
