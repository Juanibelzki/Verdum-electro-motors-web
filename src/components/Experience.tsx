import { images } from "../data/cars";
import {
  ArrowUpRight,
  BadgeCheck,
  CarIcon,
  Handshake,
  MapPin,
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
    title: "Financiación propia",
    text: "Armamos el plan a tu medida, sin banco. De 24 a 60 meses.",
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
              <div className="relative overflow-hidden rounded-[1.75rem] border border-line bg-sand">
                <img
                  src={images.showroom}
                  alt="Interior del showroom de Verdun Automotores"
                  className="h-[420px] w-full object-cover sm:h-[500px] lg:h-[570px]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-ink/90 via-ink/15 to-transparent" />

                <span className="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-ink/25 px-3 py-1.5 text-[9.5px] font-bold uppercase tracking-[0.16em] text-cream backdrop-blur-md">
                  <MapPin className="h-3 w-3 text-lime" />
                  Av. Chacabuco 1725
                </span>

                <div className="absolute inset-x-4 bottom-4 sm:inset-x-5 sm:bottom-5">
                  <div className="rounded-2xl border border-white/15 bg-ink/45 p-5 backdrop-blur-md sm:p-6">
                    <p className="font-serif text-[23px] italic leading-[1.15] tracking-[-0.01em] text-cream sm:text-[27px]">
                      “No vendemos autos. Acompañamos decisiones.”
                    </p>
                    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-white/15 pt-3.5">
                      <div>
                        <p className="text-[11px] font-semibold text-cream">Familia Verdun</p>
                        <p className="mt-0.5 text-[9.5px] uppercase tracking-[0.12em] text-cream/50">
                          Verdun Automotores
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5 text-lime">
                        <span className="text-[10px] font-bold">Desde 1994</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

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
              <Eyebrow>02 — La experiencia Verdun</Eyebrow>
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
