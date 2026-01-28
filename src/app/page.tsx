import { FinalCTA } from "@/components/sections/FinalCTA";
import { FooterClean } from "@/components/sections/FooterClean";
import { Hero } from "@/components/sections/Hero";
import { Programs } from "@/components/sections/Programs";
import { Navbar } from "@/components/sections/Navbar";

export default function Home() {
  return (
    <div className="min-h-screen bg-[#0B0B0B]">
      <Navbar />
      <main>
        <Hero />
        <Programs />
        <FinalCTA />
      </main>
      <FooterClean />
    </div>
  );
}
