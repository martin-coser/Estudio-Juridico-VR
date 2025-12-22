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
import type { Case, Client, Plazo } from "@/lib/types"
import { useToast } from "@/hooks/use-toast"
import { ClientDialog } from "./client-dialog"

interface CaseDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  caseData?: Case
  onSuccess: () => void
}

const caseTypes = ["SRT", "ART", "FAMILIA", "LABORAL DESPIDOS", "DAÑOS Y PERJUICIOS"] as const

const localidades = ["Río Cuarto", "Villa María", "Alta Gracia"] as const

const dependenciasPorLocalidad: Record<string, string[]> = {
  "Río Cuarto": ["Juzgado Civil 1° Nom.", "Juzgado Civil 2° Nom.", "Cámara Civil"],
  "Villa María": ["Juzgado de 1ra Instancia", "Juzgado de Ejecución", "Tribunal de Familia"],
  "Alta Gracia": ["Juzgado Civil y Comercial", "Juzgado de Paz", "Fuero Laboral"],
}

const tiposProceso = [
  "Ordinario",
  "Sumario",
  "Ejecutivo",
  "Sucesorio",
  "Concursal",
  "Medidas Cautelares",
  "Amparo",
  "Laboral",
] as const

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
    localidad: caseData?.localidad || "",
    dependencia: caseData?.dependencia || "",
    estado: caseData?.estado || "Activo",
    homologacionSentencia: caseData?.homologacionSentencia || "",
    plazos: caseData?.plazos || [],
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
          localidad: caseData.localidad || "",
          dependencia: caseData.dependencia || "",
          estado: caseData.estado || "Activo",
          homologacionSentencia: caseData.homologacionSentencia || "",
          plazos: caseData.plazos || [],
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
          localidad: "",
          dependencia: "",
          estado: "Activo",
          homologacionSentencia: "",
          plazos: [],
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

      const dataToSave = {
        ...formData,
        clienteNombre: selectedClient?.nombre || "",
        ...(caseData ? {} : { createdAt: Date.now() }),
      }

      if (caseData) {
        const caseRef = doc(db, "cases", caseData.id)
        await updateDoc(caseRef, dataToSave)
        toast({ title: "Caso actualizado", description: "El caso ha sido actualizado correctamente." })
      } else {
        await addDoc(collection(db, "cases"), dataToSave)
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
    <div className="space-y-8 py-8">
      <p className="text-center text-lg text-muted-foreground">
        Selecciona el tipo de caso para continuar
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-3xl mx-auto">
        {caseTypes.map((type) => (
          <Button
            key={type}
            variant="outline"
            className="h-28 text-lg font-medium hover:bg-accent hover:text-accent-foreground transition-all border-2"
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

    const addPlazo = () => {
      const nuevo: Plazo = {
        id: Date.now().toString(),
        nombre: "",
        descripcion: "",
        fecha: "",
      }
      setFormData((prev) => ({
        ...prev,
        plazos: [...(prev.plazos || []), nuevo],
      }))
    }

    const removePlazo = (id: string) => {
      setFormData((prev) => ({
        ...prev,
        plazos: prev.plazos?.filter((p) => p.id !== id) || [],
      }))
    }

    const updatePlazo = (id: string, field: keyof Plazo, value: string) => {
      setFormData((prev) => ({
        ...prev,
        plazos: prev.plazos?.map((p) => (p.id === id ? { ...p, [field]: value } : p)) || [],
      }))
    }

    return (
      <form onSubmit={handleSubmit} className="space-y-6 py-6">
        {/* Tipo seleccionado */}
        <div className="rounded-lg bg-accent/10 p-4 border border-accent/20">
          <p className="text-sm font-semibold text-accent">Tipo de Caso:</p>
          <p className="text-lg font-bold text-foreground">{formData.tipo}</p>
        </div>

        {/* Campos principales - todos los Select con ancho uniforme */}
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
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

            {/* Cliente con botón + Nuevo */}
            <div>
              <Label htmlFor="cliente">Cliente *</Label>
              <div className="grid grid-cols-4 gap-3 mt-1">
                <div className="col-span-3">
                  <Select
                    value={formData.clienteId ?? ""}
                    onValueChange={(value) => setFormData({ ...formData, clienteId: value })}
                  >
                    <SelectTrigger className="w-full">
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
                </div>
                <Button type="button" variant="outline" onClick={() => setClientDialogOpen(true)} className="h-10">
                  + Nuevo
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
              <Label htmlFor="localidad">Localidad *</Label>
              <Select
                value={formData.localidad ?? ""}
                onValueChange={(value) => {
                  setFormData({ ...formData, localidad: value, dependencia: "" })
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Seleccionar localidad" />
                </SelectTrigger>
                <SelectContent>
                  {localidades.map((loc) => (
                    <SelectItem key={loc} value={loc}>
                      {loc}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="dependencia">Dependencia *</Label>
              <Select
                value={formData.dependencia ?? ""}
                onValueChange={(value) => setFormData({ ...formData, dependencia: value })}
                disabled={!formData.localidad}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Primero selecciona localidad" />
                </SelectTrigger>
                <SelectContent>
                  {(dependenciasPorLocalidad[formData.localidad || ""] || []).map((dep) => (
                    <SelectItem key={dep} value={dep}>
                      {dep}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="tipoProceso">Tipo de Proceso</Label>
              <Select
                value={formData.tipoProceso ?? ""}
                onValueChange={(value) => setFormData({ ...formData, tipoProceso: value })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Seleccionar tipo" />
                </SelectTrigger>
                <SelectContent>
                  {tiposProceso.map((tp) => (
                    <SelectItem key={tp} value={tp}>
                      {tp}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="estado">Estado del Caso *</Label>
              <Select
                value={formData.estado ?? "Activo"}
                onValueChange={(value: "Activo" | "Inactivo") => setFormData({ ...formData, estado: value })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Activo">Activo</SelectItem>
                  <SelectItem value="Inactivo">Inactivo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="estadoPago">Estado de Pago *</Label>
              <Select
                value={formData.estadoPago ?? "Debe"}
                onValueChange={(value: "Pagado" | "Debe") => setFormData({ ...formData, estadoPago: value })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Pagado">Pagado</SelectItem>
                  <SelectItem value="Debe">Debe</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Resto del formulario */}
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

          <div>
            <Label htmlFor="homologacionSentencia">Homologación / Sentencia</Label>
            <Textarea
              id="homologacionSentencia"
              value={formData.homologacionSentencia ?? ""}
              onChange={(e) => setFormData({ ...formData, homologacionSentencia: e.target.value })}
              rows={4}
            />
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

          {/* Plazos múltiples */}
          <div className="space-y-4 pt-6 border-t">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold">Plazos del Caso</Label>
              <Button type="button" variant="outline" size="sm" onClick={addPlazo}>
                + Agregar Plazo
              </Button>
            </div>

            {(!formData.plazos || formData.plazos.length === 0) && (
              <p className="text-sm text-muted-foreground italic">No hay plazos agregados aún.</p>
            )}

            {formData.plazos?.map((plazo, index) => (
              <div key={plazo.id} className="rounded-lg border bg-card p-4 space-y-3">
                <div className="flex justify-between items-start">
                  <h4 className="font-medium">Plazo {index + 1}</h4>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={() => removePlazo(plazo.id)}
                  >
                    Eliminar
                  </Button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor={`plazo-nombre-${plazo.id}`}>Nombre *</Label>
                    <Input
                      id={`plazo-nombre-${plazo.id}`}
                      value={plazo.nombre}
                      onChange={(e) => updatePlazo(plazo.id, "nombre", e.target.value)}
                      placeholder="Ej: Presentación de demanda"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor={`plazo-fecha-${plazo.id}`}>Fecha *</Label>
                    <Input
                      id={`plazo-fecha-${plazo.id}`}
                      type="date"
                      value={plazo.fecha}
                      onChange={(e) => updatePlazo(plazo.id, "fecha", e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor={`plazo-desc-${plazo.id}`}>Descripción (opcional)</Label>
                  <Textarea
                    id={`plazo-desc-${plazo.id}`}
                    value={plazo.descripcion || ""}
                    onChange={(e) => updatePlazo(plazo.id, "descripcion", e.target.value)}
                    rows={2}
                    placeholder="Detalles adicionales"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Botones fijos */}
        <div className="flex flex-col sm:flex-row justify-end gap-3 pt-6 border-t -mx-6 px-6 pb-6 bg-background sticky bottom-0">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button type="submit" disabled={loading} className="bg-primary hover:bg-primary/90">
            {loading ? "Guardando..." : caseData ? "Actualizar Caso" : "Crear Caso"}
          </Button>
        </div>
      </form>
    )
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-full w-[95vw] sm:max-w-2xl md:max-w-4xl max-h-[95vh] flex flex-col p-0">
          <DialogHeader className="p-6 pb-4 border-b shrink-0">
            <DialogTitle className="text-2xl">
              {caseData ? "Editar Caso" : "Nuevo Caso"}
            </DialogTitle>
            <DialogDescription asChild>
              <p className="text-base text-muted-foreground">
                {caseData
                  ? "Modifica los datos del caso"
                  : step === "type"
                    ? "Primero selecciona el tipo de caso"
                    : "Completa toda la información requerida"}
              </p>
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto px-6">
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