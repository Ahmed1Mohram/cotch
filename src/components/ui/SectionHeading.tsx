import { cn } from "@/lib/cn";

export function SectionHeading({
  kicker,
  title,
  subtitle,
  className,
}: {
  kicker: string;
  title: string;
  subtitle: string;
  className?: string;
}) {
  return (
    <div className={cn("max-w-2xl", className)}>
      <div className="flex items-center gap-3">
        <div className="h-[2px] w-10 bg-[#FF6A00]" />
        <p className="font-heading text-xs tracking-[0.2em] text-[#B5B5B5]">
          {kicker}
        </p>
      </div>
      <h2 className="mt-4 font-heading text-3xl tracking-[0.08em] text-white sm:text-4xl">
        {title}
      </h2>
      <p className="mt-4 text-base leading-7 text-[#B5B5B5] sm:text-lg">
        {subtitle}
      </p>
    </div>
  );
}
