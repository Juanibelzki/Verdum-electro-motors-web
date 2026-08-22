-- ============================================
-- SEGURIDAD RLS - VERDUN AUTOMOTORES
-- ============================================
-- Ejecutar en Supabase SQL Editor
-- ⚠️ Ejecutar todo de una vez

-- ============================================
-- 1) FUNCIÓN DE LOGIN ADMIN
-- ============================================
-- Recibe una contraseña y devuelve un token temporal (UUID)
-- La contraseña se guarda en una variable de sesión segura

CREATE OR REPLACE FUNCTION public.admin_login(password TEXT)
RETURNS TEXT AS $$
DECLARE
    stored_password TEXT;
    session_token TEXT;
BEGIN
    -- Obtener contraseña almacenada
    SELECT value INTO stored_password
    FROM admin_content
    WHERE key = 'admin_password';

    -- Si no existe la contraseña, usar la que se estableció al inicio
    IF stored_password IS NULL THEN
        stored_password := 'verdun2024';
    END IF;

    -- Verificar contraseña
    IF password != stored_password THEN
        RAISE EXCEPTION 'Contraseña incorrecta';
    END IF;

    -- Generar token temporal
    session_token := gen_random_uuid()::text;

    -- Guardar token con expiración (4 horas)
    INSERT INTO admin_content (key, value)
    VALUES ('session_' || session_token, (now() + interval '4 hours')::text)
    ON CONFLICT (key) DO UPDATE
    SET value = EXCLUDED.value;

    RETURN session_token;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 2) FUNCIÓN PARA VERIFICAR SESIÓN ADMIN
-- ============================================

CREATE OR REPLACE FUNCTION public.admin_verify_session(token TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    expires_at TIMESTAMPTZ;
BEGIN
    SELECT value::timestamptz INTO expires_at
    FROM admin_content
    WHERE key = 'session_' || token;

    IF expires_at IS NULL THEN
        RETURN FALSE;
    END IF;

    IF expires_at < now() THEN
        -- Token expirado, eliminarlo
        DELETE FROM admin_content WHERE key = 'session_' || token;
        RETURN FALSE;
    END IF;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 3) FUNCIÓN AUXILIAR: verificar si hay sesión activa
-- ============================================

CREATE OR REPLACE FUNCTION public._check_admin_session()
RETURNS BOOLEAN AS $$
DECLARE
    token TEXT;
    is_valid BOOLEAN;
BEGIN
    -- Obtener token del header personalizado
    token := current_setting('request.headers', true)::json->>'x-admin-token';

    IF token IS NULL OR token = '' THEN
        RETURN FALSE;
    END IF;

    SELECT public.admin_verify_session(token) INTO is_valid;
    RETURN COALESCE(is_valid, FALSE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 4) ELIMINAR POLÍTICAS ANTIGUAS (si existen)
-- ============================================

-- Vehicles
DROP POLICY IF EXISTS "Admin INSERT on vehicles" ON vehicles;
DROP POLICY IF EXISTS "Admin UPDATE on vehicles" ON vehicles;
DROP POLICY IF EXISTS "Admin DELETE on vehicles" ON vehicles;
DROP POLICY IF EXISTS "Public read vehicles" ON vehicles;

-- Photos
DROP POLICY IF EXISTS "Admin INSERT on photos" ON photos;
DROP POLICY IF EXISTS "Admin DELETE on photos" ON photos;
DROP POLICY IF EXISTS "Public read photos" ON photos;

-- Categories
DROP POLICY IF EXISTS "Admin INSERT on categories" ON categories;
DROP POLICY IF EXISTS "Admin UPDATE on categories" ON categories;
DROP POLICY IF EXISTS "Admin DELETE on categories" ON categories;
DROP POLICY IF EXISTS "Public read categories" ON categories;

-- Admin content
DROP POLICY IF EXISTS "admin_content_select_anon" ON admin_content;
DROP POLICY IF EXISTS "admin_content_write_anon" ON admin_content;
DROP POLICY IF EXISTS "Public Read admin_content" ON admin_content;
DROP POLICY IF EXISTS "Public INSERT admin_content" ON admin_content;
DROP POLICY IF EXISTS "Public UPDATE admin_content" ON admin_content;

-- Storage
DROP POLICY IF EXISTS "Public INSERT stock-photos" ON storage.objects;
DROP POLICY IF EXISTS "Public UPDATE stock-photos" ON storage.objects;
DROP POLICY IF EXISTS "Public SELECT stock-photos" ON storage.objects;
DROP POLICY IF EXISTS "Public Delete stock-photos" ON storage.objects;
DROP POLICY IF EXISTS "stock_photos_public_read" ON storage.objects;
DROP POLICY IF EXISTS "stock_photos_public_insert" ON storage.objects;
DROP POLICY IF EXISTS "stock_photos_public_update" ON storage.objects;
DROP POLICY IF EXISTS "stock_photos_public_delete" ON storage.objects;

-- ============================================
-- 5) NUEVAS POLÍTICAS SEGURAS - VEHICLES
-- ============================================

-- Público: solo lectura
CREATE POLICY "vehicles_select_public" ON vehicles
    FOR SELECT USING (true);

-- Admin: INSERT (requiere sesión)
CREATE POLICY "vehicles_insert_admin" ON vehicles
    FOR INSERT
    WITH CHECK (public._check_admin_session());

-- Admin: UPDATE (requiere sesión)
CREATE POLICY "vehicles_update_admin" ON vehicles
    FOR UPDATE
    USING (public._check_admin_session())
    WITH CHECK (public._check_admin_session());

-- Admin: DELETE (requiere sesión)
CREATE POLICY "vehicles_delete_admin" ON vehicles
    FOR DELETE
    USING (public._check_admin_session());

-- ============================================
-- 6) NUEVAS POLÍTICAS SEGURAS - PHOTOS
-- ============================================

-- Público: solo lectura
CREATE POLICY "photos_select_public" ON photos
    FOR SELECT USING (true);

-- Admin: INSERT
CREATE POLICY "photos_insert_admin" ON photos
    FOR INSERT
    WITH CHECK (public._check_admin_session());

-- Admin: DELETE
CREATE POLICY "photos_delete_admin" ON photos
    FOR DELETE
    USING (public._check_admin_session());

-- ============================================
-- 7) NUEVAS POLÍTICAS SEGURAS - CATEGORIES
-- ============================================

-- Público: solo lectura
CREATE POLICY "categories_select_public" ON categories
    FOR SELECT USING (true);

-- Admin: INSERT
CREATE POLICY "categories_insert_admin" ON categories
    FOR INSERT
    WITH CHECK (public._check_admin_session());

-- Admin: UPDATE
CREATE POLICY "categories_update_admin" ON categories
    FOR UPDATE
    USING (public._check_admin_session())
    WITH CHECK (public._check_admin_session());

-- Admin: DELETE
CREATE POLICY "categories_delete_admin" ON categories
    FOR DELETE
    USING (public._check_admin_session());

-- ============================================
-- 8) NUEVAS POLÍTICAS SEGURAS - ADMIN_CONTENT
-- ============================================

-- Público: solo lectura (para financiación, etc.)
CREATE POLICY "admin_content_select_public" ON admin_content
    FOR SELECT USING (true);

-- Admin: INSERT/UPDATE (requiere sesión)
CREATE POLICY "admin_content_insert_admin" ON admin_content
    FOR INSERT
    WITH CHECK (public._check_admin_session());

CREATE POLICY "admin_content_update_admin" ON admin_content
    FOR UPDATE
    USING (public._check_admin_session())
    WITH CHECK (public._check_admin_session());

-- Admin: DELETE
CREATE POLICY "admin_content_delete_admin" ON admin_content
    FOR DELETE
    USING (public._check_admin_session());

-- ============================================
-- 9) NUEVAS POLÍTICAS SEGURAS - STORAGE
-- ============================================

-- Público: solo lectura
CREATE POLICY "storage_select_public" ON storage.objects
    FOR SELECT USING (bucket_id = 'stock-photos');

-- Admin: INSERT
CREATE POLICY "storage_insert_admin" ON storage.objects
    FOR INSERT
    WITH CHECK (bucket_id = 'stock-photos' AND public._check_admin_session());

-- Admin: UPDATE
CREATE POLICY "storage_update_admin" ON storage.objects
    FOR UPDATE
    USING (bucket_id = 'stock-photos' AND public._check_admin_session())
    WITH CHECK (bucket_id = 'stock-photos');

-- Admin: DELETE
CREATE POLICY "storage_delete_admin" ON storage.objects
    FOR DELETE
    USING (bucket_id = 'stock-photos' AND public._check_admin_session());

-- ============================================
-- 10) ESTABLECER CONTRASEÑA INICIAL
-- ============================================
-- ⚠️ CAMBIAR ESTA CONTRASEÑA POR UNA SEGURA

INSERT INTO admin_content (key, value)
VALUES ('admin_password', 'verdun2024')
ON CONFLICT (key) DO NOTHING;

-- ============================================
-- FIN
-- ============================================
-- Después de ejecutar, reiniciar la conexión Supabase
-- para que los cambios de RLS tomen efectivo
