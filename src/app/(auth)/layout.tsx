import { HeroImageSlot } from "./HeroImageSlot";

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex min-h-screen bg-white">
      <div className="hidden w-1/2 flex-col items-center justify-center bg-sb-blue px-12 lg:flex">
        <p className="font-display text-[32px] font-extrabold text-white">
          SUPERBOB
        </p>
        <p className="mt-2 max-w-xs text-center text-[16px] text-white/70">
          Profesionales recomendados en tu zona.
        </p>
        <HeroImageSlot />
      </div>

      <div className="flex w-full items-center justify-center bg-white lg:w-1/2">
        {children}
      </div>
    </div>
  );
}
