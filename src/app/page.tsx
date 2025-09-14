import { SiteHeader } from "@/components/site-header";
import { Hero } from "@/components/hero";
// import { Features } from "@/components/features";
// import { LogoMarquee } from "@/components/logo-marquee";
// import { Pricing } from "@/components/pricing";
// import { AppverseFooter } from "@/components/appverse-footer";
import Plasma from "@/components/plasma";

export default function Home() {
  return (
    <div>
      <div className="fixed inset-0 z-0 bg-black">
        <Plasma
          color="#8b5cf6"
          speed={0.8}
          direction="forward"
          scale={1.5}
          opacity={0.4}
          mouseInteractive={true}
        />
      </div>
      <div className="relative z-10">
        <main className="min-h-[100dvh] text-white">
          <SiteHeader />
          <Hero />
          {/* <Features />
          <LogoMarquee />
          <Pricing />
          <AppverseFooter /> */}
        </main>
      </div>
    </div>
  );
}
