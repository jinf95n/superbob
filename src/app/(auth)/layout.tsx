import Image from "next/image";
import Link from "next/link";
import { HeroImageSlot } from "./HeroImageSlot";

const TRUST_POINTS = [
  { emoji: "⭐", text: "Reseñas verificadas de vecinos reales" },
  { emoji: "📞", text: "Contacto directo sin intermediarios" },
  { emoji: "🔒", text: "Perfiles con identidad verificada" },
];

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex h-screen overflow-hidden bg-white">
      <div className="hidden w-1/2 flex-col items-center justify-center overflow-hidden bg-sb-blue px-12 lg:flex">
        <Link href="/" className="mb-2 flex items-center gap-2">
          <Image
            src="/images/isotipo.png"
            alt="SUPERBOB"
            width={40}
            height={40}
            className="object-contain brightness-0 invert"
          />
          <span className="font-display text-[32px] font-extrabold text-white">
            SUPERBOB
          </span>
        </Link>
        <p className="mt-2 max-w-xs text-center text-[16px] text-white/70">
          Profesionales recomendados en tu zona.
        </p>
        <HeroImageSlot />

        <div className="mt-6 flex w-full max-w-xs flex-col gap-3">
          {TRUST_POINTS.map((item) => (
            <div
              key={item.text}
              className="flex items-center gap-3 rounded-xl bg-white/10 px-4 py-3"
            >
              <span className="text-lg" role="img" aria-label="">
                {item.emoji}
              </span>
              <span className="text-sm text-white/90">{item.text}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex w-full items-center justify-center overflow-y-auto bg-white lg:w-1/2">
        {children}
      </div>
    </div>
  );
}
