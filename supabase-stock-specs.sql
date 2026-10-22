-- ============================================
-- VERDUN AUTOMOTORES - FICHA TECNICA DEL STOCK
-- Ejecutar en Supabase SQL Editor
-- ============================================
-- Agrega las columnas que usa el nuevo admin para cargar
-- las especificaciones de la card y de la ficha de detalle.
--
-- El sitio publico sigue funcionando sin estas columnas:
-- si estan vacias, infiere los datos desde el titulo y la
-- descripcion. Cuando el admin las completa, tienen prioridad.

alter table public.vehicles
  add column if not exists version text,
  add column if not exists transmision text,
  add column if not exists combustible text,
  add column if not exists carroceria text,
  add column if not exists traccion text,
  add column if not exists potencia integer;

comment on column public.vehicles.version is
  'Version comercial del vehiculo. Ej: XLS Pack 1.5 CVT';
comment on column public.vehicles.transmision is
  'Transmision. Ej: Manual, Automatica, Automatica (CVT)';
comment on column public.vehicles.combustible is
  'Combustible. Ej: Nafta, Diesel, Hibrido, Electrico';
comment on column public.vehicles.carroceria is
  'Carroceria. Ej: Hatchback, Sedan, SUV, Pick-up, Utilitario';
comment on column public.vehicles.traccion is
  'Traccion. Ej: Delantera, Trasera, 4x2, 4x4';
comment on column public.vehicles.potencia is
  'Potencia en CV. Ej: 180';

-- Indice util para el listado del admin y para filtrar por categoria.
create index if not exists vehicles_category_active_idx
  on public.vehicles (category_id, activo);

create index if not exists vehicles_created_at_idx
  on public.vehicles (created_at desc);

-- Hace que PostgREST detecte las columnas nuevas sin esperar al reload.
notify pgrst, 'reload schema';
