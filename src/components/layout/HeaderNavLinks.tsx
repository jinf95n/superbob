"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type HeaderNavLinksProps = {
  isAdmin: boolean;
};

const ADMIN_LINKS = [
  { href: "/admin", label: "Panel" },
  { href: "/admin/users", label: "Usuarios" },
  { href: "/admin/professionals", label: "Profesionales" },
  { href: "/admin/reports", label: "Reportes" },
  { href: "/admin/reviews", label: "Reseñas" },
];

export function HeaderNavLinks({ isAdmin }: HeaderNavLinksProps) {
  const pathname = usePathname();

  if (isAdmin && pathname.startsWith("/admin")) {
    return (
      <div className="hidden items-center gap-4 sm:flex">
        {ADMIN_LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="text-sm font-medium text-sb-text hover:text-sb-blue"
          >
            {link.label}
          </Link>
        ))}
      </div>
    );
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
