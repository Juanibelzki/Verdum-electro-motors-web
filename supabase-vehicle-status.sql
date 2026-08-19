-- ============================================
-- MIGRACIÓN: Agregar columna 'status' a vehicles
-- ============================================
-- Ejecutar en Supabase SQL Editor
-- Valores: 'pendiente_fotos' | 'publicado'

ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'publicado';

-- Marcar como pendiente los vehículos activos que no tienen fotos
UPDATE vehicles v
SET status = 'pendiente_fotos'
WHERE v.activo = true
  AND v.status IS DISTINCT FROM 'publicado'
  AND NOT EXISTS (
    SELECT 1 FROM photos p WHERE p.vehicle_id = v.id
  );

CREATE INDEX IF NOT EXISTS idx_vehicles_status ON vehicles(status);
