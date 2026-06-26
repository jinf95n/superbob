import Image from "next/image";
import Link from "next/link";

const VALUE_POINTS = [
  { emoji: "🔍", text: "Buscá profesionales por oficio y zona" },
  { emoji: "⭐", text: "Leé reseñas verificadas de otros vecinos" },
  { emoji: "📞", text: "Contactá directo, sin intermediarios" },
];

export default function WelcomePage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-sb-blue px-4">
      <div className="w-full max-w-md text-center">
        <div className="mb-6 flex justify-center">
          <Image
            src="/images/isotipo.png"
            alt="SUPERBOB"
            width={64}
            height={64}
            className="brightness-0 invert"
          />
        </div>

        <h1 className="font-display mb-3 text-3xl font-bold text-white">
          ¡Bienvenido a SUPERBOB!
        </h1>

        <p className="mb-8 text-base text-white/80">
          Tu cuenta está lista. Ya podés buscar profesionales de confianza en
          tu zona.
        </p>

        <div className="mb-10 flex flex-col gap-3">
          {VALUE_POINTS.map((item) => (
            <div
              key={item.text}
              className="flex items-center gap-3 rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-left"
            >
              <span className="flex-shrink-0 text-xl">{item.emoji}</span>
              <span className="text-sm text-white/90">{item.text}</span>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-3">
          <Link
            href="/search"
            className="block rounded-xl bg-white py-4 text-base font-bold text-sb-blue transition-opacity hover:bg-white/90 font-display"
          >
            Buscar profesionales
          </Link>
          <Link
            href="/professional/onboarding"
            className="block rounded-xl border border-white/20 bg-white/10 py-3 text-sm font-medium text-white transition-colors hover:bg-white/20"
          >
            Soy profesional, crear mi perfil
          </Link>
          <Link
            href="/dashboard"
            className="py-2 text-sm text-white/60 transition-colors hover:text-white/80"
          >
            Ir al inicio
          </Link>
        </div>
      </div>
    </div>
  );
}
