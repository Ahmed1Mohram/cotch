import { Navbar } from "@/components/sections/Navbar";
import { FooterClean } from "@/components/sections/FooterClean";
import { Packages } from "@/components/sections/Packages";

export default function PackagesPage() {
  return (
    <div className="min-h-screen bg-[#0B0B0B]">
      <Navbar />
      <main className="pt-44 sm:pt-48 md:pt-56">
        <Packages />
      </main>
      <FooterClean />
    </div>
  );
}
