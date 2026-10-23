import {
  ArrowUpRight,
  BadgeCheck,
  CarIcon,
  Handshake,
  ShieldCheck,
  Wallet,
} from "./Icons";
import { Eyebrow, Reveal } from "./ui";

const features = [
  {
    icon: CarIcon,
    title: "Selección, no stock",
    text: "Cada auto está revisado y garantizado. Si no lo compraríamos nosotros, no está acá.",
  },
  {
    icon: BadgeCheck,
    title: "Precios claros",
    text: "Consultá el precio y las condiciones con un asesor. Sin gastos escondidos ni sorpresas al firmar.",
  },
  {
    icon: Wallet,
    title: "Crédito prendario",
    text: "Financiamiento con banco de hasta el 50% del valor del vehículo. Sujeto a aprobación.",
  },
  {
    icon: Handshake,
    title: "Te acompañamos después",
    text: "Service, asistencia y un asesor de confianza que sigue tu auto después de la entrega.",
  },
];

export default function Experience({ onSchedule }: { onSchedule: () => void }) {
  return (
    <section
      id="nosotros"
      className="scroll-mt-24 border-y border-line/70 bg-paper py-20 sm:py-24 lg:py-28"
    >
      <div className="mx-auto max-w-[1440px] px-5 sm:px-8 lg:px-10">
        <div className="grid items-center gap-12 lg:grid-cols-[0.98fr_1.02fr] lg:gap-16">
          <Reveal>
            <div className="relative">
              <a
                href="https://maps.google.com/?q=Av.+Chacabuco+1725,+Corrientes,+Argentina"
                target="_blank"
                rel="noopener noreferrer"
                title="Ver en Google Maps"
                className="group relative block overflow-hidden rounded-[1.75rem] border border-line bg-sand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest focus-visible:ring-offset-2"
              >
                <img
                  src="/images/local.jpg"
                  alt="Local Verdun Automotores"
                  loading="lazy"
                  decoding="async"
                  width={600}
                  height={400}
                  className="h-[420px] w-full object-cover transition duration-700 ease-out group-hover:scale-[1.03] group-hover:brightness-105 sm:h-[500px] lg:h-[570px]"
                />
                <span className="absolute bottom-4 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full border border-white/15 bg-ink/85 px-4 py-1.5 text-[12px] font-semibold text-cream backdrop-blur-md transition group-hover:bg-forest">
                  📍 Ver en Maps
                </span>
              </a>

              <div className="absolute -right-3 top-8 hidden flex-col gap-2 rounded-2xl border border-line/80 bg-paper px-4 py-3.5 shadow-[0_18px_40px_-20px_rgba(20,36,30,0.45)] sm:flex">
                <div className="flex items-center gap-2">
                  <span className="grid h-7 w-7 place-items-center rounded-full bg-lime text-ink">
                    <ShieldCheck className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="text-[11px] font-extrabold leading-none text-ink">Garantía</p>
                    <p className="mt-0.5 text-[9px] text-muted">en todos los usados</p>
                  </div>
                </div>
              </div>
            </div>
          </Reveal>

          <div>
            <Reveal>
              <Eyebrow>06 — La experiencia Verdun</Eyebrow>
              <h2 className="mt-4 text-[clamp(2.1rem,4.4vw,3.5rem)] font-extrabold leading-[1.02] tracking-[-0.05em] text-ink">
                Comprar un auto
                <br className="hidden sm:block" /> puede ser{" "}
                <span className="font-serif font-normal italic tracking-[-0.01em] text-forest">
                  simple.
                </span>
              </h2>
              <p className="mt-4 max-w-md text-[13.5px] leading-relaxed text-muted">
                Desde 1994 cambiamos la forma de comprar un auto: menos sala de ventas, más
                asesoramiento. Menos trámites, más tiempo manejando.
              </p>
            </Reveal>

            <div className="mt-7 divide-y divide-line/80 border-y border-line/80">
              {features.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <Reveal key={feature.title} delay={index * 60}>
                    <div className="group flex gap-4 py-5">
                      <span className="pt-1 text-[9.5px] font-bold tracking-widest text-muted/50">
                        0{index + 1}
                      </span>
                      <span className="mt-0.5 grid h-10 w-10 shrink-0 place-items-center rounded-full border border-ink/10 bg-cream/60 text-forest transition duration-300 group-hover:border-lime group-hover:bg-lime group-hover:text-ink">
                        <Icon className="h-[18px] w-[18px]" />
                      </span>
                      <div>
                        <h3 className="text-[14px] font-extrabold tracking-[-0.015em] text-ink">
                          {feature.title}
                        </h3>
                        <p className="mt-1.5 max-w-sm text-[11.5px] leading-relaxed text-muted">
                          {feature.text}
                        </p>
                      </div>
                    </div>
                  </Reveal>
                );
              })}
            </div>

            <Reveal delay={100}>
              <div className="mt-7 flex flex-col gap-4 sm:flex-row sm:items-center">
                <button
                  type="button"
                  onClick={onSchedule}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-ink px-5 py-3.5 text-[12px] font-semibold text-cream transition hover:bg-forest"
                >
                  Conocé el showroom
                  <ArrowUpRight className="h-4 w-4" />
                </button>
                <div className="flex items-center gap-2 text-[10.5px] text-muted">
                  <span className="pulse-dot h-1.5 w-1.5 rounded-full bg-moss" />
                  Visitas sin turno previo
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}
