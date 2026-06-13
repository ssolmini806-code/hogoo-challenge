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
- CSP remains Report-Only, but now includes `base-uri`, `form-action`, `frame-ancestors`, `script-src-attr 'none'`, `worker-src`, and `upgrade-insecure-requests`.
- `invite-user` Edge Function validates allowed origins, verifies the Supabase JWT with `auth.getUser()`, validates email shape, and avoids returning raw internal errors.

## Must be done in Supabase

1. Apply migrations:
   - `supabase/migrations/20260613000000_challenge_reviews_rls.sql`
   - `supabase/migrations/20260613001000_client_tables_rls_hardening.sql`
2. Run `docs/supabase-rls-audit.sql`.
3. Run `docs/challenge-reviews-rls-verification.sql` with real `auth.users.id` values.
4. Confirm these expectations:
   - Public users can read public challenge review display fields only.
   - Public users cannot read `challenge_reviews.user_id`.
   - Authenticated users can insert only their own challenge reviews.
   - Authenticated users can update/delete only their own challenge reviews.
   - Authenticated users can read only their own `profiles`, `user_progress`, `user_rewards`, `payment_orders`, and `user_subscriptions` rows.
   - Public `hall_of_fame` rows intentionally contain no private data.
5. For the invite Edge Function, set `ALLOWED_ORIGINS` if staging/local origins need to call it. The default allows `https://hogoo-challenge.pages.dev`.

## CSP next phase

Do not switch to enforcing `Content-Security-Policy` until these are complete:

1. Move inline analytics/bootstrap scripts into bundled or static JS files where practical.
2. Replace remaining user-visible `innerHTML` render paths with DOM APIs or React rendering unless the source is trusted static content.
3. Keep JSON-LD scripts as the last exception to review.
4. Test these pages under an enforcing CSP in staging:
   - `/`
   - `/give-test.html`
   - `/hogoo-test.html`
   - `/reviews.html`
   - `/relationship-risk.html`
   - `/hogoo-check.html`
   - `/result-sequence.html`

## Known accepted temporary risks

- CSP is still Report-Only because the current static pages rely on inline scripts.
- Several remaining `innerHTML` usages render trusted local constants or static auth notice markup. They should still be refactored before CSP enforcement.
- Share reward completion remains a client-confirmed UX reward. Paid discounts or sensitive paid content should use a server-side reward unlock function.
