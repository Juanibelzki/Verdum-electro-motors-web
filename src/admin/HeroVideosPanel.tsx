import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
} from "react";
import { ArrowUpRight, Check, Plus, X } from "../components/Icons";
import { heroPoster } from "../data/cars";
import {
  loadHeroScenes,
  saveHeroScenes,
  type HeroScene,
} from "../data/heroScenes";
import { MAX_HERO_VIDEO_BYTES, uploadHeroVideo } from "./heroVideosApi";

type Status = {
  tone: "success" | "error" | "info";
  text: string;
};

const formatBytes = (bytes: number) => `${Math.round(bytes / (1024 * 1024))} MB`;

const isMov = (scene: HeroScene) => /\.(mov|m4v)(\?|$)/i.test(scene.src);

const statusClasses = (tone: Status["tone"]) => {
  if (tone === "success") return "border-forest/20 bg-forest/10 text-forest";
  if (tone === "error") return "border-red-200 bg-red-50 text-red-700";
  return "border-line bg-cream text-moss";
};

export default function HeroVideosPanel() {
  const [scenes, setScenes] = useState<HeroScene[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [status, setStatus] = useState<Status | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const refresh = async () => {
    setLoading(true);
    setStatus(null);

    try {
      const current = await loadHeroScenes();
      setScenes(current);
      setDirty(false);
    } catch (cause) {
      setStatus({
        tone: "error",
        text:
          cause instanceof Error
            ? cause.message
            : "No se pudieron cargar los videos del hero.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refresh();
  }, []);

  const handleFiles = async (files: FileList | File[]) => {
    const list = Array.from(files);
    if (!list.length) return;

    setUploading(true);
    setStatus({
      tone: "info",
      text: `Subiendo ${list.length === 1 ? "1 video" : `${list.length} videos`}...`,
    });

    let uploaded = 0;
    const errors: string[] = [];
    let hasMov = false;

    for (const file of list) {
      try {
        setStatus({
          tone: "info",
          text: `Subiendo ${file.name} (${formatBytes(file.size)})...`,
        });
        const scene = await uploadHeroVideo(file);
        hasMov = hasMov || isMov(scene);
        setScenes((current) => [...current, scene]);
        setDirty(true);
        uploaded += 1;
      } catch (cause) {
        errors.push(
          cause instanceof Error ? cause.message : `No se pudo subir ${file.name}.`
        );
      }
    }

    setUploading(false);
    if (inputRef.current) inputRef.current.value = "";

    if (errors.length) {
      setStatus({
        tone: "error",
        text: `${errors.join(" ")}${uploaded ? ` Se subieron ${uploaded} video(s).` : ""}`,
      });
      return;
    }

    setStatus({
      tone: "success",
      text: `${
        uploaded === 1 ? "Video subido" : `${uploaded} videos subidos`
      }. Acordate de tocar “Guardar cambios” para publicarlos en el hero.${
        hasMov
          ? " Los archivos MOV pueden no reproducirse en Chrome; para máxima compatibilidad usá MP4 H.264."
          : ""
      }`,
    });
  };

  const onFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) void handleFiles(event.target.files);
  };

  const onDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (!uploading && event.dataTransfer.files.length) {
      void handleFiles(event.dataTransfer.files);
    }
  };

  const moveScene = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= scenes.length) return;

    const next = [...scenes];
    const [scene] = next.splice(index, 1);
    next.splice(target, 0, scene);
    setScenes(next);
    setDirty(true);
  };

  const updateLabel = (index: number, label: string) => {
    setScenes((current) =>
      current.map((scene, position) =>
        position === index ? { ...scene, label } : scene
      )
    );
    setDirty(true);
  };

  const removeScene = (index: number) => {
    setScenes((current) => current.filter((_, position) => position !== index));
    setDirty(true);
  };

  const handleSave = async () => {
    if (!scenes.length) {
      const confirmed = window.confirm(
        "No hay videos cargados. El hero va a volver a los videos de ejemplo. ¿Guardar igual?"
      );
      if (!confirmed) return;
    }

    setSaving(true);
    setStatus({ tone: "info", text: "Guardando en Supabase..." });

    try {
      await saveHeroScenes(scenes);
      setDirty(false);
      setStatus({
        tone: "success",
        text: "Guardado. Al recargar la home, el hero usa esta lista de videos.",
      });
    } catch (cause) {
      setStatus({
        tone: "error",
        text:
          cause instanceof Error
            ? cause.message
            : "No se pudieron guardar los videos.",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleRefresh = () => {
    if (dirty && !window.confirm("Hay cambios sin guardar. ¿Descartarlos?")) {
      return;
    }
    void refresh();
  };

  return (
    <section
      id="hero-videos"
      className="mt-8 scroll-mt-24 rounded-[1.75rem] border border-line bg-paper p-5 shadow-[0_30px_70px_-55px_rgba(20,36,30,0.8)] sm:p-7"
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-moss">
            Home · Hero
          </p>
          <h2 className="mt-1.5 text-[28px] font-extrabold tracking-[-0.04em] text-ink sm:text-[34px]">
            Videos del hero
          </h2>
          <p className="mt-2 max-w-[620px] text-[13px] leading-relaxed text-muted">
            Subí los videos que se reproducen en la portada, ordenalos y guardá
            los cambios. La home los lee desde Supabase.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleRefresh}
            disabled={loading || uploading || saving}
            className="rounded-full border border-line bg-cream px-4 py-2.5 text-[12px] font-semibold text-ink transition hover:border-ink/25 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Recargar
          </button>
          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={saving || uploading || !dirty}
            className="inline-flex items-center gap-2 rounded-full bg-lime px-5 py-2.5 text-[12px] font-bold text-ink transition hover:bg-lime-soft disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Check className="h-4 w-4" />
            {saving ? "Guardando..." : "Guardar cambios"}
          </button>
        </div>
      </div>

      <div className="mt-5 grid gap-3 rounded-2xl border border-line bg-cream/70 p-4 text-[12px] leading-relaxed text-moss sm:grid-cols-[1fr_auto] sm:items-center">
        <p>
          <strong className="text-ink">Formato recomendado:</strong> MP4 H.264,
          horizontal 16:9, 6 a 10 segundos, sin audio y hasta{" "}
          {formatBytes(MAX_HERO_VIDEO_BYTES)}. Los MOV/HEVC pueden no
          reproducirse en Chrome.
        </p>
        <span className="w-fit rounded-full border border-line bg-paper px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-muted">
          {scenes.length} {scenes.length === 1 ? "video" : "videos"}
        </span>
      </div>

      <div
        onDragOver={(event) => event.preventDefault()}
        onDrop={onDrop}
        className={`mt-4 rounded-2xl border-2 border-dashed p-5 text-center transition ${
          uploading
            ? "border-lime bg-lime/10"
            : "border-line bg-cream/40 hover:border-forest/30 hover:bg-cream/70"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept="video/mp4,video/webm,video/quicktime,video/x-m4v,.mp4,.webm,.mov,.m4v"
          multiple
          aria-label="Subir videos del hero"
          className="sr-only"
          onChange={onFileChange}
          disabled={uploading || saving}
        />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading || saving}
          className="inline-flex items-center gap-2 rounded-full bg-ink px-5 py-3 text-[12px] font-bold text-cream transition hover:bg-forest disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Plus className="h-4 w-4" />
          {uploading ? "Subiendo..." : "Subir videos"}
        </button>
        <p className="mt-3 text-[12px] text-muted">
          Arrastrá los archivos acá o elegilos desde tu computadora. Se suben a
          Supabase Storage y quedan listos para guardar.
        </p>
      </div>

      {status && (
        <p
          role="status"
          className={`mt-4 rounded-xl border px-4 py-3 text-[12px] font-medium leading-relaxed ${statusClasses(
            status.tone
          )}`}
        >
          {status.text}
        </p>
      )}

      <div className="mt-6">
        {loading ? (
          <p className="rounded-2xl border border-line bg-cream/50 px-5 py-8 text-center text-[13px] text-muted">
            Cargando videos...
          </p>
        ) : scenes.length === 0 ? (
          <div className="rounded-2xl border border-line bg-cream/50 px-6 py-10 text-center">
            <p className="text-[15px] font-bold text-ink">
              Todavía no hay videos guardados.
            </p>
            <p className="mx-auto mt-2 max-w-[480px] text-[12.5px] leading-relaxed text-muted">
              Mientras tanto, la home usa los videos de ejemplo. Subí el primero
              y guardá los cambios para reemplazarlos.
            </p>
          </div>
        ) : (
          <ol className="grid gap-4">
            {scenes.map((scene, index) => (
              <li
                key={scene.id}
                className="grid gap-4 rounded-2xl border border-line bg-cream/40 p-4 sm:grid-cols-[230px_minmax(0,1fr)]"
              >
                <div className="overflow-hidden rounded-xl border border-line bg-ink">
                  {scene.type === "image" ? (
                    <img
                      src={scene.src}
                      alt={scene.label || `Hero ${index + 1}`}
                      className="aspect-video h-full w-full object-cover"
                    />
                  ) : (
                    <video
                      src={scene.src}
                      poster={scene.poster || heroPoster}
                      controls
                      muted
                      playsInline
                      preload="metadata"
                      className="aspect-video h-full w-full bg-ink object-cover"
                    />
                  )}
                </div>

                <div className="min-w-0">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="grid h-7 w-7 place-items-center rounded-full bg-ink text-[10px] font-bold text-cream">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted">
                        {scene.type === "image" ? "Imagen" : "Video"}
                      </span>
                      {isMov(scene) && (
                        <span className="rounded-full border border-amber-300 bg-amber-50 px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.12em] text-amber-700">
                          MOV / HEVC
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => moveScene(index, -1)}
                        disabled={index === 0}
                        aria-label="Mover video arriba"
                        title="Mover arriba"
                        className="grid h-8 w-8 place-items-center rounded-full border border-line bg-paper text-[14px] font-bold text-ink transition hover:border-ink/25 disabled:cursor-not-allowed disabled:opacity-35"
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        onClick={() => moveScene(index, 1)}
                        disabled={index === scenes.length - 1}
                        aria-label="Mover video abajo"
                        title="Mover abajo"
                        className="grid h-8 w-8 place-items-center rounded-full border border-line bg-paper text-[14px] font-bold text-ink transition hover:border-ink/25 disabled:cursor-not-allowed disabled:opacity-35"
                      >
                        ↓
                      </button>
                      <button
                        type="button"
                        onClick={() => removeScene(index)}
                        aria-label="Quitar video del hero"
                        title="Quitar de la lista"
                        className="grid h-8 w-8 place-items-center rounded-full border border-red-200 bg-red-50 text-red-600 transition hover:bg-red-100"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <label className="mt-3 block">
                    <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted">
                      Etiqueta interna
                    </span>
                    <input
                      type="text"
                      value={scene.label ?? ""}
                      onChange={(event) =>
                        updateLabel(index, event.target.value)
                      }
                      placeholder="Ej. Accesoramiento, showroom, entrega..."
                      className="mt-1.5 w-full rounded-xl border border-line bg-paper px-3.5 py-2.5 text-[12.5px] text-ink outline-none transition placeholder:text-muted/60 focus:border-forest/40 focus:ring-2 focus:ring-lime/50"
                    />
                  </label>

                  <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-muted">
                    <a
                      href={scene.src}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 font-semibold text-forest transition hover:text-ink"
                    >
                      Ver archivo original
                      <ArrowUpRight className="h-3 w-3" />
                    </a>
                    <span className="max-w-full truncate">
                      {scene.src.split("/").slice(-2).join("/")}
                    </span>
                  </div>

                  {scene.type !== "image" && !scene.poster && (
                    <p className="mt-2 text-[11px] text-amber-700">
                      Sin poster propio: se usa la imagen de respaldo mientras
                      carga.
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ol>
        )}
      </div>

      <p className="mt-6 border-t border-line/80 pt-4 text-[11px] leading-relaxed text-muted">
        Quitar un video de la lista no borra el archivo de Storage. Los cambios
        recién se publican en la home al tocar “Guardar cambios”.
      </p>
    </section>
  );
}
