// components/PusherBeamsInit.tsx
"use client";

import { useEffect, useState } from "react";

let beamsClient: any = null;

export default function PusherBeamsInit() {
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    // Verificar que estamos en navegador
    if (typeof window === "undefined") return;

    // Verificar soporte básico
    const supported =
      "serviceWorker" in navigator &&
      "Notification" in window &&
      location.protocol === "https:";

    setIsSupported(supported);

    if (!supported) {
      console.warn("Notificaciones push no soportadas en este entorno.");
      return;
    }

    // ✅ Importar la librería SOLO en el cliente y SOLO cuando se necesita
    import("@pusher/push-notifications-web")
      .then((PusherPushNotifications) => {
        beamsClient = new PusherPushNotifications.Client({
          instanceId: "57304e07-5191-48ad-98ac-17abe9b14057",
        });
      })
      .catch((err) => {
        console.error("Error al cargar Pusher SDK:", err);
      });
  }, []);

  // Esta función se llamará cuando el usuario haga clic en "Activar Notificaciones"
  (window as any).initPushNotifications = async () => {
    if (!beamsClient || !isSupported) return false;

    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        console.log("Permiso de notificaciones denegado.");
        return false;
      }

      await beamsClient.start();
      await beamsClient.addDeviceInterest("hello");
      console.log("✅ Notificaciones activadas correctamente.");
      return true;
    } catch (err) {
      console.error("❌ Error al activar notificaciones:", err);
      return false;
    }
  };

  return null;
}