import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";

const results = [
  {
    name: "Client A",
    before: "92 kg",
    after: "81 kg",
    note: "8 weeks — tightened diet + conditioning.",
  },
  {
    name: "Client B",
    before: "18%",
    after: "12%",
    note: "10 weeks — recomposition engine.",
  },
  {
    name: "Client C",
    before: "115 kg",
    after: "122 kg",
    note: "12 weeks — strength and lean mass.",
  },
  {
    name: "Client D",
    before: "Zero routine",
    after: "Discipline",
    note: "6 weeks — consistency and structure.",
  },
];

function ResultCard({
  name,
  before,
  after,
  note,
}: {
  name: string;
  before: string;
  after: string;
  note: string;
}) {
  return (
    <div className="group relative overflow-hidden rounded-2xl bg-[#151515] p-7 shadow-[0_0_0_1px_rgba(255,255,255,0.08)] transition hover:shadow-[0_0_0_1px_rgba(255,255,255,0.18),0_22px_70px_-40px_rgba(0,0,0,0.92)]">
      <div className="absolute inset-0 opacity-0 transition group-hover:opacity-100 bg-[radial-gradient(520px_280px_at_40%_20%,rgba(255,255,255,0.10),transparent_65%)]" />
      <div className="relative">
        <div className="flex items-center justify-between">
          <div className="font-heading text-lg tracking-[0.20em] text-white/90">
            {name}
          </div>
          <div className="h-1.5 w-10 rounded-full bg-gradient-to-r from-white/60 to-white/10 opacity-80" />
        </div>

        <div className="mt-6 grid grid-cols-2 gap-4">
          <div className="rounded-xl bg-black/35 p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.08)]">
            <div className="font-heading text-xs tracking-[0.24em] text-[#B5B5B5]">
              BEFORE
            </div>
            <div className="mt-2 font-heading text-2xl tracking-[0.12em] text-white">
              {before}
            </div>
          </div>
          <div className="rounded-xl bg-black/35 p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.08)]">
            <div className="font-heading text-xs tracking-[0.24em] text-white/70">
              AFTER
            </div>
            <div className="mt-2 font-heading text-2xl tracking-[0.12em] text-white">
              {after}
            </div>
          </div>
        </div>

        <p className="mt-5 text-sm leading-6 text-[#B5B5B5]">{note}</p>
      </div>
    </div>
  );
}

export function Transformations() {
  return (
    <section id="transformations" className="bg-[#0B0B0B] py-20 sm:py-28">
      <Container>
        <Reveal>
          <SectionHeading
            kicker="TRANSFORMATIONS"
            title="REAL RESULTS. REAL PROOF."
            subtitle="No marketing fluff. Progress you can measure — strength up, bodyfat down, confidence locked in."
          />
        </Reveal>

        <div className="mt-12 grid gap-5 md:grid-cols-2">
          {results.map((r, idx) => (
            <Reveal key={r.name} delay={0.06 * idx}>
              <ResultCard {...r} />
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}
