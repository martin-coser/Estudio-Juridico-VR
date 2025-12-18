"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { collection, addDoc, updateDoc, doc, getDocs, query, orderBy } from "firebase/firestore"
import { db } from "@/lib/firebase"
import type { Case, Client } from "@/lib/types"
import { useToast } from "@/hooks/use-toast"
import { ClientDialog } from "./client-dialog"

interface CaseDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  caseData?: Case
  onSuccess: () => void
}

const caseTypes = ["SRT", "ART", "FAMILIA", "LABORAL DESPIDOS", "DAÑOS Y PERJUICIOS"] as const

export function CaseDialog({ open, onOpenChange, caseData, onSuccess }: CaseDialogProps) {
  const [loading, setLoading] = useState(false)
  const [clients, setClients] = useState<Client[]>([])
  const [step, setStep] = useState<"type" | "form">(caseData ? "form" : "type")
  const [clientDialogOpen, setClientDialogOpen] = useState(false)
  const [formData, setFormData] = useState<Partial<Case>>({
    tipo: caseData?.tipo || "SRT",
    nombre: caseData?.nombre || "",
    clienteId: caseData?.clienteId || "",
    patologia: caseData?.patologia || "",
    estado: caseData?.estado || "",
    expediente: caseData?.expediente || "",
    homologacionSentencia: caseData?.homologacionSentencia || "",
    nombreCaso: caseData?.nombreCaso || "",
    tipoProceso: caseData?.tipoProceso || "",
    motivo: caseData?.motivo || "",
    dependencia: caseData?.dependencia || "",
    telefono: caseData?.telefono || "",
    plazo: caseData?.plazo || "",
    estadoPago: caseData?.estadoPago || "Debe",
  })
  const { toast } = useToast()

  useEffect(() => {
    if (open) {
      fetchClients()
      if (!caseData) {
        setStep("type")
        setFormData({
          tipo: "SRT",
          estadoPago: "Debe",
        })
      }
    }
  }, [open, caseData])

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

  const handleTypeSelect = (tipo: (typeof caseTypes)[number]) => {
    setFormData({ ...formData, tipo })
    setStep("form")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const selectedClient = clients.find((c) => c.id === formData.clienteId)

      if (caseData) {
        // Update existing case
        const caseRef = doc(db, "cases", caseData.id)
        await updateDoc(caseRef, {
          ...formData,
          clienteNombre: selectedClient?.nombre,
        })
        toast({
          title: "Caso actualizado",
          description: "El caso ha sido actualizado correctamente.",
        })
      } else {
        // Create new case
        await addDoc(collection(db, "cases"), {
          ...formData,
          clienteNombre: selectedClient?.nombre,
          createdAt: Date.now(),
        })
        toast({
          title: "Caso creado",
          description: "El caso ha sido creado correctamente.",
        })
      }

      onSuccess()
      onOpenChange(false)
      setStep("type")
    } catch (error) {
      console.error("[v0] Error saving case:", error)
      toast({
        title: "Error",
        description: "No se pudo guardar el caso.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const renderTypeSelection = () => (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">Selecciona el tipo de caso para continuar:</p>
      <div className="grid grid-cols-2 gap-3">
        {caseTypes.map((type) => (
          <Button
            key={type}
            variant="outline"
            className="h-20 text-sm hover:bg-accent hover:text-accent-foreground bg-transparent"
            onClick={() => handleTypeSelect(type)}
          >
            {type}
          </Button>
        ))}
      </div>
    </div>
  )

  const renderForm = () => {
    const isSRT = formData.tipo === "SRT"

    return (
      <form onSubmit={handleSubmit} className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
        {/* Type display */}
        <div className="bg-accent/10 p-3 rounded-lg border border-accent/20">
          <p className="text-sm font-medium text-accent">Tipo de Caso: {formData.tipo}</p>
        </div>

        {/* Common fields */}
        <div className="space-y-2">
          <Label htmlFor="nombre">Nombre *</Label>
          <Input
            id="nombre"
            value={formData.nombre}
            onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
            required
            placeholder="Nombre del caso"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="cliente">Cliente *</Label>
          <div className="flex gap-2">
            <Select
              value={formData.clienteId}
              onValueChange={(value) => setFormData({ ...formData, clienteId: value })}
            >
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Seleccionar cliente" />
              </SelectTrigger>
              <SelectContent>
                {clients.map((client) => (
                  <SelectItem key={client.id} value={client.id}>
                    {client.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              type="button"
              variant="outline"
              onClick={() => setClientDialogOpen(true)}
              className="whitespace-nowrap"
            >
              Nuevo Cliente
            </Button>
          </div>
        </div>

        {/* SRT-specific fields */}
        {isSRT && (
          <>
            <div className="space-y-2">
              <Label htmlFor="patologia">Patología</Label>
              <Input
                id="patologia"
                value={formData.patologia}
                onChange={(e) => setFormData({ ...formData, patologia: e.target.value })}
                placeholder="Descripción de la patología"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="estado">Estado</Label>
              <Input
                id="estado"
                value={formData.estado}
                onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
                placeholder="Estado del caso"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="expediente">Expediente</Label>
              <Input
                id="expediente"
                value={formData.expediente}
                onChange={(e) => setFormData({ ...formData, expediente: e.target.value })}
                placeholder="Número de expediente"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="homologacionSentencia">Homologación/Sentencia</Label>
              <Textarea
                id="homologacionSentencia"
                value={formData.homologacionSentencia}
                onChange={(e) => setFormData({ ...formData, homologacionSentencia: e.target.value })}
                placeholder="Detalles de homologación o sentencia"
                rows={3}
              />
            </div>
          </>
        )}

        {/* ART, FAMILIA, LABORAL, DAÑOS fields */}
        {!isSRT && (
          <>
            <div className="space-y-2">
              <Label htmlFor="patologia">Patología</Label>
              <Input
                id="patologia"
                value={formData.patologia}
                onChange={(e) => setFormData({ ...formData, patologia: e.target.value })}
                placeholder="Descripción de la patología"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="expediente">Expediente (Número)</Label>
              <Input
                id="expediente"
                value={formData.expediente}
                onChange={(e) => setFormData({ ...formData, expediente: e.target.value })}
                placeholder="Número de expediente"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="nombreCaso">Nombre del Caso</Label>
              <Input
                id="nombreCaso"
                value={formData.nombreCaso}
                onChange={(e) => setFormData({ ...formData, nombreCaso: e.target.value })}
                placeholder="Nombre descriptivo del caso"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tipoProceso">Tipo de Proceso</Label>
              <Input
                id="tipoProceso"
                value={formData.tipoProceso}
                onChange={(e) => setFormData({ ...formData, tipoProceso: e.target.value })}
                placeholder="Tipo de proceso judicial"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="motivo">Motivo</Label>
              <Textarea
                id="motivo"
                value={formData.motivo}
                onChange={(e) => setFormData({ ...formData, motivo: e.target.value })}
                placeholder="Motivo del caso"
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dependencia">Dependencia</Label>
              <Input
                id="dependencia"
                value={formData.dependencia}
                onChange={(e) => setFormData({ ...formData, dependencia: e.target.value })}
                placeholder="Dependencia judicial"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="telefono">Teléfono</Label>
              <Input
                id="telefono"
                value={formData.telefono}
                onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                placeholder="Teléfono de contacto"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="estado">Estado</Label>
              <Input
                id="estado"
                value={formData.estado}
                onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
                placeholder="Estado del caso"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="homologacionSentencia">Homologación/Sentencia</Label>
              <Textarea
                id="homologacionSentencia"
                value={formData.homologacionSentencia}
                onChange={(e) => setFormData({ ...formData, homologacionSentencia: e.target.value })}
                placeholder="Detalles de homologación o sentencia"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="plazo">Plazo (Fecha)</Label>
              <Input
                id="plazo"
                type="date"
                value={formData.plazo}
                onChange={(e) => setFormData({ ...formData, plazo: e.target.value })}
              />
            </div>
          </>
        )}

        {/* Payment status */}
        <div className="space-y-2">
          <Label htmlFor="estadoPago">Estado de Pago *</Label>
          <Select
            value={formData.estadoPago}
            onValueChange={(value: "Pagado" | "Debe") => setFormData({ ...formData, estadoPago: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Pagado">Pagado</SelectItem>
              <SelectItem value="Debe">Debe</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex justify-end gap-3 pt-4 sticky bottom-0 bg-popover pb-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              if (caseData) {
                onOpenChange(false)
              } else {
                setStep("type")
              }
            }}
            disabled={loading}
          >
            {caseData ? "Cancelar" : "Atrás"}
          </Button>
          <Button type="submit" disabled={loading} className="bg-accent text-accent-foreground hover:bg-accent/90">
            {loading ? "Guardando..." : caseData ? "Actualizar" : "Crear"}
          </Button>
        </div>
      </form>
    )
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{caseData ? "Editar Caso" : "Nuevo Caso"}</DialogTitle>
            <DialogDescription>
              {caseData
                ? "Modifica los datos del caso"
                : step === "type"
                  ? "Selecciona el tipo de caso"
                  : "Completa los datos del caso"}
            </DialogDescription>
          </DialogHeader>

          {step === "type" ? renderTypeSelection() : renderForm()}
        </DialogContent>
      </Dialog>

      <ClientDialog
        open={clientDialogOpen}
        onOpenChange={setClientDialogOpen}
        onSuccess={() => {
          fetchClients()
          setClientDialogOpen(false)
        }}
      />
    </>
  )
}
