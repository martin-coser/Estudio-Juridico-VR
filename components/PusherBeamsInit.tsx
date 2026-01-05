"use client";

import { useEffect } from "react";
import * as PusherPushNotifications from "@pusher/push-notifications-web";

export default function PusherBeamsInit() {
  useEffect(() => {
    // 1. Verificamos si estamos en el navegador
    if (typeof window !== "undefined") {
      const beamsClient = new PusherPushNotifications.Client({
        instanceId: '57304e07-5191-48ad-98ac-17abe9b14057', // Asegúrate que sea el ID del nuevo proyecto si lo creaste
      });

      beamsClient.start()
        .then(() => beamsClient.addDeviceInterest('hello'))
        .then(() => {
          console.log('Successfully registered and subscribed!');
          // EL ALERT DE ÉXITO:
          alert("✅ Suscripción exitosa al canal 'hello'");
        })
        .catch((error) => {
          console.error("Error en Pusher Beams:", error);
          // EL ALERT DE ERROR: (Nos dirá si es falta de permisos o ID incorrecto)
          alert("❌ Error de registro: " + error.message);
        });
    }
  }, []);

  return null;
}