import { PageShell } from "@/components/public/page-shell";
import { RewardsShowcase } from "@/components/public/rewards-showcase";

export default function RewardsPage() {
  return (
    <PageShell
      title="Rewards and Recognitions"
      description="Awards, certificates, and recognition for students, schools, and teachers."
    >
      <RewardsShowcase />
    </PageShell>
  );
}
