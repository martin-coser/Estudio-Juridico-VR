"use client"

import { AppLayout } from "@/components/app-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Bell, Calendar, DollarSign } from "lucide-react"
import { useEffect, useState } from "react"
import { collection, getDocs } from "firebase/firestore"
import { db } from "@/lib/firebase"
import type { Case, Event } from "@/lib/types"
import { cn } from "@/lib/utils"
import { formatDate } from "@/lib/formatDate"

interface Notification {
  id: string
  tipo: "plazo" | "evento" | "deudor"
  titulo: string
  mensaje: string
  fecha: string
  fechaVencimiento: string
  prioridad?: "critica" | "normal"
}

export default function NotificacionesPage() {
  const [plazosYEventos, setPlazosYEventos] = useState<Notification[]>([])
  const [deudas, setDeudas] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const alertasIzquierda: Notification[] = []
        const alertasDerecha: Notification[] = []

        // 1. Obtener "Hoy" local a las 00:00:00 para comparar días exactos
        const ahora = new Date()
        const hoyLocal = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate())

        /**
         * Función para parsear fecha evitando el error de zona horaria.
         * Si recibe "2023-10-23", crea el objeto Date localmente para ese día.
         */
        const parsearFechaLocal = (fechaStr: string) => {
          if (!fechaStr) return null;
          // Separamos por guion o barra
          const partes = fechaStr.split(/[-/]/);
          if (partes.length === 3) {
            const year = parseInt(partes[0]);
            const month = parseInt(partes[1]) - 1; // Enero es 0
            const day = parseInt(partes[2].substring(0, 2)); // Tomar solo los primeros 2 caracteres por si hay hora
            return new Date(year, month, day);
          }
          // Fallback por si el formato es distinto
          const d = new Date(fechaStr);
          return new Date(d.getFullYear(), d.getMonth(), d.getDate());
        }

        const casesSnap = await getDocs(collection(db, "cases"))
        const eventsSnap = await getDocs(collection(db, "events"))

        // === PROCESAR PLAZOS (Casos) ===
        casesSnap.forEach((doc) => {
          const caso = doc.data() as Case
          if (!caso.plazos || caso.plazos.length === 0) return

          caso.plazos.forEach((plazo) => {
            if (!plazo.fecha) return

            const fechaPlazoLocal = parsearFechaLocal(plazo.fecha)
            if (!fechaPlazoLocal) return

            // Calculamos diferencia en días exactos
            const diffTime = fechaPlazoLocal.getTime() - hoyLocal.getTime()
            const diferenciaDias = Math.round(diffTime / (1000 * 60 * 60 * 24))

            // Rango de alerta: Hoy (0), Mañana (1) y Pasado Mañana (2)
            if (diferenciaDias <= 2 && diferenciaDias >= 0) {
              alertasIzquierda.push({
                id: `plazo-${doc.id}-${plazo.id}`,
                tipo: "plazo",
                titulo: diferenciaDias === 0 ? "Vencimiento HOY" : `Vencimiento en ${diferenciaDias} día${diferenciaDias > 1 ? "s" : ""}`,
                mensaje: `Caso: ${caso.nombre}\nPlazo: ${plazo.nombre}\n${plazo.descripcion ? plazo.descripcion + "\n" : ""}Fecha: ${formatDate(plazo.fecha)}`,
                fecha: ahora.toISOString(),
                fechaVencimiento: plazo.fecha,
                prioridad: diferenciaDias === 0 ? "critica" : "normal",
              })
            }
          })
        })

        // === PROCESAR EVENTOS ===
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

        // === PROCESAR DEUDAS ===
        casesSnap.forEach((doc) => {
          const caso = doc.data() as Case
          if (caso.estadoPago === "Debe") {
            alertasDerecha.push({
              id: `deuda-${doc.id}`,
              tipo: "deudor",
              titulo: "Pago pendiente",
              mensaje: `Caso: ${caso.nombre}\nCliente: ${caso.clienteNombre || "Sin nombre"}\nExpediente: ${caso.expediente || "N/D"}`,
              fecha: ahora.toISOString(),
              fechaVencimiento: "",
            })
          }
        })

        // Ordenar por fecha de vencimiento ascendente
        alertasIzquierda.sort((a, b) => {
          const dateA = new Date(a.fechaVencimiento).getTime()
          const dateB = new Date(b.fechaVencimiento).getTime()
          return dateA - dateB
        })

        setPlazosYEventos(alertasIzquierda)
        setDeudas(alertasDerecha)
      } catch (error) {
        console.error("Error cargando notificaciones:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchNotifications()
  }, [])

  const totalAlerts = plazosYEventos.length + deudas.length

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
          {/* IZQUIERDA: Plazos y Eventos */}
          <div className="lg:col-span-2">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-6 w-6" />
                  Plazos y Eventos Próximos
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0 max-h-96 overflow-y-auto">
                {/* Añadido pb-8 para margen inferior */}
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
                            "p-5 hover:bg-accent/5 transition-colors",
                            notif.prioridad === "critica" && "bg-destructive/5 border-l-4 border-l-destructive"
                          )}
                        >
                          <div className="flex items-start gap-4">
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
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* DERECHA: Deudas */}
          <div className="lg:col-span-1">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-6 w-6" />
                  Pagos Pendientes
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0 max-h-96 overflow-y-auto">
                {/* Añadido pb-8 para margen inferior */}
                <div className="pb-8">
                  {loading ? (
                    <div className="flex items-center justify-center py-20">
                      <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                    </div>
                  ) : deudas.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                      <DollarSign className="h-16 w-16 text-muted-foreground/30 mb-4" />
                      <p className="text-muted-foreground">No hay deudas pendientes</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-border">
                      {deudas.map((notif) => (
                        <div key={notif.id} className="p-5 hover:bg-accent/5 transition-colors">
                          <div className="flex items-start gap-4">
                            <DollarSign className="h-5 w-5 mt-1 text-red-600 dark:text-red-400" />
                            <div className="flex-1">
                              <h3 className="font-semibold mb-1">{notif.titulo}</h3>
                              <p className="text-sm text-foreground/80 whitespace-pre-line">
                                {notif.mensaje}
                              </p>
                            </div>
                          </div>
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
    </AppLayout>
  )
}