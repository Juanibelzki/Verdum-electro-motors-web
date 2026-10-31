import { useEffect, useState, type ComponentType, type SVGProps } from "react";
import { cn } from "../utils/cn";
import {
  ArrowUpRight,
  CarIcon,
  ChevronRight,
  Cog,
  Dashboard,
  Instagram,
  LogOut,
  Menu,
  Play,
  ShieldCheck,
  X,
} from "../components/Icons";
import type { AdminSession } from "../data/auth";
import AdminLogin from "./AdminLogin";
import HeroVideosPanel from "./HeroVideosPanel";
import ShowroomStoriesPanel from "./ShowroomStoriesPanel";
import OverviewPanel from "./OverviewPanel";
import SettingsPanel from "./SettingsPanel";
import StockPanel from "./StockPanel";
import { useAdminAuth } from "./useAdminAuth";
import { useAdminStock } from "./useAdminStock";

type AdminSection = "overview" | "stock" | "hero" | "stories" | "settings";
type IconComponent = ComponentType<SVGProps<SVGSVGElement>>;

const SECTION_IDS: AdminSection[] = [
  "overview",
  "stock",
  "hero",
  "stories",
  "settings",
];

const SECTION_META: Record<
  AdminSection,
  { label: string; eyebrow: string }
> = {
  overview: { label: "Resumen", eyebrow: "Panel" },
  stock: { label: "Stock", eyebrow: "Vehículos" },
  hero: { label: "Hero", eyebrow: "Home" },
  stories: { label: "Historias", eyebrow: "Home" },
  settings: { label: "Ajustes", eyebrow: "Panel" },
};

function readSection(): AdminSection {
  const hash = window.location.hash.replace(/^#\/?/, "");
  return SECTION_IDS.includes(hash as AdminSection)
    ? (hash as AdminSection)
    : "overview";
}

function Brand({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex items-center gap-3 text-left"
    >
      <span className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-full bg-forest ring-1 ring-white/10 transition group-hover:ring-lime/60">
        <img
          src="/logo-verdun.png"
          alt="Verdun Automotores"
          className="h-11 w-11 scale-110 object-contain"
        />
      </span>
      <span className="leading-none">
        <span className="block text-[17px] font-extrabold tracking-[-0.045em] text-cream">
          VERDUN
        </span>
        <span className="mt-1 block text-[8px] font-semibold uppercase tracking-[0.3em] text-cream/45">
          Automotores
        </span>
      </span>
    </button>
  );
}

function NavItem({
  icon: Icon,
  label,
  active,
  onClick,
  badge,
  sub = false,
}: {
  icon: IconComponent;
  label: string;
  active: boolean;
  onClick: () => void;
  badge?: number;
  sub?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={cn(
        "group flex w-full items-center gap-2.5 rounded-xl text-left text-[12px] font-semibold transition",
        sub ? "px-3 py-2 pl-9" : "px-3 py-2.5",
        active
          ? "bg-lime text-ink"
          : "text-cream/65 hover:bg-white/[0.07] hover:text-cream"
      )}
    >
      <Icon
        className={cn(
          "shrink-0",
          sub ? "h-3.5 w-3.5" : "h-4 w-4",
          active ? "text-ink" : "text-cream/45 group-hover:text-cream/75"
        )}
      />
      <span className="min-w-0 flex-1 truncate">{label}</span>
      {badge != null && (
        <span
          className={cn(
            "rounded-full px-1.5 py-0.5 text-[9px] font-bold",
            active ? "bg-ink/10 text-ink" : "bg-white/10 text-cream/60"
          )}
        >
          {badge}
        </span>
      )}
    </button>
  );
}

function SidebarContent({
  activeSection,
  activeCount,
  draftCount,
  adminEmail,
  onNavigate,
  onSignOut,
  onClose,
}: {
  activeSection: AdminSection;
  activeCount: number;
  draftCount: number;
  adminEmail: string | null;
  onNavigate: (section: AdminSection) => void;
  onSignOut: () => void;
  onClose?: () => void;
}) {
  return (
    <>
      <div className="flex items-start justify-between gap-3">
        <Brand onClick={() => onNavigate("overview")} />
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar menú"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-white/10 bg-white/5 text-cream/70 transition hover:bg-white/10 hover:text-cream"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <nav className="mt-7 flex-1 space-y-1" aria-label="Secciones del admin">
        <NavItem
          icon={Dashboard}
          label="Resumen"
          active={activeSection === "overview"}
          onClick={() => onNavigate("overview")}
        />
        <NavItem
          icon={CarIcon}
          label="Stock"
          active={activeSection === "stock"}
          onClick={() => onNavigate("stock")}
          badge={activeCount}
        />

        <p className="px-3 pb-1 pt-5 text-[8.5px] font-bold uppercase tracking-[0.22em] text-cream/30">
          Home
        </p>
        <NavItem
          icon={Play}
          label="Hero"
          sub
          active={activeSection === "hero"}
          onClick={() => onNavigate("hero")}
        />
        <NavItem
          icon={Instagram}
          label="Historias"
          sub
          active={activeSection === "stories"}
          onClick={() => onNavigate("stories")}
        />

        <p className="px-3 pb-1 pt-5 text-[8.5px] font-bold uppercase tracking-[0.22em] text-cream/30">
          Panel
        </p>
        <NavItem
          icon={Cog}
          label="Ajustes"
          active={activeSection === "settings"}
          onClick={() => onNavigate("settings")}
        />
      </nav>

      <div className="mt-auto space-y-3 pt-6">
        <div className="rounded-2xl border border-white/10 bg-white/[0.055] p-3.5">
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-lime" />
            <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-lime">
              Sesión admin
            </p>
          </div>
          <p className="mt-2 truncate text-[10.5px] text-cream/70">
            {adminEmail ?? "Usuario autenticado"}
          </p>
          <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1">
            <button
              type="button"
              onClick={() => onNavigate("settings")}
              className="inline-flex items-center gap-1 text-[10px] font-semibold text-cream/70 transition hover:text-cream"
            >
              Seguridad
              <ChevronRight className="h-3 w-3" />
            </button>
            <button
              type="button"
              onClick={onSignOut}
              className="inline-flex items-center gap-1 text-[10px] font-semibold text-cream/55 transition hover:text-cream"
            >
              <LogOut className="h-3 w-3" />
              Cerrar sesión
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 px-1 text-[10px] text-cream/35">
          <span>{draftCount} borradores</span>
          <a
            href="/"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 font-semibold text-cream/55 transition hover:text-cream"
          >
            Ver sitio
            <ArrowUpRight className="h-3 w-3" />
          </a>
        </div>
      </div>
    </>
  );
}

function AdminLoading() {
  return (
    <div className="grid min-h-screen place-items-center bg-ink px-4 text-cream">
      <div className="flex flex-col items-center gap-4 text-center">
        <span className="grid h-14 w-14 place-items-center overflow-hidden rounded-full bg-forest ring-1 ring-white/10">
          <img
            src="/logo-verdun.png"
            alt="Verdun Automotores"
            className="h-14 w-14 scale-110 object-contain"
          />
        </span>
        <span className="h-5 w-5 animate-spin rounded-full border-2 border-cream/15 border-t-lime" />
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-cream/45">
          Verificando sesión
        </p>
      </div>
    </div>
  );
}

function AdminAccessDenied({
  email,
  onSignOut,
}: {
  email: string | null;
  onSignOut: () => void;
}) {
  return (
    <div className="grid min-h-screen place-items-center bg-ink px-4 py-10 text-cream">
      <div className="w-full max-w-md rounded-[2rem] border border-white/10 bg-forest p-7 text-center shadow-[0_40px_100px_-50px_rgba(0,0,0,0.9)] sm:p-9">
        <span className="mx-auto grid h-14 w-14 place-items-center overflow-hidden rounded-full bg-ink ring-1 ring-white/10">
          <img
            src="/logo-verdun.png"
            alt="Verdun Automotores"
            className="h-14 w-14 scale-110 object-contain"
          />
        </span>
        <p className="mt-6 text-[10px] font-bold uppercase tracking-[0.2em] text-lime">
          Acceso restringido
        </p>
        <h1 className="mt-2 text-[28px] font-extrabold tracking-[-0.05em] text-cream">
          Tu usuario no es administrador
        </h1>
        <p className="mt-3 text-[12.5px] leading-relaxed text-cream/55">
          La sesión es válida{email ? ` (${email})` : ""}, pero el usuario no
          está habilitado como administrador. Pedile al responsable del panel
          que agregue tu usuario a la tabla de administradores.
        </p>
        <div className="mt-6 grid gap-2">
          <button
            type="button"
            onClick={onSignOut}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-lime px-5 py-3 text-[12.5px] font-bold text-ink transition hover:bg-lime-soft"
          >
            <LogOut className="h-4 w-4" />
            Cerrar sesión
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center gap-1.5 rounded-full border border-white/10 px-5 py-3 text-[12px] font-semibold text-cream/70 transition hover:bg-white/5 hover:text-cream"
          >
            Volver al sitio
            <ArrowUpRight className="h-3.5 w-3.5" />
          </a>
        </div>
      </div>
    </div>
  );
}

function SunIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      className={className}
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
    </svg>
  );
}

function MoonIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M21 12.79A9 9 0 1 1 11.21 3a7 7 0 0 0 9.79 9.79Z" />
    </svg>
  );
}

function AdminWorkspace({
  session,
  securityReady,
  onSignOut,
}: {
  session: AdminSession;
  securityReady: boolean;
  onSignOut: () => void;
}) {
  const [section, setSection] = useState<AdminSection>(() => readSection());
  const [mobileOpen, setMobileOpen] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    const saved = localStorage.getItem("verdun_admin_theme");
    if (saved === "light" || saved === "dark") return saved;
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  });
  const stock = useAdminStock();

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("verdun_admin_theme", theme);
    return () => {
      document.documentElement.removeAttribute("data-theme");
    };
  }, [theme]);

  const activeCount = stock.vehicles.filter((vehicle) => vehicle.activo).length;
  const draftCount = stock.vehicles.length - activeCount;
  const meta = SECTION_META[section];

  useEffect(() => {
    const onHashChange = () => setSection(readSection());
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  useEffect(() => {
    if (!mobileOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [mobileOpen]);

  const navigate = (next: AdminSection) => {
    setSection(next);
    setMobileOpen(false);
    if (window.location.hash !== `#${next}`) {
      window.history.replaceState(null, "", `#${next}`);
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-cream lg:grid lg:grid-cols-[264px_minmax(0,1fr)]">
      <aside className="hidden border-r border-white/5 bg-ink p-5 lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col lg:overflow-y-auto">
        <SidebarContent
          activeSection={section}
          activeCount={activeCount}
          draftCount={draftCount}
          adminEmail={session.user.email}
          onNavigate={navigate}
          onSignOut={onSignOut}
        />
      </aside>

      <div className="flex min-h-screen min-w-0 flex-col">
        <header className="sticky top-0 z-30 border-b border-line bg-paper/90 backdrop-blur">
          <div className="flex min-h-16 items-center gap-3 px-4 sm:px-6 lg:px-8">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              aria-label="Abrir menú del admin"
              className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-line bg-cream text-ink transition hover:border-ink/25 lg:hidden"
            >
              <Menu className="h-4 w-4" />
            </button>

            <div className="min-w-0">
              <p className="truncate text-[9px] font-bold uppercase tracking-[0.2em] text-moss">
                {meta.eyebrow}
              </p>
              <h1 className="truncate text-[19px] font-extrabold tracking-[-0.035em] text-ink">
                {meta.label}
              </h1>
            </div>

            <div className="ml-auto flex items-center gap-2">
              <span className="hidden rounded-full border border-line bg-cream px-3 py-1 text-[9px] font-bold uppercase tracking-[0.16em] text-muted sm:inline-flex">
                Sesión activa
              </span>
              <button
                type="button"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                aria-label={
                  theme === "dark" ? "Activar modo claro" : "Activar modo oscuro"
                }
                title={theme === "dark" ? "Modo claro" : "Modo oscuro"}
                className="grid h-9 w-9 place-items-center rounded-full border border-line bg-cream text-muted transition hover:border-ink/25 hover:text-ink"
              >
                {theme === "dark" ? (
                  <SunIcon className="h-4 w-4" />
                ) : (
                  <MoonIcon className="h-4 w-4" />
                )}
              </button>
              <button
                type="button"
                onClick={onSignOut}
                aria-label="Cerrar sesión"
                title="Cerrar sesión"
                className="hidden h-9 w-9 place-items-center rounded-full border border-line bg-cream text-muted transition hover:border-ink/25 hover:text-ink sm:grid"
              >
                <LogOut className="h-4 w-4" />
              </button>
              <a
                href="/"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 rounded-full bg-ink px-3.5 py-2 text-[11px] font-semibold text-cream transition hover:bg-forest"
              >
                Ver sitio
                <ArrowUpRight className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-[1440px] flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          {section === "overview" && (
            <OverviewPanel
              vehicles={stock.vehicles}
              categories={stock.categories}
              specsReady={stock.specsReady}
              loading={stock.loading}
              error={stock.error}
              onReload={stock.reload}
              onNavigate={navigate}
            />
          )}

          {section === "stock" && (
            <StockPanel
              vehicles={stock.vehicles}
              categories={stock.categories}
              loading={stock.loading}
              error={stock.error}
              specsReady={stock.specsReady}
              onReload={stock.reload}
            />
          )}

          {section === "hero" && <HeroVideosPanel />}
          {section === "stories" && <ShowroomStoriesPanel />}

          {section === "settings" && (
            <SettingsPanel
              vehicles={stock.vehicles}
              categories={stock.categories}
              specsReady={stock.specsReady}
              securityReady={securityReady}
              loading={stock.loading}
              onReload={stock.reload}
            />
          )}
        </main>

        <footer className="border-t border-line">
          <div className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-between gap-2 px-4 py-5 text-[10.5px] text-muted sm:px-6 lg:px-8">
            <p className="flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5" />
              Verdun Automotores · Panel de administración
            </p>
            <p>Av. Chacabuco 1725 · Corrientes</p>
          </div>
        </footer>
      </div>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Cerrar menú"
            onClick={() => setMobileOpen(false)}
            className="animate-overlay absolute inset-0 bg-ink/65 backdrop-blur-[3px]"
          />
          <aside className="animate-drawer absolute inset-y-0 left-0 flex w-[286px] flex-col bg-ink p-5 shadow-[24px_0_80px_-30px_rgba(0,0,0,0.65)]">
            <div className="flex min-h-0 flex-1 flex-col">
              <SidebarContent
                activeSection={section}
                activeCount={activeCount}
                draftCount={draftCount}
                adminEmail={session.user.email}
                onNavigate={navigate}
                onSignOut={onSignOut}
                onClose={() => setMobileOpen(false)}
              />
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}

export default function AdminApp() {
  const auth = useAdminAuth();

  useEffect(() => {
    const previousTitle = document.title;
    document.title = "Admin · Verdun Automotores";

    const robots = document.createElement("meta");
    robots.name = "robots";
    robots.content = "noindex,nofollow";
    document.head.appendChild(robots);

    return () => {
      document.title = previousTitle;
      robots.remove();
    };
  }, []);

  if (auth.checking) return <AdminLoading />;
  if (!auth.session) return <AdminLogin />;
  if (!auth.isAdmin) {
    return (
      <AdminAccessDenied
        email={auth.session.user.email}
        onSignOut={() => {
          void auth.signOut();
        }}
      />
    );
  }

  return (
    <AdminWorkspace
      session={auth.session}
      securityReady={auth.isAdmin}
      onSignOut={() => {
        void auth.signOut();
      }}
    />
  );
}
