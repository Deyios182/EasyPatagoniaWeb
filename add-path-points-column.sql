-- Añadir columna path_points a la tabla easy_routes para guardar el trazado detallado del camino/sendero
ALTER TABLE easy_routes ADD COLUMN IF NOT EXISTS path_points JSONB DEFAULT '[]';

COMMENT ON COLUMN easy_routes.path_points IS 'Lista de puntos de coordenadas [{lat: number, lng: number}] que componen el trazado exacto del camino.';
