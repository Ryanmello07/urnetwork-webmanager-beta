# SSO Extension Security Hardening Plan

> **Goal:** Harden the website ↔ extension SSO flow without touching the backend API.
> We will **warn** users about unverified extensions instead of blocking, keep the login flow intact for beta/dev/self-built extensions, and reduce the most serious client-side risks (clickjacking, URL leakage of the auth code, stale state, HTTP downgrade).

**Repos involved:**
- `urnetwork-webmanager` (website)
- `urnetwork-extension` (browser extension)

---

## Task 1: Add soft extension verification (website)

**Files:**
- Modify: `src/services/extensionAuth.ts`
  - Add `VERIFIED_EXTENSION_IDS: string[]` (empty for now; will be populated after Chrome/Firefox publication).
  - Add `VERIFIED_EXTENSION_NAMES` constant (`['URnetwork']`).
  - Add `isVerifiedExtension(name)` helper.
  - Update `validateExtensionParams` to return `{ isVerified, verifiedReason }` alongside parsed params.
  - Update `logExtensionAuthEvent` to include `isVerified`.

**Acceptance:**
- `npm run lint` passes.
- `validateExtensionParams` still accepts every extension but surfaces verification status.

---

## Task 2: Show unverified-extension warning on the approval page (website)

**Files:**
- Modify: `src/pages/LoginExtension.tsx`
  - Use the new `isVerified` flag.
  - Render a yellow warning block when `!isVerified`, explaining:
    > “This extension is not verified. This can happen with beta, developer, or self-built extensions. Only approve if you trust the source.”
  - Keep both **Approve** and **Deny** buttons enabled.
  - Pass `isVerified` into `logExtensionAuthEvent`.

**Acceptance:**
- Loading `/login-extension?extension_name=Evil&extension_version=1&state=...` shows the warning.
- Loading with `extension_name=URnetwork` does not show the warning.

---

## Task 3: Add clickjacking / iframe protection (website)

**Files:**
- Modify: `src/pages/LoginExtension.tsx`
  - Add a guard that detects `window.self !== window.top`.
  - If framed, render a warning and a button to open the same URL in a new tab:
    > “For security, extension approval cannot be done inside another page. Open in a new tab.”
- Modify: `index.html`
  - Add `<meta name="referrer" content="no-referrer">`.

**Acceptance:**
- Approval UI is not usable inside an iframe.
- Referrer is suppressed for navigation away from the SSO pages.

---

## Task 4: Move the auth code out of URL query params (website + extension)

**Website:**
- Modify: `src/pages/LoginExtension.tsx`
  - Change the post-approval redirect from `/login-extension/complete?code=...&state=...` to `/login-extension/complete#code=...&state=...`.

**Extension:**
- Modify: `src/utils/sso.ts`
  - Update `isSsoCompleteUrl` to enforce `protocol === 'https:'`.
  - Update `parseSsoCompleteUrl` to read `code` and `state` from `parsed.hash` instead of `parsed.searchParams`.
  - Strip the leading `#` before parsing.

**Acceptance:**
- After approval, the browser URL is `/login-extension/complete#code=...&state=...`.
- The extension successfully extracts code and state from the hash.
- HTTP complete URLs are rejected.

---

## Task 5: Clean up stale SSO state (extension)

**Files:**
- Modify: `src/utils/sso.ts`
  - In `retrieveAndValidateState`, call `clearSsoState()` when state is missing, mismatched, or expired.
  - After successful validation, also clear state (callers should consume the code immediately).

**Acceptance:**
- After any validation result, `sso_state` and `sso_state_ts` are removed from `chrome.storage.local`.

---

## Task 6: Build & lint checks

**Commands:**
```bash
cd /root/urnetwork-webmanager-sso
npm install        # if not already
npm run lint
npm run build

cd /root/urnetwork-extension-sso
npm install        # if not already
npm run build      # or npm run lint/build per project scripts
```

**Acceptance:**
- Both projects build without new TypeScript errors.
- No lint regressions introduced by the changed files.

---

## Task 7: Commit, push, and open PRs

**Website PR:**
```bash
cd /root/urnetwork-webmanager-sso
git add -A
git commit -m "security(sso): warn on unverified extensions, add clickjacking guard, use URL fragment for auth code"
git push origin security/sso-hardening
gh pr create --title "security(sso): harden extension SSO flow" --body-file .github/pr-body-sso.md
```

**Extension PR:**
```bash
cd /root/urnetwork-extension-sso
git checkout -b security/sso-hardening
# [apply extension changes from Task 4 & 5]
git add -A
git commit -m "security(sso): require https, read auth code from URL fragment, clear stale state"
git push origin security/sso-hardening
gh pr create --title "security(sso): harden SSO URL parsing and state cleanup" --body "..."
```

**Acceptance:**
- Both PRs are open with clear descriptions and security rationale.

---

## Out of scope (per user request)

- Backend `/auth/code-create` endpoint changes.
- Hard-blocking unverified extensions.
- Adding real extension IDs (will be done after publication).

## Notes

- The `VERIFIED_EXTENSION_NAMES` check is intentionally soft; extension names can be spoofed, so it only drives UI copy.
- Frame-busting is done in JS because this SPA repo does not control response headers. If the deployment server supports it, add `X-Frame-Options: DENY` / `frame-ancestors 'none'` server-side as well.
- Using URL fragment instead of query string keeps the auth code out of server logs and Referrer headers while remaining observable by the extension.
