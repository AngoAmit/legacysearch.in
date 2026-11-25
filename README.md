# Legacy Search — The Next Chapter

A five-page static site for Legacy Search Advisory Private Limited with a two-step enquiry form and a Supabase PostgreSQL intake service. The bundled `dist/` is a ready-built **preview**. A release build uses your deployed enquiry endpoint and removes the preview notice.

## Run locally

Use Node.js 22 or newer. The build, preview server and unit tests use Node's standard library. There are no frontend packages to install.

```sh
npm run build
npm start
```

Open http://127.0.0.1:4173/. Use the local server so ES modules, relative routes and directory indexes load correctly. Run `npm test` to exercise the role schemas, HTTP handler and generated pages. Tests build in preview mode, so run the release build **after** testing.

## Connect the production database

1. Create or select a Supabase project owned by Legacy Search. In its settings, enable the Data API with the public schema exposed. The website never receives a database key.
2. From this repository, use an installed Supabase CLI and run the commands below. Replace PROJECT_REF with the project reference from the dashboard. Review the linked project before applying the migration. Use a new project, or review the migration history if the project already has other applications.
3. Create the two Edge Function secrets shown below through **Edge Functions → Secrets**. Generate the HMAC secret locally and keep it stable across releases. Add only the exact production and staging origins that should host a form. Include scheme and port when applicable and omit trailing slashes. GitHub project paths share their origin with the rest of that account’s Pages sites.
4. Deploy the function. This is a public intake endpoint. The function validates the request and uses a server-only key to call a restricted database procedure.

```sh
supabase login
supabase link --project-ref PROJECT_REF
supabase db push
npm run build
supabase functions deploy enquiries --project-ref PROJECT_REF --no-verify-jwt
```

| Function secret | Set to |
| --- | --- |
| ALLOWED_ORIGINS | `https://legacysearch.in,https://www.legacysearch.in` plus your staging origin if needed |
| ENQUIRY_HMAC_SECRET | A private random secret of at least 32 characters |
| SUPABASE_URL and server key | Supplied inside hosted functions by Supabase. The adapter supports the legacy service role key and the default secret key. |

Generate a secret with `node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"`. Do not commit the result. The environment template documents the names. It is not an automatic installer.

The function URL is `https://PROJECT_REF.supabase.co/functions/v1/enquiries`. Browser requests use JSON without an account or an API token. OPTIONS requests support the configured origins. Direct anonymous table access and direct public RPC execution are revoked. The CORS allowlist is a browser control. The honeypot, validation and transactional quotas provide separate intake controls.

## Publish on GitHub Pages

1. Copy the **contents** of this repository into your chosen GitHub repository or release branch. Preserve the hidden `.github/` directory. The workflow targets `main`. Change that branch name if your deployment branch differs.
2. In **Settings → Pages → Build and deployment**, choose **GitHub Actions**. In **Settings → Secrets and variables → Actions → Variables**, create the **repository variable** `ENQUIRY_ENDPOINT` containing the deployed function URL. This URL is public.
3. Push to the deployment branch or run **Deploy Legacy Search** from Actions. The workflow tests the code, builds in release mode and uploads **only `dist/`**. A blank endpoint stops the release.
4. Configure the existing custom domain `legacysearch.in` in **Settings → Pages**. Check the existing DNS records against the Pages instructions for your account, verify the domain, then enable HTTPS. Keep the existing site in place until the new backend passes a staging submission.
5. Relative assets and directory links also support a repository path such as `https://ACCOUNT.github.io/REPO/`. Add `https://ACCOUNT.github.io` to the function allowlist for that staging origin. Canonical and social URLs use the configured production domain.

For another static host, set the public environment variable, run `npm run release` and upload the contents of `dist/`. Use a host that serves directory indexes. No SPA rewrite rule is needed.

```powershell
$env:ENQUIRY_ENDPOINT = 'https://PROJECT_REF.supabase.co/functions/v1/enquiries'
npm run release
```

On POSIX shells use `ENQUIRY_ENDPOINT=https://PROJECT_REF.supabase.co/functions/v1/enquiries npm run release`.

## Manage private enquiries

Authorised staff sign in to the Supabase dashboard, open the correct project, then **Table Editor → public → enquiries**. Give project access only to trusted personnel. Project dashboard access is broader than access to this lead queue. For someone restricted to individual records, use a separately approved least-privilege dashboard before granting them access.

Filter by **status**, **stakeholder_type** or **follow_up_date**. Edit **assigned_team_member**, **internal_remarks**, **follow_up_date** and **status** as the enquiry progresses. The available statuses are New, Contacted, Qualified, In Discussion, Active, Closed and Archived. The public form cannot set these fields.

The receipt is the row’s UUID. A retried request with the same submission ID and payload returns the original reference. Equal submissions with a new ID within 15 minutes also return the stored reference. A changed payload reusing a stored ID is rejected. The database serialises simultaneous submissions. The default limits are four new enquiries per email and twenty per network identifier per hour. Check the forwarded address supplied by your deployed gateway during staging, especially behind an additional proxy. Without that header the network bucket is shared. Expired rate records are pruned during intake.

Optional email alerts use Resend. Set `RESEND_API_KEY`, `LEAD_NOTIFY_FROM` (a verified sender) and `LEAD_NOTIFY_TO` in Edge Function secrets. Alerts contain only the enquiry reference. A mail outage leaves the lead in the queue and writes a diagnostic without contact data. Alerts are best effort, with no background retry. The dashboard is the authoritative queue.

## Verify the hosted release

Submit one clearly labelled test enquiry **from the deployed site** for each role. Confirm the receipt matches the ID in the private table and that role-specific answers, source page, source CTA, transaction type and consent time appear. Check both scout actions. Refreshing the page deliberately clears the in-memory form. Back and retry within the form preserve entered values.

Test a retry after an interrupted response, an invalid phone number and a blank consent checkbox. Verify the public API cannot read the table using a signed-out client. If a form reports a connectivity problem, inspect the function logs and exact allowed origin, then confirm the database migration and service credentials. Never add a public read or insert policy to resolve a submission error. Limit free-tier usage according to the current service plan.

## Edit the site

| Location | Purpose |
| --- | --- |
| `content/brand.json` | Logo, favicon, social card, links, contact number and canonical domain |
| `content/editorial.json` | Acquisition structures, stakeholder journeys, FAQs and sector coverage |
| `scripts/components.mjs`, `home.mjs`, `inner-pages.mjs` | Shared shell, page sections and utility pages |
| `public/css/`, `public/js/` | Responsive styling, motion, navigation and enquiry UX |
| `public/assets/` | Local imagery, fonts and supplied brand marks |
| `supabase/functions/_shared/` | One source for browser and server field definitions and validation |
| `supabase/functions/enquiries/` | Public Edge Function and RPC adapter |
| `supabase/migrations/` | Enquiry schema, permissions, rate limits and atomic lead capture |
| `dist/` | Generated static site. Rebuild after editing source. |

To add a genuine founder photo, place it in `public/assets/images/` and set `founderPhoto` in `content/brand.json` to its relative asset path. Until then, the founder profile uses the official brand mark. Replace the social preview with a branded 1200 × 630 image if the identity changes. Update the domain value before building for a different permanent domain. Review privacy wording against your actual retention and access arrangements.

[GitHub Pages deployment](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages) · [GitHub custom domains](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site) · [Supabase function deployment](https://supabase.com/docs/guides/functions/deploy) · [Function secrets](https://supabase.com/docs/guides/functions/secrets) · [Database permissions](https://supabase.com/docs/guides/database/postgres/row-level-security)

