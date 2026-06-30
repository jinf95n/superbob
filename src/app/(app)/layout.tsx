import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Header } from "@/components/layout/Header";
import { BottomNav } from "@/components/layout/BottomNav";

export default async function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    redirect("/login");
  }

  // Safety net: la cuenta puede haber sido eliminada (por el usuario u otro dispositivo)
  // mientras la cookie de sesión seguía activa. Redirigimos a una página que limpia
  // las cookies y cierra la sesión en el browser.
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { deletedAt: true },
  });

  if (user?.deletedAt) {
    redirect("/cuenta-eliminada");
  }

  return (
    <div className="min-h-screen bg-sb-bg">
      <Header />
      <div className="pb-16 sm:pb-0">{children}</div>
      <BottomNav />
    </div>
  );
}
