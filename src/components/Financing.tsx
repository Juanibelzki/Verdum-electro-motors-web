import { whatsappLink } from "../data/cars";
import { ArrowUpRight, Check, Phone, Whatsapp } from "./Icons";
import { Eyebrow, Reveal } from "./ui";

const bullets = [
  "Financiación propia",
  "Planes de 24 a 60 meses",
  "Anticipo a convenir",
  "Sin gastos de otorgamiento",
];

const steps = [
  {
    title: "Elegí tu vehículo",
    text: "Del stock disponible o contanos cuál estás buscando.",
  },
  {
    title: "Definí anticipo y plazo",
    text: "Armamos el plan entre 24 y 60 meses, a tu medida.",
  },
  {
    title: "Recibí el plan",
    text: "Te pasamos las condiciones vigentes por WhatsApp.",
  },
];

const financeMessage =
  "Hola Verdun, quiero consultar opciones de financiación para un vehículo.";

export default function Financing({ onSchedule }: { onSchedule: () => void }) {
  return (
    <section
      id="financiacion"
      className="relative scroll-mt-24 overflow-hidden bg-ink py-20 text-cream sm:py-24 lg:py-28"
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.09]"
        style={{
          backgroundImage: "radial-gradient(#d8f36b 1px, transparent 1px)",
          backgroundSize: "30px 30px",
        }}
        aria-hidden="true"
      />
      <div className="pointer-events-none absolute -right-32 -top-40 h-[420px] w-[420px] rounded-full bg-forest blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -left-24 font-serif text-[220px] italic leading-none text-cream/[0.035] sm:text-[320px]">
        v.
      </div>

      <div className="relative mx-auto max-w-[1440px] px-5 sm:px-8 lg:px-10">
        <div className="grid gap-12 lg:grid-cols-[0.92fr_1.08fr] lg:items-center lg:gap-16">
          <div>
            <Reveal>
              <Eyebrow light>03 — Financiación</Eyebrow>
              <h2 className="mt-4 max-w-xl text-[clamp(2.2rem,4.5vw,3.7rem)] font-extrabold leading-[1.01] tracking-[-0.05em] text-cream">
                Tu auto, a tu{" "}
                <span className="font-serif font-normal italic tracking-[-0.01em] text-lime">
                  ritmo.
                </span>
              </h2>
              <p className="mt-5 max-w-md text-[13.5px] leading-relaxed text-cream/55">
                Financiación propia, sin banco y a tu medida. Contanos qué vehículo te interesa
                y te pasamos las opciones vigentes de anticipo y cuotas.
              </p>
            </Reveal>

            <Reveal delay={80}>
              <ul className="mt-7 grid max-w-md gap-3 sm:grid-cols-2">
                {bullets.map((bullet) => (
                  <li key={bullet} className="flex items-center gap-2.5 text-[11.5px] text-cream/80">
                    <span className="grid h-[18px] w-[18px] shrink-0 place-items-center rounded-full bg-lime/15 text-lime">
                      <Check className="h-3 w-3" strokeWidth={2.4} />
                    </span>
                    {bullet}
                  </li>
                ))}
              </ul>
            </Reveal>

            <Reveal delay={140}>
              <div className="mt-9 border-l-2 border-lime/60 pl-5">
                <p className="max-w-sm font-serif text-[21px] italic leading-snug text-cream/90">
                  “Financiación propia, sin banco, a tu medida.”
                </p>
                <p className="mt-2 text-[9.5px] font-bold uppercase tracking-[0.16em] text-cream/40">
                  Verdun Automotores · Corrientes
                </p>
              </div>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
                <a
                  href={whatsappLink(financeMessage)}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-lime px-5 py-3.5 text-[12px] font-bold text-ink transition hover:bg-lime-soft"
                >
                  <Whatsapp className="h-4 w-4" />
                  Consultar por WhatsApp
                </a>
                <a
                  href="tel:+5493795300020"
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-cream/20 px-5 py-3.5 text-[12px] font-semibold text-cream transition hover:border-lime hover:text-lime"
                >
                  <Phone className="h-3.5 w-3.5" />
                  Hablar con un asesor
                </a>
              </div>
              <p className="mt-3 text-[10px] leading-relaxed text-cream/35">
                Lun a Sáb · 9 a 20 h · Respuesta rápida
              </p>
            </Reveal>
          </div>

          <Reveal delay={60}>
            <div className="rounded-[1.75rem] border border-white/10 bg-paper p-5 text-ink shadow-[0_35px_90px_-35px_rgba(0,0,0,0.65)] sm:p-7">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-[9.5px] font-bold uppercase tracking-[0.2em] text-muted">
                    Financiación a medida
                  </p>
                  <h3 className="mt-1.5 text-[22px] font-extrabold tracking-[-0.03em]">
                    Armamos tu plan.
                  </h3>
                </div>
                <span className="rounded-full border border-forest/15 bg-lime/60 px-3 py-1.5 text-[9px] font-extrabold uppercase tracking-[0.12em] text-forest">
                  Sin cuota genérica
                </span>
              </div>

              <p className="mt-4 text-[12px] leading-relaxed text-muted">
                No publicamos una cuota fija: cada plan se arma según el vehículo, el anticipo y
                el plazo que elijas.
              </p>

              <ol className="mt-6 space-y-3">
                {steps.map((step, index) => (
                  <li
                    key={step.title}
                    className="flex items-start gap-3 rounded-xl border border-line/70 bg-cream/50 p-3.5"
                  >
                    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-ink text-[10px] font-extrabold text-lime">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <div>
                      <p className="text-[12px] font-extrabold tracking-tight text-ink">
                        {step.title}
                      </p>
                      <p className="mt-0.5 text-[10.5px] leading-relaxed text-muted">
                        {step.text}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>

              <a
                href={whatsappLink(financeMessage)}
                target="_blank"
                rel="noreferrer"
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-lime px-5 py-3.5 text-[12.5px] font-bold text-ink transition hover:bg-lime-soft"
              >
                <Whatsapp className="h-4 w-4" />
                Consultar mi plan
                <ArrowUpRight className="h-4 w-4" />
              </a>
              <button
                type="button"
                onClick={onSchedule}
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-full border border-ink/15 px-5 py-3 text-[12px] font-semibold text-ink transition hover:border-ink/30 hover:bg-cream/60"
              >
                Agendar visita al showroom
              </button>
              <p className="mt-3 text-center text-[8.5px] leading-relaxed text-muted">
                Las condiciones se confirman con un asesor. Sujeto a aprobación.
              </p>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
