import { NextResponse } from 'next/server';
import admin from 'firebase-admin';
import OneSignal from 'onesignal-node';

// ────────────────────────────────────────────────
// Inicialización de Firebase Admin (solo una vez)
// ────────────────────────────────────────────────
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert(
        JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON!)
      ),
    });
  } catch (error) {
    console.error('Error inicializando Firebase Admin:', error);
  }
}

const db = admin.firestore();

// ────────────────────────────────────────────────
// Cliente de OneSignal
// ────────────────────────────────────────────────
const oneSignalClient = new OneSignal.Client(
  process.env.ONESIGNAL_APP_ID!,
  process.env.ONESIGNAL_REST_API_KEY!
);

// ────────────────────────────────────────────────
// Función auxiliar para enviar push
// ────────────────────────────────────────────────
async function enviarPush(
  userIds: string[],
  title: string,
  message: string,
  data: Record<string, any> = {},
  priority: 'alta' | 'normal' = 'normal'
) {
  if (!userIds || userIds.length === 0) return false;

  const notification = {
    contents: { es: message },
    headings: { es: title },
    include_external_user_ids: userIds,
    data,
    ios_badgeType: 'SetTo',
    ios_badgeCount: 1,
    android_priority: priority === 'alta' ? 'high' : 'normal',
  };

  try {
    await oneSignalClient.createNotification(notification);
    console.log(`Notificación enviada → ${title}`);
    return true;
  } catch (err) {
    console.error('Error enviando push:', err);
    return false;
  }
}

// ────────────────────────────────────────────────
// Handler principal (GET para cron)
// ────────────────────────────────────────────────
export async function GET() {
  try {
    const ahora = admin.firestore.Timestamp.now();
    const ahoraDate = ahora.toDate();

    // Rangos de anticipación (solo para plazos y agenda)
    const LIMITE_PLAZOS_AGENDA = 3 * 24 * 60 * 60 * 1000; // 3 días
    const limitePlazosAgenda = new Date(ahoraDate.getTime() + LIMITE_PLAZOS_AGENDA);
    const limitePlazosTs = admin.firestore.Timestamp.fromDate(limitePlazosAgenda);

    let enviadas = 0;

    // ────────────────────────────────────────────────
    // 1. Procesar CASES (plazos, tareas, oficios)
    // ────────────────────────────────────────────────
    const casesSnapshot = await db.collection('cases').get();

    for (const caseDoc of casesSnapshot.docs) {
      const caso = caseDoc.data();
      const responsables: string[] = caso.responsables || caso.abogados || caso.userIds || [];
      const expediente = caso.expediente || caso.numero || 'S/N';

      // ─── Plazos ─ alta prioridad ─ solo si próximo o hoy ───
      const plazos = caso.plazos || [];
      for (const plazo of plazos) {
        if (!plazo.fechaVencimiento || plazo.notificado) continue;

        const fechaVto = plazo.fechaVencimiento as admin.firestore.Timestamp;
        if (fechaVto <= limitePlazosTs) {
          const vtoDate = fechaVto.toDate();
          const esHoy = vtoDate.toDateString() === ahoraDate.toDateString();

          const titulo = esHoy ? '🔴 ¡PLAZO VENCE HOY! 🔴' : '⚠️ Plazo próximo a vencer ⚠️';
          const mensaje = `Plazo próximo a vencer: ${plazo.descripcion || 'Sin descripción'} (Exp: ${expediente})`;

          const enviada = await enviarPush(
            responsables,
            titulo,
            mensaje,
            { caseId: caseDoc.id, tipo: 'plazo', itemId: plazo.id || '' },
            'alta'
          );

          if (enviada) {
            // Marcar (ajusta según tu estructura real)
            await caseDoc.ref.update({
              plazos: admin.firestore.FieldValue.arrayUnion({
                ...plazo,
                notificado: true,
                notificadoEn: ahora,
              })
            });
            enviadas++;
          }
        }
      }

      // ─── Oficios ─ normal ─ SIEMPRE si pendiente ───
      const oficios = caso.oficios || [];
      for (const oficio of oficios) {
        if (oficio.notificado || oficio.completado) continue; // solo si aún pendiente

        const titulo = 'Oficio pendiente';
        const mensaje = `Subir oficios pendientes al expediente: (Exp: ${expediente})`;

        const enviada = await enviarPush(
          responsables,
          titulo,
          mensaje,
          { caseId: caseDoc.id, tipo: 'oficio', itemId: oficio.id || '' },
          'normal'
        );

        if (enviada) {
          // Nota: si querés que se envíe SOLO UNA VEZ por oficio,
          // marca como notificado aquí.
          // Si querés recordatorio diario persistente, NO marques aquí.
          // Ejemplo: marcar para que no se repita infinitamente:
          await caseDoc.ref.update({
            oficios: admin.firestore.FieldValue.arrayUnion({
              ...oficio,
              notificado: true,
              notificadoEn: ahora,
            })
          });
          enviadas++;
        }
      }

      // ─── Tareas ─ normal ─ SIEMPRE si pendiente ───
      const tareas = caso.tareas || [];
      for (const tarea of tareas) {
        if (tarea.notificado || tarea.completado) continue;

        const titulo = 'Tarea pendiente';
        const mensaje = `Realizar tarea pendiente al expediente: (Exp: ${expediente})`;

        const enviada = await enviarPush(
          responsables,
          titulo,
          mensaje,
          { caseId: caseDoc.id, tipo: 'tarea', itemId: tarea.id || '' },
          'normal'
        );

        if (enviada) {
          await caseDoc.ref.update({
            tareas: admin.firestore.FieldValue.arrayUnion({
              ...tarea,
              notificado: true,
              notificadoEn: ahora,
            })
          });
          enviadas++;
        }
      }
    }

    // ────────────────────────────────────────────────
    // 2. Procesar EVENTS (agenda) - alta prioridad
    // ────────────────────────────────────────────────
    const eventsSnapshot = await db.collection('events')
      .where('fecha', '<=', limitePlazosTs)
      .where('notificado', '==', false)
      .get();

    for (const eventDoc of eventsSnapshot.docs) {
      const evento = eventDoc.data();
      const responsables: string[] = evento.responsables || [];
      if (responsables.length === 0) continue;

      const fechaVto = evento.fecha as admin.firestore.Timestamp;
      const vtoDate = fechaVto.toDate();
      const esHoy = vtoDate.toDateString() === ahoraDate.toDateString();

      const titulo = esHoy ? '📅 ¡EVENTO HOY! 📅' : '📅 Evento próximo';
      const diasTexto = esHoy ? 'hoy' : 'dentro de pocos días';
      const mensaje = `Dentro de 2 días tiene un evento pendiente: ${evento.titulo || 'Sin título'} (${diasTexto})`;

      // Nota: el texto dice "Dentro de 2 días" como pediste, aunque el rango es hasta 3 días
      // si querés que sea dinámico ("Dentro de X días"), se puede calcular

      const enviada = await enviarPush(
        responsables,
        titulo,
        mensaje,
        { eventId: eventDoc.id, tipo: 'agenda' },
        'alta'
      );

      if (enviada) {
        await eventDoc.ref.update({
          notificado: true,
          notificadoEn: ahora,
        });
        enviadas++;
      }
    }

    return NextResponse.json({
      success: true,
      enviadas,
      mensaje: `Chequeo completado. ${enviadas} notificaciones enviadas.`
    }, { status: 200 });

  } catch (error) {
    console.error('Error en cron:', error);
    return NextResponse.json({ error: 'Error en el chequeo' }, { status: 500 });
  }
}