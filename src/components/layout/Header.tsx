import Link from "next/link";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { getUserAccountProfile, getUserRole } from "@/modules/users/queries";
import { getProfessionalSlugByUserId } from "@/modules/professionals/queries";
import { Button } from "@/components/ui/Button";
import { UserMenu } from "./UserMenu";

export async function Header() {
  const session = await auth.api.getSession({ headers: await headers() });

  const [accountProfile, role, professionalSlug] = session
    ? await Promise.all([
        getUserAccountProfile(session.user.id),
        getUserRole(session.user.id),
        getProfessionalSlugByUserId(session.user.id),
      ])
    : [null, null, null];

  return (
    <header className="flex items-center justify-between border-b border-sb-border bg-white px-4 py-3">
      <Link
        href="/"
        className="font-display text-xl font-bold text-sb-blue"
      >
        SUPERBOB
      </Link>

      <nav className="flex items-center">
        {session && accountProfile ? (
          <UserMenu
            fullName={accountProfile.fullName}
            email={accountProfile.email}
            avatarUrl={accountProfile.avatarUrl}
            professionalSlug={professionalSlug}
            isAdmin={role === "admin"}
          />
        ) : (
          <Link href="/login">
            <Button variant="secondary" className="px-3 py-1.5 text-sm">
              Iniciar sesión
            </Button>
          </Link>
        )}
      </nav>
    </header>
  );
}
