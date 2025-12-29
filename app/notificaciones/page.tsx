"use client"

import { AppLayout } from "@/components/app-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Bell, Calendar, FileText, CheckSquare, Eye } from "lucide-react"
import { useEffect, useState } from "react"
import { collection, getDocs } from "firebase/firestore"
import { db } from "@/lib/firebase"
import type { Case, Event } from "@/lib/types"
import { cn } from "@/lib/utils"
import { formatDate } from "@/lib/formatDate"
import { CaseDetailsDialog } from "@/components/case-details-dialog"

interface Notification {
  id: string
  tipo: "plazo" | "evento" | "oficio" | "tarea"
  titulo: string
  mensaje: string
  fecha: string
  fechaVencimiento?: string
  prioridad?: "critica" | "normal"
  caso?: Case
}

export default function NotificacionesPage() {
  const [plazosYEventos, setPlazosYEventos] = useState<Notification[]>([])
  const [oficiosYTareas, setOficiosYTareas] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCase, setSelectedCase] = useState<Case | null>(null)
  const [detailsOpen, setDetailsOpen] = useState(false)

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const alertasIzquierda: Notification[] = []
        const alertasDerecha: Notification[] = []

        const ahora = new Date()
        const hoyLocal = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate())

        const parsearFechaLocal = (fechaStr: string) => {
          if (!fechaStr) return null
          const partes = fechaStr.split(/[-/]/)
          if (partes.length === 3) {
            const year = parseInt(partes[0])
            const month = parseInt(partes[1]) - 1
            const day = parseInt(partes[2].substring(0, 2))
            return new Date(year, month, day)
          }
          const d = new Date(fechaStr)
          return new Date(d.getFullYear(), d.getMonth(), d.getDate())
        }

        const casesSnap = await getDocs(collection(db, "cases"))
        const eventsSnap = await getDocs(collection(db, "events"))

        // === PROCESAR PLAZOS (Izquierda) ===
        casesSnap.forEach((doc) => {
          const caso = { id: doc.id, ...doc.data() } as Case
          if (!caso.plazos || caso.plazos.length === 0) return

          caso.plazos.forEach((plazo) => {
            if (!plazo.fecha) return

            const fechaPlazoLocal = parsearFechaLocal(plazo.fecha)
            if (!fechaPlazoLocal) return

            const diffTime = fechaPlazoLocal.getTime() - hoyLocal.getTime()
            const diferenciaDias = Math.round(diffTime / (1000 * 60 * 60 * 24))

            if (diferenciaDias <= 2 && diferenciaDias >= 0) {
              alertasIzquierda.push({
                id: `plazo-${doc.id}-${plazo.id}`,
                tipo: "plazo",
                titulo: diferenciaDias === 0 ? "Vencimiento HOY" : `Vencimiento en ${diferenciaDias} día${diferenciaDias > 1 ? "s" : ""}`,
                mensaje: `Carátula: ${caso.caratula}\nExpediente: ${caso.expediente || "Sin expediente"}\nPlazo: ${plazo.nombre}${plazo.descripcion ? "\n" + plazo.descripcion : ""}`,
                fecha: ahora.toISOString(),
                fechaVencimiento: plazo.fecha,
                prioridad: diferenciaDias === 0 ? "critica" : "normal",
                caso: caso,
              })
            }
          })
        })

        // === PROCESAR EVENTOS (Izquierda) ===
        eventsSnap.forEach((doc) => {
          const evento = doc.data() as Event
          if (!evento.fecha) return

          const fechaEventoLocal = parsearFechaLocal(evento.fecha)
          if (!fechaEventoLocal) return

          const diffTime = fechaEventoLocal.getTime() - hoyLocal.getTime()
          const diferenciaDias = Math.round(diffTime / (1000 * 60 * 60 * 24))

          if (diferenciaDias <= 2 && diferenciaDias >= 0) {
            alertasIzquierda.push({
              id: `evento-${doc.id}`,
              tipo: "evento",
              titulo: diferenciaDias === 0 ? "Evento HOY" : `Evento en ${diferenciaDias} día${diferenciaDias > 1 ? "s" : ""}`,
              mensaje: `${evento.titulo}\n${evento.hora ? "Hora: " + evento.hora + "\n" : ""}${evento.clienteNombre ? "Cliente: " + evento.clienteNombre + "\n" : ""}${evento.descripcion || ""}`,
              fecha: ahora.toISOString(),
              fechaVencimiento: evento.fecha,
              prioridad: diferenciaDias === 0 ? "critica" : "normal",
            })
          }
        })

        // === PROCESAR OFICIOS Y TAREAS PENDIENTES (Derecha) ===
        casesSnap.forEach((doc) => {
          const caso = { id: doc.id, ...doc.data() } as Case

          // Oficios pendientes
          if (caso.oficios && caso.oficios.length > 0) {
            caso.oficios
              .filter((oficio) => !oficio.entregado)
              .forEach((oficio) => {
                alertasDerecha.push({
                  id: `oficio-${doc.id}-${oficio.id}`,
                  tipo: "oficio",
                  titulo: "Oficio pendiente",
                  mensaje: `Carátula: ${caso.caratula}\nExpediente: ${caso.expediente || "Sin expediente"}\nOficio: ${oficio.titulo}${oficio.fechaEntrega ? "\nFecha entrega: " + formatDate(oficio.fechaEntrega) : ""}${oficio.descripcion ? "\n" + oficio.descripcion : ""}`,
                  fecha: ahora.toISOString(),
                  caso: caso,
                })
              })
          }

          // Tareas pendientes
          if (caso.tareas && caso.tareas.length > 0) {
            caso.tareas
              .filter((tarea) => !tarea.entregado)
              .forEach((tarea) => {
                alertasDerecha.push({
                  id: `tarea-${doc.id}-${tarea.id}`,
                  tipo: "tarea",
                  titulo: "Tarea pendiente",
                  mensaje: `Carátula: ${caso.caratula}\nExpediente: ${caso.expediente || "Sin expediente"}\nTarea: ${tarea.titulo}${tarea.fechaEntrega ? "\nFecha límite: " + formatDate(tarea.fechaEntrega) : ""}${tarea.descripcion ? "\n" + tarea.descripcion : ""}`,
                  fecha: ahora.toISOString(),
                  caso: caso,
                })
              })
          }
        })

        // Ordenar por fecha de vencimiento (si aplica)
        alertasIzquierda.sort((a, b) => {
          if (!a.fechaVencimiento || !b.fechaVencimiento) return 0
          return new Date(a.fechaVencimiento).getTime() - new Date(b.fechaVencimiento).getTime()
        })

        // Ordenar oficios y tareas por título o fecha si hay
        alertasDerecha.sort((a, b) => a.titulo.localeCompare(b.titulo))

        setPlazosYEventos(alertasIzquierda)
        setOficiosYTareas(alertasDerecha)
      } catch (error) {
        console.error("Error cargando notificaciones:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchNotifications()
  }, [])

  const totalAlerts = plazosYEventos.length + oficiosYTareas.length

  const openCaseDetails = (caso: Case) => {
    setSelectedCase(caso)
    setDetailsOpen(true)
  }

  return (
    <AppLayout>
      <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground flex items-center gap-3">
            <Bell className="h-8 w-8" />
            Notificaciones
          </h1>
          <p className="text-muted-foreground mt-2">
            {loading
              ? "Cargando alertas..."
              : totalAlerts > 0
                ? `${totalAlerts} alerta${totalAlerts > 1 ? "s" : ""} activa${totalAlerts > 1 ? "s" : ""}`
                : "Todo al día 🎉"}
          </p>
        </div>

        {/* Layout de dos columnas */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* IZQUIERDA: Plazos y Eventos Próximos */}
          <div className="lg:col-span-2">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-6 w-6" />
                  Plazos y Eventos Próximos
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0 max-h-96 overflow-y-auto">
                <div className="pb-8">
                  {loading ? (
                    <div className="flex items-center justify-center py-20">
                      <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                    </div>
                  ) : plazosYEventos.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                      <Calendar className="h-16 w-16 text-muted-foreground/30 mb-4" />
                      <p className="text-muted-foreground">No hay plazos ni eventos próximos</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-border">
                      {plazosYEventos.map((notif) => (
                        <div
                          key={notif.id}
                          className={cn(
                            "p-5 hover:bg-accent/5 transition-colors flex items-start justify-between",
                            notif.prioridad === "critica" && "bg-destructive/5 border-l-4 border-l-destructive"
                          )}
                        >
                          <div className="flex items-start gap-4 flex-1">
                            <Calendar
                              className={cn(
                                "h-5 w-5 mt-1 flex-shrink-0",
                                notif.prioridad === "critica" ? "text-destructive animate-pulse" : "text-amber-600 dark:text-amber-400"
                              )}
                            />
                            <div className="flex-1">
                              <div className="flex flex-wrap items-center gap-2 mb-1">
                                <h3 className={cn(
                                  "font-semibold",
                                  notif.prioridad === "critica" && "text-destructive"
                                )}>
                                  {notif.titulo}
                                </h3>
                                <Badge
                                  variant="outline"
                                  className={cn(
                                    "text-xs",
                                    notif.tipo === "plazo" && "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900/30 dark:text-amber-300",
                                    notif.tipo === "evento" && "bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/30 dark:text-blue-300"
                                  )}
                                >
                                  {notif.tipo === "plazo" ? "Plazo" : "Agenda"}
                                </Badge>
                                {notif.prioridad === "critica" && (
                                  <Badge className="bg-destructive text-destructive-foreground text-xs">
                                    CRÍTICA
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-foreground/80 whitespace-pre-line">
                                {notif.mensaje}
                              </p>
                            </div>
                          </div>

                          {notif.tipo === "plazo" && notif.caso && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => openCaseDetails(notif.caso!)}
                              className="ml-4"
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              Ver caso
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* DERECHA: Oficios y Tareas Pendientes */}
          <div className="lg:col-span-1">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckSquare className="h-6 w-6" />
                  Oficios y Tareas Pendientes
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0 max-h-96 overflow-y-auto">
                <div className="pb-8">
                  {loading ? (
                    <div className="flex items-center justify-center py-20">
                      <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                    </div>
                  ) : oficiosYTareas.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                      <CheckSquare className="h-16 w-16 text-muted-foreground/30 mb-4" />
                      <p className="text-muted-foreground">No hay pendientes</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-border">
                      {oficiosYTareas.map((notif) => (
                        <div
                          key={notif.id}
                          className="p-5 hover:bg-accent/5 transition-colors flex items-start justify-between"
                        >
                          <div className="flex items-start gap-4 flex-1">
                            {notif.tipo === "oficio" ? (
                              <FileText className="h-5 w-5 mt-1 text-orange-600 flex-shrink-0" />
                            ) : (
                              <CheckSquare className="h-5 w-5 mt-1 text-blue-600 flex-shrink-0" />
                            )}
                            <div className="flex-1">
                              <h3 className="font-semibold mb-1">{notif.titulo}</h3>
                              <p className="text-sm text-foreground/80 whitespace-pre-line">
                                {notif.mensaje}
                              </p>
                            </div>
                          </div>

                          {notif.caso && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => openCaseDetails(notif.caso!)}
                              className="ml-4"
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              Ver caso
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Modal de detalle del caso */}
      {selectedCase && (
        <CaseDetailsDialog
          open={detailsOpen}
          onOpenChange={setDetailsOpen}
          caseData={selectedCase}
        />
      )}
    </AppLayout>
  )
}