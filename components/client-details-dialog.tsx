"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import type { Client, Case, Deuda } from "@/lib/types"
import {
  User,
  Phone,
  Mail,
  IdCard,
  Calendar,
  DollarSign,
  FileText,
  CheckCircle2,
} from "lucide-react"

interface ClientDetailsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  client: Client
  clientCases: Case[]         // casos del cliente con estadoPago "Debe"
}

export function ClientDetailsDialog({
  open,
  onOpenChange,
  client,
  clientCases,
}: ClientDetailsDialogProps) {
  const deudasDirectas = client.deudas || []

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="border-b pb-6">
          <DialogTitle className="text-3xl font-bold flex items-center gap-3">
            <User className="h-8 w-8 text-primary" />
            Detalles del Cliente
          </DialogTitle>
        </DialogHeader>

        <div className="mt-6 space-y-8">
          {/* Datos básicos - ordenados y claros */}
          <div className="space-y-6">
            <div className="pb-4 border-b">
              <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                Información personal
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Nombre completo</p>
                    <p className="text-lg font-medium">{client.nombre}</p>
                  </div>

                  <div>
                    <p className="text-sm text-muted-foreground">DNI / CUIT</p>
                    <p className="font-medium font-mono">{client.dni_cuit}</p>
                  </div>

                  {client.telefono && (
                    <div>
                      <p className="text-sm text-muted-foreground">Teléfono</p>
                      <p className="font-medium">{client.telefono}</p>
                    </div>
                  )}

                  {client.email && (
                    <div>
                      <p className="text-sm text-muted-foreground">Email</p>
                      <p className="font-medium break-all">{client.email}</p>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Fecha de alta</p>
                    <p className="font-medium">{client.fechaAlta || "No registrada"}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Deudas directas del cliente */}
            <div>
              <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-amber-600" />
                Deudas directas registradas
              </h3>

              {deudasDirectas.length > 0 ? (
                <div className="space-y-3">
                  {deudasDirectas.map((deuda: Deuda) => (
                    <div
                      key={deuda.id}
                      className="flex items-center justify-between p-4 border rounded-lg bg-card"
                    >
                      <div className="flex-1">
                        <p className="font-medium">{deuda.concepto}</p>
                        <div className="text-sm text-muted-foreground mt-1 flex items-center gap-4">
                          <span>Fecha: {deuda.fecha}</span>
                          <span className="font-medium">${deuda.monto.toLocaleString("es-AR")}</span>
                        </div>
                      </div>
                      <div>
                        {deuda.pagado ? (
                          <span className="text-sm font-medium text-green-600 flex items-center gap-1">
                            <CheckCircle2 className="h-4 w-4" />
                            Pagada
                          </span>
                        ) : (
                          <span className="text-sm font-medium text-amber-600">Pendiente</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground italic">
                  No hay deudas directas registradas para este cliente
                </p>
              )}
            </div>

            <Separator />

            {/* Deudas asociadas a expedientes */}
            <div>
              <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Deudas asociadas a expedientes
              </h3>

              {clientCases.length > 0 ? (
                <div className="space-y-3">
                  {clientCases.map((c) => (
                    <div key={c.id} className="p-4 border rounded-lg bg-card">
                      <div className="flex justify-between items-start gap-4">
                        <div className="flex-1">
                          <p className="font-medium">{c.caratula || "Sin carátula"}</p>
                          <p className="text-sm text-muted-foreground mt-1">
                            Expediente: {c.expediente || "No asignado"}
                          </p>
                          {c.nombreCaso && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {c.nombreCaso}
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <span className="text-sm font-medium text-destructive">Debe</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground italic">
                  No tiene deudas asociadas a expedientes
                </p>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}