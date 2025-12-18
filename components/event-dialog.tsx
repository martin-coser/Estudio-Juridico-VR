"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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

  // Cargar datos del evento cuando cambia (para edición)
  useEffect(() => {
    if (open) {
      fetchClients()
      if (event) {
        // Edición: cargar datos del evento
        setFormData({
          titulo: event.titulo || "",
          descripcion: event.descripcion || "",
          fecha: event.fecha || "",
          hora: event.hora || "",
          clienteId: event.clienteId || "none",
        })
      } else {
        // Nuevo: resetear y usar defaultDate si hay
        setFormData({
          titulo: "",
          descripcion: "",
          fecha: defaultDate || "",
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
    setLoading(true)

    try {
      const selectedClient = clients.find((c) => c.id === formData.clienteId)

      if (event) {
        // Update existing event
        const eventRef = doc(db, "events", event.id)
        await updateDoc(eventRef, {
          ...formData,
          clienteNombre: selectedClient?.nombre,
        })
        toast({
          title: "Evento actualizado",
          description: "El evento ha sido actualizado correctamente.",
        })
      } else {
        // Create new event
        await addDoc(collection(db, "events"), {
          ...formData,
          clienteNombre: selectedClient?.nombre,
          createdAt: Date.now(),
        })
        toast({
          title: "Evento creado",
          description: "El evento ha sido creado correctamente.",
        })
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
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{event ? "Editar Evento" : "Nuevo Evento"}</DialogTitle>
          <DialogDescription>
            {event ? "Modifica los datos del evento" : "Crea un nuevo evento en la agenda"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="titulo">Título *</Label>
            <Input
              id="titulo"
              value={formData.titulo}
              onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
              required
              placeholder="Audiencia, reunión, etc."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="descripcion">Descripción</Label>
            <Textarea
              id="descripcion"
              value={formData.descripcion}
              onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
              placeholder="Detalles adicionales del evento"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="fecha">Fecha *</Label>
              <Input
                id="fecha"
                type="date"
                value={formData.fecha}
                onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="hora">Hora *</Label>
              <Input
                id="hora"
                type="time"
                value={formData.hora}
                onChange={(e) => setFormData({ ...formData, hora: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="cliente">Cliente (Opcional)</Label>
            <Select
              value={formData.clienteId}
              onValueChange={(value) => setFormData({ ...formData, clienteId: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar cliente" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sin cliente</SelectItem>
                {clients.map((client) => (
                  <SelectItem key={client.id} value={client.id}>
                    {client.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading} className="bg-accent text-accent-foreground hover:bg-accent/90">
              {loading ? "Guardando..." : event ? "Actualizar" : "Crear"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}