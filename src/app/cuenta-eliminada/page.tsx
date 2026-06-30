"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

export default function CuentaEliminadaPage() {
  const router = useRouter();

  useEffect(() => {
    authClient.signOut().finally(() => {
      router.replace("/login");
    });
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-sb-bg px-4">
      <p className="text-[15px] text-sb-muted">Esta cuenta fue eliminada.</p>
    </div>
  );
}
