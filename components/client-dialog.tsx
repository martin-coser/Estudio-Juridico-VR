"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (client) {
        // Update existing client
        const clientRef = doc(db, "clients", client.id)
        await updateDoc(clientRef, {
          ...formData,
        })
        toast({
          title: "Cliente actualizado",
          description: "El cliente ha sido actualizado correctamente.",
        })
      } else {
        // Create new client
        await addDoc(collection(db, "clients"), {
          ...formData,
          fechaAlta: new Date().toISOString().split("T")[0],
          createdAt: Date.now(),
        })
        toast({
          title: "Cliente creado",
          description: "El cliente ha sido creado correctamente.",
        })
      }

      onSuccess()
      onOpenChange(false)
      setFormData({ nombre: "", telefono: "", email: "", dni_cuit: "" })
    } catch (error) {
      console.error("[v0] Error saving client:", error)
      toast({
        title: "Error",
        description: "No se pudo guardar el cliente.",
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
          <DialogTitle>{client ? "Editar Cliente" : "Nuevo Cliente"}</DialogTitle>
          <DialogDescription>
            {client ? "Modifica los datos del cliente" : "Ingresa los datos del nuevo cliente"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nombre">Nombre *</Label>
            <Input
              id="nombre"
              value={formData.nombre}
              onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              required
              placeholder="Juan Pérez"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="telefono">Teléfono *</Label>
            <Input
              id="telefono"
              value={formData.telefono}
              onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
              required
              placeholder="+54 11 1234-5678"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
              placeholder="juan@example.com"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="dni_cuit">DNI/CUIT *</Label>
            <Input
              id="dni_cuit"
              value={formData.dni_cuit}
              onChange={(e) => setFormData({ ...formData, dni_cuit: e.target.value })}
              required
              placeholder="12345678 o 20-12345678-9"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading} className="bg-accent text-accent-foreground hover:bg-accent/90">
              {loading ? "Guardando..." : client ? "Actualizar" : "Crear"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
