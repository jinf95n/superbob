"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { authClient } from "@/lib/auth-client";

type NavItem = {
  href: string;
  label: string;
};

export function BottomNav() {
  const pathname = usePathname();
  const { data: session } = authClient.useSession();

  const items: NavItem[] = [
    { href: "/search", label: "Buscar" },
    {
      href: session ? "/notifications" : "/login",
      label: "Notificaciones",
    },
    { href: session ? "/dashboard" : "/login", label: "Perfil" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-10 flex border-t border-sb-border bg-white sm:hidden dark:border-sb-border-dark dark:bg-sb-bg-dark">
      {items.map((item) => {
        const isActive = pathname.startsWith(item.href);
        return (
          <Link
            key={item.label}
            href={item.href}
            className={`flex-1 py-3 text-center text-[13px] font-medium ${
              isActive
                ? "text-sb-blue"
                : "text-sb-muted dark:text-sb-muted-dark"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
