import { useEffect } from "react";
import { ArrowUpRight, ShieldCheck } from "../components/Icons";
import HeroVideosPanel from "./HeroVideosPanel";

export default function AdminApp() {
  useEffect(() => {
    const previousTitle = document.title;
    document.title = "Admin · Verdun Automotores";

    const robots = document.createElement("meta");
    robots.name = "robots";
    robots.content = "noindex,nofollow";
    document.head.appendChild(robots);

    return () => {
      document.title = previousTitle;
      robots.remove();
    };
  }, []);

  return (
    <div className="min-h-screen bg-cream">
      <header className="border-b border-line bg-paper/90 backdrop-blur">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 px-5 py-4 sm:px-8">
          <a href="/" className="group flex items-center gap-3">
            <span className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-full bg-ink ring-1 ring-ink/10 transition group-hover:ring-lime/60">
              <img
                src="/logo-verdun.png"
                alt="Verdun Automotores"
                className="h-11 w-11 scale-110 object-contain"
              />
            </span>
            <span className="leading-none">
              <span className="block text-[17px] font-extrabold tracking-[-0.045em] text-ink">
                VERDUN
              </span>
              <span className="mt-1 block text-[8px] font-semibold uppercase tracking-[0.3em] text-muted">
                Automotores
              </span>
            </span>
          </a>

          <div className="flex items-center gap-3">
            <span className="rounded-full border border-line bg-cream px-3 py-1 text-[9px] font-bold uppercase tracking-[0.18em] text-muted">
              Admin
            </span>
            <a
              href="/"
              className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-forest transition hover:text-ink"
            >
              Ver sitio
              <ArrowUpRight className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 pb-16 pt-6 sm:px-8 sm:pt-8">
        <div className="flex gap-3 rounded-2xl border border-amber-300/80 bg-amber-50 p-4 text-[12px] leading-relaxed text-amber-900">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
          <p>
            <strong>Panel de staging.</strong> Hoy queda detrás de la
            protección de Vercel. Antes de publicarlo en producción hay que
            agregar login con Supabase Auth y endurecer las políticas RLS.
          </p>
        </div>

        <HeroVideosPanel />
      </main>

      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-2 px-5 py-5 text-[10.5px] text-muted sm:px-8">
          <p>Verdun Automotores · Panel de contenido</p>
          <p>Av. Chacabuco 1725 · Corrientes</p>
        </div>
      </footer>
    </div>
  );
}
