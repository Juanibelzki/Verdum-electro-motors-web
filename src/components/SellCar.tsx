import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
  type FormEvent,
} from "react";
import { whatsappLink } from "../data/cars";
import {
  MAX_TASACION_PHOTOS,
  MAX_TASACION_PHOTO_BYTES,
  TASACION_MAX_KM,
  TASACION_MIN_YEAR,
} from "../data/tasacion";
import { ArrowUpRight, Camera, Check, Sparkles, Whatsapp, X } from "./Icons";
import { Eyebrow, Reveal } from "./ui";

const inputClass =
  "w-full rounded-xl border border-line bg-white/65 px-3.5 py-3 text-[12.5px] font-medium text-ink placeholder:text-muted/50 transition focus:border-forest focus:outline-none focus:ring-4 focus:ring-forest/10 disabled:cursor-not-allowed disabled:opacity-60";

const benefits = [
  "Tasación sin cargo en menos de 24 horas",
  "Tomamos tu auto como parte de pago",
  "Nos ocupamos de transferencia y papeleo",
  "A partir de 2012 y menos de 150.000 km",
];

const currentYear = new Date().getFullYear();
const years = Array.from(
  { length: currentYear - TASACION_MIN_YEAR + 1 },
  (_, index) => currentYear - index
);
const maxPhotoMb = Math.round(MAX_TASACION_PHOTO_BYTES / (1024 * 1024));

type PhotoDraft = {
  id: string;
  file: File;
  preview: string;
};

type Status = {
  tone: "error" | "info";
  text: string;
};

const statusClasses = (tone: Status["tone"]) =>
  tone === "error"
    ? "border-red-200 bg-red-50 text-red-700"
    : "border-forest/20 bg-forest/5 text-forest";

export default function SellCar({ onSchedule }: { onSchedule: () => void }) {
  const [form, setForm] = useState({ brand: "", model: "", year: "", km: "" });
  const [photos, setPhotos] = useState<PhotoDraft[]>([]);
  const [status, setStatus] = useState<Status | null>(null);
  const [sent, setSent] = useState(false);
  const [sentLink, setSentLink] = useState("");
  const photoInputRef = useRef<HTMLInputElement>(null);
  const photosRef = useRef<PhotoDraft[]>([]);
  const submittingRef = useRef(false);

  photosRef.current = photos;

  useEffect(() => {
    return () => {
      photosRef.current.forEach((photo) =>
        URL.revokeObjectURL(photo.preview)
      );
    };
  }, []);

  const update = (field: keyof typeof form, value: string) =>
    setForm((current) => ({ ...current, [field]: value }));

  const addPhotos = (files: FileList | File[]) => {
    const list = Array.from(files);
    if (!list.length) return;

    const available = MAX_TASACION_PHOTOS - photos.length;
    if (available <= 0) {
      setStatus({
        tone: "error",
        text: `Podés adjuntar hasta ${MAX_TASACION_PHOTOS} fotos.`,
      });
      return;
    }

    const next: PhotoDraft[] = [];
    const errors: string[] = [];

    list.slice(0, available).forEach((file) => {
      if (
        !file.type.startsWith("image/") &&
        !/\.(jpe?g|png|webp|avif|heic|heif)$/i.test(file.name)
      ) {
        errors.push(`${file.name} no es una imagen compatible.`);
        return;
      }

      if (file.size > MAX_TASACION_PHOTO_BYTES) {
        errors.push(`${file.name} supera los ${maxPhotoMb} MB.`);
        return;
      }

      next.push({
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        file,
        preview: URL.createObjectURL(file),
      });
    });

    if (list.length > available) {
      errors.push(`Podés adjuntar hasta ${MAX_TASACION_PHOTOS} fotos.`);
    }

    if (next.length) {
      setPhotos((current) => [...current, ...next]);
    }

    setStatus(
      errors.length ? { tone: "error", text: errors.join(" ") } : null
    );

    if (photoInputRef.current) photoInputRef.current.value = "";
  };

  const onPhotoChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) addPhotos(event.target.files);
  };

  const onPhotoDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (event.dataTransfer.files.length) {
      addPhotos(event.dataTransfer.files);
    }
  };

  const removePhoto = (id: string) => {
    setPhotos((current) => {
      const target = current.find((photo) => photo.id === id);
      if (target) URL.revokeObjectURL(target.preview);
      return current.filter((photo) => photo.id !== id);
    });
    setStatus(null);
  };

  const reset = () => {
    submittingRef.current = false;
    photos.forEach((photo) => URL.revokeObjectURL(photo.preview));
    setForm({ brand: "", model: "", year: "", km: "" });
    setPhotos([]);
    setStatus(null);
    setSent(false);
    setSentLink("");
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submittingRef.current) return;

    const brand = form.brand.trim();
    const model = form.model.trim();
    const year = form.year;
    const kmNumber = Number(form.km);

    if (!brand || !model || !year || !form.km.trim()) return;

    if (Number(year) < TASACION_MIN_YEAR) {
      setStatus({
        tone: "error",
        text: `Para tomar tu auto como parte de pago, debe ser ${TASACION_MIN_YEAR} o posterior.`,
      });
      return;
    }

    if (
      !Number.isFinite(kmNumber) ||
      kmNumber < 0 ||
      kmNumber >= TASACION_MAX_KM
    ) {
      setStatus({
        tone: "error",
        text: `Para tomar tu auto como parte de pago, debe tener menos de ${TASACION_MAX_KM.toLocaleString("es-AR")} km.`,
      });
      return;
    }

    submittingRef.current = true;
    setStatus(null);

    const messageLines = [
      "Hola Verdun, quiero entregar mi auto como parte de pago.",
      `Marca: ${brand}`,
      `Modelo: ${model}`,
      `Año: ${year}`,
      `Kilómetros: ${kmNumber.toLocaleString("es-AR")}`,
    ];

    if (photos.length > 0) {
      messageLines.push("Te adjunto por acá las fotos del vehículo.");
    }

    const message = messageLines.join("\n");
    const link = whatsappLink(message);
    setSentLink(link);

    // 1. Si el dispositivo soporta navigator.canShare({ files }) en mobile
    const photoFiles = photos.map((photo) => photo.file);
    const canShareFiles =
      typeof navigator !== "undefined" &&
      typeof navigator.share === "function" &&
      typeof navigator.canShare === "function" &&
      photoFiles.length > 0 &&
      (() => {
        try {
          return navigator.canShare({ files: photoFiles });
        } catch {
          return false;
        }
      })();

    if (canShareFiles) {
      try {
        await navigator.share({
          title: "Tasación de vehículo - Verdun Automotores",
          text: message,
          files: photoFiles,
        });
        setStatus(null);
        setSent(true);
        submittingRef.current = false;
        return;
      } catch {
        // Si el usuario canceló el share o falló, continuamos a WhatsApp sin mostrar error
      }
    }

    // 2. Si está en desktop o navigator.share no está disponible / falla:
    // Nunca mostrar cartel de error rojo, abrir directamente WhatsApp
    setStatus(null);
    setSent(true);
    submittingRef.current = false;

    window.open(link, "_blank", "noopener,noreferrer");
  };

  return (
    <section id="vender" className="scroll-mt-24 bg-cream py-16 sm:py-20 lg:py-24">
      <div className="mx-auto max-w-[1440px] px-5 sm:px-8 lg:px-10">
        <Reveal>
          <div className="relative overflow-hidden rounded-[2rem] bg-lime p-5 sm:p-8 lg:p-12">
            <div
              className="pointer-events-none absolute -right-20 -top-24 h-[340px] w-[340px] rounded-full border border-ink/10"
              aria-hidden="true"
            />
            <div
              className="pointer-events-none absolute -right-10 -top-14 h-[220px] w-[220px] rounded-full border border-ink/10"
              aria-hidden="true"
            />
            <div className="relative grid items-center gap-9 lg:grid-cols-[1.03fr_0.97fr] lg:gap-14">
              <div>
                <Eyebrow className="text-ink/55">
                  04 — Entregar como parte de pago
                </Eyebrow>
                <h2 className="mt-4 max-w-xl text-[clamp(2.05rem,4.2vw,3.3rem)] font-extrabold leading-[1.01] tracking-[-0.05em] text-ink">
                  Tu auto actual vale{" "}
                  <span className="font-serif font-normal italic tracking-[-0.01em]">
                    más de lo que pensás.
                  </span>
                </h2>
                <p className="mt-4 max-w-md text-[13px] leading-relaxed text-ink/60">
                  Tasamos tu vehículo sin costo y en menos de 24 horas.
                  Entregalo como parte de pago de tu próximo auto y nosotros nos
                  ocupamos de la transferencia y el papeleo.
                </p>

                <ul className="mt-6 space-y-2.5">
                  {benefits.map((benefit) => (
                    <li
                      key={benefit}
                      className="flex items-start gap-2.5 text-[12px] font-medium text-ink/75"
                    >
                      <span className="mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full bg-ink text-lime">
                        <Check className="h-2.5 w-2.5" strokeWidth={2.6} />
                      </span>
                      {benefit}
                    </li>
                  ))}
                </ul>

                <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-ink/15 pt-5">
                  <div>
                    <p className="text-[20px] font-extrabold leading-none tracking-[-0.03em] text-ink">
                      24 h
                    </p>
                    <p className="mt-1 text-[9.5px] font-medium text-ink/50">
                      para tu tasación
                    </p>
                  </div>
                  <span className="h-8 w-px bg-ink/15" />
                  <div>
                    <p className="text-[20px] font-extrabold leading-none tracking-[-0.03em] text-ink">
                      100%
                    </p>
                    <p className="mt-1 text-[9.5px] font-medium text-ink/50">
                      gestionado por Verdun
                    </p>
                  </div>
                  <span className="hidden h-8 w-px bg-ink/15 sm:block" />
                  <p className="hidden max-w-[150px] text-[10px] leading-relaxed text-ink/50 sm:block">
                    Pago inmediato por transferencia bancaria.
                  </p>
                </div>
              </div>

              <div className="rounded-[1.5rem] border border-ink/10 bg-paper p-5 shadow-[0_25px_60px_-35px_rgba(20,36,30,0.45)] sm:p-6">
                {sent ? (
                  <div className="flex min-h-[330px] flex-col justify-center py-3 text-center">
                    <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-lime text-ink">
                      <Check className="h-6 w-6" strokeWidth={2.3} />
                    </span>
                    <p className="mt-5 text-[9.5px] font-bold uppercase tracking-[0.2em] text-muted">
                      Consulta preparada
                    </p>
                    <p className="mt-2 text-[26px] font-extrabold leading-tight tracking-[-0.04em] text-ink sm:text-[29px]">
                      Te pasamos la tasación por WhatsApp.
                    </p>
                    <p className="mx-auto mt-2 max-w-[320px] text-[10.5px] leading-relaxed text-muted">
                      {photos.length
                        ? "Ya abrimos el chat con los datos de tu vehículo. Podés adjuntar las fotos directamente en la conversación de WhatsApp que se acaba de abrir."
                        : `Abrimos el chat con los datos de tu ${form.brand} ${form.model}.`}
                    </p>
                    <div className="mt-5 flex flex-col gap-2">
                      <a
                        href={sentLink}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center justify-center gap-2 rounded-full bg-lime px-5 py-3.5 text-[12px] font-bold text-ink transition hover:bg-lime-soft"
                      >
                        <Whatsapp className="h-4 w-4" />
                        Abrir WhatsApp
                      </a>
                      <button
                        type="button"
                        onClick={onSchedule}
                        className="flex items-center justify-center gap-2 rounded-full border border-ink/15 px-5 py-3.5 text-[12px] font-semibold text-ink transition hover:border-ink/30"
                      >
                        Agendar visita al showroom
                        <ArrowUpRight className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={reset}
                        className="rounded-full px-4 py-2 text-[11px] font-semibold text-muted transition hover:text-ink"
                      >
                        Tasar otro auto
                      </button>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit}>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-[9.5px] font-bold uppercase tracking-[0.18em] text-muted">
                          Tasación online
                        </p>
                        <h3 className="mt-1.5 text-[21px] font-extrabold tracking-[-0.03em] text-ink">
                          Contanos de tu auto.
                        </h3>
                      </div>
                      <span className="grid h-9 w-9 place-items-center rounded-full bg-lime/60 text-forest">
                        <Sparkles className="h-4 w-4" />
                      </span>
                    </div>
                    <p className="mt-1.5 text-[11px] leading-relaxed text-muted">
                      Completá los datos y sumá fotos. Te enviamos la tasación.
                      Sin compromiso.
                    </p>

                    <div className="mt-5 grid grid-cols-2 gap-3">
                      <div>
                        <label
                          htmlFor="sell-brand"
                          className="mb-1.5 block text-[9.5px] font-bold uppercase tracking-[0.12em] text-muted"
                        >
                          Marca
                        </label>
                        <input
                          id="sell-brand"
                          className={inputClass}
                          placeholder="Ej. Toyota"
                          value={form.brand}
                          onChange={(event) =>
                            update("brand", event.target.value)
                          }
                          required
                        />
                      </div>
                      <div>
                        <label
                          htmlFor="sell-model"
                          className="mb-1.5 block text-[9.5px] font-bold uppercase tracking-[0.12em] text-muted"
                        >
                          Modelo
                        </label>
                        <input
                          id="sell-model"
                          className={inputClass}
                          placeholder="Ej. Corolla"
                          value={form.model}
                          onChange={(event) =>
                            update("model", event.target.value)
                          }
                          required
                        />
                      </div>
                      <div>
                        <label
                          htmlFor="sell-year"
                          className="mb-1.5 block text-[9.5px] font-bold uppercase tracking-[0.12em] text-muted"
                        >
                          Año
                        </label>
                        <select
                          id="sell-year"
                          className={`${inputClass} appearance-none`}
                          value={form.year}
                          onChange={(event) =>
                            update("year", event.target.value)
                          }
                          required
                        >
                          <option value="" disabled>
                            Año
                          </option>
                          {years.map((year) => (
                            <option key={year} value={year}>
                              {year}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label
                          htmlFor="sell-km"
                          className="mb-1.5 block text-[9.5px] font-bold uppercase tracking-[0.12em] text-muted"
                        >
                          Kilómetros
                        </label>
                        <input
                          id="sell-km"
                          className={inputClass}
                          placeholder="Ej. 45000"
                          type="number"
                          min={0}
                          max={TASACION_MAX_KM - 1}
                          inputMode="numeric"
                          value={form.km}
                          onChange={(event) => {
                            event.currentTarget.setCustomValidity("");
                            update("km", event.target.value);
                          }}
                          onInvalid={(event) =>
                            event.currentTarget.setCustomValidity(
                              `Para tomar tu auto como parte de pago, debe tener menos de ${TASACION_MAX_KM.toLocaleString("es-AR")} km.`
                            )
                          }
                          required
                        />
                      </div>
                    </div>

                    <div
                      onDragOver={(event) => event.preventDefault()}
                      onDrop={onPhotoDrop}
                      className="mt-5 rounded-2xl border border-ink/10 bg-cream/55 p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-[9.5px] font-bold uppercase tracking-[0.16em] text-moss">
                            Queremos conocer tu vehículo
                          </p>
                          <p className="mt-1 text-[10.5px] leading-relaxed text-muted">
                            Sumá hasta {MAX_TASACION_PHOTOS} fotos: frente,
                            laterales, interior y odómetro. Quedan en tu
                            dispositivo; no se suben a ningún servidor.
                          </p>
                        </div>
                        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-lime/60 text-forest">
                          <Camera className="h-4 w-4" />
                        </span>
                      </div>

                      <input
                        ref={photoInputRef}
                        id="sell-photos"
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/avif,.jpg,.jpeg,.png,.webp,.avif"
                        multiple
                        className="sr-only"
                        onChange={onPhotoChange}
                        disabled={photos.length >= MAX_TASACION_PHOTOS}
                        aria-label="Adjuntar fotos del vehículo"
                      />
                      <button
                        type="button"
                        onClick={() => photoInputRef.current?.click()}
                        disabled={photos.length >= MAX_TASACION_PHOTOS}
                        className="mt-3 inline-flex items-center gap-2 rounded-full border border-ink/15 bg-paper px-4 py-2.5 text-[11px] font-semibold text-ink transition hover:border-ink/30 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <Camera className="h-3.5 w-3.5" />
                        {photos.length ? "Agregar más fotos" : "Adjuntar fotos"}
                      </button>

                      {photos.length > 0 && (
                        <div className="mt-3 grid grid-cols-3 gap-2">
                          {photos.map((photo, index) => (
                            <div
                              key={photo.id}
                              className="relative aspect-[4/3] overflow-hidden rounded-lg border border-line bg-sand"
                            >
                              <img
                                src={photo.preview}
                                alt={`Foto ${index + 1} de tu vehículo`}
                                className="h-full w-full object-cover"
                              />
                              <button
                                type="button"
                                onClick={() => removePhoto(photo.id)}
                                      aria-label={`Quitar foto ${index + 1}`}
                                className="absolute right-1 top-1 grid h-6 w-6 place-items-center rounded-full bg-ink/75 text-cream transition hover:bg-red-600 disabled:opacity-50"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      <p className="mt-2 text-[8.5px] leading-relaxed text-muted">
                        {photos.length} de {MAX_TASACION_PHOTOS} fotos · JPG,
                        PNG, WebP o AVIF · hasta {maxPhotoMb} MB cada una.
                      </p>
                    </div>

                    {status && (
                      <p
                        role="status"
                        className={`mt-3 rounded-xl border px-3 py-2.5 text-[10px] font-medium leading-relaxed ${statusClasses(
                          status.tone
                        )}`}
                      >
                        {status.text}
                      </p>
                    )}

                    <p className="mt-3 flex items-start gap-1.5 text-[9px] leading-relaxed text-muted">
                      <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-moss" />
                      Tomamos autos desde {TASACION_MIN_YEAR} y con menos de{" "}
                      {TASACION_MAX_KM.toLocaleString("es-AR")} km.
                    </p>

                    <button
                      type="submit"
                      className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-lime px-5 py-3.5 text-[12px] font-bold text-ink transition hover:bg-lime-soft"
                    >
                      <Whatsapp className="h-4 w-4" />
                      Enviar por WhatsApp
                      <ArrowUpRight className="h-4 w-4" />
                    </button>
                    <p className="mt-2.5 text-center text-[8.5px] leading-relaxed text-muted">
                      {photos.length
                        ? "Al enviar se abre WhatsApp con los datos de tu auto y podés adjuntar las fotos en el chat. La tasación se confirma con una revisión en el showroom."
                        : "Al enviar preparamos el mensaje con los datos de tu auto. La tasación se confirma con una revisión en el showroom."}
                    </p>
                  </form>
                )}
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
