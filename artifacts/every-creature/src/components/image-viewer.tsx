import { useState, type ReactNode } from "react";
import { ExternalLink } from "lucide-react";
import { Dialog, DialogTrigger, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";

type WikiImage = { url: string; originalUrl?: string; pageUrl: string };

/** Portalled viewer keeps the complete photo above card clipping and transforms. */
export function ImageViewer({ image, name, children }: { image: WikiImage; name: string; children: ReactNode }) {
  const [useThumbnail, setUseThumbnail] = useState(false);
  const [failed, setFailed] = useState(false);
  return (
    <Dialog onOpenChange={(open) => { if (open) { setUseThumbnail(false); setFailed(false); } }}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="photo-viewer w-[calc(100vw-2rem)] max-w-6xl gap-3 border-white/15 bg-[#111916] p-4 text-white sm:rounded-2xl md:p-6">
        <DialogTitle className="pr-10 text-xl font-serif">{name}</DialogTitle>
        <DialogDescription className="sr-only">Full photograph. Press Escape, use Close, or click outside to return to the creature.</DialogDescription>
        {failed ? (
          <p className="py-16 text-center text-white/70">This photograph couldn't load. You can still view it on Wikipedia below.</p>
        ) : (
          <img
            src={useThumbnail ? image.url : image.originalUrl || image.url}
            alt={name}
            className="w-full h-auto max-h-[70dvh] object-contain rounded-lg"
            onError={() => { if (!useThumbnail && image.originalUrl) setUseThumbnail(true); else setFailed(true); }}
          />
        )}
        <div className="flex flex-wrap justify-between gap-2 text-xs text-white/65">
          <span>The complete image · uncropped</span>
          <a href={image.pageUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 underline underline-offset-4 hover:text-white">
            <ExternalLink className="h-3 w-3" /> View source on Wikipedia
          </a>
        </div>
      </DialogContent>
    </Dialog>
  );
}
