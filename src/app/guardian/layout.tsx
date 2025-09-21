import Plasma from "@/components/plasma";
import { SiteHeader } from "@/components/guardian-header";

export default function ParentLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div>
      <div className="fixed inset-0 z-0 bg-black">
        <Plasma
          color="#8b5cf6"
          speed={0.5}
          direction="forward"
          scale={1.5}
          opacity={0.4}
          mouseInteractive={false}
          quality="auto"
        />
      </div>
      <div className="relative z-10">
        <main className="min-h-[100dvh] text-white">
          <SiteHeader />
          {children}
        </main>
      </div>
    </div>
  );
}
