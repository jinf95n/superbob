"use client";

import { useMemo, useState, type ChangeEvent } from "react";
import { ProfessionalSearchItem } from "@/modules/professionals/types";
import { ProfessionalCard } from "./ProfessionalCard";

export type TradeSearchOption = {
  id: string;
  name: string;
  slug: string;
  categoryName: string;
};

export type DepartmentSearchOption = {
  id: string;
  name: string;
  slug: string;
  provinceName: string;
};

type SearchClientProps = {
  professionals: ProfessionalSearchItem[];
  trades: TradeSearchOption[];
  departments: DepartmentSearchOption[];
  initialTradeSlug?: string;
};

const MAX_SUGGESTIONS = 6;

// Sinónimos comunes para mejorar la predicción: clave en minúsculas →
// nombre exacto del oficio (debe coincidir con prisma/seed/trades.ts).
const TRADE_SYNONYMS: Record<string, string> = {
  agua: "Plomería",
  caño: "Plomería",
  luz: "Electricidad",
  cable: "Electricidad",
  pared: "Albañilería",
  piso: "Colocación de pisos",
  pintar: "Pintura",
  puerta: "Carpintería en madera",
  mueble: "Fabricación de muebles a medida",
  wifi: "Redes e instalación de WiFi",
  celular: "Reparación de celulares",
  pileta: "Mantenimiento de piletas",
  gas: "Gas",
  techado: "Techista",
  jardín: "Jardinería",
};

function normalize(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();
}

function getTradeSuggestions(
  query: string,
  trades: TradeSearchOption[],
): TradeSearchOption[] {
  const normalizedQuery = normalize(query);
  if (!normalizedQuery) return [];

  const matches = new Map<string, TradeSearchOption>();

  for (const trade of trades) {
    if (
      normalize(trade.name).includes(normalizedQuery) ||
      normalize(trade.categoryName).includes(normalizedQuery)
    ) {
      matches.set(trade.id, trade);
    }
  }

  for (const [synonym, tradeName] of Object.entries(TRADE_SYNONYMS)) {
    const normalizedSynonym = normalize(synonym);
    if (
      normalizedSynonym.includes(normalizedQuery) ||
      normalizedQuery.includes(normalizedSynonym)
    ) {
      const trade = trades.find(
        (candidate) => normalize(candidate.name) === normalize(tradeName),
      );
      if (trade) matches.set(trade.id, trade);
    }
  }

  return Array.from(matches.values()).slice(0, MAX_SUGGESTIONS);
}

function getDepartmentSuggestions(
  query: string,
  departments: DepartmentSearchOption[],
): DepartmentSearchOption[] {
  const normalizedQuery = normalize(query);
  if (!normalizedQuery) return [];

  return departments
    .filter(
      (department) =>
        normalize(department.name).includes(normalizedQuery) ||
        normalize(department.provinceName).includes(normalizedQuery),
    )
    .slice(0, MAX_SUGGESTIONS);
}

export function SearchClient({
  professionals,
  trades,
  departments,
  initialTradeSlug,
}: SearchClientProps) {
  const [tradeQuery, setTradeQuery] = useState("");
  const [selectedTrade, setSelectedTrade] = useState<TradeSearchOption | null>(
    () => trades.find((trade) => trade.slug === initialTradeSlug) ?? null,
  );
  const [departmentQuery, setDepartmentQuery] = useState("");
  const [selectedDepartment, setSelectedDepartment] =
    useState<DepartmentSearchOption | null>(null);

  const tradeSuggestions = useMemo(
    () => getTradeSuggestions(tradeQuery, trades),
    [tradeQuery, trades],
  );
  const departmentSuggestions = useMemo(
    () => getDepartmentSuggestions(departmentQuery, departments),
    [departmentQuery, departments],
  );

  const filteredProfessionals = useMemo(() => {
    return professionals.filter((professional) => {
      const matchesTrade =
        !selectedTrade ||
        professional.trades.some((trade) => trade.slug === selectedTrade.slug);
      const matchesDepartment =
        !selectedDepartment ||
        professional.departments.some(
          (department) => department.slug === selectedDepartment.slug,
        );
      return matchesTrade && matchesDepartment;
    });
  }, [professionals, selectedTrade, selectedDepartment]);

  function handleTradeChange(event: ChangeEvent<HTMLInputElement>) {
    setTradeQuery(event.target.value);
  }

  function handleSelectTrade(trade: TradeSearchOption) {
    setSelectedTrade(trade);
    setTradeQuery("");
  }

  function handleDepartmentChange(event: ChangeEvent<HTMLInputElement>) {
    setDepartmentQuery(event.target.value);
  }

  function handleSelectDepartment(department: DepartmentSearchOption) {
    setSelectedDepartment(department);
    setDepartmentQuery("");
  }

  const emptyStateText = (() => {
    if (selectedTrade && selectedDepartment) {
      return `No encontramos ${selectedTrade.name} en ${selectedDepartment.name}`;
    }
    if (selectedTrade) {
      return `No encontramos ${selectedTrade.name} en tu zona todavía`;
    }
    if (selectedDepartment) {
      return `No encontramos profesionales en ${selectedDepartment.name}`;
    }
    return "No encontramos profesionales todavía";
  })();

  return (
    <div>
      <div className="relative">
        <span
          aria-hidden="true"
          className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-xl"
        >
          🔍
        </span>
        <input
          type="text"
          value={tradeQuery}
          onChange={handleTradeChange}
          placeholder="Plomero, electricista, pintura..."
          className="h-14 w-full rounded-2xl border-2 border-sb-border bg-white pl-12 pr-4 text-base font-medium text-sb-text outline-none focus:border-sb-blue focus:shadow-[0_0_0_4px_rgba(26,111,224,0.12)]"
        />

        {tradeSuggestions.length > 0 && (
          <ul className="absolute z-30 mt-2 w-full rounded-2xl bg-white shadow-[0_8px_24px_rgba(0,0,0,0.12)]">
            {tradeSuggestions.map((trade) => (
              <li key={trade.id}>
                <button
                  type="button"
                  onClick={() => handleSelectTrade(trade)}
                  className="flex w-full flex-col items-start px-4 py-3 text-left hover:bg-sb-card-blue"
                >
                  <span className="text-base font-medium text-sb-text">
                    {trade.name}
                  </span>
                  <span className="text-[13px] text-sb-muted">
                    {trade.categoryName}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {selectedTrade && (
        <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-sb-blue px-4 py-1.5 text-sm font-medium text-white">
          {selectedTrade.name}
          <button
            type="button"
            onClick={() => setSelectedTrade(null)}
            aria-label="Quitar filtro de oficio"
          >
            ✕
          </button>
        </div>
      )}

      <div className="relative mt-3">
        <input
          type="text"
          value={departmentQuery}
          onChange={handleDepartmentChange}
          placeholder="Departamento o ciudad..."
          className="h-12 w-full rounded-2xl border-2 border-sb-border bg-white px-4 text-base font-medium text-sb-text outline-none focus:border-sb-blue focus:shadow-[0_0_0_4px_rgba(26,111,224,0.12)]"
        />

        {departmentSuggestions.length > 0 && (
          <ul className="absolute z-30 mt-2 w-full rounded-2xl bg-white shadow-[0_8px_24px_rgba(0,0,0,0.12)]">
            {departmentSuggestions.map((department) => (
              <li key={department.id}>
                <button
                  type="button"
                  onClick={() => handleSelectDepartment(department)}
                  className="flex w-full flex-col items-start px-4 py-3 text-left hover:bg-sb-card-blue"
                >
                  <span className="text-base font-medium text-sb-text">
                    {department.name}
                  </span>
                  <span className="text-[13px] text-sb-muted">
                    {department.provinceName}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {selectedDepartment && (
        <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-sb-blue px-4 py-1.5 text-sm font-medium text-white">
          {selectedDepartment.name}
          <button
            type="button"
            onClick={() => setSelectedDepartment(null)}
            aria-label="Quitar filtro de zona"
          >
            ✕
          </button>
        </div>
      )}

      <p className="mt-6 text-sm text-sb-muted">
        {filteredProfessionals.length} profesional
        {filteredProfessionals.length === 1 ? "" : "es"} encontrado
        {filteredProfessionals.length === 1 ? "" : "s"}
      </p>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filteredProfessionals.map((professional) => (
          <ProfessionalCard key={professional.id} professional={professional} />
        ))}
      </div>

      {filteredProfessionals.length === 0 && (
        <div className="mt-16 flex flex-col items-center gap-2 text-center">
          <span className="text-[64px]">🔍</span>
          <p className="text-sb-text">{emptyStateText}</p>
          <p className="text-sm text-sb-muted">
            Probá buscar en departamentos cercanos.
          </p>
        </div>
      )}
    </div>
  );
}
