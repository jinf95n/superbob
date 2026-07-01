import Image from "next/image";
import Link from "next/link";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { getUserAccountProfile, getUserRole } from "@/modules/users/queries";
import { getProfessionalSlugByUserId } from "@/modules/professionals/queries";
import { Button } from "@/components/ui/Button";
import { UserMenu } from "./UserMenu";

export async function Header({ unreadNotificationCount = 0 }: { unreadNotificationCount?: number } = {}) {
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
      <Link href="/" className="flex items-center gap-2">
        <Image
          src="/images/isotipo.png"
          alt="SUPERBOB"
          width={32}
          height={32}
          className="object-contain"
        />
        <span className="font-display text-xl font-bold tracking-tight text-sb-blue">
          SUPERBOB
        </span>
      </Link>

      <nav className="flex items-center">
        {session && accountProfile ? (
          <UserMenu
            fullName={accountProfile.fullName}
            email={accountProfile.email}
            avatarUrl={accountProfile.avatarUrl}
            professionalSlug={professionalSlug}
            isAdmin={role === "admin"}
            unreadNotificationCount={unreadNotificationCount}
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
