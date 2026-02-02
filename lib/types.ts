export interface Client {
  id: string
  nombre: string
  telefono: string
  email: string
  dni_cuit: string
  fechaAlta: string
  createdAt: number
  deudas?: Deuda[]
}

export interface Plazo {
  id: string                 
  nombre: string             
  descripcion?: string       
  fecha: string
  cumplido?: boolean              
}

export type Oficio = {
  id: string
  titulo: string
  descripcion?: string
  fechaEntrega?: string
  entregado: boolean
}

export type Tarea = {
  id: string
  titulo: string
  descripcion?: string
  fechaEntrega?: string
  entregado: boolean
}

export interface Case {
  id: string
  tipo?: "SRT"| "ART"| "FAMILIA"| "LABORAL DESPIDOS"| "DAÑOS Y PERJUICIOS"| "OTRO"| "DECLARATORIAS"| "JUICIOS ANSES"| "JUBILACIONES Y PENSIONES"
  caratula: string
  clienteId: string
  clienteNombre?: string
  patologia?: string
  estado?: string
  expediente?: string
  homologacionSentencia?: string
  nombreCaso?: string
  tipoProceso?: string
  descripcion?: string
  localidad?: string
  plazos: Plazo[]     
  oficios?: Oficio[]
  tareas?: Tarea[]     
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

export interface Deuda {
  id: string                
  concepto: string           
  fecha: string             
  monto: number               
  pagado?: boolean         
  createdAt?: number          
}