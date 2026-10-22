import {
  useEffect,
  useMemo,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import { Modal } from "../components/ui";
import { cn } from "../utils/cn";
import {
  ArrowUpRight,
  CarIcon,
  Check,
  Eye,
  ImageIcon,
  Plus,
  RefreshCw,
  Search,
  Star,
  Tag,
} from "../components/Icons";
import {
  categoryFor,
  createVehicleDraft,
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
  const [createOpen, setCreateOpen] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);

  const selected = useMemo(
    () => vehicles.find((vehicle) => vehicle.id === selectedId) ?? null,
    [vehicles, selectedId]
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

  const handleCreated = () => {
    setNotice({
      tone: "success",
      text: "Borrador creado. Ya aparece en el stock como no publicado.",
    });
    onReload();
  };

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
          <p className="mt-2 max-w-[620px] text-[13px] leading-relaxed text-muted">
            Revisá el inventario completo, detectá datos faltantes y creá
            borradores. La edición completa y las fotos llegan en la Fase 2.
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
            onClick={() => setCreateOpen(true)}
            className="inline-flex items-center gap-2 rounded-full bg-lime px-5 py-2.5 text-[12px] font-bold text-ink transition hover:bg-lime-soft"
          >
            <Plus className="h-4 w-4" />
            Nuevo borrador
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
                            onClick={() => setSelectedId(vehicle.id)}
                            className="inline-flex items-center gap-1.5 rounded-full border border-line bg-cream px-3 py-1.5 text-[10.5px] font-bold text-ink transition hover:border-ink/25"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            Ver
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-4 grid gap-3 xl:hidden">
            {filtered.map((vehicle) => {
              const category = categoryFor(vehicle, categories);
              return (
                <button
                  key={vehicle.id}
                  type="button"
                  onClick={() => setSelectedId(vehicle.id)}
                  className="rounded-2xl border border-line bg-paper p-3 text-left transition hover:border-ink/25"
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
                      <p className="mt-1 text-[10.5px] text-muted">
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

      <CreateDraftModal
        open={createOpen}
        categories={categories}
        onClose={() => setCreateOpen(false)}
        onCreated={() => {
          setCreateOpen(false);
          handleCreated();
        }}
      />

      <StockDetailModal
        vehicle={selected}
        categories={categories}
        specsReady={specsReady}
        onClose={() => setSelectedId(null)}
      />
    </div>
  );
}

function CreateDraftModal({
  open,
  categories,
  onClose,
  onCreated,
}: {
  open: boolean;
  categories: AdminCategory[];
  onClose: () => void;
  onCreated: () => void;
}) {
  const defaultCategory = useMemo(
    () => categories.find((category) => category.slug === "usados") ?? categories[0] ?? null,
    [categories]
  );
  const [categoryId, setCategoryId] = useState("");
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [version, setVersion] = useState("");
  const [year, setYear] = useState("");
  const [km, setKm] = useState("");
  const [color, setColor] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [creating, setCreating] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setCategoryId(defaultCategory?.id ?? "");
    setBrand("");
    setModel("");
    setVersion("");
    setYear("");
    setKm("");
    setColor("");
    setPrice("");
    setDescription("");
    setFormError(null);
    setCreating(false);
  }, [open, defaultCategory?.id]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const category = categories.find((item) => item.id === categoryId);

    if (!category) {
      setFormError("Elegí una categoría.");
      return;
    }
    if (!brand.trim() || !model.trim()) {
      setFormError("Marca y modelo son obligatorios.");
      return;
    }

    const yearNumber = year.trim() ? Number(year) : null;
    if (
      yearNumber != null &&
      (!Number.isInteger(yearNumber) ||
        yearNumber < 1950 ||
        yearNumber > new Date().getFullYear() + 1)
    ) {
      setFormError("El año no parece válido.");
      return;
    }

    setCreating(true);
    setFormError(null);

    try {
      await createVehicleDraft({
        category,
        brand,
        model,
        version,
        year,
        km,
        color,
        price,
        description,
      });
      onCreated();
    } catch (cause) {
      setFormError(
        cause instanceof Error ? cause.message : "No se pudo crear el borrador."
      );
      setCreating(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={creating ? () => undefined : onClose}
      label="Nuevo borrador de vehículo"
      className="sm:max-w-2xl"
    >
      <form onSubmit={handleSubmit} className="overflow-y-auto">
        <div className="border-b border-line px-5 pb-4 pt-6 sm:px-7">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-moss">
            Stock · Alta rápida
          </p>
          <h2 className="mt-1 text-[26px] font-extrabold tracking-[-0.045em] text-ink">
            Nuevo borrador
          </h2>
          <p className="mt-2 max-w-[520px] text-[12px] leading-relaxed text-muted">
            Cargá los datos base. Queda oculto en el sitio hasta que lo completes
            y lo publiques en la próxima fase.
          </p>
        </div>

        <div className="grid gap-4 px-5 py-5 sm:grid-cols-2 sm:px-7">
          <label className="block">
            <span className={labelClass}>Categoría *</span>
            <select
              value={categoryId}
              onChange={(event) => setCategoryId(event.target.value)}
              className={cn(inputClass, "mt-1.5")}
              required
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
          </label>

          <label className="block">
            <span className={labelClass}>Año</span>
            <input
              type="number"
              inputMode="numeric"
              min={1950}
              max={new Date().getFullYear() + 1}
              value={year}
              onChange={(event) => setYear(event.target.value)}
              placeholder="Ej. 2021"
              className={cn(inputClass, "mt-1.5")}
            />
          </label>

          <label className="block">
            <span className={labelClass}>Marca *</span>
            <input
              type="text"
              value={brand}
              onChange={(event) => setBrand(event.target.value)}
              placeholder="Ej. Toyota"
              className={cn(inputClass, "mt-1.5")}
              required
            />
          </label>

          <label className="block">
            <span className={labelClass}>Modelo *</span>
            <input
              type="text"
              value={model}
              onChange={(event) => setModel(event.target.value)}
              placeholder="Ej. Yaris"
              className={cn(inputClass, "mt-1.5")}
              required
            />
          </label>

          <label className="block sm:col-span-2">
            <span className={labelClass}>Versión</span>
            <input
              type="text"
              value={version}
              onChange={(event) => setVersion(event.target.value)}
              placeholder="Ej. XLS Pack 1.5 CVT"
              className={cn(inputClass, "mt-1.5")}
            />
          </label>

          <label className="block">
            <span className={labelClass}>Kilometraje</span>
            <input
              type="text"
              inputMode="numeric"
              value={km}
              onChange={(event) => setKm(event.target.value)}
              placeholder="Ej. 19000"
              className={cn(inputClass, "mt-1.5")}
            />
          </label>

          <label className="block">
            <span className={labelClass}>Color</span>
            <input
              type="text"
              value={color}
              onChange={(event) => setColor(event.target.value)}
              placeholder="Ej. Blanco"
              className={cn(inputClass, "mt-1.5")}
            />
          </label>

          <label className="block sm:col-span-2">
            <span className={labelClass}>Precio en USD</span>
            <input
              type="text"
              inputMode="numeric"
              value={price}
              onChange={(event) => setPrice(event.target.value)}
              placeholder="Opcional. Si queda vacío se muestra Consultar precio."
              className={cn(inputClass, "mt-1.5")}
            />
          </label>

          <label className="block sm:col-span-2">
            <span className={labelClass}>Descripción</span>
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={4}
              placeholder="Resumen comercial. En la próxima fase vas a poder separar el equipamiento."
              className={cn(inputClass, "mt-1.5 resize-y")}
            />
          </label>

          {formError && (
            <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[12px] text-red-700 sm:col-span-2">
              {formError}
            </p>
          )}

          <div className="rounded-xl border border-line bg-cream/60 px-4 py-3 text-[11px] leading-relaxed text-muted sm:col-span-2">
            El borrador no se publica. Las fotos, la ficha técnica y la
            publicación se completan en la Fase 2.
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2 border-t border-line px-5 py-4 sm:px-7">
          <button
            type="button"
            onClick={onClose}
            disabled={creating}
            className="rounded-full border border-line bg-paper px-4 py-2.5 text-[12px] font-semibold text-ink transition hover:border-ink/25 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={creating}
            className="inline-flex items-center gap-2 rounded-full bg-lime px-5 py-2.5 text-[12px] font-bold text-ink transition hover:bg-lime-soft disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Plus className="h-4 w-4" />
            {creating ? "Creando..." : "Crear borrador"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function StockDetailModal({
  vehicle,
  categories,
  specsReady,
  onClose,
}: {
  vehicle: AdminVehicle | null;
  categories: AdminCategory[];
  specsReady: boolean;
  onClose: () => void;
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
            La edición completa y las fotos se habilitan en la Fase 2.
          </p>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-ink px-5 py-2.5 text-[12px] font-bold text-cream transition hover:bg-forest"
          >
            Cerrar
          </button>
        </div>
      </div>
    </Modal>
  );
}
