export interface Client {
  id: string
  nombre: string
  telefono: string
  email: string
  dni_cuit: string
  fechaAlta: string
  createdAt: number
}

export interface Plazo {
  id: string                 
  nombre: string             
  descripcion?: string       
  fecha: string              
}

export interface Case {
  id: string
  tipo: "SRT" | "ART" | "FAMILIA" | "LABORAL DESPIDOS" | "DAÑOS Y PERJUICIOS"
  nombre: string
  clienteId: string
  clienteNombre?: string
  patologia?: string
  estado?: string
  expediente?: string
  homologacionSentencia?: string
  nombreCaso?: string
  tipoProceso?: string
  motivo?: string
  localidad?: string
  dependencia?: string
  plazos: Plazo[]          
  estadoPago: "Pagado" | "Debe"
  createdAt: number
}

export interface Event {
  id: string
  titulo: string
  descripcion?: string
  fecha: string
  hora: string
  clienteId?: string
  clienteNombre?: string
  createdAt: number
}

export interface Notification {
  id: string
  tipo: "plazo" | "evento" | "deudor" | "sistema"
  titulo: string
  mensaje: string
  leida: boolean
  fecha: string
  createdAt: number
}