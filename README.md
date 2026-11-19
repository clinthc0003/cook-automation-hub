# Cook Automation hub

A small front door for Cook Automation tools. One Cloudflare Worker serves the static site in `public/`. Home welcomes you, Apps reads `public/apps.json`, each app has a feature overview subpage, and live apps open directly in a new tab.

The only app today is World History Map (`https://map.cookaut.com`).

## Local development

```bash
npm install
npm run dev
```

Wrangler prints a local URL (usually `http://localhost:8787`). Use that.

- `#/` is Home
- `#/apps` is the app list
- `#/app/world-history-map` is the World History Map feature overview page
- `#/contact` is the Contact page (`support@cookaut.com`)

There is no build step.

## Deploy

The intended path is Cloudflare Workers Builds. Connect this repo and deploy from `main`. The owner steps are in `HANDOFF.md`.

From a machine already logged in to Cloudflare:

```bash
npm run deploy
```

That runs `wrangler deploy`. It does not change DNS, email, Access, or KV.

## Layout

| Path | What it is |
| --- | --- |
| `wrangler.jsonc` | Worker name and static assets |
| `public/` | HTML, CSS, JS, app list, manifest, icons |
| `AGENTS.md` | Rules for later edits |
| `HANDOFF.md` | What is done, what is deferred, how to connect Builds |
