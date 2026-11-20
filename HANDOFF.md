# Handoff

## What exists

A static Cook Automation hub, ready to deploy as one Worker named `cook-automation-hub`.

- `wrangler.jsonc` serves `./public` with SPA fallback. No routes, custom domains, KV, Access, or secrets.
- `package.json` has `npm run dev` (`wrangler dev`) and `npm run deploy` (`wrangler deploy`). Wrangler is a devDependency.
- Home and Apps live in one page. Apps renders cards from `public/apps.json`.
- The only app is World History Map (`https://map.cookaut.com`), launched directly in a new tab.
- `#/app/<id>` shows a feature overview subpage with a direct new-tab launch button, a Back to apps link, an animated historical-borders preview (`public/map-preview.js`), stats, features, and additional editorial sections (`app.sections` in `public/apps.json`).
- `#/contact` shows the Contact page with `support@cookaut.com` and a copy-email action.
- `public/manifest.webmanifest`, theme color `#0E1B2B`, brand SVGs in `public/brand/`, and updated `CA` icons. No service worker.
- The header brand is the static cream wordmark (`public/brand/wordmark-cream.svg`).
- The home hero lockup is inline in `public/index.html`. On load, only its CA monogram draws: the C, then the A, then the swoosh, once. The A draws solid; the swoosh cut opens with the swoosh. COOK, AUTOMATION, the rule, and EST. 2019 stay visible. `prefers-reduced-motion` shows the finished lockup.

## Recent changes

- Hero CA draw no longer cuts a swoosh-shaped hole out of the A while the A is stroking. That clear-space mask stays closed until the swoosh wipe, then opens with it. The settled lockup still matches `public/brand/lockup-est2019-cream.svg`.
- Moved the one-time CA draw off the header and onto the CA monogram inside the home hero lockup (`public/index.html`, `public/styles.css`, `public/app.js`). The header is the static cream wordmark again. COOK, AUTOMATION, the rule, and EST. 2019 in the lockup do not animate. `prefers-reduced-motion` shows the finished lockup.
- Added `02 · Narrated tours` (`Tours that talk you through the map`) and `03 · Go down the rabbit hole` (`Every name links to the source`) to `public/apps.json` (`sections` array) for World History Map, rendered via `renderAppDetail` in `public/app.js` with divider/lead styles in `public/styles.css`.
- Added the animated World History Map preview (`public/map-preview.js`) across Home, Apps, and the World History Map overview page.
- Added the Contact page (`#/contact`) with `support@cookaut.com`.

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
