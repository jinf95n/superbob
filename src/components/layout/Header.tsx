"use client";

import Link from "next/link";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/Button";

export function Header() {
  const { data: session } = authClient.useSession();

  return (
    <header className="flex items-center justify-between border-b border-sb-border bg-white px-4 py-3">
      <Link
        href="/"
        className="font-display text-xl font-bold text-sb-blue"
      >
        SUPERBOB
      </Link>

      <nav className="flex items-center gap-3">
        <Link
          href="/search"
          className="hidden text-sm font-medium text-sb-text sm:inline"
        >
          Buscar
        </Link>

        {session ? (
          <Link href="/dashboard">
            <Button variant="secondary" className="px-3 py-1.5 text-sm">
              Mi cuenta
            </Button>
          </Link>
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
