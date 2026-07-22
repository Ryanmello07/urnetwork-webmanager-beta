# URnetwork Webmanager (Beta)

Web dashboard for managing URnetwork clients, providers, wallets, and network
statistics. Built with React 19, Vite, Tailwind CSS, and Chart.js.

This is the **beta** build, pre-configured for the public beta server at
**`http://74.50.11.113:8080`**. The redesign branch replaces the old UI with URnetwork
brand tokens, fonts, and a fully skinned dashboard.

> **Note:** This repo replaces the old `urnetwork-webmanager-beta` content with the
> `beta/urnetwork-redesign` from the main repo, preserving the CORS proxy fixes and
> beta-specific configuration.

## Quick Start

```sh
cp .env.example .env   # adjust VITE_API_BASE if needed
npm install
npm run dev            # start dev server
npm run build          # production build
npm run lint           # eslint
```

## Environment Variables

- `VITE_API_BASE` — Backend API base URL. Defaults to `http://74.50.11.113:8080`.
  The UI also has a **custom server override** via the Network Server modal on the
  Account page, stored in `localStorage` — no rebuild needed.

## Beta Notes

- The dev server proxies `/api/*` to `http://74.50.11.113:8080`.
- The Supabase `api-proxy` edge function (`supabase/functions/api-proxy/`) handles
  CORS and forwards requests to the backend with proper `Host` headers.
- Wallet login only — email and phone signup flows are not configured on the beta server.
- Production uses `https://api.bringyour.com`; this beta build uses the HTTP
  public IP endpoint intentionally for lab testing.

## Project Context

Development of this fork is tracked at
[Ryanmello07/server](https://github.com/Ryanmello07/server).

## Branding

The UI follows the URnetwork design system defined in
[urnetwork/elements](https://github.com/urnetwork/elements). Design tokens
(colors, radii, shadows, fonts) live in `tailwind.config.js` and
`src/index.css`; chart colors in `src/theme/chartColors.ts`; per-country
location colors in `src/theme/locationColors.ts`.

**Fonts:** `src/assets/fonts/` contains licensed commercial fonts used across
URnetwork apps — ABC Gravity ([ABC Dinamo](https://abcdinamo.com/typefaces/gravity)),
PP Neue Bit and PP Neue Montreal ([Pangram Pangram](https://pangrampangram.com)).
Do not reuse them outside URnetwork projects.
