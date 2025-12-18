"use client"

import { AppLayout } from "@/components/app-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { EventDialog } from "@/components/event-dialog"
import { Calendar, Plus, Clock, User, Pencil, Trash2, ChevronLeft, ChevronRight } from "lucide-react"
import { useEffect, useState } from "react"
import { collection, getDocs, deleteDoc, doc, query, orderBy } from "firebase/firestore"
import { db } from "@/lib/firebase"
import type { Event } from "@/lib/types"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

export default function AgendaPage() {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<Event | undefined>(undefined)
  const [selectedDate, setSelectedDate] = useState<string>("")
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [eventToDelete, setEventToDelete] = useState<Event | null>(null)
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const { toast } = useToast()

  const fetchEvents = async () => {
    try {
      const eventsRef = collection(db, "events")
      const q = query(eventsRef, orderBy("fecha"), orderBy("hora"))
      const querySnapshot = await getDocs(q)
      const eventsData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Event[]
      setEvents(eventsData)
    } catch (error) {
      console.error("[v0] Error fetching events:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchEvents()
  }, [])

  const handleEdit = (event: Event) => {
    setSelectedEvent(event)
    setDialogOpen(true)
  }

  const handleDelete = async () => {
    if (!eventToDelete) return

    try {
      await deleteDoc(doc(db, "events", eventToDelete.id))
      toast({
        title: "Evento eliminado",
        description: "El evento ha sido eliminado correctamente.",
      })
      fetchEvents()
    } catch (error) {
      console.error("[v0] Error deleting event:", error)
      toast({
        title: "Error",
        description: "No se pudo eliminar el evento.",
        variant: "destructive",
      })
    } finally {
      setDeleteDialogOpen(false)
      setEventToDelete(null)
    }
  }

  // Calendar logic
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()

    return { daysInMonth, startingDayOfWeek, year, month }
  }

  const { daysInMonth, startingDayOfWeek, year, month } = getDaysInMonth(currentMonth)

  const previousMonth = () => {
    setCurrentMonth(new Date(year, month - 1))
  }

  const nextMonth = () => {
    setCurrentMonth(new Date(year, month + 1))
  }

  const getEventsForDate = (date: string) => {
    return events.filter((event) => event.fecha === date)
  }

  const upcomingEvents = events.filter((event) => {
    const today = new Date().toISOString().split("T")[0]
    return event.fecha >= today
  })

  const isToday = (dateStr: string) => {
    const today = new Date().toISOString().split("T")[0]
    return dateStr === today
  }

  const monthNames = [
    "Enero",
    "Febrero",
    "Marzo",
    "Abril",
    "Mayo",
    "Junio",
    "Julio",
    "Agosto",
    "Septiembre",
    "Octubre",
    "Noviembre",
    "Diciembre",
  ]

  return (
    <AppLayout>
      <div className="space-y-6 max-w-7xl">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-foreground">Agenda</h2>
            <p className="text-muted-foreground mt-1">Calendario y eventos próximos</p>
          </div>
          <Button
            onClick={() => {
              setSelectedEvent(undefined)
              setSelectedDate("")
              setDialogOpen(true)
            }}
            className="bg-accent text-accent-foreground hover:bg-accent/90"
          >
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Evento
          </Button>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Calendar (sin cambios, tamaño original) */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>
                  {monthNames[month]} {year}
                </CardTitle>
                <div className="flex gap-2">
                  <Button variant="outline" size="icon" onClick={previousMonth}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="icon" onClick={nextMonth}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-accent"></div>
                </div>
              ) : (
                <div className="grid grid-cols-7 gap-2">
                  {["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"].map((day) => (
                    <div key={day} className="text-center text-sm font-medium text-muted-foreground p-2">
                      {day}
                    </div>
                  ))}

                  {Array.from({ length: startingDayOfWeek }).map((_, i) => (
                    <div key={`empty-${i}`} className="p-2" />
                  ))}

                  {Array.from({ length: daysInMonth }).map((_, i) => {
                    const day = i + 1
                    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
                    const dayEvents = getEventsForDate(dateStr)
                    const isTodayEvent = isToday(dateStr)

                    return (
                      <button
                        key={day}
                        onClick={() => {
                          setSelectedDate(dateStr)
                          setDialogOpen(true)
                        }}
                        className={cn(
                          "p-2 rounded-lg text-center transition-colors hover:bg-accent/20 relative min-h-[60px] flex flex-col items-start justify-start",
                          isTodayEvent && "bg-accent/10 border border-accent font-medium",
                        )}
                      >
                        <span className={cn("text-sm font-medium", isTodayEvent && "text-accent")}>{day}</span>
                        {dayEvents.length > 0 && (
                          <div className="mt-1 space-y-0.5 w-full">
                            {dayEvents.slice(0, 2).map((event) => (
                              <div key={event.id} className="text-[10px] bg-accent/20 rounded px-1 py-0.5 truncate">
                                {event.hora.slice(0, 5)}
                              </div>
                            ))}
                            {dayEvents.length > 2 && (
                              <div className="text-[10px] text-muted-foreground">+{dayEvents.length - 2}</div>
                            )}
                          </div>
                        )}
                      </button>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Próximos eventos con scroll vertical fijo */}
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Próximos Eventos</CardTitle>
              <CardDescription>{upcomingEvents.length} eventos programados</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-accent"></div>
                </div>
              ) : upcomingEvents.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">No hay eventos próximos</div>
              ) : (
                <div className="h-[500px] overflow-y-auto"> {/* Scroll vertical fijo */}
                  <div className="space-y-3 px-6 pb-6">
                    {upcomingEvents.map((event) => {
                      const isTodayEvent = isToday(event.fecha)
                      return (
                        <div
                          key={event.id}
                          className={cn(
                            "border rounded-lg p-3 space-y-2 transition-colors",
                            isTodayEvent ? "bg-accent/10 border-accent" : "border-border hover:bg-accent/5"
                          )}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <h4 className={cn("font-semibold text-sm leading-tight", isTodayEvent && "text-accent")}>
                              {event.titulo}
                            </h4>
                            <div className="flex gap-1 flex-shrink-0">
                              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEdit(event)}>
                                <Pencil className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => {
                                  setEventToDelete(event)
                                  setDeleteDialogOpen(true)
                                }}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>

                          {event.descripcion && <p className="text-xs text-muted-foreground">{event.descripcion}</p>}

                          <div className="flex flex-wrap gap-2 text-xs">
                            <Badge variant="outline" className="gap-1">
                              <Calendar className="h-3 w-3" />
                              {event.fecha}
                            </Badge>
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

                          {isTodayEvent && (
                            <Badge variant="secondary" className="mt-2 bg-accent/20 text-accent border-accent/30">
                              Hoy
                            </Badge>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Modal de evento */}
        <EventDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          event={selectedEvent}
          defaultDate={selectedDate}
          onSuccess={fetchEvents}
        />

        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta acción no se puede deshacer. El evento {eventToDelete?.titulo} será eliminado permanentemente.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
                Eliminar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AppLayout>
  )
}