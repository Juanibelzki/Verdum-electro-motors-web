import type { ReactNode } from "react";
import { cn } from "../utils/cn";
import {
  AlertTriangle,
  ArrowUpRight,
  CarIcon,
  Check,
  ChevronRight,
  ImageIcon,
  Package,
  Play,
  RefreshCw,
  Star,
  Tag,
} from "../components/Icons";
import {
  categoryFor,
  vehicleCover,
  vehiclePriceLabel,
  vehicleTitle,
  type AdminCategory,
  type AdminVehicle,
} from "./stockApi";

type OverviewPanelProps = {
  vehicles: AdminVehicle[];
  categories: AdminCategory[];
  specsReady: boolean;
  loading: boolean;
  error: string | null;
  onReload: () => void;
  onNavigate: (section: "stock" | "hero" | "stories" | "settings") => void;
};

function StatCard({
  icon,
  label,
  value,
  hint,
  emphasis = false,
}: {
  icon: ReactNode;
  label: string;
  value: number | string;
  hint: string;
  emphasis?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border p-4",
        emphasis
          ? "border-ink bg-ink text-cream"
          : "border-line bg-paper text-ink"
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <span
          className={cn(
            "grid h-9 w-9 place-items-center rounded-full",
            emphasis ? "bg-lime text-ink" : "bg-cream text-forest"
          )}
        >
          {icon}
        </span>
        <span
          className={cn(
            "text-[9px] font-bold uppercase tracking-[0.16em]",
            emphasis ? "text-cream/50" : "text-muted"
          )}
        >
          {label}
        </span>
      </div>
      <p className="mt-4 text-[32px] font-extrabold leading-none tracking-[-0.055em]">
        {value}
      </p>
      <p
        className={cn(
          "mt-2 text-[11px] leading-snug",
          emphasis ? "text-cream/60" : "text-muted"
        )}
      >
        {hint}
      </p>
    </div>
  );
}

function SectionCard({
  title,
  action,
  children,
  className,
}: {
  title: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "rounded-2xl border border-line bg-paper p-5 shadow-[0_30px_70px_-65px_rgba(20,36,30,0.9)] sm:p-6",
        className
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-[15px] font-extrabold tracking-[-0.02em] text-ink">
          {title}
        </h3>
        {action}
      </div>
      {children}
    </section>
  );
}

function LinkButton({
  children,
  onClick,
}: {
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1 text-[11px] font-semibold text-forest transition hover:text-ink"
    >
      {children}
      <ChevronRight className="h-3.5 w-3.5" />
    </button>
  );
}

export default function OverviewPanel({
  vehicles,
  categories,
  specsReady,
  loading,
  error,
  onReload,
  onNavigate,
}: OverviewPanelProps) {
  const total = vehicles.length;
  const active = vehicles.filter((vehicle) => vehicle.activo).length;
  const drafts = total - active;
  const noPrice = vehicles.filter((vehicle) => vehicle.precio_numero == null).length;
  const noPhotos = vehicles.filter((vehicle) => vehicle.photos.length === 0).length;
  const featured = vehicles.find((vehicle) => vehicle.destacado) ?? null;
  const pendingStatus = vehicles.filter(
    (vehicle) => vehicle.status === "pendiente_fotos"
  ).length;

  const categoryCounts = categories
    .map((category) => ({
      category,
      count: vehicles.filter((vehicle) => vehicle.category_id === category.id).length,
    }))
    .sort((a, b) => b.count - a.count);
  const maxCategoryCount = Math.max(1, ...categoryCounts.map((item) => item.count));

  const recent = [...vehicles]
    .sort((a, b) => (b.created_at ?? "").localeCompare(a.created_at ?? ""))
    .slice(0, 5);

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-moss">
            Panel
          </p>
          <h2 className="mt-1.5 text-[30px] font-extrabold tracking-[-0.05em] text-ink sm:text-[38px]">
            Resumen
          </h2>
          <p className="mt-2 max-w-[600px] text-[13px] leading-relaxed text-muted">
            Una vista rápida del inventario y del estado del contenido de la
            home.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onReload}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-full border border-line bg-paper px-4 py-2.5 text-[12px] font-semibold text-ink transition hover:border-ink/25 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
            Actualizar
          </button>
          <a
            href="/"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 rounded-full bg-ink px-4 py-2.5 text-[12px] font-semibold text-cream transition hover:bg-forest"
          >
            Ver sitio
            <ArrowUpRight className="h-3.5 w-3.5" />
          </a>
        </div>
      </div>

      {error && (
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[12px] text-red-700">
          <span>{error}</span>
          <button
            type="button"
            onClick={onReload}
            className="font-bold underline underline-offset-2"
          >
            Reintentar
          </button>
        </div>
      )}

      <div className="mt-5 flex gap-3 rounded-2xl border border-amber-300/80 bg-amber-50 p-4 text-[12px] leading-relaxed text-amber-900">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
        <p>
          <strong>Panel de staging.</strong> Sigue detrás de Vercel SSO. Antes
          de publicarlo en producción hay que agregar Supabase Auth y endurecer
          las políticas RLS.{" "}
          <button
            type="button"
            onClick={() => onNavigate("settings")}
            className="font-bold underline underline-offset-2"
          >
            Ver seguridad
          </button>
        </p>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 xl:grid-cols-5">
        <StatCard
          icon={<Package className="h-4 w-4" />}
          label="Total"
          value={loading ? "—" : total}
          hint="Vehículos en la base"
          emphasis
        />
        <StatCard
          icon={<Check className="h-4 w-4" />}
          label="Publicados"
          value={loading ? "—" : active}
          hint="Visibles en el catálogo"
        />
        <StatCard
          icon={<CarIcon className="h-4 w-4" />}
          label="Borradores"
          value={loading ? "—" : drafts}
          hint="Ocultos en el sitio"
        />
        <StatCard
          icon={<Tag className="h-4 w-4" />}
          label="Sin precio"
          value={loading ? "—" : noPrice}
          hint="Muestran Consultar"
        />
        <StatCard
          icon={<ImageIcon className="h-4 w-4" />}
          label="Sin fotos"
          value={loading ? "—" : noPhotos}
          hint="No publicables"
        />
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1.3fr)_minmax(320px,0.7fr)]">
        <div className="space-y-5">
          <SectionCard
            title="Stock por categoría"
            action={<LinkButton onClick={() => onNavigate("stock")}>Ver stock</LinkButton>}
          >
            <div className="mt-5 space-y-4">
              {categoryCounts.map(({ category, count }) => (
                <div key={category.id}>
                  <div className="flex items-center justify-between gap-3 text-[11.5px]">
                    <span className="font-semibold text-ink">{category.nombre}</span>
                    <span className="text-muted">{count}</span>
                  </div>
                  <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-cream">
                    <div
                      className="h-full rounded-full bg-forest"
                      style={{ width: `${(count / maxCategoryCount) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
              {categoryCounts.length === 0 && (
                <p className="text-[12px] text-muted">Sin categorías cargadas.</p>
              )}
            </div>
          </SectionCard>

          <SectionCard
            title="Últimos vehículos"
            action={<LinkButton onClick={() => onNavigate("stock")}>Ver todos</LinkButton>}
          >
            <div className="mt-4 divide-y divide-line/70">
              {recent.map((vehicle) => {
                const category = categoryFor(vehicle, categories);
                return (
                  <div key={vehicle.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                    <img
                      src={vehicleCover(vehicle)}
                      alt=""
                      loading="lazy"
                      className="h-11 w-14 shrink-0 rounded-lg border border-line bg-cream object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[12px] font-bold text-ink">
                        {vehicleTitle(vehicle)}
                      </p>
                      <p className="mt-0.5 truncate text-[10.5px] text-muted">
                        {category?.nombre ?? "Sin categoría"} ·{" "}
                        {vehicle.año ?? "—"} · {vehiclePriceLabel(vehicle)}
                      </p>
                    </div>
                    <span
                      className={cn(
                        "shrink-0 rounded-full border px-2 py-0.5 text-[8.5px] font-bold uppercase tracking-[0.1em]",
                        vehicle.activo
                          ? "border-forest/20 bg-forest/10 text-forest"
                          : "border-line bg-cream text-muted"
                      )}
                    >
                      {vehicle.activo ? "Publicado" : "Borrador"}
                    </span>
                  </div>
                );
              })}
              {recent.length === 0 && !loading && (
                <p className="text-[12px] text-muted">Todavía no hay vehículos.</p>
              )}
              {loading && (
                <p className="text-[12px] text-muted">Cargando inventario...</p>
              )}
            </div>
          </SectionCard>
        </div>

        <div className="space-y-5">
          <SectionCard
            title="Calidad de datos"
            action={<LinkButton onClick={() => onNavigate("settings")}>Ajustes</LinkButton>}
          >
            <div className="mt-4 space-y-2.5">
              <QualityRow
                tone={noPhotos > 0 ? "warn" : "ok"}
                label="Sin fotos"
                value={String(noPhotos)}
              />
              <QualityRow
                tone={noPrice > 0 ? "warn" : "ok"}
                label="Sin precio cargado"
                value={String(noPrice)}
              />
              <QualityRow
                tone={pendingStatus > 0 ? "warn" : "ok"}
                label="Estado pendiente_fotos"
                value={String(pendingStatus)}
              />
              <QualityRow
                tone={featured ? "ok" : "warn"}
                label="Destacado de portada"
                value={featured ? vehicleTitle(featured) : "Sin definir"}
              />
              <QualityRow
                tone={specsReady ? "ok" : "warn"}
                label="Ficha técnica"
                value={specsReady ? "Migración aplicada" : "Migración pendiente"}
              />
            </div>
          </SectionCard>

          <SectionCard title="Accesos rápidos">
            <div className="mt-4 grid gap-2">
              <QuickAction
                icon={<CarIcon className="h-4 w-4" />}
                title="Revisar stock"
                description="Filtros, faltantes y borradores"
                onClick={() => onNavigate("stock")}
              />
              <QuickAction
                icon={<Play className="h-4 w-4" />}
                title="Editar hero"
                description="Videos de portada"
                onClick={() => onNavigate("hero")}
              />
              <QuickAction
                icon={<Star className="h-4 w-4" />}
                title="Editar historias"
                description="Fotos y reels del showroom"
                onClick={() => onNavigate("stories")}
              />
            </div>
          </SectionCard>
        </div>
      </div>
    </div>
  );
}

function QualityRow({
  tone,
  label,
  value,
}: {
  tone: "ok" | "warn";
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-line bg-cream/45 px-3.5 py-2.5">
      <span className="flex items-center gap-2 text-[11.5px] text-moss">
        <span
          className={cn(
            "h-1.5 w-1.5 rounded-full",
            tone === "ok" ? "bg-forest" : "bg-amber-500"
          )}
        />
        {label}
      </span>
      <span
        className={cn(
          "max-w-[150px] truncate text-right text-[10.5px] font-semibold",
          tone === "ok" ? "text-forest" : "text-amber-700"
        )}
      >
        {value}
      </span>
    </div>
  );
}

function QuickAction({
  icon,
  title,
  description,
  onClick,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex w-full items-center gap-3 rounded-xl border border-line bg-cream/45 px-3.5 py-3 text-left transition hover:border-ink/25 hover:bg-cream"
    >
      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-paper text-forest">
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[11.5px] font-bold text-ink">{title}</span>
        <span className="mt-0.5 block truncate text-[10px] text-muted">
          {description}
        </span>
      </span>
      <ChevronRight className="h-3.5 w-3.5 text-muted transition group-hover:text-ink" />
    </button>
  );
}
