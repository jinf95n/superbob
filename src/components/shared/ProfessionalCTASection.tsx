"use client";

import Link from "next/link";
import { authClient } from "@/lib/auth-client";

const BENEFITS = [
  { emoji: "📍", text: "Perfil público en Google con tu zona y especialidad" },
  { emoji: "⭐", text: "Reseñas verificadas que construyen tu reputación" },
  { emoji: "📲", text: "QR profesional para compartir con tus clientes" },
];

export function ProfessionalCTASection() {
  const { data: session } = authClient.useSession();
  const ctaHref = session ? "/professional/onboarding" : "/register";

  return (
    <section className="bg-sb-blue px-4 py-16">
      <div className="mx-auto max-w-3xl text-center">
        <h2 className="font-display text-[28px] font-extrabold text-white sm:text-[36px]">
          ¿Sos profesional?
        </h2>
        <p className="mt-3 text-[16px] text-white/80">
          Tu próximo cliente te está buscando en SUPERBOB.
        </p>

        <ul className="mt-8 flex flex-col gap-3">
          {BENEFITS.map((benefit) => (
            <li key={benefit.text} className="text-[15px] text-white/90">
              <span aria-hidden="true">{benefit.emoji}</span> {benefit.text}
            </li>
          ))}
        </ul>

        <Link
          href={ctaHref}
          className="mt-8 inline-flex items-center justify-center rounded-xl bg-sb-orange px-8 py-4 font-display text-[16px] font-semibold text-white transition-opacity duration-150 ease-in-out hover:opacity-90"
        >
          Crear mi perfil profesional
        </Link>

        <p className="mt-4 text-[13px] text-white/60">
          ¿Ya registrado?{" "}
          <Link href="/login" className="text-white/80 underline">
            Ingresá con tu cuenta.
          </Link>
        </p>
      </div>
    </section>
  );
}
