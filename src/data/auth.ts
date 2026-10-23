import {
  SUPABASE_ANON_KEY,
  SUPABASE_URL,
  supabaseHeaders,
} from "./supabase";

const SESSION_KEY = "verdun_admin_session";
const REFRESH_MARGIN_MS = 60_000;

export type AdminUser = {
  id: string;
  email: string | null;
};

export type AdminSession = {
  access_token: string;
  refresh_token: string;
  expires_at: number;
  user: AdminUser;
};

type AuthTokenResponse = {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  user?: {
    id?: string;
    email?: string | null;
  };
};

type AuthErrorBody = {
  error_description?: string;
  msg?: string;
  message?: string;
  error?: string;
};

let currentSession: AdminSession | null = readStoredSession();
let refreshPromise: Promise<AdminSession | null> | null = null;
const listeners = new Set<(session: AdminSession | null) => void>();

function isSession(value: unknown): value is AdminSession {
  if (!value || typeof value !== "object") return false;
  const session = value as Partial<AdminSession>;
  return (
    typeof session.access_token === "string" &&
    session.access_token.length > 0 &&
    typeof session.refresh_token === "string" &&
    session.refresh_token.length > 0 &&
    typeof session.expires_at === "number" &&
    Boolean(session.user) &&
    typeof session.user?.id === "string"
  );
}

function readStoredSession(): AdminSession | null {
  try {
    const raw = window.localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    return isSession(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function emit() {
  for (const listener of listeners) listener(currentSession);
}

function persistSession(session: AdminSession) {
  currentSession = session;
  try {
    window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } catch {
    // El login sigue funcionando en memoria si localStorage está bloqueado.
  }
  emit();
}

export function clearSession() {
  currentSession = null;
  try {
    window.localStorage.removeItem(SESSION_KEY);
  } catch {
    // Ignorar almacenamiento bloqueado.
  }
  emit();
}

export function getSession(): AdminSession | null {
  return currentSession;
}

export function subscribeToAuth(
  listener: (session: AdminSession | null) => void
) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function toSession(
  data: AuthTokenResponse,
  fallbackEmail?: string | null
): AdminSession | null {
  if (!data.access_token || !data.refresh_token || !data.user?.id) {
    return null;
  }

  const expiresIn = Number(data.expires_in);
  return {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_at:
      Date.now() + (Number.isFinite(expiresIn) && expiresIn > 0 ? expiresIn : 3600) * 1000,
    user: {
      id: data.user.id,
      email: data.user.email ?? fallbackEmail ?? null,
    },
  };
}

function authError(body: AuthErrorBody, status: number) {
  const message =
    body.error_description ?? body.msg ?? body.message ?? body.error ?? "";

  if (/invalid login credentials/i.test(message)) {
    return "Email o contraseña incorrectos.";
  }
  if (/email not confirmed/i.test(message)) {
    return "El email del admin todavía no está confirmado en Supabase.";
  }
  if (/invalid api key/i.test(message)) {
    return "La configuración pública de Supabase no es válida.";
  }
  if (status === 429) {
    return "Demasiados intentos. Esperá un momento y volvé a probar.";
  }
  return "No se pudo iniciar sesión. Revisá los datos e intentá de nuevo.";
}

export async function signIn(
  email: string,
  password: string
): Promise<AdminSession> {
  let response: Response;
  try {
    response = await fetch(
      `${SUPABASE_URL}/auth/v1/token?grant_type=password`,
      {
        method: "POST",
        headers: {
          apikey: SUPABASE_ANON_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: email.trim(), password }),
      }
    );
  } catch {
    throw new Error("No se pudo conectar con Supabase. Revisá tu conexión.");
  }

  const body = (await response.json().catch(() => ({}))) as
    | AuthTokenResponse
    | AuthErrorBody;

  if (!response.ok) {
    throw new Error(authError(body as AuthErrorBody, response.status));
  }

  const session = toSession(body as AuthTokenResponse, email.trim());
  if (!session) {
    throw new Error("Supabase no devolvió una sesión válida.");
  }

  persistSession(session);
  return session;
}

export async function refreshSession(): Promise<AdminSession | null> {
  if (!currentSession) return null;
  if (refreshPromise) return refreshPromise;

  const refreshToken = currentSession.refresh_token;
  refreshPromise = (async () => {
    try {
      const response = await fetch(
        `${SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`,
        {
          method: "POST",
          headers: {
            apikey: SUPABASE_ANON_KEY,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ refresh_token: refreshToken }),
        }
      );

      if (!response.ok) {
        clearSession();
        return null;
      }

      const body = (await response.json()) as AuthTokenResponse;
      const session = toSession(body, currentSession?.user.email);
      if (!session) {
        clearSession();
        return null;
      }

      persistSession(session);
      return session;
    } catch {
      // Error de red: conservamos la sesión y dejamos que la API decida.
      return currentSession;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

export async function getValidSession(): Promise<AdminSession | null> {
  if (!currentSession) return null;
  if (currentSession.expires_at - REFRESH_MARGIN_MS > Date.now()) {
    return currentSession;
  }
  return refreshSession();
}

export async function getAuthHeaders(
  extra: Record<string, string> = {}
): Promise<Record<string, string>> {
  const session = await getValidSession();
  if (!session) {
    throw new Error("Sesión vencida. Volvé a iniciar sesión.");
  }
  return supabaseHeaders({
    Authorization: `Bearer ${session.access_token}`,
    ...extra,
  });
}

export async function getOptionalAuthHeaders(
  extra: Record<string, string> = {}
): Promise<Record<string, string>> {
  const session = await getValidSession().catch(() => null);
  return session
    ? supabaseHeaders({
        Authorization: `Bearer ${session.access_token}`,
        ...extra,
      })
    : supabaseHeaders(extra);
}

/**
 * Confirms that the signed-in Auth user exists in public.admins.
 * Also acts as a smoke test for the Auth/RLS migration: if the table or
 * self-select policy is missing, the panel stays locked.
 */
export async function checkAdminMembership(): Promise<boolean> {
  const session = await getValidSession();
  if (!session) return false;

  try {
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/admins?select=user_id&user_id=eq.${encodeURIComponent(
        session.user.id
      )}`,
      {
        headers: await getAuthHeaders({ Accept: "application/json" }),
        cache: "no-store",
      }
    );

    if (response.status === 401) {
      clearSession();
      return false;
    }

    if (!response.ok) return false;

    const rows = (await response.json()) as Array<{ user_id?: string }>;
    return Array.isArray(rows) && rows.length > 0;
  } catch {
    return false;
  }
}

export async function signOut(): Promise<void> {
  const session = currentSession;
  clearSession();

  if (!session) return;

  await fetch(`${SUPABASE_URL}/auth/v1/logout`, {
    method: "POST",
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${session.access_token}`,
    },
  }).catch(() => {
    // El logout local ya se hizo; no bloqueamos al usuario por la red.
  });
}
