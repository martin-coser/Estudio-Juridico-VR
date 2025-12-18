"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Card, CardContent } from "@/components/ui/card"
import type { Case } from "@/lib/types"
import { Badge } from "@/components/ui/badge"

interface CaseDetailsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  caseData: Case
}

export function CaseDetailsDialog({ open, onOpenChange, caseData }: CaseDetailsDialogProps) {
  const isSRTorART = caseData.tipo === "SRT" || caseData.tipo === "ART"

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto bg-background border-border">
        {/* Encabezado con fondo verde sutil */}
        <DialogHeader className="border-b border-accent/20 pb-4">
          <DialogTitle className="text-foreground text-2xl font-bold">
            Detalles del Caso
          </DialogTitle>
          <DialogDescription className="text-muted-foreground flex items-center gap-3 mt-2">
            <Badge variant="outline" className="bg-accent/5 text-accent border-accent/30 px-3 py-1">
              {caseData.tipo}
            </Badge>
            <span>Cliente: {caseData.clienteNombre || "Sin cliente"}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Sección común */}
          <Card className="border-border shadow-sm">
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Expediente</p>
                  <p className="text-foreground">{caseData.expediente || "-"}</p>
                </div>
                
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Nombre</p>
                  <p className="text-foreground font-medium">{caseData.nombre || "-"}</p>
                </div>

                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Nombre del Caso</p>
                  <p className="text-foreground">{caseData.nombreCaso || "-"}</p>
                </div>

                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Tipo de Proceso</p>
                  <p className="text-foreground">{caseData.tipoProceso || "-"}</p>
                </div>

                <div className="col-span-2 space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Motivo</p>
                  <p className="text-foreground whitespace-pre-wrap">{caseData.motivo || "-"}</p>
                </div>

                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Dependencia</p>
                  <p className="text-foreground">{caseData.dependencia || "-"}</p>
                </div>

                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Teléfono</p>
                  <p className="text-foreground">{caseData.telefono || "-"}</p>
                </div>

                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Estado</p>
                  <Badge variant="secondary" className="mt-1">
                    {caseData.estado || "-"}
                  </Badge>
                </div>

                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Homologación/Sentencia</p>
                  <p className="text-foreground whitespace-pre-wrap">{caseData.homologacionSentencia || "-"}</p>
                </div>

                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Plazo</p>
                  <p className="text-foreground">{caseData.plazo || "-"}</p>
                </div>

                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Estado de Pago</p>
                  <Badge
                    variant={caseData.estadoPago === "Pagado" ? "default" : "destructive"}
                    className="mt-1"
                  >
                    {caseData.estadoPago || "-"}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Patología solo para SRT y ART */}
          {isSRTorART && (
            <Card className="bg-accent/5 border-accent/30">
              <CardContent className="pt-6">
                <p className="text-sm font-medium text-muted-foreground mb-2">Patología</p>
                <p className="text-foreground whitespace-pre-wrap">{caseData.patologia || "-"}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}