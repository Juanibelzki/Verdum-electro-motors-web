# Verdun Automotores — Web

Sitio público de Verdun Automotores.

## Stack

- React 19 + Vite 7
- Tailwind CSS 4
- TypeScript

## Desarrollo

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

Genera `dist/index.html` como archivo único (vía `vite-plugin-singlefile`).

## Deploy

Vercel — framework Vite, build `npm run build`, output `dist` (ver `vercel.json`).

## Datos

El stock se lee en vivo desde Supabase (API REST, solo lectura) usando la anon key
pública. Variables opcionales (Vercel o `.env`):

```bash
VITE_SUPABASE_URL=https://ymiakfjhgndqhdtoubkr.supabase.co
VITE_SUPABASE_ANON_KEY=...
```

Si no están definidas, la app usa los valores públicos del proyecto actual.

- Precios: si `precio_numero` está vacío, las tarjetas y el modal muestran
  **“Consultar precio”** y un botón directo al WhatsApp oficial.
- Categorías: solo se muestran las que tienen stock activo.
- Destacado del hero: se elige automáticamente el 0KM más reciente (o el primer
  vehículo disponible), salvo que haya un vehículo marcado como `destacado`.
- Formularios de test drive y tasación: abren WhatsApp con el mensaje prearmado.

## Estructura

- `src/components/` — secciones y modales
- `src/data/cars.ts` — tipos, helpers de formato y número de WhatsApp
- `src/data/vehicles.ts` — lectura de Supabase y normalización del stock
- `src/data/useVehicles.ts` — hook de carga con cache en memoria y reintento
- `src/data/auth.ts` — Supabase Auth REST, sesión, refresh y headers autenticados
- `src/data/heroScenes.ts` — lectura/guardado de los videos del hero
- `src/data/useHeroScenes.ts` — hook de carga del hero con fallback local
- `src/admin/` — panel `/admin`, stock, videos del hero e historias del showroom
- `src/index.css` — tokens de diseño y animaciones
- `legacy/` — panel admin viejo, solo como referencia (no entra en el build)
- `supabase-auth-rls.sql` — Auth, admins, RLS y Storage endurecido
- `supabase-stock-specs.sql` — migración de columnas de ficha técnica

## Admin

El panel nuevo vive en `/admin`, requiere Supabase Auth y tiene cinco
secciones:

- **Resumen:** métricas del stock y estado del contenido.
- **Stock:** listado completo, búsqueda, filtros, vista de detalle y editor de
  cada vehículo. Permite cargar datos, ficha técnica, precio, descripción,
  equipamiento y fotos; publicar, despublicar y marcar un destacado.
- **Home → Hero:** videos del hero.
- **Home → Historias:** historias/reels 9:16 del showroom.
- **Ajustes:** estado de la migración, seguridad y datos actuales.

Los archivos se suben al bucket público `stock-photos` y la home los lee en
vivo.

### Seguridad y Auth

1. En Supabase, ir a **Authentication → Users** y crear el usuario admin con
   email y contraseña.
2. Abrir `supabase-auth-rls.sql`, cambiar `ADMIN_EMAIL` por ese email y
   ejecutarlo completo en el **SQL Editor**.
3. Ingresar a `/admin` con esas credenciales.

> **Estado actual:** `supabase-auth-rls.sql` ya está aplicado en el proyecto
> `ymiakfjhgndqhdtoubkr`. El usuario inicial es `admin@verdun.com.ar`; la
> contraseña se entrega por separado y se puede cambiar desde Supabase.

El script crea `public.admins`, la función `public.is_admin()`, las políticas
RLS de stock/contenido y las políticas de Storage. El sitio público solo puede
leer vehículos con `activo = true` y `status = 'publicado'`; el admin
autenticado puede leer y escribir todo el stock. Las escrituras del panel y las
subidas usan el `access_token` de la sesión, no la anon key.

> Los archivos `supabase-rls-secure.sql`, `supabase-admin-content-rls.sql`,
> `supabase-admin-rls.sql` y `supabase-storage-policies.sql` son legacy. No
> ejecutar: contienen políticas permisivas o el login por contraseña en
> `admin_content`. La migración vigente es `supabase-auth-rls.sql`.

### Migración de ficha técnica

Para habilitar la edición de versión, transmisión, combustible, carrocería,
tracción y potencia, ejecutar `supabase-stock-specs.sql` en el SQL Editor de
Supabase. Mientras no esté aplicada, el editor guarda el resto de la ficha y el
sitio público sigue infiriendo esas especificaciones desde el título y la
descripción.

## Estado

- Fase 1: integración del diseño nuevo en la rama `feat/react-redesign`.
- Fase 2: identidad Verdun, contacto real y limpieza de datos falsos.
- Fase 3: stock real de Supabase, precios “Consultar”, WhatsApp y ficha técnica.
- Fase 4: videos del hero administrables desde `/admin` (staging).
- Fase 5: shell del admin, resumen, listado de stock y alta rápida de borradores.
- Fase 6: editor completo de stock, ficha técnica, fotos, publicación y destacado.
  Código cerrado y migración `supabase-stock-specs.sql` aplicada en Supabase.
- Fase 7: Supabase Auth, `public.admins`, RLS público/admin y Storage seguro.
  Código implementado y migración `supabase-auth-rls.sql` aplicada; usuario
  admin creado y login verificado.
- Próxima: cutover a producción con aprobación explícita.

La web actual sigue viva en `main`.
