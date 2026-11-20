# Agent notes

Rules for anyone changing this repo.

## How to work

- Keep the site plain HTML, CSS, and vanilla JavaScript. No framework, and no build step.
- Write code a person can read. Use section comments and leave sensible spacing between sections.
- Commit on `main`. Do not open pull requests for routine hub updates, and do not force-push.
- Log all changes in `HANDOFF.md` (updating "What exists" and "Recent changes" as needed) so the next agent has an accurate handoff.
- Do not add secrets, API tokens, `.dev.vars`, account IDs, or anything else that should stay out of git.
- Do not add Cloudflare Access, KV, custom domains, routes, or other bindings unless the owner asks for that change in this repo.
- Do not change DNS. Do not touch cookaut.com mail records: MX, SPF, DKIM, DMARC, or Email Routing.

## Leave these deferred

- Cloudflare Access in front of the hub
- An agreement popup backed by KV
- DNS moves for any cookaut.com hostname
- cookaut.com email

Details and the owner's deploy steps are in `HANDOFF.md`.
