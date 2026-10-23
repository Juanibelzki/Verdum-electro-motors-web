import { useMemo, useState } from "react";
import {
  FALLBACK_CAR_IMAGE,
  formatKm,
  formatPrice,
  whatsappLink,
  type Car,
} from "../data/cars";
import type { VehicleCategory } from "../data/vehicles";
import { cn } from "../utils/cn";
import {
  ArrowUpRight,
  Calendar,
  ChevronDown,
  Cog,
  Gauge,
  Heart,
  Search,
  Sliders,
  Whatsapp,
  X,
  Zap,
} from "./Icons";
import { Eyebrow, Reveal } from "./ui";

const sortOptions = [
  { value: "destacados", label: "Ordenar: destacados" },
  { value: "anio-desc", label: "Año más reciente" },
  { value: "km-asc", label: "Menor kilometraje" },
  { value: "precio-asc", label: "Menor precio primero" },
  { value: "precio-desc", label: "Mayor precio primero" },
];

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="relative">
      <label className="sr-only" htmlFor={`filter-${label}`}>
        {label}
      </label>
      <select
        id={`filter-${label}`}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full appearance-none rounded-xl border border-line/80 bg-cream/55 py-3 pl-4 pr-10 text-[12.5px] font-semibold text-ink transition focus:border-forest focus:outline-none focus:ring-4 focus:ring-forest/10"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
    </div>
  );
}

function CarCard({
  car,
  favorite,
  onToggleFavorite,
  onView,
}: {
  car: Car;
  favorite: boolean;
  onToggleFavorite: () => void;
  onView: () => void;
}) {
  const specs = [
    car.year != null
      ? { label: "Año", value: String(car.year), icon: Calendar, key: "year" }
      : null,
    car.km != null
      ? { label: "Kilometraje", value: formatKm(car.km), icon: Gauge, key: "km" }
      : null,
    car.transmission !== "Consultar"
      ? { label: "Transmisión", value: car.transmission, icon: Cog, key: "transmission" }
      : null,
    car.power != null
      ? { label: "Potencia", value: `${car.power} CV`, icon: Zap, key: "power" }
      : null,
  ].filter((spec) => spec !== null);

  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-[1.35rem] border border-line/75 bg-paper transition duration-500 hover:-translate-y-1 hover:border-forest/25 hover:shadow-[0_30px_60px_-35px_rgba(20,36,30,0.55)]">
      <div className="relative aspect-[4/3] overflow-hidden bg-sand">
        <img
          src={car.image}
          alt={car.title}
          loading="lazy"
          onError={(event) => {
            event.currentTarget.onerror = null;
            event.currentTarget.src = FALLBACK_CAR_IMAGE;
          }}
          className="h-full w-full object-cover transition duration-[900ms] ease-out group-hover:scale-[1.045]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink/25 via-transparent to-transparent opacity-70" />

        <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-2 p-3.5">
          {car.featured ? (
            <span className="rounded-full bg-lime/95 px-2.5 py-1.5 text-[9px] font-extrabold uppercase tracking-[0.13em] text-ink backdrop-blur-md">
              {car.badge}
            </span>
          ) : (
            <span aria-hidden="true" />
          )}
          <button
            type="button"
            onClick={onToggleFavorite}
            aria-pressed={favorite}
            aria-label={
              favorite ? `Quitar ${car.title} de guardados` : `Guardar ${car.title}`
            }
            className={cn(
              "grid h-9 w-9 place-items-center rounded-full border bg-cream/90 backdrop-blur-md transition",
              favorite
                ? "border-lime bg-lime text-ink"
                : "border-white/50 text-ink hover:border-ink/30 hover:bg-cream"
            )}
          >
            <Heart className={cn("h-4 w-4", favorite && "fill-current")} />
          </button>
        </div>

        <div className="absolute bottom-3.5 left-3.5 flex items-center gap-1.5 rounded-full bg-ink/80 px-2.5 py-1.5 text-[9px] font-bold uppercase tracking-[0.12em] text-cream backdrop-blur-md">
          {car.fuel === "Eléctrico" ? (
            <Zap className="h-3 w-3 text-lime" />
          ) : (
            <span className="h-1 w-1 rounded-full bg-lime" />
          )}
          {car.fuel !== "Consultar" ? car.fuel : car.body}
        </div>
        {car.km === 0 && (
          <span className="absolute bottom-3.5 right-3.5 rounded-full bg-cream/90 px-2.5 py-1.5 text-[9px] font-extrabold uppercase tracking-[0.1em] text-ink backdrop-blur-md">
            0 km
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[9.5px] font-bold uppercase tracking-[0.2em] text-muted">
              {car.brand}
            </p>
            <h3 className="mt-1.5 line-clamp-2 text-[18px] font-extrabold leading-tight tracking-[-0.025em] text-ink">
              {car.model}
            </h3>
            <p className="mt-1 truncate text-[11px] leading-relaxed text-muted">{car.version}</p>
          </div>
          <span className="mt-0.5 shrink-0 rounded-full border border-line px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.08em] text-moss">
            {car.condition}
          </span>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-x-3 gap-y-2 border-y border-line/60 py-3">
          {specs.map((spec) => {
            const Icon = spec.icon;
            return (
              <span
                key={spec.key}
                className="flex items-center gap-1.5 text-[10.5px] font-medium text-moss"
              >
                <Icon className="h-3.5 w-3.5 text-muted" />
                {spec.value}
              </span>
            );
          })}
        </div>

        <div className="mt-auto flex items-end justify-between gap-3 pt-4">
          <div className="min-w-0">
            <p className="text-[8.5px] font-bold uppercase tracking-[0.16em] text-muted">Precio</p>
            <p className="mt-0.5 text-[15px] font-extrabold leading-tight tracking-[-0.03em] text-ink">
              {formatPrice(car.price)}
            </p>
          </div>
          <a
            href={whatsappLink(car.whatsappMsg)}
            target="_blank"
            rel="noreferrer"
            aria-label={`Consultar ${car.title} por WhatsApp`}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-forest/20 bg-lime/25 px-3 py-2 text-[10px] font-bold text-forest transition hover:bg-lime hover:text-ink"
          >
            <Whatsapp className="h-3.5 w-3.5" />
            WhatsApp
          </a>
        </div>

        <button
          type="button"
          onClick={onView}
          className="mt-4 flex w-full items-center justify-between rounded-full border border-ink/15 px-4 py-2.5 text-[11.5px] font-semibold text-ink transition duration-300 group-hover:border-ink group-hover:bg-ink group-hover:text-cream"
        >
          Ver detalle
          <ArrowUpRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </article>
  );
}

function CarSkeleton() {
  return (
    <div className="overflow-hidden rounded-[1.35rem] border border-line/75 bg-paper">
      <div className="aspect-[4/3] animate-pulse bg-sand" />
      <div className="space-y-3 p-5">
        <div className="h-2.5 w-16 animate-pulse rounded bg-line/70" />
        <div className="h-5 w-3/4 animate-pulse rounded bg-line/70" />
        <div className="h-3 w-1/2 animate-pulse rounded bg-line/60" />
        <div className="h-14 animate-pulse rounded bg-cream" />
        <div className="h-9 animate-pulse rounded-full bg-cream" />
      </div>
    </div>
  );
}

export default function Catalog({
  cars,
  categories,
  loading,
  error,
  onViewCar,
  onSchedule,
  onRetry,
}: {
  cars: Car[];
  categories: VehicleCategory[];
  loading: boolean;
  error: string | null;
  onViewCar: (car: Car) => void;
  onSchedule: () => void;
  onRetry: () => void;
}) {
  const [tab, setTab] = useState("todos");
  const [brand, setBrand] = useState("all");
  const [body, setBody] = useState("all");
  const [price, setPrice] = useState("all");
  const [sort, setSort] = useState("destacados");
  const [favorites, setFavorites] = useState<string[]>([]);
  const [savedOnly, setSavedOnly] = useState(false);

  const hasPrices = cars.some((car) => car.price != null);
  const brands = useMemo(
    () => Array.from(new Set(cars.map((car) => car.brand))).sort((a, b) => a.localeCompare(b, "es")),
    [cars]
  );
  const bodies = useMemo(
    () => Array.from(new Set(cars.map((car) => car.body))).sort((a, b) => a.localeCompare(b, "es")),
    [cars]
  );
  const tabs = useMemo(
    () => [
      { id: "todos", label: "Todos", count: cars.length },
      ...categories.map((category) => ({
        id: category.id,
        label: category.shortName,
        count: category.count,
      })),
    ],
    [cars.length, categories]
  );

  const priceOptions = useMemo(
    () => [
      { value: "all", label: "Precio: cualquiera" },
      { value: "0-50000", label: "Hasta USD 50.000" },
      { value: "50000-80000", label: "USD 50.000 – 80.000" },
      { value: "80000-120000", label: "USD 80.000 – 120.000" },
      { value: "120000-999999", label: "Más de USD 120.000" },
    ],
    []
  );

  const visibleSortOptions = useMemo(
    () =>
      hasPrices
        ? sortOptions
        : sortOptions.filter((option) => !option.value.startsWith("precio-")),
    [hasPrices]
  );

  const toggleFavorite = (id: string) =>
    setFavorites((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id]
    );

  const resetFilters = () => {
    setTab("todos");
    setBrand("all");
    setBody("all");
    setPrice("all");
    setSort("destacados");
    setSavedOnly(false);
  };

  const filteredCars = useMemo(() => {
    let list = cars.filter((car) => {
      if (tab !== "todos" && car.categoryId !== tab) return false;
      if (brand !== "all" && car.brand !== brand) return false;
      if (body !== "all" && car.body !== body) return false;
      if (price !== "all" && hasPrices) {
        const [min, max] = price.split("-").map(Number);
        if (car.price == null || car.price < min || car.price > max) return false;
      }
      if (savedOnly && !favorites.includes(car.id)) return false;
      return true;
    });

    list = [...list];

    if (sort === "destacados") {
      list.sort((a, b) => Number(b.featured) - Number(a.featured));
    }
    if (sort === "precio-asc" && hasPrices) {
      list.sort((a, b) => (a.price ?? Number.POSITIVE_INFINITY) - (b.price ?? Number.POSITIVE_INFINITY));
    }
    if (sort === "precio-desc" && hasPrices) {
      list.sort((a, b) => (b.price ?? Number.NEGATIVE_INFINITY) - (a.price ?? Number.NEGATIVE_INFINITY));
    }
    if (sort === "anio-desc") list.sort((a, b) => (b.year ?? 0) - (a.year ?? 0));
    if (sort === "km-asc") {
      list.sort((a, b) => (a.km ?? Number.POSITIVE_INFINITY) - (b.km ?? Number.POSITIVE_INFINITY));
    }
    return list;
  }, [cars, tab, brand, body, price, sort, savedOnly, favorites, hasPrices]);

  const activeFilters =
    (brand !== "all" ? 1 : 0) +
    (body !== "all" ? 1 : 0) +
    (price !== "all" && hasPrices ? 1 : 0) +
    (savedOnly ? 1 : 0);

  return (
    <section id="vehiculos" className="scroll-mt-24 bg-cream pb-24 pt-10 sm:pt-12 lg:pb-28">
      <div className="mx-auto max-w-[1440px] px-5 sm:px-8 lg:px-10">
        <Reveal>
          <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <Eyebrow>01 — Catálogo</Eyebrow>
              <h2 className="mt-4 text-[clamp(2.1rem,4.4vw,3.5rem)] font-extrabold leading-[1.02] tracking-[-0.05em] text-ink">
                Encontrá tu próximo{" "}
                <span className="font-serif font-normal italic tracking-[-0.01em] text-forest">
                  favorito.
                </span>
              </h2>
              <p className="mt-4 max-w-lg text-[13.5px] leading-relaxed text-muted">
                Stock real, fotos reales y disponibilidad actualizada. Precios y financiamiento
                se confirman con un asesor.
              </p>
            </div>
            <div className="flex items-center gap-2 rounded-full border border-line/80 bg-paper px-3.5 py-2 text-[10.5px] font-semibold text-moss">
              <span className="h-1.5 w-1.5 rounded-full bg-moss" />
              {loading
                ? "Cargando stock..."
                : error
                  ? "Stock no disponible"
                  : `${cars.length} unidades disponibles`}
              {!loading && !error && (
                <>
                  <span className="text-muted/50">·</span>
                  <span className="font-normal text-muted">Actualizado hoy</span>
                </>
              )}
            </div>
          </div>
        </Reveal>

        {!loading && !error && (
          <Reveal delay={80}>
            <div className="mt-8 rounded-[1.5rem] border border-line/80 bg-paper p-3 shadow-[0_25px_60px_-50px_rgba(20,36,30,0.7)] sm:p-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div
                  className="flex items-center gap-1 overflow-x-auto rounded-full bg-cream/80 p-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                  role="tablist"
                  aria-label="Filtrar por tipo de vehículo"
                >
                  {tabs.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      role="tab"
                      aria-selected={tab === item.id}
                      onClick={() => setTab(item.id)}
                      className={cn(
                        "flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 py-2 text-[11.5px] font-semibold transition duration-300",
                        tab === item.id
                          ? "bg-ink text-cream shadow-sm"
                          : "text-moss hover:bg-paper hover:text-ink"
                      )}
                    >
                      {item.label}
                      <span
                        className={cn(
                          "text-[9px] font-bold",
                          tab === item.id ? "text-lime" : "text-muted/60"
                        )}
                      >
                        {item.count}
                      </span>
                    </button>
                  ))}
                </div>

                <div className="flex items-center justify-between gap-2 lg:justify-end">
                  <div className="flex items-center gap-2">
                    <span className="hidden items-center gap-1.5 text-[10.5px] font-semibold text-muted sm:flex">
                      <Sliders className="h-3.5 w-3.5" />
                      Filtrar
                    </span>
                    <button
                      type="button"
                      aria-pressed={savedOnly}
                      onClick={() => setSavedOnly((value) => !value)}
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-full border px-3 py-2 text-[10.5px] font-semibold transition",
                        savedOnly
                          ? "border-ink bg-ink text-cream"
                          : "border-line bg-cream/50 text-moss hover:border-ink/30"
                      )}
                    >
                      <Heart
                        className={cn(
                          "h-3.5 w-3.5",
                          (savedOnly || favorites.length > 0) && "fill-current"
                        )}
                      />
                      Guardados
                      {favorites.length > 0 && (
                        <span
                          className={cn(
                            "rounded-full px-1.5 py-0.5 text-[8.5px] font-bold",
                            savedOnly ? "bg-lime text-ink" : "bg-ink text-cream"
                          )}
                        >
                          {favorites.length}
                        </span>
                      )}
                    </button>
                  </div>
                  {activeFilters > 0 && (
                    <button
                      type="button"
                      onClick={resetFilters}
                      className="inline-flex items-center gap-1 text-[10.5px] font-semibold text-muted transition hover:text-ink"
                    >
                      <X className="h-3 w-3" />
                      Limpiar
                    </button>
                  )}
                </div>
              </div>

              <div
                className={cn(
                  "mt-3 grid gap-2 border-t border-line/60 pt-3 sm:grid-cols-2",
                  hasPrices ? "lg:grid-cols-4" : "lg:grid-cols-3"
                )}
              >
                <FilterSelect
                  label="Marca"
                  value={brand}
                  onChange={setBrand}
                  options={[
                    { value: "all", label: "Marca: todas" },
                    ...brands.map((item) => ({ value: item, label: item })),
                  ]}
                />
                <FilterSelect
                  label="Carrocería"
                  value={body}
                  onChange={setBody}
                  options={[
                    { value: "all", label: "Carrocería: todas" },
                    ...bodies.map((item) => ({ value: item, label: item })),
                  ]}
                />
                {hasPrices && (
                  <FilterSelect
                    label="Precio"
                    value={price}
                    onChange={setPrice}
                    options={priceOptions}
                  />
                )}
                <FilterSelect
                  label="Ordenar"
                  value={sort}
                  onChange={setSort}
                  options={visibleSortOptions}
                />
              </div>
            </div>
          </Reveal>
        )}

        {!loading && !error && (
          <div className="mt-6 flex items-center justify-between">
            <p className="text-[11px] font-medium text-muted">
              Mostrando <span className="font-bold text-ink">{filteredCars.length}</span> de{" "}
              {cars.length} vehículos
            </p>
            {favorites.length > 0 && !savedOnly && (
              <button
                type="button"
                onClick={() => setSavedOnly(true)}
                className="text-[11px] font-semibold text-forest underline decoration-forest/30 underline-offset-4 hover:decoration-forest"
              >
                Ver mis guardados
              </button>
            )}
          </div>
        )}

        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-5">
          {loading &&
            Array.from({ length: 6 }).map((_, index) => <CarSkeleton key={index} />)}

          {!loading && error && (
            <div className="col-span-full flex flex-col items-center justify-center rounded-[1.5rem] border border-dashed border-ink/20 bg-paper/70 px-6 py-16 text-center">
              <span className="grid h-14 w-14 place-items-center rounded-full bg-cream text-moss">
                <Search className="h-6 w-6" />
              </span>
              <h3 className="mt-5 text-xl font-extrabold tracking-tight">
                No pudimos cargar el stock.
              </h3>
              <p className="mt-2 max-w-md text-[13px] leading-relaxed text-muted">{error}</p>
              <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={onRetry}
                  className="rounded-full bg-ink px-5 py-3 text-[12px] font-semibold text-cream transition hover:bg-forest"
                >
                  Reintentar
                </button>
                <a
                  href={whatsappLink(
                    "Hola Verdun, quiero consultar por el stock disponible de vehículos."
                  )}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-full border border-ink/15 px-5 py-3 text-[12px] font-semibold text-ink transition hover:border-ink/30"
                >
                  <Whatsapp className="h-4 w-4 text-forest" />
                  Consultar por WhatsApp
                </a>
              </div>
            </div>
          )}

          {!loading &&
            !error &&
            filteredCars.map((car, index) => (
              <Reveal key={car.id} delay={Math.min(index * 55, 220)} className="h-full">
                <CarCard
                  car={car}
                  favorite={favorites.includes(car.id)}
                  onToggleFavorite={() => toggleFavorite(car.id)}
                  onView={() => onViewCar(car)}
                />
              </Reveal>
            ))}

          {!loading && !error && filteredCars.length === 0 && (
            <div className="col-span-full flex flex-col items-center justify-center rounded-[1.5rem] border border-dashed border-ink/20 bg-paper/70 px-6 py-16 text-center">
              <span className="grid h-14 w-14 place-items-center rounded-full bg-cream text-moss">
                <Search className="h-6 w-6" />
              </span>
              <h3 className="mt-5 text-xl font-extrabold tracking-tight">
                {cars.length === 0
                  ? "Estamos actualizando el stock."
                  : savedOnly
                    ? "Todavía no guardaste ningún auto."
                    : "No encontramos ese auto."}
              </h3>
              <p className="mt-2 max-w-sm text-[13px] leading-relaxed text-muted">
                {cars.length === 0
                  ? "Escribinos y te pasamos las unidades disponibles en el showroom."
                  : savedOnly
                    ? "Tocá el corazón en cualquier vehículo para compararlo más tarde."
                    : "Probá con otros filtros o contanos qué estás buscando. Tenemos ingresos nuevos todas las semanas."}
              </p>
              <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
                {cars.length === 0 ? (
                  <a
                    href={whatsappLink(
                      "Hola Verdun, quiero consultar por el stock disponible de vehículos."
                    )}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-full bg-ink px-5 py-3 text-[12px] font-semibold text-cream transition hover:bg-forest"
                  >
                    <Whatsapp className="h-4 w-4 text-lime" />
                    Consultar stock
                  </a>
                ) : (
                  <button
                    type="button"
                    onClick={resetFilters}
                    className="rounded-full bg-ink px-5 py-3 text-[12px] font-semibold text-cream transition hover:bg-forest"
                  >
                    Ver todos los vehículos
                  </button>
                )}
                <button
                  type="button"
                  onClick={onSchedule}
                  className="rounded-full border border-ink/15 px-5 py-3 text-[12px] font-semibold text-ink transition hover:border-ink/30"
                >
                  Contanos qué buscás
                </button>
              </div>
            </div>
          )}
        </div>

        <Reveal>
          <div className="mt-8 flex flex-col items-start justify-between gap-5 overflow-hidden rounded-[1.5rem] bg-forest p-6 text-cream sm:flex-row sm:items-center sm:p-8">
            <div className="relative">
              <p className="text-[9px] font-bold uppercase tracking-[0.22em] text-lime/80">
                Búsqueda personalizada
              </p>
              <p className="mt-2 max-w-md text-[19px] font-extrabold leading-snug tracking-[-0.025em] sm:text-[22px]">
                ¿No está el auto que buscás? Lo encontramos por vos.
              </p>
              <p className="mt-1.5 text-[12px] leading-relaxed text-cream/55">
                Contanos tu presupuesto y lo que necesitás. Nuestra red de proveedores hace el resto.
              </p>
            </div>
            <button
              type="button"
              onClick={onSchedule}
              className="inline-flex shrink-0 items-center gap-2 rounded-full bg-lime px-5 py-3.5 text-[12px] font-bold text-ink transition hover:bg-lime-soft"
            >
              Pedir asesoramiento
              <ArrowUpRight className="h-4 w-4" />
            </button>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
