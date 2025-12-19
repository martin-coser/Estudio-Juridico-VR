"use client"

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar, Clock, User, Plus, Pencil, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Event } from "@/lib/types"
import { format, isValid, parseISO } from "date-fns"
import { es } from "date-fns/locale"

interface DayEventsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  date: string
  events: Event[]
  onEdit: (event: Event) => void
  onDelete: (event: Event) => void
  onNewEvent: () => void
}

export function DayEventsDialog({
  open,
  onOpenChange,
  date,
  events,
  onEdit,
  onDelete,
  onNewEvent,
}: DayEventsDialogProps) {
  const getFormattedDate = () => {
    if (!date) return "Fecha no seleccionada"

    const dateObj = parseISO(date)
    if (isValid(dateObj)) {
      return format(dateObj, "EEEE d 'de' MMMM 'de' yyyy", { locale: es })
    }
    return "Fecha inválida"
  }

  const formattedDate = getFormattedDate()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="
          max-w-full 
          w-[95vw] 
          sm:max-w-lg 
          max-h-[90vh] 
          flex flex-col
          p-0
        "
      >
        {/* Header fijo */}
        <DialogHeader className="p-6 pb-4 border-b border-border shrink-0">
          <DialogTitle className="text-2xl font-bold capitalize">
            {formattedDate}
          </DialogTitle>
          <DialogDescription className="text-base">
            {events.length === 0
              ? "No hay eventos programados"
              : `${events.length} evento${events.length > 1 ? "s" : ""} programado${events.length > 1 ? "s" : ""}`}
          </DialogDescription>
        </DialogHeader>

        {/* Contenido con scroll */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {events.length > 0 ? (
            <div className="space-y-4">
              {events.map((event) => (
                <div
                  key={event.id}
                  className="rounded-xl border border-border bg-card p-5 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-foreground text-lg truncate">
                        {event.titulo}
                      </h4>
                      {event.descripcion && (
                        <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                          {event.descripcion}
                        </p>
                      )}
                      
                      {/* Badges de hora y cliente */}
                      <div className="flex flex-wrap gap-2 mt-4">
                        <Badge variant="secondary" className="gap-1.5 text-xs px-2.5 py-1">
                          <Clock className="h-3.5 w-3.5" />
                          {event.hora}
                        </Badge>
                        {event.clienteNombre && (
                          <Badge variant="outline" className="gap-1.5 text-xs px-2.5 py-1">
                            <User className="h-3.5 w-3.5" />
                            {event.clienteNombre}
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Botones de acción - más grandes en móvil */}
                    <div className="flex gap-2 flex-shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-10 w-10 rounded-lg"
                        onClick={() => onEdit(event)}
                      >
                        <Pencil className="h-5 w-5" />
                        <span className="sr-only">Editar</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-10 w-10 rounded-lg text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => onDelete(event)}
                      >
                        <Trash2 className="h-5 w-5" />
                        <span className="sr-only">Eliminar</span>
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Calendar className="h-16 w-16 text-muted-foreground/40 mb-4" />
              <p className="text-lg text-muted-foreground">Día libre 🎉</p>
              <p className="text-sm text-muted-foreground/70 mt-2">
                No hay eventos programados para esta fecha
              </p>
            </div>
          )}
        </div>

        {/* Footer con botón nuevo evento - siempre visible */}
        <div className="border-t border-border p-6 shrink-0">
          <Button
            onClick={onNewEvent}
            className="w-full h-12 text-base font-medium bg-primary hover:bg-primary/90"
          >
            <Plus className="mr-2 h-5 w-5" />
            Nuevo evento este día
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}