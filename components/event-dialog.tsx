"use client"

import type React from "react"
import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { collection, addDoc, updateDoc, doc, getDocs, query, orderBy } from "firebase/firestore"
import { db } from "@/lib/firebase"
import type { Event, Client } from "@/lib/types"
import { useToast } from "@/hooks/use-toast"

interface EventDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  event?: Event
  onSuccess: () => void
  defaultDate?: string
}

export function EventDialog({ open, onOpenChange, event, onSuccess, defaultDate }: EventDialogProps) {
  const [loading, setLoading] = useState(false)
  const [clients, setClients] = useState<Client[]>([])
  const [formData, setFormData] = useState({
    titulo: "",
    descripcion: "",
    fecha: defaultDate || "",
    hora: "",
    clienteId: "none",
  })

  const { toast } = useToast()

  // Fecha de hoy en formato YYYY-MM-DD (para comparación)
  const today = new Date().toISOString().split("T")[0]

  // Determinar si la fecha seleccionada es anterior a hoy
  const isPastDate = formData.fecha && formData.fecha < today
  // Si estamos editando un evento pasado, permitimos solo visualizar (no guardar cambios)
  const isEditingPastEvent = event && event.fecha < today
  // Bloquear guardado si: es nuevo y fecha pasada, o es edición de evento pasado
  const disableSave = isPastDate || isEditingPastEvent

  useEffect(() => {
    if (open) {
      fetchClients()
      if (event) {
        setFormData({
          titulo: event.titulo || "",
          descripcion: event.descripcion || "",
          fecha: event.fecha || "",
          hora: event.hora || "",
          clienteId: event.clienteId || "none",
        })
      } else {
        setFormData({
          titulo: "",
          descripcion: "",
          fecha: defaultDate || today, // Por defecto hoy
          hora: "",
          clienteId: "none",
        })
      }
    }
  }, [open, event, defaultDate])

  const fetchClients = async () => {
    try {
      const clientsRef = collection(db, "clients")
      const q = query(clientsRef, orderBy("nombre"))
      const querySnapshot = await getDocs(q)
      const clientsData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Client[]
      setClients(clientsData)
    } catch (error) {
      console.error("[v0] Error fetching clients:", error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Bloqueo adicional por si alguien fuerza el envío
    if (disableSave && !event) {
      toast({
        title: "Fecha inválida",
        description: "No se pueden crear eventos en fechas pasadas.",
        variant: "destructive",
      })
      return
    }

    if (isEditingPastEvent) {
      toast({
        title: "No permitido",
        description: "No se pueden modificar eventos de fechas pasadas.",
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    try {
      let clienteNombre = null
      if (formData.clienteId && formData.clienteId !== "none") {
        const selectedClient = clients.find((c) => c.id === formData.clienteId)
        clienteNombre = selectedClient?.nombre || null
      }

      if (event) {
        const eventRef = doc(db, "events", event.id)
        await updateDoc(eventRef, { ...formData, clienteNombre })
        toast({ title: "Evento actualizado", description: "El evento se actualizó correctamente." })
      } else {
        await addDoc(collection(db, "events"), {
          ...formData,
          clienteNombre,
          createdAt: Date.now(),
        })
        toast({ title: "Evento creado", description: "El evento se agregó a la agenda." })
      }

      onSuccess()
      onOpenChange(false)
    } catch (error) {
      console.error("[v0] Error saving event:", error)
      toast({
        title: "Error",
        description: "No se pudo guardar el evento.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="
          max-w-full 
          w-[95vw] 
          sm:max-w-lg 
          max-h-[95vh] 
          flex flex-col 
          p-0
        "
      >
        {/* Header fijo */}
        <DialogHeader className="p-6 pb-4 border-b border-border shrink-0">
          <DialogTitle className="text-2xl font-bold">
            {event ? "Editar Evento" : "Nuevo Evento"}
          </DialogTitle>
          <DialogDescription className="text-base">
            {event
              ? isEditingPastEvent
                ? "Este evento es de una fecha pasada. Solo puedes visualizarlo."
                : "Modifica los detalles del evento"
              : "Programa un nuevo evento en la agenda"}
          </DialogDescription>
        </DialogHeader>

        {/* Formulario con scroll */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
          <div className="space-y-2">
            <Label htmlFor="titulo" className="text-base font-medium">
              Título del evento *
            </Label>
            <Input
              id="titulo"
              value={formData.titulo}
              onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
              required
              placeholder="Ej: Audiencia con Juzgado N°5"
              className="h-12 text-base"
              disabled={isEditingPastEvent}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="descripcion" className="text-base font-medium">
              Descripción (opcional)
            </Label>
            <Textarea
              id="descripcion"
              value={formData.descripcion}
              onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
              placeholder="Detalles, notas o recordatorios..."
              rows={4}
              className="text-base"
              disabled={isEditingPastEvent}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="space-y-2">
              <Label htmlFor="fecha" className="text-base font-medium">
                Fecha *
              </Label>
              <Input
                id="fecha"
                type="date"
                value={formData.fecha}
                onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
                required
                min={today} // ¡Importante! Bloquea fechas anteriores en el selector nativo
                className="h-12"
                disabled={isEditingPastEvent}
              />
              {isPastDate && !event && (
                <p className="text-sm text-destructive">No se permiten eventos en fechas pasadas.</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="hora" className="text-base font-medium">
                Hora *
              </Label>
              <Input
                id="hora"
                type="time"
                value={formData.hora}
                onChange={(e) => setFormData({ ...formData, hora: e.target.value })}
                required
                className="h-12"
                disabled={isEditingPastEvent}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="cliente" className="text-base font-medium">
              Cliente asociado (opcional)
            </Label>
            <Select
              value={formData.clienteId}
              onValueChange={(value) => setFormData({ ...formData, clienteId: value })}
              disabled={isEditingPastEvent}
            >
              <SelectTrigger className="h-12 text-base">
                <SelectValue placeholder="Seleccionar cliente" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sin cliente asociado</SelectItem>
                {clients.map((client) => (
                  <SelectItem key={client.id} value={client.id}>
                    {client.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </form>

        {/* Botones fijos al final */}
        <div className="border-t border-border p-6 shrink-0">
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
              className="h-12 order-2 sm:order-1"
            >
              {isEditingPastEvent ? "Cerrar" : "Cancelar"}
            </Button>
            <Button
              type={disableSave ? "button" : "submit"}
              disabled={loading || disableSave}
              onClick={disableSave ? undefined : handleSubmit}
              className="h-12 font-medium order-1 sm:order-2 bg-primary hover:bg-primary/90"
            >
              {loading
                ? "Guardando..."
                : isEditingPastEvent
                  ? "No se puede modificar"
                  : event
                    ? "Actualizar Evento"
                    : "Crear Evento"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}