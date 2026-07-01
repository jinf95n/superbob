"use client";

import { useState } from "react";
import { PrivateSuperbobScoreBreakdown } from "@/modules/professionals/types";

type SuperbobScoreCardProps = {
  breakdown: PrivateSuperbobScoreBreakdown;
};

function ComponentBar({ value, max }: { value: number; max: number }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  const colorClass =
    value === max
      ? "bg-sb-success"
      : pct >= 60
        ? "bg-sb-blue"
        : "bg-sb-warning";
  return (
    <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-sb-bg">
      <div
        className={`h-full rounded-full ${colorClass}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

function scoreLabel(total: number): string {
  if (total >= 80) return "Muy bien posicionado";
  if (total >= 60) return "Bien posicionado";
  if (total >= 40) return "En progreso";
  return "Iniciando";
}

export function SuperbobScoreCard({ breakdown }: SuperbobScoreCardProps) {
  const [isOpen, setIsOpen] = useState(true);

  const totalBarColor =
    breakdown.total >= 80
      ? "bg-sb-success"
      : breakdown.total >= 60
        ? "bg-sb-blue"
        : "bg-sb-warning";

  const totalTextColor =
    breakdown.total >= 80
      ? "text-sb-success"
      : breakdown.total >= 60
        ? "text-sb-blue"
        : "text-sb-warning";

  return (
    <div className="rounded-2xl border border-sb-border bg-white p-5">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex w-full items-center justify-between gap-3 text-left"
      >
        <div className="flex items-center gap-2">
          <h2 className="font-display text-[16px] font-semibold text-sb-text">
            Índice SUPERBOB
          </h2>
          <span className="rounded-full bg-sb-card-blue px-2.5 py-0.5 text-[13px] font-medium text-sb-blue">
            {scoreLabel(breakdown.total)}
          </span>
        </div>
        <span className={`font-display shrink-0 text-[18px] font-bold ${totalTextColor}`}>
          {breakdown.total}
          <span className="text-[14px] font-normal text-sb-muted">/100</span>
        </span>
      </button>

      <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-sb-bg">
        <div
          className={`h-full rounded-full ${totalBarColor}`}
          style={{ width: `${breakdown.total}%` }}
        />
      </div>

      {isOpen && (
        <div className="mt-5 flex flex-col gap-4">
          {breakdown.components.map((component) => {
            const pct = component.max > 0 ? (component.value / component.max) * 100 : 0;
            const componentTextColor =
              component.value === component.max
                ? "text-sb-success"
                : pct >= 60
                  ? "text-sb-blue"
                  : "text-sb-warning";
            return (
              <div key={component.label}>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[14px] text-sb-text">
                    {component.emoji} {component.label}
                  </span>
                  <span className={`shrink-0 text-[13px] font-bold tabular-nums ${componentTextColor}`}>
                    {component.value}/{component.max} pts
                  </span>
                </div>
                <ComponentBar value={component.value} max={component.max} />
                {component.hint && (
                  <p className="mt-1.5 text-[12px] leading-relaxed text-sb-muted">
                    {component.hint}
                  </p>
                )}
              </div>
            );
          })}

          <p className="border-t border-sb-border pt-3 text-[12px] leading-relaxed text-sb-muted">
            El índice mide tu posicionamiento real en la plataforma. Actualizá
            tu perfil y sumá reseñas para seguir subiendo.
          </p>
        </div>
      )}
    </div>
  );
}
