import { useState, type FormEvent } from "react";
import {
  ArrowUpRight,
  Check,
  Clock,
  Instagram,
  Mail,
  MapPin,
  Phone,
  Whatsapp,
} from "./Icons";
import { Eyebrow, Logo } from "./ui";

const exploreLinks = [
  { label: "Vehículos", href: "#vehiculos" },
  { label: "Financiación", href: "#financiacion" },
  { label: "Vender mi auto", href: "#vender" },
  { label: "Agendar test drive", href: "#showroom" },
];

const companyLinks = [
  { label: "Nosotros", href: "#nosotros" },
  { label: "Showroom", href: "#showroom" },
  { label: "Preguntas frecuentes", href: "#faq" },
  { label: "Trabajá con nosotros", href: "#faq" },
];

const socials = [
  {
    label: "Instagram",
    href: "https://www.instagram.com/verdun_automotores",
    icon: Instagram,
  },
  { label: "WhatsApp", href: "https://wa.me/5493795300020", icon: Whatsapp },
];

export default function Footer({ onSchedule }: { onSchedule: () => void }) {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const subscribe = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!email.includes("@")) return;
    setSubscribed(true);
  };

  return (
    <footer className="bg-ink text-cream">
      <div className="mx-auto max-w-[1440px] px-5 sm:px-8 lg:px-10">
        <div className="relative overflow-hidden border-b border-cream/12 py-16 lg:py-20">
          <div
            className="pointer-events-none absolute -right-24 -top-32 h-[360px] w-[360px] rounded-full border border-lime/15"
            aria-hidden="true"
          />
          <div
            className="pointer-events-none absolute -right-4 -top-20 h-[220px] w-[220px] rounded-full border border-lime/10"
            aria-hidden="true"
          />
          <div className="relative grid items-end gap-9 lg:grid-cols-[1.25fr_0.75fr]">
            <div>
              <Eyebrow light>El próximo paso</Eyebrow>
              <h2 className="mt-4 max-w-2xl text-[clamp(2.4rem,5.2vw,4.3rem)] font-extrabold leading-[0.98] tracking-[-0.055em] text-cream">
                Tu próximo auto está a un{" "}
                <span className="font-serif font-normal italic tracking-[-0.01em] text-lime">
                  paso.
                </span>
              </h2>
              <p className="mt-4 max-w-md text-[13px] leading-relaxed text-cream/50">
                Agendá una visita, probá el auto que te gusta y tomá la decisión sin apuro. Nosotros
                nos ocupamos de todo lo demás.
              </p>
            </div>
            <div className="flex flex-col gap-2.5 sm:flex-row lg:flex-col lg:items-stretch">
              <button
                type="button"
                onClick={onSchedule}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-lime px-6 py-4 text-[12.5px] font-bold text-ink transition hover:bg-lime-soft"
              >
                Agendar mi test drive
                <ArrowUpRight className="h-4 w-4" />
              </button>
              <a
                href="tel:+5493795300020"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-cream/20 px-6 py-4 text-[12.5px] font-semibold text-cream transition hover:border-lime hover:text-lime"
              >
                <Phone className="h-3.5 w-3.5" />
                +54 9 3795-300020
              </a>
            </div>
          </div>
        </div>

        <div className="grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-[1.3fr_0.65fr_0.65fr_1.1fr] lg:gap-12">
          <div>
            <Logo light />
            <p className="mt-4 max-w-[250px] text-[11.5px] leading-relaxed text-cream/45">
              Autos 0KM, usados garantizados y motos eléctricas. Desde 1994, en Corrientes.
            </p>
            <div className="mt-5 space-y-2 text-[10.5px] text-cream/55">
              <p className="flex items-start gap-2">
                <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-lime/70" />
                Av. Chacabuco 1725, Corrientes, Argentina
              </p>
              <p className="flex items-center gap-2">
                <Clock className="h-3.5 w-3.5 shrink-0 text-lime/70" />
                Lun a Sáb · 9–20 h
              </p>
              <a href="mailto:info@verdun.com.ar" className="flex items-center gap-2 transition hover:text-cream">
                <Mail className="h-3.5 w-3.5 shrink-0 text-lime/70" />
                info@verdun.com.ar
              </a>
            </div>
            <div className="mt-5 flex gap-2">
              {socials.map((social) => {
                const Icon = social.icon;
                return (
                  <a
                    key={social.label}
                    href={social.href}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={social.label}
                    className="grid h-9 w-9 place-items-center rounded-full border border-cream/15 text-cream/65 transition hover:border-lime hover:bg-lime hover:text-ink"
                  >
                    <Icon className="h-3.5 w-3.5" />
                  </a>
                );
              })}
            </div>
          </div>

          <div>
            <p className="text-[9.5px] font-bold uppercase tracking-[0.2em] text-lime/70">Explorar</p>
            <ul className="mt-4 space-y-2.5">
              {exploreLinks.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-[11.5px] font-medium text-cream/60 transition hover:text-cream"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-[9.5px] font-bold uppercase tracking-[0.2em] text-lime/70">Compañía</p>
            <ul className="mt-4 space-y-2.5">
              {companyLinks.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-[11.5px] font-medium text-cream/60 transition hover:text-cream"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-[9.5px] font-bold uppercase tracking-[0.2em] text-lime/70">Newsletter</p>
            <p className="mt-4 text-[15px] font-bold tracking-[-0.01em] text-cream">
              Nuevos ingresos, primero.
            </p>
            <p className="mt-1.5 text-[10.5px] leading-relaxed text-cream/45">
              Una vez por semana. Autos recién llegados, sin spam.
            </p>

            {subscribed ? (
              <div
                role="status"
                className="mt-4 flex items-center gap-2.5 rounded-2xl border border-lime/25 bg-lime/10 px-4 py-3.5 text-[11px] font-medium text-lime"
              >
                <Check className="h-4 w-4 shrink-0" />
                ¡Listo! Te vamos a escribir.
              </div>
            ) : (
              <form
                onSubmit={subscribe}
                className="mt-4 flex items-center gap-1 rounded-full border border-cream/20 bg-cream/[0.06] p-1 transition focus-within:border-lime/60"
              >
                <label htmlFor="newsletter-email" className="sr-only">
                  Tu email
                </label>
                <input
                  id="newsletter-email"
                  type="email"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="Tu email"
                  className="min-w-0 flex-1 bg-transparent px-3 py-2 text-[11.5px] text-cream placeholder:text-cream/35 focus:outline-none"
                />
                <button
                  type="submit"
                  aria-label="Suscribirme al newsletter"
                  className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-lime text-ink transition hover:bg-lime-soft"
                >
                  <ArrowUpRight className="h-4 w-4" />
                </button>
              </form>
            )}
            <p className="mt-2.5 text-[9px] leading-relaxed text-cream/30">
              Al suscribirte aceptás nuestra política de privacidad. Podés darte de baja cuando
              quieras.
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-4 border-t border-cream/12 py-6 text-[10px] text-cream/40 sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 Verdun Automotores. Todos los derechos reservados.</p>
          <div className="flex flex-wrap gap-x-5 gap-y-2">
            <a href="#faq" className="transition hover:text-cream">
              Términos y condiciones
            </a>
            <a href="#faq" className="transition hover:text-cream">
              Privacidad
            </a>
            <a href="#faq" className="transition hover:text-cream">
              Defensa del consumidor
            </a>
          </div>
        </div>

        <p className="max-w-3xl pb-7 text-[9px] leading-relaxed text-cream/25">
          Los precios están expresados en dólares estadounidenses e incluyen IVA. Las imágenes son
          ilustrativas y pueden no coincidir con la unidad publicada. Las simulaciones de
          financiación son orientativas y no constituyen una oferta crediticia. Sujeto a aprobación
          de la entidad financiera. Verdun Automotores.
        </p>
      </div>
    </footer>
  );
}
