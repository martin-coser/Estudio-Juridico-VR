"use client"

import { AppLayout } from "@/components/app-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Bell, CheckCircle2, AlertCircle } from "lucide-react"
import { useState } from "react"

// Mock notifications for now
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
]

export default function NotificacionesPage() {
  const [notifications, setNotifications] = useState(mockNotifications)

  const markAsRead = (id: string) => {
    setNotifications((prev) => prev.map((notif) => (notif.id === id ? { ...notif, leida: true } : notif)))
  }

  const unreadCount = notifications.filter((n) => !n.leida).length

  return (
    <AppLayout>
      <div className="space-y-6 max-w-4xl">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Notificaciones</h2>
          <p className="text-muted-foreground mt-1">
            {unreadCount} notificación{unreadCount !== 1 ? "es" : ""} sin leer
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Centro de Notificaciones</CardTitle>
            <CardDescription>Plazos, eventos y recordatorios importantes</CardDescription>
          </CardHeader>
          <CardContent>
            {notifications.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No hay notificaciones</p>
              </div>
            ) : (
              <div className="space-y-3">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={cn(
                      "border rounded-lg p-4 space-y-2 transition-colors",
                      !notification.leida && "bg-accent/5 border-accent/20",
                    )}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 flex-1">
                        <AlertCircle
                          className={cn(
                            "h-5 w-5 mt-0.5 flex-shrink-0",
                            !notification.leida ? "text-accent" : "text-muted-foreground",
                          )}
                        />
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-semibold text-sm">{notification.titulo}</h4>
                            <Badge variant="outline" className="text-xs">
                              {notification.tipo}
                            </Badge>
                            {!notification.leida && (
                              <Badge variant="default" className="bg-accent text-accent-foreground text-xs">
                                Nueva
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">{notification.mensaje}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(notification.fecha).toLocaleDateString("es-AR", {
                              day: "numeric",
                              month: "long",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>
                      </div>

                      {!notification.leida && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => markAsRead(notification.id)}
                          className="flex-shrink-0"
                        >
                          <CheckCircle2 className="h-4 w-4 mr-1" />
                          Marcar leída
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

function cn(...classes: string[]) {
  return classes.filter(Boolean).join(" ")
}
