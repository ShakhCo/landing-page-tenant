# Reviews — Design

Date: 2026-06-15
Repos: `bookup.uz` (customer frontend), `nestjs-project` (backend). Owner mini-app
view is out of scope for now.

## Problem

Customers should be able to leave a review (1–5 stars + optional comment) after
their booking is completed, and that rating should surface publicly on the
business's tenant page as social proof.

A token-based review module already exists in the backend (one-time `/reviews/:token`
SMS link + page). We are **replacing that flow**: instead of a separate page and
token, the post-completion SMS links to the **existing booking page**
(`https://<subdomain>.bookup.uz/b/<shortId>`), and that page hosts the review form
once the booking is completed. A review is tied to the **booking id**, not a token.

## Scope

1. **Customer review on the booking page** (`/b/[id]`): submit + display, gated on
   booking status `completed`.
2. **Public ratings on the tenant page**: ⭐ average + count near the business name,
   and a reviews list section (placed after the location card → renders under
   working hours on desktop, below the map on mobile).
3. **Out of scope (later):** owner reviews view in the mini app (backend
   `GET /businesses/:id/reviews` already exists, no UI built now).

## Existing backend (reuse)

- `Review` entity (`src/businesses/reviews/review.entity.ts`): one row per booking
  (`uq_reviews_booking_id`), with `rating`, `comment`, `requestedAt`, `submittedAt`,
  nullable `userId` (guest = null), and a NOT NULL unique `token` (kept; unused by
  the new flow — we still generate one when creating a row).
- `ReviewsService.requestForBooking(bookingId)`: called on booking completion
  (`bookings.service.ts:991`, `:1087`). Creates the `Review` row (state `requested`)
  and sends an SMS. Best-effort, never throws into the caller.
- `BusinessReview` shape + `listForBusiness()` (owner) already compute average/count.

## Backend changes (`nestjs-project`)

### 1. Submit a review by booking id (new public endpoint)
- Route: `POST /public/tenants/:subdomain/bookings/:id/review`, body `{ rating: 1–5, comment?: string }`.
  Public + signature-skipped, rate-limited (e.g. 10/60s), same as other public booking routes.
- Auth: **possession of the unguessable booking id** (consistent with cancel/reschedule).
- Logic (`ReviewsService.submitForBooking(businessId, bookingId, dto)`):
  - Resolve the booking within the tenant; it must exist and be **`completed`**
    (else `INVALID_REVIEW` / appropriate error).
  - Validate `rating` is an integer 1–5 and `comment` ≤ `REVIEW_COMMENT_MAX` (2000),
    else `INVALID_REVIEW`.
  - Find-or-create the `Review` row for the booking (find-or-create handles bookings
    completed before this feature; new rows get a generated `token`). Under a
    pessimistic write lock: if `submittedAt != null` → `REVIEW_ALREADY_SUBMITTED`;
    otherwise set `rating`, `comment`, `submittedAt = now`.
  - Return the resulting review state `{ submitted: true, rating, comment }`.

### 2. Review state in the public booking response
- `GET /public/tenants/:subdomain/bookings/:id` (the `redact`ed `getBooking` result)
  gains: `review: { submitted: boolean; rating: number | null; comment: string | null } | null`
  (null when no review row exists yet). The frontend derives "can review" from
  `booking.status === 'completed' && !review?.submitted`.

### 3. Public reviews on the tenant payload
- `GET /public/tenants/:subdomain` (`PublicTenantService`) gains:
  - `averageRating: number | null` (1-decimal, over submitted reviews),
  - `reviewCount: number`,
  - `reviews: Array<{ rating: number; comment: string | null; customerName: string; submittedAt: string; services: LocalizedText[] }>`
    — recent ~20 **submitted** reviews, newest first.
- `customerName` is **first name only** (privacy); guest → guest first name or "Mehmon".
- Included in the existing payload (no extra round-trip; SSR-friendly).

### 4. Post-completion SMS link
- Change `requestForBooking` so the SMS link points to the booking page
  `https://<business.subdomain>.bookup.uz/b/<shortId>` (shortId = first 8 hex of the
  booking id) instead of `/reviews/<token>`. Template change → **must be moderated in
  Eskiz** before it sends as written.
- The old token endpoints (`GET/POST /reviews/:token`) are left in place but unused;
  can be removed in a later cleanup.

## Frontend changes (`bookup.uz`)

### Booking page (`app/tenant/[subdomain]/b/[id]/`)
- `getBooking` (lib/tenant.ts) type gains `booking.review` per above.
- `BookingResult` review block, shown only when `booking.status === 'completed'`:
  - Not submitted → form: 5 tappable stars + optional comment textarea + Submit.
  - Submitted → read-only stars + comment + a short "thanks" line.
- New server action `submitReviewAction(subdomain, bookingId, rating, comment)` →
  `POST …/bookings/:id/review`; on success refresh the page (`router.refresh()`).
  Errors mapped to friendly Uzbek text (reuse `mapErrorCode`); `REVIEW_ALREADY_SUBMITTED`
  → just show the submitted state.

### Tenant page (`app/tenant/[subdomain]/TenantView.tsx`)
- ⭐ average + `reviewCount` near the business name (beside the open status), shown
  only when `reviewCount > 0`.
- A **Reviews** section placed right after the location card (so: under working hours
  on desktop where the location card is hidden; below the map on mobile). Lists recent
  reviews — each with stars, comment, first name, date. Shown only if `reviews.length > 0`.

### i18n (uz/ru/en, `lib/dictionaries/tenant.*` and result dict)
- Keys: leave-a-review title, "your rating", "comment (optional)", submit, "thanks for
  your review", "Reviews" heading, "{n} reviews"/average label, star aria-labels.

## Data flow

1. Booking marked **completed** → backend `requestForBooking` creates the `Review` row
   (requested) and texts the booking-page link.
2. Customer opens `/b/<shortId>` → page shows the review form (status completed, not
   submitted).
3. Customer rates + (optionally) comments → `submitReviewAction` → `POST …/review` →
   row updated (`submittedAt`).
4. Page re-renders showing the submitted review. The tenant page's aggregate
   (`averageRating`, `reviewCount`, `reviews`) reflects it on next load.

## Authorization, errors, edge cases

- Submit authorized solely by possession of the booking id; backend re-checks status
  and duplicate under a row lock.
- One review per booking, **one-time** — no editing after submit.
- Already submitted → frontend renders the submitted review (no error banner).
- Not completed → no form rendered; backend rejects if called directly.
- Guest bookings (no `userId`) are reviewable via the link; public name uses the
  guest first name or "Mehmon".
- `averageRating`/badge hidden when there are zero reviews.

## Testing

- Backend: `submitForBooking` — rejects non-completed, rejects/locks double submit
  (`REVIEW_ALREADY_SUBMITTED`), validates rating range and comment length, find-or-create
  path. Public tenant payload includes correct average/count and first-name redaction.
- Frontend: build + typecheck; manual check of the three states (no review form when not
  completed, form when completed, submitted view after).
