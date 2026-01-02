import { initializeApp, getApps } from "firebase/app"
import { getAuth, setPersistence, browserSessionPersistence } from "firebase/auth"
import { getFirestore } from "firebase/firestore"

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]

// Configuramos la persistencia a "sesión" → se cierra al cerrar la ventana/app
setPersistence(getAuth(app), browserSessionPersistence)
  .then(() => {
    console.log("[Firebase] Persistencia configurada a: browserSessionPersistence (cierra sesión al cerrar la app)")
  })
  .catch((error) => {
    console.error("[Firebase] Error al configurar persistencia:", error)
  })

const auth = getAuth(app)
const db = getFirestore(app)

export { app, auth, db }