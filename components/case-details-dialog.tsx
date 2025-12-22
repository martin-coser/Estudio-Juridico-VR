"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { Case } from "@/lib/types"

interface CaseDetailsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  caseData: Case
}

export function CaseDetailsDialog({ open, onOpenChange, caseData }: CaseDetailsDialogProps) {
  const isSRTorART = caseData.tipo === "SRT" || caseData.tipo === "ART"

  // Fecha actual para comparar vencimientos (21 de diciembre de 2025)
  const today = new Date("2025-12-21")
  const formatDate = (dateString: string) => {
    if (!dateString) return "Sin fecha"
    const date = new Date(dateString)
    return date.toLocaleDateString("es-AR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    })
  }

  const isOverdue = (fecha: string) => {
    if (!fecha) return false
    return new Date(fecha) < today
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="
          max-w-[95vw] 
          w-full 
          max-h-[85vh]
          overflow-y-auto 
          p-5 sm:p-7 lg:p-8
          bg-background 
          border-border
          rounded-xl
        "
      >
        {/* Header */}
        <DialogHeader className="pb-6">
          <DialogTitle className="text-2xl sm:text-3xl font-bold text-foreground">
            Detalles del Caso
          </DialogTitle>
          <DialogDescription asChild>
            <div className="mt-4 space-y-2">
              <Badge variant="secondary" className="text-base px-4 py-1.5">
                {caseData.tipo}
              </Badge>
              <p className="text-base text-foreground font-medium">
                Cliente: {caseData.clienteNombre || "Sin asignar"}
              </p>
            </div>
          </DialogDescription>
        </DialogHeader>

        {/* Contenido principal */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-8">
          <DetailItem label="Expediente" value={caseData.expediente} />
          <DetailItem label="Nombre del Caso" value={caseData.nombre} />

          <DetailItem label="Nombre Descriptivo" value={caseData.nombreCaso} />
          <DetailItem label="Tipo de Proceso" value={caseData.tipoProceso} />

          <DetailItem label="Dependencia" value={caseData.dependencia} />

          <DetailItem label="Estado">
            <Badge variant="secondary" className="text-sm px-3 py-1">
              {caseData.estado || "Sin especificar"}
            </Badge>
          </DetailItem>

          <DetailItem label="Estado de Pago">
            <Badge
              variant={caseData.estadoPago === "Pagado" ? "default" : "destructive"}
              className="text-sm px-3 py-1"
            >
              {caseData.estadoPago || "Pendiente"}
            </Badge>
          </DetailItem>

          <DetailItem label="Plazos" className="sm:col-span-2">
            {caseData.plazos && caseData.plazos.length > 0 ? (
              <div className="space-y-4">
                {caseData.plazos.map((plazo, index) => (
                  <div
                    key={plazo.id}
                    className="rounded-lg border border-border bg-muted/30 p-4"
                  >
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
                      <div className="flex-1">
                        <p className="text-sm font-semibold">
                          {plazo.nombre || `Plazo ${index + 1}`}
                        </p>
                        {plazo.descripcion && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {plazo.descripcion}
                          </p>
                        )}
                      </div>
                      <span
                        className={cn(
                          "font-bold text-md whitespace-nowrap",
                          isOverdue(plazo.fecha)
                            ? "text-destructive"
                            : "text-foreground"
                        )}
                      >
                        {formatDate(plazo.fecha)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground italic">Sin plazos definidos</p>
            )}
          </DetailItem>

          {/* Motivo del Caso */}
          <DetailItem
            label="Motivo del Caso"
            value={caseData.motivo}
            multiline
            className="sm:col-span-2"
          />

          {/* Homologación / Sentencia */}
          <DetailItem
            label="Homologación / Sentencia"
            value={caseData.homologacionSentencia}
            multiline
            className="sm:col-span-2"
          />

          {/* Patología - solo SRT/ART */}
          {isSRTorART && (
            <DetailItem
              label="Patología"
              value={caseData.patologia}
              multiline
              className="sm:col-span-2"
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

/* DetailItem (sin cambios) */
function DetailItem({
  label,
  value,
  children,
  bold = false,
  large = false,
  highlight = false,
  multiline = false,
  className = "",
}: {
  label: string
  value?: string
  children?: React.ReactNode
  bold?: boolean
  large?: boolean
  highlight?: boolean
  multiline?: boolean
  className?: string
}) {
  return (
    <div className={cn("space-y-2", className)}>
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
      {children ? (
        children
      ) : (
        <p
          className={cn(
            "text-foreground leading-relaxed",
            bold && "font-bold",
            large && "text-xl sm:text-2xl",
            highlight && "font-semibold text-lg",
            multiline && "whitespace-pre-wrap break-words",
            !value && "text-muted-foreground italic"
          )}
        >
          {value || "No especificado"}
        </p>
      )}
    </div>
  )
}