"use client"

import { useState } from "react"
import { AppLayout } from "@/components/app-layout"
import { auth } from "@/lib/firebase"
import { updatePassword, EmailAuthProvider, reauthenticateWithCredential } from "firebase/auth"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, ShieldCheck, Lock, AlertTriangle } from "lucide-react"

export default function AjustesSeguridadPage() {
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess("")

    if (newPassword.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.")
      return
    }

    if (newPassword !== confirmPassword) {
      setError("Las contraseñas no coinciden.")
      return
    }

    setLoading(true)
    const user = auth.currentUser

    if (user) {
      try {
        // En Firebase, cambiar la contraseña suele requerir un login reciente.
        // Si falla, el catch manejará el error de 'requires-recent-login'.
        await updatePassword(user, newPassword)
        setSuccess("Contraseña actualizada correctamente. Ahora puedes usarla para iniciar sesión.")
        setNewPassword("")
        setConfirmPassword("")
      } catch (err: any) {
        console.error(err)
        if (err.code === "auth/requires-recent-login") {
          setError("Por seguridad, debes haber iniciado sesión recientemente para cambiar la contraseña. Intenta cerrar sesión y volver a entrar.")
        } else {
          setError("Ocurrió un error al actualizar la contraseña.")
        }
      } finally {
        setLoading(false)
      }
    }
  }

  return (
    <AppLayout>
      <div className="mx-auto max-w-2xl px-4 py-10">
        <div className="mb-8 flex items-center gap-3">
          <div className="bg-primary/10 p-2 rounded-lg text-primary">
            <Lock className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Seguridad de la Cuenta</h1>
            <p className="text-muted-foreground text-sm">Gestiona el acceso y la protección de tu cuenta</p>
          </div>
        </div>

        <Card className="shadow-md">
          <CardHeader>
            <CardTitle>Establecer Contraseña</CardTitle>
            <CardDescription>
              Si entraste mediante un enlace de correo, aquí puedes crear una contraseña para entrar directamente la próxima vez.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpdatePassword} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              {success && (
                <Alert className="border-green-500/50 bg-green-500/10 text-green-600">
                  <ShieldCheck className="h-4 w-4" />
                  <AlertDescription>{success}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="newPassword">Nueva Contraseña</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar Contraseña</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repite tu contraseña"
                  required
                />
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Actualizando...
                  </>
                ) : (
                  "Guardar Contraseña"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="mt-8 p-4 bg-muted/50 rounded-lg border border-border">
          <p className="text-xs text-muted-foreground text-center">
            Nota: Al establecer una contraseña, podrás usar tanto el link de correo como tu email y contraseña para acceder al sistema.
          </p>
        </div>
      </div>
    </AppLayout>
  )
}