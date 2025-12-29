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
import { Checkbox } from "@/components/ui/checkbox"
import { Pencil, Trash2, Plus } from "lucide-react"
import { cn } from "@/lib/utils"
import { collection, addDoc, updateDoc, doc, getDocs, query, orderBy } from "firebase/firestore"
import { db } from "@/lib/firebase"
import type { Case, Client, Plazo, Oficio, Tarea } from "@/lib/types"
import { useToast } from "@/hooks/use-toast"
import { ClientDialog } from "./client-dialog"

// === FUNCIÓN AUXILIAR PARA FORMATEAR FECHAS SIN DESFASE ===
const formatLocalDate = (dateStr: string | undefined): string => {
  if (!dateStr) return ""
  // Forzar interpretación en zona local (evitar UTC)
  const [year, month, day] = dateStr.split("-").map(Number)
  return new Date(year, month - 1, day).toLocaleDateString("es-AR")
}

interface CaseDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  caseData?: Case
  onSuccess: () => void
}

const caseTypes = ["SRT", "ART", "FAMILIA", "LABORAL DESPIDOS", "DAÑOS Y PERJUICIOS", "OTRO"] as const

const localidades = ["Río Cuarto", "Villa María", "Alta Gracia"] as const

const tiposProceso = [
  "Ordinario",
  "Sumario",
  "Ejecutivo",
  "Sucesorio",
  "Concursal",
  "Medidas Cautelares",
  "Amparo",
  "Laboral",
  "Otro",
] as const

type EditingItemType = "plazo" | "oficio" | "tarea" | null

const itemArrayKey: Record<"plazo" | "oficio" | "tarea", keyof Case> = {
  plazo: "plazos",
  oficio: "oficios",
  tarea: "tareas",
}

export function CaseDialog({ open, onOpenChange, caseData, onSuccess }: CaseDialogProps) {
  const [loading, setLoading] = useState(false)
  const [clients, setClients] = useState<Client[]>([])
  const [clientDialogOpen, setClientDialogOpen] = useState(false)
  const [step, setStep] = useState<"type" | "form">(caseData ? "form" : "type")

  const [formData, setFormData] = useState<Partial<Case>>({})

  const [editingItemType, setEditingItemType] = useState<EditingItemType>(null)
  const [editingItem, setEditingItem] = useState<Plazo | Oficio | Tarea | null>(null)

  const { toast } = useToast()

  useEffect(() => {
    if (open) {
      fetchClients()
      if (caseData) {
        setStep("form")
        setFormData({
          tipo: caseData.tipo,
          caratula: caseData.caratula || "",
          clienteId: caseData.clienteId || "",
          patologia: caseData.patologia || "",
          expediente: caseData.expediente || "",
          nombreCaso: caseData.nombreCaso || "",
          tipoProceso: caseData.tipoProceso || "",
          descripcion: caseData.descripcion || "",
          localidad: caseData.localidad || "",
          estado: caseData.estado || "Activo",
          homologacionSentencia: caseData.homologacionSentencia || "",
          estadoPago: caseData.estadoPago || "Debe",
          plazos: caseData.plazos || [],
          oficios: caseData.oficios || [],
          tareas: caseData.tareas || [],
        })
      } else {
        setStep("type")
        setFormData({
          tipo: "SRT",
          caratula: "",
          clienteId: "",
          patologia: "",
          expediente: "",
          nombreCaso: "",
          tipoProceso: "",
          descripcion: "",
          localidad: "",
          estado: "Activo",
          homologacionSentencia: "",
          estadoPago: "Debe",
          plazos: [],
          oficios: [],
          tareas: [],
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
      setFormData({
        tipo: "SRT",
        caratula: "",
        clienteId: "",
        patologia: "",
        expediente: "",
        nombreCaso: "",
        tipoProceso: "",
        descripcion: "",
        localidad: "",
        estado: "Activo",
        homologacionSentencia: "",
        estadoPago: "Debe",
        plazos: [],
        oficios: [],
        tareas: [],
      })
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto">
        {caseTypes.map((type) => (
          <Button
            type="button"
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

  // === GESTIÓN DE ÍTEMS ===

  const openEditItem = (type: EditingItemType, item: Plazo | Oficio | Tarea | null = null) => {
    setEditingItemType(type)
    setEditingItem(item || {
      id: Date.now().toString(),
      ...(type === "plazo"
        ? { nombre: "", descripcion: "", fecha: "" }
        : { titulo: "", descripcion: "", fechaEntrega: "", entregado: false }),
    })
  }

  const closeEditItem = () => {
    setEditingItemType(null)
    setEditingItem(null)
  }

  const saveItem = () => {
    if (!editingItem || !editingItemType) return

    const arrayKey = itemArrayKey[editingItemType]

    if (editingItemType === "plazo") {
      const plazo = editingItem as Plazo
      setFormData((prev) => ({
        ...prev,
        [arrayKey]: (prev.plazos ?? []).some((p) => p.id === plazo.id)
          ? (prev.plazos ?? []).map((p) => (p.id === plazo.id ? plazo : p))
          : [...(prev.plazos ?? []), plazo],
      }))
    } else if (editingItemType === "oficio") {
      const oficio = editingItem as Oficio
      setFormData((prev) => ({
        ...prev,
        [arrayKey]: (prev.oficios ?? []).some((o) => o.id === oficio.id)
          ? (prev.oficios ?? []).map((o) => (o.id === oficio.id ? oficio : o))
          : [...(prev.oficios ?? []), oficio],
      }))
    } else if (editingItemType === "tarea") {
      const tarea = editingItem as Tarea
      setFormData((prev) => ({
        ...prev,
        [arrayKey]: (prev.tareas ?? []).some((t) => t.id === tarea.id)
          ? (prev.tareas ?? []).map((t) => (t.id === tarea.id ? tarea : t))
          : [...(prev.tareas ?? []), tarea],
      }))
    }

    closeEditItem()
  }

  const deleteItem = (type: "plazo" | "oficio" | "tarea", id: string) => {
    const arrayKey = itemArrayKey[type]
    setFormData((prev) => ({
      ...prev,
      [arrayKey]: (prev[arrayKey] as any[])?.filter((item: any) => item.id !== id) || [],
    }))
  }

  const toggleEntregado = (type: "oficio" | "tarea", id: string) => {
    const arrayKey = itemArrayKey[type]
    setFormData((prev) => ({
      ...prev,
      [arrayKey]: (prev[arrayKey] as any[])?.map((item: any) =>
        item.id === id ? { ...item, entregado: !item.entregado } : item
      ),
    }))
  }

  const renderForm = () => {
    const isSRTorART = formData.tipo === "SRT" || formData.tipo === "ART"

    return (
      <form onSubmit={handleSubmit} className="space-y-6 py-6">
        {/* Tipo seleccionado */}
        <div className="rounded-lg bg-accent/10 p-4 border border-accent/20">
          <p className="text-sm font-semibold text-accent">Tipo de Caso:</p>
          <p className="text-lg font-bold text-foreground">{formData.tipo}</p>
        </div>

        {/* Campos principales obligatorios */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <Label htmlFor="caratula">Carátula *</Label>
            <Input
              id="caratula"
              value={formData.caratula ?? ""}
              onChange={(e) => setFormData({ ...formData, caratula: e.target.value })}
              required
              placeholder="Ej: González c/ SRT"
            />
          </div>

          <div>
            <Label htmlFor="cliente">Cliente *</Label>
            <div className="grid grid-cols-4 gap-3 mt-1">
              <div className="col-span-3">
                <Select
                  value={formData.clienteId ?? ""}
                  onValueChange={(value) => setFormData({ ...formData, clienteId: value })}
                  required
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
            <Label htmlFor="expediente">Expediente *</Label>
            <Input
              id="expediente"
              value={formData.expediente ?? ""}
              onChange={(e) => setFormData({ ...formData, expediente: e.target.value })}
              required
              placeholder="Ej: 12345/2025"
            />
          </div>

          <div>
            <Label htmlFor="nombreCaso">Nombre Descriptivo *</Label>
            <Input
              id="nombreCaso"
              value={formData.nombreCaso ?? ""}
              onChange={(e) => setFormData({ ...formData, nombreCaso: e.target.value })}
              required
              placeholder="Ej: Accidente laboral - fractura"
            />
          </div>

          <div>
            <Label htmlFor="localidad">Localidad *</Label>
            <Select
              value={formData.localidad ?? ""}
              onValueChange={(value) => setFormData({ ...formData, localidad: value })}
              required
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
            <Label htmlFor="tipoProceso">Tipo de Proceso *</Label>
            <Select
              value={formData.tipoProceso ?? ""}
              onValueChange={(value) => setFormData({ ...formData, tipoProceso: value })}
              required
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Seleccionar tipo de proceso" />
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
              required
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
              required
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

        {/* Campos opcionales */}
        <div>
          <Label htmlFor="descripcion">Descripción</Label>
          <Textarea
            id="descripcion"
            value={formData.descripcion ?? ""}
            onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
            rows={3}
            placeholder="Descripción breve del caso"
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

        {/* === PLAZOS === */}
        <div className="space-y-4 pt-6 border-t">
          <div className="flex items-center justify-between">
            <Label className="text-base font-semibold">Plazos del Caso</Label>
            <Button type="button" variant="outline" size="sm" onClick={() => openEditItem("plazo")}>
              <Plus className="h-4 w-4 mr-1" /> Agregar Plazo
            </Button>
          </div>
          {(!formData.plazos || formData.plazos.length === 0) ? (
            <p className="text-sm text-muted-foreground italic">No hay plazos agregados aún.</p>
          ) : (
            <div className="space-y-3">
              {formData.plazos.map((plazo) => (
                <div key={plazo.id} className="flex items-center justify-between p-4 border rounded-lg bg-card">
                  <div className="flex-1">
                    <p className="font-medium">{plazo.nombre}</p>
                    <p className="text-sm text-muted-foreground">
                      {plazo.fecha ? formatLocalDate(plazo.fecha) : "Sin fecha"}
                      {plazo.descripcion && ` — ${plazo.descripcion.substring(0, 60)}${plazo.descripcion.length > 60 ? "..." : ""}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button type="button" size="icon" variant="ghost" onClick={() => openEditItem("plazo", plazo)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button type="button" size="icon" variant="ghost" onClick={() => deleteItem("plazo", plazo.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* === OFICIOS === */}
        <div className="space-y-4 pt-6 border-t">
          <div className="flex items-center justify-between">
            <Label className="text-base font-semibold">Oficios</Label>
            <Button type="button" variant="outline" size="sm" onClick={() => openEditItem("oficio")}>
              <Plus className="h-4 w-4 mr-1" /> Agregar Oficio
            </Button>
          </div>
          {(!formData.oficios || formData.oficios.length === 0) ? (
            <p className="text-sm text-muted-foreground italic">No hay oficios agregados aún.</p>
          ) : (
            <div className="space-y-3">
              {formData.oficios.map((oficio) => (
                <div key={oficio.id} className="flex items-center justify-between p-4 border rounded-lg bg-card">
                  <div className="flex-1 flex items-center gap-4">
                    <Checkbox
                      checked={oficio.entregado}
                      onCheckedChange={() => toggleEntregado("oficio", oficio.id)}
                    />
                    <div>
                      <p className={cn("font-medium", oficio.entregado && "line-through text-muted-foreground")}>
                        {oficio.titulo}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {oficio.fechaEntrega && `${formatLocalDate(oficio.fechaEntrega)} — `}
                        {oficio.entregado ? "Entregado" : "Pendiente"}
                        {oficio.descripcion && ` — ${oficio.descripcion.substring(0, 50)}${oficio.descripcion.length > 50 ? "..." : ""}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button type="button" size="icon" variant="ghost" onClick={() => openEditItem("oficio", oficio)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button type="button" size="icon" variant="ghost" onClick={() => deleteItem("oficio", oficio.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* === TAREAS === */}
        <div className="space-y-4 pt-6 border-t">
          <div className="flex items-center justify-between">
            <Label className="text-base font-semibold">Tareas</Label>
            <Button type="button" variant="outline" size="sm" onClick={() => openEditItem("tarea")}>
              <Plus className="h-4 w-4 mr-1" /> Agregar Tarea
            </Button>
          </div>
          {(!formData.tareas || formData.tareas.length === 0) ? (
            <p className="text-sm text-muted-foreground italic">No hay tareas agregadas aún.</p>
          ) : (
            <div className="space-y-3">
              {formData.tareas.map((tarea) => (
                <div key={tarea.id} className="flex items-center justify-between p-4 border rounded-lg bg-card">
                  <div className="flex-1 flex items-center gap-4">
                    <Checkbox
                      checked={tarea.entregado}
                      onCheckedChange={() => toggleEntregado("tarea", tarea.id)}
                    />
                    <div>
                      <p className={cn("font-medium", tarea.entregado && "line-through text-muted-foreground")}>
                        {tarea.titulo}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {tarea.fechaEntrega && `${formatLocalDate(tarea.fechaEntrega)} — `}
                        {tarea.entregado ? "Completada" : "Pendiente"}
                        {tarea.descripcion && ` — ${tarea.descripcion.substring(0, 50)}${tarea.descripcion.length > 50 ? "..." : ""}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button type="button" size="icon" variant="ghost" onClick={() => openEditItem("tarea", tarea)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button type="button" size="icon" variant="ghost" onClick={() => deleteItem("tarea", tarea.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Botones finales */}
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

  // === MODAL DE EDICIÓN DE ÍTEM ===
  const renderItemEditModal = () => {
    if (!editingItem || !editingItemType) return null

    const isNew = !(formData[itemArrayKey[editingItemType]] as any[])?.some((i: any) => i.id === editingItem.id)

    return (
      <Dialog open={!!editingItemType} onOpenChange={(open) => {if (!open) {closeEditItem()}}} modal={true}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {isNew ? "Agregar" : "Editar"} {editingItemType === "plazo" ? "Plazo" : editingItemType === "oficio" ? "Oficio" : "Tarea"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {editingItemType === "plazo" ? (
              <>
                <div>
                  <Label>Nombre *</Label>
                  <Input
                    value={(editingItem as Plazo).nombre}
                    onChange={(e) => setEditingItem({ ...editingItem, nombre: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label>Fecha *</Label>
                  <Input
                    type="date"
                    value={(editingItem as Plazo).fecha}
                    onChange={(e) => setEditingItem({ ...editingItem, fecha: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label>Descripción</Label>
                  <Textarea
                    value={(editingItem as Plazo).descripcion || ""}
                    onChange={(e) => setEditingItem({ ...editingItem, descripcion: e.target.value })}
                    rows={2}
                  />
                </div>
              </>
            ) : (
              <>
                <div>
                  <Label>Título *</Label>
                  <Input
                    value={(editingItem as Oficio | Tarea).titulo}
                    onChange={(e) => setEditingItem({ ...editingItem, titulo: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label>Fecha {editingItemType === "oficio" ? "de entrega" : "límite"} (opcional)</Label>
                  <Input
                    type="date"
                    value={(editingItem as Oficio | Tarea).fechaEntrega || ""}
                    onChange={(e) => setEditingItem({ ...editingItem, fechaEntrega: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Descripción</Label>
                  <Textarea
                    value={(editingItem as Oficio | Tarea).descripcion || ""}
                    onChange={(e) => setEditingItem({ ...editingItem, descripcion: e.target.value })}
                    rows={2}
                  />
                </div>
              </>
            )}
          </div>
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={closeEditItem}>Cancelar</Button>
            <Button type="button" onClick={(e) => {e.stopPropagation(); saveItem()}}>Guardar</Button>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange} modal={true}>
        <DialogContent className="max-w-full w-[95vw] sm:max-w-2xl md:max-w-5xl max-h-[95vh] flex flex-col p-0">
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

      {renderItemEditModal()}

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