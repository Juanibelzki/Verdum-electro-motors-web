import { useState, type FormEvent } from "react";
import { cars, formatKm, monthlyPayment, formatUSD } from "../data/cars";
import { cn } from "../utils/cn";
import { ArrowUpRight, Calendar, Check, Clock } from "./Icons";
import { Modal } from "./ui";

const times = ["10:00", "11:30", "15:00", "16:30", "18:00"];

function getNextDays(count: number) {
  const days: { iso: string; weekday: string; day: string; month: string }[] = [];
  const cursor = new Date();
  cursor.setDate(cursor.getDate() + 1);
  while (days.length < count) {
    if (cursor.getDay() !== 0) {
      days.push({
        iso: `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, "0")}-${String(
          cursor.getDate()
        ).padStart(2, "0")}`,
        weekday: new Intl.DateTimeFormat("es-AR", { weekday: "short" })
          .format(cursor)
          .replace(".", ""),
        day: new Intl.DateTimeFormat("es-AR", { day: "2-digit" }).format(cursor),
        month: new Intl.DateTimeFormat("es-AR", { month: "short" })
          .format(cursor)
          .replace(".", ""),
      });
    }
    cursor.setDate(cursor.getDate() + 1);
  }
  return days;
}

const inputClass =
  "w-full rounded-xl border border-line bg-white/60 px-4 py-3 text-sm font-medium text-ink placeholder:text-muted/50 transition focus:border-forest focus:outline-none focus:ring-4 focus:ring-forest/10";

export default function ScheduleModal({
  initialCarId,
  onClose,
}: {
  initialCarId?: string;
  onClose: () => void;
}) {
  const days = getNextDays(5);
  const [carId, setCarId] = useState(initialCarId ?? cars[0].id);
  const [date, setDate] = useState(days[0].iso);
  const [time, setTime] = useState(times[0]);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const selectedCar = cars.find((car) => car.id === carId) ?? cars[0];
  const selectedDay = days.find((day) => day.iso === date) ?? days[0];

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!name.trim() || phone.replace(/\D/g, "").length < 7 || !email.includes("@")) {
      setError("Revisá tus datos: necesitamos nombre, teléfono y un email válido.");
      return;
    }
    setError("");
    setSubmitted(true);
  };

  return (
    <Modal open onClose={onClose} label="Agendar un test drive" className="sm:max-w-2xl">
      {submitted ? (
        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-12 text-center sm:px-12 sm:py-16">
          <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-lime text-ink">
            <Check className="h-7 w-7" strokeWidth={2.2} />
          </span>
          <p className="mt-6 text-[10px] font-bold uppercase tracking-[0.24em] text-muted">
            Reserva recibida
          </p>
          <h2 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">
            Nos vemos pronto, {name.trim().split(" ")[0]}.
          </h2>
          <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-muted">
            Te contactamos dentro de las próximas 24 horas para confirmar la disponibilidad del
            vehículo y los detalles de la visita.
          </p>

          <div className="mx-auto mt-7 max-w-md rounded-2xl border border-line/80 bg-cream/70 p-5 text-left">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted">
              Tu test drive
            </p>
            <p className="mt-2 text-lg font-extrabold tracking-tight">
              {selectedCar.brand} {selectedCar.model}
            </p>
            <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-xs font-medium text-moss">
              <span className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                {selectedDay.weekday} {selectedDay.day} {selectedDay.month}
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" />
                {time} h · Av. Chacabuco 1725
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="mt-7 inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3.5 text-sm font-semibold text-cream transition hover:bg-forest"
          >
            Volver al catálogo
            <ArrowUpRight className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="min-h-0 flex-1 overflow-y-auto">
          <div className="border-b border-line/70 bg-cream/60 px-6 pb-6 pt-7 sm:px-8 sm:pt-8">
            <p className="inline-flex items-center gap-2 rounded-full border border-ink/10 bg-paper px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-moss">
              <span className="pulse-dot h-1.5 w-1.5 rounded-full bg-moss" />
              Sin costo · Sin compromiso
            </p>
            <h2 className="mt-4 text-[28px] font-extrabold leading-tight tracking-[-0.03em] sm:text-[34px]">
              Agendá tu test drive.
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              Elegí el auto y el mejor momento. Nosotros nos ocupamos del resto.
            </p>
          </div>

          <div className="space-y-5 px-6 py-6 sm:px-8">
            <div>
              <label
                htmlFor="schedule-car"
                className="mb-2 block text-[11px] font-bold uppercase tracking-[0.14em] text-muted"
              >
                Auto de interés
              </label>
              <select
                id="schedule-car"
                value={carId}
                onChange={(event) => setCarId(event.target.value)}
                className={cn(inputClass, "appearance-none")}
              >
                {cars.map((car) => (
                  <option key={car.id} value={car.id}>
                    {car.brand} {car.model} · {car.year} · {formatUSD(car.price)}
                  </option>
                ))}
              </select>
              <p className="mt-2 text-[11px] text-muted">
                Cuota estimada desde{" "}
                <span className="font-semibold text-ink">
                  {formatUSD(monthlyPayment(selectedCar.price))}/mes
                </span>{" "}
                · {formatKm(selectedCar.km)}
              </p>
            </div>

            <div>
              <span className="mb-2 block text-[11px] font-bold uppercase tracking-[0.14em] text-muted">
                Elegí el día
              </span>
              <div className="grid grid-cols-5 gap-2">
                {days.map((day) => {
                  const active = day.iso === date;
                  return (
                    <button
                      key={day.iso}
                      type="button"
                      onClick={() => setDate(day.iso)}
                      aria-pressed={active}
                      className={cn(
                        "flex flex-col items-center rounded-xl border px-1 py-2.5 transition",
                        active
                          ? "border-ink bg-ink text-cream"
                          : "border-line bg-white/50 text-ink hover:border-ink/40"
                      )}
                    >
                      <span className="text-[9px] font-bold uppercase tracking-wider opacity-60">
                        {day.weekday}
                      </span>
                      <span className="mt-0.5 text-lg font-extrabold leading-none">{day.day}</span>
                      <span className="mt-0.5 text-[9px] uppercase opacity-60">{day.month}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <span className="mb-2 block text-[11px] font-bold uppercase tracking-[0.14em] text-muted">
                Horario
              </span>
              <div className="flex flex-wrap gap-2">
                {times.map((slot) => {
                  const active = slot === time;
                  return (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => setTime(slot)}
                      aria-pressed={active}
                      className={cn(
                        "rounded-full border px-4 py-2 text-xs font-semibold transition",
                        active
                          ? "border-forest bg-forest text-cream"
                          : "border-line bg-white/50 text-moss hover:border-ink/40"
                      )}
                    >
                      {slot} h
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label htmlFor="schedule-name" className="sr-only">
                  Nombre y apellido
                </label>
                <input
                  id="schedule-name"
                  className={inputClass}
                  placeholder="Nombre y apellido"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  autoComplete="name"
                  required
                />
              </div>
              <div>
                <label htmlFor="schedule-phone" className="sr-only">
                  Teléfono
                </label>
                <input
                  id="schedule-phone"
                  className={inputClass}
                  placeholder="Teléfono / WhatsApp"
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  autoComplete="tel"
                  inputMode="tel"
                  required
                />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="schedule-email" className="sr-only">
                  Email
                </label>
                <input
                  id="schedule-email"
                  className={inputClass}
                  placeholder="Email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  autoComplete="email"
                  required
                />
              </div>
            </div>

            {error && (
              <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-xs font-medium text-red-700">
                {error}
              </p>
            )}

            <div className="flex flex-col gap-3 border-t border-line/70 pt-5 sm:flex-row sm:items-center sm:justify-between">
              <p className="max-w-[250px] text-[10px] leading-relaxed text-muted">
                Al confirmar aceptás que Verdun te contacte para coordinar tu visita. Tus datos no
                se comparten con terceros.
              </p>
              <button
                type="submit"
                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-ink px-6 py-3.5 text-sm font-semibold text-cream transition hover:bg-forest"
              >
                Confirmar test drive
                <ArrowUpRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </form>
      )}
    </Modal>
  );
}
