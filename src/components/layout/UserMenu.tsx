"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { Spinner } from "@/components/ui/Spinner";
import { useToast } from "@/lib/contexts/ToastContext";

type UserMenuProps = {
  fullName: string;
  email: string;
  avatarUrl: string | null;
  professionalSlug: string | null;
  isAdmin: boolean;
  unreadNotificationCount?: number;
};

export function UserMenu({
  fullName,
  email,
  avatarUrl,
  professionalSlug,
  isAdmin,
  unreadNotificationCount = 0,
}: UserMenuProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  async function handleLogout() {
    setIsLoggingOut(true);
    await authClient.signOut();
    setIsOpen(false);
    toast.success("Sesión cerrada.");
    router.push("/");
    router.refresh();
  }

  return (
    <>
    {isLoggingOut && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm">
        <div className="flex flex-col items-center gap-3">
          <svg className="h-8 w-8 animate-spin text-sb-blue" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <p className="text-[14px] text-sb-muted">Cerrando sesión...</p>
        </div>
      </div>
    )}
    <div ref={containerRef} className="relative">
      <span className="relative inline-flex">
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          aria-label="Menú de usuario"
          className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-sb-card-blue text-sm font-semibold text-sb-blue"
        >
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={avatarUrl}
              alt={fullName}
              className="h-full w-full object-cover"
            />
          ) : (
            fullName.charAt(0).toUpperCase()
          )}
        </button>
        {!isOpen && unreadNotificationCount > 0 && (
          <span className="pointer-events-none absolute right-0 top-0 z-10 h-3 w-3 translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-sb-error" />
        )}
      </span>

    {isOpen && (
        <div className="absolute right-0 z-20 mt-2 w-64 rounded-2xl border border-sb-border bg-white p-2 shadow-[0_4px_20px_rgba(0,0,0,0.12)]">
          <div className="px-3 py-2">
            <p className="font-display text-[15px] font-semibold text-sb-text">
              {fullName}
            </p>
            <p className="text-xs text-sb-muted">{email}</p>
          </div>

          <div className="my-1 border-t border-sb-border" />

          <nav className="flex flex-col">
            <Link
              href="/profile"
              onClick={() => setIsOpen(false)}
              className="rounded-lg px-3 py-2 text-[15px] text-sb-text hover:bg-sb-card-blue"
            >
              Mi perfil
            </Link>
            <Link
              href="/notifications"
              onClick={() => setIsOpen(false)}
              className="flex items-center justify-between rounded-lg px-3 py-2 text-[15px] text-sb-text hover:bg-sb-card-blue"
            >
              Mis notificaciones
              {unreadNotificationCount > 0 && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-sb-blue px-1 text-[11px] font-semibold text-white">
                  {unreadNotificationCount > 9 ? "9+" : unreadNotificationCount}
                </span>
              )}
            </Link>
            {professionalSlug && !isAdmin && (
              <>
                <Link
                  href={`/p/${professionalSlug}`}
                  onClick={() => setIsOpen(false)}
                  className="rounded-lg px-3 py-2 text-[15px] text-sb-text hover:bg-sb-card-blue"
                >
                  Mi perfil profesional
                </Link>
                <Link
                  href="/professional/reviews"
                  onClick={() => setIsOpen(false)}
                  className="rounded-lg px-3 py-2 text-[15px] text-sb-text hover:bg-sb-card-blue"
                >
                  Panel profesional
                </Link>
              </>
            )}
            {isAdmin && (
              <Link
                href="/admin"
                onClick={() => setIsOpen(false)}
                className="rounded-lg px-3 py-2 text-[15px] text-sb-text hover:bg-sb-card-blue"
              >
                Panel admin
              </Link>
            )}
          </nav>

          <div className="my-1 border-t border-sb-border" />

          <button
            type="button"
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-[15px] text-sb-error hover:bg-sb-card-blue disabled:opacity-50"
          >
            {isLoggingOut && <Spinner className="h-4 w-4" />}
            {isLoggingOut ? "Cerrando sesión..." : "Cerrar sesión"}
          </button>
        </div>
      )}
    </div>
    </>
  );
}
