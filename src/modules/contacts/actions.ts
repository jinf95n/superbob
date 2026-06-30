"use server";

import { headers } from "next/headers";
import { after } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  CONTACT_RATE_LIMIT_PAIR_DAYS,
  CONTACT_RATE_LIMIT_PER_DAY,
  CONTACT_RATE_LIMIT_PER_WEEK,
} from "@/lib/config";
import { getProfessionalContactPhone } from "@/modules/professionals/queries";
import { RevealPhoneActionState, RevealPhoneInput, RevealPhoneSchema } from "./types";

// Extrae la IP del cliente del header x-forwarded-for (primer valor, que es el origen real
// cuando el request pasa por un proxy). Retorna null si el header no está disponible.
function extractClientIp(requestHeaders: Headers): string | null {
  const forwarded = requestHeaders.get("x-forwarded-for");
  if (!forwarded) return null;
  return forwarded.split(",")[0]?.trim() ?? null;
}

// Valida los tres límites de rate para contact_events. Retorna mensaje de error o null.
async function checkContactRateLimits(
  clientId: string,
  professionalId: string,
): Promise<string | null> {
  const now = new Date();

  const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const pairWindowAgo = new Date(now.getTime() - CONTACT_RATE_LIMIT_PAIR_DAYS * 24 * 60 * 60 * 1000);

  const [pairCount, dayCount, weekCount] = await Promise.all([
    // Límite por par usuario-profesional en los últimos CONTACT_RATE_LIMIT_PAIR_DAYS días
    prisma.contactEvent.count({
      where: {
        clientId,
        professionalId,
        createdAt: { gte: pairWindowAgo },
      },
    }),
    // Límite total de eventos del usuario en las últimas 24 horas
    prisma.contactEvent.count({
      where: { clientId, createdAt: { gte: dayAgo } },
    }),
    // Límite total de eventos del usuario en los últimos 7 días
    prisma.contactEvent.count({
      where: { clientId, createdAt: { gte: weekAgo } },
    }),
  ]);

  if (pairCount >= 1) {
    return `Ya contactaste a este profesional recientemente. Podés volver a hacerlo en ${CONTACT_RATE_LIMIT_PAIR_DAYS} días.`;
  }
  if (dayCount >= CONTACT_RATE_LIMIT_PER_DAY) {
    return `Alcanzaste el límite de ${CONTACT_RATE_LIMIT_PER_DAY} contactos por día.`;
  }
  if (weekCount >= CONTACT_RATE_LIMIT_PER_WEEK) {
    return `Alcanzaste el límite de ${CONTACT_RATE_LIMIT_PER_WEEK} contactos por semana.`;
  }

  return null;
}

export async function revealPhoneAction(
  input: RevealPhoneInput,
): Promise<RevealPhoneActionState> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return { error: "Necesitás iniciar sesión para ver el teléfono" };
  }
  if (!session.user.emailVerified) {
    return { error: "Tenés que verificar tu email para ver el teléfono" };
  }

  const parsed = RevealPhoneSchema.safeParse(input);
  if (!parsed.success) {
    return { error: "Solicitud inválida" };
  }

  // Rate limiting sincrónico: corre antes de retornar el teléfono
  const rateLimitError = await checkContactRateLimits(
    session.user.id,
    parsed.data.professionalId,
  );
  if (rateLimitError) {
    return { error: rateLimitError };
  }

  const phone = await getProfessionalContactPhone(parsed.data.professionalId);
  if (!phone) {
    return { error: "Este profesional no tiene teléfono de contacto" };
  }

  const requestHeaders = await headers();
  const ipAddress = extractClientIp(requestHeaders);

  // El registro del contacto es un efecto secundario, no un prerequisito para mostrar el
  // teléfono: after() garantiza que corre incluso si el proceso serverless se congela
  // tras enviar la respuesta.
  after(async () => {
    try {
      await prisma.contactEvent.create({
        data: {
          professionalId: parsed.data.professionalId,
          clientId: session.user.id,
          source: parsed.data.source,
          ipAddress,
        },
      });
    } catch (err) {
      console.error("Error registrando contact event:", err);
    }
  });

  return { phone };
}

/**
 * Registra un contact_event sin obtener el teléfono — usado cuando el número
 * ya fue pre-cargado en el servidor y el cliente solo necesita registrar el evento.
 * No aplica rate limiting (se asume que ya se validó antes de mostrar el teléfono).
 */
export async function registerContactEventAction(
  input: RevealPhoneInput,
): Promise<void> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return;

  const parsed = RevealPhoneSchema.safeParse(input);
  if (!parsed.success) return;

  const requestHeaders = await headers();
  const ipAddress = extractClientIp(requestHeaders);

  try {
    await prisma.contactEvent.create({
      data: {
        professionalId: parsed.data.professionalId,
        clientId: session.user.id,
        source: parsed.data.source,
        ipAddress,
      },
    });
  } catch (err) {
    console.error("Error registrando contact event:", err);
  }
}
