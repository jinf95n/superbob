import { InputHTMLAttributes, forwardRef } from "react";

type InputProps = InputHTMLAttributes<HTMLInputElement>;

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className = "", ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={`w-full rounded border border-sb-border bg-transparent px-3 py-2 text-[16px] text-sb-text placeholder:text-sb-muted focus:border-sb-blue focus:outline-none dark:border-sb-border-dark dark:text-sb-text-dark ${className}`}
        {...props}
      />
    );
  },
);

Input.displayName = "Input";
