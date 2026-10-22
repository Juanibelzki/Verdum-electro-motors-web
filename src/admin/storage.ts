export const waitForMediaEvent = (
  target: HTMLMediaElement,
  event: "loadedmetadata" | "seeked",
  timeout = 10000
) =>
  new Promise<void>((resolve, reject) => {
    const timer = window.setTimeout(() => {
      cleanup();
      reject(new Error("El archivo tardó demasiado en cargar."));
    }, timeout);

    const cleanup = () => {
      window.clearTimeout(timer);
      target.removeEventListener(event, onEvent);
    };

    const onEvent = () => {
      cleanup();
      resolve();
    };

    target.addEventListener(event, onEvent, { once: true });
  });

export const videoExtension = (file: File) => {
  const name = file.name.toLowerCase();
  if (name.endsWith(".webm")) return ".webm";
  if (name.endsWith(".mov")) return ".mov";
  if (name.endsWith(".m4v")) return ".m4v";
  return ".mp4";
};

export const videoContentType = (file: File, extension: string) => {
  if (file.type) return file.type;
  if (extension === ".webm") return "video/webm";
  if (extension === ".mov") return "video/quicktime";
  return "video/mp4";
};
