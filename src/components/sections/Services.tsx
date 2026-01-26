import { Reveal } from "@/components/ui/Reveal";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";

const services = [
  {
    title: "Personal Training",
    description:
      "Precision sessions built around strength, structure, and brutal consistency. No wasted reps.",
  },
  {
    title: "Fat Loss Programs",
    description:
      "Aggressive conditioning with disciplined nutrition to cut hard while staying powerful.",
  },
  {
    title: "Online Coaching",
    description:
      "Elite programming + accountability. Weekly adjustments, real feedback, real momentum.",
  },
];

export function Services() {
  return (
    <section id="services" className="bg-[#0B0B0B] py-20 sm:py-28">
      <Container>
        <div id="about" className="scroll-mt-28" />
        <Reveal>
          <SectionHeading
            kicker="SERVICES"
            title="COACHING BUILT FOR DOMINANCE"
            subtitle="Choose the lane that fits your schedule — the standard stays the same: intensity, structure, results."
          />
        </Reveal>

        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {services.map((s, idx) => (
            <Reveal key={s.title} delay={0.06 * idx}>
              <div className="group relative overflow-hidden rounded-2xl bg-[#151515] p-7 shadow-[0_0_0_1px_rgba(255,255,255,0.08)] transition hover:shadow-[0_0_0_1px_rgba(255,255,255,0.18),0_24px_70px_-38px_rgba(0,0,0,0.95)]">
                <div className="absolute inset-0 opacity-0 transition group-hover:opacity-100 bg-[radial-gradient(420px_240px_at_30%_20%,rgba(255,255,255,0.10),transparent_65%)]" />
                <div className="relative">
                  <div className="flex items-center justify-between">
                    <h3 className="font-heading text-2xl tracking-[0.12em] text-white">
                      {s.title}
                    </h3>
                    <div className="h-2 w-2 rounded-full bg-white/70 shadow-[0_0_0_4px_rgba(255,255,255,0.12)]" />
                  </div>
                  <p className="mt-4 text-base leading-7 text-[#B5B5B5]">
                    {s.description}
                  </p>
                  <div className="mt-6 h-[1px] w-full bg-white/10" />
                  <p className="mt-4 font-heading text-xs tracking-[0.22em] text-white/80">
                    BUILT FOR PERFORMANCE
                  </p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}
