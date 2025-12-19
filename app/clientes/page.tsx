"use client"

import { AppLayout } from "@/components/app-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
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
import { ClientDialog } from "@/components/client-dialog"
import { Plus, Search, Pencil, Trash2, Phone, Mail, IdCard, Calendar } from "lucide-react"
import { useEffect, useState } from "react"
import { collection, getDocs, deleteDoc, doc, orderBy, query } from "firebase/firestore"
import { db } from "@/lib/firebase"
import type { Client } from "@/lib/types"
import { useToast } from "@/hooks/use-toast"

export default function ClientesPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [filteredClients, setFilteredClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedClient, setSelectedClient] = useState<Client | undefined>()
  const [searchTerm, setSearchTerm] = useState("")
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null)
  const { toast } = useToast()

  const fetchClients = async () => {
    try {
      const clientsRef = collection(db, "clients")
      const q = query(clientsRef, orderBy("createdAt", "desc"))
      const querySnapshot = await getDocs(q)
      const clientsData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Client[]
      setClients(clientsData)
      setFilteredClients(clientsData)
    } catch (error) {
      console.error("[v0] Error fetching clients:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchClients()
  }, [])

  useEffect(() => {
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      const filtered = clients.filter(
        (client) =>
          client.nombre.toLowerCase().includes(term) ||
          client.email.toLowerCase().includes(term) ||
          client.dni_cuit.includes(term) ||
          client.telefono.includes(term)
      )
      setFilteredClients(filtered)
    } else {
      setFilteredClients(clients)
    }
  }, [searchTerm, clients])

  const handleEdit = (client: Client) => {
    setSelectedClient(client)
    setDialogOpen(true)
  }

  const handleDelete = async () => {
    if (!clientToDelete) return

    try {
      await deleteDoc(doc(db, "clients", clientToDelete.id))
      toast({ title: "Cliente eliminado", description: "El cliente se eliminó correctamente." })
      fetchClients()
    } catch (error) {
      console.error("[v0] Error deleting client:", error)
      toast({ title: "Error", description: "No se pudo eliminar el cliente.", variant: "destructive" })
    } finally {
      setDeleteDialogOpen(false)
      setClientToDelete(null)
    }
  }

  return (
    <AppLayout>
      <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-foreground">Clientes</h1>
            <p className="text-muted-foreground mt-1">Gestión completa de la base de clientes</p>
          </div>
          <Button
            onClick={() => {
              setSelectedClient(undefined)
              setDialogOpen(true)
            }}
            size="lg"
            className="bg-primary hover:bg-primary/90"
          >
            <Plus className="mr-2 h-5 w-5" />
            Nuevo Cliente
          </Button>
        </div>

        {/* Búsqueda */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Buscar Clientes</CardTitle>
            <CardDescription>{filteredClients.length} cliente{filteredClients.length !== 1 && "s"} encontrado{filteredClients.length !== 1 && "s"}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre, email, teléfono o DNI/CUIT..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-11 h-12 text-base"
              />
            </div>
          </CardContent>
        </Card>

        {/* Lista de clientes */}
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : filteredClients.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <p className="text-lg text-muted-foreground">
                {searchTerm ? "No se encontraron clientes con ese criterio" : "Aún no hay clientes registrados"}
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Vista móvil: Cards */}
            <div className="grid gap-4 md:hidden">
              {filteredClients.map((client) => (
                <Card key={client.id} className="overflow-hidden shadow-md hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <h3 className="font-bold text-lg">{client.nombre}</h3>
                    <p className="text-sm text-muted-foreground">DNI/CUIT: {client.dni_cuit}</p>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span>{client.telefono}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span className="truncate">{client.email}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>Alta: {client.fechaAlta || "-"}</span>
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-3 border-t">
                      <Button size="sm" variant="outline" onClick={() => handleEdit(client)}>
                        <Pencil className="h-4 w-4 mr-1" /> Editar
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => {
                          setClientToDelete(client)
                          setDeleteDialogOpen(true)
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Vista desktop: Tabla */}
            <div className="hidden md:block rounded-lg border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Teléfono</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>DNI/CUIT</TableHead>
                    <TableHead>Fecha de Alta</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredClients.map((client) => (
                    <TableRow key={client.id} className="hover:bg-muted/50">
                      <TableCell className="font-medium">{client.nombre}</TableCell>
                      <TableCell>{client.telefono}</TableCell>
                      <TableCell className="max-w-[200px] truncate">{client.email}</TableCell>
                      <TableCell className="font-mono text-sm">{client.dni_cuit}</TableCell>
                      <TableCell>{client.fechaAlta || "-"}</TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon" onClick={() => handleEdit(client)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setClientToDelete(client)
                              setDeleteDialogOpen(true)
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </>
        )}

        {/* Modales */}
        <ClientDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          client={selectedClient}
          onSuccess={fetchClients}
        />

        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Eliminar cliente?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta acción es permanente. El cliente <strong>{clientToDelete?.nombre}</strong> se eliminará para siempre.
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