export function normalizeCurrencyCode(code) {
  if (!code) return "";
  return String(code).trim().toUpperCase();
}

export function normalizeCountryCode(code) {
  if (!code) return "";
  return String(code).trim().toUpperCase();
}

export function uniqueArray(values) {
  return Array.from(new Set(values));
}

export function toFlagFilename(countryCode) {
  return `${normalizeCountryCode(countryCode).toLowerCase()}.svg`;
}

export function flagUrlFromCountryCode(countryCode) {
  const filename = toFlagFilename(countryCode);
  // Relative to this file: src/utils.js -> flags/ is one level up from src
  // Using import.meta.url produces a file URL that bundlers understand.
  return new URL(`../flags/${filename}`, import.meta.url).toString();
}
