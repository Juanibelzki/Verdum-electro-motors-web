import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
} from "react";
import { ArrowUpRight, Check, Plus, X } from "../components/Icons";
import { images } from "../data/cars";
import {
  loadShowroomStories,
  saveShowroomStories,
  type ShowroomStory,
} from "../data/showroomStories";
import {
  MAX_STORY_IMAGE_BYTES,
  MAX_STORY_VIDEO_BYTES,
  uploadShowroomStory,
} from "./showroomStoriesApi";

type Status = {
  tone: "success" | "error" | "info";
  text: string;
};

const formatBytes = (bytes: number) => `${Math.round(bytes / (1024 * 1024))} MB`;

const statusClasses = (tone: Status["tone"]) => {
  if (tone === "success") return "border-forest/20 bg-forest/10 text-forest";
  if (tone === "error") return "border-red-200 bg-red-50 text-red-700";
  return "border-line bg-cream text-moss";
};

const isMov = (story: ShowroomStory) => /\.(mov|m4v)(\?|$)/i.test(story.src);

export default function ShowroomStoriesPanel() {
  const [stories, setStories] = useState<ShowroomStory[]>([]);
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
      const current = await loadShowroomStories();
      setStories(current);
      setDirty(false);
    } catch (cause) {
      setStatus({
        tone: "error",
        text:
          cause instanceof Error
            ? cause.message
            : "No se pudieron cargar las historias.",
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
      text: `Subiendo ${list.length === 1 ? "1 archivo" : `${list.length} archivos`}...`,
    });

    let uploaded = 0;
    const errors: string[] = [];
    let hasMov = false;

    for (const file of list) {
      try {
        setStatus({
          tone: "info",
          text: `Procesando ${file.name} (${formatBytes(file.size)})...`,
        });
        const story = await uploadShowroomStory(file);
        hasMov = hasMov || (story.type === "video" && isMov(story));
        setStories((current) => [...current, story]);
        setDirty(true);
        uploaded += 1;
      } catch (cause) {
        errors.push(
          cause instanceof Error
            ? cause.message
            : `No se pudo subir ${file.name}.`
        );
      }
    }

    setUploading(false);
    if (inputRef.current) inputRef.current.value = "";

    if (errors.length) {
      setStatus({
        tone: "error",
        text: `${errors.join(" ")}${uploaded ? ` Se subieron ${uploaded} archivo(s).` : ""}`,
      });
      return;
    }

    setStatus({
      tone: "success",
      text: `${
        uploaded === 1 ? "Archivo listo" : `${uploaded} archivos listos`
      }. Acordate de tocar “Guardar historias” para publicarlos en el showroom.${
        hasMov
          ? " Los archivos MOV pueden no reproducirse en todos los navegadores; para reels usá MP4 H.264."
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

  const moveStory = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= stories.length) return;

    const next = [...stories];
    const [story] = next.splice(index, 1);
    next.splice(target, 0, story);
    setStories(next);
    setDirty(true);
  };

  const updateLabel = (index: number, label: string) => {
    setStories((current) =>
      current.map((story, position) =>
        position === index ? { ...story, label } : story
      )
    );
    setDirty(true);
  };

  const removeStory = (index: number) => {
    setStories((current) => current.filter((_, position) => position !== index));
    setDirty(true);
  };

  const handleSave = async () => {
    if (!stories.length) {
      const confirmed = window.confirm(
        "No hay historias cargadas. El showroom va a volver a las imágenes de ejemplo. ¿Guardar igual?"
      );
      if (!confirmed) return;
    }

    setSaving(true);
    setStatus({ tone: "info", text: "Guardando en Supabase..." });

    try {
      await saveShowroomStories(stories);
      setDirty(false);
      setStatus({
        tone: "success",
        text: "Guardado. Al recargar la home, el showroom usa estas historias.",
      });
    } catch (cause) {
      setStatus({
        tone: "error",
        text:
          cause instanceof Error
            ? cause.message
            : "No se pudieron guardar las historias.",
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
      id="showroom-stories"
      className="mt-8 scroll-mt-24 rounded-[1.75rem] border border-line bg-paper p-5 shadow-[0_30px_70px_-55px_rgba(20,36,30,0.8)] sm:p-7"
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-moss">
            Home · Showroom
          </p>
          <h2 className="mt-1.5 text-[28px] font-extrabold tracking-[-0.04em] text-ink sm:text-[34px]">
            Historias y reels
          </h2>
          <p className="mt-2 max-w-[640px] text-[13px] leading-relaxed text-muted">
            Cargá fotos o reels verticales. Las fotos se convierten a WebP 9:16;
            los videos se guardan con portada WebP. La home las muestra como
            historias de Instagram.
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
            {saving ? "Guardando..." : "Guardar historias"}
          </button>
        </div>
      </div>

      <div className="mt-5 grid gap-3 rounded-2xl border border-line bg-cream/70 p-4 text-[12px] leading-relaxed text-moss">
        <p>
          <strong className="text-ink">Formato de historia:</strong> vertical
          9:16. Fotos JPG/PNG/WebP hasta {formatBytes(MAX_STORY_IMAGE_BYTES)}; se
          recortan y guardan como WebP 1080×1920. Reels MP4/WebM/MOV hasta{" "}
          {formatBytes(MAX_STORY_VIDEO_BYTES)}; se guardan como video y genero
          una portada WebP. WebP no reproduce audio ni video.
        </p>
        <p>
          Para que el reel no se recorte, subilo ya grabado en vertical 9:16.
          Para máxima compatibilidad usá MP4 H.264.
        </p>
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
          accept="image/jpeg,image/png,image/webp,image/avif,video/mp4,video/webm,video/quicktime,video/x-m4v,.jpg,.jpeg,.png,.webp,.avif,.mp4,.webm,.mov,.m4v"
          multiple
          aria-label="Subir historias del showroom"
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
          {uploading ? "Procesando..." : "Subir historias"}
        </button>
        <p className="mt-3 text-[12px] text-muted">
          Arrastrá fotos o reels acá, o elegilos desde tu computadora. Las fotos
          se convierten a WebP automáticamente.
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
            Cargando historias...
          </p>
        ) : stories.length === 0 ? (
          <div className="rounded-2xl border border-line bg-cream/50 px-6 py-10 text-center">
            <p className="text-[15px] font-bold text-ink">
              Todavía no hay historias guardadas.
            </p>
            <p className="mx-auto mt-2 max-w-[480px] text-[12.5px] leading-relaxed text-muted">
              Mientras tanto, la home usa las imágenes de ejemplo. Subí la
              primera foto o reel y guardá los cambios.
            </p>
          </div>
        ) : (
          <ol className="grid gap-4">
            {stories.map((story, index) => (
              <li
                key={story.id}
                className="grid gap-4 rounded-2xl border border-line bg-cream/40 p-4 sm:grid-cols-[150px_minmax(0,1fr)]"
              >
                <div className="overflow-hidden rounded-xl border border-line bg-ink">
                  {story.type === "image" ? (
                    <img
                      src={story.src}
                      alt={story.label || `Historia ${index + 1}`}
                      className="aspect-[9/16] h-full w-full object-cover"
                    />
                  ) : (
                    <video
                      src={story.src}
                      poster={story.poster || images.showroom}
                      controls
                      muted
                      playsInline
                      preload="metadata"
                      className="aspect-[9/16] h-full w-full bg-ink object-cover"
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
                        {story.type === "image" ? "Foto WebP" : "Reel"}
                      </span>
                      {story.type === "video" && isMov(story) && (
                        <span className="rounded-full border border-amber-300 bg-amber-50 px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.12em] text-amber-700">
                          MOV / HEVC
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => moveStory(index, -1)}
                        disabled={index === 0}
                        aria-label="Mover historia arriba"
                        title="Mover arriba"
                        className="grid h-8 w-8 place-items-center rounded-full border border-line bg-paper text-[14px] font-bold text-ink transition hover:border-ink/25 disabled:cursor-not-allowed disabled:opacity-35"
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        onClick={() => moveStory(index, 1)}
                        disabled={index === stories.length - 1}
                        aria-label="Mover historia abajo"
                        title="Mover abajo"
                        className="grid h-8 w-8 place-items-center rounded-full border border-line bg-paper text-[14px] font-bold text-ink transition hover:border-ink/25 disabled:cursor-not-allowed disabled:opacity-35"
                      >
                        ↓
                      </button>
                      <button
                        type="button"
                        onClick={() => removeStory(index)}
                        aria-label="Quitar historia"
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
                      value={story.label ?? ""}
                      onChange={(event) =>
                        updateLabel(index, event.target.value)
                      }
                      placeholder="Ej. Showroom, entrega, novedades..."
                      className="mt-1.5 w-full rounded-xl border border-line bg-paper px-3.5 py-2.5 text-[12.5px] text-ink outline-none transition placeholder:text-muted/60 focus:border-forest/40 focus:ring-2 focus:ring-lime/50"
                    />
                  </label>

                  <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-muted">
                    <a
                      href={story.src}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 font-semibold text-forest transition hover:text-ink"
                    >
                      Ver archivo original
                      <ArrowUpRight className="h-3 w-3" />
                    </a>
                    <span className="max-w-full truncate">
                      {story.src.split("/").slice(-2).join("/")}
                    </span>
                  </div>

                  {story.type === "video" && (
                    <p className="mt-2 text-[11px] text-muted">
                      Portada: {story.poster?.endsWith(".webp") ? "WebP" : "imagen de respaldo"}.
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ol>
        )}
      </div>

      <p className="mt-6 border-t border-line/80 pt-4 text-[11px] leading-relaxed text-muted">
        Quitar una historia de la lista no borra el archivo de Storage. Los
        cambios recién se publican en la home al tocar “Guardar historias”.
      </p>
    </section>
  );
}
