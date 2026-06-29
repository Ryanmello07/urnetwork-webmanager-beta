# URnetwork Webmanager Beta

Beta dashboard for the Ryanmello07 URNetwork server fork.

## Quick Start

```bash
cd urnetwork-webmanager-beta
npm install
npm run dev
```

The dev server is configured to proxy `/api/*` to the public beta server at `http://74.50.11.113:8080`.

## Environment Variables

Copy `.env.example` to `.env` and adjust if needed:

```bash
cp .env.example .env
```

- `VITE_API_BASE` — Backend API base URL. Defaults to `http://74.50.11.113:8080`.

## Beta Notes

- This repo is the beta version of `Ryanmello07/urnetwork-webmanager`.
- Branch `beta/main` includes PR #3 (Solana wallet challenge flow) and is pre-configured for the public beta server.
- **Wallet login only**: The beta server enables Solana wallet login. Email and phone signup flows are unconfigured and will not work.
- Production uses `https://api.bringyour.com`; this beta build uses the HTTP public IP endpoint intentionally for lab testing.

## Build

```bash
npm install
npm run build
```

Output is written to `dist/`.
