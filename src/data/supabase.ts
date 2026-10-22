const FALLBACK_URL = "https://ymiakfjhgndqhdtoubkr.supabase.co";
const FALLBACK_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InltaWFrZmpoZ25kcWhkdG91YmtyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUwMjkyNTIsImV4cCI6MjEwMDYwNTI1Mn0.Q0opccAEYWgkuyV1unwnpNu0OiWbio3E1pAURi8GPaI";

export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL ?? FALLBACK_URL;
export const SUPABASE_ANON_KEY =
  import.meta.env.VITE_SUPABASE_ANON_KEY ?? FALLBACK_ANON_KEY;

export const supabaseHeaders = (
  extra: Record<string, string> = {}
): Record<string, string> => ({
  apikey: SUPABASE_ANON_KEY,
  Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
  ...extra,
});

/** Public URL for an object inside a public Supabase Storage bucket. */
export const publicStorageUrl = (bucket: string, path: string) =>
  `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${path
    .split("/")
    .map(encodeURIComponent)
    .join("/")}`;
