import SiteLayout from "@/components/SiteLayout";
import Hero from "@/components/Hero";
import TrialBanner from "@/components/TrialBanner";
import Audience from "@/components/Audience";
import Formules from "@/components/Formules";
import Abonnements from "@/components/Abonnements";
import HomeCta from "@/components/HomeCta";

export default function Home() {
  return (
    <SiteLayout>
      <main>
        <Hero />
        <TrialBanner variant="dark" href="/reservation?mode=ESSAI" />
        <Audience />
        <Abonnements />
        <HomeCta />
      </main>
    </SiteLayout>
  );
}