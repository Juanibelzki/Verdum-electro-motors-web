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
- `src/index.css` — tokens de diseño y animaciones
- `admin.html`, `admin.js`, `admin-styles.css` — panel admin (legacy, pendiente migrar a `public/`)

## Estado

- Fase 1: integración del diseño nuevo en la rama `feat/react-redesign`.
- Fase 2: identidad Verdun, contacto real y limpieza de datos falsos.
- Fase 3: stock real de Supabase, precios “Consultar”, WhatsApp y ficha técnica.

La web actual sigue viva en `main`.
