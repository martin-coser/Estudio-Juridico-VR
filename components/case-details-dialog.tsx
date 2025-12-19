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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="
          max-w-[95vw] 
          w-full 
          max-h-[85vh]           /* Deja buen margen arriba y abajo */
          overflow-y-auto 
          p-5 sm:p-7 lg:p-8       /* Padding generoso en móvil */
          bg-background 
          border-border
          rounded-xl
        "
      >
        {/* Header espacioso */}
        <DialogHeader className="pb-6">
          <DialogTitle className="text-2xl sm:text-3xl font-bold text-foreground">
            Detalles del Caso
          </DialogTitle>
          <DialogDescription className="mt-4 space-y-2">
            <Badge variant="secondary" className="text-base px-4 py-1.5">
              {caseData.tipo}
            </Badge>
            <p className="text-base text-foreground font-medium">
              Cliente: {caseData.clienteNombre || "Sin asignar"}
            </p>
          </DialogDescription>
        </DialogHeader>

        {/* Todo el contenido en un solo flujo continuo */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-8">  {/* Más espacio vertical entre filas */}
          <DetailItem label="Expediente" value={caseData.expediente} highlight />
          <DetailItem label="Nombre del Caso" value={caseData.nombre} bold large />

          <DetailItem label="Nombre Descriptivo" value={caseData.nombreCaso} />
          <DetailItem label="Tipo de Proceso" value={caseData.tipoProceso} />

          <DetailItem label="Dependencia" value={caseData.dependencia} />
          <DetailItem label="Teléfono" value={caseData.telefono} />

          <DetailItem label="Estado">
            <Badge variant="secondary" className="text-sm px-3 py-1">
              {caseData.estado || "Sin especificar"}
            </Badge>
          </DetailItem>

          <DetailItem label="Plazo">
            <span className={cn("font-semibold text-lg", caseData.plazo ? "text-foreground" : "text-muted-foreground")}>
              {caseData.plazo || "Sin fecha"}
            </span>
          </DetailItem>

          <DetailItem label="Estado de Pago">
            <Badge 
              variant={caseData.estadoPago === "Pagado" ? "default" : "destructive"}
              className="text-sm px-3 py-1"
            >
              {caseData.estadoPago || "Pendiente"}
            </Badge>
          </DetailItem>

          {/* Motivo del Caso - integrado sin fondo especial */}
          <DetailItem 
            label="Motivo del Caso" 
            value={caseData.motivo} 
            multiline 
            className="sm:col-span-2"  /* Ocupa toda la fila en desktop */
          />

          {/* Homologación / Sentencia - integrado sin fondo */}
          <DetailItem 
            label="Homologación / Sentencia" 
            value={caseData.homologacionSentencia} 
            multiline 
            className="sm:col-span-2"
          />

          {/* Patología - solo si existe y es SRT/ART, integrado sin fondo especial */}
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

/* DetailItem limpio y con más espacio */
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
        <p className={cn(
          "text-foreground leading-relaxed",
          bold && "font-bold",
          large && "text-xl sm:text-2xl",
          highlight && "font-semibold text-lg",
          multiline && "whitespace-pre-wrap break-words",
          !value && "text-muted-foreground italic"
        )}>
          {value || "No especificado"}
        </p>
      )}
    </div>
  )
}