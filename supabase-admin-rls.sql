-- Permitir INSERT/UPDATE/DELETE en vehicles desde el panel (usa anon key)
DROP POLICY IF EXISTS "Admin INSERT on vehicles" ON vehicles;
CREATE POLICY "Admin INSERT on vehicles" ON vehicles
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Admin UPDATE on vehicles" ON vehicles;
CREATE POLICY "Admin UPDATE on vehicles" ON vehicles
    FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Admin DELETE on vehicles" ON vehicles;
CREATE POLICY "Admin DELETE on vehicles" ON vehicles
    FOR DELETE USING (true);

-- Permitir INSERT/DELETE en photos desde el panel
DROP POLICY IF EXISTS "Admin INSERT on photos" ON photos;
CREATE POLICY "Admin INSERT on photos" ON photos
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Admin DELETE on photos" ON photos;
CREATE POLICY "Admin DELETE on photos" ON photos
    FOR DELETE USING (true);

-- Permitir INSERT/UPDATE/DELETE en categories (por si acaso)
DROP POLICY IF EXISTS "Admin INSERT on categories" ON categories;
CREATE POLICY "Admin INSERT on categories" ON categories
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Admin UPDATE on categories" ON categories;
CREATE POLICY "Admin UPDATE on categories" ON categories
    FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Admin DELETE on categories" ON categories;
CREATE POLICY "Admin DELETE on categories" ON categories
    FOR DELETE USING (true);
