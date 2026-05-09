import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import TrustBar from "@/components/TrustBar";
import Kits from "@/components/Kits";
import KitsCustom from "@/components/KitsCustom";
import HowItWorks from "@/components/HowItWorks";
import Diferenciais from "@/components/Diferenciais";
import FAQ from "@/components/FAQ";
import FinalCTA from "@/components/FinalCTA";
import Footer from "@/components/Footer";
import WhatsAppFloat from "@/components/WhatsAppFloat";

export const dynamic = "force-dynamic";

export default async function KitsPage() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <TrustBar />
        <Kits />
        <KitsCustom />
        <HowItWorks />
        <Diferenciais />
        <FAQ />
        <FinalCTA />
      </main>
      <Footer />
      <WhatsAppFloat />
    </>
  );
}
