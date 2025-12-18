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
import { Plus, Search, Pencil, Trash2, Filter } from "lucide-react"
import { useEffect, useState } from "react"
import { collection, getDocs, deleteDoc, doc, orderBy, query, updateDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import type { Case } from "@/lib/types"
import { useToast } from "@/hooks/use-toast"

export default function CasosPage() {
  const [cases, setCases] = useState<Case[]>([])
  const [filteredCases, setFilteredCases] = useState<Case[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedCase, setSelectedCase] = useState<Case | undefined>()
  const [filters, setFilters] = useState({
    search: "",
    tipo: "all",
    estado: "all",
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

    // Filter by search term
    if (filters.search) {
      filtered = filtered.filter(
        (c) =>
          c.nombre.toLowerCase().includes(filters.search.toLowerCase()) ||
          c.expediente?.toLowerCase().includes(filters.search.toLowerCase()) ||
          c.clienteNombre?.toLowerCase().includes(filters.search.toLowerCase()),
      )
    }

    // Filter by type
    if (filters.tipo !== "all") {
      filtered = filtered.filter((c) => c.tipo === filters.tipo)
    }

    // Filter by estado
    if (filters.estado !== "all") {
      filtered = filtered.filter((c) => c.estado?.toLowerCase().includes(filters.estado.toLowerCase()))
    }

    // Filter by payment status
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
      toast({
        title: "Caso eliminado",
        description: "El caso ha sido eliminado correctamente.",
      })
      fetchCases()
    } catch (error) {
      console.error("[v0] Error deleting case:", error)
      toast({
        title: "Error",
        description: "No se pudo eliminar el caso.",
        variant: "destructive",
      })
    } finally {
      setDeleteDialogOpen(false)
      setCaseToDelete(null)
    }
  }

  const handlePaymentStatusChange = async (caseId: string, newStatus: "Pagado" | "Debe") => {
    try {
      const caseRef = doc(db, "cases", caseId)
      await updateDoc(caseRef, { estadoPago: newStatus })
      toast({
        title: "Estado actualizado",
        description: "El estado de pago ha sido actualizado.",
      })
      fetchCases()
    } catch (error) {
      console.error("[v0] Error updating payment status:", error)
      toast({
        title: "Error",
        description: "No se pudo actualizar el estado de pago.",
        variant: "destructive",
      })
    }
  }

  return (
    <AppLayout>
      <div className="space-y-6 max-w-[1400px]">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-foreground">Casos</h2>
            <p className="text-muted-foreground mt-1">Gestión completa de casos jurídicos</p>
          </div>
          <Button
            onClick={() => {
              setSelectedCase(undefined)
              setDialogOpen(true)
            }}
            className="bg-accent text-accent-foreground hover:bg-accent/90"
          >
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Caso
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Lista de Casos</CardTitle>
            <CardDescription>Total: {filteredCases.length} casos</CardDescription>

            {/* Filters */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mt-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nombre, expediente..."
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  className="pl-10"
                />
              </div>

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
                </SelectContent>
              </Select>

              <Select
                value={filters.estadoPago}
                onValueChange={(value) => setFilters({ ...filters, estadoPago: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Estado de pago" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="Pagado">Pagado</SelectItem>
                  <SelectItem value="Debe">Debe</SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                onClick={() => setFilters({ search: "", tipo: "all", estado: "all", estadoPago: "all" })}
                className="justify-start"
              >
                <Filter className="mr-2 h-4 w-4" />
                Limpiar Filtros
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-accent"></div>
              </div>
            ) : filteredCases.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {filters.search || filters.tipo !== "all" || filters.estadoPago !== "all"
                  ? "No se encontraron casos con los filtros aplicados"
                  : "No hay casos registrados"}
              </div>
            ) : (
              <div className="border rounded-lg overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Expediente</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Plazo</TableHead>
                      <TableHead>Estado de Pago</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCases.map((caseData) => (
                      <TableRow key={caseData.id}>
                        <TableCell>
                          <Badge variant="outline" className="font-mono text-xs">
                            {caseData.tipo}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">{caseData.nombre}</TableCell>
                        <TableCell>{caseData.clienteNombre || "-"}</TableCell>
                        <TableCell>{caseData.expediente || "-"}</TableCell>
                        <TableCell>{caseData.estado || "-"}</TableCell>
                        <TableCell>{caseData.plazo || "-"}</TableCell>
                        <TableCell>
                          <Select
                            value={caseData.estadoPago}
                            onValueChange={(value: "Pagado" | "Debe") => handlePaymentStatusChange(caseData.id, value)}
                          >
                            <SelectTrigger className="w-[110px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Pagado">Pagado</SelectItem>
                              <SelectItem value="Debe">Debe</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
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
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        <CaseDialog open={dialogOpen} onOpenChange={setDialogOpen} caseData={selectedCase} onSuccess={fetchCases} />

        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta acción no se puede deshacer. El caso {caseToDelete?.nombre} será eliminado permanentemente.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
                Eliminar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AppLayout>
  )
}
