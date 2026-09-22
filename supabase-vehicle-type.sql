-- ============================================
-- MIGRACIÓN: Agregar columna 'tipo' a vehicles
-- ============================================
-- Ejecutar en Supabase SQL Editor
-- Valores: 'auto' | 'moto'

ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS tipo TEXT DEFAULT 'auto';

-- Marcar como 'moto' los vehículos que pertenezcan a categorías de motos
UPDATE vehicles v
SET tipo = 'moto'
WHERE v.category_id IN (
    SELECT id FROM categories WHERE slug ILIKE '%moto%'
);

CREATE INDEX IF NOT EXISTS idx_vehicles_tipo ON vehicles(tipo);
