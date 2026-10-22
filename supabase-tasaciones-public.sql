-- ============================================
-- TASACIONES PÚBLICAS - VERDUN AUTOMOTORES
-- ============================================
-- El formulario de "Entregar como parte de pago" sube fotos a
-- stock-photos/tasaciones/<uuid>/ y guarda la solicitud en
-- admin_content con la key tasacion_<uuid>.
--
-- Ejecutar DESPUÉS de supabase-rls-secure.sql.
-- Si todavía están las políticas públicas permisivas, este archivo
-- no es necesario (pero tampoco molesta).
--
-- Antes de producción conviene sumar captcha / rate limiting:
-- estas políticas permiten inserciones anónimas acotadas a tasaciones.

-- Solicitud de tasación (solo creación; la lectura pública ya está
-- cubierta por admin_content_select_public en supabase-rls-secure.sql).
DROP POLICY IF EXISTS "admin_content_insert_tasaciones_public"
  ON public.admin_content;

CREATE POLICY "admin_content_insert_tasaciones_public"
  ON public.admin_content
  FOR INSERT
  TO anon
  WITH CHECK (key LIKE 'tasacion_%');

-- Fotos de la tasación (solo creación dentro de la carpeta tasaciones/).
DROP POLICY IF EXISTS "storage_insert_tasaciones_public"
  ON storage.objects;

CREATE POLICY "storage_insert_tasaciones_public"
  ON storage.objects
  FOR INSERT
  TO anon
  WITH CHECK (
    bucket_id = 'stock-photos'
    AND name LIKE 'tasaciones/%'
  );
