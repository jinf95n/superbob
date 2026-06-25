"use server";

import { headers } from "next/headers";
import { after } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getProfessionalContactPhone } from "@/modules/professionals/queries";
import { RevealPhoneActionState, RevealPhoneInput, RevealPhoneSchema } from "./types";

export async function revealPhoneAction(
  input: RevealPhoneInput,
): Promise<RevealPhoneActionState> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return { error: "Necesitás iniciar sesión para ver el teléfono" };
  }

  const parsed = RevealPhoneSchema.safeParse(input);
  if (!parsed.success) {
    return { error: "Solicitud inválida" };
  }

  const phone = await getProfessionalContactPhone(parsed.data.professionalId);
  if (!phone) {
    return { error: "Este profesional no tiene teléfono de contacto" };
  }

  // El registro del contacto es un efecto secundario, no un prerequisito
  // para mostrar el teléfono: no bloquea la respuesta. after() (no una
  // promesa suelta sin await) porque en serverless el proceso puede
  // congelarse apenas se envía la respuesta — after() garantiza que esto
  // corra igual.
  after(async () => {
    try {
      await prisma.contactEvent.create({
        data: {
          professionalId: parsed.data.professionalId,
          clientId: session.user.id,
          source: parsed.data.source,
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
 * ya fue pre-cargado en el servidor y el cliente solo necesita registrar el
 * evento en background.
 */
export async function registerContactEventAction(
  input: RevealPhoneInput,
): Promise<void> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return;

  const parsed = RevealPhoneSchema.safeParse(input);
  if (!parsed.success) return;

  try {
    await prisma.contactEvent.create({
      data: {
        professionalId: parsed.data.professionalId,
        clientId: session.user.id,
        source: parsed.data.source,
      },
    });
  } catch (err) {
    console.error("Error registrando contact event:", err);
  }
}
