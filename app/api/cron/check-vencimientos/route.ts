import { NextResponse } from 'next/server';
import admin from 'firebase-admin';
import PushNotifications from "@pusher/push-notifications-server";

// Inicialización del Admin SDK
if (!admin.apps.length) {
  try {
    const rawJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
    
    if (!rawJson) {
      throw new Error("Variable FIREBASE_SERVICE_ACCOUNT_JSON no encontrada");
    }

    // Parseamos el JSON
    const serviceAccount = JSON.parse(rawJson);

    // IMPORTANTE: Corregimos los saltos de línea de la clave privada
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

const db = admin.firestore()

// 2. Cliente de Pusher Beams
const beamsClient = new PushNotifications({
  instanceId: process.env.PUSHER_INSTANCE_ID!,
  secretKey: process.env.PUSHER_SECRET_KEY!,
});

export async function GET() {
  try {
    const ahora = admin.firestore.Timestamp.now();
    const ahoraDate = ahora.toDate();
    const LIMITE_3_DIAS = 3 * 24 * 60 * 60 * 1000;
    const limiteTs = admin.firestore.Timestamp.fromDate(new Date(ahoraDate.getTime() + LIMITE_3_DIAS));

    let totalEnviadas = 0;

    // --- 1. PROCESAR CASES ---
    const casesSnapshot = await db.collection('cases').get();

    for (const caseDoc of casesSnapshot.docs) {
      const caso = caseDoc.data();
      const expediente = caso.expediente || 'S/N';

      // PLAZOS
      const plazos = caso.plazos || [];
      for (const plazo of plazos) {
        if (plazo.fecha) {
          const fVto = plazo.fecha as admin.firestore.Timestamp;
          if (fVto <= limiteTs && fVto >= ahora) {
            await beamsClient.publishToInterests(["hello"], {
              web: { notification: {
                title: '🔴 PLAZO PRÓXIMO',
                body: `${plazo.descripcion || 'Vencimiento'} - Exp: ${expediente}`,
                deep_link: `https://tu-app.vercel.app/cases/${caseDoc.id}`
              }}
            });
            totalEnviadas++;
          }
        }
      }

      // OFICIOS
      const oficios = caso.oficios || [];
      for (const oficio of oficios) {
        if (!oficio.completado) {
          await beamsClient.publishToInterests(["hello"], {
            web: { notification: {
              title: '📂 OFICIO PENDIENTE',
              body: `Exp: ${expediente}`
            }}
          });
          totalEnviadas++;
        }
      }

      // TAREAS
      const tareas = caso.tareas || [];
      for (const tarea of tareas) {
        if (!tarea.completado) {
          await beamsClient.publishToInterests(["hello"], {
            web: { notification: {
              title: '✅ TAREA PENDIENTE',
              body: `${tarea.descripcion || 'Tarea'} - Exp: ${expediente}`
            }}
          });
          totalEnviadas++;
        }
      }
    }

    // --- 2. PROCESAR EVENTOS ---
    const eventsSnapshot = await db.collection('events')
      .where('fecha', '<=', limiteTs)
      .where('fecha', '>=', ahora)
      .get();

    for (const eventDoc of eventsSnapshot.docs) {
      const evento = eventDoc.data();
      await beamsClient.publishToInterests(["hello"], {
        web: { notification: {
          title: '📅 EVENTO EN AGENDA',
          body: evento.titulo || 'Sin título'
        }}
      });
      totalEnviadas++;
    }

    return NextResponse.json({ success: true, enviadas: totalEnviadas });

  } catch (error: any) {
    console.error('Error detallado:', error);
    return NextResponse.json({ 
      error: 'Error en el servidor', 
      message: error.message 
    }, { status: 500 });
  }
}