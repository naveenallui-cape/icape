import Link from "next/link";
import { PageShell } from "@/components/public/page-shell";

type ZoneRow = {
  srNo: number;
  zone: string;
};

type RegionTable = {
  title: string;
  zones: ZoneRow[];
};

const regions: RegionTable[] = [
  {
    title: "North Region",
    zones: [
      { srNo: 1, zone: "Delhi Zone" },
      {
        srNo: 2,
        zone:
          "Uttar Pradesh Zone 1 — All districts of UP except those in UP Zone 2",
      },
      {
        srNo: 3,
        zone:
          "Uttar Pradesh Zone 2 — Uttarakhand, Badaun, Bareilly, Meerut, Moradabad, Pilibhit, Rampur, Saharanpur, Shahjahanpur, Muzaffarnagar",
      },
      { srNo: 4, zone: "Punjab / Chandigarh Zone" },
      { srNo: 5, zone: "Rajasthan Zone" },
      {
        srNo: 6,
        zone: "Himachal Pradesh / Jammu & Kashmir / Ladakh Zone",
      },
      { srNo: 7, zone: "Haryana Zone" },
    ],
  },
  {
    title: "East Region",
    zones: [
      { srNo: 8, zone: "West Bengal Zone 1 — Kolkata" },
      {
        srNo: 9,
        zone:
          "West Bengal Zone 2 — Rest of West Bengal and Andaman & Nicobar Islands",
      },
      { srNo: 10, zone: "Chhattisgarh Zone" },
      { srNo: 11, zone: "Bihar Zone" },
      { srNo: 12, zone: "Jharkhand Zone" },
      { srNo: 13, zone: "Odisha Zone" },
      {
        srNo: 14,
        zone:
          "North East Zone (Assam / Arunachal Pradesh / Tripura / Sikkim / Meghalaya / Mizoram / Manipur / Nagaland)",
      },
    ],
  },
  {
    title: "West Region",
    zones: [
      {
        srNo: 15,
        zone: "Maharashtra Zone 1 — Mumbai, Pune, Thane districts",
      },
      {
        srNo: 16,
        zone: "Maharashtra Zone 2 — Rest of Maharashtra & Goa",
      },
      {
        srNo: 17,
        zone: "Gujarat / Daman & Diu / Dadra & Nagar Haveli Zone",
      },
      { srNo: 18, zone: "Madhya Pradesh Zone" },
    ],
  },
  {
    title: "South Region",
    zones: [
      { srNo: 19, zone: "Andhra Pradesh Zone" },
      { srNo: 20, zone: "Karnataka Zone 1 — Bengaluru" },
      { srNo: 21, zone: "Karnataka Zone 2 — Rest of Karnataka" },
      { srNo: 22, zone: "Kerala & Lakshadweep Zone" },
      { srNo: 23, zone: "Tamil Nadu Zone 1 — Chennai" },
      {
        srNo: 24,
        zone: "Tamil Nadu Zone 2 — Rest of Tamil Nadu & Puducherry",
      },
      { srNo: 25, zone: "Telangana Zone" },
    ],
  },
  {
    title: "International Region",
    zones: [
      {
        srNo: 26,
        zone: "International Zone — All countries other than India",
      },
    ],
  },
];

export default function ZonesPage() {
  return (
    <PageShell
      title="Zone/State Categorization"
      description="All States and Union Territories in India and all international countries participating in olympiads are categorized into 5 regions and 26 zones."
    >
      <div className="space-y-12">
        <section className="max-w-4xl space-y-4 text-base leading-relaxed text-muted sm:text-lg">
          <p>
            This categorization is used for the following purposes:
          </p>
          <ul className="list-disc space-y-2 pl-5">
            <li>
              Determining zone toppers who qualify for the{" "}
              <Link
                href="/rankings"
                className="font-semibold text-brand underline underline-offset-2"
              >
                2nd Level exams
              </Link>
              .
            </li>
            <li>
              Determining zone toppers to be awarded / provided scholarship for
              performance in 2nd Level exams.
            </li>
          </ul>
        </section>

        {regions.map((region) => (
          <section key={region.title}>
            <h2 className="text-2xl font-bold text-brand sm:text-3xl">
              {region.title}
            </h2>
            <div className="mt-2 h-0.5 w-14 bg-accent" aria-hidden />

            <div className="mt-5 overflow-x-auto rounded-xl border border-border bg-surface">
              <table className="w-full min-w-[480px] border-collapse text-left">
                <thead className="bg-brand-stats text-white">
                  <tr>
                    <th className="w-24 px-4 py-3 text-base font-semibold">
                      Sr. No.
                    </th>
                    <th className="px-4 py-3 text-base font-semibold">Zone</th>
                  </tr>
                </thead>
                <tbody>
                  {region.zones.map((row, index) => (
                    <tr
                      key={row.srNo}
                      className={
                        index % 2 === 0 ? "bg-surface" : "bg-background"
                      }
                    >
                      <td className="px-4 py-3.5 align-top text-base font-semibold text-brand">
                        {row.srNo}
                      </td>
                      <td className="px-4 py-3.5 text-base text-muted">
                        {row.zone}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ))}
      </div>
    </PageShell>
  );
}
