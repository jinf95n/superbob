import { headers } from "next/headers";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { phoneNumber } from "better-auth/plugins/phone-number";
import twilio from "twilio";
import { prisma } from "@/lib/prisma";

const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN,
);

export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL,
  user: {
    fields: {
      name: "fullName",
      image: "avatarUrl",
    },
  },
  emailAndPassword: {
    enabled: true,
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    },
  },
  plugins: [
    phoneNumber({
      schema: {
        user: {
          fields: {
            phoneNumber: "phone",
          },
        },
      },
      sendOTP: async ({ phoneNumber, code }) => {
        await twilioClient.messages.create({
          body: `Tu código de verificación SUPERBOB es: ${code}`,
          from: process.env.TWILIO_PHONE_NUMBER,
          to: phoneNumber,
        });
      },
      callbackOnVerification: async ({ phoneNumber, user }) => {
        await prisma.user.update({
          where: { id: user.id },
          data: { phone: phoneNumber, phoneVerifiedAt: new Date() },
        });
      },
    }),
    // nextCookies debe ir último para interceptar correctamente las respuestas de los plugins anteriores.
    nextCookies(),
  ],
});

export type AdminSessionResult = { userId: string } | { error: string };

/**
 * Verifica sesión + rol admin. Para usar al inicio de Server Actions del
 * panel admin (regla #3 de CLAUDE.md: verificar sesión antes de mutar).
 */
export async function requireAdminSession(): Promise<AdminSessionResult> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return { error: "Necesitás iniciar sesión" };
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  if (user?.role !== "admin") {
    return { error: "No tenés permisos de administrador" };
  }

  return { userId: session.user.id };
}
