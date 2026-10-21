import { featuredCar, formatKm, formatUSD, images, monthlyPayment, type Car } from "../data/cars";
import { ArrowUpRight, Calendar, Sparkles } from "./Icons";

export default function Hero({
  onSchedule,
  onViewCar,
}: {
  onSchedule: () => void;
  onViewCar: (car: Car) => void;
}) {
  const avatars = [
    { initials: "CM", tone: "bg-forest text-cream" },
    { initials: "DR", tone: "bg-sand text-ink" },
    { initials: "LP", tone: "bg-moss text-cream" },
  ];

  const stats = [
    { value: "30 años", label: "De trayectoria" },
    { value: "1994", label: "Desde, en Corrientes" },
    { value: "0KM", label: "y usados garantizados" },
    { value: "100%", label: "Financiación propia" },
  ];

  const brands = ["Volkswagen", "Nissan", "Chevrolet", "Toyota", "Ford", "Fiat"];

  return (
    <section id="top" className="relative overflow-hidden bg-cream">
      <div className="pointer-events-none absolute inset-0 hidden lg:block">
        <div className="mx-auto grid h-full max-w-[1440px] grid-cols-4 px-10">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="border-l border-ink/[0.055] last:border-r" />
          ))}
        </div>
      </div>

      <div className="relative mx-auto max-w-[1440px] px-5 pb-10 pt-8 sm:px-8 sm:pt-12 lg:px-10 lg:pb-14 lg:pt-14">
        <div className="grid items-center gap-10 lg:grid-cols-[1.02fr_0.98fr] lg:gap-12">
          <div className="relative z-10">
            <p className="inline-flex items-center gap-2.5 rounded-full border border-ink/10 bg-paper/70 px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-moss">
              <span className="pulse-dot h-1.5 w-1.5 rounded-full bg-moss" />
              Concesionaria · Corrientes
            </p>

            <h1 className="mt-6 max-w-[680px] text-[clamp(2.25rem,8vw,4rem)] font-extrabold leading-[0.94] tracking-[-0.055em] text-ink lg:text-[clamp(2.9rem,5.1vw,4.5rem)]">
              Tu próximo auto
              <br />
              no es una compra.
              <br />
              Es una{" "}
              <span className="relative isolate inline-block whitespace-nowrap font-serif font-normal italic tracking-[-0.025em] text-forest">
                <span className="absolute inset-x-[-3px] bottom-[0.1em] -z-10 h-[0.32em] -rotate-[0.6deg] bg-lime" />
                elección.
              </span>
            </h1>

            <p className="mt-6 max-w-[455px] text-[14.5px] leading-relaxed text-muted sm:text-[15px]">
              Autos 0KM, usados garantizados y motos eléctricas, con financiación propia y
              entrega inmediata en Corrientes. Sin vueltas, sin letra chica.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <a
                href="#vehiculos"
                className="inline-flex items-center justify-center gap-2.5 rounded-full bg-ink px-6 py-4 text-[13px] font-semibold text-cream transition duration-300 hover:bg-forest hover:shadow-[0_18px_35px_-18px_rgba(20,36,30,0.8)]"
              >
                Explorar vehículos
                <ArrowUpRight className="h-4 w-4" />
              </a>
              <button
                type="button"
                onClick={onSchedule}
                className="group inline-flex items-center justify-center gap-3 rounded-full border border-ink/12 bg-paper/70 py-2 pl-2 pr-5 text-[13px] font-semibold text-ink transition duration-300 hover:border-ink/25 hover:bg-paper"
              >
                <span className="grid h-9 w-9 place-items-center rounded-full bg-white text-ink shadow-sm transition duration-300 group-hover:bg-lime">
                  <Calendar className="h-4 w-4" />
                </span>
                Agendar test drive
              </button>
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-4 border-t border-line/70 pt-5">
              <div className="flex items-center gap-3">
                <div className="flex -space-x-2.5">
                  {avatars.map((avatar) => (
                    <span
                      key={avatar.initials}
                      className={`grid h-8 w-8 place-items-center rounded-full text-[9px] font-extrabold ring-2 ring-cream ${avatar.tone}`}
                    >
                      {avatar.initials}
                    </span>
                  ))}
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-bold text-ink">Familia Verdun</span>
                  </div>
                  <p className="mt-0.5 text-[10.5px] text-muted">Atención personalizada</p>
                </div>
              </div>
              <div className="h-8 w-px bg-line" aria-hidden="true" />
              <div>
                <p className="text-[11px] font-bold text-ink">Garantía en usados</p>
                <p className="mt-0.5 text-[10.5px] text-muted">Incluida</p>
              </div>
            </div>
          </div>

          <div className="relative lg:pl-2">
            <div className="relative overflow-hidden rounded-[1.75rem] border border-ink/10 bg-forest shadow-[0_35px_80px_-40px_rgba(20,36,30,0.65)]">
              <img
                src={images.hero}
                alt="Vehículo destacado en Verdun Automotores"
                className="h-[430px] w-full object-cover sm:h-[500px] lg:h-[548px]"
                loading="eager"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/10 to-ink/15" />

              <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-3 p-4 sm:p-5">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-ink/25 px-3 py-1.5 text-[9.5px] font-bold uppercase tracking-[0.16em] text-cream backdrop-blur-md">
                  <Sparkles className="h-3 w-3 text-lime" />
                  Disponible ahora
                </span>
                <span className="rounded-full border border-white/20 bg-ink/25 px-3 py-1.5 text-[10px] font-semibold text-cream/90 backdrop-blur-md">
                  {featuredCar.year} · {formatKm(featuredCar.km)}
                </span>
              </div>

              <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5">
                <div className="flex items-end justify-between gap-3 rounded-[1.2rem] border border-white/40 bg-cream/95 p-4 shadow-2xl backdrop-blur-xl sm:p-5">
                  <div className="min-w-0">
                    <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-moss">
                      Destacado de la semana
                    </p>
                    <p className="mt-2 truncate text-[19px] font-extrabold leading-tight tracking-[-0.02em] text-ink sm:text-[21px]">
                      {featuredCar.brand} {featuredCar.model}
                    </p>
                    <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[10.5px] font-medium text-muted">
                      <span>{featuredCar.acceleration} 0–100</span>
                      <span className="h-0.5 w-0.5 rounded-full bg-muted/60" />
                      <span>{featuredCar.power} hp</span>
                      <span className="h-0.5 w-0.5 rounded-full bg-muted/60" />
                      <span>{featuredCar.drive}</span>
                    </p>
                    <p className="mt-2.5 text-[13px] font-extrabold text-ink">
                      {formatUSD(featuredCar.price)}{" "}
                      <span className="font-medium text-muted">
                        · desde {formatUSD(monthlyPayment(featuredCar.price))}/mes
                      </span>
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onViewCar(featuredCar)}
                    aria-label="Ver el vehículo destacado"
                    className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-lime text-ink transition duration-300 hover:rotate-45 hover:bg-ink hover:text-lime"
                  >
                    <ArrowUpRight className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>

            <div className="floaty absolute -right-3 -top-5 hidden h-[104px] w-[104px] items-center justify-center rounded-full border border-ink/10 bg-lime text-center shadow-[0_14px_30px_-14px_rgba(20,36,30,0.5)] sm:flex lg:-right-5">
              <div>
                <span className="block text-[8.5px] font-extrabold uppercase leading-[1.35] tracking-[0.12em] text-ink/60">
                  Test drive
                </span>
                <span className="my-1 flex justify-center text-ink">
                  <Sparkles className="h-4 w-4" />
                </span>
                <span className="block text-[9.5px] font-extrabold uppercase tracking-[0.1em] text-ink">
                  Sin cargo
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 grid grid-cols-2 gap-y-6 border-t border-line pt-7 sm:grid-cols-4 sm:gap-0">
          {stats.map((stat, index) => (
            <div
              key={stat.label}
              className={
                index === 0
                  ? "sm:pr-6"
                  : "border-line/80 sm:border-l sm:px-6 sm:last:pr-0"
              }
            >
              <p className="text-[25px] font-extrabold leading-none tracking-[-0.04em] text-ink sm:text-[27px]">
                {stat.value}
              </p>
              <p className="mt-2 text-[10.5px] font-medium tracking-wide text-muted">{stat.label}</p>
            </div>
          ))}
        </div>

        <div className="mt-9 flex flex-col gap-3 border-t border-line/70 pt-6 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
          <p className="shrink-0 text-[9px] font-bold uppercase tracking-[0.24em] text-muted/80">
            Marcas que representamos
          </p>
          <div className="flex min-w-0 flex-wrap items-center gap-x-5 gap-y-2 sm:justify-end sm:gap-x-7">
            {brands.map((brand) => (
              <span
                key={brand}
                className="text-[11px] font-extrabold uppercase tracking-[0.13em] text-ink/35 transition hover:text-ink/60"
              >
                {brand}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
