import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getProfessionalProfileIdByUserId } from "@/modules/professionals/queries";
import { getActiveTradesForFilter } from "@/modules/trades/queries";
import { getProvincesWithDepartments } from "@/modules/geography/queries";
import { getUserAccountInfo } from "@/modules/users/queries";
import { OnboardingWizard } from "./OnboardingWizard";

export default async function ProfessionalOnboardingPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    redirect("/login");
  }

  const existingProfileId = await getProfessionalProfileIdByUserId(
    session.user.id,
  );
  if (existingProfileId) {
    redirect("/professional/edit");
  }

  const [tradeCategories, provinces, accountInfo] = await Promise.all([
    getActiveTradesForFilter(),
    getProvincesWithDepartments(),
    getUserAccountInfo(session.user.id),
  ]);

  return (
    <main className="mx-auto max-w-lg p-4 sm:p-6">
      <h1 className="font-display text-2xl font-bold text-sb-text">Activar perfil profesional</h1>
      <p className="mt-1 text-sm text-sb-muted">
        Completá estos 3 pasos para que los clientes te encuentren.
      </p>

      <OnboardingWizard
        initialAvatarUrl={accountInfo?.avatarUrl ?? null}
        tradeCategories={tradeCategories}
        provinces={provinces}
      />
    </main>
  );
}
