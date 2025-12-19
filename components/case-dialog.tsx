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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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
  const [clientDialogOpen, setClientDialogOpen] = useState(false)
  const [step, setStep] = useState<"type" | "form">(caseData ? "form" : "type")

  const [formData, setFormData] = useState<Partial<Case>>({
    tipo: caseData?.tipo || "SRT",
    nombre: caseData?.nombre || "",
    clienteId: caseData?.clienteId || "",
    patologia: caseData?.patologia || "",
    expediente: caseData?.expediente || "",
    nombreCaso: caseData?.nombreCaso || "",
    tipoProceso: caseData?.tipoProceso || "",
    motivo: caseData?.motivo || "",
    dependencia: caseData?.dependencia || "",
    telefono: caseData?.telefono || "",
    estado: caseData?.estado || "",
    homologacionSentencia: caseData?.homologacionSentencia || "",
    plazo: caseData?.plazo || "",
    estadoPago: caseData?.estadoPago || "Debe",
  })

  const { toast } = useToast()

  useEffect(() => {
    if (open) {
      fetchClients()
      if (caseData) {
        setStep("form")
        setFormData({
          tipo: caseData.tipo,
          nombre: caseData.nombre || "",
          clienteId: caseData.clienteId || "",
          patologia: caseData.patologia || "",
          expediente: caseData.expediente || "",
          nombreCaso: caseData.nombreCaso || "",
          tipoProceso: caseData.tipoProceso || "",
          motivo: caseData.motivo || "",
          dependencia: caseData.dependencia || "",
          telefono: caseData.telefono || "",
          estado: caseData.estado || "",
          homologacionSentencia: caseData.homologacionSentencia || "",
          plazo: caseData.plazo || "",
          estadoPago: caseData.estadoPago || "Debe",
        })
      } else {
        setStep("type")
        setFormData({
          tipo: "SRT",
          nombre: "",
          clienteId: "",
          patologia: "",
          expediente: "",
          nombreCaso: "",
          tipoProceso: "",
          motivo: "",
          dependencia: "",
          telefono: "",
          estado: "",
          homologacionSentencia: "",
          plazo: "",
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
    setFormData((prev) => ({ ...prev, tipo }))
    setStep("form")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const selectedClient = clients.find((c) => c.id === formData.clienteId)

      if (caseData) {
        const caseRef = doc(db, "cases", caseData.id)
        await updateDoc(caseRef, {
          ...formData,
          clienteNombre: selectedClient?.nombre || "",
        })
        toast({ title: "Caso actualizado", description: "El caso ha sido actualizado correctamente." })
      } else {
        await addDoc(collection(db, "cases"), {
          ...formData,
          clienteNombre: selectedClient?.nombre || "",
          createdAt: Date.now(),
        })
        toast({ title: "Caso creado", description: "El caso ha sido creado correctamente." })
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
    <div className="space-y-6">
      <p className="text-center text-muted-foreground">
        Selecciona el tipo de caso para continuar
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {caseTypes.map((type) => (
          <Button
            key={type}
            variant="outline"
            className="h-24 text-base font-medium hover:bg-accent hover:text-accent-foreground transition-all"
            onClick={() => handleTypeSelect(type)}
          >
            {type}
          </Button>
        ))}
      </div>
    </div>
  )

  const renderForm = () => {
    const isSRTorART = formData.tipo === "SRT" || formData.tipo === "ART"

    return (
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Área scrolleable del formulario */}
        <div className="max-h-[65vh] overflow-y-auto pr-1 -mr-1 pb-4">
          {/* Tipo seleccionado */}
          <div className="mb-6 rounded-lg bg-accent/10 p-4 border border-accent/20">
            <p className="text-sm font-semibold text-accent">Tipo de Caso:</p>
            <p className="text-lg font-bold text-foreground">{formData.tipo}</p>
          </div>

          {/* Campos agrupados con mejor espaciado */}
          <div className="space-y-5">
            <div className="grid grid-cols-1 gap-5">
              <div>
                <Label htmlFor="nombre">Nombre del Caso *</Label>
                <Input
                  id="nombre"
                  value={formData.nombre ?? ""}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  required
                  placeholder="Ej: González c/ SRT"
                />
              </div>

              <div>
                <Label htmlFor="cliente">Cliente *</Label>
                <div className="flex flex-col sm:flex-row gap-3 mt-1">
                  <Select
                    value={formData.clienteId ?? ""}
                    onValueChange={(value) => setFormData({ ...formData, clienteId: value })}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Seleccionar cliente existente" />
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
                    className="sm:w-auto"
                  >
                    + Nuevo Cliente
                  </Button>
                </div>
              </div>

              <div>
                <Label htmlFor="expediente">Expediente</Label>
                <Input
                  id="expediente"
                  value={formData.expediente ?? ""}
                  onChange={(e) => setFormData({ ...formData, expediente: e.target.value })}
                  placeholder="Ej: 12345/2025"
                />
              </div>

              <div>
                <Label htmlFor="nombreCaso">Nombre Descriptivo</Label>
                <Input
                  id="nombreCaso"
                  value={formData.nombreCaso ?? ""}
                  onChange={(e) => setFormData({ ...formData, nombreCaso: e.target.value })}
                  placeholder="Ej: Accidente laboral - fractura"
                />
              </div>

              <div>
                <Label htmlFor="tipoProceso">Tipo de Proceso</Label>
                <Input
                  id="tipoProceso"
                  value={formData.tipoProceso ?? ""}
                  onChange={(e) => setFormData({ ...formData, tipoProceso: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="motivo">Motivo</Label>
                <Textarea
                  id="motivo"
                  value={formData.motivo ?? ""}
                  onChange={(e) => setFormData({ ...formData, motivo: e.target.value })}
                  rows={3}
                  placeholder="Descripción breve del motivo"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <Label htmlFor="dependencia">Dependencia</Label>
                  <Input
                    id="dependencia"
                    value={formData.dependencia ?? ""}
                    onChange={(e) => setFormData({ ...formData, dependencia: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="telefono">Teléfono</Label>
                  <Input
                    id="telefono"
                    value={formData.telefono ?? ""}
                    onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="estado">Estado Actual</Label>
                <Input
                  id="estado"
                  value={formData.estado ?? ""}
                  onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
                  placeholder="Ej: En trámite, A la espera de pericia..."
                />
              </div>

              <div>
                <Label htmlFor="homologacionSentencia">Homologación / Sentencia</Label>
                <Textarea
                  id="homologacionSentencia"
                  value={formData.homologacionSentencia ?? ""}
                  onChange={(e) => setFormData({ ...formData, homologacionSentencia: e.target.value })}
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <Label htmlFor="plazo">Plazo / Vencimiento</Label>
                  <Input
                    id="plazo"
                    type="date"
                    value={formData.plazo ?? ""}
                    onChange={(e) => setFormData({ ...formData, plazo: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="estadoPago">Estado de Pago *</Label>
                  <Select
                    value={formData.estadoPago ?? "Debe"}
                    onValueChange={(value: "Pagado" | "Debe") =>
                      setFormData({ ...formData, estadoPago: value })
                    }
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
              </div>

              {isSRTorART && (
                <div>
                  <Label htmlFor="patologia">Patología</Label>
                  <Textarea
                    id="patologia"
                    value={formData.patologia ?? ""}
                    onChange={(e) => setFormData({ ...formData, patologia: e.target.value })}
                    rows={3}
                    placeholder="Descripción médica detallada"
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Botones fijos al final */}
        <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t border-border sticky bottom-0 bg-background -mx-6 px-6 -mb-6 pb-6">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
            className="order-2 sm:order-1"
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={loading}
            className="order-1 sm:order-2 bg-primary hover:bg-primary/90"
          >
            {loading ? "Guardando..." : caseData ? "Actualizar Caso" : "Crear Caso"}
          </Button>
        </div>
      </form>
    )
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          className="
            max-w-full 
            w-[95vw] 
            sm:max-w-2xl 
            md:max-w-4xl 
            max-h-[95vh] 
            flex flex-col
            p-0
          "
        >
          <DialogHeader className="p-6 pb-4 border-b">
            <DialogTitle className="text-2xl">
              {caseData ? "Editar Caso" : "Nuevo Caso"}
            </DialogTitle>
            <DialogDescription className="text-base">
              {caseData
                ? "Modifica los datos del caso"
                : step === "type"
                  ? "Primero selecciona el tipo de caso"
                  : "Completa toda la información requerida"}
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-hidden px-6">
            {step === "type" ? renderTypeSelection() : renderForm()}
          </div>
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