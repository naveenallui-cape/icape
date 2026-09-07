import Link from "next/link";

export function AboutSection() {
  return (
    <section id="about" className="bg-surface py-12 sm:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="max-w-3xl">
          <h2 className="text-3xl font-bold tracking-tight text-brand sm:text-4xl">
            About us
          </h2>
          <div className="mt-2 h-0.5 w-14 bg-accent" aria-hidden />
          <p className="mt-4 text-base leading-relaxed text-foreground sm:text-lg">
            i-CAPE (Innovative Talent Search Examination) organizes olympiad
            examinations that help schools identify and nurture student talent
            across subjects. Each Olympiad Year brings a fresh registration
            cycle so historical records stay intact while schools and students
            participate again with confidence.
          </p>
          <p className="mt-3 text-base leading-relaxed text-muted sm:text-lg">
            From registration forms and exam schedules to results and
            recognitions, i-CAPE supports schools through every step of the
            olympiad journey.
          </p>
          <Link
            href="/about"
            className="mt-6 inline-flex rounded-md bg-accent px-5 py-3 text-base font-semibold text-brand shadow-sm hover:bg-accent-hover"
          >
            Learn more about i-CAPE
          </Link>
        </div>
      </div>
    </section>
  );
}
