"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type HeaderNavLinksProps = {
  isAdmin: boolean;
};

export function HeaderNavLinks({ isAdmin }: HeaderNavLinksProps) {
  const pathname = usePathname();

  // En /admin/* ya está la navegación como tabs en AdminNav: no la
  // duplicamos en el Header.
  if (isAdmin && pathname.startsWith("/admin")) {
    return null;
  }

  return (
    <Link
      href="/search"
      className="hidden text-sm font-medium text-sb-text sm:inline"
    >
      Buscar
    </Link>
  );
}
