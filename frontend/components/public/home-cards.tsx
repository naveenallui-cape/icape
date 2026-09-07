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
              className="group flex w-full flex-col overflow-hidden rounded-xl border border-accent/50 bg-surface shadow-[0_1px_2px_rgba(13,23,59,0.04)] hover:shadow-[0_8px_24px_rgba(13,23,59,0.1)]"
            >
              <div className="relative aspect-[16/10] overflow-hidden bg-brand-soft">
                <Image
                  src={card.image}
                  alt={card.imageAlt}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 20vw"
                  className="object-cover"
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
                <span className="text-base font-medium text-brand group-hover:underline">
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
