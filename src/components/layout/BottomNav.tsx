"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { authClient } from "@/lib/auth-client";

type NavItem = {
  href: string;
  label: string;
  emoji: string;
};

export function BottomNav() {
  const pathname = usePathname();
  const { data: session } = authClient.useSession();

  const items: NavItem[] = [
    { href: "/search", label: "Buscar", emoji: "🔍" },
    {
      href: session ? "/notifications" : "/login",
      label: "Notificaciones",
      emoji: "🔔",
    },
    { href: session ? "/dashboard" : "/login", label: "Perfil", emoji: "👤" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-10 flex border-t border-sb-border bg-white sm:hidden">
      {items.map((item) => {
        const isActive = pathname.startsWith(item.href);
        return (
          <Link
            key={item.label}
            href={item.href}
            className={`flex flex-1 flex-col items-center gap-0.5 py-2 text-center text-[13px] font-medium ${
              isActive ? "text-sb-blue" : "text-sb-muted"
            }`}
          >
            <span aria-hidden="true" className="text-xl">
              {item.emoji}
            </span>
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
