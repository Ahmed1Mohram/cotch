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
    "inline-flex items-center justify-center gap-2 whitespace-nowrap font-heading uppercase tracking-[0.14em] transition will-change-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0B0B0B]";

  const sizes: Record<Size, string> = {
    sm: "h-10 px-5 text-xs",
    md: "h-12 px-7 text-xs sm:text-sm",
    lg: "h-14 px-9 text-sm",
  };

  const variants: Record<Variant, string> = {
    primary:
      "bg-gradient-to-r from-[#FF6A00] via-[#FF8A00] to-[#FFB35A] text-white shadow-[0_0_0_1px_rgba(255,179,90,0.22),0_22px_70px_-34px_rgba(255,106,0,0.75)] hover:brightness-110 hover:saturate-150 hover:shadow-[0_0_0_1px_rgba(255,179,90,0.28),0_30px_90px_-40px_rgba(255,106,0,0.90)] active:translate-y-px",
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
