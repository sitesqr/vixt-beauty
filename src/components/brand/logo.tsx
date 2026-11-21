import Link from "next/link";
import { cn } from "@/lib/utils";

/** Emblema oficial VIXT Beauty — vetorial, otimizado para fundos escuros. */
export function LogoImage({ className, priority = false }: { className?: string; priority?: boolean }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/images/vixt-beauty-logo-opt.png"
      alt="VIXT Beauty — Gestão Inteligente para Salões de Beleza"
      className={cn("h-full w-full object-contain", className)}
      loading={priority ? "eager" : "lazy"}
    />
  );
}

/** Full brand lockup for nav bars / sidebars — shows the complete emblem. */
export function Logo({
  href = "/",
  compact = false,
  className,
}: {
  href?: string;
  compact?: boolean;
  className?: string;
}) {
  const content = (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <span className={cn("relative shrink-0", compact ? "h-14 w-20" : "h-16 w-24")}>
        <LogoImage priority />
      </span>
      {!compact && <span className="sr-only">VIXT Beauty</span>}
    </span>
  );

  return href ? <Link href={href}>{content}</Link> : content;
}
