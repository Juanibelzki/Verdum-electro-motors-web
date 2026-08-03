-- Políticas RLS para la tabla admin_content (permite que el sitio público
-- y el panel admin lean y escriban contenido con la anon key)
-- EJECUTAR EN: Supabase Dashboard > SQL Editor

-- Garantizar que 'key' sea única (necesario para upsert onConflict)
ALTER TABLE public.admin_content
    ADD CONSTRAINT admin_content_key_unique UNIQUE (key);

-- SELECT (lectura pública)
CREATE POLICY "admin_content_select_anon" ON public.admin_content
    FOR SELECT USING (true);

-- INSERT / UPDATE / DELETE (escritura del panel admin)
CREATE POLICY "admin_content_write_anon" ON public.admin_content
    FOR ALL USING (true) WITH CHECK (true);

-- ============================================
-- POLÍTICAS DE STORAGE PARA EL BUCKET stock-photos
-- ============================================

-- Lectura pública de objetos (para mostrar imágenes en el sitio)
CREATE POLICY "stock_photos_public_read" ON storage.objects
    FOR SELECT USING (bucket_id = 'stock-photos');

-- Subida/actualización desde el panel admin
CREATE POLICY "stock_photos_public_insert" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'stock-photos');

CREATE POLICY "stock_photos_public_update" ON storage.objects
    FOR UPDATE USING (bucket_id = 'stock-photos') WITH CHECK (bucket_id = 'stock-photos');

CREATE POLICY "stock_photos_public_delete" ON storage.objects
    FOR DELETE USING (bucket_id = 'stock-photos');
