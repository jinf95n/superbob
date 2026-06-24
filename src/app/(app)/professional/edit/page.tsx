import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getProfessionalProfileForEdit } from "@/modules/professionals/queries";
import { getActiveTradesForFilter } from "@/modules/trades/queries";
import { getProvincesWithDepartments } from "@/modules/geography/queries";
import { getUserAccountInfo } from "@/modules/users/queries";
import { getPortfolioPhotosForProfessional } from "@/modules/photos/queries";
import { ProfessionalEditWizard } from "./ProfessionalEditWizard";

export default async function ProfessionalEditPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    redirect("/login");
  }

  const profile = await getProfessionalProfileForEdit(session.user.id);
  if (!profile) {
    redirect("/professional/onboarding");
  }

  const [tradeCategories, provinces, accountInfo, photos] = await Promise.all([
    getActiveTradesForFilter(),
    getProvincesWithDepartments(),
    getUserAccountInfo(session.user.id),
    getPortfolioPhotosForProfessional(profile.id),
  ]);

  return (
    <main className="mx-auto max-w-lg px-4 py-6 sm:py-8">
      <h1 className="font-display text-[28px] font-bold text-sb-text">
        Editar perfil profesional
      </h1>
      <p className="mt-1 text-[15px] text-sb-muted">
        Actualizá tus datos, oficios, zonas y fotos.
      </p>

      <ProfessionalEditWizard
        profile={profile}
        accountPhone={accountInfo?.phone ?? null}
        initialAvatarUrl={accountInfo?.avatarUrl ?? null}
        tradeCategories={tradeCategories}
        provinces={provinces}
        initialPhotos={photos}
      />
    </main>
  );
}
