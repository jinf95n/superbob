import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import {
  getProfessionalProfileForEdit,
  getProfileCompleteness,
} from "@/modules/professionals/queries";
import { getActiveTradesForFilter } from "@/modules/trades/queries";
import { getProvincesWithDepartments } from "@/modules/geography/queries";
import { getUserAccountInfo } from "@/modules/users/queries";
import { getPortfolioPhotosForProfessional } from "@/modules/photos/queries";
import { ProfileCompletionCard } from "@/components/shared/ProfileCompletionCard";
import { ProfessionalEditWizard } from "./ProfessionalEditWizard";

type ProfessionalEditPageProps = {
  searchParams: Promise<{ welcome?: string }>;
};

export default async function ProfessionalEditPage({
  searchParams,
}: ProfessionalEditPageProps) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    redirect("/login");
  }

  const profile = await getProfessionalProfileForEdit(session.user.id);
  if (!profile) {
    redirect("/professional/onboarding");
  }

  const { welcome } = await searchParams;
  const showWelcome = welcome === "1";

  const [tradeCategories, provinces, accountInfo, photos, completeness] =
    await Promise.all([
      getActiveTradesForFilter(),
      getProvincesWithDepartments(),
      getUserAccountInfo(session.user.id),
      getPortfolioPhotosForProfessional(profile.id),
      getProfileCompleteness(profile.id),
    ]);

  return (
    <main className="mx-auto max-w-lg px-4 py-6 sm:py-8">
      {showWelcome && (
        <div className="mb-6 flex items-start justify-between gap-3 rounded-xl border border-sb-success/20 bg-sb-success/10 px-4 py-[14px]">
          <div className="flex items-start gap-2">
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              width="18"
              height="18"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="mt-0.5 shrink-0 text-sb-success"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
            <p className="text-[14px] text-sb-success">
              Tu perfil está activo. Completá estos datos para aparecer más
              arriba en las búsquedas.
            </p>
          </div>
          <Link
            href="/professional/edit"
            aria-label="Cerrar"
            className="shrink-0 text-sb-success"
          >
            ✕
          </Link>
        </div>
      )}

      <h1 className="font-display text-[28px] font-bold text-sb-text">
        Perfil profesional
      </h1>

      <div className="mt-4">
        <ProfileCompletionCard completeness={completeness} />
      </div>

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
