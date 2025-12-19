"use client"

import { AppLayout } from "@/components/app-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Bell, CheckCircle2, AlertCircle, Calendar, Clock, User } from "lucide-react"
import { useState } from "react"
import { cn } from "@/lib/utils"

// Mock notifications (en producción vendrán de Firebase)
const mockNotifications = [
  {
    id: "1",
    tipo: "plazo",
    titulo: "Vencimiento Próximo",
    mensaje: "El caso Exp. 12345 tiene vencimiento en 3 días",
    leida: false,
    fecha: new Date().toISOString(),
  },
  {
    id: "2",
    tipo: "evento",
    titulo: "Audiencia Mañana",
    mensaje: "Audiencia con el cliente Juan Pérez a las 10:00 AM",
    leida: false,
    fecha: new Date().toISOString(),
  },
  {
    id: "3",
    tipo: "deudor",
    titulo: "Cliente con Deuda",
    mensaje: "El cliente María González tiene pagos pendientes",
    leida: true,
    fecha: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "4",
    tipo: "evento",
    titulo: "Reunión con Cliente",
    mensaje: "Reunión programada con Ana López",
    leida: true,
    fecha: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
]

export default function NotificacionesPage() {
  const [notifications, setNotifications] = useState(mockNotifications)

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((notif) => (notif.id === id ? { ...notif, leida: true } : notif))
    )
  }

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((notif) => ({ ...notif, leida: true })))
  }

  const unreadCount = notifications.filter((n) => !n.leida).length

  const getIcon = (tipo: string) => {
    switch (tipo) {
      case "plazo":
        return <Calendar className="h-5 w-5" />
      case "evento":
        return <Clock className="h-5 w-5" />
      case "deudor":
        return <User className="h-5 w-5" />
      default:
        return <AlertCircle className="h-5 w-5" />
    }
  }

  const getColor = (tipo: string) => {
    switch (tipo) {
      case "plazo":
        return "text-amber-600 dark:text-amber-400"
      case "evento":
        return "text-blue-600 dark:text-blue-400"
      case "deudor":
        return "text-red-600 dark:text-red-400"
      default:
        return "text-muted-foreground"
    }
  }

  return (
    <AppLayout>
      <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-foreground flex items-center gap-3">
              <Bell className="h-8 w-8" />
              Notificaciones
            </h1>
            <p className="text-muted-foreground mt-2">
              {unreadCount > 0
                ? `${unreadCount} notificación${unreadCount !== 1 ? "es" : ""} sin leer`
                : "Todas las notificaciones leídas"}
            </p>
          </div>

          {unreadCount > 0 && (
            <Button onClick={markAllAsRead} variant="outline" size="sm">
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Marcar todas como leídas
            </Button>
          )}
        </div>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl">Centro de Notificaciones</CardTitle>
            <CardDescription>
              Recordatorios importantes sobre plazos, eventos y pagos
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <Bell className="h-20 w-20 text-muted-foreground/30 mb-6" />
                <p className="text-xl text-muted-foreground">Sin notificaciones</p>
                <p className="text-sm text-muted-foreground/70 mt-2">
                  Todo al día 🎉
                </p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={cn(
                      "p-5 hover:bg-accent/5 transition-colors",
                      !notification.leida && "bg-primary/5"
                    )}
                  >
                    <div className="flex items-start gap-4">
                      {/* Ícono con color según tipo */}
                      <div className={cn("mt-1 flex-shrink-0", getColor(notification.tipo))}>
                        {getIcon(notification.tipo)}
                      </div>

                      <div className="flex-1 min-w-0 space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-semibold text-foreground">
                            {notification.titulo}
                          </h3>
                          <Badge variant="secondary" className="text-xs">
                            {notification.tipo}
                          </Badge>
                          {!notification.leida && (
                            <Badge className="bg-primary text-primary-foreground text-xs">
                              Nueva
                            </Badge>
                          )}
                        </div>

                        <p className="text-sm text-foreground/80 leading-relaxed">
                          {notification.mensaje}
                        </p>

                        <p className="text-xs text-muted-foreground">
                          {new Date(notification.fecha).toLocaleDateString("es-AR", {
                            weekday: "long",
                            day: "numeric",
                            month: "long",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>

                      {/* Botón marcar como leída */}
                      {!notification.leida && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => markAsRead(notification.id)}
                          className="flex-shrink-0"
                        >
                          <CheckCircle2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  )
}