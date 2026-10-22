import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type DragEvent,
  type ReactNode,
} from "react";
import { cn } from "../utils/cn";
import {
  AlertTriangle,
  ArrowLeft,
  Calendar,
  CarIcon,
  Check,
  ChevronDown,
  Cog,
  Eye,
  Fuel,
  Gauge,
  ImageIcon,
  Pencil,
  Plus,
  Sparkles,
  Star,
  Tag,
  Whatsapp,
  X,
  Zap,
} from "../components/Icons";
import {
  FALLBACK_CAR_IMAGE,
  formatKm,
  formatPrice,
  whatsappLink,
} from "../data/cars";
import { inferVehicleSpecs } from "../data/vehicles";
import {
  deleteVehiclePhoto,
  insertVehiclePhotos,
  MAX_VEHICLE_PHOTOS,
  MAX_VEHICLE_PHOTO_BYTES,
  saveVehicle,
  updateVehiclePhotoPositions,
  uploadVehiclePhoto,
  vehicleTitle,
  type AdminCategory,
  type AdminVehicle,
  type VehicleFormInput,
} from "./stockApi";

type StockEditorProps = {
  vehicle: AdminVehicle | null;
  categories: AdminCategory[];
  specsReady: boolean;
  onCancel: () => void;
  onSaved: (message: string) => void;
};

type EditorPhoto = {
  key: string;
  id?: string;
  url: string;
  file?: File;
  isNew: boolean;
};

type FormState = {
  categoryId: string;
  brand: string;
  model: string;
  version: string;
  title: string;
  year: string;
  km: string;
  color: string;
  price: string;
  summary: string;
  equipment: string;
  whatsappMsg: string;
  transmission: string;
  fuel: string;
  body: string;
  drive: string;
  power: string;
  featured: boolean;
};

const inputClass =
  "w-full rounded-xl border border-line bg-paper px-3.5 py-2.5 text-[13px] text-ink outline-none transition placeholder:text-muted/60 focus:border-forest/40 focus:ring-2 focus:ring-lime/50 disabled:cursor-not-allowed disabled:bg-cream/50 disabled:text-muted";

const labelClass =
  "text-[10px] font-bold uppercase tracking-[0.16em] text-muted";

const bulletPattern = /^([•●▪\-*✔✅·]|\d+[.)])\s*(.+)$/;

const numberFrom = (value: string) => {
  const number = Number.parseInt(value.replace(/[^\d]/g, ""), 10);
  return Number.isFinite(number) ? number : null;
};

function splitDescription(raw: string) {
  const lines = raw
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const summary: string[] = [];
  const equipment: string[] = [];
  let featuresStarted = false;

  for (const line of lines) {
    const bullet = line.match(bulletPattern);
    if (bullet) {
      featuresStarted = true;
      const content = bullet[2].trim();
      if (content) equipment.push(content);
      continue;
    }

    if (line.includes("•")) {
      featuresStarted = true;
      for (const part of line.split("•")) {
        const content = part.trim();
        if (content) equipment.push(content);
      }
      continue;
    }

    if (!featuresStarted) {
      summary.push(line);
    } else {
      equipment.push(line);
    }
  }

  return {
    summary: summary.join("\n\n"),
    equipment: Array.from(new Set(equipment)).join("\n"),
  };
}

function unifyDescription(summary: string, equipment: string) {
  const prose = summary.trim();
  const items = equipment
    .split(/\r?\n/)
    .map((line) => line.replace(bulletPattern, "").trim())
    .filter(Boolean);

  return [prose, items.length > 0 ? items.map((item) => `• ${item}`).join("\n") : ""]
    .filter(Boolean)
    .join("\n\n");
}

function SectionCard({
  icon,
  title,
  description,
  children,
  id,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  children: ReactNode;
  id?: string;
}) {
  return (
    <section
      id={id}
      className="rounded-2xl border border-line bg-paper p-5 sm:p-6"
    >
      <div className="flex items-start gap-3">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-cream text-forest">
          {icon}
        </span>
        <div className="min-w-0">
          <h3 className="text-[16px] font-extrabold tracking-[-0.025em] text-ink">
            {title}
          </h3>
          <p className="mt-1 text-[11.5px] leading-relaxed text-muted">
            {description}
          </p>
        </div>
      </div>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function Field({
  label,
  hint,
  required,
  className,
  children,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <label className={cn("block", className)}>
      <span className={labelClass}>
        {label}
        {required ? " *" : ""}
      </span>
      <span className="mt-1.5 block">{children}</span>
      {hint && (
        <span className="mt-1 block text-[10px] leading-relaxed text-muted">
          {hint}
        </span>
      )}
    </label>
  );
}

function Toggle({
  checked,
  onChange,
  label,
  description,
  disabled,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
  description: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className="flex w-full items-start justify-between gap-4 text-left disabled:cursor-not-allowed disabled:opacity-50"
    >
      <span>
        <span className="block text-[12.5px] font-bold text-ink">{label}</span>
        <span className="mt-0.5 block text-[10.5px] leading-relaxed text-muted">
          {description}
        </span>
      </span>
      <span
        className={cn(
          "relative mt-0.5 h-6 w-11 shrink-0 rounded-full border transition",
          checked ? "border-forest bg-forest" : "border-line bg-cream"
        )}
      >
        <span
          className={cn(
            "absolute top-[3px] h-[18px] w-[18px] rounded-full bg-paper shadow-sm transition",
            checked ? "left-[22px]" : "left-[3px]"
          )}
        />
      </span>
    </button>
  );
}

export default function StockEditor({
  vehicle,
  categories,
  specsReady,
  onCancel,
  onSaved,
}: StockEditorProps) {
  const isNew = !vehicle;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const objectUrls = useRef<Set<string>>(new Set());
  const [photos, setPhotos] = useState<EditorPhoto[]>(() =>
    (vehicle?.photos ?? []).map((photo) => ({
      key: photo.id,
      id: photo.id,
      url: photo.url,
      isNew: false,
    }))
  );
  const [form, setForm] = useState<FormState>(() => {
    const parsed = splitDescription(vehicle?.descripcion ?? "");
    return {
      categoryId:
        vehicle?.category_id ??
        categories.find((category) => category.slug === "usados")?.id ??
        categories[0]?.id ??
        "",
      brand: vehicle?.marca ?? "",
      model: vehicle?.modelo ?? "",
      version: vehicle?.version ?? "",
      title: vehicle?.nombre ?? "",
      year: vehicle?.año != null ? String(vehicle.año) : "",
      km: vehicle?.km != null ? String(vehicle.km) : "",
      color: vehicle?.color ?? "",
      price:
        vehicle?.precio_numero != null ? String(vehicle.precio_numero) : "",
      summary: parsed.summary,
      equipment: parsed.equipment,
      whatsappMsg: vehicle?.whatsapp_msg ?? "",
      transmission: vehicle?.transmision ?? "",
      fuel: vehicle?.combustible ?? "",
      body: vehicle?.carroceria ?? "",
      drive: vehicle?.traccion ?? "",
      power: vehicle?.potencia != null ? String(vehicle.potencia) : "",
      featured: Boolean(vehicle?.destacado),
    };
  });
  const [saving, setSaving] = useState(false);
  const [saveStage, setSaveStage] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [autofillNotice, setAutofillNotice] = useState<string | null>(null);
  const [pasteOpen, setPasteOpen] = useState(false);
  const [pasteText, setPasteText] = useState("");
  const [dirty, setDirty] = useState(false);

  const selectedCategory = useMemo(
    () => categories.find((category) => category.id === form.categoryId) ?? null,
    [categories, form.categoryId]
  );

  const autoTitle = useMemo(
    () =>
      [form.brand, form.model, form.version]
        .map((value) => value.trim())
        .filter(Boolean)
        .join(" ")
        .replace(/\s+/g, " ")
        .trim(),
    [form.brand, form.model, form.version]
  );

  const previewTitle =
    form.title.trim() || autoTitle || "Vehículo sin nombre";
  const cover = photos[0]?.url || FALLBACK_CAR_IMAGE;
  const previewPrice = numberFrom(form.price);
  const previewKm = numberFrom(form.km);
  const previewPower = numberFrom(form.power);
  const previewCondition =
    selectedCategory?.slug === "0km"
      ? "0KM"
      : selectedCategory
        ? "Usado"
        : "Consultar";
  const previewVersion =
    form.version.trim() ||
    [form.body, form.drive].filter(Boolean).join(" · ") ||
    selectedCategory?.nombre ||
    "Consultar";
  const previewFuel =
    form.fuel.trim() && form.fuel.trim() !== "Consultar"
      ? form.fuel.trim()
      : form.body.trim() || "Consultar";

  useEffect(() => {
    return () => {
      objectUrls.current.forEach((url) => URL.revokeObjectURL(url));
      objectUrls.current.clear();
    };
  }, []);

  const update = <K extends keyof FormState>(
    key: K,
    value: FormState[K]
  ) => {
    setForm((current) => ({ ...current, [key]: value }));
    setDirty(true);
    setFormError(null);
  };

  const handlePhotoFiles = (files: FileList | File[]) => {
    const list = Array.from(files);
    const remaining = MAX_VEHICLE_PHOTOS - photos.length;
    if (remaining <= 0) {
      setFormError(`Ya cargaste el máximo de ${MAX_VEHICLE_PHOTOS} fotos.`);
      return;
    }

    const accepted: EditorPhoto[] = [];
    const errors: string[] = [];

    for (const file of list.slice(0, remaining)) {
      if (!file.type.startsWith("image/")) {
        errors.push(`${file.name}: no es una imagen.`);
        continue;
      }
      if (file.size > MAX_VEHICLE_PHOTO_BYTES) {
        errors.push(`${file.name}: supera los 15 MB.`);
        continue;
      }

      const url = URL.createObjectURL(file);
      objectUrls.current.add(url);
      accepted.push({
        key: crypto.randomUUID(),
        url,
        file,
        isNew: true,
      });
    }

    if (list.length > remaining) {
      errors.push(`Solo podés cargar hasta ${MAX_VEHICLE_PHOTOS} fotos.`);
    }

    if (accepted.length > 0) {
      setPhotos((current) => [...current, ...accepted]);
      setDirty(true);
    }

    setFormError(errors.length > 0 ? errors.join(" ") : null);
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (event.dataTransfer.files.length > 0) {
      handlePhotoFiles(event.dataTransfer.files);
    }
  };

  const removePhoto = (key: string) => {
    setPhotos((current) => {
      const target = current.find((photo) => photo.key === key);
      if (target?.isNew) {
        URL.revokeObjectURL(target.url);
        objectUrls.current.delete(target.url);
      }
      return current.filter((photo) => photo.key !== key);
    });
    setDirty(true);
  };

  const movePhoto = (key: string, direction: -1 | 1) => {
    setPhotos((current) => {
      const index = current.findIndex((photo) => photo.key === key);
      const nextIndex = index + direction;
      if (index < 0 || nextIndex < 0 || nextIndex >= current.length) {
        return current;
      }
      const copy = [...current];
      [copy[index], copy[nextIndex]] = [copy[nextIndex], copy[index]];
      return copy;
    });
    setDirty(true);
  };

  const makeCover = (key: string) => {
    setPhotos((current) => {
      const index = current.findIndex((photo) => photo.key === key);
      if (index <= 0) return current;
      const copy = [...current];
      const [photo] = copy.splice(index, 1);
      return [photo, ...copy];
    });
    setDirty(true);
  };

  const handlePasteSplit = () => {
    const parsed = splitDescription(pasteText);
    if (!parsed.summary && !parsed.equipment) {
      setFormError("Pegá un texto con descripción o equipamiento.");
      return;
    }
    setForm((current) => ({
      ...current,
      summary: parsed.summary,
      equipment: parsed.equipment,
    }));
    setPasteText("");
    setPasteOpen(false);
    setDirty(true);
    setFormError(null);
  };

  const applyInference = () => {
    const inferred = inferVehicleSpecs(
      [
        form.brand,
        form.model,
        form.version,
        form.title,
        form.summary,
        form.equipment,
      ].join(" ")
    );

    let filled = 0;
    setForm((current) => {
      const next = { ...current };
      const apply = (
        key: "transmission" | "fuel" | "body" | "drive",
        value: string
      ) => {
        if (!next[key].trim() && value && value !== "Consultar") {
          next[key] = value;
          filled += 1;
        }
      };

      apply("transmission", inferred.transmision);
      apply("fuel", inferred.combustible);
      apply("body", inferred.carroceria);
      apply("drive", inferred.traccion);

      if (!next.power.trim() && inferred.potencia) {
        next.power = String(inferred.potencia);
        filled += 1;
      }

      return next;
    });

    setDirty(true);
    setAutofillNotice(
      filled > 0
        ? `${filled} dato${filled === 1 ? "" : "s"} completado${
            filled === 1 ? "" : "s"
          }. Revisalos antes de guardar.`
        : "No encontramos datos nuevos para autocompletar."
    );
  };

  const handleCancel = () => {
    if (saving) return;
    if (
      dirty &&
      !window.confirm(
        "Hay cambios sin guardar. ¿Querés volver al stock igual?"
      )
    ) {
      return;
    }
    onCancel();
  };

  const save = async (mode: "publish" | "draft") => {
    const active = mode === "publish";

    if (active && photos.length === 0) {
      setFormError(
        "Para publicar necesitás al menos una foto. Cargala en la sección Fotos."
      );
      document
        .getElementById("stock-photos")
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    if (!selectedCategory) {
      setFormError("Elegí una categoría.");
      return;
    }

    if (!form.brand.trim() || !form.model.trim()) {
      setFormError("Marca y modelo son obligatorios.");
      return;
    }

    setSaving(true);
    setFormError(null);
    setAutofillNotice(null);

    const vehicleId = vehicle?.id ?? crypto.randomUUID();

    try {
      const newPhotos = photos.filter(
        (photo): photo is EditorPhoto & { file: File } =>
          photo.isNew && Boolean(photo.file)
      );
      const uploadedByKey = new Map<string, string>();

      for (let index = 0; index < newPhotos.length; index += 1) {
        const photo = newPhotos[index];
        setSaveStage(
          `Subiendo foto ${index + 1} de ${newPhotos.length}...`
        );
        const url = await uploadVehiclePhoto(photo.file, vehicleId, index);
        uploadedByKey.set(photo.key, url);
      }

      setSaveStage("Guardando ficha...");

      const payload: VehicleFormInput = {
        category: selectedCategory,
        nombre: form.title,
        marca: form.brand,
        modelo: form.model,
        version: form.version,
        año: form.year,
        km: form.km,
        color: form.color,
        precio: form.price,
        descripcion: unifyDescription(form.summary, form.equipment),
        whatsappMsg: form.whatsappMsg,
        transmision: form.transmission,
        combustible: form.fuel,
        carroceria: form.body,
        traccion: form.drive,
        potencia: form.power,
        destacado: active && form.featured,
        activo: active,
        specsReady,
      };

      await saveVehicle(payload, vehicleId, isNew);

      setSaveStage("Guardando fotos...");

      const existingPhotos = photos.filter(
        (photo): photo is EditorPhoto & { id: string } =>
          !photo.isNew && Boolean(photo.id)
      );
      const removedPhotoIds = (vehicle?.photos ?? [])
        .map((photo) => photo.id)
        .filter((id) => !photos.some((photo) => photo.id === id));

      if (removedPhotoIds.length > 0) {
        await Promise.all(removedPhotoIds.map(deleteVehiclePhoto));
      }

      if (existingPhotos.length > 0) {
        await updateVehiclePhotoPositions(
          existingPhotos.map((photo) => ({
            id: photo.id,
            position: photos.findIndex((item) => item.key === photo.key),
          }))
        );
      }

      const newPhotoRows = photos
        .map((photo, position) => ({ photo, position }))
        .filter(({ photo }) => photo.isNew)
        .map(({ photo, position }) => ({
          url: uploadedByKey.get(photo.key) ?? "",
          position,
        }))
        .filter((photo) => photo.url);

      if (newPhotoRows.length > 0) {
        await insertVehiclePhotos(vehicleId, newPhotoRows);
      }

      onSaved(
        active
          ? "Vehículo publicado. Ya está visible en el sitio."
          : "Borrador guardado. No se muestra en el sitio hasta que lo publiques."
      );
    } catch (cause) {
      setFormError(
        cause instanceof Error
          ? cause.message
          : "No se pudo guardar el vehículo."
      );
      setSaving(false);
      setSaveStage(null);
    }
  };

  const actions = (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={handleCancel}
        disabled={saving}
        className="rounded-full border border-line bg-paper px-4 py-2.5 text-[12px] font-semibold text-ink transition hover:border-ink/25 disabled:cursor-not-allowed disabled:opacity-50"
      >
        Cancelar
      </button>
      <button
        type="button"
        onClick={() => void save("draft")}
        disabled={saving}
        className="rounded-full border border-line bg-cream px-4 py-2.5 text-[12px] font-semibold text-ink transition hover:border-ink/25 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {vehicle?.activo ? "Despublicar" : "Guardar borrador"}
      </button>
      <button
        type="button"
        onClick={() => void save("publish")}
        disabled={saving}
        className="inline-flex items-center gap-2 rounded-full bg-lime px-5 py-2.5 text-[12px] font-bold text-ink transition hover:bg-lime-soft disabled:cursor-not-allowed disabled:opacity-50"
      >
        {saving ? (
          <Sparkles className="h-4 w-4 animate-pulse" />
        ) : (
          <Check className="h-4 w-4" />
        )}
        {saving
          ? saveStage ?? "Guardando..."
          : vehicle?.activo
            ? "Guardar cambios"
            : "Publicar"}
      </button>
    </div>
  );

  return (
    <div className="pb-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <button
            type="button"
            onClick={handleCancel}
            disabled={saving}
            className="inline-flex items-center gap-1.5 text-[11px] font-bold text-moss transition hover:text-ink disabled:opacity-50"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Volver al stock
          </button>
          <p className="mt-4 text-[10px] font-bold uppercase tracking-[0.2em] text-moss">
            {isNew ? "Nuevo vehículo" : "Editar ficha"}
          </p>
          <h2 className="mt-1.5 max-w-[760px] text-[28px] font-extrabold leading-tight tracking-[-0.05em] text-ink sm:text-[36px]">
            {isNew ? "Cargar vehículo" : vehicleTitle(vehicle)}
          </h2>
          <p className="mt-2 max-w-[680px] text-[13px] leading-relaxed text-muted">
            Completá los datos que se ven en la card y en la ficha. Las fotos se
            convierten a WebP y se suben al guardar.
          </p>
        </div>
        {actions}
      </div>

      {formError && (
        <div
          role="alert"
          className="mt-5 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[12px] leading-relaxed text-red-700"
        >
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{formError}</span>
        </div>
      )}

      <div className="mt-6 grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-5">
          <SectionCard
            icon={<Tag className="h-4 w-4" />}
            title="Publicación"
            description="La categoría define si se muestra como 0KM, usado, moto o patineta. El destacado se aplica al publicar."
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Categoría" required>
                <select
                  value={form.categoryId}
                  onChange={(event) =>
                    update("categoryId", event.target.value)
                  }
                  className={inputClass}
                >
                  <option value="" disabled>
                    Elegir categoría
                  </option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.nombre}
                    </option>
                  ))}
                </select>
              </Field>

              <div className="rounded-xl border border-line bg-cream/45 px-3.5 py-3">
                <p className={labelClass}>Estado actual</p>
                <p className="mt-1 text-[13px] font-bold text-ink">
                  {vehicle?.activo ? "Publicado" : "Borrador"}
                </p>
                <p className="mt-1 text-[10.5px] leading-relaxed text-muted">
                  {vehicle?.activo
                    ? "Visible en el sitio público."
                    : "Oculto hasta que lo publiques."}
                </p>
              </div>
            </div>

            <div className="mt-4 rounded-xl border border-line bg-cream/45 px-4 py-3.5">
              <Toggle
                checked={form.featured}
                onChange={(next) => update("featured", next)}
                label="Destacar en portada"
                description="Al publicar, se quita el destacado de los demás vehículos para que haya uno solo."
              />
            </div>
          </SectionCard>

          <SectionCard
            icon={<CarIcon className="h-4 w-4" />}
            title="Datos principales"
            description="Estos datos alimentan el título, la card y los filtros del catálogo."
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Marca" required>
                <input
                  type="text"
                  value={form.brand}
                  onChange={(event) => update("brand", event.target.value)}
                  placeholder="Ej. Toyota"
                  className={inputClass}
                />
              </Field>
              <Field label="Modelo" required>
                <input
                  type="text"
                  value={form.model}
                  onChange={(event) => update("model", event.target.value)}
                  placeholder="Ej. Yaris"
                  className={inputClass}
                />
              </Field>
              <Field
                label="Versión"
                hint={
                  specsReady
                    ? "Se muestra como subtítulo en la card."
                    : "La migración de ficha técnica todavía no está aplicada."
                }
              >
                <input
                  type="text"
                  value={form.version}
                  onChange={(event) => update("version", event.target.value)}
                  placeholder="Ej. XLS Pack 1.5 CVT"
                  disabled={!specsReady}
                  className={inputClass}
                />
              </Field>
              <Field label="Año">
                <input
                  type="number"
                  inputMode="numeric"
                  min={1950}
                  max={new Date().getFullYear() + 1}
                  value={form.year}
                  onChange={(event) => update("year", event.target.value)}
                  placeholder="Ej. 2021"
                  className={inputClass}
                />
              </Field>
              <Field label="Kilometraje">
                <input
                  type="text"
                  inputMode="numeric"
                  value={form.km}
                  onChange={(event) => update("km", event.target.value)}
                  placeholder="Ej. 19000"
                  className={inputClass}
                />
              </Field>
              <Field label="Color">
                <input
                  type="text"
                  value={form.color}
                  onChange={(event) => update("color", event.target.value)}
                  placeholder="Ej. Blanco"
                  className={inputClass}
                />
              </Field>
              <div className="sm:col-span-2">
                <div className="flex items-center justify-between gap-3">
                  <span className={labelClass}>Título público</span>
                  <button
                    type="button"
                    onClick={() => update("title", autoTitle)}
                    disabled={!autoTitle}
                    className="text-[10px] font-bold text-moss underline underline-offset-2 transition hover:text-ink disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Usar automático
                  </button>
                </div>
                <input
                  type="text"
                  value={form.title}
                  onChange={(event) => update("title", event.target.value)}
                  placeholder={autoTitle || "Se genera con marca, modelo y versión"}
                  className={cn(inputClass, "mt-1.5")}
                />
                <p className="mt-1 text-[10px] leading-relaxed text-muted">
                  Si queda vacío, se usa “{autoTitle || "marca modelo versión"}”.
                  Podés escribir un título comercial propio.
                </p>
              </div>
            </div>
          </SectionCard>

          <SectionCard
            icon={<Cog className="h-4 w-4" />}
            title="Ficha técnica"
            description="Se muestra en la card y en el detalle. Si un dato queda vacío, el sitio intenta inferirlo desde el título y la descripción."
          >
            {!specsReady && (
              <div className="mb-4 rounded-xl border border-amber-300/80 bg-amber-50 px-4 py-3 text-[11.5px] leading-relaxed text-amber-900">
                La migración de la ficha técnica todavía no está aplicada. Podés
                guardar el resto de la ficha; estos campos se habilitan al
                ejecutar <code>supabase-stock-specs.sql</code> en Supabase.
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Transmisión">
                <input
                  type="text"
                  list="transmission-options"
                  value={form.transmission}
                  onChange={(event) =>
                    update("transmission", event.target.value)
                  }
                  placeholder="Ej. Automática (CVT)"
                  disabled={!specsReady}
                  className={inputClass}
                />
              </Field>
              <Field label="Combustible">
                <input
                  type="text"
                  list="fuel-options"
                  value={form.fuel}
                  onChange={(event) => update("fuel", event.target.value)}
                  placeholder="Ej. Nafta"
                  disabled={!specsReady}
                  className={inputClass}
                />
              </Field>
              <Field label="Carrocería">
                <input
                  type="text"
                  list="body-options"
                  value={form.body}
                  onChange={(event) => update("body", event.target.value)}
                  placeholder="Ej. SUV"
                  disabled={!specsReady}
                  className={inputClass}
                />
              </Field>
              <Field label="Tracción">
                <input
                  type="text"
                  list="drive-options"
                  value={form.drive}
                  onChange={(event) => update("drive", event.target.value)}
                  placeholder="Ej. 4x4"
                  disabled={!specsReady}
                  className={inputClass}
                />
              </Field>
              <Field label="Potencia (CV)">
                <input
                  type="number"
                  inputMode="numeric"
                  min={1}
                  value={form.power}
                  onChange={(event) => update("power", event.target.value)}
                  placeholder="Ej. 180"
                  disabled={!specsReady}
                  className={inputClass}
                />
              </Field>
              <div className="flex items-end">
                <button
                  type="button"
                  onClick={applyInference}
                  disabled={!specsReady || saving}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-forest/20 bg-lime/25 px-4 py-2.5 text-[11.5px] font-bold text-forest transition hover:bg-lime disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Sparkles className="h-4 w-4" />
                  Autocompletar desde el texto
                </button>
              </div>
            </div>

            <datalist id="transmission-options">
              <option value="Manual" />
              <option value="Automática" />
              <option value="Automática (CVT)" />
              <option value="Automática (DSG)" />
              <option value="Automatizada" />
            </datalist>
            <datalist id="fuel-options">
              <option value="Nafta" />
              <option value="Diésel" />
              <option value="Híbrido" />
              <option value="Eléctrico" />
              <option value="GNC" />
            </datalist>
            <datalist id="body-options">
              <option value="Hatchback" />
              <option value="Sedán" />
              <option value="SUV" />
              <option value="Pick-up" />
              <option value="Utilitario" />
              <option value="Coupé" />
              <option value="Monovolumen" />
            </datalist>
            <datalist id="drive-options">
              <option value="Delantera" />
              <option value="Trasera" />
              <option value="4x2" />
              <option value="4x4" />
            </datalist>

            {autofillNotice && (
              <p className="mt-4 rounded-xl border border-forest/15 bg-forest/5 px-4 py-3 text-[11px] leading-relaxed text-forest">
                {autofillNotice}
              </p>
            )}
          </SectionCard>

          <SectionCard
            icon={<Tag className="h-4 w-4" />}
            title="Precio y contacto"
            description="Si no cargás un precio, el sitio muestra “Consultar precio”. No inventes importes."
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label="Precio en USD"
                hint="Opcional. Vacío = Consultar precio."
              >
                <input
                  type="text"
                  inputMode="numeric"
                  value={form.price}
                  onChange={(event) => update("price", event.target.value)}
                  placeholder="Ej. 18500"
                  className={inputClass}
                />
              </Field>
              <Field
                label="Mensaje de WhatsApp"
                hint="Opcional. Si queda vacío, se genera automáticamente."
              >
                <textarea
                  value={form.whatsappMsg}
                  onChange={(event) =>
                    update("whatsappMsg", event.target.value)
                  }
                  rows={3}
                  placeholder="¡Hola! Quiero consultar..."
                  className={cn(inputClass, "resize-y")}
                />
              </Field>
            </div>
          </SectionCard>

          <SectionCard
            icon={<Pencil className="h-4 w-4" />}
            title="Descripción y equipamiento"
            description="El resumen va arriba de la ficha. El equipamiento se muestra como lista de ítems."
          >
            <div className="grid gap-4">
              <Field
                label="Resumen"
                hint="Texto comercial breve. Podés dejarlo vacío si preferís solo equipamiento."
              >
                <textarea
                  value={form.summary}
                  onChange={(event) => update("summary", event.target.value)}
                  rows={4}
                  placeholder="Ej. Impecable estado, único dueño, service oficial..."
                  className={cn(inputClass, "resize-y")}
                />
              </Field>

              <Field
                label="Equipamiento"
                hint="Un ítem por línea. Al guardar se agregan viñetas automáticamente."
              >
                <textarea
                  value={form.equipment}
                  onChange={(event) => update("equipment", event.target.value)}
                  rows={7}
                  placeholder={"Aire acondicionado\nDirección asistida\nPantalla táctil"}
                  className={cn(inputClass, "resize-y")}
                />
              </Field>

              <div className="rounded-xl border border-line bg-cream/45 p-3.5">
                <button
                  type="button"
                  onClick={() => setPasteOpen((current) => !current)}
                  className="flex w-full items-center justify-between gap-3 text-left"
                >
                  <span>
                    <span className="block text-[12px] font-bold text-ink">
                      Pegar texto de Instagram o WhatsApp
                    </span>
                    <span className="mt-0.5 block text-[10.5px] leading-relaxed text-muted">
                      Separa automáticamente el resumen y las viñetas.
                    </span>
                  </span>
                  <ChevronDown
                    className={cn(
                      "h-4 w-4 shrink-0 text-muted transition",
                      pasteOpen && "rotate-180"
                    )}
                  />
                </button>

                {pasteOpen && (
                  <div className="mt-3">
                    <textarea
                      value={pasteText}
                      onChange={(event) => setPasteText(event.target.value)}
                      rows={5}
                      placeholder="Pegá acá el texto original..."
                      className={cn(inputClass, "resize-y bg-paper")}
                    />
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={handlePasteSplit}
                        disabled={!pasteText.trim()}
                        className="rounded-full bg-ink px-4 py-2 text-[11px] font-bold text-cream transition hover:bg-forest disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Separar y reemplazar
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setPasteText("");
                          setPasteOpen(false);
                        }}
                        className="rounded-full border border-line bg-paper px-4 py-2 text-[11px] font-semibold text-ink transition hover:border-ink/25"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </SectionCard>

          <section
            id="stock-photos"
            className="rounded-2xl border border-line bg-paper p-5 sm:p-6"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-cream text-forest">
                  <ImageIcon className="h-4 w-4" />
                </span>
                <div>
                  <h3 className="text-[16px] font-extrabold tracking-[-0.025em] text-ink">
                    Fotos
                  </h3>
                  <p className="mt-1 text-[11.5px] leading-relaxed text-muted">
                    La primera foto es la portada de la card y de la ficha.
                    Hasta {MAX_VEHICLE_PHOTOS} imágenes.
                  </p>
                </div>
              </div>
              <span className="rounded-full border border-line bg-cream px-3 py-1 text-[10px] font-bold text-moss">
                {photos.length} / {MAX_VEHICLE_PHOTOS}
              </span>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="sr-only"
              onChange={(event) => {
                if (event.target.files) {
                  handlePhotoFiles(event.target.files);
                }
                event.currentTarget.value = "";
              }}
            />

            {photos.length < MAX_VEHICLE_PHOTOS && (
              <div
                onDragOver={(event) => event.preventDefault()}
                onDrop={handleDrop}
                className="mt-5 rounded-2xl border border-dashed border-line bg-cream/35 px-5 py-7 text-center transition hover:border-forest/30 hover:bg-cream/55"
              >
                <ImageIcon className="mx-auto h-7 w-7 text-moss" />
                <p className="mt-2 text-[12.5px] font-bold text-ink">
                  Arrastrá fotos acá o elegilas desde tu dispositivo
                </p>
                <p className="mx-auto mt-1 max-w-[440px] text-[10.5px] leading-relaxed text-muted">
                  JPG, PNG o WebP. Hasta 15 MB por foto. Se convierten a WebP y
                  se suben al guardar.
                </p>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="mt-3 inline-flex items-center gap-2 rounded-full bg-lime px-4 py-2.5 text-[11px] font-bold text-ink transition hover:bg-lime-soft"
                >
                  <Plus className="h-4 w-4" />
                  Elegir fotos
                </button>
              </div>
            )}

            {photos.length === 0 ? (
              <p className="mt-4 rounded-xl border border-line bg-cream/45 px-4 py-3 text-[11.5px] text-muted">
                Todavía no hay fotos. Podés guardar el borrador sin fotos, pero
                para publicar necesitás al menos una.
              </p>
            ) : (
              <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {photos.map((photo, index) => (
                  <div
                    key={photo.key}
                    className="group relative overflow-hidden rounded-xl border border-line bg-cream"
                  >
                    <img
                      src={photo.url}
                      alt={`Foto ${index + 1}`}
                      className="aspect-[4/3] w-full object-cover"
                    />
                    <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-2 p-2">
                      <span className="flex flex-wrap gap-1">
                        {index === 0 && (
                          <span className="rounded-full bg-lime px-2 py-1 text-[8px] font-extrabold uppercase tracking-[0.1em] text-ink">
                            Portada
                          </span>
                        )}
                        {photo.isNew && (
                          <span className="rounded-full bg-ink/80 px-2 py-1 text-[8px] font-bold uppercase tracking-[0.1em] text-cream backdrop-blur">
                            Nueva
                          </span>
                        )}
                      </span>
                      <button
                        type="button"
                        onClick={() => removePhoto(photo.key)}
                        aria-label={`Quitar foto ${index + 1}`}
                        className="grid h-7 w-7 place-items-center rounded-full border border-white/40 bg-paper/90 text-ink backdrop-blur transition hover:bg-ink hover:text-cream"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <div className="absolute inset-x-0 bottom-0 flex items-center gap-1 bg-gradient-to-t from-ink/75 to-transparent px-2 pb-2 pt-6">
                      {index > 0 && (
                        <button
                          type="button"
                          onClick={() => makeCover(photo.key)}
                          className="rounded-full bg-paper/90 px-2.5 py-1 text-[9px] font-bold text-ink backdrop-blur transition hover:bg-lime"
                        >
                          Usar portada
                        </button>
                      )}
                      <div className="ml-auto flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => movePhoto(photo.key, -1)}
                          disabled={index === 0}
                          aria-label={`Mover foto ${index + 1} antes`}
                          className="grid h-7 w-7 place-items-center rounded-full bg-paper/90 text-ink backdrop-blur transition hover:bg-lime disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          <ChevronDown className="h-3.5 w-3.5 rotate-180" />
                        </button>
                        <button
                          type="button"
                          onClick={() => movePhoto(photo.key, 1)}
                          disabled={index === photos.length - 1}
                          aria-label={`Mover foto ${index + 1} después`}
                          className="grid h-7 w-7 place-items-center rounded-full bg-paper/90 text-ink backdrop-blur transition hover:bg-lime disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          <ChevronDown className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        <aside className="xl:sticky xl:top-24 xl:self-start">
          <div className="rounded-2xl border border-line bg-paper p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-moss">
                  Vista previa
                </p>
                <h3 className="mt-1 text-[15px] font-extrabold tracking-[-0.025em] text-ink">
                  Card pública
                </h3>
              </div>
              <Eye className="h-4 w-4 text-muted" />
            </div>

            <article className="mt-4 overflow-hidden rounded-[1.35rem] border border-line/75 bg-paper">
              <div className="relative aspect-[4/3] overflow-hidden bg-sand">
                <img
                  src={cover}
                  alt={previewTitle}
                  onError={(event) => {
                    event.currentTarget.onerror = null;
                    event.currentTarget.src = FALLBACK_CAR_IMAGE;
                  }}
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-ink/25 via-transparent to-transparent" />
                <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-2 p-3">
                  {form.featured ? (
                    <span className="rounded-full bg-lime/95 px-2.5 py-1.5 text-[8px] font-extrabold uppercase tracking-[0.13em] text-ink">
                      Destacado
                    </span>
                  ) : (
                    <span />
                  )}
                  <span className="rounded-full border border-white/50 bg-cream/90 px-2.5 py-1.5 text-[8px] font-bold uppercase tracking-[0.1em] text-ink">
                    {photos.length} fotos
                  </span>
                </div>
                <div className="absolute bottom-3 left-3 flex items-center gap-1.5 rounded-full bg-ink/80 px-2.5 py-1.5 text-[8px] font-bold uppercase tracking-[0.12em] text-cream">
                  <span className="h-1 w-1 rounded-full bg-lime" />
                  {previewFuel}
                </div>
              </div>

              <div className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[8.5px] font-bold uppercase tracking-[0.2em] text-muted">
                      {form.brand.trim() || "Marca"}
                    </p>
                    <h4 className="mt-1 line-clamp-2 text-[16px] font-extrabold leading-tight tracking-[-0.025em] text-ink">
                      {previewTitle}
                    </h4>
                    <p className="mt-1 truncate text-[10px] leading-relaxed text-muted">
                      {previewVersion}
                    </p>
                  </div>
                  <span className="mt-0.5 shrink-0 rounded-full border border-line px-2 py-1 text-[8px] font-bold uppercase tracking-[0.08em] text-moss">
                    {previewCondition}
                  </span>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 border-y border-line/60 py-2.5">
                  {[
                    form.year.trim()
                      ? {
                          label: "Año",
                          value: form.year.trim(),
                          icon: Calendar,
                        }
                      : null,
                    form.km.trim()
                      ? {
                          label: "KM",
                          value: formatKm(previewKm),
                          icon: Gauge,
                        }
                      : null,
                    form.transmission.trim() &&
                    form.transmission.trim() !== "Consultar"
                      ? {
                          label: "Transmisión",
                          value: form.transmission.trim(),
                          icon: Cog,
                        }
                      : null,
                    previewPower
                      ? {
                          label: "Potencia",
                          value: `${previewPower} CV`,
                          icon: Zap,
                        }
                      : null,
                  ]
                    .filter((spec) => spec !== null)
                    .map((spec) => {
                      const Icon = spec.icon;
                      return (
                        <span
                          key={spec.label}
                          className="flex items-center gap-1.5 text-[9.5px] font-medium text-moss"
                        >
                          <Icon className="h-3.5 w-3.5 text-muted" />
                          {spec.value}
                        </span>
                      );
                    })}
                </div>

                <div className="mt-3 flex items-end justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[8px] font-bold uppercase tracking-[0.16em] text-muted">
                      Precio
                    </p>
                    <p className="mt-0.5 text-[14px] font-extrabold leading-tight tracking-[-0.03em] text-ink">
                      {formatPrice(previewPrice)}
                    </p>
                  </div>
                  <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-forest/20 bg-lime/25 px-2.5 py-1.5 text-[9px] font-bold text-forest">
                    <Whatsapp className="h-3.5 w-3.5" />
                    WhatsApp
                  </span>
                </div>

                <div className="mt-3 flex items-center justify-between rounded-full border border-ink/15 px-3.5 py-2 text-[10.5px] font-semibold text-ink">
                  Ver detalle
                  <ArrowLeft className="h-3.5 w-3.5 rotate-180" />
                </div>
              </div>
            </article>

            <div className="mt-4 rounded-xl border border-line bg-cream/45 px-3.5 py-3">
              <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-muted">
                Ficha
              </p>
              <p className="mt-1.5 line-clamp-4 text-[10.5px] leading-relaxed text-moss">
                {form.summary.trim() ||
                  "Sin resumen. La ficha mostrará directamente el equipamiento."}
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-[9.5px] text-muted">
                <span className="inline-flex items-center gap-1">
                  <Fuel className="h-3 w-3" />
                  {form.fuel.trim() || "Combustible a consultar"}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Check className="h-3 w-3" />
                  {form.equipment
                    .split(/\r?\n/)
                    .filter((line) => line.trim()).length}{" "}
                  ítems
                </span>
              </div>
            </div>

            {form.featured && (
              <p className="mt-3 flex items-start gap-1.5 text-[10px] leading-relaxed text-muted">
                <Star className="mt-0.5 h-3.5 w-3.5 shrink-0 text-forest" />
                Al publicar, este vehículo queda como destacado y se quita el
                destacado de los demás.
              </p>
            )}

            <a
              href={whatsappLink(
                form.whatsappMsg.trim() ||
                  `¡Hola! Quiero consultar el precio y disponibilidad del ${previewTitle}${
                    form.year.trim() ? ` (${form.year.trim()})` : ""
                  } que vi en su web.`
              )}
              target="_blank"
              rel="noreferrer"
              className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full border border-line bg-paper px-4 py-2.5 text-[11px] font-semibold text-ink transition hover:border-ink/25"
            >
              <Whatsapp className="h-4 w-4 text-forest" />
              Probar mensaje de WhatsApp
            </a>
          </div>
        </aside>
      </div>

      <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-5">
        <p className="text-[11px] text-muted">
          {saving
            ? saveStage ?? "Guardando..."
            : dirty
              ? "Hay cambios sin guardar."
              : "Sin cambios pendientes."}
        </p>
        {actions}
      </div>
    </div>
  );
}
