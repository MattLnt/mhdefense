import Header from "@/components/Header";
import Hero from "@/components/Hero";
import Audience from "@/components/Audience";
import Formules from "@/components/Formules";
import Abonnements from "@/components/Abonnements";

export default function Home() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <Audience />
        <Formules />
        <Abonnements />
      </main>
    </>
  );
}