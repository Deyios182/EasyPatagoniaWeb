-- ============================================================
-- EASY PATAGONIA — Estado de Rutas / Cortes en Carretera
-- Ejecuta este script en Supabase SQL Editor
-- ============================================================

CREATE TABLE IF NOT EXISTS road_cuts (
  id              uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now(),

  -- Clasificación del corte
  severity        text NOT NULL CHECK (severity IN ('total', 'partial', 'caution'))
                  DEFAULT 'partial',
  -- 'total'   → ⛔ Corte total
  -- 'partial' → ⚠️ Interrupción parcial
  -- 'caution' → 🛑 Precaución

  -- Contenido
  route_name      text NOT NULL,         -- Ej: "Ruta 7 Sur"
  sector          text,                  -- Ej: "tramo acceso Bahía Murta - Puente El Belga"
  description     text NOT NULL,         -- Texto completo del corte
  schedule        text,                  -- Ej: "14:00 a 18:00 horas"
  validity        text,                  -- Ej: "lunes a viernes hasta 31 de diciembre 2026"
  source          text DEFAULT 'MOP Aysén, Vialidad, Carabineros',

  -- Fechas de vigencia para lógica automática
  valid_from      date,
  valid_until     date,

  -- Ubicación geográfica del corte (para el mapa)
  latitude        float8,
  longitude       float8,

  -- Estado
  is_active       boolean DEFAULT true,

  -- Autor
  created_by      uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Índices útiles
CREATE INDEX IF NOT EXISTS idx_road_cuts_active     ON road_cuts (is_active);
CREATE INDEX IF NOT EXISTS idx_road_cuts_severity   ON road_cuts (severity);
CREATE INDEX IF NOT EXISTS idx_road_cuts_valid_until ON road_cuts (valid_until);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_road_cuts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_road_cuts_updated_at ON road_cuts;
CREATE TRIGGER trg_road_cuts_updated_at
  BEFORE UPDATE ON road_cuts
  FOR EACH ROW EXECUTE FUNCTION update_road_cuts_updated_at();

-- ── RLS ──────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.is_road_cuts_admin()
RETURNS BOOLEAN AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN FALSE;
  END IF;

  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
      AND lower(role) IN ('super_admin', 'superadmin', 'admin')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

ALTER TABLE road_cuts ENABLE ROW LEVEL SECURITY;

-- Lectura pública (todos pueden ver los cortes activos)
DROP POLICY IF EXISTS "road_cuts_public_read" ON road_cuts;
CREATE POLICY "road_cuts_public_read"
  ON road_cuts FOR SELECT
  USING (true);

-- Solo SuperAdmin puede insertar/modificar/borrar
DROP POLICY IF EXISTS "road_cuts_superadmin_all" ON road_cuts;
CREATE POLICY "road_cuts_superadmin_all"
  ON road_cuts FOR ALL
  TO authenticated
  USING ( public.is_road_cuts_admin() )
  WITH CHECK ( public.is_road_cuts_admin() );

-- ── DATOS DE EJEMPLO (los del user) ──────────────────────────
INSERT INTO road_cuts (severity, route_name, sector, description, schedule, validity, latitude, longitude, valid_from, valid_until, is_active)
VALUES
(
  'total',
  'Ruta 7 Sur',
  'Acceso Bahía Murta - Puente El Belga (norte de Puerto Río Tranquilo)',
  'Corte total de tránsito por trabajos de pavimentación.',
  '14:00 a 18:00 horas',
  'Lunes a viernes, hasta el 31 de diciembre de 2026',
  -46.5820, -72.8010,
  '2026-01-01', '2026-12-31',
  true
),
(
  'total',
  'Ruta 265-CH',
  'Cruce El Maitén - Puerto Guadal (acceso a Chile Chico)',
  'Corte total de tránsito por trabajos de tronaduras de roca.',
  '13:00 a 17:00 horas',
  'Lunes a viernes, desde el 16 de octubre de 2026 hasta junio de 2027',
  -46.9000, -72.0700,
  '2026-10-16', '2027-06-30',
  true
),
(
  'partial',
  'Ruta 7',
  'Sector Recta Foitzick, acceso a Coyhaique',
  'Interrupciones parciales controladas por banderilleros y semáforos, por trabajos de conservación.',
  NULL,
  'Del lunes 23 al sábado 28 de noviembre de 2026, a las 18:00 horas',
  -45.5720, -72.0620,
  '2026-11-23', '2026-11-28',
  true
),
(
  'partial',
  'Ruta 7',
  'Sector El Salto, entre cruce El Fraile y Puente El Salto',
  'Interrupciones parciales controladas por banderilleros y semáforos, por trabajos de conservación.',
  NULL,
  'Del lunes 23 al sábado 28 de noviembre de 2026, a las 18:00 horas',
  -45.4800, -72.0100,
  '2026-11-23', '2026-11-28',
  true
),
(
  'partial',
  'Ruta 240-CH',
  'Entre Coyhaique y Puerto Aysén — Puentes Huichapan, Los Militares, Las Pizarras, Dumm',
  'Trabajos de conservación de puentes, con tránsito regulado mediante paleteros, señalización de «Ceda el Paso» y/o semáforos.',
  NULL,
  'Varios puentes hasta el 1 de diciembre de 2026',
  -45.5930, -72.2400,
  '2026-11-20', '2026-12-07',
  true
),
(
  'caution',
  'Ruta 7',
  'Puentes Palena y Rosselot',
  'Restricciones de peso y velocidad máxima. Peso máximo informado: 20 toneladas.',
  NULL,
  'Permanente',
  -44.0000, -72.5000,
  NULL, NULL,
  true
),
(
  'caution',
  'Puerto Aysén',
  'Puente Colgante Presidente Ibáñez',
  'Tránsito restringido a una sola vía, prohibición para vehículos mayores a 5 toneladas. Cierre vehicular previsto desde el 4 de diciembre de 2026 por ~8 meses.',
  NULL,
  'Desde el 4 de diciembre de 2026 por aproximadamente 8 meses',
  -45.4040, -72.6940,
  '2026-12-04', '2027-08-01',
  true
);
