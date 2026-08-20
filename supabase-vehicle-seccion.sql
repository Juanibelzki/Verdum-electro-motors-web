-- ============================================
-- MIGRACIÓN: Agregar columna 'seccion' a vehicles
-- ============================================
-- Ejecutar en Supabase SQL Editor
-- Valores: 'usados' | '0km' | 'motos' | 'especiales'
-- Si es NULL, el frontend aplica regla automática por km/tipo

ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS seccion TEXT DEFAULT NULL;

CREATE INDEX IF NOT EXISTS idx_vehicles_seccion ON vehicles(seccion);
