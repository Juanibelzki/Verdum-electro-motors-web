import { useEffect, useRef, useState } from "react";
import {
  formatKm,
  formatPrice,
  heroPoster,
  heroVideos,
  type Car,
} from "../data/cars";
import { ArrowUpRight, Calendar, MapPin } from "./Icons";

export default function Hero({
  featuredCar,
  onSchedule,
  onViewCar,
}: {
  featuredCar: Car | null;
  onSchedule: () => void;
  onViewCar: (car: Car) => void;
}) {
  const [videoIndex, setVideoIndex] = useState(0);
  const [reduceMotion, setReduceMotion] = useState(false);
  const videoRefs = useRef<Array<HTMLVideoElement | null>>([]);
  const featuredModel = featuredCar ? featuredCar.model.split(" ").slice(0, 2).join(" ") : "";

  const avatars = [
    { initials: "CM", tone: "bg-forest text-cream" },
    { initials: "DR", tone: "bg-sand text-ink" },
    { initials: "LP", tone: "bg-moss text-cream" },
  ];

  const stats = [
    { value: "30 años", label: "De trayectoria" },
    { value: "1994", label: "Año de fundación" },
    { value: "0KM", label: "y usados garantizados" },
    { value: "A medida", label: "Financiación propia" },
  ];

  const brands = [
    "Volkswagen",
    "Nissan",
    "Chevrolet",
    "Toyota",
    "Ford",
    "Peugeot",
    "Honda",
    "Renault",
    "Fiat",
  ];

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduceMotion(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (reduceMotion) return;
    const id = window.setInterval(() => {
      setVideoIndex((current) => (current + 1) % heroVideos.length);
    }, 8000);
    return () => window.clearInterval(id);
  }, [reduceMotion]);

  useEffect(() => {
    if (reduceMotion) return;
    videoRefs.current.forEach((video, index) => {
      if (!video) return;
      if (index === videoIndex) {
        video.currentTime = 0;
        void video.play().catch(() => undefined);
      } else {
        video.pause();
      }
    });
  }, [videoIndex, reduceMotion]);

  return (
    <section id="top" className="relative overflow-hidden bg-cream">
      <div className="pointer-events-none absolute inset-0 hidden lg:block">
        <div className="mx-auto grid h-full max-w-[1440px] grid-cols-4 px-10">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="border-l border-ink/[0.055] last:border-r" />
          ))}
        </div>
      </div>

      <div className="relative mx-auto max-w-[1440px] px-4 pb-10 pt-5 sm:px-8 sm:pt-8 lg:px-10 lg:pb-14 lg:pt-10">
        <div className="relative isolate flex min-h-[560px] flex-col overflow-hidden rounded-[1.75rem] border border-ink/10 bg-forest shadow-[0_45px_100px_-50px_rgba(20,36,30,0.75)] sm:min-h-[640px] sm:rounded-[2.25rem] lg:min-h-[760px] lg:rounded-[2.5rem]">
          {/* Media layer */}
          <div className="absolute inset-0" aria-hidden="true">
            <img
              src={heroPoster}
              alt=""
              className="absolute inset-0 h-full w-full object-cover"
            />
            {!reduceMotion &&
              heroVideos.map((src, index) => (
                <video
                  key={src}
                  ref={(element) => {
                    videoRefs.current[index] = element;
                  }}
                  src={src}
                  poster={heroPoster}
                  muted
                  loop
                  playsInline
                  preload={index === videoIndex ? "auto" : "metadata"}
                  className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-[1400ms] ease-out ${
                    index === videoIndex ? "opacity-100" : "opacity-0"
                  }`}
                />
              ))}
          </div>

          {/* Overlay requested in the original template */}
          <div className="absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/10 to-ink/15" />
          {/* Soft scrim behind the copy so it stays legible over bright frames */}
          <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(20,36,30,0.78)_0%,rgba(20,36,30,0.34)_45%,transparent_78%)] lg:bg-[radial-gradient(130%_115%_at_12%_92%,rgba(20,36,30,0.85)_0%,rgba(20,36,30,0.42)_38%,transparent_72%)]" />

          {/* Content */}
          <div className="relative z-10 flex flex-1 flex-col justify-between gap-12 p-5 sm:p-8 lg:p-12">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <p className="inline-flex items-center gap-2.5 rounded-full border border-cream/20 bg-ink/25 px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-cream backdrop-blur-md">
                <span className="pulse-dot h-1.5 w-1.5 rounded-full bg-lime" />
                Concesionaria · Corrientes
              </p>
              <a
                href="https://maps.google.com/?q=Av.+Chacabuco+1725,+Corrientes,+Argentina"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-full border border-cream/20 bg-ink/25 px-3.5 py-1.5 text-[10px] font-semibold text-cream/85 backdrop-blur-md transition hover:border-lime/60 hover:text-cream"
              >
                <MapPin className="h-3 w-3 text-lime" />
                Av. Chacabuco 1725
              </a>
            </div>

            <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_270px] lg:items-end lg:gap-10">
              <div className="max-w-[800px]">
                <h1 className="text-[clamp(2.1rem,8.5vw,3.6rem)] font-extrabold leading-[0.94] tracking-[-0.055em] text-cream [text-shadow:0_2px_10px_rgba(0,0,0,0.55),0_14px_50px_rgba(0,0,0,0.6)] sm:text-[clamp(2.8rem,6.4vw,4.4rem)] lg:text-[clamp(3.3rem,5.1vw,5rem)]">
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

                <p className="mt-6 max-w-[470px] text-[14.5px] leading-relaxed text-cream/80 [text-shadow:0_1px_10px_rgba(0,0,0,0.7)] sm:text-[15px]">
                  Autos 0KM y usados garantizados, con financiación propia y entrega inmediata
                  en Corrientes. Sin vueltas, sin letra chica.
                </p>

                <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
                  <a
                    href="#vehiculos"
                    className="inline-flex items-center justify-center gap-2.5 rounded-full bg-lime px-6 py-4 text-[13px] font-semibold text-ink transition duration-300 hover:bg-cream hover:shadow-[0_18px_35px_-18px_rgba(0,0,0,0.65)]"
                  >
                    Explorar vehículos
                    <ArrowUpRight className="h-4 w-4" />
                  </a>
                  <button
                    type="button"
                    onClick={onSchedule}
                    className="group inline-flex items-center justify-center gap-3 rounded-full border border-cream/25 bg-cream/10 py-2 pl-2 pr-5 text-[13px] font-semibold text-cream backdrop-blur-md transition duration-300 hover:border-cream/45 hover:bg-cream/20"
                  >
                    <span className="grid h-9 w-9 place-items-center rounded-full bg-cream text-ink shadow-sm transition duration-300 group-hover:bg-lime">
                      <Calendar className="h-4 w-4" />
                    </span>
                    Agendar test drive
                  </button>
                </div>
              </div>

              {featuredCar ? (
                <button
                  type="button"
                  onClick={() => onViewCar(featuredCar)}
                  title={featuredCar.title}
                  className="group hidden w-[270px] shrink-0 rounded-[1.2rem] border border-white/30 bg-cream/95 p-4 text-left shadow-2xl backdrop-blur-xl transition hover:bg-cream lg:block"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-moss">
                        {featuredCar.condition === "0KM" ? "0KM destacado" : "Destacado"}
                      </p>
                      <p className="mt-2 truncate text-[18px] font-extrabold leading-tight tracking-[-0.02em] text-ink">
                        {featuredCar.brand} {featuredModel}
                      </p>
                    </div>
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-lime text-ink transition duration-300 group-hover:rotate-45 group-hover:bg-ink group-hover:text-lime">
                      <ArrowUpRight className="h-4 w-4" />
                    </span>
                  </div>
                  <p className="mt-2 text-[10.5px] font-medium text-muted">
                    {[
                      featuredCar.year ? String(featuredCar.year) : null,
                      formatKm(featuredCar.km),
                      featuredCar.transmission !== "Consultar" ? featuredCar.transmission : null,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                  <p className="mt-2.5 text-[13px] font-extrabold text-ink">
                    {formatPrice(featuredCar.price)}
                    <span className="font-medium text-muted"> · {featuredCar.condition}</span>
                  </p>
                </button>
              ) : (
                <a
                  href="#vehiculos"
                  className="group hidden w-[270px] shrink-0 rounded-[1.2rem] border border-white/30 bg-cream/95 p-4 text-left shadow-2xl backdrop-blur-xl transition hover:bg-cream lg:block"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-moss">
                        Stock en vivo
                      </p>
                      <p className="mt-2 text-[18px] font-extrabold leading-tight tracking-[-0.02em] text-ink">
                        Ver vehículos disponibles
                      </p>
                    </div>
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-lime text-ink transition duration-300 group-hover:rotate-45 group-hover:bg-ink group-hover:text-lime">
                      <ArrowUpRight className="h-4 w-4" />
                    </span>
                  </div>
                  <p className="mt-2 text-[10.5px] font-medium text-muted">
                    0KM y usados con fotos y datos reales.
                  </p>
                </a>
              )}
            </div>

            <div className="flex flex-wrap items-end justify-between gap-5 border-t border-cream/15 pt-5">
              <div className="flex flex-wrap items-center gap-x-6 gap-y-4">
                <div className="flex items-center gap-3">
                  <div className="flex -space-x-2.5">
                    {avatars.map((avatar) => (
                      <span
                        key={avatar.initials}
                        className={`grid h-8 w-8 place-items-center rounded-full text-[9px] font-extrabold ring-2 ring-ink/50 ${avatar.tone}`}
                      >
                        {avatar.initials}
                      </span>
                    ))}
                  </div>
                  <div>
                    <p className="text-[11px] font-bold text-cream">Familia Verdun</p>
                    <p className="mt-0.5 text-[10.5px] text-cream/55">Atención personalizada</p>
                  </div>
                </div>
                <div className="hidden h-8 w-px bg-cream/15 sm:block" aria-hidden="true" />
                <div>
                  <p className="text-[11px] font-bold text-cream">Garantía en usados</p>
                  <p className="mt-0.5 text-[10.5px] text-cream/55">Incluida</p>
                </div>
              </div>

              {!reduceMotion && (
                <div className="flex items-center gap-2" role="group" aria-label="Videos del hero">
                  {heroVideos.map((src, index) => (
                    <button
                      key={src}
                      type="button"
                      onClick={() => setVideoIndex(index)}
                      aria-label={`Ver video ${index + 1}`}
                      aria-pressed={index === videoIndex}
                      className={`h-1.5 rounded-full transition-all duration-300 ${
                        index === videoIndex
                          ? "w-8 bg-lime"
                          : "w-4 bg-cream/30 hover:bg-cream/60"
                      }`}
                    />
                  ))}
                  <span className="ml-1 text-[9px] font-bold uppercase tracking-[0.2em] text-cream/40">
                    {String(videoIndex + 1).padStart(2, "0")} /{" "}
                    {String(heroVideos.length).padStart(2, "0")}
                  </span>
                </div>
              )}
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

        <div className="mt-9 flex flex-col gap-4 border-t border-line/70 pt-6 sm:flex-row sm:items-center sm:gap-6">
          <p className="shrink-0 text-[9px] font-bold uppercase tracking-[0.24em] text-muted/80">
            Marcas que representamos
          </p>
          <div className="relative min-w-0 flex-1 overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)] [-webkit-mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]">
            <div className="marquee-track items-center">
              {[...brands, ...brands].map((brand, index) => (
                <span
                  key={`${brand}-${index}`}
                  aria-hidden={index >= brands.length}
                  className="mr-10 inline-flex items-center gap-3 text-[11px] font-extrabold uppercase tracking-[0.13em] text-ink/45 transition hover:text-ink/75"
                >
                  {brand}
                  <span className="h-1 w-1 rounded-full bg-ink/25" aria-hidden="true" />
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
