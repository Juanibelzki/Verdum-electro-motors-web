import { useMemo, useState, type ReactNode } from "react";
import { Modal } from "../components/ui";
import { cn } from "../utils/cn";
import {
  ArrowUpRight,
  CarIcon,
  Check,
  Eye,
  ImageIcon,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Star,
  Tag,
} from "../components/Icons";
import StockEditor from "./StockEditor";
import {
  categoryFor,
  formatDateTime,
  vehicleCover,
  vehicleKmLabel,
  vehiclePriceLabel,
  vehicleStatusLabel,
  vehicleTitle,
  type AdminCategory,
  type AdminVehicle,
} from "./stockApi";

type StatusFilter =
  | "all"
  | "active"
  | "draft"
  | "noprice"
  | "nophoto"
  | "featured";

type SortOption = "recent" | "oldest" | "price-asc" | "price-desc" | "year-desc" | "km-asc";

type Notice = {
  tone: "success" | "error";
  text: string;
};

type StockPanelProps = {
  vehicles: AdminVehicle[];
  categories: AdminCategory[];
  loading: boolean;
  error: string | null;
  specsReady: boolean;
  onReload: () => void;
};

const inputClass =
  "w-full rounded-xl border border-line bg-paper px-3.5 py-2.5 text-[13px] text-ink outline-none transition placeholder:text-muted/60 focus:border-forest/40 focus:ring-2 focus:ring-lime/50";

const labelClass =
  "text-[10px] font-bold uppercase tracking-[0.16em] text-muted";

const numberFrom = (value: string | number | null | undefined) => {
  const number = Number.parseInt(String(value ?? "").replace(/[^\d]/g, ""), 10);
  return Number.isFinite(number) ? number : null;
};

const statusClass = (active: boolean) =>
  active
    ? "border-forest/20 bg-forest/10 text-forest"
    : "border-line bg-cream text-muted";

function Metric({
  icon,
  label,
  value,
  hint,
}: {
  icon: ReactNode;
  label: string;
  value: number | string;
  hint?: string;
}) {
  return (
    <div className="rounded-2xl border border-line bg-paper p-4">
      <div className="flex items-center justify-between gap-3">
        <span className="grid h-8 w-8 place-items-center rounded-full bg-cream text-forest">
          {icon}
        </span>
        <span className="text-[9px] font-bold uppercase tracking-[0.16em] text-muted">
          {label}
        </span>
      </div>
      <p className="mt-3 text-[28px] font-extrabold leading-none tracking-[-0.05em] text-ink">
        {value}
      </p>
      {hint && <p className="mt-1.5 text-[11px] leading-snug text-muted">{hint}</p>}
    </div>
  );
}

function NoticeBox({ notice }: { notice: Notice }) {
  return (
    <p
      role="status"
      className={cn(
        "mt-4 rounded-xl border px-4 py-3 text-[12px] font-medium leading-relaxed",
        notice.tone === "success"
          ? "border-forest/20 bg-forest/10 text-forest"
          : "border-red-200 bg-red-50 text-red-700"
      )}
    >
      {notice.text}
    </p>
  );
}

export default function StockPanel({
  vehicles,
  categories,
  loading,
  error,
  specsReady,
  onReload,
}: StockPanelProps) {
  const [query, setQuery] = useState("");
  const [categoryId, setCategoryId] = useState("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sort, setSort] = useState<SortOption>("recent");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editorMode, setEditorMode] = useState<"new" | string | null>(null);
  const [notice, setNotice] = useState<Notice | null>(null);

  const selected = useMemo(
    () => vehicles.find((vehicle) => vehicle.id === selectedId) ?? null,
    [vehicles, selectedId]
  );

  const editingVehicle = useMemo(
    () =>
      editorMode && editorMode !== "new"
        ? vehicles.find((vehicle) => vehicle.id === editorMode) ?? null
        : null,
    [editorMode, vehicles]
  );

  const counts = useMemo(() => {
    const active = vehicles.filter((vehicle) => vehicle.activo).length;
    return {
      total: vehicles.length,
      active,
      draft: vehicles.length - active,
      noPrice: vehicles.filter((vehicle) => vehicle.precio_numero == null).length,
      noPhotos: vehicles.filter((vehicle) => vehicle.photos.length === 0).length,
      featured: vehicles.filter((vehicle) => vehicle.destacado).length,
    };
  }, [vehicles]);

  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    const list = vehicles.filter((vehicle) => {
      if (categoryId !== "all" && vehicle.category_id !== categoryId) return false;
      if (statusFilter === "active" && !vehicle.activo) return false;
      if (statusFilter === "draft" && vehicle.activo) return false;
      if (statusFilter === "noprice" && vehicle.precio_numero != null) return false;
      if (statusFilter === "nophoto" && vehicle.photos.length > 0) return false;
      if (statusFilter === "featured" && !vehicle.destacado) return false;

      if (!normalizedQuery) return true;

      return [
        vehicleTitle(vehicle),
        vehicle.marca,
        vehicle.modelo,
        vehicle.color,
        vehicle.slug,
        categoryFor(vehicle, categories)?.nombre,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(normalizedQuery);
    });

    return [...list].sort((a, b) => {
      if (sort === "oldest") {
        return (a.created_at ?? "").localeCompare(b.created_at ?? "");
      }
      if (sort === "price-asc" || sort === "price-desc") {
        const aPrice = a.precio_numero ?? Number.POSITIVE_INFINITY;
        const bPrice = b.precio_numero ?? Number.POSITIVE_INFINITY;
        return sort === "price-asc" ? aPrice - bPrice : bPrice - aPrice;
      }
      if (sort === "year-desc") {
        return (numberFrom(b.año) ?? 0) - (numberFrom(a.año) ?? 0);
      }
      if (sort === "km-asc") {
        const aKm = numberFrom(a.km) ?? Number.POSITIVE_INFINITY;
        const bKm = numberFrom(b.km) ?? Number.POSITIVE_INFINITY;
        return aKm - bKm;
      }
      return (b.created_at ?? "").localeCompare(a.created_at ?? "");
    });
  }, [vehicles, categories, query, categoryId, statusFilter, sort]);

  const categoryCounts = useMemo(() => {
    const map = new Map<string, number>();
    for (const vehicle of vehicles) {
      if (!vehicle.category_id) continue;
      map.set(vehicle.category_id, (map.get(vehicle.category_id) ?? 0) + 1);
    }
    return map;
  }, [vehicles]);

  const filterChips: Array<{
    id: StatusFilter;
    label: string;
    count: number;
  }> = [
    { id: "all", label: "Todos", count: counts.total },
    { id: "active", label: "Publicados", count: counts.active },
    { id: "draft", label: "Borradores", count: counts.draft },
    { id: "noprice", label: "Sin precio", count: counts.noPrice },
    { id: "nophoto", label: "Sin fotos", count: counts.noPhotos },
    { id: "featured", label: "Destacados", count: counts.featured },
  ];

  const resetFilters = () => {
    setQuery("");
    setCategoryId("all");
    setStatusFilter("all");
    setSort("recent");
  };

  const handleReload = () => {
    setNotice(null);
    onReload();
  };

  const openEditor = (mode: "new" | string) => {
    setNotice(null);
    setSelectedId(null);
    setEditorMode(mode);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (editorMode) {
    if (editorMode !== "new" && !editingVehicle) {
      return (
        <div className="rounded-2xl border border-line bg-paper px-6 py-12 text-center">
          <p className="text-[16px] font-bold text-ink">
            No encontramos ese vehículo.
          </p>
          <p className="mx-auto mt-2 max-w-[460px] text-[12.5px] leading-relaxed text-muted">
            Puede haber cambiado mientras editabas. Volvé al stock para
            recargar la lista.
          </p>
          <button
            type="button"
            onClick={() => setEditorMode(null)}
            className="mt-4 rounded-full bg-ink px-5 py-2.5 text-[12px] font-bold text-cream transition hover:bg-forest"
          >
            Volver al stock
          </button>
        </div>
      );
    }

    return (
      <StockEditor
        key={editorMode}
        vehicle={editingVehicle}
        categories={categories}
        specsReady={specsReady}
        onCancel={() => setEditorMode(null)}
        onSaved={(message) => {
          setEditorMode(null);
          setNotice({ tone: "success", text: message });
          onReload();
        }}
      />
    );
  }

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-moss">
            Inventario
          </p>
          <h2 className="mt-1.5 text-[30px] font-extrabold tracking-[-0.05em] text-ink sm:text-[38px]">
            Stock
          </h2>
          <p className="mt-2 max-w-[680px] text-[13px] leading-relaxed text-muted">
            Revisá el inventario, editá cada ficha, cargá fotos y
            especificaciones, y publicá o despublicá vehículos.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleReload}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-full border border-line bg-paper px-4 py-2.5 text-[12px] font-semibold text-ink transition hover:border-ink/25 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
            Recargar
          </button>
          <button
            type="button"
            onClick={() => openEditor("new")}
            className="inline-flex items-center gap-2 rounded-full bg-lime px-5 py-2.5 text-[12px] font-bold text-ink transition hover:bg-lime-soft"
          >
            <Plus className="h-4 w-4" />
            Nuevo vehículo
          </button>
        </div>
      </div>

      {notice && <NoticeBox notice={notice} />}

      {error && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[12px] text-red-700">
          <span>{error}</span>
          <button
            type="button"
            onClick={handleReload}
            className="font-bold underline underline-offset-2"
          >
            Reintentar
          </button>
        </div>
      )}

      <div className="mt-6 grid grid-cols-2 gap-3 xl:grid-cols-5">
        <Metric
          icon={<CarIcon className="h-4 w-4" />}
          label="Total"
          value={loading ? "—" : counts.total}
          hint="Vehículos en la base"
        />
        <Metric
          icon={<Check className="h-4 w-4" />}
          label="Publicados"
          value={loading ? "—" : counts.active}
          hint="Visibles en el sitio"
        />
        <Metric
          icon={<Tag className="h-4 w-4" />}
          label="Sin precio"
          value={loading ? "—" : counts.noPrice}
          hint="Muestran Consultar"
        />
        <Metric
          icon={<ImageIcon className="h-4 w-4" />}
          label="Sin fotos"
          value={loading ? "—" : counts.noPhotos}
          hint="No se pueden publicar"
        />
        <Metric
          icon={<Star className="h-4 w-4" />}
          label="Destacados"
          value={loading ? "—" : counts.featured}
          hint="Uno debería ir a portada"
        />
      </div>

      <div className="mt-6 rounded-2xl border border-line bg-paper p-4">
        <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_220px_220px]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar por marca, modelo, color o slug..."
              aria-label="Buscar en el stock"
              className={cn(inputClass, "pl-10")}
            />
          </div>

          <label>
            <span className="sr-only">Categoría</span>
            <select
              value={categoryId}
              onChange={(event) => setCategoryId(event.target.value)}
              className={inputClass}
            >
              <option value="all">Todas las categorías</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.nombre} ({categoryCounts.get(category.id) ?? 0})
                </option>
              ))}
            </select>
          </label>

          <label>
            <span className="sr-only">Orden</span>
            <select
              value={sort}
              onChange={(event) => setSort(event.target.value as SortOption)}
              className={inputClass}
            >
              <option value="recent">Más recientes</option>
              <option value="oldest">Más antiguos</option>
              <option value="price-asc">Menor precio</option>
              <option value="price-desc">Mayor precio</option>
              <option value="year-desc">Año más reciente</option>
              <option value="km-asc">Menor kilometraje</option>
            </select>
          </label>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          {filterChips.map((chip) => (
            <button
              key={chip.id}
              type="button"
              onClick={() => setStatusFilter(chip.id)}
              aria-pressed={statusFilter === chip.id}
              className={cn(
                "rounded-full border px-3 py-1.5 text-[10.5px] font-bold transition",
                statusFilter === chip.id
                  ? "border-ink bg-ink text-cream"
                  : "border-line bg-cream/50 text-moss hover:border-ink/25 hover:text-ink"
              )}
            >
              {chip.label}
              <span
                className={cn(
                  "ml-1.5",
                  statusFilter === chip.id ? "text-cream/60" : "text-muted"
                )}
              >
                {chip.count}
              </span>
            </button>
          ))}
          {(query || categoryId !== "all" || statusFilter !== "all") && (
            <button
              type="button"
              onClick={resetFilters}
              className="ml-auto text-[11px] font-semibold text-muted underline underline-offset-2 transition hover:text-ink"
            >
              Limpiar filtros
            </button>
          )}
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between gap-3 text-[11px] text-muted">
        <p>
          Mostrando <strong className="text-ink">{filtered.length}</strong> de{" "}
          {vehicles.length} vehículos
        </p>
        {!specsReady && (
          <p className="text-right text-amber-700">
            Ficha técnica: migración pendiente
          </p>
        )}
      </div>

      {loading ? (
        <div className="mt-4 rounded-2xl border border-line bg-paper px-6 py-14 text-center text-[13px] text-muted">
          Cargando stock desde Supabase...
        </div>
      ) : filtered.length === 0 ? (
        <div className="mt-4 rounded-2xl border border-line bg-paper px-6 py-14 text-center">
          <p className="text-[16px] font-bold text-ink">
            No hay vehículos con esos filtros.
          </p>
          <p className="mx-auto mt-2 max-w-[460px] text-[12.5px] leading-relaxed text-muted">
            Probá con otra búsqueda o limpiá los filtros para volver a ver todo
            el inventario.
          </p>
          <button
            type="button"
            onClick={resetFilters}
            className="mt-4 rounded-full border border-line bg-cream px-4 py-2 text-[11px] font-semibold text-ink transition hover:border-ink/25"
          >
            Limpiar filtros
          </button>
        </div>
      ) : (
        <>
          <div className="mt-4 hidden overflow-hidden rounded-2xl border border-line bg-paper xl:block">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[940px] text-left">
                <thead className="border-b border-line bg-cream/60">
                  <tr className="text-[9px] font-bold uppercase tracking-[0.16em] text-muted">
                    <th className="px-4 py-3">Vehículo</th>
                    <th className="px-3 py-3">Categoría</th>
                    <th className="px-3 py-3">Año / KM</th>
                    <th className="px-3 py-3">Precio</th>
                    <th className="px-3 py-3">Fotos</th>
                    <th className="px-3 py-3">Estado</th>
                    <th className="px-3 py-3">Dest.</th>
                    <th className="px-4 py-3 text-right">Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((vehicle) => {
                    const category = categoryFor(vehicle, categories);
                    return (
                      <tr
                        key={vehicle.id}
                        className="border-b border-line/70 last:border-0 transition hover:bg-cream/45"
                      >
                        <td className="px-4 py-3">
                          <button
                            type="button"
                            onClick={() => setSelectedId(vehicle.id)}
                            className="flex max-w-[340px] items-center gap-3 text-left"
                          >
                            <img
                              src={vehicleCover(vehicle)}
                              alt=""
                              loading="lazy"
                              className="h-12 w-16 shrink-0 rounded-lg border border-line bg-cream object-cover"
                            />
                            <span className="min-w-0">
                              <span className="block truncate text-[12.5px] font-bold leading-snug text-ink">
                                {vehicleTitle(vehicle)}
                              </span>
                              <span className="mt-0.5 block truncate text-[10.5px] text-muted">
                                {vehicle.marca ?? "Sin marca"} ·{" "}
                                {vehicle.slug ?? "sin slug"}
                              </span>
                            </span>
                          </button>
                        </td>
                        <td className="px-3 py-3 text-[11.5px] text-moss">
                          {category?.nombre ?? vehicle.categoria ?? "Sin categoría"}
                        </td>
                        <td className="px-3 py-3 text-[11.5px] text-moss">
                          <span className="block font-semibold text-ink">
                            {vehicle.año ?? "—"}
                          </span>
                          {vehicleKmLabel(vehicle)}
                        </td>
                        <td className="px-3 py-3 text-[11.5px] font-semibold text-ink">
                          {vehiclePriceLabel(vehicle)}
                        </td>
                        <td className="px-3 py-3 text-[11.5px] text-moss">
                          <span className="inline-flex items-center gap-1.5">
                            <ImageIcon className="h-3.5 w-3.5" />
                            {vehicle.photos.length}
                          </span>
                        </td>
                        <td className="px-3 py-3">
                          <span
                            className={cn(
                              "inline-flex rounded-full border px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.1em]",
                              statusClass(vehicle.activo)
                            )}
                          >
                            {vehicleStatusLabel(vehicle)}
                          </span>
                        </td>
                        <td className="px-3 py-3">
                          {vehicle.destacado ? (
                            <Star className="h-4 w-4 text-forest" />
                          ) : (
                            <span className="text-[11px] text-muted/50">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            type="button"
                            onClick={() => openEditor(vehicle.id)}
                            className="inline-flex items-center gap-1.5 rounded-full border border-line bg-cream px-3 py-1.5 text-[10.5px] font-bold text-ink transition hover:border-ink/25"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                            Editar
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-3 xl:hidden">
            {filtered.map((vehicle) => {
              const category = categoryFor(vehicle, categories);
              return (
                <button
                  key={vehicle.id}
                  type="button"
                  onClick={() => setSelectedId(vehicle.id)}
                  className="min-w-0 rounded-2xl border border-line bg-paper p-3 text-left transition hover:border-ink/25"
                >
                  <div className="flex gap-3">
                    <img
                      src={vehicleCover(vehicle)}
                      alt=""
                      loading="lazy"
                      className="h-16 w-20 shrink-0 rounded-xl border border-line bg-cream object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-bold text-ink">
                        {vehicleTitle(vehicle)}
                      </p>
                      <p className="mt-1 truncate text-[10.5px] text-muted">
                        {category?.nombre ?? vehicle.categoria ?? "Sin categoría"} ·{" "}
                        {vehicle.año ?? "—"} · {vehicleKmLabel(vehicle)}
                      </p>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <span
                          className={cn(
                            "rounded-full border px-2 py-0.5 text-[8.5px] font-bold uppercase tracking-[0.1em]",
                            statusClass(vehicle.activo)
                          )}
                        >
                          {vehicleStatusLabel(vehicle)}
                        </span>
                        <span className="text-[11px] font-semibold text-ink">
                          {vehiclePriceLabel(vehicle)}
                        </span>
                      </div>
                    </div>
                    <Eye className="mt-1 h-4 w-4 shrink-0 text-muted" />
                  </div>
                </button>
              );
            })}
          </div>
        </>
      )}

      <StockDetailModal
        vehicle={selected}
        categories={categories}
        specsReady={specsReady}
        onClose={() => setSelectedId(null)}
        onEdit={() => {
          if (selected) openEditor(selected.id);
        }}
      />
    </div>
  );
}

function StockDetailModal({
  vehicle,
  categories,
  specsReady,
  onClose,
  onEdit,
}: {
  vehicle: AdminVehicle | null;
  categories: AdminCategory[];
  specsReady: boolean;
  onClose: () => void;
  onEdit: () => void;
}) {
  if (!vehicle) return null;

  const category = categoryFor(vehicle, categories);
  const specs: Array<[string, string]> = [
    ["Año", vehicle.año ? String(vehicle.año) : "—"],
    ["Kilometraje", vehicleKmLabel(vehicle)],
    [
      "Transmisión",
      vehicle.transmision ?? (specsReady ? "Sin cargar" : "Se infiere en el sitio"),
    ],
    [
      "Combustible",
      vehicle.combustible ?? (specsReady ? "Sin cargar" : "Se infiere en el sitio"),
    ],
    [
      "Carrocería",
      vehicle.carroceria ?? (specsReady ? "Sin cargar" : "Se infiere en el sitio"),
    ],
    [
      "Tracción",
      vehicle.traccion ?? (specsReady ? "Sin cargar" : "Se infiere en el sitio"),
    ],
    ["Potencia", vehicle.potencia ? `${vehicle.potencia} CV` : "—"],
    ["Color", vehicle.color ?? "—"],
    ["Categoría", category?.nombre ?? vehicle.categoria ?? "Sin categoría"],
  ];

  return (
    <Modal
      open
      onClose={onClose}
      label={`Detalle de ${vehicleTitle(vehicle)}`}
      className="sm:max-w-4xl"
    >
      <div className="flex max-h-[90vh] flex-col">
        <div className="relative h-48 shrink-0 overflow-hidden bg-ink sm:h-56">
          <img
            src={vehicleCover(vehicle)}
            alt=""
            className="h-full w-full object-cover opacity-80"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/25 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-5 pr-16 sm:p-7">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={cn(
                  "rounded-full border px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.12em]",
                  statusClass(vehicle.activo)
                )}
              >
                {vehicleStatusLabel(vehicle)}
              </span>
              {vehicle.destacado && (
                <span className="inline-flex items-center gap-1 rounded-full border border-lime/40 bg-lime px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.12em] text-ink">
                  <Star className="h-3 w-3" />
                  Destacado
                </span>
              )}
              <span className="rounded-full border border-cream/20 bg-cream/10 px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.12em] text-cream">
                {category?.nombre ?? "Sin categoría"}
              </span>
            </div>
            <h2 className="mt-3 text-[26px] font-extrabold leading-tight tracking-[-0.04em] text-cream sm:text-[32px]">
              {vehicleTitle(vehicle)}
            </h2>
            <p className="mt-1 text-[12px] text-cream/65">
              {[vehicle.marca, vehicle.modelo, vehicle.año]
                .filter(Boolean)
                .join(" · ")}
            </p>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-7 sm:py-6">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className={labelClass}>Precio</p>
              <p className="mt-1 text-[24px] font-extrabold tracking-[-0.04em] text-ink">
                {vehiclePriceLabel(vehicle)}
              </p>
            </div>
            {vehicle.activo && (
              <a
                href="/#vehiculos"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 rounded-full border border-line bg-cream px-4 py-2 text-[11px] font-semibold text-ink transition hover:border-ink/25"
              >
                Ver en el sitio
                <ArrowUpRight className="h-3.5 w-3.5" />
              </a>
            )}
          </div>

          {!specsReady && (
            <div className="mt-5 rounded-xl border border-amber-300/80 bg-amber-50 px-4 py-3 text-[11.5px] leading-relaxed text-amber-900">
              La migración de ficha técnica todavía no está aplicada. El sitio
              público infiere transmisión, combustible, carrocería, tracción y
              potencia desde el título y la descripción.
            </div>
          )}

          <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {specs.map(([label, value]) => (
              <div
                key={label}
                className="rounded-xl border border-line bg-cream/45 px-3.5 py-3"
              >
                <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-muted">
                  {label}
                </p>
                <p className="mt-1 text-[12px] font-semibold leading-snug text-ink">
                  {value}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1fr)_280px]">
            <div>
              <p className={labelClass}>Descripción</p>
              <p className="mt-2 whitespace-pre-line text-[12.5px] leading-relaxed text-moss">
                {vehicle.descripcion?.trim() || "Sin descripción cargada."}
              </p>
            </div>

            <div>
              <p className={labelClass}>Fotos ({vehicle.photos.length})</p>
              {vehicle.photos.length > 0 ? (
                <div className="mt-2 grid grid-cols-3 gap-2 lg:grid-cols-2">
                  {vehicle.photos.map((photo, index) => (
                    <a
                      key={`${photo.url}-${index}`}
                      href={photo.url}
                      target="_blank"
                      rel="noreferrer"
                      className="group overflow-hidden rounded-lg border border-line bg-cream"
                    >
                      <img
                        src={photo.url}
                        alt={`Foto ${index + 1}`}
                        loading="lazy"
                        className="aspect-[4/3] w-full object-cover transition group-hover:scale-[1.03]"
                      />
                    </a>
                  ))}
                </div>
              ) : (
                <p className="mt-2 rounded-xl border border-line bg-cream/45 px-3.5 py-3 text-[11.5px] text-muted">
                  Sin fotos cargadas.
                </p>
              )}
            </div>
          </div>

          <div className="mt-6 grid gap-3 border-t border-line pt-4 text-[11px] text-muted sm:grid-cols-3">
            <p>
              <span className="font-semibold text-ink">Slug:</span>{" "}
              {vehicle.slug ?? "—"}
            </p>
            <p>
              <span className="font-semibold text-ink">Creado:</span>{" "}
              {formatDateTime(vehicle.created_at)}
            </p>
            <p>
              <span className="font-semibold text-ink">Actualizado:</span>{" "}
              {formatDateTime(vehicle.updated_at)}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-t border-line px-5 py-4 sm:px-7">
          <p className="text-[11px] text-muted">
            Podés editar datos, especificaciones, fotos y publicación.
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-line bg-paper px-4 py-2.5 text-[12px] font-semibold text-ink transition hover:border-ink/25"
            >
              Cerrar
            </button>
            <button
              type="button"
              onClick={onEdit}
              className="inline-flex items-center gap-2 rounded-full bg-lime px-5 py-2.5 text-[12px] font-bold text-ink transition hover:bg-lime-soft"
            >
              <Pencil className="h-4 w-4" />
              Editar ficha
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
