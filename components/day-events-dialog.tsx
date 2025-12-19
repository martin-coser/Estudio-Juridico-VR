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
  // Función segura para formatear la fecha
  const getFormattedDate = () => {
    if (!date) return "Fecha no seleccionada"

    const dateObj = parseISO(date) // parseISO es más seguro para YYYY-MM-DD
    if (isValid(dateObj)) {
      return format(dateObj, "EEEE d 'de' MMMM 'de' yyyy", { locale: es })
    }

    return "Fecha inválida"
  }

  const formattedDate = getFormattedDate()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="capitalize">{formattedDate}</DialogTitle>
          <DialogDescription>
            {events.length === 0
              ? "No hay eventos programados"
              : `${events.length} evento${events.length > 1 ? "s" : ""} programado${events.length > 1 ? "s" : ""}`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {events.length > 0 ? (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {events.map((event) => (
                <div
                  key={event.id}
                  className="border rounded-lg p-4 space-y-3 bg-muted/30 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <h4 className="font-semibold">{event.titulo}</h4>
                      {event.descripcion && <p className="text-sm text-muted-foreground mt-1">{event.descripcion}</p>}
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(event)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => onDelete(event)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 text-xs">
                    <Badge variant="outline" className="gap-1">
                      <Clock className="h-3 w-3" />
                      {event.hora}
                    </Badge>
                    {event.clienteNombre && (
                      <Badge variant="outline" className="gap-1">
                        <User className="h-3 w-3" />
                        {event.clienteNombre}
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              Día libre 🎉
            </div>
          )}

          <div className="flex justify-center pt-4 border-t">
            <Button onClick={onNewEvent} className="bg-accent text-accent-foreground hover:bg-accent/90">
              <Plus className="mr-2 h-4 w-4" />
              Nuevo evento este día
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}