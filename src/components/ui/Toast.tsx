"use client";

export type ToastType = "success" | "error" | "info";

export type ToastItem = {
  id: string;
  type: ToastType;
  message: string;
};

type ToastContainerProps = {
  toasts: ToastItem[];
  leavingIds: Set<string>;
  onDismiss: (id: string) => void;
};

const TYPE_CLASSES: Record<ToastType, string> = {
  success: "bg-sb-success",
  error: "bg-sb-error",
  info: "bg-sb-blue",
};

function ToastIcon({ type }: { type: ToastType }) {
  if (type === "success") {
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

  if (type === "error") {
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
        <path d="M6 6l12 12M18 6L6 18" />
      </svg>
    );
  }

  return null;
}

export function ToastContainer({
  toasts,
  leavingIds,
  onDismiss,
}: ToastContainerProps) {
  if (toasts.length === 0) {
    return null;
  }

  return (
    <div className="fixed inset-x-4 bottom-4 z-[9999] flex flex-col items-center gap-2 sm:inset-x-auto sm:right-4 sm:items-end">
      {toasts.map((item) => (
        <button
          key={item.id}
          type="button"
          onClick={() => onDismiss(item.id)}
          className={`flex w-full max-w-[calc(100vw-32px)] items-center gap-2 rounded-lg px-4 py-3 text-left text-[14px] font-medium text-white sm:w-auto sm:max-w-sm ${
            TYPE_CLASSES[item.type]
          } ${leavingIds.has(item.id) ? "toast-exit" : "toast-enter"}`}
        >
          <ToastIcon type={item.type} />
          <span>{item.message}</span>
        </button>
      ))}
    </div>
  );
}
