import { useEffect, useState } from "react";
import { formatUSD, monthlyPayment } from "../data/cars";
import { cn } from "../utils/cn";
import { ArrowUpRight, Check, Phone } from "./Icons";
import { Eyebrow, Reveal } from "./ui";

const MIN_PRICE = 20000;
const MAX_PRICE = 160000;
const terms = [24, 36, 48, 60];

export default function Financing({
  onSchedule,
  presetPrice,
}: {
  onSchedule: () => void;
  presetPrice?: { price: number; nonce: number } | null;
}) {
  const [price, setPrice] = useState(80000);
  const [downPct, setDownPct] = useState(20);
  const [months, setMonths] = useState(60);

  useEffect(() => {
    if (!presetPrice) return;
    const clamped = Math.min(MAX_PRICE, Math.max(MIN_PRICE, presetPrice.price));
    setPrice(Math.round(clamped / 1000) * 1000);
  }, [presetPrice]);

  const down = Math.round((price * downPct) / 100);
  const financed = price - down;
  const monthly = monthlyPayment(price, downPct / 100, months);
  const priceFill = ((price - MIN_PRICE) / (MAX_PRICE - MIN_PRICE)) * 100;
  const downFill = ((downPct - 10) / 50) * 100;

  const bullets = [
    "Tasa fija del 7,9% TNA",
    "Aprobación en 24 horas",
    "De 24 a 60 meses",
    "Sin gastos de otorgamiento",
  ];

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
                Simulá tu cuota en segundos. Sin comisiones ocultas, con tasa fija y la posibilidad
                de adelantar cuotas cuando quieras.
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
                  “Financiamos 6 de cada 10 autos que entregamos.”
                </p>
                <p className="mt-2 text-[9.5px] font-bold uppercase tracking-[0.16em] text-cream/40">
                  Datos internos VELTA · 2025
                </p>
              </div>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
                <a
                  href="tel:+541155550198"
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-cream/20 px-5 py-3.5 text-[12px] font-semibold text-cream transition hover:border-lime hover:text-lime"
                >
                  <Phone className="h-3.5 w-3.5" />
                  Hablar con un asesor
                </a>
                <p className="text-[10px] leading-relaxed text-cream/35">
                  Lun a Sáb · 9 a 20 h
                  <br />
                  Respuesta promedio: 4 min
                </p>
              </div>
            </Reveal>
          </div>

          <Reveal delay={60}>
            <div className="rounded-[1.75rem] border border-white/10 bg-paper p-5 text-ink shadow-[0_35px_90px_-35px_rgba(0,0,0,0.65)] sm:p-7">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-[9.5px] font-bold uppercase tracking-[0.2em] text-muted">
                    Simulador de cuota
                  </p>
                  <h3 className="mt-1.5 text-[22px] font-extrabold tracking-[-0.03em]">
                    Armá tu plan.
                  </h3>
                </div>
                <span className="rounded-full border border-forest/15 bg-lime/60 px-3 py-1.5 text-[9px] font-extrabold uppercase tracking-[0.12em] text-forest">
                  Tasa fija 7,9%
                </span>
              </div>

              <div className="mt-6">
                <div className="flex items-end justify-between gap-3">
                  <label
                    htmlFor="finance-price"
                    className="text-[10.5px] font-bold uppercase tracking-[0.13em] text-muted"
                  >
                    Valor del vehículo
                  </label>
                  <span className="text-[17px] font-extrabold tracking-[-0.03em]">
                    {formatUSD(price)}
                  </span>
                </div>
                <input
                  id="finance-price"
                  type="range"
                  className="range mt-3"
                  min={MIN_PRICE}
                  max={MAX_PRICE}
                  step={1000}
                  value={price}
                  onChange={(event) => setPrice(Number(event.target.value))}
                  aria-valuetext={formatUSD(price)}
                  style={{
                    background: `linear-gradient(to right, var(--color-forest) 0%, var(--color-forest) ${priceFill}%, var(--color-line) ${priceFill}%, var(--color-line) 100%)`,
                  }}
                />
                <div className="mt-2 flex justify-between text-[9px] font-medium text-muted/70">
                  <span>{formatUSD(MIN_PRICE)}</span>
                  <span>{formatUSD(MAX_PRICE)}</span>
                </div>
              </div>

              <div className="mt-5">
                <div className="flex items-end justify-between gap-3">
                  <label
                    htmlFor="finance-down"
                    className="text-[10.5px] font-bold uppercase tracking-[0.13em] text-muted"
                  >
                    Anticipo
                  </label>
                  <span className="text-[12px] font-extrabold text-ink">
                    {downPct}%{" "}
                    <span className="font-medium text-muted">· {formatUSD(down)}</span>
                  </span>
                </div>
                <input
                  id="finance-down"
                  type="range"
                  className="range mt-3"
                  min={10}
                  max={60}
                  step={5}
                  value={downPct}
                  onChange={(event) => setDownPct(Number(event.target.value))}
                  aria-valuetext={`${downPct}% de anticipo`}
                  style={{
                    background: `linear-gradient(to right, var(--color-forest) 0%, var(--color-forest) ${downFill}%, var(--color-line) ${downFill}%, var(--color-line) 100%)`,
                  }}
                />
                <div className="mt-2 flex justify-between text-[9px] font-medium text-muted/70">
                  <span>10%</span>
                  <span>60%</span>
                </div>
              </div>

              <div className="mt-5">
                <p className="text-[10.5px] font-bold uppercase tracking-[0.13em] text-muted">
                  Plazo
                </p>
                <div className="mt-2.5 grid grid-cols-4 gap-2">
                  {terms.map((term) => (
                    <button
                      key={term}
                      type="button"
                      onClick={() => setMonths(term)}
                      aria-pressed={months === term}
                      className={cn(
                        "rounded-xl border py-2.5 text-[11.5px] font-bold transition",
                        months === term
                          ? "border-forest bg-forest text-cream"
                          : "border-line bg-cream/50 text-moss hover:border-ink/30"
                      )}
                    >
                      {term}
                      <span className="ml-0.5 text-[8.5px] font-medium opacity-60">m</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-5 rounded-2xl bg-ink p-5 text-cream">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-cream/45">
                      Tu cuota estimada
                    </p>
                    <p className="mt-1 text-[32px] font-extrabold leading-none tracking-[-0.045em] text-lime sm:text-[37px]">
                      {formatUSD(monthly)}
                      <span className="text-[12px] font-semibold tracking-normal text-cream/50">
                        {" "}
                        /mes
                      </span>
                    </p>
                  </div>
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-cream/15 text-lime">
                    <Check className="h-4 w-4" />
                  </span>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3 border-t border-cream/15 pt-3.5">
                  <div>
                    <p className="text-[8.5px] uppercase tracking-[0.12em] text-cream/40">
                      Monto financiado
                    </p>
                    <p className="mt-0.5 text-[12px] font-bold text-cream">{formatUSD(financed)}</p>
                  </div>
                  <div>
                    <p className="text-[8.5px] uppercase tracking-[0.12em] text-cream/40">
                      Plan
                    </p>
                    <p className="mt-0.5 text-[12px] font-bold text-cream">
                      {months} meses · fija
                    </p>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={onSchedule}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-lime px-5 py-3.5 text-[12.5px] font-bold text-ink transition hover:bg-lime-soft"
              >
                Solicitar preaprobación
                <ArrowUpRight className="h-4 w-4" />
              </button>
              <p className="mt-2.5 text-center text-[8.5px] leading-relaxed text-muted">
                Cálculo orientativo con IVA incluido. No constituye oferta crediticia. Sujeto a
                aprobación.
              </p>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
