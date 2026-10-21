# Verdun Automotores — Web

Sitio público de Verdum Automotores.

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

## Estructura

- `src/components/` — secciones y modales
- `src/data/cars.ts` — datos placeholder (pendiente integración con Supabase)
- `src/index.css` — tokens de diseño y animaciones
- `admin.html`, `admin.js`, `admin-styles.css` — panel admin (legacy, pendiente migrar a `public/`)

## Estado

Fase 1: integración del diseño nuevo en la rama `feat/react-redesign`.
La web actual sigue viva en `main`.
