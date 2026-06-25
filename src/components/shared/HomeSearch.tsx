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

function normalize(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();
}

export function HomeSearch({ trades, departments }: HomeSearchProps) {
  const router = useRouter();

  const [tradeQuery, setTradeQuery] = useState("");
  const [tradeSlug, setTradeSlug] = useState<string | null>(null);
  const [showTradeSuggestions, setShowTradeSuggestions] = useState(false);

  const [departmentQuery, setDepartmentQuery] = useState("");
  const [departmentSlug, setDepartmentSlug] = useState<string | null>(null);
  const [showDepartmentSuggestions, setShowDepartmentSuggestions] =
    useState(false);

  const tradeSuggestions = useMemo(() => {
    if (tradeQuery.trim().length < MIN_QUERY_LENGTH) return [];
    const normalized = normalize(tradeQuery);
    return trades
      .filter((trade) => normalize(trade.name).includes(normalized))
      .slice(0, MAX_SUGGESTIONS);
  }, [tradeQuery, trades]);

  const departmentSuggestions = useMemo(() => {
    if (departmentQuery.trim().length < MIN_QUERY_LENGTH) return [];
    const normalized = normalize(departmentQuery);
    return departments
      .filter((department) => normalize(department.name).includes(normalized))
      .slice(0, MAX_SUGGESTIONS);
  }, [departmentQuery, departments]);

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

  function handleDepartmentInputChange(value: string) {
    setDepartmentQuery(value);
    setDepartmentSlug(null);
    setShowDepartmentSuggestions(true);
  }

  function handleSelectDepartment(department: DepartmentOption) {
    setDepartmentQuery(department.name);
    setDepartmentSlug(department.slug);
    setShowDepartmentSuggestions(false);
  }

  function handleDepartmentSelectChange(slug: string) {
    setDepartmentSlug(slug || null);
    setDepartmentQuery(
      departments.find((department) => department.slug === slug)?.name ?? "",
    );
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
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl bg-white p-5 sm:flex sm:items-start sm:gap-3"
    >
      <div className="relative flex-1">
        <label className="sr-only" htmlFor="home-search-trade">
          Oficio
        </label>
        <div className="relative">
          <span
            aria-hidden="true"
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-lg"
          >
            🔍
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
            placeholder="¿Qué necesitás? (plomero, electricista...)"
            autoComplete="off"
            className="h-12 w-full rounded-xl border border-sb-border bg-white pl-11 pr-4 text-[15px] text-sb-text outline-none focus:border-sb-blue"
          />
        </div>

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

      <div className="relative mt-3 flex-1 sm:mt-0">
        <label className="sr-only" htmlFor="home-search-department-select">
          Departamento
        </label>

        <select
          id="home-search-department-select"
          value={departmentSlug ?? ""}
          onChange={(event) =>
            handleDepartmentSelectChange(event.target.value)
          }
          className="h-12 w-full rounded-xl border border-sb-border bg-white px-4 text-[15px] text-sb-text outline-none focus:border-sb-blue sm:hidden"
        >
          <option value="">Departamento o ciudad</option>
          {departments.map((department) => (
            <option key={department.slug} value={department.slug}>
              {department.name}
            </option>
          ))}
        </select>

        <div className="hidden sm:block">
          <input
            type="text"
            value={departmentQuery}
            onChange={(event) =>
              handleDepartmentInputChange(event.target.value)
            }
            onFocus={() => setShowDepartmentSuggestions(true)}
            onBlur={() =>
              setTimeout(() => setShowDepartmentSuggestions(false), 100)
            }
            placeholder="Departamento o ciudad"
            autoComplete="off"
            className="h-12 w-full rounded-xl border border-sb-border bg-white px-4 text-[15px] text-sb-text outline-none focus:border-sb-blue"
          />

          {showDepartmentSuggestions && departmentSuggestions.length > 0 && (
            <ul className="absolute z-30 mt-1 w-full rounded-xl border border-sb-border bg-white">
              {departmentSuggestions.map((department) => (
                <li key={department.slug}>
                  <button
                    type="button"
                    onClick={() => handleSelectDepartment(department)}
                    className="block w-full px-4 py-2.5 text-left text-[15px] text-sb-text hover:bg-sb-bg"
                  >
                    {department.name}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <button
        type="submit"
        className="mt-3 flex h-12 w-full items-center justify-center rounded-xl bg-sb-blue px-6 text-[15px] font-medium text-white transition-colors duration-150 ease-in-out hover:bg-sb-blue/90 sm:mt-0 sm:w-auto sm:shrink-0"
      >
        Buscar profesionales
      </button>
    </form>
  );
}
