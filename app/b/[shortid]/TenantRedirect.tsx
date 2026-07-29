'use client';

import { useEffect } from 'react';

/**
 * Root-domain (bookup.uz/b/<short>) booking link. The tenant subdomain is
 * resolved during SSR and passed in, so the client hard-redirects to
 * <subdomain>.bookup.uz/b/<short> immediately — the skeleton shows only for
 * the redirect flight. Unknown booking → the marketing home.
 */
export function TenantRedirect({
  shortId,
  subdomain,
}: {
  shortId: string;
  subdomain: string | null;
}) {
  useEffect(() => {
    if (!subdomain) {
      window.location.replace('/');
      return;
    }
    // Base host minus any leading www → <subdomain>.<base>, same scheme/port.
    const base = window.location.host.replace(/^www\./, '');
    window.location.replace(`${window.location.protocol}//${subdomain}.${base}/b/${shortId}`);
  }, [shortId, subdomain]);

  return <TenantSkeleton />;
}

/** A muted placeholder echoing the tenant page: map hero, avatar, name, cards. */
function TenantSkeleton() {
  return (
    <div className="mx-auto max-w-[1350px] animate-pulse">
      {/* Map hero + overlapping avatar */}
      <div className="relative">
        <div className="h-52 w-full rounded-2xl rounded-t-none bg-foreground/10 sm:h-80" />
        <div className="absolute bottom-0 left-1/2 size-24 -translate-x-1/2 translate-y-1/2 rounded-full bg-foreground/10 ring-4 ring-card" />
      </div>

      {/* Name + address */}
      <div className="mt-16 flex flex-col items-center gap-2">
        <div className="h-6 w-40 rounded-md bg-foreground/10" />
        <div className="h-4 w-64 rounded-md bg-foreground/10" />
      </div>

      {/* Content card */}
      <div className="mx-auto mt-10 max-w-xl px-4 sm:px-6">
        <div className="rounded-2xl border border-foreground/12 bg-card p-5 shadow-xs shadow-black/5 sm:p-6">
          <div className="h-5 w-20 rounded-full bg-foreground/10" />
          <div className="mt-3 h-7 w-40 rounded-md bg-foreground/10" />
          <div className="mt-6 space-y-3.5 border-t border-border pt-5">
            {[0, 1, 2].map((i) => (
              <div key={i} className="flex items-center justify-between gap-4">
                <div className="h-4 w-24 rounded-md bg-foreground/10" />
                <div className="h-4 w-28 rounded-md bg-foreground/10" />
              </div>
            ))}
          </div>
          <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
            <div className="h-4 w-20 rounded-md bg-foreground/10" />
            <div className="h-6 w-32 rounded-md bg-foreground/10" />
          </div>
        </div>
      </div>
    </div>
  );
}
