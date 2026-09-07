import { testimonials } from "@/lib/testimonials";

export function TestimonialsSection() {
  return (
    <section id="what-people-say" className="w-full bg-brand-soft py-12 sm:py-16">
      <div className="w-full">
        <div className="mb-8 max-w-2xl pl-8 pr-5 sm:pl-12 sm:pr-8 lg:pl-14 lg:pr-10">
          <h2 className="text-3xl font-bold tracking-tight text-brand sm:text-4xl">
            What people say
          </h2>
          <div className="mt-2 h-0.5 w-14 bg-accent" aria-hidden />
        </div>

        <div className="flex gap-4 overflow-x-auto pb-1 pl-8 pr-5 sm:gap-5 sm:pl-12 sm:pr-8 lg:pl-14 lg:pr-10 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {testimonials.map((item) => (
            <article
              key={`${item.school}-${item.name}`}
              className="flex w-[min(85vw,22rem)] shrink-0 flex-col rounded-xl bg-surface p-6 shadow-[0_4px_20px_rgba(13,23,59,0.08)] sm:w-[24rem]"
            >
              <p className="flex-1 text-base leading-relaxed text-foreground sm:text-lg">
                “{item.quote}”
              </p>

              <div className="mt-5 pt-4">
                <div className="mb-3 h-0.5 w-10 bg-accent" aria-hidden />
                <p className="text-base font-bold text-brand sm:text-lg">
                  {item.name}
                </p>
                <p className="mt-0.5 text-sm font-medium text-muted">
                  {item.role}
                </p>
                <p className="mt-1 text-sm text-muted">
                  {item.school}
                  <span className="mx-1 text-accent">·</span>
                  {item.place}
                </p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
