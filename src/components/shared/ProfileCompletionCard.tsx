"use client";

import { useState } from "react";
import Link from "next/link";
import { ProfileCompleteness } from "@/modules/professionals/types";

type ProfileCompletionCardProps = {
  completeness: ProfileCompleteness;
};

export function ProfileCompletionCard({
  completeness,
}: ProfileCompletionCardProps) {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="rounded-2xl border border-sb-border bg-white p-5">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex w-full items-center justify-between gap-3 text-left"
      >
        <div className="flex items-center gap-2">
          <h2 className="font-display text-[16px] font-semibold text-sb-text">
            Completitud de tu perfil
          </h2>
          <span className="rounded-full bg-sb-card-blue px-2.5 py-0.5 text-[13px] font-medium text-sb-blue">
            {completeness.level}
          </span>
        </div>
        <span className="font-display shrink-0 text-[18px] font-bold text-sb-text">
          {completeness.score}%
        </span>
      </button>

      <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-sb-bg">
        <div
          className="h-full rounded-full bg-sb-blue"
          style={{ width: `${completeness.score}%` }}
        />
      </div>

      {isOpen && (
        <ul className="mt-4 flex flex-col gap-2.5">
          {completeness.items.map((item) => (
            <li
              key={item.label}
              className="flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-2">
                <span
                  aria-hidden="true"
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[12px] ${
                    item.completed
                      ? "bg-sb-success text-white"
                      : "border border-sb-border"
                  }`}
                >
                  {item.completed ? "✓" : ""}
                </span>
                <span
                  className={`text-[14px] ${
                    item.completed ? "text-sb-text" : "text-sb-muted"
                  }`}
                >
                  {item.label}
                </span>
              </div>
              {!item.completed && item.actionHref && (
                <Link
                  href={item.actionHref}
                  className="shrink-0 text-[13px] font-medium text-sb-blue"
                >
                  Completar →
                </Link>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
