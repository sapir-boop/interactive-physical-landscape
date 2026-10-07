# Contributing

Thank you for helping improve the Physical AI Landscape. Contributions can be company additions, sourced corrections, meaningful milestones, accessibility improvements or code fixes.

## Propose a change

1. Check existing profiles and issues to avoid duplicates.
2. For a company or research suggestion, open the company/correction issue form with direct primary-source links. You do not need to code.
3. For a code or data change, fork this repository, create a branch, make a focused change, and open a pull request against `main`.
4. Explain the problem, what changed, the evidence and the checks you ran. The maintainer reviews contributions before merging.

Curated membership and placement are editorial decisions made by Sapir. New company submissions should default to `Secondary` (All profiles). Propose a Curated change explicitly; do not bundle it silently with a factual correction.

## Edit a company

The canonical data is embedded in `index.html`. Use the helper to avoid changing the entire document:

```sh
node scripts/company.cjs get "RobCo" > /tmp/company.json
# Edit /tmp/company.json in your editor.
node scripts/company.cjs apply /tmp/company.json
npm run verify
npm run build
```

To add a company, prepare a complete JSON record following [the data guide](docs/data-guide.md), with a unique company name, and apply it with the same command. The helper does not remove records or rename existing companies. Explain intentional identity changes in your PR.

## Research standards

Use company product/research pages, announcements, investor portfolios and papers. Match the company identity before editing. Include direct sources and the date you actually checked them.

Distinguish demonstrations from deployments, targets from shipments, valuation from financing, and announced transactions from completed transactions. Never invent dates, founders, personal LinkedIn links, revenue periods or investor names. Executive investors do not make their employers investors. Do not add blanket Verified labels.

Keep existing profile history and source links. Use local PNG logos and preserve source attribution. Leave uncertain claims clearly qualified and explain unresolved points in the PR.

## Check your work

```sh
npm run verify
npm run build
```

For interface or content changes, open the result in a browser. Check search, relevant filters, the detail card, website/source/founder links, bookmarks, event navigation, map placement and list view. Check desktop and 320/390/412px phone-size viewports for clipping. State what you did not test.

## Review and publication

The GitHub workflow runs structural and build checks on pull requests. It has read-only repository permissions and no production credentials. Checks passing does not automatically approve a contribution or publish a release. The maintainer handles factual review, merging and Vercel publication separately.

Do not submit credentials, environment files, private contact details, analytics exports, local backups or unrelated personal files. Submit only material you have permission to contribute, and retain the existing copyright and third-party notices.
