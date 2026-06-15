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
}: {
  subdomain: string;
  bookingId: string;
  dict: ResultDict;
  /** Existing review state for this booking; null when no row yet. */
  initial: { submitted: boolean; rating: number | null; comment: string | null } | null;
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
    <div className="flex gap-1.5">
      {[1, 2, 3, 4, 5].map((n) => {
        const filled = (hover || rating) >= n;
        return (
          <button
            key={n}
            type="button"
            disabled={readOnly || busy}
            aria-label={`${n}`}
            onMouseEnter={() => !readOnly && setHover(n)}
            onMouseLeave={() => !readOnly && setHover(0)}
            onClick={() => !readOnly && setRating(n)}
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
      <div className="mt-6 rounded-2xl border border-border bg-card p-5">
        <p className="text-[15px] font-bold text-foreground">{dict.reviewThanks}</p>
        <div className="mt-3"><Stars readOnly /></div>
        {(initial?.comment || comment) && (
          <p className="mt-3 text-sm text-muted-foreground">{initial?.comment || comment}</p>
        )}
      </div>
    );
  }

  return (
    <div className="mt-6 rounded-2xl border border-border bg-card p-5">
      <p className="text-[15px] font-bold text-foreground">{dict.reviewTitle}</p>
      <p className="mt-3 text-sm text-muted-foreground">{dict.reviewRatingLabel}</p>
      <div className="mt-2"><Stars /></div>
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
