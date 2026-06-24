"use client";

import { ButtonHTMLAttributes, ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { Spinner } from "./Spinner";

type SubmitButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "type"> & {
  pendingLabel?: ReactNode;
};

export function SubmitButton({
  children,
  pendingLabel,
  className = "",
  disabled,
  ...props
}: SubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={disabled || pending}
      className={`inline-flex items-center justify-center gap-2 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
      {...props}
    >
      {pending && <Spinner className="h-4 w-4" />}
      {pending ? pendingLabel ?? children : children}
    </button>
  );
}
