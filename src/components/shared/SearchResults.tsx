"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { SearchableProfessional } from "@/modules/professionals/types";
import { ActiveTradeWithCategory } from "@/modules/trades/queries";
import { ProfessionalSearchCard } from "./ProfessionalSearchCard";

type SortOption = "rating" | "reviews" | "experience" | "recent";

type Filters = {
  tradeSlugs: string[];
  departments: string[];
  minRating: number;
  minExperience: number;
  minProfileScore: number;
  verifiedOnly: boolean;
  sortBy: SortOption;
};

const DEFAULT_FILTERS: Filters = {
  tradeSlugs: [],
  departments: [],
  minRating: 0,
  minExperience: 0,
  minProfileScore: 0,
  verifiedOnly: false,
  sortBy: "rating",
};

const MIN_QUERY_LENGTH = 2;

const RATING_OPTIONS: { label: string; value: number }[] = [
  { label: "Cualquiera", value: 0 },
  { label: "3★ o más", value: 3 },
  { label: "4★ o más", value: 4 },
  { label: "4.5★ o más", value: 4.5 },
];

const EXPERIENCE_OPTIONS: { label: string; value: number }[] = [
  { label: "Cualquiera", value: 0 },
  { label: "1+ año", value: 1 },
  { label: "3+ años", value: 3 },
  { label: "5+ años", value: 5 },
];

const PROFILE_SCORE_OPTIONS: { label: string; value: number }[] = [
  { label: "Cualquiera", value: 0 },
  { label: "Completo", value: 40 },
  { label: "Destacado", value: 70 },
  { label: "Top", value: 90 },
];

const SORT_OPTIONS: { label: string; value: SortOption }[] = [
  { label: "Mejor calificados", value: "rating" },
  { label: "Más reseñas", value: "reviews" },
  { label: "Más experiencia", value: "experience" },
  { label: "Más recientes", value: "recent" },
];

type SearchResultsProps = {
  professionals: SearchableProfessional[];
  trades: ActiveTradeWithCategory[];
};

export function SearchResults({ professionals, trades }: SearchResultsProps) {
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const tradeGroups = useMemo<MultiSelectGroup[]>(() => {
    const groupMap = new Map<string, MultiSelectOption[]>();
    for (const trade of trades) {
      const options = groupMap.get(trade.categoryName) ?? [];
      options.push({ value: trade.slug, label: trade.name });
      groupMap.set(trade.categoryName, options);
    }
    return Array.from(groupMap.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([categoryName, options]) => ({
        categoryName,
        options: [...options].sort((a, b) => a.label.localeCompare(b.label)),
      }));
  }, [trades]);

  const departmentOptions = useMemo(() => {
    const seen = new Set<string>();
    for (const professional of professionals) {
      for (const department of professional.departments) {
        seen.add(department);
      }
    }
    return Array.from(seen).sort((a, b) => a.localeCompare(b));
  }, [professionals]);

  const departmentGroups = useMemo<MultiSelectGroup[]>(
    () => [
      {
        categoryName: null,
        options: departmentOptions.map((department) => ({
          value: department,
          label: department,
        })),
      },
    ],
    [departmentOptions],
  );

  const filtered = useMemo(() => {
    let result = professionals;

    if (query.trim().length >= MIN_QUERY_LENGTH) {
      const q = query.toLowerCase().trim();
      result = result.filter(
        (p) =>
          p.fullName.toLowerCase().includes(q) ||
          p.allTrades.some((t) => t.toLowerCase().includes(q)) ||
          (p.primaryTrade?.categoryName.toLowerCase().includes(q) ?? false),
      );
    }

    if (filters.tradeSlugs.length > 0) {
      result = result.filter(
        (p) => p.primaryTrade && filters.tradeSlugs.includes(p.primaryTrade.slug),
      );
    }

    if (filters.departments.length > 0) {
      const selected = filters.departments.map((d) => d.toLowerCase());
      result = result.filter((p) =>
        p.departments.some((d) => selected.includes(d.toLowerCase())),
      );
    }

    if (filters.minRating > 0) {
      result = result.filter((p) => p.averageRating >= filters.minRating);
    }

    if (filters.minExperience > 0) {
      result = result.filter((p) => p.yearsExperience >= filters.minExperience);
    }

    if (filters.minProfileScore > 0) {
      result = result.filter((p) => p.profileScore >= filters.minProfileScore);
    }

    if (filters.verifiedOnly) {
      result = result.filter((p) => p.isVerified);
    }

    return [...result].sort((a, b) => {
      switch (filters.sortBy) {
        case "rating":
          return b.averageRating - a.averageRating;
        case "reviews":
          return b.reviewCount - a.reviewCount;
        case "experience":
          return b.yearsExperience - a.yearsExperience;
        case "recent":
          return b.createdAt.getTime() - a.createdAt.getTime();
        default:
          return 0;
      }
    });
  }, [professionals, query, filters]);

  const hasActiveFilters =
    filters.tradeSlugs.length > 0 ||
    filters.departments.length > 0 ||
    filters.minRating !== DEFAULT_FILTERS.minRating ||
    filters.minExperience !== DEFAULT_FILTERS.minExperience ||
    filters.minProfileScore !== DEFAULT_FILTERS.minProfileScore ||
    filters.verifiedOnly !== DEFAULT_FILTERS.verifiedOnly ||
    filters.sortBy !== DEFAULT_FILTERS.sortBy;

  function clearFilters() {
    setFilters(DEFAULT_FILTERS);
    setQuery("");
  }

  const queryActive = query.trim().length >= MIN_QUERY_LENGTH;
  const showQueryEmptyState = queryActive && filtered.length === 0;
  const showNoProfessionalsAtAll = professionals.length === 0;
  const showFilteredEmptyState =
    !showNoProfessionalsAtAll && filtered.length === 0 && !showQueryEmptyState;

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <h1 className="font-display text-[24px] font-bold text-sb-text">
        Buscar profesionales
      </h1>

      <div className="mt-4 flex flex-col gap-6 lg:flex-row">
        <aside className="hidden lg:block lg:w-[280px] lg:shrink-0">
          <div className="sticky top-0 rounded-2xl border border-sb-border bg-white p-5">
            <FiltersPanel
              filters={filters}
              onChange={setFilters}
              tradeGroups={tradeGroups}
              departmentGroups={departmentGroups}
              hasActiveFilters={hasActiveFilters}
              onClear={clearFilters}
            />
          </div>
        </aside>

        <div className="flex-1">
          <div className="flex gap-3">
            <input
              type="text"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscá por oficio o nombre..."
              className="h-12 flex-1 rounded-2xl border-2 border-sb-border bg-white px-4 text-[15px] text-sb-text outline-none focus:border-sb-blue"
            />
            <button
              type="button"
              onClick={() => setFiltersOpen(true)}
              className="flex h-12 shrink-0 items-center gap-2 rounded-2xl border-2 border-sb-border bg-white px-4 text-[14px] font-medium text-sb-text lg:hidden"
            >
              Filtros
            </button>
          </div>

          {queryActive && filtered.length > 0 && (
            <p className="mt-2 text-[13px] text-sb-muted">
              Mostrando {filtered.length} resultado
              {filtered.length !== 1 ? "s" : ""} para &apos;{query}&apos;
            </p>
          )}

          {showQueryEmptyState && (
            <p className="mt-2 text-[13px] text-sb-muted">
              No encontramos profesionales para &apos;{query}&apos; en esta
              zona todavía.{" "}
              <button
                type="button"
                onClick={() => setQuery("")}
                className="text-sb-blue underline"
              >
                Limpiar búsqueda
              </button>
            </p>
          )}

          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
            {filtered.map((professional) => (
              <ProfessionalSearchCard
                key={professional.id}
                professional={professional}
              />
            ))}
          </div>

          {showNoProfessionalsAtAll && (
            <div className="mt-16 flex flex-col items-center gap-2 text-center">
              <span className="text-[48px]">🔍</span>
              <p className="font-display text-[18px] font-semibold text-sb-text">
                Todavía no hay profesionales registrados.
              </p>
              <p className="text-[14px] text-sb-muted">
                Estamos creciendo. Volvé pronto.
              </p>
            </div>
          )}

          {showFilteredEmptyState && (
            <div className="mt-16 flex flex-col items-center gap-2 text-center">
              <span className="text-[48px]">😕</span>
              <p className="font-display text-[18px] font-semibold text-sb-text">
                No encontramos resultados con esos filtros.
              </p>
              <p className="text-[14px] text-sb-muted">
                Probá ajustando los filtros o{" "}
                <button
                  type="button"
                  onClick={clearFilters}
                  className="text-sb-blue underline"
                >
                  limpiá la búsqueda
                </button>
              </p>
            </div>
          )}
        </div>
      </div>

      {filtersOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setFiltersOpen(false)}
          />
          <div className="absolute bottom-0 left-0 right-0 max-h-[85vh] overflow-y-auto rounded-t-[20px] bg-white p-5">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-[18px] font-semibold text-sb-text">
                Filtros
              </h2>
              <button
                type="button"
                onClick={() => setFiltersOpen(false)}
                aria-label="Cerrar filtros"
                className="text-sb-muted"
              >
                ✕
              </button>
            </div>

            <div className="mt-4">
              <FiltersPanel
                filters={filters}
                onChange={setFilters}
                tradeGroups={tradeGroups}
                departmentGroups={departmentGroups}
                hasActiveFilters={hasActiveFilters}
                onClear={clearFilters}
              />
            </div>

            <button
              type="button"
              onClick={() => setFiltersOpen(false)}
              className="mt-4 flex h-12 w-full items-center justify-center rounded-full bg-sb-blue text-[15px] font-medium text-white"
            >
              Aplicar filtros
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

type FiltersPanelProps = {
  filters: Filters;
  onChange: (filters: Filters) => void;
  tradeGroups: MultiSelectGroup[];
  departmentGroups: MultiSelectGroup[];
  hasActiveFilters: boolean;
  onClear: () => void;
};

function FiltersPanel({
  filters,
  onChange,
  tradeGroups,
  departmentGroups,
  hasActiveFilters,
  onClear,
}: FiltersPanelProps) {
  function update<K extends keyof Filters>(key: K, value: Filters[K]) {
    onChange({ ...filters, [key]: value });
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-[13px] font-semibold uppercase tracking-[0.05em] text-sb-text">
          Ordenar por
        </p>
        <select
          value={filters.sortBy}
          onChange={(event) =>
            update("sortBy", event.target.value as SortOption)
          }
          className="mt-2 h-10 w-full rounded-lg border border-sb-border bg-white px-3 text-[14px] text-sb-text outline-none focus:border-sb-blue"
        >
          {SORT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <p className="text-[13px] font-semibold uppercase tracking-[0.05em] text-sb-text">
          Oficio
        </p>
        <div className="mt-2">
          <MultiSelectDropdown
            groups={tradeGroups}
            selected={filters.tradeSlugs}
            onChange={(values) => update("tradeSlugs", values)}
            allLabel="Todos los oficios"
          />
        </div>
      </div>

      <div>
        <p className="text-[13px] font-semibold uppercase tracking-[0.05em] text-sb-text">
          Departamento
        </p>
        <div className="mt-2">
          <MultiSelectDropdown
            groups={departmentGroups}
            selected={filters.departments}
            onChange={(values) => update("departments", values)}
            allLabel="Todos los departamentos"
          />
        </div>
      </div>

      <ChipSection
        label="Calificación mínima"
        options={RATING_OPTIONS}
        value={filters.minRating}
        onChange={(value) => update("minRating", value)}
      />

      <ChipSection
        label="Experiencia mínima"
        options={EXPERIENCE_OPTIONS}
        value={filters.minExperience}
        onChange={(value) => update("minExperience", value)}
      />

      <ChipSection
        label="Nivel de perfil"
        options={PROFILE_SCORE_OPTIONS}
        value={filters.minProfileScore}
        onChange={(value) => update("minProfileScore", value)}
      />

      <div>
        <p className="text-[13px] font-semibold uppercase tracking-[0.05em] text-sb-text">
          Solo perfiles verificados
        </p>
        <div className="mt-2 flex items-center justify-between">
          <span className="text-[14px] text-sb-text">
            Solo perfiles verificados
          </span>
          <button
            type="button"
            role="switch"
            aria-checked={filters.verifiedOnly}
            onClick={() => update("verifiedOnly", !filters.verifiedOnly)}
            className={`flex h-6 w-11 shrink-0 items-center rounded-full p-1 transition-colors duration-150 ease-in-out ${
              filters.verifiedOnly ? "bg-sb-blue" : "bg-sb-border"
            }`}
          >
            <span
              className={`h-4 w-4 rounded-full bg-white transition-transform duration-150 ease-in-out ${
                filters.verifiedOnly ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
        </div>
      </div>

      {hasActiveFilters && (
        <button
          type="button"
          onClick={onClear}
          className="text-left text-[14px] text-sb-blue"
        >
          Limpiar filtros
        </button>
      )}
    </div>
  );
}

type MultiSelectOption = { value: string; label: string };

type MultiSelectGroup = {
  categoryName: string | null;
  options: MultiSelectOption[];
};

function MultiSelectDropdown({
  groups,
  selected,
  onChange,
  allLabel,
}: {
  groups: MultiSelectGroup[];
  selected: string[];
  onChange: (values: string[]) => void;
  allLabel: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const allOptions = groups.flatMap((group) => group.options);
  const selectedOptions = allOptions.filter((option) =>
    selected.includes(option.value),
  );

  const triggerLabel =
    selectedOptions.length === 0
      ? allLabel
      : selectedOptions.length === 1
        ? selectedOptions[0].label
        : `${selectedOptions.length} seleccionados`;

  function toggle(value: string) {
    if (selected.includes(value)) {
      onChange(selected.filter((v) => v !== value));
    } else {
      onChange([...selected, value]);
    }
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex h-[42px] w-full items-center justify-between rounded-[10px] border-[1.5px] border-sb-border bg-white px-[14px] text-[14px] text-sb-text"
      >
        <span className="truncate">{triggerLabel}</span>
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          width="16"
          height="16"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className={`shrink-0 transition-transform duration-150 ease-in-out ${
            isOpen ? "rotate-180" : ""
          }`}
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute left-0 top-full z-50 mt-2 max-h-[320px] min-w-[240px] overflow-y-auto rounded-xl border-[1.5px] border-sb-border bg-white p-2">
          {groups.map((group, groupIndex) => (
            <div key={group.categoryName ?? groupIndex}>
              {group.categoryName && (
                <p className="px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-[0.06em] text-sb-muted">
                  {group.categoryName}
                </p>
              )}
              {group.options.map((option) => {
                const isSelected = selected.includes(option.value);
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => toggle(option.value)}
                    className="flex w-full items-center gap-[10px] rounded-lg px-3 py-2 text-left transition-colors duration-150 ease-in-out hover:bg-sb-bg"
                  >
                    <span
                      className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border-[1.5px] ${
                        isSelected
                          ? "border-sb-blue bg-sb-blue"
                          : "border-sb-border bg-white"
                      }`}
                    >
                      {isSelected && (
                        <svg
                          aria-hidden="true"
                          viewBox="0 0 16 16"
                          width="10"
                          height="10"
                        >
                          <path
                            fill="none"
                            stroke="white"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M3 8.5l3 3 7-7"
                          />
                        </svg>
                      )}
                    </span>
                    <span
                      className={`text-[14px] ${
                        isSelected ? "text-sb-blue" : "text-sb-text"
                      }`}
                    >
                      {option.label}
                    </span>
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      )}

      {selectedOptions.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {selectedOptions.map((option) => (
            <span
              key={option.value}
              className="inline-flex items-center gap-[6px] rounded-full border border-sb-blue/20 bg-sb-blue/10 px-[10px] py-1 text-[13px] text-sb-blue"
            >
              {option.label}
              <button
                type="button"
                onClick={() => toggle(option.value)}
                aria-label={`Quitar ${option.label}`}
              >
                ✕
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function ChipSection({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { label: string; value: number }[];
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <div>
      <p className="text-[13px] font-semibold uppercase tracking-[0.05em] text-sb-text">
        {label}
      </p>
      <div className="mt-2 flex flex-wrap gap-2">
        {options.map((option) => {
          const selected = option.value === value;
          return (
            <button
              key={option.label}
              type="button"
              onClick={() => onChange(option.value)}
              className={`rounded-full px-3 py-[6px] text-[13px] transition-colors duration-150 ease-in-out ${
                selected
                  ? "bg-sb-blue text-white"
                  : "border border-sb-border bg-sb-bg text-sb-muted"
              }`}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
