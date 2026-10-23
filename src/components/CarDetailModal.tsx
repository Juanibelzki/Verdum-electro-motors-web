import { useEffect, useState } from "react";
import {
  FALLBACK_CAR_IMAGE,
  formatKm,
  formatPrice,
  whatsappLink,
  type Car,
} from "../data/cars";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  Calendar,
  CarIcon,
  Check,
  Cog,
  Fuel,
  Gauge,
  MapPin,
  ShieldCheck,
  Sparkles,
  Whatsapp,
  Zap,
} from "./Icons";
import { Modal } from "./ui";
import { cn } from "../utils/cn";

export default function CarDetailModal({
  car,
  onClose,
  onSchedule,
}: {
  car: Car;
  onClose: () => void;
  onSchedule: () => void;
}) {
  const [activePhoto, setActivePhoto] = useState(0);
  const photos = car.photos.length > 0 ? car.photos : [FALLBACK_CAR_IMAGE];
  const photo = photos[Math.min(activePhoto, photos.length - 1)] ?? FALLBACK_CAR_IMAGE;

  useEffect(() => {
    setActivePhoto(0);
  }, [car.id]);

  const specs = [
    { label: "Año", value: car.year ? String(car.year) : "Consultar", icon: Calendar },
    { label: "Kilometraje", value: formatKm(car.km), icon: Gauge },
    { label: "Transmisión", value: car.transmission, icon: Cog },
    {
      label: "Combustible",
      value: car.fuel,
      icon: car.fuel === "Eléctrico" ? Zap : Fuel,
    },
    { label: "Carrocería", value: car.body, icon: CarIcon },
    { label: "Tracción", value: car.drive, icon: ShieldCheck },
    { label: "Potencia", value: car.power ? `${car.power} CV` : "Consultar", icon: Zap },
    { label: "Color", value: car.color, icon: Sparkles },
    { label: "Categoría", value: car.category, icon: BadgeCheck },
  ];

  const financeMessage = `Hola Verdun, quiero consultar el financiamiento por crédito prendario con banco de hasta el 50% del valor del vehículo para el ${car.title}${
    car.year ? ` (${car.year})` : ""
  }.`;

  const changePhoto = (delta: number) => {
    setActivePhoto((current) => (current + delta + photos.length) % photos.length);
  };

  return (
    <Modal open onClose={onClose} label={car.title} className="sm:max-w-4xl">
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="relative h-[230px] w-full overflow-hidden bg-forest sm:h-[320px]">
          <img
            src={photo}
            alt={car.title}
            onError={(event) => {
              event.currentTarget.onerror = null;
              event.currentTarget.src = FALLBACK_CAR_IMAGE;
            }}
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/10 to-transparent" />

          {photos.length > 1 && (
            <>
              <button
                type="button"
                onClick={() => changePhoto(-1)}
                aria-label="Foto anterior"
                className="absolute left-3 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full border border-white/25 bg-ink/40 text-cream backdrop-blur-md transition hover:bg-ink/70"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => changePhoto(1)}
                aria-label="Foto siguiente"
                className="absolute right-3 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full border border-white/25 bg-ink/40 text-cream backdrop-blur-md transition hover:bg-ink/70"
              >
                <ArrowRight className="h-4 w-4" />
              </button>
              <span className="absolute right-3 top-3 rounded-full bg-ink/55 px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.12em] text-cream backdrop-blur-md">
                {activePhoto + 1} / {photos.length}
              </span>
            </>
          )}

          <div className="absolute inset-x-0 bottom-0 p-5 sm:p-7">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-lime px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-[0.14em] text-ink">
                {car.condition}
              </span>
              <span className="rounded-full border border-white/25 bg-ink/25 px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.12em] text-cream backdrop-blur">
                {car.category}
              </span>
              {car.featured && (
                <span className="rounded-full border border-lime/40 bg-lime/15 px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.12em] text-lime backdrop-blur">
                  Destacado
                </span>
              )}
            </div>
            <p className="mt-3 text-[10px] font-bold uppercase tracking-[0.22em] text-cream/60">
              {car.brand}
            </p>
            <h2 className="mt-1 text-[26px] font-extrabold leading-tight tracking-[-0.04em] text-cream sm:text-[34px]">
              {car.model}
            </h2>
            <p className="mt-0.5 text-[12px] font-medium text-cream/70">{car.version}</p>
          </div>
        </div>

        {photos.length > 1 && (
          <div className="flex gap-2 overflow-x-auto border-b border-line/60 bg-ink px-4 py-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {photos.map((thumbnail, index) => (
              <button
                key={`${thumbnail}-${index}`}
                type="button"
                onClick={() => setActivePhoto(index)}
                aria-label={`Ver foto ${index + 1}`}
                aria-pressed={index === activePhoto}
                className={cn(
                  "relative h-14 w-20 shrink-0 overflow-hidden rounded-lg border-2 transition",
                  index === activePhoto
                    ? "border-lime opacity-100"
                    : "border-transparent opacity-60 hover:opacity-100"
                )}
              >
                <img
                  src={thumbnail}
                  alt=""
                  onError={(event) => {
                    event.currentTarget.onerror = null;
                    event.currentTarget.src = FALLBACK_CAR_IMAGE;
                  }}
                  className="h-full w-full object-cover"
                />
              </button>
            ))}
          </div>
        )}

        <div className="grid gap-8 p-5 sm:grid-cols-[1.25fr_0.75fr] sm:p-7">
          <div className="order-2 sm:order-1">
            {car.tagline && !car.description.startsWith(car.tagline) && (
              <p className="text-[13px] leading-relaxed text-moss">{car.tagline}</p>
            )}

            <div className="mt-5 grid grid-cols-2 gap-2.5">
              {specs.map((spec) => {
                const Icon = spec.icon;
                return (
                  <div
                    key={spec.label}
                    className="rounded-xl border border-line/70 bg-cream/50 p-3.5"
                  >
                    <div className="flex items-center gap-1.5 text-muted">
                      <Icon className="h-3.5 w-3.5" />
                      <span className="text-[9px] font-bold uppercase tracking-[0.12em]">
                        {spec.label}
                      </span>
                    </div>
                    <p className="mt-1.5 text-[13px] font-extrabold tracking-tight text-ink">
                      {spec.value}
                    </p>
                  </div>
                );
              })}
            </div>

            {car.description && (
              <div className="mt-6">
                <p className="text-[9.5px] font-bold uppercase tracking-[0.18em] text-muted">
                  Descripción
                </p>
                <p className="mt-2 whitespace-pre-line text-[11.5px] leading-relaxed text-moss">
                  {car.description}
                </p>
              </div>
            )}

            {car.features.length > 0 && (
              <div className="mt-6">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-[9.5px] font-bold uppercase tracking-[0.18em] text-muted">
                    Equipamiento
                  </p>
                  <span className="rounded-full bg-cream px-2.5 py-1 text-[9px] font-bold text-moss">
                    {car.features.length} ítems
                  </span>
                </div>
                <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                  {car.features.map((feature) => (
                    <li
                      key={feature}
                      className="flex items-start gap-2 text-[11.5px] font-medium leading-relaxed text-moss"
                    >
                      <span className="mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full bg-lime/70 text-ink">
                        <Check className="h-2.5 w-2.5" strokeWidth={2.5} />
                      </span>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="mt-6 flex items-start gap-2.5 rounded-xl bg-cream/60 p-3.5">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-forest" />
              <p className="text-[10.5px] leading-relaxed text-moss">
                Consultá por la garantía, la revisión mecánica y la transferencia de esta unidad.
                Te respondemos con el detalle completo.
              </p>
            </div>
          </div>

          <aside className="order-1 h-fit rounded-2xl border border-line/80 bg-cream/60 p-5 sm:order-2 sm:sticky sm:top-0">
            <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-muted">Precio</p>
            <p className="mt-1 text-[27px] font-extrabold leading-none tracking-[-0.04em] text-ink">
              {formatPrice(car.price)}
            </p>
            <p className="mt-1.5 text-[10.5px] leading-relaxed text-muted">
              {car.price != null
                ? "Precio sujeto a confirmación con un asesor."
                : "Precio y disponibilidad se confirman con un asesor."}
            </p>

            <a
              href={whatsappLink(car.whatsappMsg)}
              target="_blank"
              rel="noreferrer"
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-lime px-4 py-3.5 text-[12px] font-bold text-ink transition hover:bg-lime-soft"
            >
              <Whatsapp className="h-4 w-4" />
              Consultar por WhatsApp
            </a>

            <button
              type="button"
              onClick={onSchedule}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-full border border-ink/15 px-4 py-3.5 text-[12px] font-semibold text-ink transition hover:border-ink/30 hover:bg-paper"
            >
              Agendar test drive
              <ArrowUpRight className="h-4 w-4" />
            </button>

            <a
              href={whatsappLink(financeMessage)}
              target="_blank"
              rel="noreferrer"
              className="mt-2 flex w-full items-center justify-center rounded-full px-4 py-2.5 text-[11px] font-semibold text-forest underline decoration-forest/30 underline-offset-4 transition hover:decoration-forest"
            >
              Consultar financiamiento
            </a>

            <a
              href="https://maps.google.com/?q=Av.+Chacabuco+1725,+Corrientes,+Argentina"
              target="_blank"
              rel="noreferrer"
              className="mt-4 flex items-start justify-center gap-1.5 text-center text-[9px] leading-relaxed text-muted transition hover:text-ink"
            >
              <MapPin className="mt-0.5 h-3 w-3 shrink-0" />
              Av. Chacabuco 1725 · Corrientes
            </a>
          </aside>
        </div>
      </div>
    </Modal>
  );
}
