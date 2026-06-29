"use client";

import { useState } from "react";
import { BIO_OPTIONS, ProfessionalBio } from "@/lib/bioTypes";

type BioBuilderProps = {
  bio: ProfessionalBio;
  onChange: (bio: ProfessionalBio) => void;
};

type SectionMeta = { id: string; title: string; emoji: string };

const SECTIONS: SectionMeta[] = [
  { id: "jobTypes", title: "Tipo de trabajos", emoji: "🔧" },
  { id: "availability", title: "Disponibilidad", emoji: "📅" },
  { id: "guarantee", title: "Garantía", emoji: "🛡️" },
  { id: "payment", title: "Métodos de pago", emoji: "💳" },
  { id: "billing", title: "Facturación", emoji: "🧾" },
  { id: "license", title: "Habilitaciones", emoji: "📋" },
  { id: "modality", title: "Modalidad de trabajo", emoji: "📍" },
  { id: "languages", title: "Idiomas", emoji: "🌐" },
  { id: "freeText", title: "Descripción libre", emoji: "✏️" },
];

function getSectionBadge(id: string, bio: ProfessionalBio): string | null {
  switch (id) {
    case "jobTypes":
      return bio.jobTypes.length > 0 ? `${bio.jobTypes.length} seleccionados` : null;
    case "availability":
      return bio.availability.days.length > 0 ? "Completado" : null;
    case "guarantee":
      return bio.guarantee.offersGuarantee ? "Con garantía" : null;
    case "payment":
      return bio.paymentMethods.length > 0 ? `${bio.paymentMethods.length} métodos` : null;
    case "license":
      return bio.license.isLicensed ? "Habilitado" : null;
    case "freeText":
      return bio.freeText.length > 0 ? `${bio.freeText.length} caracteres` : null;
    default:
      return null;
  }
}

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
      className={`rounded-full px-4 py-2 text-[13px] transition-colors ${
        selected
          ? "bg-sb-blue text-white"
          : "border border-sb-border bg-white text-sb-muted hover:border-sb-blue"
      }`}
    >
      {label}
    </button>
  );
}

function Toggle({
  value,
  onToggle,
}: {
  value: boolean;
  onToggle: () => void;
}) {
  return (
    <div
      role="switch"
      aria-checked={value}
      onClick={onToggle}
      className={`relative h-6 w-12 cursor-pointer rounded-full transition-colors ${
        value ? "bg-sb-blue" : "bg-sb-border"
      }`}
    >
      <div
        className={`absolute top-1 h-4 w-4 rounded-full bg-white transition-transform ${
          value ? "translate-x-7" : "translate-x-1"
        }`}
      />
    </div>
  );
}

const INPUT_CLASSES =
  "w-full rounded-xl border border-sb-border px-3.5 py-2.5 text-[14px] text-sb-text outline-none focus:border-sb-blue focus:ring-2 focus:ring-sb-blue/10";

export function BioBuilder({ bio, onChange }: BioBuilderProps) {
  const [openSection, setOpenSection] = useState<string | null>("jobTypes");

  function toggleSection(id: string) {
    setOpenSection((prev) => (prev === id ? null : id));
  }

  function toggleMulti(
    key: keyof Pick<
      ProfessionalBio,
      "jobTypes" | "paymentMethods" | "languages" | "workModality" | "billing"
    >,
    value: string,
  ) {
    const current = bio[key] as string[];
    const next = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
    onChange({ ...bio, [key]: next });
  }

  function toggleDay(day: string) {
    const days = bio.availability.days;
    const next = days.includes(day) ? days.filter((d) => d !== day) : [...days, day];
    onChange({ ...bio, availability: { ...bio.availability, days: next } });
  }

  function selectHour(hour: string) {
    onChange({
      ...bio,
      availability: {
        ...bio.availability,
        hours: bio.availability.hours === hour ? "" : hour,
      },
    });
  }

  const sectionContent: Record<string, React.ReactNode> = {
    jobTypes: (
      <div className="flex flex-wrap gap-2">
        {BIO_OPTIONS.jobTypes.map((opt) => (
          <Chip
            key={opt}
            label={opt}
            selected={bio.jobTypes.includes(opt)}
            onClick={() => toggleMulti("jobTypes", opt)}
          />
        ))}
      </div>
    ),

    availability: (
      <div className="flex flex-col gap-4">
        <div>
          <p className="mb-2 text-[13px] font-medium text-sb-muted">Días</p>
          <div className="flex flex-wrap gap-2">
            {BIO_OPTIONS.availability.days.map((day) => (
              <Chip
                key={day}
                label={day}
                selected={bio.availability.days.includes(day)}
                onClick={() => toggleDay(day)}
              />
            ))}
          </div>
        </div>
        <div>
          <p className="mb-2 text-[13px] font-medium text-sb-muted">Horario</p>
          <div className="flex flex-wrap gap-2">
            {BIO_OPTIONS.availability.hours.map((hour) => (
              <Chip
                key={hour}
                label={hour}
                selected={bio.availability.hours === hour}
                onClick={() => selectHour(hour)}
              />
            ))}
          </div>
        </div>
        <label className="flex cursor-pointer items-center justify-between py-1">
          <span className="text-[14px] text-sb-text">Atiende llamados de urgencia</span>
          <Toggle
            value={bio.availability.allowsUrgentCalls}
            onToggle={() =>
              onChange({
                ...bio,
                availability: {
                  ...bio.availability,
                  allowsUrgentCalls: !bio.availability.allowsUrgentCalls,
                },
              })
            }
          />
        </label>
      </div>
    ),

    guarantee: (
      <div>
        <label className="flex cursor-pointer items-center justify-between">
          <span className="text-[14px] text-sb-text">Ofrezco garantía por mi trabajo</span>
          <Toggle
            value={bio.guarantee.offersGuarantee}
            onToggle={() =>
              onChange({
                ...bio,
                guarantee: {
                  ...bio.guarantee,
                  offersGuarantee: !bio.guarantee.offersGuarantee,
                },
              })
            }
          />
        </label>
        {bio.guarantee.offersGuarantee && (
          <textarea
            value={bio.guarantee.details}
            onChange={(e) =>
              onChange({
                ...bio,
                guarantee: { ...bio.guarantee, details: e.target.value },
              })
            }
            placeholder="Ej: Garantía de 3 meses en mano de obra para instalaciones."
            rows={2}
            maxLength={200}
            className="mt-3 w-full resize-none rounded-xl border border-sb-border px-4 py-3 text-[14px] text-sb-text outline-none focus:border-sb-blue focus:ring-2 focus:ring-sb-blue/10"
          />
        )}
      </div>
    ),

    payment: (
      <div className="flex flex-wrap gap-2">
        {BIO_OPTIONS.paymentMethods.map((opt) => (
          <Chip
            key={opt}
            label={opt}
            selected={bio.paymentMethods.includes(opt)}
            onClick={() => toggleMulti("paymentMethods", opt)}
          />
        ))}
      </div>
    ),

    billing: (
      <div className="flex flex-wrap gap-2">
        {BIO_OPTIONS.billing.map((opt) => (
          <Chip
            key={opt}
            label={opt}
            selected={bio.billing.includes(opt)}
            onClick={() => toggleMulti("billing", opt)}
          />
        ))}
      </div>
    ),

    license: (
      <div className="flex flex-col gap-4">
        <div>
          <label className="flex cursor-pointer items-center justify-between">
            <span className="text-[14px] text-sb-text">
              Tengo matrícula o habilitación oficial
            </span>
            <Toggle
              value={bio.license.isLicensed}
              onToggle={() =>
                onChange({
                  ...bio,
                  license: { ...bio.license, isLicensed: !bio.license.isLicensed },
                })
              }
            />
          </label>
          {bio.license.isLicensed && (
            <div className="mt-3 flex flex-col gap-2">
              <input
                type="text"
                value={bio.license.number}
                onChange={(e) =>
                  onChange({
                    ...bio,
                    license: { ...bio.license, number: e.target.value },
                  })
                }
                placeholder="N.º de matrícula o registro"
                className={INPUT_CLASSES}
              />
              <input
                type="text"
                value={bio.license.entity}
                onChange={(e) =>
                  onChange({
                    ...bio,
                    license: { ...bio.license, entity: e.target.value },
                  })
                }
                placeholder="Entidad habilitante (ej: Enargas, INTI...)"
                className={INPUT_CLASSES}
              />
            </div>
          )}
        </div>
        <label className="flex cursor-pointer items-center justify-between border-t border-sb-border pt-4">
          <span className="text-[14px] text-sb-text">
            Cuento con seguro de responsabilidad civil
          </span>
          <Toggle
            value={bio.hasInsurance}
            onToggle={() =>
              onChange({ ...bio, hasInsurance: !bio.hasInsurance })
            }
          />
        </label>
      </div>
    ),

    modality: (
      <div className="flex flex-wrap gap-2">
        {BIO_OPTIONS.workModality.map((opt) => (
          <Chip
            key={opt}
            label={opt}
            selected={bio.workModality.includes(opt)}
            onClick={() => toggleMulti("workModality", opt)}
          />
        ))}
      </div>
    ),

    languages: (
      <div className="flex flex-wrap gap-2">
        {BIO_OPTIONS.languages.map((opt) => (
          <Chip
            key={opt}
            label={opt}
            selected={bio.languages.includes(opt)}
            onClick={() => toggleMulti("languages", opt)}
          />
        ))}
      </div>
    ),

    freeText: (
      <div>
        <textarea
          value={bio.freeText}
          onChange={(e) =>
            onChange({
              ...bio,
              freeText: e.target.value.slice(0, 500),
            })
          }
          rows={4}
          maxLength={500}
          placeholder="Contá algo más sobre vos y tu forma de trabajar. ¿Qué te diferencia? ¿Qué garantizás a tus clientes?"
          className="w-full resize-none rounded-xl border border-sb-border px-3.5 py-3 text-[14px] text-sb-text outline-none focus:border-sb-blue focus:ring-2 focus:ring-sb-blue/10"
        />
        <p className="mt-1 text-right text-[12px] text-sb-muted">
          {bio.freeText.length}/500
        </p>
      </div>
    ),
  };

  return (
    <div className="flex flex-col gap-2">
      {SECTIONS.map((section) => {
        const badge = getSectionBadge(section.id, bio);
        const isOpen = openSection === section.id;
        return (
          <div
            key={section.id}
            className="overflow-hidden rounded-xl border border-sb-border"
          >
            <button
              type="button"
              onClick={() => toggleSection(section.id)}
              className="flex w-full items-center justify-between bg-white px-4 py-3.5"
            >
              <div className="flex items-center gap-2.5">
                <span className="text-base" role="img" aria-label="">
                  {section.emoji}
                </span>
                <span className="text-[14px] font-medium text-sb-text">
                  {section.title}
                </span>
                {badge && (
                  <span className="rounded-full bg-sb-success/10 px-2 py-0.5 text-[11px] font-medium text-sb-success">
                    {badge}
                  </span>
                )}
              </div>
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                className={`shrink-0 text-sb-muted transition-transform ${
                  isOpen ? "rotate-180" : ""
                }`}
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
            <div
              style={{
                maxHeight: isOpen ? "2000px" : "0",
                overflow: "hidden",
                transition: "max-height 0.3s ease-in-out",
              }}
            >
              <div className="border-t border-sb-border px-4 py-4">
                {sectionContent[section.id]}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
