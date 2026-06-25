"use client";

import Image from "next/image";
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
      <div className="mx-auto max-w-5xl">
        <div className="flex flex-col items-center gap-12 lg:flex-row">
          <div className="relative mx-auto w-full max-w-sm flex-shrink-0 lg:mx-0 lg:w-1/2">
            <Image
              src="/images/house-professionals.png"
              alt="Profesionales trabajando en un hogar"
              width={520}
              height={400}
              sizes="(max-width: 1024px) 100vw, 520px"
              className="h-auto w-full object-contain"
            />
          </div>

          <div className="flex-1 text-center lg:text-left">
            <h2 className="font-display text-[28px] font-extrabold leading-tight text-white sm:text-[36px]">
              ¿Sos profesional?
            </h2>
            <p className="mt-3 text-[16px] text-white/80">
              Tu próximo cliente te está buscando en SUPERBOB.
            </p>

            <ul className="mx-auto mb-8 mt-8 flex max-w-sm flex-col gap-2.5 lg:mx-0">
              {BENEFITS.map((benefit) => (
                <li
                  key={benefit.text}
                  className="flex items-center gap-2.5 rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-left text-[14px] text-white/90"
                >
                  <span aria-hidden="true" className="text-[20px]">
                    {benefit.emoji}
                  </span>
                  {benefit.text}
                </li>
              ))}
            </ul>

            <Link
              href={ctaHref}
              className="inline-flex items-center justify-center rounded-xl border-2 border-white/20 bg-sb-orange px-8 py-4 font-display text-[16px] font-semibold text-white transition-opacity duration-150 ease-in-out hover:opacity-90"
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
        </div>
      </div>
    </section>
  );
}
