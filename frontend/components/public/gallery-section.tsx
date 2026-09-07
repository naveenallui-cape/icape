import Image from "next/image";
import Link from "next/link";
import { galleryImages } from "@/lib/site-nav";

export function GallerySection() {
  return (
    <section id="gallery" className="w-full bg-surface py-12 sm:py-16">
      <div className="w-full px-5 sm:px-8 lg:px-10">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div className="max-w-2xl">
            <h2 className="text-3xl font-bold tracking-tight text-brand sm:text-4xl">
              Gallery
            </h2>
            <div className="mt-2 h-0.5 w-14 bg-accent" aria-hidden />
            <p className="mt-3 text-base text-muted sm:text-lg">
              Moments from i-CAPE examinations, awards, and school events.
            </p>
          </div>
          <Link
            href="/gallery"
            className="text-base font-semibold text-brand hover:text-accent sm:text-lg"
          >
            View all
          </Link>
        </div>

        <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-5">
          {galleryImages.map((image) => (
            <Link
              key={image.src}
              href="/gallery"
              className="relative aspect-[4/3] overflow-hidden rounded-xl border border-accent/50 bg-brand-soft"
            >
              <Image
                src={image.src}
                alt={image.alt}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 20vw"
                className="object-cover"
              />
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
