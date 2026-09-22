-- ============================================
-- VERDUN AUTOMOTORES - SCHEMA COMPLETO (CDN)
-- Ejecutar en Supabase SQL Editor
-- ============================================

-- ============================================
-- 1. TABLA CATEGORÍAS
-- ============================================
CREATE TABLE IF NOT EXISTS categories (
  id SERIAL PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  nombre TEXT NOT NULL,
  posicion INTEGER DEFAULT 0
);

INSERT INTO categories (id, slug, nombre, posicion) VALUES
  (1, '0km', 'Autos 0KM', 1),
  (2, 'usados', 'Autos Usados', 2),
  (3, 'motos', 'Motos Eléctricas', 3),
  (4, 'patacletas', 'Patinetas Eléctricas', 4),
  (5, 'especiales', 'Vehículos Especiales', 5)
ON CONFLICT (id) DO NOTHING;

-- Reiniciar secuencia por si acaso
SELECT setval('categories_id_seq', (SELECT MAX(id) FROM categories));

-- ============================================
-- 2. TABLA VEHÍCULOS
-- ============================================
CREATE TABLE IF NOT EXISTS vehicles (
  id SERIAL PRIMARY KEY,
  category_id INTEGER REFERENCES categories(id) ON DELETE CASCADE,
  slug TEXT UNIQUE,
  nombre TEXT NOT NULL,
  marca TEXT,
  modelo TEXT,
  año INTEGER,
  km TEXT,
  color TEXT,
  precio TEXT,
  precio_numero NUMERIC,
  descripcion TEXT,
  whatsapp_msg TEXT,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_vehicles_category ON vehicles(category_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_activo ON vehicles(activo);

-- ============================================
-- 3. TABLA FOTOS
-- ============================================
CREATE TABLE IF NOT EXISTS photos (
  id SERIAL PRIMARY KEY,
  vehicle_id INTEGER REFERENCES vehicles(id) ON DELETE CASCADE,
  url TEXT,
  url_thumb TEXT,
  posicion INTEGER DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_photos_vehicle ON photos(vehicle_id);

-- ============================================
-- 4. BUCKET DE STORAGE
-- ============================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('stock-photos', 'stock-photos', true)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 5. POLÍTICAS RLS
-- ============================================

-- Lectura pública de todas las tablas
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE photos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read categories" ON categories;
CREATE POLICY "Public read categories" ON categories
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read vehicles" ON vehicles;
CREATE POLICY "Public read vehicles" ON vehicles
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read photos" ON photos;
CREATE POLICY "Public read photos" ON photos
  FOR SELECT USING (true);

-- Admin (anon) puede escribir en vehicles
DROP POLICY IF EXISTS "Admin INSERT on vehicles" ON vehicles;
CREATE POLICY "Admin INSERT on vehicles" ON vehicles
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Admin UPDATE on vehicles" ON vehicles;
CREATE POLICY "Admin UPDATE on vehicles" ON vehicles
  FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Admin DELETE on vehicles" ON vehicles;
CREATE POLICY "Admin DELETE on vehicles" ON vehicles
  FOR DELETE USING (true);

-- Admin (anon) puede escribir en photos
DROP POLICY IF EXISTS "Admin INSERT on photos" ON photos;
CREATE POLICY "Admin INSERT on photos" ON photos
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Admin DELETE on photos" ON photos;
CREATE POLICY "Admin DELETE on photos" ON photos
  FOR DELETE USING (true);

-- Admin (anon) puede escribir en categories
DROP POLICY IF EXISTS "Admin INSERT on categories" ON categories;
CREATE POLICY "Admin INSERT on categories" ON categories
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Admin UPDATE on categories" ON categories;
CREATE POLICY "Admin UPDATE on categories" ON categories
  FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Admin DELETE on categories" ON categories;
CREATE POLICY "Admin DELETE on categories" ON categories
  FOR DELETE USING (true);

-- Acceso público a los archivos del bucket
DROP POLICY IF EXISTS "Public Read stock-photos" ON storage.objects;
CREATE POLICY "Public Read stock-photos" ON storage.objects
  FOR SELECT USING (bucket_id = 'stock-photos');

DROP POLICY IF EXISTS "Public Upload stock-photos" ON storage.objects;
CREATE POLICY "Public Upload stock-photos" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'stock-photos');

DROP POLICY IF EXISTS "Public Update stock-photos" ON storage.objects;
CREATE POLICY "Public Update stock-photos" ON storage.objects
  FOR UPDATE USING (bucket_id = 'stock-photos');

DROP POLICY IF EXISTS "Public Delete stock-photos" ON storage.objects;
CREATE POLICY "Public Delete stock-photos" ON storage.objects
  FOR DELETE USING (bucket_id = 'stock-photos');
