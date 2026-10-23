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
- `src/data/heroScenes.ts` — lectura/guardado de los videos del hero
- `src/data/useHeroScenes.ts` — hook de carga del hero con fallback local
- `src/admin/` — panel `/admin`, stock, videos del hero e historias del showroom
- `src/index.css` — tokens de diseño y animaciones
- `legacy/` — panel admin viejo, solo como referencia (no entra en el build)
- `supabase-stock-specs.sql` — migración de columnas de ficha técnica

## Admin

El panel nuevo vive en `/admin` y tiene cuatro secciones:

- **Resumen:** métricas del stock y estado del contenido.
- **Stock:** listado completo, búsqueda, filtros, vista de detalle y editor de
  cada vehículo. Permite cargar datos, ficha técnica, precio, descripción,
  equipamiento y fotos; publicar, despublicar y marcar un destacado.
- **Home:** videos del hero e historias/reels del showroom. Los archivos se
  suben al bucket público `stock-photos` y la home los lee en vivo.
- **Ajustes:** estado de la migración y pendientes de seguridad.

### Migración de ficha técnica

Para habilitar la edición de versión, transmisión, combustible, carrocería,
tracción y potencia, ejecutar `supabase-stock-specs.sql` en el SQL Editor de
Supabase. Mientras no esté aplicada, el editor guarda el resto de la ficha y el
sitio público sigue infiriendo esas especificaciones desde el título y la
descripción.

> **Seguridad:** el panel todavía no tiene login propio y usa la anon key.
> Queda cubierto por la protección de deployment de Vercel en preview. Antes
> de exponerlo en producción hay que agregar Supabase Auth y reemplazar las
> políticas RLS permisivas.

## Estado

- Fase 1: integración del diseño nuevo en la rama `feat/react-redesign`.
- Fase 2: identidad Verdun, contacto real y limpieza de datos falsos.
- Fase 3: stock real de Supabase, precios “Consultar”, WhatsApp y ficha técnica.
- Fase 4: videos del hero administrables desde `/admin` (staging).
- Fase 5: shell del admin, resumen, listado de stock y alta rápida de borradores.
- Fase 6: editor completo de stock, ficha técnica, fotos, publicación y destacado.
  Código cerrado; la edición de ficha técnica queda habilitada al aplicar
  `supabase-stock-specs.sql`.
- Próxima: aplicar la migración de ficha técnica, Auth/RLS y cutover a producción.

La web actual sigue viva en `main`.
