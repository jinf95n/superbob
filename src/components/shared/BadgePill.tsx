"use client";

import { useState } from "react";
import { ProfessionalBadge } from "@/modules/professionals/types";

type BadgePillProps = {
  label: string;
};

export function BadgePill({ label }: BadgePillProps) {
  return (
    <span className="inline-flex items-center rounded-full border border-sb-border bg-sb-bg px-3 py-1 text-[13px] font-medium text-sb-text">
      {label}
    </span>
  );
}

const MAX_VISIBLE_BADGES = 3;

type BadgeRowProps = {
  badges: ProfessionalBadge[];
};

export function BadgeRow({ badges }: BadgeRowProps) {
  const [expanded, setExpanded] = useState(false);

  if (badges.length === 0) {
    return null;
  }

  const visible = expanded ? badges : badges.slice(0, MAX_VISIBLE_BADGES);
  const hiddenCount = badges.length - MAX_VISIBLE_BADGES;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {visible.map((badge) => (
        <BadgePill key={badge.id} label={badge.label} />
      ))}
      {!expanded && hiddenCount > 0 && (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="text-[13px] font-medium text-sb-blue underline"
        >
          +{hiddenCount} más
        </button>
      )}
    </div>
  );
}
