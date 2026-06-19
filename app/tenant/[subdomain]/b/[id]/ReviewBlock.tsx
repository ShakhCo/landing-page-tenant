'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Star } from 'lucide-react';
import type { ResultDict } from '@/lib/dictionaries/result';
import { submitReviewAction } from './actions';

export function ReviewBlock({
  subdomain,
  bookingId,
  dict,
  initial,
  businessName,
  submittedAtLabel,
  className = 'mt-6',
}: {
  subdomain: string;
  bookingId: string;
  dict: ResultDict;
  /** Existing review state for this booking; null when no row yet. */
  initial: { submitted: boolean; rating: number | null; comment: string | null; submittedAt: string | null } | null;
  /** Shown as a quiet subtitle so a standalone review card has context. */
  businessName?: string;
  /** Preformatted "when the review was left" (parent owns tz/locale). */
  submittedAtLabel?: string;
  /** Wrapper spacing — defaults to the in-card `mt-6`; pass `''` when on top. */
  className?: string;
}) {
  const router = useRouter();
  const submitted = !!initial?.submitted;
  const [rating, setRating] = useState(initial?.rating ?? 0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState(initial?.comment ?? '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(submitted);

  const Stars = ({ readOnly }: { readOnly?: boolean }) => (
    // Hover preview is mouse-only. On touch, a tap fires pointerenter but no
    // reliable leave, so a stale `hover` would override the real rating and the
    // next tap would look like it did nothing — drive the fill off `rating` and
    // only let a real mouse set `hover`.
    <div className="flex gap-1.5" onPointerLeave={() => !readOnly && setHover(0)}>
      {[1, 2, 3, 4, 5].map((n) => {
        const filled = (hover || rating) >= n;
        return (
          <button
            key={n}
            type="button"
            disabled={readOnly || busy}
            aria-label={`${n}`}
            aria-pressed={rating === n}
            onPointerEnter={(e) => { if (!readOnly && e.pointerType === 'mouse') setHover(n); }}
            onClick={() => { if (!readOnly) { setHover(0); setRating(n); } }}
            className="transition-transform active:scale-90 disabled:cursor-default"
          >
            <Star size={32} className={filled ? 'fill-amber-400 text-amber-400' : 'text-border'} />
          </button>
        );
      })}
    </div>
  );

  const submit = async () => {
    if (rating < 1 || busy) return;
    setBusy(true);
    setError(null);
    const r = await submitReviewAction(subdomain, bookingId, rating, comment);
    if (r.ok) { setDone(true); router.refresh(); return; }
    setBusy(false);
    setError(r.error);
  };

  if (done) {
    return (
      <div className={`${className} rounded-2xl border border-border bg-card p-5`}>
        {/* {businessName && <p className="text-sm text-muted-foreground">{businessName}</p>} */}
        <p className="mt-0.5 text-[15px] font-bold text-foreground">{dict.reviewThanks}</p>
        <div className="mt-3"><Stars readOnly /></div>
        {(initial?.comment || comment) && (
          <p className="mt-3 text-sm text-muted-foreground">{initial?.comment || comment}</p>
        )}
        {submittedAtLabel && (
          <p className="mt-3 text-xs text-muted-foreground">{submittedAtLabel}</p>
        )}
      </div>
    );
  }

  return (
    <div className={`${className} rounded-2xl border border-border bg-card p-5`}>
      {businessName && <p className="text-sm text-muted-foreground">{businessName}</p>}
      <p className="mt-0.5 text-[15px] font-bold text-foreground">{dict.reviewTitle}</p>
      <div className="mt-3"><Stars /></div>
      <label className="mt-4 block text-sm text-muted-foreground">{dict.reviewCommentLabel}</label>
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        rows={3}
        maxLength={2000}
        className="mt-2 w-full resize-none rounded-xl border border-border bg-card p-3 text-sm text-foreground outline-none transition-colors focus:border-foreground"
      />
      {error && <p className="mt-2 text-sm font-semibold text-red-600">{error}</p>}
      <button
        type="button"
        onClick={submit}
        disabled={rating < 1 || busy}
        className="mt-4 h-12 w-full rounded-xl bg-foreground text-sm font-bold text-background transition-opacity hover:opacity-90 disabled:opacity-40"
      >
        {dict.reviewSubmit}
      </button>
    </div>
  );
}
