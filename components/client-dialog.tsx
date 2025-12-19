"use client"

import type React from "react"
import { useEffect, useState } from "react"
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
import { collection, addDoc, updateDoc, doc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import type { Client } from "@/lib/types"
import { useToast } from "@/hooks/use-toast"

interface ClientDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  client?: Client
  onSuccess: () => void
}

export function ClientDialog({ open, onOpenChange, client, onSuccess }: ClientDialogProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    nombre: client?.nombre || "",
    telefono: client?.telefono || "",
    email: client?.email || "",
    dni_cuit: client?.dni_cuit || "",
  })

  const { toast } = useToast()

  useEffect(() => {
    if (open) {
      if (client) {
        setFormData({
          nombre: client.nombre || "",
          telefono: client.telefono || "",
          email: client.email || "",
          dni_cuit: client.dni_cuit || "",
        })
      } else {
        setFormData({
          nombre: "",
          telefono: "",
          email: "",
          dni_cuit: "",
        })
      }
    }
  }, [open, client])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (client) {
        const clientRef = doc(db, "clients", client.id)
        await updateDoc(clientRef, { ...formData })
        toast({ title: "Cliente actualizado", description: "Los datos se guardaron correctamente." })
      } else {
        await addDoc(collection(db, "clients"), {
          ...formData,
          fechaAlta: new Date().toISOString().split("T")[0],
          createdAt: Date.now(),
        })
        toast({ title: "Cliente creado", description: "El nuevo cliente se agregó exitosamente." })
      }

      onSuccess()
      onOpenChange(false)
    } catch (error) {
      console.error("[v0] Error saving client:", error)
      toast({
        title: "Error",
        description: "No se pudo guardar el cliente. Intenta nuevamente.",
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
          max-h-[80vh]           /* Menos altura para evitar recorte */
          flex flex-col
          p-0
          rounded-xl
          overflow-hidden
        "
      >
        {/* Header fijo */}
        <DialogHeader className="p-5 pb-3 border-b border-border shrink-0 bg-background">
          <DialogTitle className="text-xl font-bold">
            {client ? "Editar Cliente" : "Nuevo Cliente"}
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            {client
              ? "Modifica la información del cliente"
              : "Completa los datos para registrar un nuevo cliente"}
          </DialogDescription>
        </DialogHeader>

        {/* Formulario con scroll independiente y más espacio */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-5 py-5 space-y-6">
          <div className="space-y-1.5">
            <Label htmlFor="nombre" className="text-base font-medium">
              Nombre completo *
            </Label>
            <Input
              id="nombre"
              value={formData.nombre}
              onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              required
              placeholder="Juan Pérez"
              className="h-12 text-base"
              disabled={loading}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="telefono" className="text-base font-medium">
              Teléfono *
            </Label>
            <Input
              id="telefono"
              value={formData.telefono}
              onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
              required
              placeholder="+54 11 1234-5678"
              className="h-12 text-base"
              disabled={loading}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-base font-medium">
              Email *
            </Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
              placeholder="juan@example.com"
              className="h-12 text-base"
              disabled={loading}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="dni_cuit" className="text-base font-medium">
              DNI / CUIT *
            </Label>
            <Input
              id="dni_cuit"
              value={formData.dni_cuit}
              onChange={(e) => setFormData({ ...formData, dni_cuit: e.target.value })}
              required
              placeholder="30-12345678-9"
              className="h-12 text-base"
              disabled={loading}
            />
          </div>

          {/* Margen extra al final para que el último campo no quede pegado */}
          <div className="pb-20" />
        </form>

        {/* Botones fijos al fondo */}
        <div className="border-t border-border p-5 shrink-0 bg-background">
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
              className="h-12 order-2 sm:order-1"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading}
              onClick={handleSubmit}
              className="h-12 font-medium order-1 sm:order-2 bg-primary hover:bg-primary/90"
            >
              {loading ? "Guardando..." : client ? "Actualizar Cliente" : "Crear Cliente"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}