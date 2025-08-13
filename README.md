## currency-codes-country-codes-flags

Lightweight utilities and data to map ISO 4217 currency codes to ISO 3166 country codes and SVG flags. Ships with helpful lookup functions and returns flag file URLs that resolve to the package's `flags/` directory.

### Install

```bash
npm i currency-codes-country-codes-flags
```

### Usage

```js
import {
  getCurrencyByCode,
  getCurrenciesByCountryCode,
  findCurrenciesByName,
  getFlagUrlByCurrencyCode,
  getFlagUrlByCountryCode,
  getFlagUrlsForCurrency,
  getAllCurrencyEntries,
} from "currency-codes-country-codes-flags";

const usd = getCurrencyByCode("USD");
// {
//   currencyCode: 'USD',
//   currencyName: 'United States Dollar',
//   primaryCountryCode: 'US',
//   otherCountryCodes: ['AS', 'EC', ...]
// }

const euroUsers = getCurrenciesByCountryCode("FR"); // [ { currencyCode: 'EUR', ... } ]

const searchByName = findCurrenciesByName("pound"); // GBP and others

const usFlagUrl = getFlagUrlByCountryCode("US"); // file URL to flags/us.svg
const eurFlagPrimary = getFlagUrlByCurrencyCode("EUR"); // flags/eu.svg
const eurFlagAll = getFlagUrlsForCurrency("EUR"); // { primary: flags/eu.svg, others: [flags/fr.svg, ...] }

const all = getAllCurrencyEntries();
```

Flag URLs are built using `import.meta.url` and point to files inside the package's `flags/` folder. You can use them as `src` in `<img>` tags or import through bundlers.

#### Which flag is returned for a currency used by many countries?

- `getFlagUrlByCurrencyCode(code)` returns the flag of the `primaryCountryCode` we designate for that currency (for example, `EUR` → `EU` flag, `USD` → `US` flag). This provides a deterministic single flag per currency.
- To access all flags used by a currency, use `getFlagUrlsForCurrency(code)` which returns both the primary flag and an array of flags for all other countries using that currency.

### API

- `getCurrencyByCode(code)` → currency entry or `null`
- `getCurrenciesByCountryCode(countryCode)` → array of currency entries
- `getPrimaryCountryForCurrency(currencyCode)` → country code or `null`
- `getOtherCountriesForCurrency(currencyCode)` → array of country codes
- `getAllCountriesUsingCurrency(currencyCode)` → array of all country codes (primary + others)
- `getCountriesForCurrency(currencyCode)` → `{ primary, others, all }`
- `getCurrencyCodesByCountryCode(countryCode)` → array of currency codes
- `getCurrenciesByExactName(name)` → array of currency entries with exact name match (including aliases)
- `findCurrenciesByName(query)` → array of currency entries
- `getFlagUrlByCountryCode(countryCode)` → file URL string or `null`
- `getFlagUrlByCurrencyCode(currencyCode)` → primary flag URL or `null`
- `getFlagUrlsForCurrency(currencyCode)` → `{ primary, others }`
- `getCurrencyCodes()` → array of currency codes
- `getCountryCodes()` → array of country codes that appear in the dataset
- `search(query)` → heuristic search across codes, names, and country codes

### Notes

- Multiple countries can share a currency. The `primaryCountryCode` is a representative ISO 3166-1 alpha-2 (e.g., `EU` for `EUR`). All other users appear in `otherCountryCodes`.
- This package references flag SVGs from its own `flags/` directory. No remote calls or inlined SVGs.

### License

MIT
