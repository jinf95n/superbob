import { HTMLAttributes } from "react";

type CardProps = HTMLAttributes<HTMLDivElement>;

export function Card({ className = "", ...props }: CardProps) {
  return (
    <div
      className={`rounded-card border border-sb-border bg-white p-4 dark:border-sb-border-dark dark:bg-sb-bg-dark ${className}`}
      {...props}
    />
  );
}
