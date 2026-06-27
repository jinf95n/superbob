import { headers } from "next/headers";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { phoneNumber } from "better-auth/plugins/phone-number";
import twilio from "twilio";
import { prisma } from "@/lib/prisma";
import { resend } from "@/lib/resend";

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
    sendResetPassword: async ({ user, url }: { user: { email: string; name?: string }; url: string }) => {
      try {
        await resend.emails.send({
          from: "SUPERBOB <noreply@superbob.com.ar>",
          to: user.email,
          subject: "Recuperá tu contraseña — SUPERBOB",
          html: `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1">
            </head>
            <body style="margin:0;padding:0;background:#F7F7F5;font-family:Inter,sans-serif;">
              <div style="max-width:480px;margin:40px auto;background:white;border-radius:16px;border:1px solid #E2E2DF;overflow:hidden;">
                <div style="background:#1A6FE0;padding:32px;text-align:center;">
                  <h1 style="margin:0;color:white;font-size:24px;font-weight:800;letter-spacing:-0.5px;">SUPERBOB</h1>
                </div>
                <div style="padding:32px;">
                  <h2 style="margin:0 0 8px;color:#1A1A18;font-size:20px;font-weight:700;">Recuperá tu contraseña</h2>
                  <p style="margin:0 0 24px;color:#5A5A58;font-size:15px;line-height:1.6;">
                    Hola ${user.name ?? user.email},<br><br>
                    Recibimos una solicitud para recuperar la contraseña de tu cuenta en SUPERBOB.
                    Hacé click en el botón para crear una nueva.
                  </p>
                  <a href="${url}" style="display:block;background:#1A6FE0;color:white;text-decoration:none;text-align:center;padding:14px 24px;border-radius:10px;font-size:15px;font-weight:600;margin-bottom:24px;">
                    Recuperar contraseña
                  </a>
                  <p style="margin:0;color:#5A5A58;font-size:13px;line-height:1.5;">
                    Este link expira en 1 hora. Si no solicitaste recuperar tu contraseña, podés ignorar este email.
                  </p>
                </div>
                <div style="padding:20px 32px;border-top:1px solid #E2E2DF;text-align:center;">
                  <p style="margin:0;color:#5A5A58;font-size:12px;">
                    SUPERBOB · Argentina<br>
                    <a href="https://superbob.com.ar" style="color:#1A6FE0;text-decoration:none;">superbob.com.ar</a>
                  </p>
                </div>
              </div>
            </body>
            </html>
          `,
        });
        console.log(`[RESEND] Email de reset enviado a ${user.email}`);
      } catch (error) {
        console.error("[RESEND] Error enviando email de reset:", error);
      }
    },
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
