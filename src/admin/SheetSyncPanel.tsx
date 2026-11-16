import { useCallback, useEffect, useMemo, useState } from "react";
import { cn } from "../utils/cn";
import {
  ArrowUpRight,
  Check,
  Plus,
  RefreshCw,
} from "../components/Icons";
import { formatKm } from "../data/cars";
import {
  SHEET_CSV_URL,
  SHEET_URL,
  compareWithWeb,
  normalizeText,
  parseSheet,
  type SheetVehicle,
} from "./sheetSync";
import {
  saveVehicle,
  unpublishVehicle,
  vehicleCover,
  vehicleKmLabel,
  vehicleTitle,
  type AdminCategory,
  type AdminVehicle,
} from "./stockApi";

const IGNORED_KEY = "verdun_admin_sheet_ignored";
const KEPT_KEY = "verdun_admin_sheet_kept";

const readSet = (key: string): Set<string> => {
  try {
    const raw = localStorage.getItem(key);
    const parsed = raw ? (JSON.parse(raw) as unknown) : [];
    return new Set(Array.isArray(parsed) ? parsed.map(String) : []);
  } catch {
    return new Set();
  }
};

const writeSet = (key: string, value: Set<string>) => {
  try {
    localStorage.setItem(key, JSON.stringify([...value]));
  } catch {
    // sin almacenamiento: la decisión vale solo en esta sesión
  }
};

const defaultCategorySlug = (item: SheetVehicle) =>
  normalizeText(item.section) === "moto"
    ? "motos"
    : item.km === 0
      ? "0km"
      : "usados";

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-[9px] font-bold uppercase tracking-[0.14em] text-muted">
        {label}
      </dt>
      <dd className="truncate text-[12px] font-semibold text-ink">{value}</dd>
    </div>
  );
}

function SectionTitle({
  title,
  count,
  hint,
}: {
  title: string;
  count: number;
  hint: string;
}) {
  return (
    <div className="mb-3 mt-8">
      <div className="flex items-center gap-2">
        <h3 className="text-[18px] font-extrabold tracking-[-0.03em] text-ink">
          {title}
        </h3>
        <span className="rounded-full bg-ink px-2.5 py-0.5 text-[10px] font-bold text-cream">
          {count}
        </span>
      </div>
      <p className="mt-1 text-[12px] text-muted">{hint}</p>
    </div>
  );
}

const inputClass =
  "w-full rounded-xl border border-line bg-paper px-3 py-2 text-[12px] text-ink outline-none transition focus:border-ink/40";

export default function SheetSyncPanel({
  vehicles,
  categories,
  specsReady,
  loading: stockLoading,
  onReload,
}: {
  vehicles: AdminVehicle[];
  categories: AdminCategory[];
  specsReady: boolean;
  loading: boolean;
  onReload: () => void;
}) {
  const [sheet, setSheet] = useState<SheetVehicle[] | null>(null);
  const [sheetLoading, setSheetLoading] = useState(true);
  const [sheetError, setSheetError] = useState<string | null>(null);
  const [loadedAt, setLoadedAt] = useState<Date | null>(null);
  const [ignored, setIgnored] = useState<Set<string>>(() => readSet(IGNORED_KEY));
  const [kept, setKept] = useState<Set<string>>(() => readSet(KEPT_KEY));
  const [categoryChoice, setCategoryChoice] = useState<Record<string, string>>({});
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [bulkBusy, setBulkBusy] = useState(false);
  const [notice, setNotice] = useState<{ ok: boolean; text: string } | null>(null);

  const loadSheet = useCallback(async () => {
    setSheetLoading(true);
    setSheetError(null);
    try {
      const response = await fetch(SHEET_CSV_URL, { cache: "no-store" });
      if (!response.ok) throw new Error(`Google respondió ${response.status}`);
      const text = await response.text();
      const parsed = parseSheet(text);
      if (!parsed.length) {
        throw new Error("La planilla no tiene vehículos con año reconocible.");
      }
      setSheet(parsed);
      setLoadedAt(new Date());
    } catch (cause) {
      setSheetError(
        `No se pudo leer la planilla. Verificá que siga compartida como "cualquiera con el enlace puede ver". ${
          cause instanceof Error ? `(${cause.message})` : ""
        }`
      );
    } finally {
      setSheetLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadSheet();
  }, [loadSheet]);

  const comparison = useMemo(
    () => (sheet ? compareWithWeb(sheet, vehicles) : null),
    [sheet, vehicles]
  );

  const added = comparison?.added.filter((item) => !ignored.has(item.key)) ?? [];
  const removed = comparison?.removed.filter((item) => !kept.has(item.id)) ?? [];
  const matched = comparison?.matched ?? [];
  const loading = sheetLoading || stockLoading;

  const categoryFor = (item: SheetVehicle) => {
    const chosen = categoryChoice[item.key];
    const slug = chosen ?? defaultCategorySlug(item);
    return (
      categories.find((category) => category.id === chosen) ??
      categories.find((category) => category.slug === slug) ??
      null
    );
  };

  const toggle = (
    storageKey: string,
    setter: (value: Set<string>) => void,
    current: Set<string>,
    id: string
  ) => {
    const next = new Set(current);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    writeSet(storageKey, next);
    setter(next);
  };

  const createFromSheet = async (item: SheetVehicle) => {
    const category = categoryFor(item);
    if (!category) throw new Error("No se encontró la categoría para este vehículo.");
    await saveVehicle(
      {
        category,
        nombre: "",
        marca: item.brand,
        modelo: item.model,
        version: "",
        año: String(item.year),
        km: item.km == null ? "" : String(item.km),
        color: item.color,
        precio: item.priceUsd == null ? "" : String(item.priceUsd),
        descripcion: "",
        whatsappMsg: "",
        transmision: "",
        combustible: "",
        carroceria: "",
        traccion: "",
        potencia: "",
        destacado: false,
        activo: false,
        specsReady,
      },
      crypto.randomUUID(),
      true
    );
  };

  const fillOne = async (item: SheetVehicle) => {
    if (busyKey || bulkBusy) return;
    setBusyKey(item.key);
    setNotice(null);
    try {
      await createFromSheet(item);
      setNotice({
        ok: true,
        text: `Se creó "${item.brand} ${item.model}" como borrador. Cargale las fotos desde Stock para publicarlo.`,
      });
      onReload();
    } catch (cause) {
      setNotice({
        ok: false,
        text: cause instanceof Error ? cause.message : "No se pudo crear el vehículo.",
      });
    } finally {
      setBusyKey(null);
    }
  };

  const fillAll = async () => {
    if (busyKey || bulkBusy || !added.length) return;
    const confirmed = window.confirm(
      `Se van a crear ${added.length} vehículos como borrador, sin fotos y sin publicar. ¿Continuar?`
    );
    if (!confirmed) return;

    setBulkBusy(true);
    setNotice(null);
    let done = 0;
    try {
      for (const item of added) {
        await createFromSheet(item);
        done += 1;
      }
      setNotice({
        ok: true,
        text: `Se crearon ${done} vehículos como borrador. Cargales las fotos desde Stock para publicarlos.`,
      });
    } catch (cause) {
      setNotice({
        ok: false,
        text: `Se crearon ${done} y después falló: ${
          cause instanceof Error ? cause.message : "error desconocido"
        }`,
      });
    } finally {
      setBulkBusy(false);
      onReload();
    }
  };

  const unpublish = async (vehicle: AdminVehicle) => {
    if (busyKey || bulkBusy) return;
    const confirmed = window.confirm(
      `¿Sacar "${vehicleTitle(vehicle)}" del sitio? Queda como borrador y no se borra.`
    );
    if (!confirmed) return;

    setBusyKey(vehicle.id);
    setNotice(null);
    try {
      await unpublishVehicle(vehicle.id);
      setNotice({
        ok: true,
        text: `"${vehicleTitle(vehicle)}" ya no se muestra en el sitio (quedó como borrador).`,
      });
      onReload();
    } catch (cause) {
      setNotice({
        ok: false,
        text: cause instanceof Error ? cause.message : "No se pudo despublicar.",
      });
    } finally {
      setBusyKey(null);
    }
  };

  const reloadAll = () => {
    onReload();
    void loadSheet();
  };

  return (
    <section>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-moss">
            Vehículos
          </p>
          <h2 className="mt-1.5 text-[30px] font-extrabold tracking-[-0.05em] text-ink sm:text-[38px]">
            Sincronizar con planilla
          </h2>
          <p className="mt-2 max-w-[700px] text-[13px] leading-relaxed text-muted">
            Compara la lista de Google Sheets con los autos de la web. Te avisa
            cuáles se agregaron a la planilla, cuáles dejaron de estar, y
            podés crear la ficha automáticamente (como borrador, sin fotos).
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <a
            href={SHEET_URL}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 rounded-full border border-line bg-paper px-4 py-2.5 text-[12px] font-semibold text-ink transition hover:border-ink/25"
          >
            Abrir planilla
            <ArrowUpRight className="h-3.5 w-3.5" />
          </a>
          <button
            type="button"
            onClick={reloadAll}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-full bg-lime px-5 py-2.5 text-[12px] font-bold text-ink transition hover:bg-lime-soft disabled:opacity-50"
          >
            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
            Comparar de nuevo
          </button>
        </div>
      </div>

      {notice && (
        <div
          role="status"
          className={cn(
            "mt-4 rounded-xl border px-4 py-3 text-[12px]",
            notice.ok
              ? "border-lime/40 bg-lime/15 text-ink"
              : "border-red-200 bg-red-50 text-red-700"
          )}
        >
          {notice.text}{" "}
          {notice.ok && notice.text.includes("fotos") && (
            <a href="#stock" className="font-bold underline underline-offset-2">
              Ir a Stock
            </a>
          )}
        </div>
      )}

      {sheetError && (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[12px] text-red-700">
          {sheetError}
        </div>
      )}

      <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          ["En la planilla", sheet?.length],
          ["Coinciden", comparison ? matched.length : undefined],
          ["Nuevos en planilla", comparison ? added.length : undefined],
          ["Solo en la web", comparison ? removed.length : undefined],
        ].map(([label, value]) => (
          <div key={label as string} className="rounded-2xl border border-line bg-paper p-4">
            <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-muted">
              {label}
            </p>
            <p className="mt-1 text-[26px] font-extrabold tracking-[-0.04em] text-ink">
              {loading || value == null ? "—" : value}
            </p>
          </div>
        ))}
      </div>
      {loadedAt && (
        <p className="mt-2 text-[10.5px] text-muted">
          Planilla leída a las{" "}
          {loadedAt.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })}
          . Solo se usan modelo, color, año, km y el precio en USD; el resto de
          las columnas no se copia.
        </p>
      )}

      {comparison && (
        <>
          <SectionTitle
            title="Nuevos en la planilla"
            count={added.length}
            hint="Están en la planilla pero no encontramos su ficha en la web."
          />
          {added.length > 0 && (
            <button
              type="button"
              onClick={() => void fillAll()}
              disabled={bulkBusy || busyKey !== null}
              className="mb-4 inline-flex items-center gap-2 rounded-full border border-lime bg-lime px-4 py-2 text-[12px] font-bold text-ink transition hover:bg-lime-soft disabled:opacity-50"
            >
              <Plus className="h-4 w-4" />
              {bulkBusy ? "Creando..." : `Rellenar los ${added.length} automáticamente`}
            </button>
          )}
          {added.length === 0 && (
            <p className="rounded-xl border border-line bg-paper px-4 py-3 text-[12.5px] text-muted">
              No hay autos nuevos en la planilla.
            </p>
          )}
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {added.map((item) => (
              <article
                key={item.key}
                className="flex flex-col rounded-xl border border-line bg-paper p-4"
              >
                <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-moss">
                  {item.brand}
                </p>
                <h4 className="mt-1 text-[14px] font-extrabold tracking-[-0.02em] text-ink">
                  {item.model}
                </h4>
                <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2">
                  <Field label="Año" value={String(item.year)} />
                  <Field label="Km" value={formatKm(item.km)} />
                  <Field label="Color" value={item.color || "—"} />
                  <Field label="Precio planilla" value={item.priceLabel || "—"} />
                </dl>
                <label className="mt-3 block">
                  <span className="text-[9px] font-bold uppercase tracking-[0.14em] text-muted">
                    Categoría
                  </span>
                  <select
                    value={categoryFor(item)?.id ?? ""}
                    onChange={(event) =>
                      setCategoryChoice((current) => ({
                        ...current,
                        [item.key]: event.target.value,
                      }))
                    }
                    className={cn(inputClass, "mt-1")}
                  >
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.nombre}
                      </option>
                    ))}
                  </select>
                </label>
                <p className="mt-2 text-[10.5px] text-muted">
                  Se crea como borrador sin fotos.
                  {item.priceUsd == null && " El precio queda en “Consultar”."}
                </p>
                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    onClick={() => void fillOne(item)}
                    disabled={busyKey !== null || bulkBusy}
                    className="flex-1 rounded-full bg-lime px-3 py-2 text-[12px] font-bold text-ink transition hover:bg-lime-soft disabled:opacity-50"
                  >
                    {busyKey === item.key ? "Creando..." : "Rellenar automáticamente"}
                  </button>
                  <button
                    type="button"
                    onClick={() => toggle(IGNORED_KEY, setIgnored, ignored, item.key)}
                    disabled={busyKey !== null || bulkBusy}
                    className="rounded-full border border-line bg-cream px-3 py-2 text-[12px] font-semibold text-muted transition hover:text-ink disabled:opacity-50"
                  >
                    Ignorar
                  </button>
                </div>
              </article>
            ))}
          </div>

          <SectionTitle
            title="Están en la web pero ya no en la planilla"
            count={removed.length}
            hint="Posiblemente se vendieron o salieron del stock. Despublicalos o dejalos."
          />
          {removed.length === 0 && (
            <p className="rounded-xl border border-line bg-paper px-4 py-3 text-[12.5px] text-muted">
              Todos los autos publicados en la web figuran en la planilla.
            </p>
          )}
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {removed.map((vehicle) => (
              <article
                key={vehicle.id}
                className="flex flex-col overflow-hidden rounded-xl border border-line bg-paper"
              >
                <div className="aspect-[4/3] bg-ink/5">
                  <img
                    src={vehicleCover(vehicle)}
                    alt={vehicleTitle(vehicle)}
                    loading="lazy"
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="flex flex-1 flex-col p-4">
                  <h4 className="truncate text-[14px] font-extrabold tracking-[-0.02em] text-ink">
                    {vehicleTitle(vehicle)}
                  </h4>
                  <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2">
                    <Field label="Año" value={String(vehicle.año ?? "—")} />
                    <Field label="Km" value={vehicleKmLabel(vehicle)} />
                    <Field label="Color" value={vehicle.color || "—"} />
                    <Field label="Fotos" value={String(vehicle.photos.length)} />
                  </dl>
                  <div className="mt-4 flex gap-2">
                    <button
                      type="button"
                      onClick={() => void unpublish(vehicle)}
                      disabled={busyKey !== null || bulkBusy}
                      className="flex-1 rounded-full border border-red-200 bg-red-50 px-3 py-2 text-[12px] font-bold text-red-700 transition hover:bg-red-100 disabled:opacity-50"
                    >
                      {busyKey === vehicle.id ? "Guardando..." : "Despublicar"}
                    </button>
                    <button
                      type="button"
                      onClick={() => toggle(KEPT_KEY, setKept, kept, vehicle.id)}
                      disabled={busyKey !== null || bulkBusy}
                      className="flex-1 rounded-full border border-line bg-cream px-3 py-2 text-[12px] font-semibold text-ink transition hover:border-ink/25 disabled:opacity-50"
                    >
                      Dejar
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>

          {(ignored.size > 0 || kept.size > 0) && (
            <button
              type="button"
              onClick={() => {
                writeSet(IGNORED_KEY, new Set());
                writeSet(KEPT_KEY, new Set());
                setIgnored(new Set());
                setKept(new Set());
              }}
              className="mt-5 text-[11px] font-semibold text-muted underline underline-offset-2 hover:text-ink"
            >
              Volver a mostrar los que ignoré o dejé
            </button>
          )}

          <details className="mt-8 rounded-2xl border border-line bg-paper p-4">
            <summary className="cursor-pointer text-[13px] font-bold text-ink">
              <Check className="mr-1.5 inline h-4 w-4 text-moss" />
              Coinciden ({matched.length})
            </summary>
            <ul className="mt-3 divide-y divide-line text-[12px]">
              {matched.map(({ sheet: s, web }) => {
                const webKmDigits = String(web.km ?? "").replace(/[^\d]/g, "");
                const kmDiffers =
                  s.km != null && webKmDigits !== "" && String(s.km) !== webKmDigits;
                return (
                  <li key={web.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2">
                    <span className="min-w-0 flex-1 truncate font-semibold text-ink">
                      {vehicleTitle(web)}
                    </span>
                    <span className="text-muted">{s.year}</span>
                    {kmDiffers && (
                      <span className="rounded-full bg-lime/30 px-2 py-0.5 text-[10px] font-bold text-ink">
                        km planilla {formatKm(s.km)} · web {vehicleKmLabel(web)}
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          </details>
        </>
      )}
    </section>
  );
}
