// components/PusherBeamsInit.tsx
"use client";

import { useEffect } from "react";

export default function PusherBeamsInit() {
  useEffect(() => {
    // Solo ejecutar en el navegador
    if (typeof window === "undefined") return;

    // Cargar la librería SOLO en el cliente
    import("@pusher/push-notifications-web")
      .then((PusherPushNotifications) => {
        const beamsClient = new PusherPushNotifications.Client({
          instanceId: "57304e07-5191-48ad-98ac-17abe9b14057",
        });

        beamsClient
          .start()
          .then(() => beamsClient.addDeviceInterest("hello"))
          .then(() =>
            console.log("✅ Successfully registered and subscribed!")
          )
          .catch((err) => {
            console.error("❌ Error en Pusher Beams:", err);
            // No rompas la app; solo loguea
          });
      })
      .catch((err) => {
        console.error("❌ No se pudo cargar el SDK de Pusher:", err);
      });
  }, []);

  return null;
}