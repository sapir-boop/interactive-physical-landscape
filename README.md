# Interactive Physical AI Landscape

An interactive map of the companies building AI for the physical world, curated by **Sapir Hadad**.

**[Explore the live landscape](https://interactive-physical-landscape.vercel.app/)** · [Suggest a company or correction](https://github.com/sapir-boop/interactive-physical-landscape/issues/new/choose) · [Contribute](CONTRIBUTING.md)

Search companies, founders, investors and major events. Browse five ecosystem layers, switch between map and list views, filter by geography or category, and save or compare profiles locally in your browser.

## Run locally

Requires Node.js 22 or newer. There are no npm dependencies for building or running the static checks.

```sh
npm run verify
npm run build
python3 -m http.server 8765 --directory dist
```

Open http://localhost:8765/. Python is only used here to serve static files; any static HTTP server works.

## Contributing

Contributions to research, data quality, accessibility and design are welcome. Start with an issue, or fork the repository and submit a pull request. Include primary sources for factual changes and screenshots for interface changes. Read [CONTRIBUTING.md](CONTRIBUTING.md) before editing.

Sapir maintains editorial control, including Curated membership. Pull requests do not publish to the live website. Production releases remain a separate maintainer action.

## Project structure

- `index.html`: page shell and the canonical `DATA` array of company profiles.
- `assets/app.js`, `assets/styles.css`, `assets/layout.js`: shared interface and layout.
- `assets/logos/`: locally hosted company logos; no external image services at runtime.
- `scripts/company.cjs`: export or apply one company record without reformatting unrelated HTML.
- `scripts/verify-profile-data.cjs`: data consistency and historical regression checks.
- `scripts/verify-placements.cjs`: layer boundaries, targets and collision checks.
- `scripts/build-site.cjs`: copies an explicit public-file allowlist into `dist/`.
- `docs/data-guide.md`: profile and evidence conventions.

The repository starts from the October 7, 2026 production snapshot: 228 profiles, including 83 curated profiles. The running application derives counts from its records.

## Verification limits

Static checks catch structural problems; they do not establish that a source is accurate. Review changed profiles and map/list interactions in desktop and phone-size browser viewports. A viewport check is not a physical-device test.

On the existing production domain only, Vercel Web Analytics measures basic traffic. URL search and hash state are stripped before transmission. Local previews and forks do not enable that analytics script. Saved profiles remain in browser-local storage.

## Rights

The existing copyright notice is preserved. No general open-source license has been granted yet; public visibility alone does not change that. See [NOTICE.txt](NOTICE.txt). Company names, logos and other third-party materials remain subject to their owners' rights.
