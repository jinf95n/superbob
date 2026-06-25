"use client";

import { useState } from "react";

function getInitials(fullName: string): string {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
}

type ProfileAvatarWithModalProps = {
  avatarUrl: string | null;
  fullName: string;
};

export function ProfileAvatarWithModal({
  avatarUrl,
  fullName,
}: ProfileAvatarWithModalProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (!avatarUrl) {
    return (
      <div className="flex h-[72px] w-[72px] shrink-0 items-center justify-center rounded-full bg-sb-card-blue font-display text-2xl font-bold text-sb-blue">
        {getInitials(fullName)}
      </div>
    );
  }

  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={avatarUrl}
        alt={fullName}
        onClick={() => setIsOpen(true)}
        className="h-[72px] w-[72px] shrink-0 cursor-pointer rounded-full border border-sb-blue object-cover"
      />

      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
          onClick={() => setIsOpen(false)}
        >
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            aria-label="Cerrar"
            className="absolute right-4 top-4 text-2xl text-white"
          >
            ✕
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={avatarUrl}
            alt={fullName}
            onClick={(event) => event.stopPropagation()}
            className="max-h-[80vh] max-w-[90vw] rounded-2xl object-contain sm:max-w-sm"
          />
        </div>
      )}
    </>
  );
}
