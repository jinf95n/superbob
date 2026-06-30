import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getProfessionalProfileIdByUserId } from "@/modules/professionals/queries";
import { Header } from "@/components/layout/Header";
import { BottomNav } from "@/components/layout/BottomNav";
import { AppSidebar } from "@/components/layout/AppSidebar";

export default async function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    redirect("/login");
  }

  const [user, professionalId] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { deletedAt: true },
    }),
    getProfessionalProfileIdByUserId(session.user.id),
  ]);

  // Safety net: la cuenta puede haber sido eliminada mientras la cookie seguía activa.
  if (user?.deletedAt) {
    redirect("/cuenta-eliminada");
  }

  const hasProfessionalProfile = !!professionalId;

  return (
    <div className="min-h-screen bg-sb-bg sm:h-screen sm:flex sm:flex-col sm:overflow-hidden">
      <div className="shrink-0">
        <Header />
      </div>
      <div className="flex flex-1 sm:overflow-hidden">
        <AppSidebar hasProfessionalProfile={hasProfessionalProfile} />
        <main className="min-w-0 flex-1 pb-16 sm:overflow-y-auto sm:pb-0">
          {children}
        </main>
      </div>
      <BottomNav hasProfessionalProfile={hasProfessionalProfile} />
    </div>
  );
}
