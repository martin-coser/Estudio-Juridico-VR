import { NextResponse } from 'next/server';
import admin from 'firebase-admin';
import PushNotifications from "@pusher/push-notifications-server";

// 1. Inicialización del Admin SDK
if (!admin.apps.length) {
  try {
    const rawJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
    
    if (!rawJson) {
      throw new Error("Variable FIREBASE_SERVICE_ACCOUNT_JSON no encontrada");
    }

    const serviceAccount = JSON.parse(rawJson);

    if (serviceAccount.private_key) {
      serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
    }

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    
    console.log("✅ Firebase Admin inicializado");
  } catch (error: any) {
    console.error("❌ Error en Firebase Admin:", error.message);
  }
}

const db = admin.firestore();

// 2. Cliente de Pusher Beams
const beamsClient = new PushNotifications({
  instanceId: process.env.PUSHER_INSTANCE_ID!,
  secretKey: process.env.PUSHER_SECRET_KEY!,
});

export async function GET() {
  try {
    const ahoraDate = new Date();
    const LIMITE_3_DIAS_MS = 3 * 24 * 60 * 60 * 1000;
    const tiempoAhora = ahoraDate.getTime();
    const tiempoLimite = tiempoAhora + LIMITE_3_DIAS_MS;

    let totalEnviadas = 0;

    // --- 1. PROCESAR CASES (PLAZOS, OFICIOS, TAREAS) ---
    const casesSnapshot = await db.collection('cases').get();

    for (const caseDoc of casesSnapshot.docs) {
      const caso = caseDoc.data();
      const expediente = caso.expediente || 'S/N';

      // PLAZOS: Se envían si están en fecha
      const plazos = caso.plazos || [];
      for (const plazo of plazos) {
        if (plazo.fecha) {
          const fechaPlazo = new Date(plazo.fecha);
          if (fechaPlazo.getTime() <= tiempoLimite && fechaPlazo.getTime() >= (tiempoAhora - 86400000)) {
            await beamsClient.publishToInterests(["hello"], {
              web: { notification: {
                title: '🔴 PLAZO PRÓXIMO',
                body: `${plazo.nombre || 'Vencimiento'} (Fecha: ${plazo.fecha}) - Exp: ${expediente}`,
              }}
            });
            totalEnviadas++;
          }
        }
      }

      // OFICIOS: Se envían todos los NO completados
      const oficios = caso.oficios || [];
      for (const oficio of oficios) {
        if (!oficio.completado) { // Detecta false, null o undefined
          await beamsClient.publishToInterests(["hello"], {
            web: { notification: {
              title: '📂 OFICIO PENDIENTE',
              body: `Exp: ${expediente}`,
            }}
          });
          totalEnviadas++;
        }
      }

      // TAREAS: Se envían todas las NO completadas
      const tareas = caso.tareas || [];
      for (const tarea of tareas) {
        if (!tarea.completado) { // Detecta false, null o undefined
          await beamsClient.publishToInterests(["hello"], {
            web: { notification: {
              title: '✅ TAREA PENDIENTE',
              body: `${tarea.descripcion || 'Tarea'} - Exp: ${expediente}`,
            }}
          });
          totalEnviadas++;
        }
      }
    }

    // --- 2. PROCESAR EVENTOS (AGENDA) ---
    const eventsSnapshot = await db.collection('events').get();
    for (const eventDoc of eventsSnapshot.docs) {
      const evento = eventDoc.data();
      if (evento.fecha) {
        const fechaEv = new Date(evento.fecha);
        if (fechaEv.getTime() <= tiempoLimite && fechaEv.getTime() >= (tiempoAhora - 86400000)) {
          await beamsClient.publishToInterests(["hello"], {
            web: { notification: {
              title: '📅 EVENTO EN AGENDA',
              body: `${evento.titulo || 'Sin título'} (Fecha: ${evento.fecha})`,
            }}
          });
          totalEnviadas++;
        }
      }
    }

    return NextResponse.json({ success: true, enviadas: totalEnviadas });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}