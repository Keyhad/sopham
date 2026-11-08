# Cloudflare Workers

## What it does for Sopham

GitHub Pages serves a static frontend. A browser request directly to Stockholm Vatten och
Avfall (SVOA) is blocked by its CORS policy, so the browser must not call SVOA directly. A
Cloudflare Worker can make that upstream request server-side:

1. The browser sends the address to the Worker with `POST /pickups`, or requests official
   address suggestions with `POST /addresses`.
2. The Worker validates the request, checks its configured origin and access gate, applies
   rate limiting, and calls SVOA's fixed search endpoint.
3. The Worker validates and returns only the fields Sopham needs. Requests and responses are
   not cached.

The Worker is a relay, not an SVOA API or an authorization workaround. SVOA's service is
undocumented; server-side access and reuse of its data still require SVOA's written approval.

## Setup and deployment

- A `workers.dev` subdomain is enough to start; no custom domain or DNS change is needed.
- Review the Worker in [worker/index.ts](../../worker/index.ts) and its settings in
  [worker/wrangler.jsonc](../../worker/wrangler.jsonc).
- Use Node.js 20.19+, 22.13+, or 24+, then run `./init.sh` to install dependencies from the
  lockfile. No Python virtual environment or Python requirements file is needed for this
  project.
- Use `npm run lint`, `npm test`, and `npm run worker:check` to verify changes. To deploy
  locally, authenticate with `npx wrangler login`, then run `npm run worker:deploy`.
  Do not share or commit account tokens.

### CI behavior

The existing [Pages workflow](../../.github/workflows/pages.yml) now handles both services:

- Pull requests install Node dependencies, run lint, tests, a Worker dry run, and build the
  static frontend. No Cloudflare credentials are supplied to this job.
- A push to `main` runs those checks first, then builds the frontend, deploys the Worker, and
  publishes GitHub Pages in the same workflow run.
- A manual run can also be started from **Actions → Deploy Sopham (Worker + Pages) → Run
  workflow** on `main`.

### One-time GitHub Pages setup

In the GitHub repository, open **Settings → Pages** and set **Build and deployment → Source**
to **GitHub Actions**. The workflow uses this to publish the `out` directory.

### One-time Cloudflare setup

1. In Cloudflare, enable a `workers.dev` subdomain for the account if prompted. Sopham does not
   need a custom domain or DNS zone.
2. Open **Manage Account → API Tokens → Create Token** and choose the **Edit Cloudflare
   Workers** template.
3. Narrow the policy's **Account Resources** to only the account that will own `sopham-pickups`,
   not all accounts. If the account-owned token screen says **Entire Account**, confirm you are
   creating the token inside the correct account.
4. The template includes permissions for other Worker products. Keep `Workers Scripts` →
   **Edit** and `Account Settings` → **Read**. Remove permissions for Worker routes/zones, KV,
   R2, Tail, Containers, CI, Observability, AI, and user details/memberships; this project does
   not use those. Do not select **Admin**. The `Workers Scripts` permission may be labelled
   **Legacy** in the dashboard.
5. Create the token and copy its value; Cloudflare only shows it once. Keep it private.

To find the **Account ID** in Cloudflare, select the account that owns the Worker and open its
account overview. If you are already viewing the Worker in the dashboard, the ID is also the
path segment immediately after `dash.cloudflare.com/` in the address bar; copy only that
segment, not a zone ID.

To save the ID in GitHub, open the repository and go to **Settings → Secrets and variables →
Actions → Repository secrets → New repository secret**. Add these repository secrets:

- `CLOUDFLARE_API_TOKEN` — the token value.
- `CLOUDFLARE_ACCOUNT_ID` — the Cloudflare account ID.

Enter each name exactly as shown, paste its value into **Secret**, and choose **Add secret**.
If you cannot see repository **Settings** or **New repository secret**, you may need repository
administrator access.

Cloudflare's [GitHub Actions instructions](https://developers.cloudflare.com/workers/ci-cd/external-cicd/github-actions/)
have current dashboard labels. Never put the token in source code, a public Actions variable,
or workflow logs. The Cloudflare API token is needed only by the publish job; pull-request
checks do not receive it.

### First deployment and frontend connection

Before the first workflow run, deploy the Worker once with `npm run worker:deploy` (after
`npx wrangler login`) or use the URL from an existing deployment. In GitHub **Settings → Secrets
and variables → Actions → Variables**, add `NEXT_PUBLIC_PICKUP_WORKER_URL` with the Worker URL
ending in `/pickups`. The URL is public, not a secret. The workflow requires this variable so
it does not publish a frontend with its address input disabled.

After adding the secrets and variable, push to `main` or manually run the workflow. It builds
the frontend, deploys the Worker, publishes Pages, then smoke-tests the published page and the
Worker's CORS preflight. The smoke test submits no address and does not call SVOA.

The current `SVOA_ACCESS_APPROVED` flag is `"false"`, so the address form can be enabled while
actual lookups are still rejected by the Worker. Only after written SVOA approval and the
required reviews should you set the flag to `"true"` in
[worker/wrangler.jsonc](../../worker/wrangler.jsonc) and push the change. The same workflow
then deploys the approved Worker and frontend together.

Set `ALLOWED_ORIGIN` to the exact frontend origin (currently `https://keyhad.github.io`).
It is a Worker setting in [worker/wrangler.jsonc](../../worker/wrangler.jsonc), not a Pages
Actions variable.

## Cost

Cloudflare's [Workers pricing](https://developers.cloudflare.com/workers/platform/pricing/)
lists a Free plan with 100,000 Worker requests per day. That should be a reasonable starting
point for Sopham's expected low traffic. A Worker request made by the frontend is counted; the
Worker-to-SVOA subrequests are not billed as separate Worker requests.

The Workers Paid plan starts at **$5 USD per month per Cloudflare account**, including
10 million requests and 30 million CPU milliseconds per month. Beyond the included usage, the
listed rates are $0.30 per million extra requests and $0.02 per million extra CPU milliseconds.
See Cloudflare's [plan limits](https://developers.cloudflare.com/workers/platform/limits/) for
the current Free and Paid limits. Prices may change and taxes may apply.

## Approval and current configuration

Keep `SVOA_ACCESS_APPROVED` set to `"false"` until written SVOA approval, legal review, and
privacy review are complete. Only then enable it and deploy the Worker. Cloudflare will process
the submitted address and connecting IP; SVOA receives the address from the Worker.

The current [worker/wrangler.jsonc](../../worker/wrangler.jsonc) has `SVOA_ACCESS_APPROVED`
set to `"false"`, so a deployed Worker will reject live lookups until the flag is explicitly
enabled after approval. The GitHub Pages Actions variable does not control this approval gate.

For detailed endpoints, safeguards, testing, and shutdown instructions, see
[the backend guide](../backend.md).