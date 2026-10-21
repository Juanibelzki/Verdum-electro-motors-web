import { useState } from "react";
import { images } from "../data/cars";
import { cn } from "../utils/cn";
import {
  ArrowUpRight,
  Clock,
  Mail,
  MapPin,
  Phone,
  Plus,
  Whatsapp,
} from "./Icons";
import { Eyebrow, Reveal } from "./ui";

const details = [
  {
    icon: MapPin,
    label: "Showroom Palermo",
    value: "Av. del Libertador 4200, CABA",
  },
  {
    icon: Clock,
    label: "Horarios",
    value: "Lun a Vie 9:00–20:00 · Sáb 9:00–14:00",
  },
  {
    icon: Phone,
    label: "Ventas y asesoramiento",
    value: "+54 11 5555 0198",
  },
  {
    icon: Mail,
    label: "Escribinos",
    value: "hola@veltamotors.com",
  },
];

export default function Showroom({ onSchedule }: { onSchedule: () => void }) {
  return (
    <section id="showroom" className="scroll-mt-24 bg-cream py-20 sm:py-24 lg:py-28">
      <div className="mx-auto max-w-[1440px] px-5 sm:px-8 lg:px-10">
        <div className="grid items-center gap-14 lg:grid-cols-[1.04fr_0.96fr] lg:gap-16">
          <Reveal>
            <div className="relative mb-8">
              <div className="relative overflow-hidden rounded-[1.75rem] border border-line">
                <img
                  src={images.lounge}
                  alt="Showroom luminoso de VELTA Motors con vehículos en exhibición"
                  className="h-[380px] w-full object-cover sm:h-[460px] lg:h-[520px]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-ink/55 via-transparent to-transparent" />
                <span className="absolute left-4 top-4 inline-flex items-center gap-2 rounded-full border border-white/30 bg-cream/95 px-3 py-1.5 text-[9.5px] font-bold uppercase tracking-[0.14em] text-ink backdrop-blur">
                  <span className="pulse-dot h-1.5 w-1.5 rounded-full bg-moss" />
                  Abierto ahora
                </span>
                <div className="absolute inset-x-4 bottom-4 flex flex-wrap items-end justify-between gap-3 rounded-2xl border border-white/20 bg-ink/45 p-4 backdrop-blur-md sm:inset-x-5 sm:bottom-5">
                  <div>
                    <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-cream/50">
                      Visitanos
                    </p>
                    <p className="mt-1 text-[14px] font-extrabold leading-tight text-cream">
                      Av. del Libertador 4200
                    </p>
                    <p className="mt-0.5 text-[10px] text-cream/60">Palermo · Buenos Aires</p>
                  </div>
                  <a
                    href="https://maps.google.com/?q=Av.+del+Libertador+4200,+Buenos+Aires"
                    target="_blank"
                    rel="noreferrer"
                    className="grid h-10 w-10 place-items-center rounded-full bg-lime text-ink transition hover:rotate-45 hover:bg-cream"
                    aria-label="Ver ubicación en Google Maps"
                  >
                    <ArrowUpRight className="h-4 w-4" />
                  </a>
                </div>
              </div>

              <div className="absolute -bottom-9 right-4 hidden w-40 overflow-hidden rounded-2xl border-[5px] border-cream shadow-xl sm:block lg:w-48">
                <img
                  src={images.interior}
                  alt="Interior premium de uno de los vehículos disponibles"
                  className="aspect-[5/4] w-full object-cover"
                />
              </div>
            </div>
          </Reveal>

          <div>
            <Reveal>
              <Eyebrow>06 — Showroom</Eyebrow>
              <h2 className="mt-4 text-[clamp(2.1rem,4.4vw,3.5rem)] font-extrabold leading-[1.02] tracking-[-0.05em] text-ink">
                Vení a conocerlo
                <br className="hidden sm:block" /> en{" "}
                <span className="font-serif font-normal italic tracking-[-0.01em] text-forest">
                  persona.
                </span>
              </h2>
              <p className="mt-4 max-w-md text-[13.5px] leading-relaxed text-muted">
                Sin turnos obligatorios, sin vendedores que te persiguen. Un espacio para ver,
                probar y preguntar todo lo que quieras. Café de especialidad incluido.
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
                  href="https://maps.google.com/?q=Av.+del+Libertador+4200,+Buenos+Aires"
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
                Estacionamiento gratuito para clientes VELTA.
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
      "Sí. Los vehículos nuevos cuentan con la garantía oficial de fábrica y los seminuevos incluyen 12 meses de garantía VELTA sobre mecánica y caja, además de una inspección certificada de 120 puntos.",
  },
  {
    question: "¿Puedo entregar mi auto en parte de pago?",
    answer:
      "Claro. Tasamos tu vehículo sin costo en menos de 24 horas y lo tomamos como parte de pago del auto que elijas. Nosotros gestionamos la transferencia y toda la documentación.",
  },
  {
    question: "¿Cómo funciona la financiación?",
    answer:
      "Podés simular tu cuota en la sección de financiación con diferentes anticipos y plazos. La aprobación se realiza en 24 horas hábiles y trabajamos con bancos y entidades partner. La tasa es fija durante todo el plan.",
  },
  {
    question: "¿Hacen entregas en todo el país?",
    answer:
      "Sí. Coordinamos entregas en CABA y GBA sin cargo, y enviamos al interior con transporte especializado. El auto viaja asegurado y con todos los papeles listos para patentar.",
  },
  {
    question: "¿Qué necesito para comprar?",
    answer:
      "Para iniciar la operación solo necesitás tu DNI y comprobantes de ingresos si vas a financiar. El resto —verificación, transferencia, patentamiento y seguro— lo gestionamos nosotros con tu asesor de cuenta.",
  },
  {
    question: "¿Puedo probar el auto antes de comprar?",
    answer:
      "Sí, y te lo recomendamos. Agendá un test drive online o pasá por el showroom en el horario que prefieras. No hay compromiso de compra: queremos que elijas seguro de lo que estás manejando.",
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
                  href="https://wa.me/541155550198?text=Hola%20VELTA%2C%20tengo%20una%20consulta%20sobre%20un%20auto"
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
                  O agendar una llamada
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
