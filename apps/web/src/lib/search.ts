import {
  CAFE_SORTS,
  DISTRICT_IDS,
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
  allowed: readonly T[] | RegExp,
): T[] {
  return (params.get(key) ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter((s): s is T =>
      allowed instanceof RegExp ? allowed.test(s) : (allowed as readonly string[]).includes(s),
    );
}

const GPU_TAG = /^(?:RTX|GTX) \d{4}$/;
const HZ_TAG = /^\d{2,3}Hz$/;

/** Mirrors the API's specPattern: tags match the free-text displaySpecs on their number. */
export function specMatches(specs: string, tag: string): boolean {
  const number = tag.match(/\d+/)?.[0];
  if (!number) return specs.toLowerCase().includes(tag.toLowerCase());
  return new RegExp(`(?<!\\d)${number}(?!\\d)`).test(specs);
}

/** GPU ("RTX 5070") and refresh-rate ("400Hz") tags that actually appear in the cafes' specs, highest first. */
export function specTagsFrom(cafes: { displaySpecs: string }[]): { gpus: string[]; hz: string[] } {
  const gpus = new Set<string>();
  const hz = new Set<string>();
  for (const { displaySpecs } of cafes) {
    for (const m of displaySpecs.matchAll(/\b(RTX|GTX)\s?(\d{4})/gi)) {
      gpus.add(`${m[1]!.toUpperCase()} ${m[2]}`);
    }
    for (const m of displaySpecs.matchAll(/(?<!\d)(\d{2,3})\s?hz/gi)) hz.add(`${m[1]}Hz`);
  }
  const byNumberDesc = (a: string, b: string) =>
    Number(b.match(/\d+/)?.[0]) - Number(a.match(/\d+/)?.[0]);
  return { gpus: [...gpus].sort(byNumberDesc), hz: [...hz].sort(byNumberDesc) };
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
    gpus: listParam(params, "gpu", GPU_TAG),
    hz: listParam(params, "hz", HZ_TAG),
    people: Math.min(Math.max(people, 1), MAX_PEOPLE),
    date: /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : todayIso(),
    sort: sort && CAFE_SORTS.includes(sort) ? sort : "newest",
  };
}

export function toggle<T>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}
