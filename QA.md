# Release verification

## Completed locally

- Generated and checked all five primary pages and both legal pages. The 21 automated tests cover internal resource destinations, titles, canonical and sharing tags, all six stakeholder schemas, server validation, HTTP responses, duplicate receipts and unavailable-backend behaviour.
- Exercised all five primary pages in Chromium at 320 × 568, 375 × 812, 390 × 844, 768 × 1024, 1024 × 768, 1440 × 900 and 1920 × 1080. All 35 layouts passed the horizontal-overflow and visible-control checks.
- Used the browser to traverse all 22 transaction types and five audience selections, deep links, both scout enquiry actions, process stages, geographic selectors, ecosystem selectors and the mobile menu. All six form journeys reached the consent and preview submission states. Required-field errors and step-back value retention were checked.
- Applied the migration to a disposable PostgreSQL 16 database. Submitted all six roles through the real HTTP handler connected to the SQL procedure. Verified stored row IDs against receipts, duplicate recovery, conflicting request IDs, the email limit and refusal of table reads and RPC execution by both anonymous and ordinary authenticated roles.
- Inspected desktop and mobile home layouts, local editorial images and the supplied brand mark. The six WebP images total approximately 280 KB before transport compression.

## Deployment boundary

Local database integration used PostgreSQL with the production RPC and a local adapter. Hosted Supabase, production DNS, email delivery, real devices and Safari/WebKit need project-specific release checks. The bundled static build displays a preview notice. The GitHub Pages workflow requires a configured HTTPS endpoint and verifies its CORS and validation response before uploading the release.

See README.md for configuration and the hosted receipt check. Run `npm test` following source changes. A release build following the tests regenerates the public endpoint configuration.

