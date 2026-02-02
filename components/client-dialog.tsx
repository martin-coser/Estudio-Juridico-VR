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
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import {
  collection,
  addDoc,
  updateDoc,
  doc,
} from "firebase/firestore"
import { db } from "@/lib/firebase"
import type { Client, Deuda } from "@/lib/types"
import { useToast } from "@/hooks/use-toast"
import { Plus, Trash2, DollarSign, Calendar, FileText } from "lucide-react"
import { cn } from "@/lib/utils"

interface ClientDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  client?: Client
  onSuccess: () => void
}

export function ClientDialog({ open, onOpenChange, client, onSuccess }: ClientDialogProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    nombre: "",
    telefono: "",
    email: "",
    dni_cuit: "",
  })

  // Estado para manejar las deudas
  const [deudas, setDeudas] = useState<Deuda[]>([])
  const [nuevaDeuda, setNuevaDeuda] = useState({
    concepto: "",
    fecha: "",
    monto: "",
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
        setDeudas(client.deudas || [])
      } else {
        setFormData({
          nombre: "",
          telefono: "",
          email: "",
          dni_cuit: "",
        })
        setDeudas([])
      }
      // Limpiamos el formulario de nueva deuda
      setNuevaDeuda({ concepto: "", fecha: "", monto: "" })
    }
  }, [open, client])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const dataToSave = {
        ...formData,
        deudas, // guardamos el array completo de deudas
      }

      if (client) {
        const clientRef = doc(db, "clients", client.id)
        await updateDoc(clientRef, dataToSave)
        toast({ title: "Cliente actualizado", description: "Los datos y deudas se guardaron correctamente." })
      } else {
        await addDoc(collection(db, "clients"), {
          ...dataToSave,
          fechaAlta: new Date().toISOString().split("T")[0],
          createdAt: Date.now(),
        })
        toast({ title: "Cliente creado", description: "El nuevo cliente y sus deudas se agregaron exitosamente." })
      }

      onSuccess()
      onOpenChange(false)
    } catch (error) {
      console.error("[ClientDialog] Error saving client:", error)
      toast({
        title: "Error",
        description: "No se pudo guardar el cliente. Intenta nuevamente.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const agregarDeuda = () => {
    if (!nuevaDeuda.concepto.trim() || !nuevaDeuda.fecha || !nuevaDeuda.monto) {
      toast({
        title: "Faltan datos",
        description: "Completa concepto, fecha y monto para agregar la deuda.",
        variant: "destructive",
      })
      return
    }

    const montoNum = parseFloat(nuevaDeuda.monto.replace(",", "."))
    if (isNaN(montoNum) || montoNum <= 0) {
      toast({
        title: "Monto inválido",
        description: "El monto debe ser un número positivo.",
        variant: "destructive",
      })
      return
    }

    const nueva = {
      id: Date.now().toString(),
      concepto: nuevaDeuda.concepto.trim(),
      fecha: nuevaDeuda.fecha,
      monto: montoNum,
      pagado: false,
      createdAt: Date.now(),
    }

    setDeudas((prev) => [...prev, nueva])
    setNuevaDeuda({ concepto: "", fecha: "", monto: "" })
  }

  const eliminarDeuda = (id: string) => {
    setDeudas((prev) => prev.filter((d) => d.id !== id))
  }

  const togglePagado = (id: string) => {
    setDeudas((prev) =>
      prev.map((d) => (d.id === id ? { ...d, pagado: !d.pagado } : d))
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="
          max-w-full 
          w-[95vw] 
          sm:max-w-2xl 
          max-h-[90vh]
          flex flex-col
          p-0
          rounded-xl
          overflow-hidden
        "
      >
        <DialogHeader className="p-5 pb-3 border-b border-border shrink-0 bg-background">
          <DialogTitle className="text-xl font-bold">
            {client ? "Editar Cliente" : "Nuevo Cliente"}
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            {client
              ? "Modifica la información y deudas del cliente"
              : "Completa los datos para registrar un nuevo cliente"}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-5 py-6 space-y-8">
          {/* Datos básicos */}
          <div className="space-y-6">
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
                className="h-11 text-base"
                disabled={loading}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <Label htmlFor="telefono" className="text-base font-medium">
                  Teléfono
                </Label>
                <Input
                  id="telefono"
                  value={formData.telefono}
                  onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                  placeholder="+54 11 1234-5678"
                  className="h-11 text-base"
                  disabled={loading}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-base font-medium">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="juan@example.com"
                  className="h-11 text-base"
                  disabled={loading}
                />
              </div>
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
                className="h-11 text-base"
                disabled={loading}
              />
            </div>
          </div>

          {/* Sección de deudas */}
          <div className="space-y-5 border-t pt-6">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-amber-600" />
              Deudas del cliente
            </h3>

            {/* Lista de deudas existentes */}
            {deudas.length > 0 ? (
              <div className="space-y-3">
                {deudas.map((deuda) => (
                  <div
                    key={deuda.id}
                    className={cn(
                      "flex items-center justify-between p-4 border rounded-lg",
                      deuda.pagado ? "bg-green-50/40 border-green-200" : "bg-amber-50/40 border-amber-200"
                    )}
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <Checkbox
                        checked={deuda.pagado}
                        onCheckedChange={() => togglePagado(deuda.id)}
                        disabled={loading}
                      />
                      <div>
                        <p className={cn("font-medium", deuda.pagado && "line-through text-muted-foreground")}>
                          {deuda.concepto}
                        </p>
                        <div className="text-sm text-muted-foreground mt-0.5 flex items-center gap-4">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5" />
                            {deuda.fecha}
                          </span>
                          <span className="font-medium text-foreground">
                            ${deuda.monto.toLocaleString("es-AR")}
                          </span>
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => eliminarDeuda(deuda.id)}
                      disabled={loading}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground italic text-center py-4">
                No hay deudas registradas para este cliente
              </p>
            )}

            {/* Formulario para agregar nueva deuda */}
            <div className="border rounded-lg p-4 bg-muted/30 space-y-4">
              <div className="font-medium text-sm flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Agregar nueva deuda
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="concepto" className="text-sm">
                    Concepto
                  </Label>
                  <Input
                    id="concepto"
                    value={nuevaDeuda.concepto}
                    onChange={(e) => setNuevaDeuda({ ...nuevaDeuda, concepto: e.target.value })}
                    placeholder="Honorarios - consulta inicial"
                    disabled={loading}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="monto" className="text-sm">
                    Monto ($)
                  </Label>
                  <Input
                    id="monto"
                    type="number"
                    value={nuevaDeuda.monto}
                    onChange={(e) => setNuevaDeuda({ ...nuevaDeuda, monto: e.target.value })}
                    placeholder="150000"
                    min="0"
                    step="1"
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="fecha" className="text-sm">
                  Fecha
                </Label>
                <Input
                  id="fecha"
                  type="date"
                  value={nuevaDeuda.fecha}
                  onChange={(e) => setNuevaDeuda({ ...nuevaDeuda, fecha: e.target.value })}
                  disabled={loading}
                />
              </div>

              <div className="flex justify-end">
                <Button
                  type="button"
                  size="sm"
                  onClick={agregarDeuda}
                  disabled={loading || !nuevaDeuda.concepto || !nuevaDeuda.fecha || !nuevaDeuda.monto}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Agregar deuda
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Botones de acción */}
        <div className="border-t border-border p-5 shrink-0 bg-background">
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
              className="h-11 order-2 sm:order-1"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading}
              onClick={handleSubmit}
              className="h-11 font-medium order-1 sm:order-2 bg-primary hover:bg-primary/90"
            >
              {loading ? "Guardando..." : client ? "Actualizar Cliente" : "Crear Cliente"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}