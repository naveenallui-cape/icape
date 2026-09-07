import Image from "next/image";
import { PageShell } from "@/components/public/page-shell";
import { galleryImages } from "@/lib/site-nav";

export default function GalleryPage() {
  return (
    <PageShell
      title="Gallery"
      description="Moments from i-CAPE examinations, awards, and school events."
    >
      <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-5">
        {galleryImages.map((image) => (
          <div
            key={image.src}
            className="relative aspect-[4/3] overflow-hidden rounded-xl border border-border bg-brand-soft"
          >
            <Image
              src={image.src}
              alt={image.alt}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 20vw"
              className="object-cover"
            />
          </div>
        ))}
      </div>
    </PageShell>
  );
}
