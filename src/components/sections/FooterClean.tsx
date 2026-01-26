import { Container } from "@/components/ui/Container";

export function FooterClean() {
  return (
    <footer className="bg-[#0B0B0B] py-12">
      <Container>
        <div className="flex flex-col gap-8 border-t border-white/10 pt-10 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="font-heading text-lg tracking-[0.28em] text-white">
              FIT COACH
            </div>
            <div className="mt-2 text-sm text-[#B5B5B5]">
              Elite coaching. Zero excuses.
            </div>
          </div>

          <div className="text-sm text-[#B5B5B5]">أحمد محرم ©2026</div>
        </div>
      </Container>
    </footer>
  );
}
