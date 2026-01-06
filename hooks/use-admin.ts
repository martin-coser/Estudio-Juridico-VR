// hooks/use-admin.ts
import { useAuth } from "@/hooks/use-auth"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

// PEGA AQUÍ TU UID DE LA CONSOLA DE FIREBASE
const ADMIN_UID = "SWuK09UZJ5fJ6YSPtcNFDVRePbV2"; 

export function useAdmin() {
  const { user, loading } = useAuth()
  const [isAdmin, setIsAdmin] = useState(false)
  const router = useRouter()

  useEffect(() => {
    if (!loading) {
      if (user && user.uid === ADMIN_UID) {
        setIsAdmin(true)
      } else {
        // Si no es admin, lo mandamos al home o login
        router.push("/")
      }
    }
  }, [user, loading, router])

  return { isAdmin, loading: loading || (!isAdmin && user?.uid === ADMIN_UID) }
}