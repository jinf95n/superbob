"use client";

import { useState } from "react";
import Image from "next/image";

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
      <div className="flex h-[72px] w-[72px] shrink-0 items-center justify-center overflow-hidden rounded-full bg-sb-blue">
        <Image
          src="/images/isotipo.png"
          alt="SUPERBOB"
          width={44}
          height={44}
          className="object-contain brightness-0 invert opacity-60"
        />
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
