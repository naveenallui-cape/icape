"use client";

import {
  Award,
  FileBadge2,
  GraduationCap,
  Shield,
  Star,
  Trophy,
} from "lucide-react";
import {
  motion,
  useReducedMotion,
  type Variants,
} from "framer-motion";
import { cn } from "@/lib/utils";

const rewards = [
  {
    title: "National Rankers",
    description: "Trophies & Certificates.",
    icon: Trophy,
    tone: "brand" as const,
  },
  {
    title: "Top Performers",
    description: "Eligibility for Scholarships and Excellence Certificates.",
    icon: Award,
    tone: "accent" as const,
  },
  {
    title: "School Toppers",
    description: "Medals & Merit Certificates.",
    icon: Star,
    tone: "brand" as const,
  },
  {
    title: "Participation Certificates",
    description: "For all students.",
    icon: FileBadge2,
    tone: "accent" as const,
  },
  {
    title: "School Awards",
    description: "Special awards for the school with exceptional performance.",
    icon: Shield,
    tone: "brand" as const,
  },
  {
    title: "Teacher Awards",
    description:
      "Special recognition for teachers who show outstanding performance.",
    icon: GraduationCap,
    tone: "accent" as const,
  },
] as const;

export function RewardsShowcase() {
  const reduceMotion = useReducedMotion();

  const container: Variants = {
    hidden: {},
    show: {
      transition: {
        staggerChildren: reduceMotion ? 0 : 0.1,
        delayChildren: reduceMotion ? 0 : 0.15,
      },
    },
  };

  const item: Variants = {
    hidden: reduceMotion
      ? { opacity: 1, y: 0 }
      : { opacity: 0, y: 28, scale: 0.96 },
    show: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] },
    },
  };

  return (
    <div className="relative overflow-hidden rounded-3xl border border-border bg-brand px-5 py-10 sm:px-8 sm:py-14 lg:px-12">
      {/* Atmosphere */}
      <div
        className="pointer-events-none absolute inset-0 opacity-90"
        aria-hidden
      >
        <div className="absolute -left-24 -top-24 size-72 rounded-full bg-accent/20 blur-3xl" />
        <div className="absolute -bottom-28 -right-16 size-80 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute left-1/2 top-1/3 size-64 -translate-x-1/2 rounded-full bg-accent/10 blur-3xl" />
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
            backgroundSize: "22px 22px",
          }}
        />
      </div>

      <div className="relative mx-auto max-w-3xl">
        <motion.div
          className="mb-10 text-center sm:mb-12"
          initial={reduceMotion ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          <motion.div
            className="mx-auto mb-5 flex size-20 items-center justify-center rounded-full border border-accent/40 bg-gradient-to-br from-accent/30 to-accent/5 shadow-[0_0_40px_rgba(212,175,55,0.35)] sm:size-24"
            animate={
              reduceMotion
                ? undefined
                : {
                    y: [0, -6, 0],
                    boxShadow: [
                      "0 0 28px rgba(212,175,55,0.25)",
                      "0 0 48px rgba(212,175,55,0.45)",
                      "0 0 28px rgba(212,175,55,0.25)",
                    ],
                  }
            }
            transition={
              reduceMotion
                ? undefined
                : { duration: 3.2, repeat: Infinity, ease: "easeInOut" }
            }
          >
            <Trophy className="size-10 text-accent sm:size-12" aria-hidden />
          </motion.div>

          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-accent">
            Celebrate excellence
          </p>
          <h2 className="mt-2 font-serif text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Rewards and{" "}
            <span className="text-accent">Recognitions</span>
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-base leading-relaxed text-white/75 sm:text-lg">
            Honouring outstanding students, schools, and teachers across the
            i-CAPE Olympiads.
          </p>
        </motion.div>

        <motion.ul
          className="space-y-3.5 sm:space-y-4"
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
        >
          {rewards.map((reward, index) => {
            const Icon = reward.icon;

            return (
              <motion.li key={reward.title} variants={item}>
                <motion.div
                  className="group relative flex items-center gap-4 overflow-hidden rounded-2xl border border-white/15 bg-white/95 px-4 py-4 shadow-[0_8px_30px_rgba(0,0,0,0.18)] backdrop-blur-sm sm:gap-5 sm:rounded-full sm:px-5 sm:py-4"
                  whileHover={
                    reduceMotion
                      ? undefined
                      : { y: -4, scale: 1.01 }
                  }
                  transition={{ type: "spring", stiffness: 320, damping: 22 }}
                >
                  <span
                    className="pointer-events-none absolute inset-y-0 left-0 w-1.5 bg-gradient-to-b from-accent via-accent/60 to-transparent opacity-80 sm:w-2"
                    aria-hidden
                  />
                  <span
                    className={cn(
                      "pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100",
                      reward.tone === "brand"
                        ? "bg-gradient-to-r from-brand/5 to-transparent"
                        : "bg-gradient-to-r from-accent/10 to-transparent",
                    )}
                    aria-hidden
                  />

                  <motion.span
                    className={cn(
                      "relative inline-flex size-12 shrink-0 items-center justify-center rounded-full sm:size-14",
                      reward.tone === "brand"
                        ? "bg-brand text-white shadow-[0_0_0_4px_rgba(13,23,59,0.12)]"
                        : "bg-accent text-brand shadow-[0_0_0_4px_rgba(212,175,55,0.2)]",
                    )}
                    whileHover={
                      reduceMotion ? undefined : { rotate: [0, -8, 8, 0] }
                    }
                    transition={{ duration: 0.45 }}
                  >
                    <Icon className="size-6 sm:size-7" aria-hidden />
                  </motion.span>

                  <div className="relative min-w-0 flex-1 pr-1 sm:pr-3">
                    <div className="flex items-baseline gap-2">
                      <span className="hidden text-xs font-bold tabular-nums text-accent sm:inline">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <h3 className="text-lg font-bold text-brand sm:text-xl">
                        {reward.title}
                      </h3>
                    </div>
                    <p className="mt-0.5 text-sm leading-relaxed text-muted sm:text-base">
                      {reward.description}
                    </p>
                  </div>
                </motion.div>
              </motion.li>
            );
          })}
        </motion.ul>
      </div>
    </div>
  );
}
