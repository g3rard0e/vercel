# Geamy Services LLC - Website

React + Vite website with an original, scroll-driven network journey.

## Development and release

```sh
npm ci
npm test
npm run dev
npm run build
```

`npm run build` runs the backend regression tests before producing `dist/`.
The Vercel GitHub integration deploys the project; production changes belong on
`main` only after a successful preview build. Check the deployment status for the
exact commit, not just the most recent successful deployment.

The ordinary Vite development server serves the frontend only. Use `vercel dev`
with server-only environment variables to test the Vercel contact function, or
Cloudflare Pages local tooling for `functions/api/contact.js`.

## Interactive network experience

`src/components/network-scene.js` projects original procedural device geometry
onto a Canvas 2D surface. `NetworkJourney.js` provides the lifecycle, scroll-driven
camera, pointer exploration, device selection, chapter controls and pause mode.
It is an illustrative network, not live traffic or a security measurement.

The experience uses native scrolling, limits pixel density and drawing frequency,
pauses outside the viewport or on hidden tabs, supports touch layouts, and follows
`prefers-reduced-motion`. Keyboard-accessible chapter buttons and a skip link
provide alternatives to the visual canvas. No external images, animation library,
video download, analytics or new runtime dependency is required.

## Contact service

- Browser: `src/sections/Contact.jsx`.
- Shared server implementation: `lib/contact.js`.
- Vercel adapter: `api/contact.js`.
- Cloudflare Pages adapter: `functions/api/contact.js`.

Required server environment variables are `MS_TENANT_ID`, `MS_CLIENT_ID`,
`MS_CLIENT_SECRET`, and `MS_FROM_EMAIL`. Existing names are preserved. Microsoft
Entra ID client credentials obtain an app-only Graph token; Graph sends only from
and to the server-configured mailbox. The visitor address is used for Reply-To.
Neither the client secret nor the access token is sent to the browser.

Optional `ALLOWED_ORIGINS` is a comma-separated exact origin allowlist. Without
it, the request's current host is used so same-origin preview deployments work.
Do not add broad wildcard origins.

Optional CAPTCHA requires BOTH `VITE_TURNSTILE_SITE_KEY` (public build-time value)
and `TURNSTILE_SECRET_KEY` (server-only secret). Register approved hostnames in the
Turnstile dashboard, configure both environments, then rebuild. The verification
action is `contact`. Verification fails closed for missing or mismatched
configuration when the challenge is enabled. CAPTCHA is not enabled merely by
merging this code: real keys must be configured outside GitHub.

See `SECURITY.md` for controls, platform requirements, limitations and rotation.
