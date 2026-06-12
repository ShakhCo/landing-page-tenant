// Placeholder tile for services without a photo: a quiet, light neutral tile
// with a generic image icon — a standard "no photo" placeholder, theme-aware.
import { Image as ImageIcon } from 'lucide-react';

export function ServiceMonogram() {
  return (
    <div className="flex aspect-[16/10] w-full items-center justify-center bg-gradient-to-br from-muted/15 to-muted/5">
      <ImageIcon className="size-10 text-foreground/20" strokeWidth={1.5} aria-hidden />
    </div>
  );
}
