-- Permitir que la anon key suba archivos al bucket stock-photos
DROP POLICY IF EXISTS "Public INSERT stock-photos" ON storage.objects;
CREATE POLICY "Public INSERT stock-photos" ON storage.objects
    FOR INSERT TO anon
    WITH CHECK (bucket_id = 'stock-photos');

DROP POLICY IF EXISTS "Public UPDATE stock-photos" ON storage.objects;
CREATE POLICY "Public UPDATE stock-photos" ON storage.objects
    FOR UPDATE TO anon
    USING (bucket_id = 'stock-photos');

-- Asegurar lectura pública de las imágenes
DROP POLICY IF EXISTS "Public SELECT stock-photos" ON storage.objects;
CREATE POLICY "Public SELECT stock-photos" ON storage.objects
    FOR SELECT TO anon
    USING (bucket_id = 'stock-photos');

-- Permitir que la anon key lea y escriba el contenido editado del admin
-- (servicios, contenido, testimonios, financing_images, site_images)
-- Sin estas políticas los guardados del admin solo quedan en el localStorage
-- del navegador y las imágenes NO aparecen en celulares ni en otros equipos.
DROP POLICY IF EXISTS "Public SELECT admin_content" ON public.admin_content;
CREATE POLICY "Public SELECT admin_content" ON public.admin_content
    FOR SELECT TO anon
    USING (true);

DROP POLICY IF EXISTS "Public INSERT admin_content" ON public.admin_content;
CREATE POLICY "Public INSERT admin_content" ON public.admin_content
    FOR INSERT TO anon
    WITH CHECK (true);

DROP POLICY IF EXISTS "Public UPDATE admin_content" ON public.admin_content;
CREATE POLICY "Public UPDATE admin_content" ON public.admin_content
    FOR UPDATE TO anon
    USING (true);
