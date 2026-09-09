import Image from "next/image";
import Link from "next/link";
import { homeCards } from "@/lib/site-nav";

export function HomeCards() {
  return (
    <section id="home" className="w-full bg-background py-12 sm:py-16">
      <div className="w-full px-5 sm:px-8 lg:px-10">
        <div className="mb-6 flex items-center justify-start">
          <h2 className="font-serif text-2xl font-semibold tracking-[0.12em] text-brand sm:text-3xl">
            LATEST UPDATES
          </h2>
        </div>

        <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-5">
          {homeCards.map((card) => (
            <Link
              key={card.href}
              href={card.href}
              className="group flex w-full flex-col overflow-hidden rounded-xl border border-accent/50 bg-[color-mix(in_srgb,var(--accent)_3%,white)] shadow-[0_1px_2px_rgba(13,23,59,0.04)] transition duration-300 ease-out hover:z-10 hover:scale-[1.03] hover:shadow-[0_10px_28px_rgba(13,23,59,0.12)]"
            >
              <div className="relative aspect-[16/10] overflow-hidden bg-brand-soft">
                <Image
                  src={card.image}
                  alt={card.imageAlt}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 20vw"
                  className="object-cover transition duration-300 group-hover:scale-105"
                />
                <span className="absolute bottom-0 left-0 h-1 w-full bg-accent" />
              </div>

              <div className="flex flex-1 flex-col gap-2 border-t border-border p-4">
                <h3 className="text-base font-bold uppercase leading-snug tracking-wide text-brand">
                  {card.title}
                </h3>
                <p className="text-base leading-relaxed text-muted">
                  {card.description}
                </p>
                <span className="mt-auto inline-flex w-fit items-center rounded-md bg-accent px-3.5 py-2 text-sm font-semibold text-brand shadow-sm transition group-hover:bg-accent-hover">
                  Read more
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
