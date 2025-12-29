"use client"

import { AppLayout } from "@/components/app-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { CaseDialog } from "@/components/case-dialog"
import { CaseDetailsDialog } from "@/components/case-details-dialog"
import { Plus, Search, Pencil, Trash2, Filter, Eye, Calendar, User, FileText, DollarSign, AlertCircle, AlertTriangle, FileText as FileIcon, CheckSquare } from "lucide-react"
import { useEffect, useState } from "react"
import { collection, getDocs, deleteDoc, doc, orderBy, query, updateDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import type { Case } from "@/lib/types"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

// === CÁLCULOS DE FECHA CORREGIDOS (sin desfase UTC) ===

// Hoy a las 00:00 (hora local)
const todayStart = new Date()
todayStart.setHours(0, 0, 0, 0)

// Hoy + 7 días a las 00:00
const sevenDaysFromNowStart = new Date(todayStart)
sevenDaysFromNowStart.setDate(todayStart.getDate() + 7)

// Convierte "YYYY-MM-DD" a Date en zona local (a las 00:00)
const parseDateAsLocal = (dateStr: string): Date => {
  const [y, m, d] = dateStr.split("-").map(Number)
  return new Date(y, m - 1, d)
}

// Formateo seguro para mostrar
const formatDate = (dateString: string | undefined): string => {
  if (!dateString) return "-"
  const [year, month, day] = dateString.split("-").map(Number)
  return new Date(year, month - 1, day).toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
}

// Próximo plazo futuro
const getNextUpcomingDeadline = (plazos: Case["plazos"] = []) => {
  if (!plazos || plazos.length === 0) return null
  const validPlazos = plazos
    .filter(p => p.fecha)
    .map(p => ({ ...p, dateObj: parseDateAsLocal(p.fecha!) }))
    .filter(p => p.dateObj >= todayStart)

  if (validPlazos.length === 0) return null

  validPlazos.sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime())
  return validPlazos[0]
}

// Plazos vencidos
const hasOverdueDeadline = (plazos: Case["plazos"] = []) => {
  return plazos.some(p => {
    if (!p.fecha) return false
    const plazoDate = parseDateAsLocal(p.fecha)
    return plazoDate < todayStart
  })
}

// Plazos próximos (7 días)
const hasDeadlineSoon = (plazos: Case["plazos"] = []) => {
  return plazos.some(p => {
    if (!p.fecha) return false
    const plazoDate = parseDateAsLocal(p.fecha)
    return plazoDate >= todayStart && plazoDate <= sevenDaysFromNowStart
  })
}

// Alerta general
const getCaseAlertStatus = (plazos: Case["plazos"] = []) => {
  if (hasOverdueDeadline(plazos)) return "overdue"
  if (hasDeadlineSoon(plazos)) return "soon"
  return null
}

// Oficios pendientes
const hasPendingOficio = (oficios: Case["oficios"] = []) => {
  return oficios.some(o => !o.entregado)
}

// Tareas pendientes
const hasPendingTarea = (tareas: Case["tareas"] = []) => {
  return tareas.some(t => !t.entregado)
}

export default function CasosPage() {
  const [cases, setCases] = useState<Case[]>([])
  const [filteredCases, setFilteredCases] = useState<Case[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedCase, setSelectedCase] = useState<Case | undefined>()
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [filters, setFilters] = useState({
    search: "",
    tipo: "all",
    estadoPago: "all",
  })
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [caseToDelete, setCaseToDelete] = useState<Case | null>(null)
  const { toast } = useToast()

  const fetchCases = async () => {
    try {
      const casesRef = collection(db, "cases")
      const q = query(casesRef, orderBy("createdAt", "desc"))
      const querySnapshot = await getDocs(q)
      const casesData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Case[]
      setCases(casesData)
      setFilteredCases(casesData)
    } catch (error) {
      console.error("[v0] Error fetching cases:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCases()
  }, [])

  useEffect(() => {
    let filtered = cases

    if (filters.search) {
      const term = filters.search.toLowerCase()
      filtered = filtered.filter(
        (c) =>
          c.caratula?.toLowerCase().includes(term) ||
          c.expediente?.toLowerCase().includes(term) ||
          c.clienteNombre?.toLowerCase().includes(term)
      )
    }

    if (filters.tipo !== "all") {
      filtered = filtered.filter((c) => c.tipo === filters.tipo)
    }

    if (filters.estadoPago !== "all") {
      filtered = filtered.filter((c) => c.estadoPago === filters.estadoPago)
    }

    setFilteredCases(filtered)
  }, [filters, cases])

  const handleEdit = (caseData: Case) => {
    setSelectedCase(caseData)
    setDialogOpen(true)
  }

  const handleDelete = async () => {
    if (!caseToDelete) return

    try {
      await deleteDoc(doc(db, "cases", caseToDelete.id))
      toast({ title: "Caso eliminado", description: "El caso se eliminó correctamente." })
      fetchCases()
    } catch (error) {
      console.error("[v0] Error deleting case:", error)
      toast({ title: "Error", description: "No se pudo eliminar el caso.", variant: "destructive" })
    } finally {
      setDeleteDialogOpen(false)
      setCaseToDelete(null)
    }
  }

  const handlePaymentStatusChange = async (caseId: string, newStatus: "Pagado" | "Debe") => {
    try {
      await updateDoc(doc(db, "cases", caseId), { estadoPago: newStatus })
      toast({ title: "Estado actualizado", description: "Estado de pago actualizado." })
      fetchCases()
    } catch (error) {
      toast({ title: "Error", description: "No se pudo actualizar.", variant: "destructive" })
    }
  }

  return (
    <AppLayout>
      <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-foreground">Casos</h1>
            <p className="text-muted-foreground mt-1">Gestión completa de casos jurídicos</p>
          </div>
          <Button
            onClick={() => {
              setSelectedCase(undefined)
              setDialogOpen(true)
            }}
            size="lg"
            className="bg-primary hover:bg-primary/90"
          >
            <Plus className="mr-2 h-5 w-5" />
            Nuevo Caso
          </Button>
        </div>

        {/* Filtros */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle>Filtros</CardTitle>
                <CardDescription>
                  {filteredCases.length} caso{filteredCases.length !== 1 && "s"} encontrado{filteredCases.length !== 1 && "s"}
                </CardDescription>
              </div>

              {/* Leyenda de íconos - solo visible en pantallas medianas y grandes */}
              <div className="hidden md:flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <span title="Plazos vencidos">
                    <AlertCircle className="h-4 w-4 text-destructive" />
                  </span>
                  <span>Plazo Vencido</span>
                </div>
                <div className="flex items-center gap-2">
                  <span title="Plazo próximo a vencer">
                    <AlertTriangle className="h-4 w-4 text-orange-500" />
                  </span>
                  <span>Plazo Próximo (7 días)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span title="Oficios pendientes">
                    <FileIcon className="h-4 w-4 text-orange-600" />
                  </span>
                  <span>Oficios pendientes</span>
                </div>
                <div className="flex items-center gap-2">
                  <span title="Tareas pendientes">
                    <CheckSquare className="h-4 w-4 text-blue-600" />
                  </span>
                  <span>Tareas pendientes</span>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-4">
              <div className="relative col-span-1 sm:col-span-2 lg:col-span-6">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por carátula, expediente o cliente..."
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  className="pl-10"
                />
              </div>

              <div className="lg:col-span-2">
                <Select value={filters.tipo} onValueChange={(value) => setFilters({ ...filters, tipo: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Tipo de caso" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los tipos</SelectItem>
                    <SelectItem value="SRT">SRT</SelectItem>
                    <SelectItem value="ART">ART</SelectItem>
                    <SelectItem value="FAMILIA">FAMILIA</SelectItem>
                    <SelectItem value="LABORAL DESPIDOS">LABORAL DESPIDOS</SelectItem>
                    <SelectItem value="DAÑOS Y PERJUICIOS">DAÑOS Y PERJUICIOS</SelectItem>
                    <SelectItem value="OTRO">OTRO</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="lg:col-span-2">
                <Select value={filters.estadoPago} onValueChange={(value) => setFilters({ ...filters, estadoPago: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Estado de pago" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="Pagado">Pagado</SelectItem>
                    <SelectItem value="Debe">Debe</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="lg:col-span-2 flex items-end">
                <Button
                  variant="outline"
                  onClick={() => setFilters({ search: "", tipo: "all", estadoPago: "all" })}
                  className="w-full"
                >
                  <Filter className="mr-2 h-4 w-4" />
                  Limpiar filtros
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Lista de casos */}
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : filteredCases.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <p className="text-lg text-muted-foreground">
                {Object.values(filters).some(f => f !== "" && f !== "all")
                  ? "No se encontraron casos con los filtros aplicados"
                  : "Aún no hay casos registrados"}
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Vista móvil: Cards */}
            <div className="grid gap-4 md:hidden">
              {filteredCases.map((caseData) => {
                const nextUpcoming = getNextUpcomingDeadline(caseData.plazos)
                const alertStatus = getCaseAlertStatus(caseData.plazos)
                const pendingOficio = hasPendingOficio(caseData.oficios)
                const pendingTarea = hasPendingTarea(caseData.tareas)

                return (
                  <Card key={caseData.id} className="overflow-hidden shadow-md hover:shadow-lg transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex flex-wrap items-center gap-2 mb-2">
                            <Badge variant="outline">{caseData.tipo}</Badge>
                            {alertStatus === "overdue" && (
                              <span title="Plazos vencidos">
                                <AlertCircle className="h-5 w-5 text-destructive" />
                              </span>
                            )}
                            {alertStatus === "soon" && (
                              <span title="Plazo próximo a vencer">
                                <AlertTriangle className="h-5 w-5 text-orange-500" />
                              </span>
                            )}
                            {pendingOficio && (
                              <span title="Oficios pendientes">
                                <FileIcon className="h-5 w-5 text-orange-600" />
                              </span>
                            )}
                            {pendingTarea && (
                              <span title="Tareas pendientes">
                                <CheckSquare className="h-5 w-5 text-blue-600" />
                              </span>
                            )}
                          </div>
                          <h3 className="font-bold text-lg">{caseData.caratula}</h3>
                          {caseData.expediente && <p className="text-sm text-muted-foreground">Exp: {caseData.expediente}</p>}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span className="truncate">{caseData.clienteNombre || "-"}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <span className="truncate">{caseData.estado || "-"}</span>
                        </div>
                        <div className="flex items-center gap-2 col-span-2">
                          <Calendar className={cn("h-4 w-4", alertStatus && "text-orange-500")} />
                          <div>
                            <p className="font-medium">
                              {nextUpcoming ? `${nextUpcoming.nombre}: ${formatDate(nextUpcoming.fecha)}` : "Sin plazos próximos"}
                            </p>
                            {caseData.plazos && caseData.plazos.length > 1 && nextUpcoming && (
                              <p className="text-xs text-muted-foreground">+{caseData.plazos.length - 1} más</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-muted-foreground" />
                          <Select
                            value={caseData.estadoPago}
                            onValueChange={(v: "Pagado" | "Debe") => handlePaymentStatusChange(caseData.id, v)}
                          >
                            <SelectTrigger className="h-8 text-sm">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Pagado">Pagado</SelectItem>
                              <SelectItem value="Debe">Debe</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="flex justify-end gap-2 pt-3 border-t">
                        <Button size="sm" variant="outline" onClick={() => { setSelectedCase(caseData); setDetailsOpen(true) }}>
                          <Eye className="h-4 w-4 mr-1" /> Ver
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleEdit(caseData)}>
                          <Pencil className="h-4 w-4 mr-1" /> Editar
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => {
                            setCaseToDelete(caseData)
                            setDeleteDialogOpen(true)
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>

            {/* Vista desktop: Tabla */}
            <div className="hidden md:block rounded-lg border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-32">Alertas</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Expediente</TableHead>
                    <TableHead>Carátula</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Próximo Plazo</TableHead>
                    <TableHead>Estado de Pago</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCases.map((caseData) => {
                    const nextUpcoming = getNextUpcomingDeadline(caseData.plazos)
                    const alertStatus = getCaseAlertStatus(caseData.plazos)
                    const pendingOficio = hasPendingOficio(caseData.oficios)
                    const pendingTarea = hasPendingTarea(caseData.tareas)

                    return (
                      <TableRow key={caseData.id} className="hover:bg-muted/50">
                        <TableCell>
                          <div className="flex items-center gap-1">
                            {alertStatus === "overdue" && (
                              <span title="Plazos vencidos">
                                <AlertCircle className="h-5 w-5 text-destructive" />
                              </span>
                            )}
                            {alertStatus === "soon" && (
                              <span title="Plazo próximo">
                                <AlertTriangle className="h-5 w-5 text-orange-500" />
                              </span>
                            )}
                            {pendingOficio && (
                              <span title="Oficios pendientes">
                                <FileIcon className="h-5 w-5 text-orange-600" />
                              </span>
                            )}
                            {pendingTarea && (
                              <span title="Tareas pendientes">
                                <CheckSquare className="h-5 w-5 text-blue-600" />
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{caseData.tipo}</Badge>
                        </TableCell>
                        <TableCell className="font-mono text-sm">{caseData.expediente || "-"}</TableCell>
                        <TableCell className="font-medium max-w-[250px] truncate">{caseData.caratula}</TableCell>
                        <TableCell>{caseData.clienteNombre || "-"}</TableCell>
                        <TableCell>{caseData.estado || "-"}</TableCell>
                        <TableCell>
                          {nextUpcoming ? (
                            <div className="space-y-1">
                              <p className="font-medium">{nextUpcoming.nombre}</p>
                              <p className={cn("text-sm", alertStatus === "soon" && "text-orange-500")}>
                                {formatDate(nextUpcoming.fecha)}
                                {caseData.plazos && caseData.plazos.length > 1 && ` (+${caseData.plazos.length - 1} más)`}
                              </p>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">Sin plazos próximos</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Select
                            value={caseData.estadoPago}
                            onValueChange={(v: "Pagado" | "Debe") => handlePaymentStatusChange(caseData.id, v)}
                          >
                            <SelectTrigger className="w-28">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Pagado">Pagado</SelectItem>
                              <SelectItem value="Debe">Debe</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="icon" onClick={() => { setSelectedCase(caseData); setDetailsOpen(true) }}>
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleEdit(caseData)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setCaseToDelete(caseData)
                                setDeleteDialogOpen(true)
                              }}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          </>
        )}

        {/* Modales */}
        {selectedCase && (
          <CaseDetailsDialog
            open={detailsOpen}
            onOpenChange={setDetailsOpen}
            caseData={selectedCase}
          />
        )}

        <CaseDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          caseData={selectedCase}
          onSuccess={fetchCases}
        />

        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Eliminar caso?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta acción es permanente. El caso <strong>{caseToDelete?.caratula}</strong> se eliminará para siempre.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
                Eliminar permanentemente
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AppLayout>
  )
}