import { useState, type FormEvent } from "react";
import {
  ArrowUpRight,
  Eye,
  Key,
  Mail,
  ShieldCheck,
} from "../components/Icons";
import { signIn } from "../data/auth";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (loading) return;

    setError(null);
    setLoading(true);

    try {
      await signIn(email, password);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "No se pudo iniciar sesión. Intentá de nuevo."
      );
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-ink text-cream">
      <div className="mx-auto flex min-h-screen w-full max-w-6xl items-center px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid w-full gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-stretch">
          <section className="relative hidden overflow-hidden rounded-[2rem] border border-white/10 bg-forest p-8 lg:flex lg:flex-col lg:justify-between">
            <div className="absolute -right-16 -top-20 h-64 w-64 rounded-full bg-lime/10 blur-3xl" />
            <div className="relative">
              <div className="flex items-center gap-3">
                <span className="grid h-12 w-12 place-items-center overflow-hidden rounded-full bg-ink ring-1 ring-white/10">
                  <img
                    src="/logo-verdun.png"
                    alt="Verdun Automotores"
                    className="h-12 w-12 scale-110 object-contain"
                  />
                </span>
                <span>
                  <span className="block text-[18px] font-extrabold tracking-[-0.045em] text-cream">
                    VERDUN
                  </span>
                  <span className="mt-1 block text-[8px] font-semibold uppercase tracking-[0.3em] text-cream/45">
                    Automotores
                  </span>
                </span>
              </div>

              <p className="mt-16 max-w-[430px] text-[11px] font-bold uppercase tracking-[0.22em] text-lime">
                Panel de administración
              </p>
              <h1 className="mt-4 max-w-[460px] text-[42px] font-extrabold leading-[0.95] tracking-[-0.06em] text-cream">
                Tu stock, tus videos y tus historias.
              </h1>
              <p className="mt-5 max-w-[420px] text-[13px] leading-relaxed text-cream/55">
                Acceso privado para administrar el inventario y el contenido de
                la web de Verdun Automotores.
              </p>
            </div>

            <div className="relative mt-12 grid gap-3 text-[11.5px] leading-relaxed text-cream/60">
              <p className="flex items-start gap-2.5">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-lime" />
                Supabase Auth con sesión protegida y RLS por usuario
                administrador.
              </p>
              <p className="flex items-start gap-2.5">
                <Key className="mt-0.5 h-4 w-4 shrink-0 text-lime" />
                Las escrituras del panel requieren una sesión válida.
              </p>
            </div>
          </section>

          <section className="flex items-center justify-center">
            <div className="w-full max-w-[430px] rounded-[2rem] bg-paper p-6 text-ink shadow-[0_40px_100px_-50px_rgba(0,0,0,0.8)] sm:p-8">
              <div className="flex items-center gap-3 lg:hidden">
                <span className="grid h-10 w-10 place-items-center overflow-hidden rounded-full bg-forest">
                  <img
                    src="/logo-verdun.png"
                    alt="Verdun Automotores"
                    className="h-10 w-10 scale-110 object-contain"
                  />
                </span>
                <span className="text-[14px] font-extrabold tracking-[-0.04em] text-ink">
                  VERDUN
                  <span className="ml-1.5 text-[8px] font-semibold uppercase tracking-[0.22em] text-muted">
                    Automotores
                  </span>
                </span>
              </div>

              <p className="mt-8 text-[10px] font-bold uppercase tracking-[0.2em] text-moss lg:mt-0">
                Acceso privado
              </p>
              <h2 className="mt-2 text-[30px] font-extrabold tracking-[-0.05em] text-ink">
                Iniciar sesión
              </h2>
              <p className="mt-2 text-[12.5px] leading-relaxed text-muted">
                Ingresá con el usuario administrador de Verdun. Si no tenés
                acceso, pedile las credenciales al responsable del panel.
              </p>

              <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                <label className="block">
                  <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted">
                    Email
                  </span>
                  <span className="relative mt-1.5 block">
                    <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                    <input
                      type="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      autoComplete="username"
                      autoFocus
                      required
                      placeholder="admin@verdun.com.ar"
                      className="w-full rounded-xl border border-line bg-cream/50 py-3 pl-10 pr-3.5 text-[13px] text-ink outline-none transition placeholder:text-muted/60 focus:border-forest/40 focus:ring-2 focus:ring-lime/50"
                    />
                  </span>
                </label>

                <label className="block">
                  <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted">
                    Contraseña
                  </span>
                  <span className="relative mt-1.5 block">
                    <Key className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      autoComplete="current-password"
                      required
                      placeholder="Tu contraseña"
                      className="w-full rounded-xl border border-line bg-cream/50 py-3 pl-10 pr-11 text-[13px] text-ink outline-none transition placeholder:text-muted/60 focus:border-forest/40 focus:ring-2 focus:ring-lime/50"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((current) => !current)}
                      aria-label={
                        showPassword ? "Ocultar contraseña" : "Mostrar contraseña"
                      }
                      className="absolute right-2 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-lg text-muted transition hover:bg-cream hover:text-ink"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                  </span>
                </label>

                {error && (
                  <p
                    role="alert"
                    className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[12px] font-medium leading-relaxed text-red-700"
                  >
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-lime px-5 py-3 text-[12.5px] font-bold text-ink transition hover:bg-lime-soft disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? "Ingresando..." : "Ingresar al panel"}
                </button>
              </form>

              <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4 text-[11px]">
                <a
                  href="/"
                  className="inline-flex items-center gap-1.5 font-semibold text-forest transition hover:text-ink"
                >
                  Volver al sitio
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </a>
                <span className="text-muted">Solo usuarios autorizados</span>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
