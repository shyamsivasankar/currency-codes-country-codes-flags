import { currencyCountryData, currencyNameAliases } from "./data.js";
import {
  normalizeCurrencyCode,
  normalizeCountryCode,
  uniqueArray,
  flagUrlFromCountryCode,
} from "./utils.js";

// Build indices for fast lookup
const codeToCurrency = new Map();
const countryToCurrencyCodes = new Map();
const nameHaystackByCode = new Map();

for (const entry of currencyCountryData) {
  const ccy = normalizeCurrencyCode(entry.currencyCode);
  const primary = normalizeCountryCode(entry.primaryCountryCode);
  const others = (entry.otherCountryCodes || []).map(normalizeCountryCode);
  const normalized = {
    currencyCode: ccy,
    currencyName: entry.currencyName,
    primaryCountryCode: primary,
    otherCountryCodes: others,
  };
  codeToCurrency.set(ccy, normalized);
  const aliases = (currencyNameAliases[ccy] || []).join("|");
  nameHaystackByCode.set(ccy, `${entry.currencyName}|${aliases}`.toLowerCase());

  // Map countries to currency codes (might be many-to-one for EUR, USD, etc.)
  const push = (countryCode) => {
    const key = normalizeCountryCode(countryCode);
    if (!countryToCurrencyCodes.has(key))
      countryToCurrencyCodes.set(key, new Set());
    countryToCurrencyCodes.get(key).add(ccy);
  };
  push(primary);
  for (const oc of others) push(oc);
}

// Public API

export function getAllCurrencyEntries() {
  return Array.from(codeToCurrency.values());
}

export function getCurrencyByCode(currencyCode) {
  const key = normalizeCurrencyCode(currencyCode);
  return codeToCurrency.get(key) || null;
}

export function getCurrenciesByCountryCode(countryCode) {
  const key = normalizeCountryCode(countryCode);
  const set = countryToCurrencyCodes.get(key);
  if (!set) return [];
  return Array.from(set).map((ccy) => codeToCurrency.get(ccy));
}

export function getPrimaryCountryForCurrency(currencyCode) {
  const data = getCurrencyByCode(currencyCode);
  return data ? data.primaryCountryCode : null;
}

export function getOtherCountriesForCurrency(currencyCode) {
  const data = getCurrencyByCode(currencyCode);
  return data ? data.otherCountryCodes : [];
}

export function findCurrenciesByName(query) {
  if (!query) return [];
  const q = String(query).trim().toLowerCase();
  const results = [];
  for (const [code, haystack] of nameHaystackByCode.entries()) {
    if (haystack.includes(q)) results.push(codeToCurrency.get(code));
  }
  return results;
}

export function getFlagUrlByCountryCode(countryCode) {
  if (!countryCode) return null;
  try {
    return flagUrlFromCountryCode(countryCode);
  } catch (e) {
    return null;
  }
}

export function getFlagUrlByCurrencyCode(currencyCode) {
  const data = getCurrencyByCode(currencyCode);
  if (!data) return null;
  return flagUrlFromCountryCode(data.primaryCountryCode);
}

export function getFlagUrlsForCurrency(currencyCode) {
  const data = getCurrencyByCode(currencyCode);
  if (!data) return { primary: null, others: [] };
  const primary = flagUrlFromCountryCode(data.primaryCountryCode);
  const others = (data.otherCountryCodes || []).map(flagUrlFromCountryCode);
  return { primary, others };
}

export function getCurrencyCodes() {
  return Array.from(codeToCurrency.keys());
}

export function getCountryCodes() {
  return uniqueArray(
    getAllCurrencyEntries().flatMap((e) => [
      e.primaryCountryCode,
      ...(e.otherCountryCodes || []),
    ])
  );
}

export function getCurrencyCodesByCountryCode(countryCode) {
  const key = normalizeCountryCode(countryCode);
  const set = countryToCurrencyCodes.get(key);
  return set ? Array.from(set) : [];
}

export function getAllCountriesUsingCurrency(currencyCode) {
  const data = getCurrencyByCode(currencyCode);
  if (!data) return [];
  return uniqueArray([
    data.primaryCountryCode,
    ...(data.otherCountryCodes || []),
  ]);
}

export function getCountriesForCurrency(currencyCode) {
  const data = getCurrencyByCode(currencyCode);
  if (!data) return { primary: null, others: [], all: [] };
  const all = uniqueArray([
    data.primaryCountryCode,
    ...(data.otherCountryCodes || []),
  ]);
  return {
    primary: data.primaryCountryCode,
    others: data.otherCountryCodes || [],
    all,
  };
}

export function getCurrenciesByExactName(name) {
  if (!name) return [];
  const q = String(name).trim().toLowerCase();
  const results = [];
  for (const [code, haystack] of nameHaystackByCode.entries()) {
    const entry = codeToCurrency.get(code);
    const aliases = currencyNameAliases[code] || [];
    const exacts = [entry.currencyName, ...aliases].map((s) =>
      String(s).toLowerCase()
    );
    if (exacts.includes(q)) results.push(entry);
  }
  return results;
}

export function search(query) {
  if (!query) return [];
  const q = String(query).trim();
  const isCountry = q.length <= 3 && /^[a-zA-Z-]{2,5}$/.test(q);
  if (isCountry) {
    return getCurrenciesByCountryCode(q);
  }
  // Fallback to name search, or exact code match
  const byCode = getCurrencyByCode(q);
  if (byCode) return [byCode];
  return findCurrenciesByName(q);
}

// Default export for convenience in CommonJS interop
export default {
  getAllCurrencyEntries,
  getCurrencyByCode,
  getCurrenciesByCountryCode,
  getCurrencyCodesByCountryCode,
  getPrimaryCountryForCurrency,
  getOtherCountriesForCurrency,
  getAllCountriesUsingCurrency,
  getCountriesForCurrency,
  findCurrenciesByName,
  getCurrenciesByExactName,
  getFlagUrlByCountryCode,
  getFlagUrlByCurrencyCode,
  getFlagUrlsForCurrency,
  getCurrencyCodes,
  getCountryCodes,
  search,
};
