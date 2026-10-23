import { cn } from "../utils/cn";
import { BadgeCheck } from "./Icons";
import { Eyebrow, Reveal, Stars } from "./ui";

const testimonials = [
  {
    name: "Roberto S.",
    initials: "RS",
    car: "Cliente desde 2016",
    date: "Corrientes",
    quote:
      "Compré mi primera camioneta con Verdun hace 8 años y volví por la segunda. El financiamiento por crédito prendario fue clave.",
    dark: false,
  },
  {
    name: "Analía M.",
    initials: "AM",
    car: "Compradora de 0KM",
    date: "2024",
    quote:
      "Me atendieron diferente desde el primer mensaje de WhatsApp. Sin presión, me explicaron todo y salí con el auto ese mismo día.",
    dark: true,
  },
  {
    name: "Diego P.",
    initials: "DP",
    car: "Permuta + financiamiento",
    date: "2023",
    quote:
      "Di mi usado en parte de pago y fue muy transparente. Me tasaron bien y no tuve sorpresas. Los recomiendo sin dudarlo.",
    dark: false,
  },
];

export default function Testimonials() {
  return (
    <section className="border-t border-line/70 bg-paper py-20 sm:py-24">
      <div className="mx-auto max-w-[1440px] px-5 sm:px-8 lg:px-10">
        <Reveal>
          <div className="flex flex-col gap-7 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <Eyebrow>05 — Clientes</Eyebrow>
              <h2 className="mt-4 text-[clamp(2.1rem,4.4vw,3.5rem)] font-extrabold leading-[1.02] tracking-[-0.05em] text-ink">
                Ellos ya{" "}
                <span className="font-serif font-normal italic tracking-[-0.01em] text-forest">
                  eligieron.
                </span>
              </h2>
              <p className="mt-4 max-w-md text-[13.5px] leading-relaxed text-muted">
                Más de 30 años de trayectoria y una sola forma de trabajar: que la experiencia sea
                tan buena como el auto.
              </p>
            </div>

            <div className="flex w-fit items-center gap-4 rounded-2xl border border-line/80 bg-cream px-5 py-4">
              <p className="text-[36px] font-extrabold leading-none tracking-[-0.05em] text-ink">
                30
              </p>
              <div className="border-l border-line pl-4">
                <p className="text-[11px] font-bold text-ink">años de trayectoria</p>
                <p className="mt-1.5 text-[10px] font-medium text-muted">
                  Desde 1994 en Corrientes
                </p>
              </div>
            </div>
          </div>
        </Reveal>

        <div className="mt-9 grid gap-4 md:grid-cols-3">
          {testimonials.map((testimonial, index) => (
            <Reveal key={testimonial.name} delay={index * 80}>
              <figure
                className={cn(
                  "flex h-full flex-col rounded-[1.35rem] border p-5 sm:p-6",
                  testimonial.dark
                    ? "border-forest bg-forest text-cream"
                    : "border-line/80 bg-cream/50 text-ink"
                )}
              >
                <div className="flex items-center justify-between gap-3">
                  <Stars
                    size="h-3.5 w-3.5"
                    className={testimonial.dark ? "text-lime" : "text-forest"}
                  />
                  <span
                    className={cn(
                      "text-[9px] font-bold uppercase tracking-[0.18em]",
                      testimonial.dark ? "text-cream/35" : "text-muted/60"
                    )}
                  >
                    Google
                  </span>
                </div>

                <blockquote
                  className={cn(
                    "mt-4 flex-1 text-[12.5px] leading-relaxed sm:text-[13px]",
                    testimonial.dark ? "text-cream/80" : "text-moss"
                  )}
                >
                  “{testimonial.quote}”
                </blockquote>

                <figcaption
                  className={cn(
                    "mt-5 flex items-center gap-3 border-t pt-4",
                    testimonial.dark ? "border-cream/15" : "border-line/70"
                  )}
                >
                  <span
                    className={cn(
                      "grid h-9 w-9 place-items-center rounded-full text-[10px] font-extrabold",
                      testimonial.dark ? "bg-lime text-ink" : "bg-forest text-cream"
                    )}
                  >
                    {testimonial.initials}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-[11.5px] font-bold">{testimonial.name}</p>
                    <p
                      className={cn(
                        "mt-0.5 truncate text-[9.5px]",
                        testimonial.dark ? "text-cream/45" : "text-muted"
                      )}
                    >
                      {testimonial.car} · {testimonial.date}
                    </p>
                  </div>
                  <BadgeCheck
                    className={cn(
                      "ml-auto h-4 w-4 shrink-0",
                      testimonial.dark ? "text-lime" : "text-forest"
                    )}
                  />
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
