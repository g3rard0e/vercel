# Security model and operating notes

## Boundaries

This is a public marketing site, not an authenticated customer portal. Contact
submissions do not establish the visitor's identity. The API authenticates itself
to Microsoft Entra ID using the existing confidential app registration and sends
mail through Microsoft Graph. There are no browser sessions or refresh tokens.

## Controls in the application

Both hosting adapters share the same implementation and regression tests:

- POST and exact JSON media-type enforcement; required same-origin Origin and
  explicit form marker; rejection of cross-site browser requests.
- A 24,000-byte application payload limit, a bounded streaming reader for Pages,
  strict field types/lengths, an allowed service list, control-character rejection,
  and HTML escaping before email rendering. Vercel's platform parser may run
  before the application checks the parsed body; edge body limits remain useful.
- Honeypot and elapsed-time heuristics; up to five attempts per source address per
  ten minutes per warm instance, plus a per-instance aggregate cap. Memory is
  bounded. Only Vercel's edge-supplied IP is trusted on Vercel; only the Pages
  platform IP is used in the Pages adapter.
- Optional Turnstile validation checks success, action and hostname on the server.
- Server-only, expiring access-token cache with a refresh margin and concurrent
  request coalescing. Credential changes invalidate the cache. Graph 401 responses
  invalidate it. No tokens, credentials or submitted personal data are logged.
- Eight-second upstream timeouts, rejected redirects, generic public failures and
  no automatic sendMail retry. A successful response means Graph accepted the
  operation; it does not prove delivery to the destination inbox.
- No-store API responses, CSP, frame restrictions, MIME-sniffing protection,
  referrer policy and restrictions on unused browser capabilities. HSTS is scoped
  to the current host; unrelated subdomains are not forced into it.

## Not solved by application code alone

The honeypot, browser headers and timer are not authentication: a determined
caller can reproduce them. The in-memory limiter is best-effort only; cold starts,
multiple regions or multiple instances have independent counters. Configure a
platform WAF/durable rate limit and a real CAPTCHA before treating this endpoint
as protected against coordinated abuse. This release does not create paid
services, change hosting-account rules, or configure production CAPTCHA keys.

Hosting dashboard access is needed to set secrets, CAPTCHA keys, platform rate
limits and bot protections. Entra/Exchange administrator access is needed to
review Mail.Send application permissions and mailbox scoping. A mailbox address
hardcoded in the application is not a tenant-level permission boundary. Review
Exchange Online Application RBAC or the appropriate mailbox-scoping control;
permissions granted by other paths can remain effective. Do not remove existing
permissions until the restricted send path has been tested.

The repository does not prove which external administrator permissions, secret
expiry policy, WAF rules or mailbox constraints are currently configured. This
change is not a penetration test or an audit of Git history/dependencies.

## Credentials and rollout

Keep Microsoft app credentials and TURNSTILE_SECRET_KEY in encrypted hosting
secrets. Only the non-secret Turnstile site key may use the VITE_ prefix. Local
.env and .dev.vars files are ignored. Never copy actual credentials into issues,
commits, screenshots or browser code.

For rotation, add a replacement credential in Entra, update each hosting
environment, redeploy and validate a controlled mail submission, then revoke the
old credential. Existing access tokens can remain valid until expiry. Do not
promise immediate revocation based on removing a secret alone.

Validate a preview build first. After production deploys, check the new asset
hashes, response headers, GET /api/contact rejection and a single authorized test
submission. An actual delivery check requires mailbox confirmation. Do not send
repeated synthetic contact messages. For rollback, redeploy the prior known-good
commit or revert the release commit through GitHub.

## Sources

Microsoft identity client credentials:
https://learn.microsoft.com/entra/identity-platform/v2-oauth2-client-creds-grant-flow

Microsoft Graph sendMail:
https://learn.microsoft.com/graph/api/user-sendmail

Exchange Online application RBAC:
https://learn.microsoft.com/exchange/permissions-exo/application-rbac

Turnstile server-side verification:
https://developers.cloudflare.com/turnstile/get-started/server-side-validation/
