import { useState, type FormEvent } from "react";
import { formatUSD } from "../data/cars";
import { ArrowUpRight, Check, Sparkles } from "./Icons";
import { Eyebrow, Reveal } from "./ui";

const inputClass =
  "w-full rounded-xl border border-line bg-white/65 px-3.5 py-3 text-[12.5px] font-medium text-ink placeholder:text-muted/50 transition focus:border-forest focus:outline-none focus:ring-4 focus:ring-forest/10";

const benefits = [
  "Tasación sin cargo en menos de 24 horas",
  "Tomamos tu auto como parte de pago",
  "Nos ocupamos de transferencia y papeleo",
];

export default function SellCar({ onSchedule }: { onSchedule: () => void }) {
  const [form, setForm] = useState({ brand: "", model: "", year: "2021", km: "" });
  const [estimate, setEstimate] = useState<{ low: number; high: number } | null>(null);

  const update = (field: keyof typeof form, value: string) =>
    setForm((current) => ({ ...current, [field]: value }));

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const year = Number(form.year) || 2021;
    const km = Number(form.km) || 0;
    const depreciation = Math.max(0, 2026 - year) * 1250;
    const wear = Math.max(0, km - 10000) * 0.11;
    const base = Math.max(7200, 34000 - depreciation - wear);
    setEstimate({
      low: Math.round((base * 0.92) / 100) * 100,
      high: Math.round((base * 1.08) / 100) * 100,
    });
  };

  const reset = () => {
    setForm({ brand: "", model: "", year: "2021", km: "" });
    setEstimate(null);
  };

  return (
    <section id="vender" className="scroll-mt-24 bg-cream py-16 sm:py-20 lg:py-24">
      <div className="mx-auto max-w-[1440px] px-5 sm:px-8 lg:px-10">
        <Reveal>
          <div className="relative overflow-hidden rounded-[2rem] bg-lime p-5 sm:p-8 lg:p-12">
            <div
              className="pointer-events-none absolute -right-20 -top-24 h-[340px] w-[340px] rounded-full border border-ink/10"
              aria-hidden="true"
            />
            <div
              className="pointer-events-none absolute -right-10 -top-14 h-[220px] w-[220px] rounded-full border border-ink/10"
              aria-hidden="true"
            />
            <div className="relative grid items-center gap-9 lg:grid-cols-[1.03fr_0.97fr] lg:gap-14">
              <div>
                <Eyebrow className="text-ink/55">04 — Permuta y venta</Eyebrow>
                <h2 className="mt-4 max-w-xl text-[clamp(2.05rem,4.2vw,3.3rem)] font-extrabold leading-[1.01] tracking-[-0.05em] text-ink">
                  Tu auto actual vale{" "}
                  <span className="font-serif font-normal italic tracking-[-0.01em]">
                    más de lo que pensás.
                  </span>
                </h2>
                <p className="mt-4 max-w-md text-[13px] leading-relaxed text-ink/60">
                  Tasamos tu vehículo sin costo y en menos de 24 horas. Podés usarlo como parte de
                  pago o venderlo directo, con el precio justo y sin publicarlo.
                </p>

                <ul className="mt-6 space-y-2.5">
                  {benefits.map((benefit) => (
                    <li key={benefit} className="flex items-start gap-2.5 text-[12px] font-medium text-ink/75">
                      <span className="mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full bg-ink text-lime">
                        <Check className="h-2.5 w-2.5" strokeWidth={2.6} />
                      </span>
                      {benefit}
                    </li>
                  ))}
                </ul>

                <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-ink/15 pt-5">
                  <div>
                    <p className="text-[20px] font-extrabold leading-none tracking-[-0.03em] text-ink">
                      24 h
                    </p>
                    <p className="mt-1 text-[9.5px] font-medium text-ink/50">para tu tasación</p>
                  </div>
                  <span className="h-8 w-px bg-ink/15" />
                  <div>
                    <p className="text-[20px] font-extrabold leading-none tracking-[-0.03em] text-ink">
                      100%
                    </p>
                    <p className="mt-1 text-[9.5px] font-medium text-ink/50">gestionado por Verdun</p>
                  </div>
                  <span className="hidden h-8 w-px bg-ink/15 sm:block" />
                  <p className="hidden max-w-[150px] text-[10px] leading-relaxed text-ink/50 sm:block">
                    Pago inmediato por transferencia bancaria.
                  </p>
                </div>
              </div>

              <div className="rounded-[1.5rem] border border-ink/10 bg-paper p-5 shadow-[0_25px_60px_-35px_rgba(20,36,30,0.45)] sm:p-6">
                {estimate ? (
                  <div className="flex min-h-[330px] flex-col justify-center py-3 text-center">
                    <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-lime text-ink">
                      <Check className="h-6 w-6" strokeWidth={2.3} />
                    </span>
                    <p className="mt-5 text-[9.5px] font-bold uppercase tracking-[0.2em] text-muted">
                      Estimación para {form.brand} {form.model}
                    </p>
                    <p className="mt-2 text-[27px] font-extrabold leading-tight tracking-[-0.04em] text-ink sm:text-[30px]">
                      {formatUSD(estimate.low)} – {formatUSD(estimate.high)}
                    </p>
                    <p className="mx-auto mt-2 max-w-[280px] text-[10.5px] leading-relaxed text-muted">
                      Es un valor orientativo. La tasación final se confirma con una revisión de 30
                      minutos en el showroom.
                    </p>
                    <div className="mt-5 flex flex-col gap-2">
                      <button
                        type="button"
                        onClick={onSchedule}
                        className="flex items-center justify-center gap-2 rounded-full bg-ink px-5 py-3.5 text-[12px] font-semibold text-cream transition hover:bg-forest"
                      >
                        Coordinar tasación final
                        <ArrowUpRight className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={reset}
                        className="rounded-full px-4 py-2 text-[11px] font-semibold text-muted transition hover:text-ink"
                      >
                        Tasar otro auto
                      </button>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit}>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-[9.5px] font-bold uppercase tracking-[0.18em] text-muted">
                          Tasación online
                        </p>
                        <h3 className="mt-1.5 text-[21px] font-extrabold tracking-[-0.03em] text-ink">
                          Contanos de tu auto.
                        </h3>
                      </div>
                      <span className="grid h-9 w-9 place-items-center rounded-full bg-lime/60 text-forest">
                        <Sparkles className="h-4 w-4" />
                      </span>
                    </div>
                    <p className="mt-1.5 text-[11px] leading-relaxed text-muted">
                      Tres datos. Una estimación real. Sin compromiso.
                    </p>

                    <div className="mt-5 grid grid-cols-2 gap-3">
                      <div>
                        <label htmlFor="sell-brand" className="mb-1.5 block text-[9.5px] font-bold uppercase tracking-[0.12em] text-muted">
                          Marca
                        </label>
                        <input
                          id="sell-brand"
                          className={inputClass}
                          placeholder="Ej. Toyota"
                          value={form.brand}
                          onChange={(event) => update("brand", event.target.value)}
                          required
                        />
                      </div>
                      <div>
                        <label htmlFor="sell-model" className="mb-1.5 block text-[9.5px] font-bold uppercase tracking-[0.12em] text-muted">
                          Modelo
                        </label>
                        <input
                          id="sell-model"
                          className={inputClass}
                          placeholder="Ej. Corolla"
                          value={form.model}
                          onChange={(event) => update("model", event.target.value)}
                          required
                        />
                      </div>
                      <div>
                        <label htmlFor="sell-year" className="mb-1.5 block text-[9.5px] font-bold uppercase tracking-[0.12em] text-muted">
                          Año
                        </label>
                        <select
                          id="sell-year"
                          className={`${inputClass} appearance-none`}
                          value={form.year}
                          onChange={(event) => update("year", event.target.value)}
                        >
                          {Array.from({ length: 17 }, (_, index) => 2026 - index).map((year) => (
                            <option key={year} value={year}>
                              {year}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label htmlFor="sell-km" className="mb-1.5 block text-[9.5px] font-bold uppercase tracking-[0.12em] text-muted">
                          Kilómetros
                        </label>
                        <input
                          id="sell-km"
                          className={inputClass}
                          placeholder="Ej. 45000"
                          type="number"
                          min={0}
                          max={1000000}
                          inputMode="numeric"
                          value={form.km}
                          onChange={(event) => update("km", event.target.value)}
                          required
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-ink px-5 py-3.5 text-[12px] font-semibold text-cream transition hover:bg-forest"
                    >
                      Calcular mi tasación
                      <ArrowUpRight className="h-4 w-4" />
                    </button>
                    <p className="mt-2.5 text-center text-[8.5px] leading-relaxed text-muted">
                      Estimación orientativa basada en año y kilometraje. No constituye una oferta
                      de compra.
                    </p>
                  </form>
                )}
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
