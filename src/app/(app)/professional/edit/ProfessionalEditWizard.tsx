"use client";

import { useMemo, useState, useTransition, type ChangeEvent } from "react";
import { TradeCategoryWithTrades } from "@/modules/trades/queries";
import { ProvinceWithDepartments } from "@/modules/geography/queries";
import { updateProfessionalProfileAction } from "@/modules/professionals/actions";
import { ProfessionalProfileForEdit } from "@/modules/professionals/types";
import { uploadAvatarAction } from "@/modules/users/actions";
import { PortfolioPhotoItem } from "@/modules/photos/types";
import { PortfolioPhotoManager } from "@/components/shared/PortfolioPhotoManager";

const PRIMARY_BUTTON_CLASSES =
  "flex h-[52px] w-full items-center justify-center rounded-full bg-sb-blue text-[15px] font-medium text-white disabled:opacity-50";
const SECONDARY_BUTTON_CLASSES =
  "flex h-[52px] w-full items-center justify-center rounded-full border border-sb-border text-[15px] font-medium text-sb-text";

type SecondaryTradeRow = {
  tradeId: string;
  yearsExperience: string;
};

type ProfessionalEditWizardProps = {
  profile: ProfessionalProfileForEdit;
  accountPhone: string | null;
  initialAvatarUrl: string | null;
  tradeCategories: TradeCategoryWithTrades[];
  provinces: ProvinceWithDepartments[];
  initialPhotos: PortfolioPhotoItem[];
};

const MAX_SECONDARY_TRADES = 4;

export function ProfessionalEditWizard({
  profile,
  accountPhone,
  initialAvatarUrl,
  tradeCategories,
  provinces,
  initialPhotos,
}: ProfessionalEditWizardProps) {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [formError, setFormError] = useState<string | null>(null);

  // Paso 1
  const [bio, setBio] = useState(profile.bio ?? "");
  const [contactPhone, setContactPhone] = useState(profile.contactPhone ?? "");
  const [avatarUrl, setAvatarUrl] = useState(initialAvatarUrl);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [isUploadingAvatar, startAvatarUpload] = useTransition();

  // Paso 2
  const [primaryTradeId, setPrimaryTradeId] = useState(
    profile.primaryTradeId ?? "",
  );
  const [primaryYearsExperience, setPrimaryYearsExperience] = useState(
    profile.primaryYearsExperience?.toString() ?? "",
  );
  const [secondaryTrades, setSecondaryTrades] = useState<SecondaryTradeRow[]>(
    profile.secondaryTrades.map((trade) => ({
      tradeId: trade.tradeId,
      yearsExperience: trade.yearsExperience?.toString() ?? "",
    })),
  );

  // Paso 3
  const [currentProvinceId, setCurrentProvinceId] = useState(
    provinces[0]?.id ?? "",
  );
  const [selectedDepartmentIds, setSelectedDepartmentIds] = useState<
    Set<string>
  >(new Set(profile.departmentIds));

  const [isSubmitting, startSubmit] = useTransition();

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
    const formData = new FormData();
    formData.set("avatar", file);

    startAvatarUpload(async () => {
      const result = await uploadAvatarAction(formData);
      if (result.error) {
        setAvatarError(result.error);
        return;
      }
      if (result.avatarUrl) {
        setAvatarUrl(result.avatarUrl);
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

  function goToStep4() {
    if (selectedDepartmentIds.size === 0) {
      setFormError("Elegí al menos una zona de cobertura");
      return;
    }
    setFormError(null);
    setStep(4);
  }

  function handleSubmit() {
    setFormError(null);

    startSubmit(async () => {
      const result = await updateProfessionalProfileAction({
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

      if (result?.error) {
        setFormError(result.error);
      }
    });
  }

  return (
    <div className="mt-6">
      <p className="text-sm font-medium text-sb-muted">Paso {step} de 4</p>

      {step === 1 && (
        <section className="mt-4 flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium text-sb-text">
              Foto de perfil
            </label>
            <div className="mt-2 flex items-center gap-3">
              {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={avatarUrl}
                  alt="Foto de perfil"
                  className="h-16 w-16 rounded-full object-cover"
                />
              ) : (
                <div className="h-16 w-16 rounded-full bg-sb-card-blue" />
              )}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleAvatarChange}
                disabled={isUploadingAvatar}
                className="text-sm"
              />
            </div>
            {isUploadingAvatar && (
              <p className="mt-1 text-sm text-sb-muted">Subiendo...</p>
            )}
            {avatarError && (
              <p className="mt-1 text-sm text-sb-error">{avatarError}</p>
            )}
          </div>

          <div>
            <label htmlFor="bio" className="block text-sm font-medium text-sb-text">
              Contanos sobre tu trabajo
            </label>
            <textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              maxLength={500}
              rows={4}
              className="mt-1 w-full rounded border border-sb-border px-3 py-2 text-[15px] text-sb-text focus:border-sb-blue focus:outline-none"
            />
          </div>

          <div>
            <label
              htmlFor="contactPhone"
              className="block text-sm font-medium text-sb-text"
            >
              Teléfono de contacto
            </label>
            <p className="text-xs text-sb-muted">
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
              className="mt-1 w-full rounded border border-sb-border px-3 py-2 text-[15px] text-sb-text focus:border-sb-blue focus:outline-none"
            />
          </div>

          <button type="button" onClick={goToStep2} className={PRIMARY_BUTTON_CLASSES}>
            Siguiente
          </button>
        </section>
      )}

      {step === 2 && (
        <section className="mt-4 flex flex-col gap-4">
          <div>
            <label
              htmlFor="primaryTrade"
              className="block text-sm font-medium text-sb-text"
            >
              Oficio principal
            </label>
            <select
              id="primaryTrade"
              value={primaryTradeId}
              onChange={(e) => setPrimaryTradeId(e.target.value)}
              className="mt-1 w-full rounded border border-sb-border px-3 py-2 text-[15px] text-sb-text"
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
              className="mt-2 block text-sm font-medium text-sb-text"
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
              className="mt-1 w-full rounded border border-sb-border px-3 py-2 text-[15px] text-sb-text"
            />
          </div>

          <div>
            <p className="text-sm font-medium text-sb-text">
              Oficios secundarios (hasta {MAX_SECONDARY_TRADES})
            </p>
            <div className="mt-2 flex flex-col gap-3">
              {secondaryTrades.map((trade, index) => (
                <div
                  key={index}
                  className="flex flex-col gap-2 rounded border border-sb-border p-3"
                >
                  <select
                    value={trade.tradeId}
                    onChange={(e) =>
                      updateSecondaryTrade(index, { tradeId: e.target.value })
                    }
                    className="w-full rounded border border-sb-border px-3 py-2 text-[15px] text-sb-text"
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
                      className="flex-1 rounded border border-sb-border px-3 py-2 text-[15px] text-sb-text"
                    />
                    <button
                      type="button"
                      onClick={() => removeSecondaryTrade(index)}
                      className="text-sm text-sb-error"
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
                className="mt-2 text-sm font-medium text-sb-blue underline"
              >
                + Agregar oficio secundario
              </button>
            )}
          </div>

          {formError && <p className="text-sm text-sb-error">{formError}</p>}

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setStep(1)}
              className={SECONDARY_BUTTON_CLASSES}
            >
              Atrás
            </button>
            <button type="button" onClick={goToStep3} className={PRIMARY_BUTTON_CLASSES}>
              Siguiente
            </button>
          </div>
        </section>
      )}

      {step === 3 && (
        <section className="mt-4 flex flex-col gap-4">
          <div>
            <label htmlFor="province" className="block text-sm font-medium text-sb-text">
              Provincia
            </label>
            <select
              id="province"
              value={currentProvinceId}
              onChange={(e) => setCurrentProvinceId(e.target.value)}
              className="mt-1 w-full rounded border border-sb-border px-3 py-2 text-[15px] text-sb-text"
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
              <p className="text-sm font-medium text-sb-text">
                Departamentos de {currentProvince.name}
              </p>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {currentProvince.departments.map((department) => (
                  <label
                    key={department.id}
                    className="flex items-center gap-2 text-sm text-sb-text"
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
                <p className="mt-1 text-sm text-sb-muted">
                  Todavía no hay departamentos cargados para esta provincia.
                </p>
              )}
            </div>
          )}

          {selectedDepartmentIds.size > 0 && (
            <div>
              <p className="text-sm font-medium text-sb-text">Zonas seleccionadas</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {Array.from(selectedDepartmentIds).map((departmentId) => {
                  const department = departmentLookup.get(departmentId);
                  if (!department) return null;
                  return (
                    <button
                      key={departmentId}
                      type="button"
                      onClick={() => toggleDepartment(departmentId)}
                      className="rounded-full bg-sb-card-blue px-3 py-1 text-sm text-sb-blue"
                    >
                      {department.name} ({department.provinceName}) ✕
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {formError && <p className="text-sm text-sb-error">{formError}</p>}

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setStep(2)}
              className={SECONDARY_BUTTON_CLASSES}
            >
              Atrás
            </button>
            <button type="button" onClick={goToStep4} className={PRIMARY_BUTTON_CLASSES}>
              Siguiente
            </button>
          </div>
        </section>
      )}

      {step === 4 && (
        <section className="mt-4 flex flex-col gap-4">
          <div>
            <p className="text-sm font-medium text-sb-text">
              Fotos de trabajos realizados
            </p>
            <p className="text-xs text-sb-muted">
              Los perfiles con fotos reciben más contactos.
            </p>
            <div className="mt-3">
              <PortfolioPhotoManager initialPhotos={initialPhotos} />
            </div>
          </div>

          {formError && <p className="text-sm text-sb-error">{formError}</p>}

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setStep(3)}
              className={SECONDARY_BUTTON_CLASSES}
            >
              Atrás
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className={PRIMARY_BUTTON_CLASSES}
            >
              {isSubmitting ? "Guardando..." : "Guardar cambios"}
            </button>
          </div>
        </section>
      )}
    </div>
  );
}
