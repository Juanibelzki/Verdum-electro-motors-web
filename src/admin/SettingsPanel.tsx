import type { ReactNode } from "react";
import { cn } from "../utils/cn";
import {
  AlertTriangle,
  ArrowUpRight,
  CarIcon,
  Check,
  Cog,
  ImageIcon,
  Package,
  RefreshCw,
  ShieldCheck,
} from "../components/Icons";
import type { AdminCategory, AdminVehicle } from "./stockApi";

type SettingsPanelProps = {
  vehicles: AdminVehicle[];
  categories: AdminCategory[];
  specsReady: boolean;
  securityReady: boolean;
  loading: boolean;
  onReload: () => void;
};

function SettingsCard({
  title,
  description,
  badge,
  children,
}: {
  title: string;
  description?: string;
  badge?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-line bg-paper p-5 shadow-[0_30px_70px_-65px_rgba(20,36,30,0.9)] sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-[16px] font-extrabold tracking-[-0.025em] text-ink">
            {title}
          </h3>
          {description && (
            <p className="mt-1.5 max-w-[620px] text-[12px] leading-relaxed text-muted">
              {description}
            </p>
          )}
        </div>
        {badge}
      </div>
      {children}
    </section>
  );
}

function StatusPill({
  tone,
  children,
}: {
  tone: "ok" | "warn" | "pending";
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.12em]",
        tone === "ok" && "border-forest/20 bg-forest/10 text-forest",
        tone === "warn" && "border-amber-300 bg-amber-50 text-amber-800",
        tone === "pending" && "border-line bg-cream text-muted"
      )}
    >
      <span
        className={cn(
          "h-1.5 w-1.5 rounded-full",
          tone === "ok" ? "bg-forest" : tone === "warn" ? "bg-amber-500" : "bg-muted"
        )}
      />
      {children}
    </span>
  );
}

function ChecklistItem({
  done,
  children,
}: {
  done: boolean;
  children: ReactNode;
}) {
  return (
    <li className="flex items-start gap-2.5 text-[12px] leading-relaxed">
      <span
        className={cn(
          "mt-0.5 grid h-[18px] w-[18px] shrink-0 place-items-center rounded-full border",
          done
            ? "border-forest/20 bg-forest text-cream"
            : "border-line bg-cream text-muted"
        )}
      >
        {done ? <Check className="h-3 w-3" /> : <span className="h-1 w-1 rounded-full bg-muted" />}
      </span>
      <span className={done ? "text-moss" : "text-ink"}>{children}</span>
    </li>
  );
}

export default function SettingsPanel({
  vehicles,
  categories,
  specsReady,
  securityReady,
  loading,
  onReload,
}: SettingsPanelProps) {
  const total = vehicles.length;
  const published = vehicles.filter(
    (vehicle) => vehicle.activo && vehicle.status === "publicado"
  ).length;
  const withPhotos = vehicles.filter((vehicle) => vehicle.photos.length > 0).length;
  const withPrice = vehicles.filter((vehicle) => vehicle.precio_numero != null).length;

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-moss">
            Panel
          </p>
          <h2 className="mt-1.5 text-[30px] font-extrabold tracking-[-0.05em] text-ink sm:text-[38px]">
            Ajustes
          </h2>
          <p className="mt-2 max-w-[620px] text-[13px] leading-relaxed text-muted">
            Estado técnico del admin, seguridad, migraciones y datos actuales
            del inventario.
          </p>
        </div>

        <button
          type="button"
          onClick={onReload}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-full border border-line bg-paper px-4 py-2.5 text-[12px] font-semibold text-ink transition hover:border-ink/25 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
          Revisar estado
        </button>
      </div>

      <div className="mt-6 grid gap-5 xl:grid-cols-2">
        <SettingsCard
          title="Seguridad"
          description={
            securityReady
              ? "Supabase Auth activo. El panel exige sesión y todas las escrituras usan el token del administrador."
              : "El panel todavía no tiene login propio. Completá Auth y RLS antes de producción."
          }
          badge={
            <StatusPill tone={securityReady ? "ok" : "warn"}>
              {securityReady ? "Activo" : "Pendiente"}
            </StatusPill>
          }
        >
          <ul className="mt-5 space-y-2.5">
            <ChecklistItem done={securityReady}>
              Supabase Auth con email, contraseña y sesión persistente.
            </ChecklistItem>
            <ChecklistItem done={securityReady}>
              RLS para vehículos, fotos, categorías y contenido.
            </ChecklistItem>
            <ChecklistItem done={securityReady}>
              Storage con escritura reservada a administradores.
            </ChecklistItem>
            <ChecklistItem done={securityReady}>
              Credenciales legacy y funciones de sesión retiradas.
            </ChecklistItem>
          </ul>
          {securityReady ? (
            <div className="mt-5 rounded-xl border border-forest/20 bg-forest/5 px-4 py-3 text-[11.5px] leading-relaxed text-moss">
              <span className="font-bold">Panel protegido.</span> El acceso
              público solo muestra vehículos activos con estado{" "}
              <code className="rounded bg-cream px-1 py-0.5 text-[10.5px]">
                publicado
              </code>
              . El sitio público ya está en producción.
            </div>
          ) : (
            <div className="mt-5 rounded-xl border border-amber-300/80 bg-amber-50 px-4 py-3 text-[11.5px] leading-relaxed text-amber-900">
              <span className="font-bold">No publicar /admin en producción</span>{" "}
              hasta completar estos puntos. Hoy es un panel de staging.
            </div>
          )}
        </SettingsCard>

        <SettingsCard
          title="Ficha técnica"
          description="Columnas que usa el nuevo editor para cargar las especificaciones de la card y del detalle."
          badge={
            <StatusPill tone={specsReady ? "ok" : "warn"}>
              {specsReady ? "Aplicada" : "Migración pendiente"}
            </StatusPill>
          }
        >
          <div className="mt-5 flex flex-wrap gap-2">
            {[
              "version",
              "transmision",
              "combustible",
              "carroceria",
              "traccion",
              "potencia",
            ].map((column) => (
              <code
                key={column}
                className="rounded-lg border border-line bg-cream px-2.5 py-1.5 text-[10.5px] font-semibold text-moss"
              >
                {column}
              </code>
            ))}
          </div>
          <p className="mt-4 text-[11.5px] leading-relaxed text-muted">
            {specsReady ? (
              <>
                La migración ya está aplicada. El editor puede guardar versión,
                transmisión, combustible, carrocería, tracción y potencia; el
                sitio público las usa con prioridad sobre lo inferido.
              </>
            ) : (
              <>
                Ejecutá{" "}
                <code className="rounded bg-cream px-1.5 py-0.5 text-[11px] font-semibold text-ink">
                  supabase-stock-specs.sql
                </code>{" "}
                en el SQL Editor de Supabase. Mientras no esté aplicada, el
                sitio público sigue infiriendo las specs desde el título y la
                descripción.
              </>
            )}
          </p>
          {!specsReady && (
            <a
              href="https://supabase.com/dashboard/project/ymiakfjhgndqhdtoubkr/sql/new"
              target="_blank"
              rel="noreferrer"
              className="mt-3 inline-flex items-center gap-1.5 text-[11.5px] font-semibold text-forest transition hover:text-ink"
            >
              Abrir SQL Editor
              <ArrowUpRight className="h-3.5 w-3.5" />
            </a>
          )}
          {!specsReady && (
            <div className="mt-4 flex gap-2.5 rounded-xl border border-amber-300/80 bg-amber-50 px-4 py-3 text-[11.5px] leading-relaxed text-amber-900">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <p>
                La migración es necesaria para que el editor pueda guardar
                versión, transmisión, combustible, carrocería, tracción y
                potencia.
              </p>
            </div>
          )}
        </SettingsCard>

        <SettingsCard
          title="Datos actuales"
          description="Resumen del inventario que está leyendo el admin."
          badge={<StatusPill tone="ok">Supabase</StatusPill>}
        >
          <div className="mt-5 grid grid-cols-2 gap-2.5">
            <DataPoint icon={<Package className="h-4 w-4" />} label="Vehículos" value={total} />
            <DataPoint icon={<CarIcon className="h-4 w-4" />} label="Publicados" value={published} />
            <DataPoint icon={<ImageIcon className="h-4 w-4" />} label="Con fotos" value={withPhotos} />
            <DataPoint icon={<Cog className="h-4 w-4" />} label="Con precio" value={withPrice} />
          </div>
          <p className="mt-4 text-[11px] text-muted">
            {categories.length} categorías configuradas. El listado de stock
            muestra vehículos activos, publicados y borradores.
          </p>
        </SettingsCard>

        <SettingsCard
          title="Estado de la Fase 2"
          description="Editor completo de stock y publicación."
          badge={
            <StatusPill tone={specsReady ? "ok" : "warn"}>
              {specsReady ? "Listo" : "Falta migración"}
            </StatusPill>
          }
        >
          <ul className="mt-5 space-y-2.5">
            <ChecklistItem done>Shell con sidebar y navegación.</ChecklistItem>
            <ChecklistItem done>Resumen con métricas reales.</ChecklistItem>
            <ChecklistItem done>Listado de stock con búsqueda y filtros.</ChecklistItem>
            <ChecklistItem done>Vista de detalle y acceso a edición.</ChecklistItem>
            <ChecklistItem done>Alta y edición completa de vehículos.</ChecklistItem>
            <ChecklistItem done={specsReady}>
              Ficha técnica, precio y descripción.
            </ChecklistItem>
            <ChecklistItem done>Fotos con conversión a WebP y orden.</ChecklistItem>
            <ChecklistItem done>Publicar, despublicar y destacar.</ChecklistItem>
            <ChecklistItem done={securityReady}>Auth y RLS.</ChecklistItem>
            <ChecklistItem done>Cutover a producción.</ChecklistItem>
          </ul>
          {!specsReady && (
            <p className="mt-4 text-[11px] leading-relaxed text-muted">
              El código del editor está cerrado. La ficha técnica se habilita
              al aplicar la migración de Supabase.
            </p>
          )}
          <a
            href="/"
            target="_blank"
            rel="noreferrer"
            className="mt-5 inline-flex items-center gap-1.5 text-[11.5px] font-semibold text-forest transition hover:text-ink"
          >
            Abrir sitio público
            <ArrowUpRight className="h-3.5 w-3.5" />
          </a>
        </SettingsCard>
      </div>

      <div className="mt-5 flex gap-3 rounded-2xl border border-line bg-paper p-4 text-[11.5px] leading-relaxed text-muted">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-forest" />
        <p>
          El admin nuevo escribe directo contra Supabase, sin localStorage ni
          vehículos por defecto. El admin legacy de{" "}
          <code className="rounded bg-cream px-1.5 py-0.5 text-[11px] text-ink">
            legacy/
          </code>{" "}
          no se porta: solo se reutilizan ideas útiles como el pegado de texto y
          la conversión de fotos.
        </p>
      </div>
    </div>
  );
}

function DataPoint({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-xl border border-line bg-cream/45 px-3.5 py-3">
      <span className="grid h-7 w-7 place-items-center rounded-full bg-paper text-forest">
        {icon}
      </span>
      <p className="mt-2 text-[22px] font-extrabold leading-none tracking-[-0.04em] text-ink">
        {value}
      </p>
      <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted">
        {label}
      </p>
    </div>
  );
}
