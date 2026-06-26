"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/users", label: "Usuarios" },
  { href: "/admin/professionals", label: "Profesionales" },
  { href: "/admin/reports", label: "Reportes" },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="flex gap-1 overflow-x-auto border-b border-sb-border px-2 dark:border-sb-border-dark">
      {ITEMS.map((item) => {
        const isActive =
          item.href === "/admin"
            ? pathname === "/admin"
            : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`whitespace-nowrap border-b-2 px-3 py-3 text-sm font-medium ${
              isActive
                ? "border-sb-blue text-sb-blue"
                : "border-transparent text-sb-muted dark:text-sb-muted-dark"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
