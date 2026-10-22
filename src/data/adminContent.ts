import { SUPABASE_URL, supabaseHeaders } from "./supabase";

/** Reads one admin_content row by key. Returns undefined when it does not exist. */
export async function loadAdminContent(key: string): Promise<unknown> {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), 15000);

  try {
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/admin_content?select=data&key=eq.${encodeURIComponent(key)}`,
      {
        headers: supabaseHeaders({ Accept: "application/json" }),
        cache: "no-store",
        signal: controller.signal,
      }
    );

    if (!response.ok) {
      throw new Error(`Supabase respondió ${response.status}`);
    }

    const rows = (await response.json()) as Array<{ data?: unknown }>;
    return rows?.[0]?.data;
  } finally {
    window.clearTimeout(timer);
  }
}

/** Creates or updates one admin_content row. */
export async function saveAdminContent(
  key: string,
  data: unknown
): Promise<void> {
  const headers = supabaseHeaders({
    "Content-Type": "application/json",
    Accept: "application/json",
    Prefer: "return=representation",
  });

  const patch = await fetch(
    `${SUPABASE_URL}/rest/v1/admin_content?key=eq.${encodeURIComponent(key)}`,
    {
      method: "PATCH",
      headers,
      body: JSON.stringify({ data }),
    }
  );

  if (!patch.ok) {
    throw new Error(`No se pudo guardar la configuración (${patch.status}).`);
  }

  const body = await patch.text();
  const updated = body ? (JSON.parse(body) as unknown[]) : [];

  if (Array.isArray(updated) && updated.length > 0) return;

  const insert = await fetch(`${SUPABASE_URL}/rest/v1/admin_content`, {
    method: "POST",
    headers,
    body: JSON.stringify({ key, data }),
  });

  if (!insert.ok) {
    throw new Error(`No se pudo crear la configuración (${insert.status}).`);
  }
}
