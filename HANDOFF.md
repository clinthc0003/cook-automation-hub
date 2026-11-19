# Handoff

## What exists

A static Cook Automation hub, ready to deploy as one Worker named `cook-automation-hub`.

- `wrangler.jsonc` serves `./public` with SPA fallback. No routes, custom domains, KV, Access, or secrets.
- `package.json` has `npm run dev` (`wrangler dev`) and `npm run deploy` (`wrangler deploy`). Wrangler is a devDependency.
- Home and Apps live in one page. Apps renders cards from `public/apps.json`.
- The only app is World History Map. The frame loads `https://map.cookaut.com`. The workers.dev fallback (`https://world-history-map-project.clinthc0003.workers.dev/`) is a link, not the frame source.
- `#/app/<id>` shows Back, Open in new tab, and a short note when the app blocks embedding.
- `public/manifest.webmanifest`, theme color `#0E1B2B`, brand SVGs in `public/brand/`, and updated `CA` icons. No service worker.

## Deferred

Do not build these until the owner asks:

- Cloudflare Access in front of the hub
- An agreement popup, and the KV namespace it would need
- DNS changes, including moving any hostname
- cookaut.com email (MX and related records)

## Owner steps: Workers Builds

Do this in the Cloudflare dashboard. Do not change DNS, Email Routing, or other account settings while connecting the repo.

1. Log in to the [Cloudflare dashboard](https://dash.cloudflare.com) and open the account that should own the Worker.
2. Go to **Workers & Pages**.
3. Select **Create**.
4. Under **Import a repository**, choose **GitHub**. If asked, install or authorize the Cloudflare Workers and Pages GitHub app. Limit it to `clinthc0003/cook-automation-hub` when GitHub lets you.
5. Select the `cook-automation-hub` repository.
6. Set the project fields:
   - **Project name / Worker name:** `cook-automation-hub` (must match `name` in `wrangler.jsonc`)
   - **Production branch:** `main`
   - **Build command:** leave empty. This site has no build step.
   - **Deploy command:** `npx wrangler deploy`
   - **Root directory:** repository root (leave the default `/`)
   - **API token:** keep the token Workers Builds creates. Do not put a token in the repo.
7. Select **Save and Deploy**.
8. Open the `workers.dev` URL from the deploy and check Home, Apps, and World History Map (`#/app/world-history-map`).

Later pushes to `main` deploy on their own. Leave preview builds off unless you want branch deploys.

A manual deploy from your own machine is `npx wrangler login` once, then `npm run deploy`. Prefer Workers Builds so production does not depend on a laptop login.

## Custom domain later

Skip this until the `workers.dev` URL looks right.

1. Workers & Pages → **cook-automation-hub** → **Settings** → **Domains & Routes** → **Add** → **Custom domain**.
2. Choose a new hostname, such as `hub.cookaut.com`. Confirm only if Cloudflare will add the record for that hostname.
3. Do not edit MX, SPF, DKIM, DMARC, or Email Routing for cookaut.com. Do not repoint existing mail or app hostnames as part of this step.
