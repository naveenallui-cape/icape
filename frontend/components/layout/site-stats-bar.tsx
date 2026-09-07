import {
  Award,
  ClipboardCheck,
  Globe2,
  School,
  ShieldCheck,
} from "lucide-react";

const stats = [
  {
    value: "29",
    label: "Years of Trust",
    icon: ShieldCheck,
  },
  {
    value: "99,499+",
    label: "Schools",
    icon: School,
  },
  {
    value: "72",
    label: "Countries",
    icon: Globe2,
  },
  {
    value: "8.1+ CR",
    label: "Assessments",
    icon: ClipboardCheck,
  },
  {
    value: "8",
    label: "Olympiads",
    icon: Award,
  },
] as const;

export function SiteStatsBar() {
  return (
    <div className="border-b border-brand-stats bg-brand-stats">
      <div className="mx-auto flex max-w-7xl items-stretch justify-between gap-1 px-2 py-2 sm:items-center sm:gap-4 sm:px-6 sm:py-2.5">
        {stats.map((stat) => {
          const Icon = stat.icon;

          return (
            <div
              key={stat.label}
              className="flex min-w-0 flex-1 flex-col items-center gap-1 text-center sm:flex-row sm:gap-2.5 sm:text-left lg:justify-center"
            >
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-white/10 ring-1 ring-accent/50 sm:size-9">
                <Icon
                  className="size-3 text-accent sm:size-4"
                  strokeWidth={1.75}
                  aria-hidden
                />
              </span>
              <div className="min-w-0">
                <p className="text-[0.7rem] font-bold leading-tight text-white sm:text-xl">
                  {stat.value}
                </p>
                <p className="text-[0.55rem] font-medium leading-snug text-white/80 sm:text-base">
                  {stat.label}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
