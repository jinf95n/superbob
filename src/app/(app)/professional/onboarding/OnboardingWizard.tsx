"use client";

import { useMemo, useState, useTransition, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { TradeCategoryWithTrades } from "@/modules/trades/queries";
import { ProvinceWithDepartments } from "@/modules/geography/queries";
import { createProfessionalProfileAction } from "@/modules/professionals/actions";
import { uploadAvatarAction } from "@/modules/users/actions";
import { Spinner } from "@/components/ui/Spinner";
import { useServerAction } from "@/lib/hooks/useServerAction";
import { BioBuilder } from "@/components/shared/BioBuilder";
import { PortfolioPhotoManager } from "@/components/shared/PortfolioPhotoManager";
import { ProfessionalBio, parseBio, serializeBio } from "@/lib/bioTypes";
import { getSpecialtiesForTrade } from "@/lib/tradeSpecialties";

type SecondaryTradeRow = {
  tradeId: string;
  yearsExperience: string;
  specialties: string[];
};

type OnboardingWizardProps = {
  initialAvatarUrl: string | null;
  tradeCategories: TradeCategoryWithTrades[];
  provinces: ProvinceWithDepartments[];
};

const MAX_SECONDARY_TRADES = 4;

export function OnboardingWizard({
  initialAvatarUrl,
  tradeCategories,
  provinces,
}: OnboardingWizardProps) {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [formError, setFormError] = useState<string | null>(null);

  // Paso 1
  const [bioState, setBioState] = useState<ProfessionalBio>(() => parseBio(null));
  const [contactPhone, setContactPhone] = useState("");
  const [contactPhoneError, setContactPhoneError] = useState<string | null>(
    null,
  );
  const [avatarUrl, setAvatarUrl] = useState(initialAvatarUrl);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [isUploadingAvatar, startAvatarUpload] = useTransition();

  // Paso 2
  const [primaryTradeId, setPrimaryTradeId] = useState("");
  const [primaryYearsExperience, setPrimaryYearsExperience] = useState("");
  const [primarySpecialties, setPrimarySpecialties] = useState<string[]>([]);
  const [secondaryTrades, setSecondaryTrades] = useState<SecondaryTradeRow[]>(
    [],
  );

  // Paso 3
  const [currentProvinceId, setCurrentProvinceId] = useState(
    provinces[0]?.id ?? "",
  );
  const [selectedDepartmentIds, setSelectedDepartmentIds] = useState<
    Set<string>
  >(new Set());

  // Paso 4
  const [professionalId, setProfessionalId] = useState<string | null>(null);

  const {
    execute: submitProfile,
    isPending: isSubmitting,
    isError: isSubmitError,
    error: submitError,
  } = useServerAction(createProfessionalProfileAction, {
    onSuccess: (result) => {
      const typed = result as { professionalId?: string };
      if (typed.professionalId) {
        setProfessionalId(typed.professionalId);
        setStep(4);
      }
    },
  });

  // Lookup tradeId → { name, slug } para obtener especialidades disponibles
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

  const primaryTradeSpecialties = primaryTradeId
    ? getSpecialtiesForTrade(tradeLookup.get(primaryTradeId)?.name ?? "")
    : [];

  function handleAvatarChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setAvatarError(null);
    const previewUrl = URL.createObjectURL(file);
    setAvatarUrl(previewUrl);

    const formData = new FormData();
    formData.set("avatar", file);

    startAvatarUpload(async () => {
      try {
        const result = await uploadAvatarAction(formData);
        if (result.error) {
          setAvatarError(result.error);
          setAvatarUrl(initialAvatarUrl);
          return;
        }
        if (result.avatarUrl) {
          setAvatarUrl(result.avatarUrl);
        }
      } catch {
        setAvatarError("No pudimos subir la imagen, intentá de nuevo");
        setAvatarUrl(initialAvatarUrl);
      } finally {
        URL.revokeObjectURL(previewUrl);
      }
    });
  }

  function addSecondaryTrade() {
    if (secondaryTrades.length >= MAX_SECONDARY_TRADES) return;
    setSecondaryTrades((prev) => [
      ...prev,
      { tradeId: "", yearsExperience: "", specialties: [] },
    ]);
  }

  function updateSecondaryTrade(
    index: number,
    patch: Partial<SecondaryTradeRow>,
  ) {
    setSecondaryTrades((prev) =>
      prev.map((trade, i) => {
        if (i !== index) return trade;
        // Si cambia el oficio, resetear especialidades
        if (patch.tradeId !== undefined && patch.tradeId !== trade.tradeId) {
          return { ...trade, ...patch, specialties: [] };
        }
        return { ...trade, ...patch };
      }),
    );
  }

  function toggleSecondarySpecialty(index: number, specialty: string) {
    setSecondaryTrades((prev) =>
      prev.map((trade, i) => {
        if (i !== index) return trade;
        const has = trade.specialties.includes(specialty);
        return {
          ...trade,
          specialties: has
            ? trade.specialties.filter((s) => s !== specialty)
            : [...trade.specialties, specialty],
        };
      }),
    );
  }

  function removeSecondaryTrade(index: number) {
    setSecondaryTrades((prev) => prev.filter((_, i) => i !== index));
  }

  function toggleDepartment(departmentId: string) {
    setSelectedDepartmentIds((prev) => {
      const next = new Set(prev);
      if (next.has(departmentId)) {
        next.delete(departmentId);
      } else {
        next.add(departmentId);
      }
      return next;
    });
  }

  function goToStep2() {
    if (!contactPhone.trim()) {
      setContactPhoneError("El teléfono de contacto es obligatorio");
      return;
    }
    setContactPhoneError(null);
    setFormError(null);
    setStep(2);
  }

  function goToStep3() {
    if (!primaryTradeId) {
      setFormError("Elegí un oficio principal");
      return;
    }
    setFormError(null);
    setStep(3);
  }

  function handleCreateProfile() {
    if (selectedDepartmentIds.size === 0) {
      setFormError("Elegí al menos una zona de cobertura");
      return;
    }
    setFormError(null);

    submitProfile({
      bio: serializeBio(bioState),
      contactPhone,
      primaryTradeId,
      primaryYearsExperience: primaryYearsExperience || undefined,
      primarySpecialties,
      secondaryTrades: secondaryTrades
        .filter((trade) => trade.tradeId)
        .map((trade) => ({
          tradeId: trade.tradeId,
          yearsExperience: trade.yearsExperience || undefined,
          specialties: trade.specialties,
        })),
      departmentIds: Array.from(selectedDepartmentIds),
    });
  }

  function finishOnboarding() {
    router.push("/professional/edit?welcome=1");
  }

  return (
    <div className="mt-6">
      <p className="text-sm font-medium text-neutral-500">Paso {step} de 4</p>

      {step === 1 && (
        <section className="mt-4 flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium">
              Foto de perfil
            </label>
            <div className="mt-2 flex items-center gap-3">
              <div className="relative h-16 w-16 shrink-0">
                {avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={avatarUrl}
                    alt="Foto de perfil"
                    className="h-16 w-16 rounded-full object-cover"
                  />
                ) : (
                  <div className="h-16 w-16 rounded-full bg-neutral-200" />
                )}
                {isUploadingAvatar && (
                  <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40">
                    <Spinner className="h-6 w-6 text-white" />
                  </div>
                )}
              </div>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleAvatarChange}
                disabled={isUploadingAvatar}
                className="text-sm"
              />
            </div>
            {avatarError && (
              <p className="mt-1 text-sm text-red-600">{avatarError}</p>
            )}
          </div>

          <div>
            <label htmlFor="bio" className="block text-sm font-medium">
              Contanos sobre tu trabajo
            </label>
            <div className="mt-2">
              <BioBuilder bio={bioState} onChange={setBioState} />
            </div>
          </div>

          <div>
            <label
              htmlFor="contactPhone"
              className="block text-sm font-medium"
            >
              Teléfono de contacto <span className="text-sb-error">*</span>
            </label>
            <input
              id="contactPhone"
              type="tel"
              value={contactPhone}
              onChange={(e) => {
                setContactPhone(e.target.value);
                if (contactPhoneError) setContactPhoneError(null);
              }}
              placeholder="+54 9 11 1234-5678"
              className="mt-1 w-full rounded border border-neutral-300 px-3 py-2"
            />
            <p className="mt-1 text-[12px] text-sb-muted">
              Este número es el que verán los clientes para contactarte.
            </p>
            {contactPhoneError && (
              <p className="mt-1 text-[13px] text-sb-error">
                {contactPhoneError}
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={goToStep2}
            className="w-full rounded bg-neutral-900 px-4 py-2 text-white"
          >
            Siguiente
          </button>
        </section>
      )}

      {step === 2 && (
        <section className="mt-4 flex flex-col gap-4">
          <div>
            <label
              htmlFor="primaryTrade"
              className="block text-sm font-medium"
            >
              Oficio principal
            </label>
            <select
              id="primaryTrade"
              value={primaryTradeId}
              onChange={(e) => {
                setPrimaryTradeId(e.target.value);
                setPrimarySpecialties([]);
              }}
              className="mt-1 w-full rounded border border-neutral-300 px-3 py-2"
            >
              <option value="">Elegí un oficio</option>
              {tradeCategories.map((category) => (
                <optgroup key={category.id} label={category.name}>
                  {category.trades.map((trade) => (
                    <option key={trade.id} value={trade.id}>
                      {trade.name}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>

            <label
              htmlFor="primaryYears"
              className="mt-2 block text-sm font-medium"
            >
              Años de experiencia
            </label>
            <input
              id="primaryYears"
              type="number"
              min={0}
              max={80}
              value={primaryYearsExperience}
              onChange={(e) => setPrimaryYearsExperience(e.target.value)}
              className="mt-1 w-full rounded border border-neutral-300 px-3 py-2"
            />

            {primaryTradeSpecialties.length > 0 && (
              <div className="mt-3">
                <p className="text-[13px] font-medium text-neutral-600">
                  Especialidades <span className="font-normal text-neutral-400">(opcional)</span>
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {primaryTradeSpecialties.map((specialty) => {
                    const selected = primarySpecialties.includes(specialty);
                    return (
                      <button
                        key={specialty}
                        type="button"
                        onClick={() => {
                          setPrimarySpecialties((prev) =>
                            selected
                              ? prev.filter((s) => s !== specialty)
                              : [...prev, specialty],
                          );
                        }}
                        className={`rounded-full border px-3 py-1 text-[13px] transition-colors ${
                          selected
                            ? "border-sb-blue bg-sb-card-blue text-sb-blue"
                            : "border-neutral-300 bg-white text-neutral-600"
                        }`}
                      >
                        {specialty}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <div>
            <p className="text-sm font-medium">
              Oficios secundarios (hasta {MAX_SECONDARY_TRADES})
            </p>
            <div className="mt-2 flex flex-col gap-3">
              {secondaryTrades.map((trade, index) => {
                const availableSpecialties = trade.tradeId
                  ? getSpecialtiesForTrade(tradeLookup.get(trade.tradeId)?.name ?? "")
                  : [];
                return (
                  <div
                    key={index}
                    className="flex flex-col gap-2 rounded border border-neutral-200 p-3"
                  >
                    <select
                      value={trade.tradeId}
                      onChange={(e) =>
                        updateSecondaryTrade(index, { tradeId: e.target.value })
                      }
                      className="w-full rounded border border-neutral-300 px-3 py-2"
                    >
                      <option value="">Elegí un oficio</option>
                      {tradeCategories.map((category) => (
                        <optgroup key={category.id} label={category.name}>
                          {category.trades.map((t) => (
                            <option key={t.id} value={t.id}>
                              {t.name}
                            </option>
                          ))}
                        </optgroup>
                      ))}
                    </select>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={0}
                        max={80}
                        placeholder="Años de experiencia"
                        value={trade.yearsExperience}
                        onChange={(e) =>
                          updateSecondaryTrade(index, {
                            yearsExperience: e.target.value,
                          })
                        }
                        className="flex-1 rounded border border-neutral-300 px-3 py-2"
                      />
                      <button
                        type="button"
                        onClick={() => removeSecondaryTrade(index)}
                        className="text-sm text-red-600"
                      >
                        Quitar
                      </button>
                    </div>
                    {availableSpecialties.length > 0 && (
                      <div>
                        <p className="text-[12px] font-medium text-neutral-500">
                          Especialidades <span className="font-normal text-neutral-400">(opcional)</span>
                        </p>
                        <div className="mt-1.5 flex flex-wrap gap-1.5">
                          {availableSpecialties.map((specialty) => {
                            const selected = trade.specialties.includes(specialty);
                            return (
                              <button
                                key={specialty}
                                type="button"
                                onClick={() => toggleSecondarySpecialty(index, specialty)}
                                className={`rounded-full border px-2.5 py-0.5 text-[12px] transition-colors ${
                                  selected
                                    ? "border-sb-blue bg-sb-card-blue text-sb-blue"
                                    : "border-neutral-300 bg-white text-neutral-600"
                                }`}
                              >
                                {specialty}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {secondaryTrades.length < MAX_SECONDARY_TRADES && (
              <button
                type="button"
                onClick={addSecondaryTrade}
                className="mt-2 text-sm font-medium text-neutral-700 underline"
              >
                + Agregar oficio secundario
              </button>
            )}
          </div>

          {formError && <p className="text-sm text-red-600">{formError}</p>}

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="w-full rounded border border-neutral-300 px-4 py-2"
            >
              Atrás
            </button>
            <button
              type="button"
              onClick={goToStep3}
              className="w-full rounded bg-neutral-900 px-4 py-2 text-white"
            >
              Siguiente
            </button>
          </div>
        </section>
      )}

      {step === 3 && (
        <section className="mt-4 flex flex-col gap-4">
          <div>
            <label htmlFor="province" className="block text-sm font-medium">
              Provincia
            </label>
            <select
              id="province"
              value={currentProvinceId}
              onChange={(e) => setCurrentProvinceId(e.target.value)}
              className="mt-1 w-full rounded border border-neutral-300 px-3 py-2"
            >
              {provinces.map((province) => (
                <option key={province.id} value={province.id}>
                  {province.name}
                </option>
              ))}
            </select>
          </div>

          {currentProvince && (
            <div>
              <p className="text-sm font-medium">
                Departamentos de {currentProvince.name}
              </p>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {currentProvince.departments.map((department) => (
                  <label
                    key={department.id}
                    className="flex items-center gap-2 text-sm"
                  >
                    <input
                      type="checkbox"
                      checked={selectedDepartmentIds.has(department.id)}
                      onChange={() => toggleDepartment(department.id)}
                    />
                    {department.name}
                  </label>
                ))}
              </div>
              {currentProvince.departments.length === 0 && (
                <p className="mt-1 text-sm text-neutral-500">
                  Todavía no hay departamentos cargados para esta provincia.
                </p>
              )}
            </div>
          )}

          {selectedDepartmentIds.size > 0 && (
            <div>
              <p className="text-sm font-medium">Zonas seleccionadas</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {Array.from(selectedDepartmentIds).map((departmentId) => {
                  const department = departmentLookup.get(departmentId);
                  if (!department) return null;
                  return (
                    <button
                      key={departmentId}
                      type="button"
                      onClick={() => toggleDepartment(departmentId)}
                      className="rounded bg-neutral-100 px-3 py-1 text-sm text-neutral-700"
                    >
                      {department.name} ({department.provinceName}) ✕
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {formError && <p className="text-sm text-sb-error">{formError}</p>}
          {isSubmitError && submitError && (
            <p className="text-sm text-sb-error">{submitError}</p>
          )}

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="w-full rounded border border-neutral-300 px-4 py-2"
            >
              Atrás
            </button>
            <button
              type="button"
              onClick={handleCreateProfile}
              disabled={isSubmitting}
              className="flex w-full items-center justify-center gap-2 rounded bg-neutral-900 px-4 py-2 text-white transition-colors duration-150 ease-in-out disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting && <Spinner className="h-4 w-4" />}
              {isSubmitting ? "Guardando..." : "Siguiente"}
            </button>
          </div>
        </section>
      )}

      {step === 4 && professionalId && (
        <section className="mt-4 flex flex-col gap-4">
          <div>
            <p className="text-[18px] font-semibold text-sb-text">
              Mostrá tus trabajos
            </p>
            <p className="mt-1 text-[14px] text-sb-muted">
              Las fotos de trabajos reales generan mucha más confianza que un
              perfil sin imágenes. Podés agregar hasta 10.
            </p>
          </div>

          <PortfolioPhotoManager initialPhotos={[]} />

          <p className="text-[13px] text-sb-muted/70">
            Este paso es opcional, podés agregar fotos después desde tu
            panel.{" "}
            <button
              type="button"
              onClick={finishOnboarding}
              className="text-sb-blue underline"
            >
              Omitir este paso →
            </button>
          </p>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setStep(3)}
              className="w-full rounded border border-neutral-300 px-4 py-2"
            >
              Atrás
            </button>
            <button
              type="button"
              onClick={finishOnboarding}
              className="w-full rounded bg-neutral-900 px-4 py-2 text-white"
            >
              Finalizar
            </button>
          </div>
        </section>
      )}
    </div>
  );
}
