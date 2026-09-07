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
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 overflow-x-auto px-4 py-2.5 sm:gap-6 sm:px-6 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {stats.map((stat) => {
          const Icon = stat.icon;

          return (
            <div
              key={stat.label}
              className="flex shrink-0 items-center gap-2.5 lg:flex-1 lg:justify-center"
            >
              <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-white/10 ring-1 ring-accent/50 sm:size-9">
                <Icon
                  className="size-4 text-accent"
                  strokeWidth={1.75}
                  aria-hidden
                />
              </span>
              <div className="min-w-0 text-left">
                <p className="whitespace-nowrap text-lg font-bold leading-tight text-white sm:text-xl">
                  {stat.value}
                </p>
                <p className="whitespace-nowrap text-sm font-medium text-white/80 sm:text-base">
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
