import Image from "next/image";
import { MapPin, Phone } from "lucide-react";
import Link from "next/link";

export function SiteFooter() {
  return (
    <footer id="contact" className="site-footer mt-auto bg-brand text-white">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-3">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Contact us</h2>
          <div className="mt-2 h-0.5 w-12 bg-accent" aria-hidden />
          <p className="mt-3 text-base leading-relaxed text-white/80 sm:text-lg">
            Reach the i-CAPE team for school registration, exam schedules, and
            Olympiad Year support.
          </p>
          <div className="mt-5">
            <Image
              src="/brand/icape-logo.webp"
              alt="i-CAPE"
              width={96}
              height={96}
              className="h-20 w-auto object-contain"
            />
          </div>
        </div>

        <div className="space-y-3 text-base text-white/85 sm:text-lg">
          <p className="flex items-start gap-3">
            <MapPin className="mt-1 size-5 shrink-0 text-accent" aria-hidden />
            <span>
              <span className="font-semibold text-white">I-CAPE Pvt. Ltd</span>
              <br />
              HIG-143, KPHB Colony, 5th Phase,
              <br />
              Hyderabad — 500072
            </span>
          </p>
          <p className="flex items-center gap-3">
            <Phone className="size-5 shrink-0 text-accent" aria-hidden />
            <a
              href="tel:+918074563902"
              className="hover:text-accent hover:underline"
            >
              +91 80745 63902
            </a>
          </p>
        </div>

        <div>
          <h3 className="text-xl font-semibold">Quick links</h3>
          <div className="mt-2 h-0.5 w-12 bg-accent" aria-hidden />
          <ul className="mt-3 space-y-2 text-base text-white/80 sm:text-lg">
            <li>
              <Link href="/" className="hover:text-accent hover:underline">
                Home
              </Link>
            </li>
            <li>
              <Link href="/about" className="hover:text-accent hover:underline">
                About us
              </Link>
            </li>
            <li>
              <Link href="/gallery" className="hover:text-accent hover:underline">
                Gallery
              </Link>
            </li>
            <li>
              <Link href="/contact" className="hover:text-accent hover:underline">
                Contact us
              </Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10">
        <p className="mx-auto max-w-7xl px-4 py-4 text-center text-sm text-white/55 sm:px-6">
          © {new Date().getFullYear()} i-CAPE — Innovative Talent Search
          Examination. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
