import { parseBio } from "@/lib/bioTypes";

interface BioDisplayProps {
  rawBio: string | null;
  professionalName: string;
}

export function BioDisplay({ rawBio, professionalName }: BioDisplayProps) {
  const bio = parseBio(rawBio);

  const hasNonDefaultLanguages =
    bio.languages.length > 0 &&
    !(bio.languages.length === 1 && bio.languages[0] === "Español");

  const isEmpty =
    bio.jobTypes.length === 0 &&
    !bio.guarantee.offersGuarantee &&
    bio.availability.days.length === 0 &&
    !bio.availability.hours &&
    !bio.availability.allowsUrgentCalls &&
    bio.paymentMethods.length === 0 &&
    !bio.license.isLicensed &&
    !bio.hasInsurance &&
    bio.billing.length === 0 &&
    bio.workModality.length === 0 &&
    !hasNonDefaultLanguages &&
    !bio.freeText;

  if (isEmpty) return null;

  return (
    <div className="rounded-2xl border border-sb-border bg-white p-5">
      <h2 className="font-display mb-4 text-lg font-bold text-sb-text">
        Sobre {professionalName.split(" ")[0]}
      </h2>

      <div className="flex flex-col gap-4">
        {bio.jobTypes.length > 0 && (
          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-wider text-sb-muted">
              🔧 Tipo de trabajos
            </p>
            <div className="flex flex-wrap gap-2">
              {bio.jobTypes.map((j) => (
                <span
                  key={j}
                  className="rounded-full bg-sb-blue/10 px-3 py-1.5 text-xs font-medium text-sb-blue"
                >
                  {j}
                </span>
              ))}
            </div>
          </div>
        )}

        {(bio.availability.days.length > 0 || bio.availability.hours) && (
          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-wider text-sb-muted">
              📅 Disponibilidad
            </p>
            <div className="flex flex-wrap gap-2">
              {bio.availability.days.map((d) => (
                <span
                  key={d}
                  className="rounded-full border border-sb-border bg-sb-bg px-3 py-1.5 text-xs text-sb-text"
                >
                  {d}
                </span>
              ))}
              {bio.availability.hours && (
                <span className="rounded-full border border-sb-border bg-sb-bg px-3 py-1.5 text-xs text-sb-text">
                  {bio.availability.hours}
                </span>
              )}
              {bio.availability.allowsUrgentCalls && (
                <span className="rounded-full bg-sb-warning/10 px-3 py-1.5 text-xs font-medium text-sb-warning">
                  ⚡ Atiende urgencias
                </span>
              )}
            </div>
          </div>
        )}

        {bio.guarantee.offersGuarantee && (
          <div className="flex items-start gap-3 rounded-xl border border-sb-success/20 bg-sb-success/5 p-3">
            <span className="shrink-0 text-xl">🛡️</span>
            <div>
              <p className="text-sm font-medium text-sb-success">Ofrece garantía</p>
              {bio.guarantee.details && (
                <p className="mt-0.5 text-xs text-sb-muted">{bio.guarantee.details}</p>
              )}
            </div>
          </div>
        )}

        {bio.hasInsurance && (
          <div className="flex items-center gap-3 rounded-xl border border-sb-success/20 bg-sb-success/5 p-3">
            <span className="text-xl">🔒</span>
            <p className="text-sm font-medium text-sb-success">
              Cuenta con seguro de responsabilidad civil
            </p>
          </div>
        )}

        {bio.license.isLicensed && (
          <div className="flex items-start gap-3 rounded-xl border border-sb-blue/20 bg-sb-blue/5 p-3">
            <span className="shrink-0 text-xl">📋</span>
            <div>
              <p className="text-sm font-medium text-sb-blue">Habilitado oficialmente</p>
              {bio.license.entity && (
                <p className="mt-0.5 text-xs text-sb-muted">
                  {bio.license.entity}
                  {bio.license.number ? ` · Mat. ${bio.license.number}` : ""}
                </p>
              )}
            </div>
          </div>
        )}

        {bio.paymentMethods.length > 0 && (
          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-wider text-sb-muted">
              💳 Métodos de pago
            </p>
            <div className="flex flex-wrap gap-2">
              {bio.paymentMethods.map((p) => (
                <span
                  key={p}
                  className="rounded-full border border-sb-border bg-sb-bg px-3 py-1.5 text-xs text-sb-text"
                >
                  {p}
                </span>
              ))}
            </div>
          </div>
        )}

        {bio.billing.length > 0 && (
          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-wider text-sb-muted">
              🧾 Facturación
            </p>
            <div className="flex flex-wrap gap-2">
              {bio.billing.map((b) => (
                <span
                  key={b}
                  className="rounded-full border border-sb-border bg-sb-bg px-3 py-1.5 text-xs text-sb-text"
                >
                  {b}
                </span>
              ))}
            </div>
          </div>
        )}

        {bio.workModality.length > 0 && (
          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-wider text-sb-muted">
              📍 Modalidad
            </p>
            <div className="flex flex-wrap gap-2">
              {bio.workModality.map((m) => (
                <span
                  key={m}
                  className="rounded-full border border-sb-border bg-sb-bg px-3 py-1.5 text-xs text-sb-text"
                >
                  {m}
                </span>
              ))}
            </div>
          </div>
        )}

        {hasNonDefaultLanguages && (
          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-wider text-sb-muted">
              🌐 Idiomas
            </p>
            <div className="flex flex-wrap gap-2">
              {bio.languages.map((l) => (
                <span
                  key={l}
                  className="rounded-full border border-sb-border bg-sb-bg px-3 py-1.5 text-xs text-sb-text"
                >
                  {l}
                </span>
              ))}
            </div>
          </div>
        )}

        {bio.freeText && (
          <div className="mt-1 border-t border-sb-border pt-4">
            <p className="text-sm italic leading-relaxed text-sb-muted">
              &ldquo;{bio.freeText}&rdquo;
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
