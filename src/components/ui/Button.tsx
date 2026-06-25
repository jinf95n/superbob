import { ButtonHTMLAttributes, forwardRef, ReactNode } from "react";
import { Spinner } from "./Spinner";

type ButtonVariant = "primary" | "secondary" | "accent" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isPending?: boolean;
  isSuccess?: boolean;
  isError?: boolean;
  /** Texto mientras carga. Default: el children original. */
  pendingText?: ReactNode;
  /** Texto en éxito. Default: "Listo". */
  successText?: ReactNode;
  /** Texto en error. Default: el children original. */
  errorText?: ReactNode;
  fullWidth?: boolean;
};

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary: "bg-sb-blue text-white hover:bg-sb-blue/90",
  secondary:
    "border border-sb-blue text-sb-blue bg-transparent hover:bg-sb-blue/5",
  accent: "bg-sb-orange text-white hover:bg-sb-orange/90",
  ghost: "text-sb-muted bg-transparent hover:bg-sb-border/40",
  danger: "bg-sb-error text-white hover:bg-sb-error/90",
};

const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: "text-sm px-3 py-1.5 rounded-lg",
  md: "text-sm px-4 py-2.5 rounded-lg",
  lg: "text-base px-6 py-3 rounded-xl",
};

function CheckIcon() {
  return (
    <svg
      className="h-4 w-4 shrink-0"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M5 13l4 4L19 7" />
    </svg>
  );
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      isPending = false,
      isSuccess = false,
      isError = false,
      pendingText,
      successText,
      errorText,
      fullWidth = false,
      className = "",
      disabled,
      children,
      ...props
    },
    ref,
  ) => {
    const statusClasses = isSuccess
      ? "bg-sb-success text-white"
      : isError
        ? "bg-sb-error text-white"
        : VARIANT_CLASSES[variant];

    const isDisabled = disabled || isPending || isSuccess;

    let content: ReactNode = children;
    if (isPending) {
      content = (
        <>
          <Spinner className="h-4 w-4" />
          {pendingText ?? children}
        </>
      );
    } else if (isSuccess) {
      content = (
        <>
          <CheckIcon />
          {successText ?? "Listo"}
        </>
      );
    } else if (isError) {
      content = errorText ?? children;
    }

    return (
      <button
        ref={ref}
        disabled={isDisabled}
        className={`inline-flex items-center justify-center gap-2 font-medium transition-colors duration-150 ease-in-out disabled:cursor-not-allowed ${
          isPending ? "opacity-85" : isDisabled ? "opacity-50" : ""
        } ${fullWidth ? "w-full" : ""} ${SIZE_CLASSES[size]} ${statusClasses} ${className}`}
        {...props}
      >
        {content}
      </button>
    );
  },
);

Button.displayName = "Button";
