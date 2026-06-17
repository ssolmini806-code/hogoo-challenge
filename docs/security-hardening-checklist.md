# Security Hardening Checklist

This checklist tracks the remaining security work for the free GIVE site.

## Completed in code

- `reviews.html` validates `return` URLs and rejects external redirects.
- Public challenge review queries avoid selecting `user_id` by default.
- Admin mode localStorage state expires after one hour and migrates the legacy `"true"` value.
- A+B reward writes re-check existing reward rows before storing the combined reward.
- `challenge_reviews` has an idempotent RLS migration.
- Client-facing Supabase tables have guarded RLS hardening for existing tables:
  - `profiles`
  - `user_progress`
  - `reviews`
  - `payment_orders`
  - `user_subscriptions`
- `target="_blank"` links include `rel="noopener noreferrer"`.
- Repeated share buttons use `data-share-action` with delegated listeners in `/share.js` instead of inline `onclick`.
- Stylesheet preload `onload` handlers were replaced with normal stylesheet links.
- Result image fallback handlers were moved from inline `onerror` attributes to JS event listeners.
- Core free-test CTA buttons use JS event listeners instead of inline `onclick`.
- A scan for inline event attributes in HTML/JS files now returns no matches.
- High-risk result rendering paths in `reviews.html`, `give-test.html`, `relationship-risk.html`, `hogoo-check.html`, `selfless-otherish-test.html`, and `result-sequence.html` now use DOM APIs or `textContent` instead of interpolated HTML strings where practical.
- A scan for `.innerHTML` in HTML/JS files now returns no matches.
- Shared analytics/bootstrap setup lives in `/site-bootstrap.js`; paid-site environment injection lives in `/src/site-env.js`.
- `hogoo-test.html`, `affiliate.html`, and `public/challenge-done.html` no longer need their small inline bootstrap scripts.
- CSP remains Report-Only, but now includes `base-uri`, `form-action`, `frame-ancestors`, `script-src-attr 'none'`, `worker-src`, and `upgrade-insecure-requests`.
- `invite-user` Edge Function validates allowed origins, verifies the Supabase JWT with `auth.getUser()`, validates email shape, and avoids returning raw internal errors.

## Supabase verification

Verified manually in Supabase SQL Editor on 2026-06-15:

- Applied migrations:
   - `supabase/migrations/20260613000000_challenge_reviews_rls.sql`
   - `supabase/migrations/20260613001000_client_tables_rls_hardening.sql`
- Ran `docs/supabase-rls-audit.sql`.
- Ran `docs/challenge-reviews-rls-verification.sql` with a real `auth.users.id`.
- Confirmed these expectations:
  - Public users can read public challenge review display fields only.
  - Public users cannot read `challenge_reviews.user_id`.
  - Authenticated users can insert their own challenge reviews.
  - Client-facing private tables report RLS enabled.

Still needed if staging/local origins call the invite Edge Function:

- Set `ALLOWED_ORIGINS`. The default allows `https://hogoo-challenge.pages.dev`.

## CSP next phase

Do not switch to enforcing `Content-Security-Policy` until these are complete:

1. Move remaining page-level inline scripts into bundled or static JS files where practical.
2. Keep JSON-LD scripts as the last exception to review.
3. Test these pages under an enforcing CSP in staging:
   - `/`
   - `/give-test.html`
   - `/hogoo-test.html`
   - `/reviews.html`
   - `/relationship-risk.html`
   - `/hogoo-check.html`
   - `/result-sequence.html`

## Known accepted temporary risks

- CSP is still Report-Only because the current static pages rely on inline scripts.
- Share reward completion remains a client-confirmed UX reward. Paid discounts or sensitive paid content should use a server-side reward unlock function.
