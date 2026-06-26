"use client";

import { useTransition, type ChangeEvent } from "react";
import { uploadAvatarAction } from "@/modules/users/actions";
import { Spinner } from "@/components/ui/Spinner";

type AvatarUploaderProps = {
  avatarUrl: string | null;
  fullName: string;
  size?: "md" | "lg";
  onUpload: (url: string) => void;
  onError: (error: string) => void;
};

export function AvatarUploader({
  avatarUrl,
  fullName,
  size = "md",
  onUpload,
  onError,
}: AvatarUploaderProps) {
  const [isUploading, startUpload] = useTransition();
  const dim = size === "lg" ? "h-24 w-24" : "h-16 w-16";
  const textSize = size === "lg" ? "text-3xl" : "text-xl";

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.set("avatar", file);

    startUpload(async () => {
      const result = await uploadAvatarAction(formData);
      if (result.error) {
        onError(result.error);
        return;
      }
      if (result.avatarUrl) {
        onUpload(result.avatarUrl);
      }
    });
  }

  return (
    <label className="relative cursor-pointer">
      <div className={`relative ${dim}`}>
        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={avatarUrl}
            alt="Foto de perfil"
            className={`${dim} rounded-full object-cover`}
          />
        ) : (
          <div
            className={`flex ${dim} items-center justify-center rounded-full bg-sb-card-blue ${textSize} font-semibold text-sb-blue`}
          >
            {fullName.charAt(0).toUpperCase()}
          </div>
        )}
        {isUploading ? (
          <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40">
            <Spinner className="h-5 w-5 text-white" />
          </div>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/0 opacity-0 transition-opacity hover:bg-black/40 hover:opacity-100">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
              <circle cx="12" cy="13" r="4" />
            </svg>
          </div>
        )}
      </div>
      <input
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleChange}
        disabled={isUploading}
        className="sr-only"
      />
    </label>
  );
}
