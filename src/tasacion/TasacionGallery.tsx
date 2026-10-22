import { useCallback, useEffect, useState } from "react";
import { ArrowUpRight, MapPin } from "../components/Icons";
import { Eyebrow } from "../components/ui";
import {
  getTasacionIdFromPath,
  loadTasacionRequest,
  type TasacionRequest,
} from "../data/tasacion";

type GalleryState =
  | { status: "loading"; request: null }
  | { status: "ready"; request: TasacionRequest }
  | { status: "missing"; request: null }
  | { status: "error"; request: null };

const kmLabel = (value: string) => {
  const number = Number(value);
  return Number.isFinite(number) && value.trim()
    ? `${number.toLocaleString("es-AR")} km`
    : value || "—";
};

const dateLabel = (value: string) => {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? ""
    : date.toLocaleDateString("es-AR", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      });
};

export default function TasacionGallery() {
  const id = getTasacionIdFromPath(window.location.pathname);
  const [state, setState] = useState<GalleryState>({
    status: "loading",
    request: null,
  });

  useEffect(() => {
    const previousTitle = document.title;
    document.title = "Fotos del vehículo · Verdun Automotores";

    const robots = document.createElement("meta");
    robots.name = "robots";
    robots.content = "noindex,nofollow";
    document.head.appendChild(robots);

    return () => {
      document.title = previousTitle;
      robots.remove();
    };
  }, []);

  const load = useCallback(async () => {
    if (!id) {
      setState({ status: "missing", request: null });
      return;
    }

    setState({ status: "loading", request: null });

    try {
      const request = await loadTasacionRequest(id);
      setState(
        request
          ? { status: "ready", request }
          : { status: "missing", request: null }
      );
    } catch {
      setState({ status: "error", request: null });
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  const request = state.status === "ready" ? state.request : null;
  const vehicleName =
    [request?.brand, request?.model].filter(Boolean).join(" ") || "tu vehículo";
  const created = request ? dateLabel(request.createdAt) : "";

  return (
    <div className="min-h-screen bg-cream">
      <header className="border-b border-line bg-paper/90 backdrop-blur">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 px-5 py-4 sm:px-8">
          <a href="/" className="group flex items-center gap-3">
            <span className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-full bg-ink ring-1 ring-ink/10 transition group-hover:ring-lime/60">
              <img
                src="/logo-verdun.png"
                alt="Verdun Automotores"
                className="h-11 w-11 scale-110 object-contain"
              />
            </span>
            <span className="leading-none">
              <span className="block text-[17px] font-extrabold tracking-[-0.045em] text-ink">
                VERDUN
              </span>
              <span className="mt-1 block text-[8px] font-semibold uppercase tracking-[0.3em] text-muted">
                Automotores
              </span>
            </span>
          </a>

          <a
            href="/#vender"
            className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-forest transition hover:text-ink"
          >
            Volver al sitio
            <ArrowUpRight className="h-3.5 w-3.5" />
          </a>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-5 py-12 sm:px-8 sm:py-16">
        <Eyebrow>Tasación online</Eyebrow>
        <h1 className="mt-4 text-[clamp(2.2rem,6vw,3.8rem)] font-extrabold leading-[1.01] tracking-[-0.055em] text-ink">
          Fotos del{" "}
          <span className="font-serif font-normal italic tracking-[-0.01em] text-forest">
            vehículo.
          </span>
        </h1>

        {state.status === "loading" && (
          <div className="mt-8 rounded-2xl border border-line bg-paper px-6 py-16 text-center">
            <p className="text-[13px] font-semibold text-muted">
              Cargando las fotos de la solicitud...
            </p>
          </div>
        )}

        {state.status === "missing" && (
          <div className="mt-8 rounded-2xl border border-line bg-paper px-6 py-12 text-center">
            <p className="text-[18px] font-extrabold tracking-[-0.03em] text-ink">
              No encontramos esta solicitud.
            </p>
            <p className="mx-auto mt-2 max-w-md text-[13px] leading-relaxed text-muted">
              El enlace puede estar incompleto o la solicitud ya no está
              disponible. Podés volver al formulario y enviarla de nuevo.
            </p>
            <a
              href="/#vender"
              className="mt-5 inline-flex items-center gap-2 rounded-full bg-lime px-5 py-3 text-[12px] font-bold text-ink transition hover:bg-lime-soft"
            >
              Volver a la tasación
              <ArrowUpRight className="h-4 w-4" />
            </a>
          </div>
        )}

        {state.status === "error" && (
          <div className="mt-8 rounded-2xl border border-red-200 bg-red-50 px-6 py-12 text-center">
            <p className="text-[18px] font-extrabold tracking-[-0.03em] text-red-800">
              No pudimos cargar las fotos.
            </p>
            <p className="mx-auto mt-2 max-w-md text-[13px] leading-relaxed text-red-700">
              Revisá la conexión e intentá de nuevo.
            </p>
            <button
              type="button"
              onClick={() => void load()}
              className="mt-5 inline-flex items-center gap-2 rounded-full bg-ink px-5 py-3 text-[12px] font-bold text-cream transition hover:bg-forest"
            >
              Reintentar
            </button>
          </div>
        )}

        {request && (
          <>
            <p className="mt-4 max-w-xl text-[13px] leading-relaxed text-muted">
              Estas son las fotos que se enviaron junto a la solicitud de
              tasación de {vehicleName}.
              {created ? ` Solicitud del ${created}.` : ""}
            </p>

            <div className="mt-7 grid gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-4">
              {[
                ["Marca", request.brand || "—"],
                ["Modelo", request.model || "—"],
                ["Año", request.year || "—"],
                ["Kilómetros", kmLabel(request.km)],
              ].map(([label, value]) => (
                <div key={label} className="bg-paper px-4 py-3.5">
                  <p className="text-[8.5px] font-bold uppercase tracking-[0.16em] text-muted">
                    {label}
                  </p>
                  <p className="mt-1 text-[12.5px] font-semibold text-ink">
                    {value}
                  </p>
                </div>
              ))}
            </div>

            {request.photos.length ? (
              <div className="mt-7 grid gap-3 sm:grid-cols-2">
                {request.photos.map((photo, index) => (
                  <a
                    key={photo}
                    href={photo}
                    target="_blank"
                    rel="noreferrer"
                    className="group overflow-hidden rounded-2xl border border-line bg-paper"
                  >
                    <img
                      src={photo}
                      alt={`Foto ${index + 1} de ${vehicleName}`}
                      loading={index === 0 ? "eager" : "lazy"}
                      className="aspect-[4/3] w-full object-cover transition duration-500 group-hover:scale-[1.015]"
                    />
                    <div className="flex items-center justify-between px-4 py-3">
                      <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted">
                        Foto {index + 1}
                      </span>
                      <ArrowUpRight className="h-3.5 w-3.5 text-forest transition group-hover:text-ink" />
                    </div>
                  </a>
                ))}
              </div>
            ) : (
              <div className="mt-7 rounded-2xl border border-line bg-paper px-6 py-10 text-center text-[13px] text-muted">
                No se adjuntaron fotos a esta solicitud.
              </div>
            )}

            <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-line pt-5 text-[10.5px] text-muted">
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-forest" />
                Av. Chacabuco 1725 · Corrientes
              </span>
              <a
                href="https://wa.me/5493795300020"
                target="_blank"
                rel="noreferrer"
                className="font-semibold text-forest transition hover:text-ink"
              >
                Escribir por WhatsApp
              </a>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
