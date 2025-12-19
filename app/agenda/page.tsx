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
import { DayEventsDialog } from "@/components/day-events-dialog"
import { Calendar, Plus, Clock, User, Pencil, Trash2, ChevronLeft, ChevronRight } from "lucide-react"
import { useEffect, useState } from "react"
import { collection, getDocs, deleteDoc, doc, query, orderBy } from "firebase/firestore"
import { db } from "@/lib/firebase"
import type { Event } from "@/lib/types"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { formatDate } from "@/lib/formatDate"

export default function AgendaPage() {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<Event | undefined>(undefined)
  const [selectedDate, setSelectedDate] = useState<string>("")
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [eventToDelete, setEventToDelete] = useState<Event | null>(null)
  const [currentMonth, setCurrentMonth] = useState(new Date())

  const [dayEventsOpen, setDayEventsOpen] = useState(false)
  const [selectedDayEvents, setSelectedDayEvents] = useState<Event[]>([])

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
      toast({ title: "Evento eliminado", description: "El evento se eliminó correctamente." })
      fetchEvents()
    } catch (error) {
      console.error("[v0] Error deleting event:", error)
      toast({ title: "Error", description: "No se pudo eliminar el evento.", variant: "destructive" })
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
    const startingDayOfWeek = firstDay.getDay() // 0 = Domingo

    return { daysInMonth, startingDayOfWeek, year, month }
  }

  const { daysInMonth, startingDayOfWeek, year, month } = getDaysInMonth(currentMonth)

  const previousMonth = () => setCurrentMonth(new Date(year, month - 1))
  const nextMonth = () => setCurrentMonth(new Date(year, month + 1))

  const getEventsForDate = (date: string) => events.filter((e) => e.fecha === date)

  const upcomingEvents = events.filter((e) => {
    const today = new Date().toISOString().split("T")[0]
    return e.fecha >= today
  }).slice(0, 20) // Limitamos para no saturar en móvil

  const isToday = (dateStr: string) => dateStr === new Date().toISOString().split("T")[0]

  const monthNames = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
  ]

  const weekDays = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"]

  return (
    <AppLayout>
      <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-foreground">Agenda</h1>
            <p className="text-muted-foreground mt-1">Calendario y eventos próximos</p>
          </div>
          <Button
            onClick={() => {
              setSelectedEvent(undefined)
              setSelectedDate("")
              setDialogOpen(true)
            }}
            size="lg"
            className="bg-primary hover:bg-primary/90"
          >
            <Plus className="mr-2 h-5 w-5" />
            Nuevo Evento
          </Button>
        </div>

        {/* Calendario siempre arriba en móvil */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-2xl">{monthNames[month]} {year}</CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" size="icon" onClick={previousMonth}>
                  <ChevronLeft className="h-5 w-5" />
                </Button>
                <Button variant="outline" size="icon" onClick={nextMonth}>
                  <ChevronRight className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              </div>
            ) : (
              <div className="grid grid-cols-7 gap-1 text-center">
                {/* Días de la semana */}
                {weekDays.map((day) => (
                  <div key={day} className="py-3 text-sm font-semibold text-muted-foreground">
                    {day}
                  </div>
                ))}

                {/* Espacios vacíos al inicio */}
                {Array.from({ length: startingDayOfWeek }).map((_, i) => (
                  <div key={`empty-${i}`} className="aspect-square" />
                ))}

                {/* Días del mes */}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const day = i + 1
                  const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
                  const dayEvents = getEventsForDate(dateStr)
                  const today = isToday(dateStr)

                  return (
                    <button
                      key={day}
                      onClick={() => {
                        setSelectedDayEvents(dayEvents)
                        setSelectedDate(dateStr)
                        setDayEventsOpen(true)
                      }}
                      className={cn(
                        "aspect-square rounded-xl p-2 flex flex-col items-center justify-center transition-all",
                        "hover:bg-accent/20",
                        today && "bg-primary/10 ring-2 ring-primary font-bold",
                        dayEvents.length > 0 && "bg-accent/10"
                      )}
                    >
                      <span className={cn("text-lg font-medium", today && "text-primary")}>
                        {day}
                      </span>
                      {dayEvents.length > 0 && (
                        <div className="mt-1 flex flex-wrap gap-1 justify-center">
                          {dayEvents.slice(0, 3).map((_, idx) => (
                            <div key={idx} className="h-1.5 w-1.5 rounded-full bg-primary" />
                          ))}
                          {dayEvents.length > 3 && (
                            <span className="text-xs text-muted-foreground">+{dayEvents.length - 3}</span>
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

        {/* Próximos eventos - debajo en móvil, al lado en lg+ */}
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Próximos Eventos</CardTitle>
            <CardDescription>
              {upcomingEvents.length} evento{upcomingEvents.length !== 1 && "s"} programado{upcomingEvents.length !== 1 && "s"}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              </div>
            ) : upcomingEvents.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground text-lg">
                No hay eventos próximos
              </div>
            ) : (
              <div className="max-h-96 overflow-y-auto">
                <div className="divide-y divide-border">
                  {upcomingEvents.map((event) => {
                    const today = isToday(event.fecha)
                    return (
                      <div
                        key={event.id}
                        className={cn(
                          "p-4 hover:bg-accent/5 transition-colors",
                          today && "bg-primary/5"
                        )}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <h4 className={cn("font-semibold truncate", today && "text-primary")}>
                              {event.titulo}
                            </h4>
                            {event.descripcion && (
                              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                {event.descripcion}
                              </p>
                            )}
                            <div className="flex flex-wrap gap-2 mt-3 text-sm">
                              <Badge variant="secondary" className="gap-1 text-xs">
                                <Calendar className="h-3 w-3" />
                                {formatDate(event.fecha)}
                              </Badge>
                              <Badge variant="secondary" className="gap-1 text-xs">
                                <Clock className="h-3 w-3" />
                                {event.hora}
                              </Badge>
                              {event.clienteNombre && (
                                <Badge variant="outline" className="gap-1 text-xs truncate max-w-[120px]">
                                  <User className="h-3 w-3" />
                                  {event.clienteNombre}
                                </Badge>
                              )}
                            </div>
                            {today && (
                              <Badge className="mt-2" variant="default">
                                Hoy
                              </Badge>
                            )}
                          </div>

                          <div className="flex gap-1 flex-shrink-0">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-9 w-9"
                              onClick={() => handleEdit(event)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-9 w-9"
                              onClick={() => {
                                setEventToDelete(event)
                                setDeleteDialogOpen(true)
                              }}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Modales */}
      <DayEventsDialog
        open={dayEventsOpen}
        onOpenChange={setDayEventsOpen}
        date={selectedDate}
        events={selectedDayEvents}
        onEdit={(event) => {
          setSelectedEvent(event)
          setDialogOpen(true)
          setDayEventsOpen(false)
        }}
        onDelete={(event) => {
          setEventToDelete(event)
          setDeleteDialogOpen(true)
          setDayEventsOpen(false)
        }}
        onNewEvent={() => {
          setSelectedEvent(undefined)
          setSelectedDate(selectedDate)
          setDialogOpen(true)
          setDayEventsOpen(false)
        }}
      />

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
            <AlertDialogTitle>¿Eliminar evento?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción es permanente. El evento <strong>{eventToDelete?.titulo}</strong> se eliminará.
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
    </AppLayout>
  )
}