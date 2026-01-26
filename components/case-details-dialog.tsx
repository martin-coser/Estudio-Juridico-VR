"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import type { Case } from "@/lib/types"
import {
  Calendar,
  FileText,
  CheckSquare,
  User,
  Briefcase,
  MapPin,
  Gavel,
  DollarSign,
  AlertCircle,
  AlertTriangle,
  Stethoscope,
  ScrollText,
  Circle,
  Power,
} from "lucide-react"

// === UTILIDADES DE FECHA SEGURAS ===

// Hoy a las 00:00 (hora local)
const todayStart = new Date()
todayStart.setHours(0, 0, 0, 0)

// Convierte "YYYY-MM-DD" a Date en zona local (00:00)
const parseDateAsLocal = (dateStr: string): Date => {
  const [y, m, d] = dateStr.split("-").map(Number)
  return new Date(y, m - 1, d)
}

// Formateo seguro para mostrar
const formatDate = (dateString?: string) => {
  if (!dateString) return "Sin fecha"
  const [year, month, day] = dateString.split("-").map(Number)
  return new Date(year, month - 1, day).toLocaleDateString("es-AR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  })
}

// Verifica si una fecha (string YYYY-MM-DD) ya venció (estrictamente antes de hoy)
const isOverdue = (fecha?: string) => {
  if (!fecha) return false
  const plazoDate = parseDateAsLocal(fecha)
  return plazoDate < todayStart
}

// Verifica si una fecha está en los próximos 7 días (incluyendo hoy)
const isSoon = (fecha?: string) => {
  if (!fecha) return false
  const plazoDate = parseDateAsLocal(fecha)
  if (plazoDate < todayStart) return false
  const diffTime = plazoDate.getTime() - todayStart.getTime()
  const diffDays = diffTime / (1000 * 60 * 60 * 24)
  return diffDays <= 7
}

// === COMPONENTE ===

interface CaseDetailsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  caseData: Case
}

export function CaseDetailsDialog({ open, onOpenChange, caseData }: CaseDetailsDialogProps) {
  const isSRTorART = caseData.tipo === "SRT" || caseData.tipo === "ART"

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl lg:max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="border-b pb-6">
          <DialogTitle className="text-3xl font-bold flex items-center gap-3">
            <Briefcase className="h-8 w-8 text-primary" />
            Detalles del Caso
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="info" className="mt-6">
          <TabsList className="w-full">
            <TabsTrigger value="info" className="flex-1 gap-2">
              <Briefcase className="h-4 w-4" />
              <span className="hidden sm:inline">Información General</span>
              <span className="sm:hidden">Info</span>
            </TabsTrigger>
            <TabsTrigger value="seguimiento" className="flex-1 gap-2">
              <Calendar className="h-4 w-4" />
              <span className="hidden sm:inline">Plazos, Oficios y Tareas</span>
              <span className="sm:hidden">Seguimiento</span>
            </TabsTrigger>
          </TabsList>

          {/* Tab: Información General */}
          <TabsContent value="info" className="mt-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-foreground">{caseData.caratula}</h2>
                <p className="text-muted-foreground mt-1">
                  Expediente: <span className="font-mono font-semibold">{caseData.expediente || "Sin asignar"}</span>
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <Badge variant="secondary" className="text-base px-4 py-1.5">
                  {caseData.tipo}
                </Badge>
                <Badge
                  variant={caseData.estadoPago === "Pagado" ? "default" : "destructive"}
                  className="text-base px-4 py-1.5"
                >
                  <DollarSign className="h-4 w-4 mr-1" />
                  {caseData.estadoPago}
                </Badge>
              </div>
            </div>

            <Separator />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="flex items-center gap-3">
                <User className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Cliente</p>
                  <p className="font-medium">{caseData.clienteNombre || "Sin asignar"}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <MapPin className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Localidad</p>
                  <p className="font-medium">{caseData.localidad}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Gavel className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Tipo de Proceso</p>
                  <p className="font-medium">{caseData.tipoProceso || "No especificado"}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Power className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Estado</p>
                  <Badge 
                    variant="outline"
                    className={`
                      px-3 py-1 font-medium
                      ${caseData.estado === "Activo" 
                        ? "border-emerald-200 bg-emerald-50 text-emerald-800" 
                        : "border-gray-300 bg-gray-100 text-gray-700"}
                    `}
                  >
                    {caseData.estado || "Activo"}
                  </Badge>
                </div>
              </div>
            </div>

            {caseData.nombreCaso && (
              <div className="flex items-start gap-3">
                <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Nombre descriptivo</p>
                  <p className="font-medium">{caseData.nombreCaso}</p>
                </div>
              </div>
            )}

            {/* Textos largos */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {caseData.descripcion && (
                <div className="flex items-start gap-3">
                  <ScrollText className="h-10 w-10 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Descripción</p>
                    <p className="text-foreground whitespace-pre-wrap">{caseData.descripcion}</p>
                  </div>
                </div>
              )}

              {caseData.homologacionSentencia && (
                <div className="flex items-start gap-3">
                  <Gavel className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Homologación / Sentencia</p>
                    <p className="text-foreground whitespace-pre-wrap">{caseData.homologacionSentencia}</p>
                  </div>
                </div>
              )}
            </div>

            {isSRTorART && caseData.patologia && (
              <>
                <Separator />
                <div className="flex items-start gap-3">
                  <Stethoscope className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Patología</p>
                    <p className="text-foreground whitespace-pre-wrap">{caseData.patologia}</p>
                  </div>
                </div>
              </>
            )}
          </TabsContent>

          {/* Tab: Plazos, Oficios y Tareas */}
          <TabsContent value="seguimiento" className="mt-6 space-y-8">
            {/* Plazos */}
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                Plazos del Caso
              </h3>
              {caseData.plazos && caseData.plazos.length > 0 ? (
                <div className="space-y-3">
                  {caseData.plazos.map((plazo) => {
                    const overdue = isOverdue(plazo.fecha)
                    const soon = !overdue && isSoon(plazo.fecha)
                    return (
                      <div
                        key={plazo.id}
                        className={cn(
                          "rounded-lg border p-4 transition-all",
                          overdue && "border-destructive/50 bg-destructive/5",
                          soon && "border-orange-500/50 bg-orange-500/5"
                        )}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <p className="font-semibold text-foreground">{plazo.nombre}</p>
                            {plazo.descripcion && (
                              <p className="text-sm text-muted-foreground mt-1">{plazo.descripcion}</p>
                            )}
                          </div>
                          <div className="text-right">
                            <p className={cn("font-medium", overdue && "text-destructive", soon && "text-orange-600")}>
                              {formatDate(plazo.fecha)}
                            </p>
                            {overdue && <Badge variant="destructive" className="mt-1 text-xs">Vencido</Badge>}
                            {soon && <Badge className="mt-1 text-xs bg-orange-500 text-white">Próximo</Badge>}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <p className="text-muted-foreground italic">No hay plazos definidos</p>
              )}
            </div>

            <Separator />

            {/* Oficios */}
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Oficios
              </h3>
              {caseData.oficios && caseData.oficios.length > 0 ? (
                <div className="space-y-3">
                  {caseData.oficios.map((oficio) => {
                    const overdue = isOverdue(oficio.fechaEntrega) && !oficio.entregado
                    return (
                      <div
                        key={oficio.id}
                        className={cn(
                          "rounded-lg border p-4",
                          overdue && "border-destructive/50 bg-destructive/5"
                        )}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <p className="font-semibold">{oficio.titulo}</p>
                            {oficio.descripcion && (
                              <p className="text-sm text-muted-foreground mt-1">{oficio.descripcion}</p>
                            )}
                            {oficio.fechaEntrega && (
                              <p className={cn("text-sm mt-2", overdue && "text-destructive")}>
                                Fecha de entrega: {formatDate(oficio.fechaEntrega)}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <Checkbox checked={oficio.entregado} disabled />
                            <span className={cn("text-sm font-medium", oficio.entregado ? "text-green-600" : "text-muted-foreground")}>
                              {oficio.entregado ? "Entregado" : "Pendiente"}
                            </span>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <p className="text-muted-foreground italic">No hay oficios registrados</p>
              )}
            </div>

            <Separator />

            {/* Tareas */}
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <CheckSquare className="h-5 w-5 text-primary" />
                Tareas
              </h3>
              {caseData.tareas && caseData.tareas.length > 0 ? (
                <div className="space-y-3">
                  {caseData.tareas.map((tarea) => {
                    const overdue = isOverdue(tarea.fechaEntrega) && !tarea.entregado
                    return (
                      <div
                        key={tarea.id}
                        className={cn(
                          "rounded-lg border p-4",
                          overdue && "border-destructive/50 bg-destructive/5"
                        )}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <p className={cn("font-semibold", tarea.entregado && "line-through text-muted-foreground")}>
                              {tarea.titulo}
                            </p>
                            {tarea.descripcion && (
                              <p className="text-sm text-muted-foreground mt-1">{tarea.descripcion}</p>
                            )}
                            {tarea.fechaEntrega && (
                              <p className={cn("text-sm mt-2", overdue && "text-destructive")}>
                                Fecha límite: {formatDate(tarea.fechaEntrega)}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <Checkbox checked={tarea.entregado} disabled />
                            <span className={cn("text-sm font-medium", tarea.entregado ? "text-green-600" : "text-muted-foreground")}>
                              {tarea.entregado ? "Completada" : "Pendiente"}
                            </span>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <p className="text-muted-foreground italic">No hay tareas pendientes</p>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
