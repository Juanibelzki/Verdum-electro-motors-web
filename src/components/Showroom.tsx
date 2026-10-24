import { useCallback, useEffect, useState, type SyntheticEvent } from "react";
import type { ShowroomStory } from "../data/showroomStories";
import { cn } from "../utils/cn";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Clock,
  Mail,
  MapPin,
  Phone,
  Plus,
  ShieldCheck,
  Volume2,
  VolumeX,
  Whatsapp,
} from "./Icons";
import { Eyebrow, Reveal } from "./ui";

const details = [
  {
    icon: MapPin,
    label: "Verdun Automotores",
    value: "Av. Chacabuco 1725, Corrientes",
  },
  {
    icon: Clock,
    label: "Horarios",
    value: "Lun a Sáb · 9:00–20:00",
  },
  {
    icon: Phone,
    label: "Ventas y asesoramiento",
    value: "+54 9 3795-300020",
  },
  {
    icon: Mail,
    label: "Escribinos",
    value: "info@verdun.com.ar",
  },
];

export default function Showroom({
  stories,
  onSchedule,
}: {
  stories: ShowroomStory[];
  onSchedule: () => void;
}) {
  const [storyIndex, setStoryIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [muted, setMuted] = useState(true);
  const count = stories.length;
  const activeStory = stories[storyIndex] ?? stories[0];

  const goNext = useCallback(() => {
    if (!count) return;
    setStoryIndex((current) => (current + 1) % count);
    setProgress(0);
  }, [count]);

  const goPrev = useCallback(() => {
    if (!count) return;
    setStoryIndex((current) => (current - 1 + count) % count);
    setProgress(0);
  }, [count]);

  useEffect(() => {
    setStoryIndex(0);
    setProgress(0);
  }, [count]);

  useEffect(() => {
    if (!count || !activeStory) return;

    setProgress(0);

    if (activeStory.type === "video") {
      const id = window.setTimeout(() => {
        if (count === 1) {
          setProgress(1);
          return;
        }
        setStoryIndex((current) => (current + 1) % count);
        setProgress(0);
      }, 20000);

      return () => window.clearTimeout(id);
    }

    const started = performance.now();
    const id = window.setInterval(() => {
      const nextProgress = Math.min((performance.now() - started) / 7000, 1);
      setProgress(nextProgress);

      if (nextProgress >= 1) {
        window.clearInterval(id);
        if (count === 1) {
          setProgress(1);
          return;
        }
        setStoryIndex((current) => (current + 1) % count);
        setProgress(0);
      }
    }, 80);

    return () => window.clearInterval(id);
  }, [activeStory, count]);

  const handleTimeUpdate = (event: SyntheticEvent<HTMLVideoElement>) => {
    const video = event.currentTarget;
    if (Number.isFinite(video.duration) && video.duration > 0) {
      setProgress(Math.min(video.currentTime / video.duration, 1));
    }
  };

  return (
    <section id="showroom" className="scroll-mt-24 bg-cream py-20 sm:py-24 lg:py-28">
      <div className="mx-auto max-w-[1440px] px-5 sm:px-8 lg:px-10">
        <div className="grid items-center gap-14 lg:grid-cols-[1.04fr_0.96fr] lg:gap-16">
          <Reveal>
            <div className="relative mx-auto w-full max-w-[420px]">
              <div className="group/story relative aspect-[9/16] w-full overflow-hidden rounded-[1.75rem] border border-line bg-sand shadow-[0_30px_70px_-45px_rgba(20,36,30,0.65)]">
                {activeStory ? (
                  activeStory.type === "image" ? (
                    <img
                      key={activeStory.id}
                      src={activeStory.src}
                      alt="Historia del showroom de Verdun Automotores"
                      className="absolute inset-0 h-full w-full object-cover"
                    />
                  ) : (
                    <video
                      key={activeStory.id}
                      src={activeStory.src}
                      poster={activeStory.poster}
                      autoPlay
                      muted={muted}
                      playsInline
                      loop={count === 1}
                      onTimeUpdate={handleTimeUpdate}
                      onEnded={goNext}
                      className="absolute inset-0 h-full w-full object-cover"
                    />
                  )
                ) : (
                  <div className="absolute inset-0 bg-forest" />
                )}

                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink/90 via-ink/15 to-transparent" />
                <div className="pointer-events-none absolute inset-x-0 top-0 h-36 bg-gradient-to-b from-ink/70 to-transparent" />

                <div className="pointer-events-none absolute inset-x-4 top-3 z-20 flex gap-1">
                  {stories.map((story, index) => (
                    <span
                      key={story.id}
                      className="h-[3px] flex-1 overflow-hidden rounded-full bg-cream/25"
                    >
                      <span
                        className="block h-full rounded-full bg-cream transition-[width] duration-100 ease-linear"
                        style={{
                          width:
                            index < storyIndex
                              ? "100%"
                              : index === storyIndex
                                ? `${Math.round(progress * 100)}%`
                                : "0%",
                        }}
                      />
                    </span>
                  ))}
                </div>

                <div className="pointer-events-none absolute inset-x-4 top-6 z-20 flex items-center gap-2.5">
                  <span className="grid h-8 w-8 shrink-0 place-items-center overflow-hidden rounded-full bg-cream ring-1 ring-white/30">
                    <img
                      src="/logo-verdun.png"
                      alt=""
                      className="h-8 w-8 scale-110 object-contain"
                    />
                  </span>
                  <div className="min-w-0">
                    <p className="text-[10.5px] font-bold text-cream [text-shadow:0_1px_10px_rgba(0,0,0,0.65)]">
                      Verdun Automotores
                    </p>
                    <p className="mt-0.5 text-[9px] text-cream/65">
                      Showroom · Corrientes
                    </p>
                  </div>
                  {activeStory?.type === "video" ? (
                    <button
                      type="button"
                      onClick={() => setMuted((current) => !current)}
                      aria-label={muted ? "Activar sonido del reel" : "Silenciar reel"}
                      title={muted ? "Activar sonido" : "Silenciar"}
                      className="pointer-events-auto ml-auto grid h-7 w-7 place-items-center rounded-full border border-white/20 bg-ink/25 text-cream backdrop-blur-md transition hover:bg-ink/45"
                    >
                      {muted ? (
                        <VolumeX className="h-3.5 w-3.5" />
                      ) : (
                        <Volume2 className="h-3.5 w-3.5" />
                      )}
                    </button>
                  ) : (
                    <span className="ml-auto rounded-full border border-white/20 bg-ink/20 px-2.5 py-1 text-[8.5px] font-semibold uppercase tracking-[0.14em] text-cream/70 backdrop-blur-md">
                      Ahora
                    </span>
                  )}
                </div>

                <span className="pointer-events-none absolute left-4 top-[4.8rem] z-20 inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-ink/25 px-3 py-1.5 text-[9px] font-bold uppercase tracking-[0.14em] text-cream backdrop-blur-md">
                  <MapPin className="h-3 w-3 text-lime" />
                  Av. Chacabuco 1725
                </span>

                <button
                  type="button"
                  onClick={goPrev}
                  aria-label="Historia anterior"
                  className="absolute inset-y-0 left-0 z-10 flex w-1/3 cursor-w-resize items-center"
                >
                  <span className="ml-3 hidden h-9 w-9 place-items-center rounded-full border border-white/20 bg-ink/30 text-cream opacity-0 backdrop-blur-md transition group-hover/story:opacity-100 sm:grid">
                    <ArrowLeft className="h-4 w-4" />
                  </span>
                </button>
                <button
                  type="button"
                  onClick={goNext}
                  aria-label="Siguiente historia"
                  className="absolute inset-y-0 right-0 z-10 flex w-1/3 cursor-e-resize items-center justify-end"
                >
                  <span className="mr-3 hidden h-9 w-9 place-items-center rounded-full border border-white/20 bg-ink/30 text-cream opacity-0 backdrop-blur-md transition group-hover/story:opacity-100 sm:grid">
                    <ArrowRight className="h-4 w-4" />
                  </span>
                </button>

                <div className="pointer-events-none absolute inset-x-3 bottom-3 z-20 rounded-2xl border border-white/15 bg-ink/45 p-4 backdrop-blur-md sm:p-5">
                  <p className="font-serif text-[20px] italic leading-[1.15] tracking-[-0.01em] text-cream sm:text-[23px]">
                    “No vendemos autos. Acompañamos decisiones.”
                  </p>
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-white/15 pt-3">
                    <div>
                      <p className="text-[10.5px] font-semibold text-cream">
                        Familia Verdun
                      </p>
                      <p className="mt-0.5 text-[8.5px] uppercase tracking-[0.14em] text-cream/50">
                        Verdun Automotores
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 text-lime">
                      <span className="h-1.5 w-1.5 rounded-full bg-lime" />
                      <span className="text-[9px] font-bold">Desde 1994</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="absolute -right-2 top-20 z-30 hidden items-center gap-2 rounded-2xl border border-line/80 bg-paper px-4 py-3.5 shadow-[0_18px_40px_-20px_rgba(20,36,30,0.45)] xl:flex">
                <span className="grid h-8 w-8 place-items-center rounded-full bg-lime text-ink">
                  <ShieldCheck className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-[11px] font-extrabold leading-none text-ink">
                    Garantía
                  </p>
                  <p className="mt-0.5 text-[9px] text-muted">
                    en todos los usados
                  </p>
                </div>
              </div>

              <p className="mt-3 text-center text-[9.5px] text-muted">
                Tocá las historias para recorrer el showroom.
              </p>
            </div>
          </Reveal>

          <div>
            <Reveal>
              <Eyebrow>02 — Showroom</Eyebrow>
              <h2 className="mt-4 text-[clamp(2.1rem,4.4vw,3.5rem)] font-extrabold leading-[1.02] tracking-[-0.05em] text-ink">
                Vení a conocerlo
                <br className="hidden sm:block" /> en{" "}
                <span className="font-serif font-normal italic tracking-[-0.01em] text-forest">
                  persona.
                </span>
              </h2>
              <p className="mt-4 max-w-md text-[13.5px] leading-relaxed text-muted">
                Sin turnos obligatorios, sin vendedores que te persiguen. Un espacio para ver,
                conocer y preguntar todo lo que quieras.
              </p>
            </Reveal>

            <Reveal delay={80}>
              <div className="mt-7 divide-y divide-line/70 border-y border-line/70">
                {details.map((detail) => {
                  const Icon = detail.icon;
                  return (
                    <div key={detail.label} className="flex items-start gap-3.5 py-3.5">
                      <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full border border-ink/10 bg-paper text-forest">
                        <Icon className="h-3.5 w-3.5" />
                      </span>
                      <div>
                        <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-muted">
                          {detail.label}
                        </p>
                        <p className="mt-0.5 text-[12px] font-semibold text-ink">{detail.value}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Reveal>

            <Reveal delay={140}>
              <div className="mt-6 flex flex-col gap-2.5 sm:flex-row">
                <button
                  type="button"
                  onClick={onSchedule}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-ink px-5 py-3.5 text-[12px] font-semibold text-cream transition hover:bg-forest"
                >
                  Agendar una visita
                  <ArrowUpRight className="h-4 w-4" />
                </button>
                <a
                  href="https://maps.google.com/?q=Av.+Chacabuco+1725,+Corrientes,+Argentina"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-ink/15 px-5 py-3.5 text-[12px] font-semibold text-ink transition hover:border-ink/30"
                >
                  <MapPin className="h-3.5 w-3.5" />
                  Cómo llegar
                </a>
              </div>
              <p className="mt-3 flex items-center gap-1.5 text-[9.5px] text-muted">
                <span className="h-1 w-1 rounded-full bg-moss" />
                Te esperamos en Av. Chacabuco 1725, Corrientes.
              </p>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}

const faqs = [
  {
    question: "¿Los autos tienen garantía?",
    answer:
      "Sí. Los vehículos 0KM cuentan con la garantía oficial de fábrica y los usados incluyen garantía Verdun sobre mecánica y caja, además de una revisión mecánica previa.",
  },
  {
    question: "¿Puedo entregar mi auto en parte de pago?",
    answer:
      "Claro. Tasamos tu vehículo sin costo en menos de 24 horas y lo tomamos como parte de pago del auto que elijas. Nosotros gestionamos la transferencia y toda la documentación.",
  },
  {
    question: "¿Cómo funciona el financiamiento?",
    answer:
      "Gestionamos financiamiento por crédito prendario con banco de hasta el 50% del valor del vehículo. La aprobación y las condiciones finales dependen del banco. Si querés avanzar, te contactamos con un asesor por WhatsApp.",
  },
  {
    question: "¿Hacen entregas en todo el país?",
    answer:
      "Sí. Coordinamos entregas en Corrientes y alrededores, y enviamos al interior con transporte especializado. El auto viaja asegurado y con todos los papeles listos para patentar.",
  },
  {
    question: "¿Qué necesito para comprar?",
    answer:
      "Para iniciar la operación solo necesitás tu DNI y comprobantes de ingresos si vas a solicitar el crédito. El resto —verificación, transferencia, patentamiento y seguro— lo gestionamos nosotros con tu asesor de cuenta.",
  },
  {
    question: "¿Puedo ver el auto antes de comprar?",
    answer:
      "Sí. Agendá una visita al showroom o pasá en el horario que prefieras. No hay compromiso de compra: queremos que conozcas el auto y decidas con tranquilidad.",
  },
];

export function Faq({ onSchedule }: { onSchedule: () => void }) {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section id="faq" className="scroll-mt-24 border-t border-line/70 bg-paper py-20 sm:py-24">
      <div className="mx-auto max-w-[1440px] px-5 sm:px-8 lg:px-10">
        <div className="grid gap-10 lg:grid-cols-[0.78fr_1.22fr] lg:gap-16">
          <div className="lg:sticky lg:top-28 lg:h-fit">
            <Reveal>
              <Eyebrow>07 — Preguntas frecuentes</Eyebrow>
              <h2 className="mt-4 text-[clamp(2.05rem,4.2vw,3.3rem)] font-extrabold leading-[1.02] tracking-[-0.05em] text-ink">
                Todo lo que
                <br className="hidden sm:block" /> querés{" "}
                <span className="font-serif font-normal italic tracking-[-0.01em] text-forest">
                  saber.
                </span>
              </h2>
              <p className="mt-4 max-w-sm text-[13px] leading-relaxed text-muted">
                Si tu duda no está acá, escribinos. Respondemos de verdad, no con respuestas
                automáticas.
              </p>
            </Reveal>

            <Reveal delay={80}>
              <div className="mt-6 rounded-2xl border border-line/80 bg-cream/70 p-5">
                <div className="flex items-center gap-2.5">
                  <span className="grid h-9 w-9 place-items-center rounded-full bg-forest text-lime">
                    <Whatsapp className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="text-[12px] font-extrabold text-ink">¿Seguís con dudas?</p>
                    <p className="mt-0.5 text-[10px] text-muted">Respondemos en minutos.</p>
                  </div>
                </div>
                <a
                  href="https://wa.me/5493795300020?text=Hola%20Verdun%2C%20tengo%20una%20consulta%20sobre%20un%20auto"
                  target="_blank"
                  rel="noreferrer"
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-ink px-4 py-3 text-[11.5px] font-semibold text-cream transition hover:bg-forest"
                >
                  Hablar por WhatsApp
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </a>
                <button
                  type="button"
                  onClick={onSchedule}
                  className="mt-2 w-full rounded-full px-4 py-2 text-[10.5px] font-semibold text-muted transition hover:text-ink"
                >
                  O agendar una visita
                </button>
              </div>
            </Reveal>
          </div>

          <Reveal delay={60}>
            <div className="border-t border-line/80">
              {faqs.map((faq, index) => {
                const isOpen = open === index;
                return (
                  <div key={faq.question} className="border-b border-line/80">
                    <h3>
                      <button
                        type="button"
                        id={`faq-trigger-${index}`}
                        aria-expanded={isOpen}
                        aria-controls={`faq-panel-${index}`}
                        onClick={() => setOpen(isOpen ? null : index)}
                        className="group flex w-full items-start justify-between gap-5 py-5 text-left"
                      >
                        <span
                          className={cn(
                            "text-[13.5px] font-bold tracking-[-0.01em] transition sm:text-[14px]",
                            isOpen ? "text-ink" : "text-ink/75 group-hover:text-ink"
                          )}
                        >
                          {faq.question}
                        </span>
                        <span
                          className={cn(
                            "mt-1 grid h-6 w-6 shrink-0 place-items-center rounded-full border transition duration-300",
                            isOpen
                              ? "rotate-45 border-ink bg-ink text-lime"
                              : "border-ink/15 text-moss group-hover:border-ink/40"
                          )}
                        >
                          <Plus className="h-3 w-3" />
                        </span>
                      </button>
                    </h3>
                    <div
                      id={`faq-panel-${index}`}
                      role="region"
                      aria-labelledby={`faq-trigger-${index}`}
                      className={cn(
                        "grid transition-all duration-300 ease-out",
                        isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                      )}
                    >
                      <div className="overflow-hidden">
                        <p className="max-w-xl pb-5 pr-8 text-[12px] leading-relaxed text-muted">
                          {faq.answer}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
