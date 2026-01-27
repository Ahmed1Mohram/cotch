import type {
  AnchorHTMLAttributes,
  ButtonHTMLAttributes,
  ReactNode,
} from "react";

import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "ghost";
type Size = "sm" | "md" | "lg";

type CommonProps = {
  children: ReactNode;
  className?: string;
  size?: Size;
  variant?: Variant;
};

type ButtonProps = CommonProps &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, "size"> & { href?: undefined };

type AnchorProps = CommonProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "size"> & { href: string };

export function Button(props: ButtonProps | AnchorProps) {
  const className = props.className;
  const size: Size = props.size ?? "md";
  const variant: Variant = props.variant ?? "primary";

  const base =
    "inline-flex items-center justify-center gap-2 whitespace-nowrap font-heading uppercase tracking-[0.14em] transition will-change-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]";

  const sizes: Record<Size, string> = {
    sm: "h-10 px-5 text-xs",
    md: "h-12 px-7 text-xs sm:text-sm",
    lg: "h-14 px-9 text-sm",
  };

  const variants: Record<Variant, string> = {
    primary:
      "relative isolate overflow-hidden bg-gradient-to-r from-[#FF2424] via-[#FF6A00] to-[#FFB35A] text-white shadow-[0_0_0_1px_rgba(255,106,0,0.26),0_26px_84px_-40px_rgba(255,36,36,0.80)] before:pointer-events-none before:absolute before:inset-0 before:bg-[radial-gradient(120px_90px_at_22%_22%,rgba(255,255,255,0.35),transparent_60%),radial-gradient(120px_90px_at_78%_64%,rgba(255,179,90,0.22),transparent_60%)] before:opacity-0 before:transition-opacity hover:before:opacity-100 after:pointer-events-none after:absolute after:-inset-y-10 after:-left-24 after:w-20 after:rotate-12 after:bg-white/25 after:blur-md after:opacity-0 after:transition-all after:duration-700 hover:after:opacity-100 hover:after:translate-x-[420px] hover:brightness-110 hover:saturate-150 hover:shadow-[0_0_0_1px_rgba(255,179,90,0.30),0_34px_110px_-48px_rgba(255,36,36,0.95)] active:translate-y-px",
    secondary:
      "bg-black/55 text-white shadow-[0_0_0_1px_rgba(255,255,255,0.14),0_18px_60px_-44px_rgba(0,0,0,0.95)] hover:bg-black/65 hover:shadow-[0_0_0_1px_rgba(255,106,0,0.28),0_26px_84px_-58px_rgba(255,106,0,0.55)] active:translate-y-px",
    ghost:
      "bg-transparent text-white/90 shadow-[0_0_0_1px_rgba(255,255,255,0.14)] hover:bg-white/5 hover:text-white hover:shadow-[0_0_0_1px_rgba(255,106,0,0.22)] active:translate-y-px",
  };

  const cls = cn(
    base,
    "rounded-xl",
    sizes[size],
    variants[variant],
    className,
  );

  if ("href" in props && typeof props.href === "string") {
    const { href, children, ...rest } = props;
    return (
      <a href={href} className={cls} {...rest}>
        {children}
      </a>
    );
  }

  const { children, ...rest } = props;
  return (
    <button className={cls} {...rest}>
      {children}
    </button>
  );
}
