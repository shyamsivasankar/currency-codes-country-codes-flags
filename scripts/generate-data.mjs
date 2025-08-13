/*
  Generation script: builds src/data.js with a comprehensive ISO 4217 currency list
  - Sources:
    - Countries and their currencies: https://raw.githubusercontent.com/mledoze/countries/master/countries.json
    - Currency code → English name: https://openexchangerates.org/api/currencies.json
  - Strategy:
    - Union all currency codes from both sources
    - Map each currency to the set of ISO 3166-1 alpha-2 country codes using it (from mledoze)
    - Choose a primary country code per currency:
      * If EUR → EU
      * If no countries → XX
      * Else alphabetical first of country codes
    - Currency name preference: OpenExchangeRates → fallback to mledoze first name
*/

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, "..");

async function fetchJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`);
  return res.json();
}

function normalizeCode(s) {
  return String(s || "")
    .trim()
    .toUpperCase();
}

const PRIMARY_OVERRIDES = {
  EUR: "EU",
  USD: "US",
  GBP: "GB",
  AUD: "AU",
  CAD: "CA",
  CHF: "CH",
  JPY: "JP",
  CNY: "CN",
  HKD: "HK",
  SGD: "SG",
  XAF: "CM",
  XOF: "SN",
  XCD: "AG",
};

// ISO special-purpose and precious metal codes sometimes absent from public datasets
const EXTRA_CODES = [
  { code: "XXX", name: "No currency" },
  { code: "XTS", name: "Codes specifically reserved for testing purposes" },
  { code: "XPT", name: "Platinum (one troy ounce)" },
  { code: "XPD", name: "Palladium (one troy ounce)" },
  { code: "XAU", name: "Gold (one troy ounce)" },
  { code: "XAG", name: "Silver (one troy ounce)" },
  { code: "XDR", name: "Special Drawing Rights" },
  { code: "XBA", name: "Bond Markets Unit European Composite Unit (EURCO)" },
  { code: "XBB", name: "Bond Markets Unit European Monetary Unit (E.M.U.-6)" },
  {
    code: "XBC",
    name: "Bond Markets Unit European Unit of Account 9 (E.U.A.-9)",
  },
  {
    code: "XBD",
    name: "Bond Markets Unit European Unit of Account 17 (E.U.A.-17)",
  },
  { code: "XSU", name: "Sucre" },
  { code: "XUA", name: "ADB Unit of Account" },
];

async function build() {
  const [countries, codeToName] = await Promise.all([
    fetchJson(
      "https://raw.githubusercontent.com/mledoze/countries/master/countries.json"
    ),
    fetchJson("https://openexchangerates.org/api/currencies.json"),
  ]);

  /** Map currencyCode -> { nameCandidates: Set<string>, countryCodes: Set<string> } */
  const map = new Map();

  for (const c of countries) {
    const cca2 = normalizeCode(c.cca2);
    const currencies = c.currencies || {};
    for (const [ccy, def] of Object.entries(currencies)) {
      const code = normalizeCode(ccy);
      if (!map.has(code))
        map.set(code, { nameCandidates: new Set(), countryCodes: new Set() });
      const entry = map.get(code);
      if (def && def.name) entry.nameCandidates.add(String(def.name));
      if (cca2) entry.countryCodes.add(cca2);
    }
  }

  // Merge in Open Exchange Rates names and include codes not found in countries dataset
  for (const [codeRaw, nameRaw] of Object.entries(codeToName)) {
    const code = normalizeCode(codeRaw);
    const name = String(nameRaw);
    if (!map.has(code))
      map.set(code, { nameCandidates: new Set(), countryCodes: new Set() });
    map.get(code).nameCandidates.add(name);
  }

  // Ensure special-purpose codes are present with sensible defaults
  for (const { code, name } of EXTRA_CODES) {
    const cc = normalizeCode(code);
    if (!map.has(cc))
      map.set(cc, { nameCandidates: new Set(), countryCodes: new Set() });
    const entry = map.get(cc);
    entry.nameCandidates.add(name);
    // No associated countries; will fall back to XX primary
  }

  const allCodes = Array.from(map.keys()).sort();
  const records = [];
  for (const code of allCodes) {
    const data = map.get(code);
    const countriesSet = data.countryCodes;
    let countriesArr = Array.from(countriesSet).sort();
    let primary = PRIMARY_OVERRIDES[code] || countriesArr[0] || "XX";
    let others = countriesArr.filter((cc) => cc !== primary);

    const name = Array.from(data.nameCandidates)[0] || code; // pick first candidate

    records.push({
      currencyCode: code,
      currencyName: name,
      primaryCountryCode: primary,
      otherCountryCodes: others,
    });
  }

  // Keep a minimal alias list; users can augment later
  const aliasObjectLines = [
    '  USD: ["US Dollar", "Dollar", "American Dollar"],',
    '  EUR: ["Eurozone Euro"],',
    '  GBP: ["British Pound", "Sterling"],',
    '  AUD: ["Aussie Dollar"],',
    '  NZD: ["Kiwi Dollar"],',
    '  CHF: ["Swiss Franc"],',
    '  CNY: ["Renminbi", "Yuan Renminbi"],',
    '  JPY: ["Yen"],',
    '  HKD: ["Hong Kong Dollar"],',
    '  SGD: ["Singapore Dollar"],',
    '  INR: ["Indian Rupee"],',
    '  AED: ["Dirham", "UAE Dirham"],',
    '  SAR: ["Saudi Riyal"],',
    '  KWD: ["Kuwaiti Dinar"],',
    '  QAR: ["Qatari Riyal"],',
    '  BHD: ["Bahraini Dinar"],',
    '  OMR: ["Omani Rial"],',
    '  TRY: ["Turkish Lira"],',
    '  EGP: ["Egyptian Pound"],',
    '  RUB: ["Russian Ruble", "Ruble"],',
    '  SEK: ["Swedish Krona"],',
    '  NOK: ["Norwegian Krone"],',
    '  DKK: ["Danish Krone"],',
    '  XAF: ["CFA Franc BEAC", "Central African CFA"],',
    '  XOF: ["CFA Franc BCEAO", "West African CFA"],',
    '  ZAR: ["South African Rand", "Rand"],',
  ];

  const formatRecord = (r) => {
    const oc = r.otherCountryCodes.map((c) => `"${c}"`).join(", ");
    return [
      "  {",
      `    currencyCode: "${r.currencyCode}",`,
      `    currencyName: "${r.currencyName.replace(/"/g, '\\"')}",`,
      `    primaryCountryCode: "${r.primaryCountryCode}",`,
      `    otherCountryCodes: [${oc}],`,
      "  },",
    ].join("\n");
  };

  const body = records.map(formatRecord).join("\n");

  const out = `// GENERATED FILE. Do not edit by hand. Use scripts/generate-data.mjs to regenerate.\n\nexport const currencyCountryData = [\n${body}\n];\n\nexport const currencyNameAliases = {\n${aliasObjectLines.join(
    "\n"
  )}\n};\n`;

  const target = path.join(rootDir, "src", "data.js");
  await fs.writeFile(target, out, "utf8");
  console.log(
    `Wrote ${records.length} currencies to ${path.relative(rootDir, target)}`
  );
}

build().catch((err) => {
  console.error(err);
  process.exit(1);
});
