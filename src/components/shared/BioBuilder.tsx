"use client";

import { useEffect, useState } from "react";

const MAX_FREE_TEXT_LENGTH = 300;

const YEARS_EXP_OPTIONS = ["1-2 años", "3-5 años", "6-10 años", "Más de 10 años"];

const JOB_TYPE_OPTIONS = [
  "Urgencias",
  "Obras nuevas",
  "Reformas",
  "Mantenimiento",
  "Presupuestos sin cargo",
  "Trabajos en altura",
];

const AVAILABILITY_OPTIONS = [
  "Lunes a viernes",
  "Sábados",
  "Domingos",
  "Feriados",
  "Guardias 24hs",
];

const ZONE_OPTIONS = ["Solo mi departamento", "Toda la provincia", "Consultar"];

type Guarantee = "yes" | "no" | null;

type BioFormData = {
  yearsExp: string | null;
  jobTypes: string[];
  guarantee: Guarantee;
  availability: string[];
  zone: string | null;
  freeText: string;
};

function generateBioText(data: BioFormData): string {
  const parts: string[] = [];

  if (data.yearsExp) {
    parts.push(`Profesional con ${data.yearsExp.toLowerCase()} de experiencia.`);
  }

  if (data.jobTypes.length > 0) {
    parts.push(`Me especializo en ${data.jobTypes.join(", ").toLowerCase()}.`);
  }

  if (data.guarantee === "yes") {
    parts.push("Ofrezco garantía por escrito en todos mis trabajos.");
  }

  if (data.availability.length > 0) {
    parts.push(`Disponible ${data.availability.join(", ").toLowerCase()}.`);
  }

  if (data.freeText.trim()) {
    parts.push(data.freeText.trim());
  }

  return parts.join(" ");
}

type BioBuilderProps = {
  initialValue?: string | null;
  onChange: (bio: string) => void;
  primaryTradeSlug?: string;
};

function Chip({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-[14px] py-[6px] text-[13px] transition-colors duration-150 ease-in-out ${
        selected
          ? "bg-sb-blue text-white"
          : "border border-sb-border bg-white text-sb-muted"
      }`}
    >
      {label}
    </button>
  );
}

export function BioBuilder({ initialValue, onChange }: BioBuilderProps) {
  const hasInitialValue = Boolean(initialValue?.trim());

  const [data, setData] = useState<BioFormData>({
    yearsExp: null,
    jobTypes: [],
    guarantee: null,
    availability: [],
    zone: null,
    freeText: hasInitialValue ? (initialValue as string) : "",
  });

  useEffect(() => {
    onChange(generateBioText(data));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  function toggleMulti(key: "jobTypes" | "availability", value: string) {
    setData((prev) => {
      const current = prev[key];
      const next = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value];
      return { ...prev, [key]: next };
    });
  }

  const previewText = generateBioText(data);

  return (
    <div className="flex flex-col gap-4">
      {hasInitialValue && (
        <p className="text-[13px] text-sb-muted/70">
          Editá tu descripción anterior o usá las opciones de abajo para
          reemplazarla.
        </p>
      )}

      <div className="flex flex-col gap-3 rounded-xl bg-sb-bg p-4">
        <div>
          <p className="text-[14px] text-sb-text">
            ¿Cuántos años de experiencia tenés?
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {YEARS_EXP_OPTIONS.map((option) => (
              <Chip
                key={option}
                label={option}
                selected={data.yearsExp === option}
                onClick={() =>
                  setData((prev) => ({
                    ...prev,
                    yearsExp: prev.yearsExp === option ? null : option,
                  }))
                }
              />
            ))}
          </div>
        </div>

        <div>
          <p className="text-[14px] text-sb-text">¿Qué tipo de trabajos hacés?</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {JOB_TYPE_OPTIONS.map((option) => (
              <Chip
                key={option}
                label={option}
                selected={data.jobTypes.includes(option)}
                onClick={() => toggleMulti("jobTypes", option)}
              />
            ))}
          </div>
        </div>

        <div>
          <p className="text-[14px] text-sb-text">
            ¿Ofrecés garantía por tu trabajo?
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            <Chip
              label="Sí, doy garantía"
              selected={data.guarantee === "yes"}
              onClick={() =>
                setData((prev) => ({
                  ...prev,
                  guarantee: prev.guarantee === "yes" ? null : "yes",
                }))
              }
            />
            <Chip
              label="Sin garantía"
              selected={data.guarantee === "no"}
              onClick={() =>
                setData((prev) => ({
                  ...prev,
                  guarantee: prev.guarantee === "no" ? null : "no",
                }))
              }
            />
          </div>
        </div>

        <div>
          <p className="text-[14px] text-sb-text">¿Cuándo trabajás?</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {AVAILABILITY_OPTIONS.map((option) => (
              <Chip
                key={option}
                label={option}
                selected={data.availability.includes(option)}
                onClick={() => toggleMulti("availability", option)}
              />
            ))}
          </div>
        </div>

        <div>
          <p className="text-[14px] text-sb-text">
            ¿Trabajás en toda la provincia?
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {ZONE_OPTIONS.map((option) => (
              <Chip
                key={option}
                label={option}
                selected={data.zone === option}
                onClick={() =>
                  setData((prev) => ({
                    ...prev,
                    zone: prev.zone === option ? null : option,
                  }))
                }
              />
            ))}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <span className="h-px flex-1 bg-sb-border" />
        <span className="text-[13px] text-sb-muted">
          Algo más que quieras agregar (opcional)
        </span>
        <span className="h-px flex-1 bg-sb-border" />
      </div>

      <div>
        <textarea
          value={data.freeText}
          onChange={(event) =>
            setData((prev) => ({
              ...prev,
              freeText: event.target.value.slice(0, MAX_FREE_TEXT_LENGTH),
            }))
          }
          maxLength={MAX_FREE_TEXT_LENGTH}
          rows={3}
          placeholder="Ej: Trabajo con materiales de primera calidad. Doy factura. Hablo antes del trabajo para que no haya sorpresas."
          className="w-full rounded border border-sb-border px-3 py-2 text-[15px] text-sb-text focus:border-sb-blue focus:outline-none"
        />
        <p className="mt-1 text-right text-[12px] text-sb-muted">
          {data.freeText.length}/{MAX_FREE_TEXT_LENGTH}
        </p>
      </div>

      <div className="flex flex-col gap-2 border-t border-sb-border pt-4">
        <p className="text-[13px] font-medium text-sb-muted">
          Así se verá tu descripción:
        </p>
        <div className="rounded-xl border-[1.5px] border-sb-border bg-white p-4">
          <p className="text-[14px] leading-[1.6] text-sb-text">
            {previewText || "Completá las opciones de arriba para generar tu descripción."}
          </p>
        </div>
      </div>
    </div>
  );
}
