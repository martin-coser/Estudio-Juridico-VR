"use client"

import { AppLayout } from "@/components/app-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Download, Database, FileSpreadsheet, Loader, Briefcase, Users, CheckCircle2 } from "lucide-react"
import { useState } from "react"
import { downloadCasesBackup, downloadClientsBackup, downloadFullBackup } from "@/lib/export-utils"
import { useToast } from "@/hooks/use-toast"

export default function BackupPage() {
  const [loading, setLoading] = useState(false)
  const [downloadType, setDownloadType] = useState<"full" | "cases" | "clients" | null>(null)
  const { toast } = useToast()

  const handleDownload = async (type: "full" | "cases" | "clients") => {
    setDownloadType(type)
    setLoading(true)

    try {
      let result
      let message = ""

      switch (type) {
        case "full":
          result = await downloadFullBackup()
          message = `✅ Backup completo generado exitosamente:\n\n📁 ${result.casesFile}\n📁 ${result.clientsFile}\n\n📊 ${result.casesCount} casos\n👥 ${result.clientsCount} clientes`
          break
        case "cases":
          result = await downloadCasesBackup()
          message = `✅ Backup de casos generado:\n\n📁 ${result.fileName}\n\n📊 ${result.count} casos con todos sus plazos, oficios y tareas`
          break
        case "clients":
          result = await downloadClientsBackup()
          message = `✅ Backup de clientes generado:\n\n📁 ${result.fileName}\n\n👥 ${result.count} clientes con todas sus deudas`
          break
      }

      toast({
        title: "✅ Backup generado",
        description: `Archivos descargados correctamente`,
      })

    } catch (error) {
      console.error("Error al generar backup:", error)
      toast({
        title: "❌ Error",
        description: "No se pudo generar el backup. Intenta nuevamente.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
      setDownloadType(null)
    }
  }

  return (
    <AppLayout>
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Encabezado */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
            Backup del Sistema
          </h1>
          <p className="mt-2 text-muted-foreground">
            Descarga toda la información del estudio jurídico en formato Excel
          </p>
        </div>

        {/* Opciones de descarga */}
        <div className="grid gap-6 md:grid-cols-3 mb-8">
          
          {/* Backup Completo */}
          <Card className="border-2 border-blue-500/20 hover:border-blue-500/40 transition-all">
            <CardHeader className="text-center pb-4">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-blue-500/10">
                <Database className="h-6 w-6 text-blue-500" />
              </div>
              <CardTitle className="text-xl">Backup Completo</CardTitle>
              <CardDescription className="mt-1">
                Descargar todo el sistema
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-2 text-sm text-muted-foreground">
                <CheckCircle2 className="h-4 w-4 mt-0.5 text-blue-500 flex-shrink-0" />
                <span>Casos + Clientes</span>
              </div>
              <div className="flex items-start gap-2 text-sm text-muted-foreground">
                <CheckCircle2 className="h-4 w-4 mt-0.5 text-blue-500 flex-shrink-0" />
                <span>Todas las hojas</span>
              </div>
              <div className="flex items-start gap-2 text-sm text-muted-foreground">
                <CheckCircle2 className="h-4 w-4 mt-0.5 text-blue-500 flex-shrink-0" />
                <span>Recomendado</span>
              </div>
              <Button 
                size="lg" 
                className="w-full gap-2 bg-blue-500 hover:bg-blue-600"
                onClick={() => handleDownload("full")}
                disabled={loading}
              >
                {loading && downloadType === "full" ? (
                  <>
                    <Loader className="h-5 w-5 animate-spin" />
                    Generando...
                  </>
                ) : (
                  <>
                    <Download className="h-5 w-5" />
                    Descargar Todo
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Solo Casos */}
          <Card className="border-2 border-amber-500/20 hover:border-amber-500/40 transition-all">
            <CardHeader className="text-center pb-4">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/10">
                <Briefcase className="h-6 w-6 text-amber-500" />
              </div>
              <CardTitle className="text-xl">Solo Casos</CardTitle>
              <CardDescription className="mt-1">
                Casos jurídicos completos
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-2 text-sm text-muted-foreground">
                <CheckCircle2 className="h-4 w-4 mt-0.5 text-amber-500 flex-shrink-0" />
                <span>4 hojas: Casos, Plazos, Oficios, Tareas</span>
              </div>
              <div className="flex items-start gap-2 text-sm text-muted-foreground">
                <CheckCircle2 className="h-4 w-4 mt-0.5 text-amber-500 flex-shrink-0" />
                <span>Toda la información de seguimiento</span>
              </div>
              <Button 
                size="lg" 
                variant="outline"
                className="w-full gap-2 border-amber-500 text-amber-500 hover:bg-amber-500 hover:text-white"
                onClick={() => handleDownload("cases")}
                disabled={loading}
              >
                {loading && downloadType === "cases" ? (
                  <>
                    <Loader className="h-5 w-5 animate-spin" />
                    Generando...
                  </>
                ) : (
                  <>
                    <FileSpreadsheet className="h-5 w-5" />
                    Descargar Casos
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Solo Clientes */}
          <Card className="border-2 border-green-500/20 hover:border-green-500/40 transition-all">
            <CardHeader className="text-center pb-4">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-green-500/10">
                <Users className="h-6 w-6 text-green-500" />
              </div>
              <CardTitle className="text-xl">Solo Clientes</CardTitle>
              <CardDescription className="mt-1">
                Clientes y sus deudas
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-2 text-sm text-muted-foreground">
                <CheckCircle2 className="h-4 w-4 mt-0.5 text-green-500 flex-shrink-0" />
                <span>2 hojas: Clientes, Deudas</span>
              </div>
              <div className="flex items-start gap-2 text-sm text-muted-foreground">
                <CheckCircle2 className="h-4 w-4 mt-0.5 text-green-500 flex-shrink-0" />
                <span>Historial completo de pagos</span>
              </div>
              <Button 
                size="lg" 
                variant="outline"
                className="w-full gap-2 border-green-500 text-green-500 hover:bg-green-500 hover:text-white"
                onClick={() => handleDownload("clients")}
                disabled={loading}
              >
                {loading && downloadType === "clients" ? (
                  <>
                    <Loader className="h-5 w-5 animate-spin" />
                    Generando...
                  </>
                ) : (
                  <>
                    <FileSpreadsheet className="h-5 w-5" />
                    Descargar Clientes
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

        </div>

        {/* Información adicional */}
        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5 text-blue-500" />
                Formato de los archivos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2 text-sm text-muted-foreground">
                <p><span className="font-medium text-foreground">📁 Nombre del archivo:</span> BACKUP - DD-MM-YYYY - [CASOS/CLIENTES].xlsx</p>
                <p><span className="font-medium text-foreground">📊 Hojas incluidas:</span></p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li><span className="font-medium">Casos:</span> Casos, Plazos, Oficios, Tareas</li>
                  <li><span className="font-medium">Clientes:</span> Clientes, Deudas</li>
                </ul>
                <p><span className="font-medium text-foreground">🔒 Compatibilidad:</span> Excel, Google Sheets, LibreOffice Calc</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Database className="h-5 w-5 text-amber-500" />
                Información incluida
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <div className="space-y-2">
                  <h4 className="font-medium flex items-center gap-2">
                    <Briefcase className="h-4 w-4 text-amber-500" />
                    Casos Jurídicos
                  </h4>
                  <ul className="space-y-1 text-muted-foreground">
                    <li>• Carátula, expediente, tipo de caso</li>
                    <li>• Cliente asociado y datos del caso</li>
                    <li>• Patología (para SRT/ART)</li>
                    <li>• Estado y tipo de proceso</li>
                    <li>• Homologación/sentencia</li>
                    <li>• Plazos con fechas y estado</li>
                    <li>• Oficios y tareas pendientes</li>
                  </ul>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium flex items-center gap-2">
                    <Users className="h-4 w-4 text-green-500" />
                    Clientes
                  </h4>
                  <ul className="space-y-1 text-muted-foreground">
                    <li>• Nombre completo y contacto</li>
                    <li>• Teléfono, email, DNI/CUIT</li>
                    <li>• Fecha de alta</li>
                    <li>• Deudas con montos</li>
                    <li>• Estado de pago (pagado/pendiente)</li>
                    <li>• Fechas de registro</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-destructive/20 bg-destructive/5">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2 text-destructive">
                <span>⚠️</span>
                Importante
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <p className="text-muted-foreground">
                <span className="font-medium">🔒 Seguridad:</span> Los archivos contienen información sensible y confidencial. Guárdelos en un lugar seguro y no los comparta públicamente.
              </p>
              <p className="text-muted-foreground">
                <span className="font-medium">💾 Almacenamiento:</span> Realice backups periódicos y guárdelos en diferentes ubicaciones (nube, disco externo, etc.).
              </p>
              <p className="text-muted-foreground">
                <span className="font-medium">🔄 Restauración:</span> Para restaurar datos, debe importar manualmente la información desde los archivos Excel a Firebase.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  )
}