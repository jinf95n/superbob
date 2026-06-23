"use server";

import { headers } from "next/headers";
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

  await prisma.contactEvent.create({
    data: {
      professionalId: parsed.data.professionalId,
      clientId: session.user.id,
      source: parsed.data.source,
    },
  });

  return { phone };
}
