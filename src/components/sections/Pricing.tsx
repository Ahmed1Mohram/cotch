import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";

const plans = [
  {
    name: "BASIC",
    price: "$79",
    note: "Starter structure",
    features: [
      "Training plan",
      "Weekly check-in",
      "Progress tracking",
      "Nutrition guidelines",
    ],
    highlight: false,
  },
  {
    name: "PRO",
    price: "$149",
    note: "Most chosen",
    features: [
      "Customized training",
      "Customized nutrition",
      "2x weekly check-ins",
      "Form feedback",
      "Program adjustments",
    ],
    highlight: true,
  },
  {
    name: "ELITE",
    price: "$249",
    note: "High accountability",
    features: [
      "Everything in Pro",
      "24/7 priority support",
      "Weekly strategy call",
      "Performance periodization",
    ],
    highlight: false,
  },
];

export function Pricing() {
  return (
    <section id="pricing" className="bg-[#0B0B0B] py-20 sm:py-28">
      <Container>
        <Reveal>
          <SectionHeading
            kicker="PRICING"
            title="INVEST IN THE VERSION OF YOU THAT WINS"
            subtitle="Pick your level. The goal is the same: build discipline, add strength, and produce results that show."
          />
        </Reveal>

        <div className="mt-12 grid gap-5 lg:grid-cols-3">
          {plans.map((p, idx) => (
            <Reveal key={p.name} delay={0.06 * idx}>
              <div
                className={
                  "group relative overflow-hidden rounded-2xl bg-[#151515] p-7 shadow-[0_0_0_1px_rgba(255,255,255,0.08)] transition " +
                  (p.highlight
                    ? "ring-1 ring-white/35 shadow-[0_0_0_1px_rgba(255,255,255,0.22),0_30px_80px_-44px_rgba(0,0,0,0.95)]"
                    : "hover:shadow-[0_0_0_1px_rgba(255,255,255,0.18),0_22px_70px_-40px_rgba(0,0,0,0.92)]")
                }
              >
                <div className="absolute inset-0 opacity-0 transition group-hover:opacity-100 bg-[radial-gradient(520px_280px_at_40%_20%,rgba(255,255,255,0.10),transparent_65%)]" />
                <div className="relative">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-heading text-xs tracking-[0.24em] text-[#B5B5B5]">
                        {p.note}
                      </div>
                      <h3 className="mt-2 font-heading text-3xl tracking-[0.14em] text-white">
                        {p.name}
                      </h3>
                    </div>
                    {p.highlight ? (
                      <span className="rounded-full bg-white/10 px-3 py-1 font-heading text-[11px] tracking-[0.22em] text-white/90 shadow-[0_0_0_1px_rgba(255,255,255,0.16)]">
                        BEST VALUE
                      </span>
                    ) : null}
                  </div>

                  <div className="mt-6 flex items-end gap-2">
                    <div className="font-heading text-5xl tracking-[0.10em] text-white">
                      {p.price}
                    </div>
                    <div className="pb-1 text-sm text-[#B5B5B5]">/ month</div>
                  </div>

                  <div className="mt-6 h-[1px] w-full bg-white/10" />

                  <ul className="mt-6 space-y-3">
                    {p.features.map((f) => (
                      <li key={f} className="flex items-start gap-3">
                        <span className="mt-1 inline-block h-2 w-2 rounded-full bg-white/70" />
                        <span className="text-sm leading-6 text-[#B5B5B5]">{f}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-8">
                    <Button
                      href="#contact"
                      variant={p.highlight ? "primary" : "secondary"}
                      className="w-full"
                    >
                      CHOOSE {p.name}
                    </Button>
                  </div>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}
