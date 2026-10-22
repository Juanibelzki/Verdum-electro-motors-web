import { useEffect, useState } from "react";
import { cn } from "../utils/cn";
import { ArrowUpRight, Menu, Phone, X } from "./Icons";
import { Logo } from "./ui";

const links = [
  { label: "Vehículos", href: "#vehiculos" },
  { label: "Financiación", href: "#financiacion" },
  { label: "Nosotros", href: "#nosotros" },
  { label: "Parte de pago", href: "#vender" },
  { label: "Showroom", href: "#showroom" },
];

export default function Header({ onSchedule }: { onSchedule: () => void }) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <div className="bg-ink text-cream">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-4 px-5 py-2.5 lg:px-10">
          <p className="flex items-center gap-2 text-[10px] font-medium tracking-wide text-cream/80 sm:text-[11px]">
            <span className="pulse-dot inline-block h-1.5 w-1.5 rounded-full bg-lime" />
            Showroom
            <span className="hidden sm:inline">· Lun a Sáb</span>
          </p>
          <div className="flex items-center gap-4 sm:gap-6">
            <p className="hidden items-center gap-1.5 text-[11px] text-cream/65 md:flex">
              <span className="font-semibold text-lime">Financiación propia</span> sin banco
            </p>
            <a
              href="tel:+5493795300020"
              className="flex items-center gap-1.5 text-[11px] font-semibold tracking-wide transition hover:text-lime"
            >
              <Phone className="h-3 w-3" />
              +54 9 3795-300020
            </a>
          </div>
        </div>
      </div>

      <header className="sticky top-0 z-50">
        <div
          className={cn(
            "border-b transition-all duration-300",
            scrolled
              ? "border-line/80 bg-cream/92 shadow-[0_12px_40px_-24px_rgba(20,36,30,0.45)] backdrop-blur-xl"
              : "border-transparent bg-cream"
          )}
        >
          <div className="mx-auto flex h-[70px] max-w-[1440px] items-center justify-between gap-4 px-5 lg:h-[76px] lg:px-10">
            <Logo />

            <nav className="hidden items-center gap-7 lg:flex" aria-label="Navegación principal">
              {links.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="group relative text-[13px] font-semibold text-ink/70 transition hover:text-ink"
                >
                  {link.label}
                  <span className="absolute -bottom-1.5 left-0 h-px w-full origin-left scale-x-0 bg-ink transition-transform duration-300 group-hover:scale-x-100" />
                </a>
              ))}
            </nav>

            <div className="flex items-center gap-2.5">
              <a
                href="tel:+5493795300020"
                className="mr-1 hidden items-center gap-2 text-[12px] font-semibold text-ink/75 transition hover:text-ink xl:flex"
              >
                <span className="grid h-8 w-8 place-items-center rounded-full border border-ink/10">
                  <Phone className="h-3.5 w-3.5" />
                </span>
                Hablemos
              </a>
              <button
                type="button"
                onClick={onSchedule}
                className="hidden items-center gap-2 rounded-full bg-ink px-5 py-3 text-[12.5px] font-semibold text-cream transition duration-300 hover:bg-forest sm:inline-flex"
              >
                Agendar test drive
                <ArrowUpRight className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setMenuOpen((value) => !value)}
                aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"}
                aria-expanded={menuOpen}
                className="grid h-10 w-10 place-items-center rounded-full border border-ink/15 bg-transparent text-ink transition hover:bg-ink hover:text-cream lg:hidden"
              >
                {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </div>
        </div>

        {menuOpen && (
          <div className="absolute inset-x-0 top-full border-b border-line bg-cream/98 px-5 pb-6 pt-2 shadow-[0_30px_60px_-25px_rgba(20,36,30,0.3)] backdrop-blur-xl lg:hidden">
            <nav aria-label="Navegación móvil">
              {links.map((link, index) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center justify-between border-b border-line/70 py-4 text-[17px] font-semibold text-ink"
                >
                  <span className="flex items-center gap-3">
                    <span className="text-[10px] font-bold tracking-widest text-muted/60">
                      0{index + 1}
                    </span>
                    {link.label}
                  </span>
                  <ArrowUpRight className="h-4 w-4 text-moss" />
                </a>
              ))}
            </nav>
            <button
              type="button"
              onClick={() => {
                setMenuOpen(false);
                onSchedule();
              }}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-ink px-5 py-4 text-sm font-semibold text-cream"
            >
              Agendar test drive
              <ArrowUpRight className="h-4 w-4" />
            </button>
            <div className="mt-4 flex items-center justify-between text-[11px] text-muted">
              <a href="tel:+5493795300020" className="font-semibold text-ink">
                +54 9 3795-300020
              </a>
              <span>Lun a Sáb · 9 a 20 h</span>
            </div>
          </div>
        )}
      </header>
    </>
  );
}
