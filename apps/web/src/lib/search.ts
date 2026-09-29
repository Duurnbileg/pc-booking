import {
  CAFE_SORTS,
  DISTRICT_IDS,
  GPU_OPTIONS,
  MONITOR_HZ_OPTIONS,
  PRICE_RANGES,
  type CafeSort,
  type District,
  type PriceRangeId,
} from "@pc-booking/shared";

export const MAX_PEOPLE = 20;

export type CafeSearch = {
  q: string;
  districts: District[];
  minPrice?: number;
  maxPrice?: number;
  gpus: string[];
  hz: string[];
  people: number;
  date: string;
  sort: CafeSort;
};

export function todayIso(): string {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60_000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 10);
}

export function emptySearch(): CafeSearch {
  return {
    q: "",
    districts: [],
    gpus: [],
    hz: [],
    people: 1,
    date: todayIso(),
    sort: "newest",
  };
}

export function priceRangeOf(search: CafeSearch): PriceRangeId | undefined {
  return PRICE_RANGES.find(
    (r) =>
      ("min" in r ? r.min : undefined) === search.minPrice &&
      ("max" in r ? r.max : undefined) === search.maxPrice,
  )?.id;
}

export function withPriceRange(search: CafeSearch, id: PriceRangeId | undefined): CafeSearch {
  const range = PRICE_RANGES.find((r) => r.id === id);
  return {
    ...search,
    minPrice: range && "min" in range ? range.min : undefined,
    maxPrice: range && "max" in range ? range.max : undefined,
  };
}

export function hasFilters(search: CafeSearch): boolean {
  return Boolean(
    search.districts.length ||
      search.gpus.length ||
      search.hz.length ||
      search.minPrice !== undefined ||
      search.maxPrice !== undefined,
  );
}

export function clearFilters(search: CafeSearch): CafeSearch {
  return {
    ...search,
    districts: [],
    gpus: [],
    hz: [],
    minPrice: undefined,
    maxPrice: undefined,
  };
}

export function searchToParams(search: CafeSearch): URLSearchParams {
  const params = new URLSearchParams();
  if (search.q.trim()) params.set("q", search.q.trim());
  if (search.districts.length) params.set("district", search.districts.join(","));
  if (search.minPrice !== undefined) params.set("minPrice", String(search.minPrice));
  if (search.maxPrice !== undefined) params.set("maxPrice", String(search.maxPrice));
  if (search.gpus.length) params.set("gpu", search.gpus.join(","));
  if (search.hz.length) params.set("hz", search.hz.join(","));
  if (search.people > 1) params.set("people", String(search.people));
  if (search.date) params.set("date", search.date);
  if (search.sort !== "newest") params.set("sort", search.sort);
  return params;
}

function listParam<T extends string>(
  params: URLSearchParams,
  key: string,
  allowed: readonly T[],
): T[] {
  return (params.get(key) ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter((s): s is T => (allowed as readonly string[]).includes(s));
}

function numberParam(params: URLSearchParams, key: string): number | undefined {
  const raw = params.get(key);
  if (raw === null || raw === "") return undefined;
  const n = Number(raw);
  return Number.isFinite(n) && n >= 0 ? n : undefined;
}

export function parseSearch(params: URLSearchParams): CafeSearch {
  const people = Math.round(numberParam(params, "people") ?? 1);
  const date = params.get("date") ?? "";
  const sort = params.get("sort") as CafeSort | null;
  return {
    q: params.get("q") ?? "",
    districts: listParam(params, "district", DISTRICT_IDS),
    minPrice: numberParam(params, "minPrice"),
    maxPrice: numberParam(params, "maxPrice"),
    gpus: listParam(params, "gpu", GPU_OPTIONS),
    hz: listParam(params, "hz", MONITOR_HZ_OPTIONS),
    people: Math.min(Math.max(people, 1), MAX_PEOPLE),
    date: /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : todayIso(),
    sort: sort && CAFE_SORTS.includes(sort) ? sort : "newest",
  };
}

export function toggle<T>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}
