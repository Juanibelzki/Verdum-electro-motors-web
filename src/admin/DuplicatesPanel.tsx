import { useMemo, useState } from "react";
import { cn } from "../utils/cn";
import { AlertTriangle, Check, RefreshCw } from "../components/Icons";
import {
  categoryFor,
  deleteVehicleComplete,
  formatDateTime,
  vehicleCover,
  vehicleKmLabel,
  vehiclePriceLabel,
  vehicleStatusLabel,
  vehicleTitle,
  type AdminCategory,
  type AdminVehicle,
} from "./stockApi";

const KEPT_STORAGE_KEY = "verdun_admin_duplicates_kept";

const normalize = (value: unknown) =>
  String(value ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

const modelTokens = (vehicle: AdminVehicle) => {
  const raw = normalize(vehicle.modelo) || normalize(vehicle.nombre);
  return raw.split(" ").filter(Boolean);
};

const kmDigits = (vehicle: AdminVehicle) =>
  String(vehicle.km ?? "").replace(/[^\d]/g, "");

const similarity = (a: string[], b: string[]) => {
  const setA = new Set(a);
  const setB = new Set(b);
  let shared = 0;
  for (const token of setA) if (setB.has(token)) shared += 1;
  const total = setA.size + setB.size - shared;
  return total === 0 ? 0 : shared / total;
};

/**
 * Two vehicles look like the same car when they have the same type and year,
 * the same model family (first word of the model, ignoring the brand field,
 * which is often mistyped) and either the same km or a very similar model name.
 */
const looksDuplicated = (a: AdminVehicle, b: AdminVehicle) => {
  if ((normalize(a.tipo) || "auto") !== (normalize(b.tipo) || "auto")) {
    return false;
  }
  const year = normalize(a.año);
  if (!year || year !== normalize(b.año)) return false;

  const tokensA = modelTokens(a);
  const tokensB = modelTokens(b);
  if (!tokensA.length || tokensA[0] !== tokensB[0]) return false;

  const kmA = kmDigits(a);
  if (kmA && kmA === kmDigits(b)) return true;
  return similarity(tokensA, tokensB) >= 0.5;
};

const findGroups = (vehicles: AdminVehicle[]): AdminVehicle[][] => {
  const parent = vehicles.map((_, index) => index);
  const find = (i: number): number => {
    while (parent[i] !== i) {
      parent[i] = parent[parent[i]];
      i = parent[i];
    }
    return i;
  };

  for (let i = 0; i < vehicles.length; i += 1) {
    for (let j = i + 1; j < vehicles.length; j += 1) {
      if (looksDuplicated(vehicles[i], vehicles[j])) {
        parent[find(j)] = find(i);
      }
    }
  }

  const buckets = new Map<number, AdminVehicle[]>();
  vehicles.forEach((vehicle, index) => {
    const root = find(index);
    const list = buckets.get(root) ?? [];
    list.push(vehicle);
    buckets.set(root, list);
  });
  return [...buckets.values()].filter((list) => list.length > 1);
};

const readKept = (): Set<string> => {
  try {
    const raw = localStorage.getItem(KEPT_STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as unknown) : [];
    return new Set(Array.isArray(parsed) ? parsed.map(String) : []);
  } catch {
    return new Set();
  }
};

const writeKept = (kept: Set<string>) => {
  try {
    localStorage.setItem(KEPT_STORAGE_KEY, JSON.stringify([...kept]));
  } catch {
    // sin almacenamiento: la decisión vale solo en esta sesión
  }
};

type Group = { key: string; vehicles: AdminVehicle[] };

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

export default function DuplicatesPanel({
  vehicles,
  categories,
  loading,
  error,
  onReload,
}: {
  vehicles: AdminVehicle[];
  categories: AdminCategory[];
  loading: boolean;
  error: string | null;
  onReload: () => void;
}) {
  const [kept, setKept] = useState<Set<string>>(() => readKept());
  const [busyId, setBusyId] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ ok: boolean; text: string } | null>(
    null
  );

  const groups = useMemo<Group[]>(() => {
    return findGroups(vehicles)
      .filter((list) => list.some((vehicle) => !kept.has(vehicle.id)))
      .map((list) => ({ key: list.map((v) => v.id).join("|"), vehicles: list }))
      .sort((a, b) => b.vehicles.length - a.vehicles.length);
  }, [vehicles, kept]);

  const extraCount = groups.reduce((sum, g) => sum + g.vehicles.length - 1, 0);

  const toggleKept = (id: string) => {
    setKept((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      writeKept(next);
      return next;
    });
  };

  const handleDelete = async (vehicle: AdminVehicle) => {
    if (busyId) return;
    const confirmed = window.confirm(
      `¿Eliminar "${vehicleTitle(vehicle)}" definitivamente y borrar todas sus fotos? Esta acción no se puede deshacer.`
    );
    if (!confirmed) return;

    setBusyId(vehicle.id);
    setNotice(null);
    try {
      await deleteVehicleComplete(vehicle.id, vehicle.photos);
      setNotice({ ok: true, text: `Se eliminó "${vehicleTitle(vehicle)}".` });
      onReload();
    } catch (cause) {
      setNotice({
        ok: false,
        text:
          cause instanceof Error
            ? cause.message
            : "No se pudo eliminar el vehículo. Intentá de nuevo.",
      });
    } finally {
      setBusyId(null);
    }
  };

  return (
    <section>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-moss">
            Vehículos
          </p>
          <h2 className="mt-1.5 text-[30px] font-extrabold tracking-[-0.05em] text-ink sm:text-[38px]">
            Autos repetidos
          </h2>
          <p className="mt-2 max-w-[680px] text-[13px] leading-relaxed text-muted">
            Agrupamos los vehículos del mismo año y modelo que tienen el mismo
            kilometraje o un nombre muy parecido. Para cada
            uno elegí <strong>Eliminar</strong> (se borra de la base junto con
            sus fotos) o <strong>Dejar</strong> (lo marcás como válido y deja de
            aparecer como repetido).
          </p>
        </div>
        <button
          type="button"
          onClick={onReload}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-full border border-line bg-paper px-4 py-2.5 text-[12px] font-semibold text-ink transition hover:border-ink/25 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
          Recargar
        </button>
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
          {notice.text}
        </div>
      )}

      {error && (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[12px] text-red-700">
          {error}
        </div>
      )}

      <div className="mt-6 flex items-center gap-2 rounded-2xl border border-line bg-paper px-4 py-3 text-[12.5px] text-ink">
        <AlertTriangle className="h-4 w-4 shrink-0 text-moss" />
        {loading
          ? "Buscando repetidos..."
          : groups.length === 0
            ? "No hay autos repetidos pendientes de revisar."
            : `${groups.length} ${groups.length === 1 ? "grupo" : "grupos"} con repetidos (${extraCount} ${extraCount === 1 ? "auto de más" : "autos de más"}).`}
      </div>

      <div className="mt-5 space-y-6">
        {groups.map((group) => {
          const first = group.vehicles[0];
          return (
            <div
              key={group.key}
              className="rounded-2xl border border-line bg-paper p-4 sm:p-5"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-[16px] font-extrabold tracking-[-0.03em] text-ink">
                  {[first.marca, first.modelo, first.año]
                    .filter(Boolean)
                    .join(" ")}
                </h3>
                <span className="rounded-full bg-ink px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-cream">
                  {group.vehicles.length} registros
                </span>
              </div>

              <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {group.vehicles.map((vehicle) => {
                  const isKept = kept.has(vehicle.id);
                  const busy = busyId === vehicle.id;
                  const category = categoryFor(vehicle, categories);
                  return (
                    <article
                      key={vehicle.id}
                      className={cn(
                        "flex flex-col overflow-hidden rounded-xl border bg-cream",
                        isKept ? "border-lime/60" : "border-line"
                      )}
                    >
                      <div className="relative aspect-[4/3] bg-ink/5">
                        <img
                          src={vehicleCover(vehicle)}
                          alt={vehicleTitle(vehicle)}
                          loading="lazy"
                          className="h-full w-full object-cover"
                        />
                        <span className="absolute left-2 top-2 rounded-full bg-ink/80 px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.12em] text-cream">
                          {vehicle.photos.length}{" "}
                          {vehicle.photos.length === 1 ? "foto" : "fotos"}
                        </span>
                        {isKept && (
                          <span className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-full bg-lime px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.12em] text-ink">
                            <Check className="h-3 w-3" />
                            Dejado
                          </span>
                        )}
                      </div>

                      <div className="flex flex-1 flex-col p-3.5">
                        <h4 className="truncate text-[14px] font-extrabold tracking-[-0.02em] text-ink">
                          {vehicleTitle(vehicle)}
                        </h4>
                        <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2">
                          <Field label="Precio" value={vehiclePriceLabel(vehicle)} />
                          <Field label="Km" value={vehicleKmLabel(vehicle)} />
                          <Field label="Año" value={String(vehicle.año ?? "—")} />
                          <Field label="Color" value={vehicle.color || "—"} />
                          <Field label="Versión" value={vehicle.version || "—"} />
                          <Field
                            label="Categoría"
                            value={category?.nombre ?? vehicle.categoria ?? "—"}
                          />
                          <Field
                            label="Estado"
                            value={vehicleStatusLabel(vehicle)}
                          />
                          <Field
                            label="Creado"
                            value={formatDateTime(vehicle.created_at)}
                          />
                        </dl>
                        {vehicle.slug && (
                          <p className="mt-2 truncate text-[10px] text-muted">
                            {vehicle.slug}
                          </p>
                        )}

                        <div className="mt-4 flex gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => toggleKept(vehicle.id)}
                            disabled={busy}
                            className={cn(
                              "flex-1 rounded-full border px-3 py-2 text-[12px] font-bold transition disabled:opacity-50",
                              isKept
                                ? "border-line bg-paper text-muted hover:text-ink"
                                : "border-lime bg-lime text-ink hover:bg-lime-soft"
                            )}
                          >
                            {isKept ? "Deshacer" : "Dejar"}
                          </button>
                          <button
                            type="button"
                            onClick={() => void handleDelete(vehicle)}
                            disabled={busyId !== null}
                            className="flex-1 rounded-full border border-red-200 bg-red-50 px-3 py-2 text-[12px] font-bold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {busy ? "Eliminando..." : "Eliminar"}
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
