"use client";

import { useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

type TradeOption = {
  name: string;
  slug: string;
};

type DepartmentOption = {
  name: string;
  slug: string;
};

type HomeSearchProps = {
  trades: TradeOption[];
  departments: DepartmentOption[];
};

const MIN_QUERY_LENGTH = 2;
const MAX_SUGGESTIONS = 6;
const QUICK_SUGGESTIONS = ["Plomero", "Electricista", "Pintor", "Gasista"];

function normalize(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();
}

function SearchIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.35-4.35" />
    </svg>
  );
}

function PinIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

function ChevronDownIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

export function HomeSearch({ trades, departments }: HomeSearchProps) {
  const router = useRouter();

  const [tradeQuery, setTradeQuery] = useState("");
  const [tradeSlug, setTradeSlug] = useState<string | null>(null);
  const [showTradeSuggestions, setShowTradeSuggestions] = useState(false);

  const [departmentSlug, setDepartmentSlug] = useState<string | null>(null);

  const tradeSuggestions = useMemo(() => {
    if (tradeQuery.trim().length < MIN_QUERY_LENGTH) return [];
    const normalized = normalize(tradeQuery);
    return trades
      .filter((trade) => normalize(trade.name).includes(normalized))
      .slice(0, MAX_SUGGESTIONS);
  }, [tradeQuery, trades]);

  function handleTradeInputChange(value: string) {
    setTradeQuery(value);
    setTradeSlug(null);
    setShowTradeSuggestions(true);
  }

  function handleSelectTrade(trade: TradeOption) {
    setTradeQuery(trade.name);
    setTradeSlug(trade.slug);
    setShowTradeSuggestions(false);
  }

  function handleQuickSuggestionClick(label: string) {
    setTradeQuery(label);
    setTradeSlug(null);
    setShowTradeSuggestions(true);
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const params = new URLSearchParams();
    if (tradeSlug) params.set("trade", tradeSlug);
    if (departmentSlug) params.set("department", departmentSlug);
    const queryString = params.toString();
    router.push(queryString ? `/search?${queryString}` : "/search");
  }

  return (
    <div>
      <form onSubmit={handleSubmit} className="rounded-[20px] bg-white p-7">
        <p className="font-display mb-4 text-[16px] font-bold text-sb-text">
          ¿Qué necesitás?
        </p>

        <div className="relative">
          <label className="sr-only" htmlFor="home-search-trade">
            Oficio
          </label>
          <span
            aria-hidden="true"
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sb-muted"
          >
            <SearchIcon />
          </span>
          <input
            id="home-search-trade"
            type="text"
            value={tradeQuery}
            onChange={(event) => handleTradeInputChange(event.target.value)}
            onFocus={() => setShowTradeSuggestions(true)}
            onBlur={() =>
              setTimeout(() => setShowTradeSuggestions(false), 100)
            }
            placeholder="Ej: plomero, electricista, pintor..."
            autoComplete="off"
            className="w-full rounded-xl border-[1.5px] border-sb-border py-3.5 pl-11 pr-4 text-[15px] text-sb-text outline-none focus:border-sb-blue"
          />

          {showTradeSuggestions && tradeSuggestions.length > 0 && (
            <ul className="absolute z-30 mt-1 w-full rounded-xl border border-sb-border bg-white">
              {tradeSuggestions.map((trade) => (
                <li key={trade.slug}>
                  <button
                    type="button"
                    onClick={() => handleSelectTrade(trade)}
                    className="block w-full px-4 py-2.5 text-left text-[15px] text-sb-text hover:bg-sb-bg"
                  >
                    {trade.name}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="relative mt-2.5">
          <label className="sr-only" htmlFor="home-search-department">
            Departamento
          </label>
          <span
            aria-hidden="true"
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 z-10 text-sb-muted"
          >
            <PinIcon />
          </span>
          <select
            id="home-search-department"
            value={departmentSlug ?? ""}
            onChange={(event) => setDepartmentSlug(event.target.value || null)}
            className={`w-full appearance-none rounded-xl border-[1.5px] border-sb-border bg-white py-3.5 pl-11 pr-10 text-[15px] outline-none focus:border-sb-blue ${
              !departmentSlug ? "text-sb-muted" : "text-sb-text"
            }`}
          >
            <option value="">Departamento (opcional)</option>
            {departments.map((dept) => (
              <option key={dept.slug} value={dept.slug}>
                {dept.name}
              </option>
            ))}
          </select>
          <span
            aria-hidden="true"
            className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sb-muted"
          >
            <ChevronDownIcon />
          </span>
        </div>

        <button
          type="submit"
          className="font-display mt-3.5 flex w-full items-center justify-center rounded-xl bg-sb-blue py-3.5 text-[16px] font-bold text-white transition-colors duration-150 ease-in-out hover:bg-sb-blue/90"
        >
          Buscar profesionales
        </button>

        <p className="mt-3 text-center text-[12px] text-sb-muted">
          Sin registro para buscar · Gratis
        </p>
      </form>

      <div className="mt-4 hidden items-center gap-2 lg:flex">
        <span className="text-[13px] text-white/60">Más buscado:</span>
        {QUICK_SUGGESTIONS.map((label) => (
          <button
            key={label}
            type="button"
            onClick={() => handleQuickSuggestionClick(label)}
            className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[13px] text-white/90 transition-colors duration-150 ease-in-out hover:bg-white/20"
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
