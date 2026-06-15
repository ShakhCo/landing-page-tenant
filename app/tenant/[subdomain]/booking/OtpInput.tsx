'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Segmented OTP input — one box per digit. Handles sequential typing,
 * backspace (clear current, else step back), arrow keys, click-to-focus, and
 * paste/autofill (distributes digits across boxes). `value` is the compact code
 * string; `onChange` receives it as boxes fill left-to-right.
 */
export function OtpInput({
  value,
  onChange,
  length = 5,
  autoFocus,
}: {
  value: string;
  onChange: (v: string) => void;
  length?: number;
  autoFocus?: boolean;
}) {
  const refs = useRef<Array<HTMLInputElement | null>>([]);
  const [slots, setSlots] = useState<string[]>(() => Array.from({ length }, (_, i) => value[i] ?? ''));
  // Mirror of `slots` for synchronous reads (focus handlers run before re-render).
  const slotsRef = useRef(slots);

  // The only editable box: the first empty one (or the last when full).
  const activeIndex = () => {
    const i = slotsRef.current.findIndex((s) => !s);
    return i === -1 ? length - 1 : i;
  };
  const focusActive = () => refs.current[activeIndex()]?.focus();

  const commit = (next: string[]) => {
    slotsRef.current = next;
    setSlots(next);
    onChange(next.join(''));
  };

  // External reset (e.g. a wrong code clears the input) → clear the boxes and,
  // if there was something to clear, return focus to the first box. Tracking the
  // previous value avoids stealing focus on the initial empty mount.
  const prevValueRef = useRef(value);
  useEffect(() => {
    const prev = prevValueRef.current;
    prevValueRef.current = value;
    if (value === '') {
      commit(Array.from({ length }, () => ''));
      if (prev !== '') refs.current[0]?.focus();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, length]);

  useEffect(() => {
    if (autoFocus) focusActive();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoFocus]);

  // Write digits starting at `from`, then focus the next empty box.
  const fill = (from: number, raw: string) => {
    const ds = raw.replace(/\D/g, '');
    if (!ds) return;
    const next = [...slots];
    let k = from;
    for (const ch of ds) {
      if (k >= length) break;
      next[k] = ch;
      k++;
    }
    commit(next);
    refs.current[Math.min(k, length - 1)]?.focus();
  };

  const onKeyDown = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      e.preventDefault();
      const next = [...slots];
      if (next[i]) {
        next[i] = '';
        commit(next);
        refs.current[i]?.focus();
      } else if (i > 0) {
        next[i - 1] = '';
        commit(next);
        refs.current[i - 1]?.focus();
      }
    } else if (e.key === 'ArrowLeft' && i > 0) {
      e.preventDefault();
      refs.current[i - 1]?.focus();
    } else if (e.key === 'ArrowRight' && i < length - 1) {
      e.preventDefault();
      refs.current[i + 1]?.focus();
    }
  };

  return (
    <div className="flex justify-between gap-2">
      {Array.from({ length }, (_, i) => (
        <input
          key={i}
          ref={(el) => { refs.current[i] = el; }}
          value={slots[i] ?? ''}
          onChange={(e) => fill(i, e.target.value)}
          onKeyDown={(e) => onKeyDown(i, e)}
          onPaste={(e) => { e.preventDefault(); fill(0, e.clipboardData.getData('text')); }}
          // Only the active (first-empty) box is editable — clicking any other
          // box redirects focus there instead of focusing the clicked one.
          onMouseDown={(e) => { if (i !== activeIndex()) { e.preventDefault(); focusActive(); } }}
          onFocus={(e) => { if (i !== activeIndex()) { focusActive(); return; } e.currentTarget.select(); }}
          inputMode="numeric"
          autoComplete={i === 0 ? 'one-time-code' : 'off'}
          aria-label={`Kod ${i + 1}`}
          className="h-14 w-full min-w-0 rounded-xl border border-border bg-card text-center text-2xl font-bold tabular-nums text-foreground shadow-xs shadow-black/5 outline-none transition-colors duration-200 focus:border-foreground focus:ring-2 focus:ring-foreground/10"
        />
      ))}
    </div>
  );
}
