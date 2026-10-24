-- Uploads públicos del formulario de tasación.
-- Permite SOLO insertar archivos WebP dentro de stock-photos/tasaciones/*.
-- No habilita escritura en el resto del bucket ni permite actualizar/borrar.

drop policy if exists "stock_photos_tasaciones_public_insert" on storage.objects;

create policy "stock_photos_tasaciones_public_insert"
  on storage.objects
  for insert
  to anon
  with check (
    bucket_id = 'stock-photos'
    and name like 'tasaciones/%'
    and lower(name) like '%.webp'
    and (metadata->>'mimetype') = 'image/webp'
  );

-- La lectura pública ya está cubierta por "stock_photos_public_read"
-- de supabase-auth-rls.sql.
