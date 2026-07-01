"use client";

import { useMemo, useState } from "react";
import { TradeCategoryWithTrades } from "@/modules/trades/queries";
import { ProvinceWithDepartments } from "@/modules/geography/queries";
import { updateProfessionalProfileAction } from "@/modules/professionals/actions";
import { ProfessionalProfileForEdit } from "@/modules/professionals/types";
import { PortfolioPhotoItem } from "@/modules/photos/types";
import { AvatarUploader } from "@/components/shared/AvatarUploader";
import { PortfolioPhotoManager } from "@/components/shared/PortfolioPhotoManager";
import { BioBuilder } from "@/components/shared/BioBuilder";
import { Spinner } from "@/components/ui/Spinner";
import { useServerAction } from "@/lib/hooks/useServerAction";
import { ProfessionalBio, parseBio, serializeBio } from "@/lib/bioTypes";
import { getSpecialtiesForTrade } from "@/lib/tradeSpecialties";

type Tab = "info" | "trades" | "coverage" | "photos";

const TABS: { key: Tab; label: string }[] = [
  { key: "info", label: "Información" },
  { key: "trades", label: "Oficios" },
  { key: "coverage", label: "Cobertura" },
  { key: "photos", label: "Fotos" },
];

type TradeRow = {
  localId: number;
  tradeId: string;
  yearsExperience: string;
  isPrimary: boolean;
  specialties: string[];
};

let _localIdCounter = 0;
function nextLocalId() {
  return ++_localIdCounter;
}

type ProfessionalEditWizardProps = {
  profile: ProfessionalProfileForEdit;
  accountPhone: string | null;
  initialAvatarUrl: string | null;
  tradeCategories: TradeCategoryWithTrades[];
  provinces: ProvinceWithDepartments[];
  initialPhotos: PortfolioPhotoItem[];
};

const MAX_TRADES = 5;

export function ProfessionalEditWizard({
  profile,
  initialAvatarUrl,
  tradeCategories,
  provinces,
  initialPhotos,
}: ProfessionalEditWizardProps) {
  const [activeTab, setActiveTab] = useState<Tab>("info");
  const [formError, setFormError] = useState<string | null>(null);

  // --- Información tab ---
  const [bioState, setBioState] = useState<ProfessionalBio>(() => parseBio(profile.bio));
  const [contactPhone, setContactPhone] = useState(
    profile.contactPhone ?? "",
  );
  const [avatarUrl, setAvatarUrl] = useState(initialAvatarUrl);
  const [avatarError, setAvatarError] = useState<string | null>(null);

  // --- Oficios tab ---
  const [trades, setTrades] = useState<TradeRow[]>(() => {
    const rows: TradeRow[] = [];
    if (profile.primaryTradeId) {
      rows.push({
        localId: nextLocalId(),
        tradeId: profile.primaryTradeId,
        yearsExperience: profile.primaryYearsExperience?.toString() ?? "",
        isPrimary: true,
        specialties: profile.primarySpecialties,
      });
    }
    for (const t of profile.secondaryTrades) {
      rows.push({
        localId: nextLocalId(),
        tradeId: t.tradeId,
        yearsExperience: t.yearsExperience?.toString() ?? "",
        isPrimary: false,
        specialties: t.specialties,
      });
    }
    return rows;
  });
  const [addTradeId, setAddTradeId] = useState("");
  const [addYears, setAddYears] = useState("");

  // --- Cobertura tab ---
  const [currentProvinceId, setCurrentProvinceId] = useState(
    provinces[0]?.id ?? "",
  );
  const [currentDepartmentId, setCurrentDepartmentId] = useState("");
  const [selectedDepartmentIds, setSelectedDepartmentIds] = useState<
    Set<string>
  >(new Set(profile.departmentIds));
  const [primaryDepartmentId, setPrimaryDepartmentId] = useState(
    profile.primaryDepartmentId ?? "",
  );

  const { execute: submitChanges, isPending: isSubmitting } = useServerAction(
    updateProfessionalProfileAction,
    { onError: () => setFormError("Error al guardar. Intentá de nuevo.") },
  );

  const tradeLookup = useMemo(() => {
    const map = new Map<string, { name: string }>();
    for (const category of tradeCategories) {
      for (const trade of category.trades) {
        map.set(trade.id, { name: trade.name });
      }
    }
    return map;
  }, [tradeCategories]);

  const departmentLookup = useMemo(() => {
    const map = new Map<string, { name: string; provinceName: string }>();
    for (const province of provinces) {
      for (const department of province.departments) {
        map.set(department.id, {
          name: department.name,
          provinceName: province.name,
        });
      }
    }
    return map;
  }, [provinces]);

  const currentProvince = provinces.find((p) => p.id === currentProvinceId);
  const usedTradeIds = new Set(trades.map((t) => t.tradeId).filter(Boolean));

  function makePrimary(localId: number) {
    setTrades((prev) =>
      prev.map((t) => ({ ...t, isPrimary: t.localId === localId })),
    );
  }

  function removeTrade(localId: number) {
    setTrades((prev) => prev.filter((t) => t.localId !== localId));
  }

  function updateTradeField(
    localId: number,
    patch: Partial<Pick<TradeRow, "tradeId" | "yearsExperience" | "specialties">>,
  ) {
    setTrades((prev) =>
      prev.map((t) => {
        if (t.localId !== localId) return t;
        // Si cambia el oficio, limpiar especialidades
        if (patch.tradeId !== undefined && patch.tradeId !== t.tradeId) {
          return { ...t, ...patch, specialties: [] };
        }
        return { ...t, ...patch };
      }),
    );
  }

  function toggleTradeSpecialty(localId: number, specialty: string) {
    setTrades((prev) =>
      prev.map((t) => {
        if (t.localId !== localId) return t;
        const has = t.specialties.includes(specialty);
        return {
          ...t,
          specialties: has
            ? t.specialties.filter((s) => s !== specialty)
            : [...t.specialties, specialty],
        };
      }),
    );
  }

  function addTrade() {
    if (!addTradeId) return;
    const hasPrimary = trades.some((t) => t.isPrimary);
    setTrades((prev) => [
      ...prev,
      {
        localId: nextLocalId(),
        tradeId: addTradeId,
        yearsExperience: addYears,
        isPrimary: !hasPrimary,
        specialties: [],
      },
    ]);
    setAddTradeId("");
    setAddYears("");
  }

  function addDepartment() {
    if (!currentDepartmentId) return;
    setSelectedDepartmentIds((prev) => new Set([...prev, currentDepartmentId]));
    setCurrentDepartmentId("");
  }

  function removeDepartment(id: string) {
    setSelectedDepartmentIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
    if (primaryDepartmentId === id) {
      setPrimaryDepartmentId("");
    }
  }

  function handleSubmit() {
    if (!contactPhone.trim()) {
      setActiveTab("info");
      setFormError("El teléfono de contacto es obligatorio");
      return;
    }
    const primaryTrade = trades.find((t) => t.isPrimary);
    if (!primaryTrade?.tradeId) {
      setActiveTab("trades");
      setFormError("Elegí un oficio principal");
      return;
    }
    if (selectedDepartmentIds.size === 0) {
      setActiveTab("coverage");
      setFormError("Elegí al menos una zona de cobertura");
      return;
    }
    setFormError(null);
    submitChanges({
      bio: serializeBio(bioState),
      contactPhone,
      primaryTradeId: primaryTrade.tradeId,
      primaryYearsExperience: primaryTrade.yearsExperience || undefined,
      primarySpecialties: primaryTrade.specialties,
      secondaryTrades: trades
        .filter((t) => !t.isPrimary && t.tradeId)
        .map((t) => ({
          tradeId: t.tradeId,
          yearsExperience: t.yearsExperience || undefined,
          specialties: t.specialties,
        })),
      departmentIds: Array.from(selectedDepartmentIds),
      primaryDepartmentId: primaryDepartmentId || undefined,
    });
  }

  return (
    <div className="mt-5 pb-24 lg:pb-0">
      {/* Tab nav */}
      <nav className="flex overflow-x-auto border-b border-sb-border">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => {
              setActiveTab(tab.key);
              setFormError(null);
            }}
            className={`shrink-0 px-4 py-3 text-[14px] font-medium transition-colors ${
              activeTab === tab.key
                ? "border-b-2 border-sb-blue text-sb-blue"
                : "text-sb-muted hover:text-sb-text"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {/* Tab content */}
      <div className="mt-5">
        {/* --- Información --- */}
        {activeTab === "info" && (
          <section className="flex flex-col gap-5">
            <div>
              <p className="mb-2 text-[13px] font-medium text-sb-muted">
                Foto de perfil
              </p>
              <AvatarUploader
                avatarUrl={avatarUrl}
                fullName=""
                size="md"
                onUpload={(url) => {
                  setAvatarUrl(url);
                  setAvatarError(null);
                }}
                onError={(err) => setAvatarError(err)}
              />
              {avatarError && (
                <p className="mt-1.5 text-[13px] text-sb-error">{avatarError}</p>
              )}
            </div>

            <div>
              <p className="mb-2 text-[13px] font-medium text-sb-muted">
                Descripción
              </p>
              <BioBuilder bio={bioState} onChange={setBioState} />
            </div>

            <div>
              <label
                htmlFor="contactPhone"
                className="mb-1.5 block text-[13px] font-medium text-sb-muted"
              >
                Teléfono de contacto{" "}
                <span className="text-sb-error">*</span>
              </label>
              <input
                id="contactPhone"
                type="tel"
                value={contactPhone}
                onChange={(e) => {
                  setContactPhone(e.target.value);
                  if (formError) setFormError(null);
                }}
                placeholder="+54 9 11 1234-5678"
                className="w-full rounded-[10px] border-[1.5px] border-sb-border px-3.5 py-3 text-[15px] text-sb-text outline-none focus:border-sb-blue focus:ring-2 focus:ring-sb-blue/10"
              />
              <p className="mt-1 text-[12px] text-sb-muted">
                Este número es el que verán los clientes.
              </p>
              {formError && (
                <p className="mt-1.5 text-[13px] text-sb-error">{formError}</p>
              )}
            </div>
          </section>
        )}

        {/* --- Oficios --- */}
        {activeTab === "trades" && (
          <section className="flex flex-col gap-4">
            {trades.length === 0 && (
              <p className="text-[14px] text-sb-muted">
                No tenés oficios todavía. Agregá uno abajo.
              </p>
            )}

            <div className="flex flex-col gap-3">
              {trades.map((trade) => {
                const tradeName = tradeLookup.get(trade.tradeId)?.name ?? "";
                const availableSpecialties = trade.tradeId
                  ? getSpecialtiesForTrade(tradeName)
                  : [];
                return (
                  <div
                    key={trade.localId}
                    className="rounded-xl border border-sb-border bg-white p-4"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <select
                        value={trade.tradeId}
                        onChange={(e) =>
                          updateTradeField(trade.localId, {
                            tradeId: e.target.value,
                          })
                        }
                        className="flex-1 rounded-[8px] border border-sb-border px-3 py-2 text-[14px] text-sb-text focus:border-sb-blue focus:outline-none"
                      >
                        <option value="">Elegí un oficio</option>
                        {tradeCategories.map((category) => (
                          <optgroup key={category.id} label={category.name}>
                            {category.trades.map((t) => (
                              <option
                                key={t.id}
                                value={t.id}
                                disabled={
                                  usedTradeIds.has(t.id) &&
                                  t.id !== trade.tradeId
                                }
                              >
                                {t.name}
                              </option>
                            ))}
                          </optgroup>
                        ))}
                      </select>
                      {trade.isPrimary && (
                        <span className="shrink-0 rounded-full bg-sb-card-blue px-2.5 py-0.5 text-[12px] font-medium text-sb-blue">
                          Principal
                        </span>
                      )}
                    </div>

                    <div className="mt-3 flex items-center gap-3">
                      <input
                        type="number"
                        min={0}
                        max={80}
                        placeholder="Años de experiencia"
                        value={trade.yearsExperience}
                        onChange={(e) =>
                          updateTradeField(trade.localId, {
                            yearsExperience: e.target.value,
                          })
                        }
                        className="w-40 rounded-[8px] border border-sb-border px-3 py-2 text-[14px] text-sb-text focus:border-sb-blue focus:outline-none"
                      />
                      <span className="text-[13px] text-sb-muted">
                        años de experiencia
                      </span>
                    </div>

                    {availableSpecialties.length > 0 && (
                      <div className="mt-3">
                        <p className="text-[12px] font-medium text-sb-muted">
                          Especialidades{" "}
                          <span className="font-normal text-sb-muted/60">(opcional)</span>
                        </p>
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {availableSpecialties.map((specialty) => {
                            const selected = trade.specialties.includes(specialty);
                            return (
                              <button
                                key={specialty}
                                type="button"
                                onClick={() =>
                                  toggleTradeSpecialty(trade.localId, specialty)
                                }
                                className={`rounded-full border px-3 py-1 text-[12px] transition-colors ${
                                  selected
                                    ? "border-sb-blue bg-sb-card-blue text-sb-blue"
                                    : "border-sb-border bg-white text-sb-muted"
                                }`}
                              >
                                {specialty}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {!trade.isPrimary && (
                      <div className="mt-3 flex items-center gap-4 border-t border-sb-border pt-3">
                        <button
                          type="button"
                          onClick={() => makePrimary(trade.localId)}
                          className="text-[13px] font-medium text-sb-blue"
                        >
                          Hacer principal
                        </button>
                        <button
                          type="button"
                          onClick={() => removeTrade(trade.localId)}
                          className="text-[13px] font-medium text-sb-error"
                        >
                          Quitar
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {trades.length < MAX_TRADES && (
              <div className="rounded-xl border border-dashed border-sb-border p-4">
                <p className="mb-3 text-[13px] font-medium text-sb-muted">
                  Agregar oficio
                </p>
                <select
                  value={addTradeId}
                  onChange={(e) => setAddTradeId(e.target.value)}
                  className="w-full rounded-[8px] border border-sb-border px-3 py-2 text-[14px] text-sb-text focus:border-sb-blue focus:outline-none"
                >
                  <option value="">Elegí un oficio</option>
                  {tradeCategories.map((category) => (
                    <optgroup key={category.id} label={category.name}>
                      {category.trades.map((t) => (
                        <option
                          key={t.id}
                          value={t.id}
                          disabled={usedTradeIds.has(t.id)}
                        >
                          {t.name}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
                <div className="mt-2 flex items-center gap-2">
                  <input
                    type="number"
                    min={0}
                    max={80}
                    placeholder="Años de exp."
                    value={addYears}
                    onChange={(e) => setAddYears(e.target.value)}
                    className="w-36 rounded-[8px] border border-sb-border px-3 py-2 text-[14px] text-sb-text focus:border-sb-blue focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={addTrade}
                    disabled={!addTradeId}
                    className="flex h-10 items-center justify-center rounded-full bg-sb-blue px-4 text-[14px] font-medium text-white disabled:opacity-40"
                  >
                    Agregar
                  </button>
                </div>
              </div>
            )}

            {formError && (
              <p className="text-[13px] text-sb-error">{formError}</p>
            )}

            {trades.length === 0 && (
              <p className="text-[12px] text-sb-muted">
                {tradeLookup.size} oficios disponibles
              </p>
            )}
          </section>
        )}

        {/* --- Cobertura --- */}
        {activeTab === "coverage" && (
          <section className="flex flex-col gap-4">
            <div>
              <p className="mb-2 text-[13px] font-medium text-sb-muted">
                Agregar zona de cobertura
              </p>
              <div className="flex flex-col gap-2 sm:flex-row">
                <select
                  value={currentProvinceId}
                  onChange={(e) => {
                    setCurrentProvinceId(e.target.value);
                    setCurrentDepartmentId("");
                  }}
                  className="flex-1 rounded-[8px] border border-sb-border px-3 py-2 text-[14px] text-sb-text focus:border-sb-blue focus:outline-none"
                >
                  {provinces.map((province) => (
                    <option key={province.id} value={province.id}>
                      {province.name}
                    </option>
                  ))}
                </select>
                <select
                  value={currentDepartmentId}
                  onChange={(e) => setCurrentDepartmentId(e.target.value)}
                  className="flex-1 rounded-[8px] border border-sb-border px-3 py-2 text-[14px] text-sb-text focus:border-sb-blue focus:outline-none"
                >
                  <option value="">Departamento</option>
                  {currentProvince?.departments.map((dep) => (
                    <option
                      key={dep.id}
                      value={dep.id}
                      disabled={selectedDepartmentIds.has(dep.id)}
                    >
                      {dep.name}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={addDepartment}
                  disabled={!currentDepartmentId}
                  className="h-10 shrink-0 rounded-full bg-sb-blue px-4 text-[14px] font-medium text-white disabled:opacity-40"
                >
                  Agregar
                </button>
              </div>
            </div>

            {selectedDepartmentIds.size > 0 ? (
              <div>
                <p className="mb-2 text-[13px] font-medium text-sb-muted">
                  Zonas de cobertura ({selectedDepartmentIds.size})
                </p>
                <div className="flex flex-wrap gap-2">
                  {Array.from(selectedDepartmentIds).map((id) => {
                    const dep = departmentLookup.get(id);
                    if (!dep) return null;
                    const isPrimary = primaryDepartmentId === id;
                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() => removeDepartment(id)}
                        className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[13px] transition-colors hover:border-sb-error hover:text-sb-error ${
                          isPrimary
                            ? "border-sb-blue bg-sb-card-blue text-sb-blue"
                            : "border-sb-border bg-white text-sb-text"
                        }`}
                      >
                        {isPrimary && (
                          <svg
                            width="12"
                            height="12"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                            className="shrink-0"
                          >
                            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                          </svg>
                        )}
                        {dep.name}
                        <svg
                          width="12"
                          height="12"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                        >
                          <line x1="18" y1="6" x2="6" y2="18" />
                          <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              <p className="text-[14px] text-sb-muted">
                No tenés zonas seleccionadas todavía.
              </p>
            )}

            {/* Zona principal */}
            {selectedDepartmentIds.size > 0 && (
              <div className="rounded-xl border border-sb-border bg-white p-4">
                <label
                  htmlFor="primaryDepartment"
                  className="block text-[14px] font-semibold text-sb-text"
                >
                  ¿De dónde sos?
                </label>
                <p className="mt-0.5 text-[12px] text-sb-muted">
                  Esta zona aparece en tu card y en tu perfil. Tiene que ser
                  una de tus zonas de cobertura.
                </p>
                <select
                  id="primaryDepartment"
                  value={primaryDepartmentId}
                  onChange={(e) => setPrimaryDepartmentId(e.target.value)}
                  className="mt-3 w-full rounded-[8px] border border-sb-border px-3 py-2 text-[14px] text-sb-text focus:border-sb-blue focus:outline-none"
                >
                  <option value="">Sin zona principal</option>
                  {Array.from(selectedDepartmentIds).map((id) => {
                    const dep = departmentLookup.get(id);
                    if (!dep) return null;
                    return (
                      <option key={id} value={id}>
                        {dep.name} ({dep.provinceName})
                      </option>
                    );
                  })}
                </select>
              </div>
            )}

            {formError && (
              <p className="text-[13px] text-sb-error">{formError}</p>
            )}
          </section>
        )}

        {/* --- Fotos --- */}
        {activeTab === "photos" && (
          <section>
            <p className="mb-3 text-[13px] text-sb-muted">
              Los perfiles con fotos reciben más contactos.
            </p>
            <PortfolioPhotoManager initialPhotos={initialPhotos} />
          </section>
        )}
      </div>

      {/* Save button — sticky on mobile, static on desktop */}
      {activeTab !== "photos" && (
        <>
          {/* Mobile: fixed at bottom */}
          <div className="fixed inset-x-0 bottom-0 z-10 border-t border-sb-border bg-white/95 px-4 pb-6 pt-4 backdrop-blur-sm lg:hidden">
            {formError && (
              <p className="mb-2 text-center text-[13px] text-sb-error">
                {formError}
              </p>
            )}
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex h-[52px] w-full items-center justify-center gap-2 rounded-full bg-sb-blue text-[15px] font-medium text-white disabled:opacity-50"
            >
              {isSubmitting && <Spinner className="h-4 w-4" />}
              {isSubmitting ? "Guardando..." : "Guardar cambios"}
            </button>
          </div>

          {/* Desktop: static */}
          <div className="mt-8 hidden lg:block">
            {formError && (
              <p className="mb-2 text-[13px] text-sb-error">{formError}</p>
            )}
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex h-[52px] w-full items-center justify-center gap-2 rounded-full bg-sb-blue text-[15px] font-medium text-white disabled:opacity-50"
            >
              {isSubmitting && <Spinner className="h-4 w-4" />}
              {isSubmitting ? "Guardando..." : "Guardar cambios"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
