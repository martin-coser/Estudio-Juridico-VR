"use client"; // Obligatorio para usar useEffect y el SDK de Pusher

import { useEffect } from "react";
import * as PusherPushNotifications from "@pusher/push-notifications-web";

export default function PusherBeamsInit() {
  useEffect(() => {
    // Esta lógica solo se ejecuta en el navegador
    const beamsClient = new PusherPushNotifications.Client({
      instanceId: '57304e07-5191-48ad-98ac-17abe9b14057',
    });

    beamsClient.start()
      .then(() => beamsClient.addDeviceInterest('hello'))
      .then(() => console.log('Successfully registered and subscribed!'))
      .catch(console.error);
  }, []);

  return null; // Este componente no renderiza nada visualmente
}