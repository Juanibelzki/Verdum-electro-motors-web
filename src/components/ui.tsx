import { useEffect, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { cn } from "../utils/cn";
import { Star, X } from "./Icons";

export function Reveal({
  children,
  className,
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (typeof IntersectionObserver === "undefined") {
      node.classList.add("is-visible");
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            node.classList.add("is-visible");
            observer.unobserve(node);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className={cn("reveal", className)} style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </div>
  );
}

export function Eyebrow({
  children,
  light = false,
  className,
}: {
  children: ReactNode;
  light?: boolean;
  className?: string;
}) {
  return (
    <p
      className={cn(
        "flex items-center gap-3 text-[10.5px] font-bold uppercase tracking-[0.22em]",
        light ? "text-cream/55" : "text-muted",
        className
      )}
    >
      <span className={cn("h-px w-7", light ? "bg-cream/30" : "bg-ink/25")} />
      {children}
    </p>
  );
}

export function Stars({ className, size = "h-3.5 w-3.5" }: { className?: string; size?: string }) {
  return (
    <div className={cn("flex items-center gap-0.5 text-forest", className)} aria-label="5 de 5 estrellas">
      {Array.from({ length: 5 }).map((_, index) => (
        <Star key={index} className={size} />
      ))}
    </div>
  );
}

export function Logo({ light = false, className }: { light?: boolean; className?: string }) {
  return (
    <a
      href="#top"
      className={cn("group inline-flex items-center gap-2.5", className)}
      aria-label="Verdun Automotores, ir al inicio"
    >
      <span
        className={cn(
          "grid h-9 w-9 place-items-center rounded-full transition-transform duration-300 group-hover:rotate-[-8deg]",
          light ? "bg-lime text-ink" : "bg-ink text-lime"
        )}
      >
        <svg viewBox="0 0 24 24" className="h-[15px] w-[15px]" fill="none" aria-hidden="true">
          <path
            d="M4 5.5 12 20l8-14.5"
            stroke="currentColor"
            strokeWidth="3.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
      <span className="flex flex-col justify-center leading-none">
        <span
          className={cn(
            "text-[16px] font-extrabold uppercase leading-none tracking-[0.26em]",
            light ? "text-cream" : "text-ink"
          )}
        >
          Verdun
        </span>
        <span
          className={cn(
            "mt-1 text-[7.5px] font-semibold uppercase leading-none tracking-[0.24em]",
            light ? "text-cream/45" : "text-muted"
          )}
        >
          Automotores
        </span>
      </span>
    </a>
  );
}

export function Modal({
  open,
  onClose,
  children,
  label,
  className,
}: {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  label: string;
  className?: string;
}) {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[90] flex items-end justify-center sm:items-center sm:p-6">
      <div
        className="animate-overlay absolute inset-0 bg-ink/65 backdrop-blur-[3px]"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={label}
        className={cn(
          "animate-panel relative z-10 flex max-h-[94vh] w-full flex-col overflow-hidden rounded-t-[2rem] border border-line/70 bg-paper shadow-[0_40px_120px_-20px_rgba(10,20,16,0.55)] sm:max-h-[90vh] sm:max-w-3xl sm:rounded-[2rem]",
          className
        )}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar"
          className="absolute right-4 top-4 z-20 grid h-10 w-10 place-items-center rounded-full border border-line/60 bg-paper/90 text-ink backdrop-blur transition hover:bg-ink hover:text-cream"
        >
          <X className="h-4 w-4" />
        </button>
        {children}
      </div>
    </div>,
    document.body
  );
}


