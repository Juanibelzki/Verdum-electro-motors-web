import { formatKm, formatUSD, monthlyPayment, type Car } from "../data/cars";
import {
  ArrowUpRight,
  Calendar,
  Check,
  Cog,
  Fuel,
  Gauge,
  ShieldCheck,
  Zap,
} from "./Icons";
import { Modal } from "./ui";

export default function CarDetailModal({
  car,
  onClose,
  onSchedule,
  onFinance,
}: {
  car: Car;
  onClose: () => void;
  onSchedule: () => void;
  onFinance: (price: number) => void;
}) {
  const specs = [
    { label: "Año", value: String(car.year), icon: Calendar },
    { label: "Kilometraje", value: formatKm(car.km), icon: Gauge },
    { label: "Transmisión", value: car.transmission, icon: Cog },
    { label: "Combustible", value: car.fuel, icon: car.fuel === "Eléctrico" ? Zap : Fuel },
  ];

  return (
    <Modal open onClose={onClose} label={`${car.brand} ${car.model}`} className="sm:max-w-4xl">
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="relative h-[220px] w-full overflow-hidden bg-forest sm:h-[300px]">
          <img
            src={car.image}
            alt={`${car.brand} ${car.model}`}
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/10 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-5 sm:p-7">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-lime px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-[0.14em] text-ink">
                {car.badge}
              </span>
              <span className="rounded-full border border-white/25 bg-ink/25 px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.12em] text-cream backdrop-blur">
                {car.condition} · {car.color}
              </span>
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

        <div className="grid gap-8 p-5 sm:grid-cols-[1.25fr_0.75fr] sm:p-7">
          <div>
            <p className="text-[13px] leading-relaxed text-moss">{car.tagline}</p>

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

            <div className="mt-6">
              <p className="text-[9.5px] font-bold uppercase tracking-[0.18em] text-muted">
                Equipamiento destacado
              </p>
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

            <div className="mt-6 flex items-start gap-2.5 rounded-xl bg-cream/60 p-3.5">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-forest" />
              <p className="text-[10.5px] leading-relaxed text-moss">
                Incluye inspección de 120 puntos, garantía y auxilio 24/7. Transferencia y
                patentamiento a cargo de VELTA.
              </p>
            </div>
          </div>

          <aside className="h-fit rounded-2xl border border-line/80 bg-cream/60 p-5 sm:sticky sm:top-0">
            <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-muted">
              Precio final
            </p>
            <p className="mt-1 text-[28px] font-extrabold leading-none tracking-[-0.04em] text-ink">
              {formatUSD(car.price)}
            </p>
            <p className="mt-1.5 text-[10.5px] leading-relaxed text-muted">
              Impuestos y transferencia incluidos.
            </p>

            <div className="mt-5 rounded-xl bg-paper p-4">
              <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-muted">
                Cuota estimada
              </p>
              <p className="mt-1 text-[20px] font-extrabold tracking-[-0.03em] text-forest">
                {formatUSD(monthlyPayment(car.price))}
                <span className="text-[11px] font-semibold text-muted"> /mes</span>
              </p>
              <p className="mt-1 text-[9.5px] leading-relaxed text-muted">
                Anticipo 20% · 60 meses · TNA 7,9%
              </p>
            </div>

            <button
              type="button"
              onClick={onSchedule}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-ink px-4 py-3.5 text-[12px] font-semibold text-cream transition hover:bg-forest"
            >
              Agendar test drive
              <ArrowUpRight className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => onFinance(car.price)}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-full border border-ink/15 px-4 py-3.5 text-[12px] font-semibold text-ink transition hover:border-ink/30 hover:bg-paper"
            >
              Simular financiación
            </button>
            <p className="mt-3 text-center text-[9px] leading-relaxed text-muted">
              Showroom Palermo · Entrega en 48 h
            </p>
          </aside>
        </div>
      </div>
    </Modal>
  );
}
