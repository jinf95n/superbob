"use client";

import { useMemo, useState, useTransition, type ChangeEvent } from "react";
import { TradeCategoryWithTrades } from "@/modules/trades/queries";
import { ProvinceWithDepartments } from "@/modules/geography/queries";
import { createProfessionalProfileAction } from "@/modules/professionals/actions";
import { uploadAvatarAction } from "@/modules/users/actions";
import { Spinner } from "@/components/ui/Spinner";
import { useServerAction } from "@/lib/hooks/useServerAction";

type SecondaryTradeRow = {
  tradeId: string;
  yearsExperience: string;
};

type OnboardingWizardProps = {
  accountPhone: string | null;
  initialAvatarUrl: string | null;
  tradeCategories: TradeCategoryWithTrades[];
  provinces: ProvinceWithDepartments[];
};

const MAX_SECONDARY_TRADES = 4;

export function OnboardingWizard({
  accountPhone,
  initialAvatarUrl,
  tradeCategories,
  provinces,
}: OnboardingWizardProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [formError, setFormError] = useState<string | null>(null);

  // Paso 1
  const [bio, setBio] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [avatarUrl, setAvatarUrl] = useState(initialAvatarUrl);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [isUploadingAvatar, startAvatarUpload] = useTransition();

  // Paso 2
  const [primaryTradeId, setPrimaryTradeId] = useState("");
  const [primaryYearsExperience, setPrimaryYearsExperience] = useState("");
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

  // createProfessionalProfileAction redirige server-side cuando termina bien
  // (no romper esa lógica), así que del lado del cliente solo hay pending y
  // error visibles: el éxito se manifiesta como la navegación misma.
  const {
    execute: submitProfile,
    isPending: isSubmitting,
    isError: isSubmitError,
    error: submitError,
  } = useServerAction(createProfessionalProfileAction);

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
      { tradeId: "", yearsExperience: "" },
    ]);
  }

  function updateSecondaryTrade(
    index: number,
    patch: Partial<SecondaryTradeRow>,
  ) {
    setSecondaryTrades((prev) =>
      prev.map((trade, i) => (i === index ? { ...trade, ...patch } : trade)),
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

  function handleSubmit() {
    if (selectedDepartmentIds.size === 0) {
      setFormError("Elegí al menos una zona de cobertura");
      return;
    }
    setFormError(null);

    submitProfile({
      bio: bio || undefined,
      contactPhone: contactPhone || undefined,
      primaryTradeId,
      primaryYearsExperience: primaryYearsExperience || undefined,
      secondaryTrades: secondaryTrades
        .filter((trade) => trade.tradeId)
        .map((trade) => ({
          tradeId: trade.tradeId,
          yearsExperience: trade.yearsExperience || undefined,
        })),
      departmentIds: Array.from(selectedDepartmentIds),
    });
  }

  return (
    <div className="mt-6">
      <p className="text-sm font-medium text-neutral-500">Paso {step} de 3</p>

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
            <textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              maxLength={500}
              rows={4}
              className="mt-1 w-full rounded border border-neutral-300 px-3 py-2"
            />
          </div>

          <div>
            <label
              htmlFor="contactPhone"
              className="block text-sm font-medium"
            >
              Teléfono de contacto
            </label>
            <p className="text-xs text-neutral-500">
              {accountPhone
                ? `Tu teléfono de cuenta es ${accountPhone}. Completá esto solo si querés que los clientes te contacten a otro número.`
                : "Completá esto si querés que los clientes te contacten a un número distinto al de tu cuenta."}
            </p>
            <input
              id="contactPhone"
              type="tel"
              value={contactPhone}
              onChange={(e) => setContactPhone(e.target.value)}
              placeholder="+54 9 11 1234-5678"
              className="mt-1 w-full rounded border border-neutral-300 px-3 py-2"
            />
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
              onChange={(e) => setPrimaryTradeId(e.target.value)}
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
          </div>

          <div>
            <p className="text-sm font-medium">
              Oficios secundarios (hasta {MAX_SECONDARY_TRADES})
            </p>
            <div className="mt-2 flex flex-col gap-3">
              {secondaryTrades.map((trade, index) => (
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
                </div>
              ))}
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
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex w-full items-center justify-center gap-2 rounded bg-neutral-900 px-4 py-2 text-white transition-colors duration-150 ease-in-out disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting && <Spinner className="h-4 w-4" />}
              {isSubmitting ? "Guardando..." : "Finalizar"}
            </button>
          </div>
        </section>
      )}
    </div>
  );
}
