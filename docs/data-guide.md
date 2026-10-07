# Company data guide

A company record needs its official name and website, a plain-language `overview`, `map_role`, `overview_sources`, `primary` category, `primary_gravity`, layer membership flags, `status`, `display_order`, `x` and `y`, a local `logo_candidates` path or documented fallback, and sourced geography.

Use an existing record as a schema reference. Layer keys are `infra`, `brain`, `data`, `hardware` and `deployment`. The primary layer must be one of the company's memberships. Coordinates are normalized between 0 and 1; the layout engine places nodes without collisions. Use `Core` only with maintainer approval; otherwise use `Secondary`.

## Evidence fields

- `founder_names`: actual people, not placeholder teams or automatically substituted CEOs.
- `founder_profiles`: `{name, url, source, evidence, reviewed_at}`. The URL must be an exact personal LinkedIn profile with matched identity. Omit unconfirmed links.
- `funding` and `funding_sources`: currency, round, announcement date and transaction status. Keep valuation separate.
- `canonical_investors`: confirmed investors, using existing canonical names when possible.
- `geography`: `{country, region, basis, source, detail, reviewed_at}`. Separate headquarters from origins where relevant.
- `sources`: direct URLs separated by ` | `; `overview_sources` is an array of URLs.
- Field-specific review dates reflect work actually performed, not automatic verification of the full profile.

## Major events

Each entry has `date`, `type`, `title`, `summary`, `status`, `source`, and `reviewed_at`. Types: `Acquisition`, `Funding`, `Milestone`, `Partnership`, `Revenue`, `Technology`.

Dates are `YYYY-MM-DD` or `YYYY-MM` at the precision published. If a confirmed announcement has no calendar date, use `date: null` and `date_status: "not_published"`. Never substitute today's date. Sort dated events newest first, followed by undated ones. Do not manufacture events to reach a quota.

Keep summaries concise and clearly distinguish company claims, independent results and future plans. Use direct source URLs and avoid duplicate milestones. Revenue needs a currency and reporting period; do not infer ARR.

## Logos

Use validated local PNG files in `assets/logos/`. The website must not request remote logos at runtime. Identify the official source and relevant rights in the PR. Ask the maintainer before changing fallback expectations in the validator.
