-- =====================================================
-- IMPORTAR BENCINERAS/ESTACIONES DE SERVICIO
-- Total: 15 bencineras con locality_id correcto
-- =====================================================

INSERT INTO attractions (id, locality_id, name, short_description, latitude, longitude, keywords, is_active) VALUES
-- YPF Los Antiguos (Argentina)
('osm-fuel-ypf-antiguos', NULL, 'YPF Los Antiguos', 'Estación de servicio YPF. Combustibles: Diesel, Diesel G2, 95, 98 octanos. Av. 11 de Julio, Los Antiguos, Argentina.', -46.5505, -71.6274, ARRAY['bencinera', 'ypf', 'los antiguos', 'argentina'], true),

-- Copec Coyhaique (24/7)
('osm-fuel-copec-coyhaique1', 'loc-coyhaique', 'Copec Coyhaique', 'Estación Copec abierta 24/7. Diesel y gasolinas 93, 95, 97. Tel: +56 9 4391 512', -45.4618, -72.8125, ARRAY['bencinera', 'copec', 'coyhaique', '24 horas'], true),

-- Copec Puyuhuapi
('osm-fuel-copec-puyuhuapi', 'b3f2dda9-8789-4936-a2c7-a8d3cd18a977', 'Copec Puyuhuapi', 'Estación Copec solo diesel. Horario: Lun-Dom 08:00-23:00. Tel: +56 8 4011 432', -44.3262, -72.5661, ARRAY['bencinera', 'copec', 'puyuhuapi', 'diesel'], true),

-- Copec Cochrane
('osm-fuel-copec-cochrane', 'loc-cochrane', 'Copec Cochrane', 'Estación Copec en Cochrane.', -47.2557, -72.5778, ARRAY['bencinera', 'copec', 'cochrane'], true),

-- Petrobras Cochrane
('osm-fuel-petrobras-cochrane', 'loc-cochrane', 'Petrobras Cochrane', 'Estación Petrobras. Diesel y gasolinas 93, 95, 97.', -47.2457, -72.5946, ARRAY['bencinera', 'petrobras', 'cochrane'], true),

-- Bencinera Puerto Guadal
('osm-fuel-guadal', '81063521-9705-48fe-b729-7bd8830c7699', 'Bencinera Combustible', 'Estación Bandera Blanca. Las Magnolias, Puerto Guadal.', -46.8428, -72.7043, ARRAY['bencinera', 'puerto guadal'], true),

-- Shell Coyhaique
('osm-fuel-shell-coyhaique1', 'loc-coyhaique', 'Shell Coyhaique', 'Estación Shell. Diesel y gasolinas 93, 95, 97.', -45.5688, -72.0695, ARRAY['bencinera', 'shell', 'coyhaique'], true),

-- Petrobras Coyhaique
('osm-fuel-petrobras-coyhaique1', 'loc-coyhaique', 'Petrobras Coyhaique', 'Estación Petrobras en Coyhaique.', -45.5695, -72.0688, ARRAY['bencinera', 'petrobras', 'coyhaique'], true),

-- Petrobras Coyhaique 2
('osm-fuel-petrobras-coyhaique2', 'loc-coyhaique', 'Petrobras Coyhaique', 'Estación Petrobras en Coyhaique.', -45.5765, -72.0735, ARRAY['bencinera', 'petrobras', 'coyhaique'], true),

-- Copec Chile Chico
('osm-fuel-copec-chilechico', 'loc-chilechico', 'Copec Chile Chico', 'Estación Copec. Manuel Rodríguez, Chile Chico.', -46.5364, -71.7313, ARRAY['bencinera', 'copec', 'chile chico'], true),

-- Copec Coyhaique 24/7 (2)
('osm-fuel-copec-coyhaique2', 'loc-coyhaique', 'Copec Coyhaique', 'Estación Copec 24/7. Diesel y gasolinas 93, 95, 97.', -45.5827, -72.0749, ARRAY['bencinera', 'copec', 'coyhaique', '24 horas'], true),

-- Shell Coyhaique 2
('osm-fuel-shell-coyhaique2', 'loc-coyhaique', 'Shell Coyhaique', 'Estación Shell. Diesel y gasolinas 93, 95, 97.', -45.5776, -72.0737, ARRAY['bencinera', 'shell', 'coyhaique'], true),

-- Copec Puerto Aysén
('osm-fuel-copec-aysen', 'loc-aysen', 'Copec Puerto Aysén', 'Estación Copec 24/7. Sargento Aldea. Diesel y 95 octanos. Tel: +56 9 4391 512', -45.3998, -72.6813, ARRAY['bencinera', 'copec', 'puerto aysén', '24 horas'], true),

-- Shell Puerto Aysén
('osm-fuel-shell-aysen', 'loc-aysen', 'Shell Puerto Aysén', 'Estación Shell. Sargento Aldea. Diesel, 95 y 98 octanos.', -45.3995, -72.6805, ARRAY['bencinera', 'shell', 'puerto aysén'], true),

-- Copec Villa O'Higgins (con wifi)
('osm-fuel-copec-ohiggins', 'loc-ohiggins', 'Copec Villa O''Higgins', 'Estación Copec con aire comprimido, wifi. Carretera Austral.', -48.4634, -72.5611, ARRAY['bencinera', 'copec', 'villa ohiggins', 'wifi'], true)
ON CONFLICT (id) DO NOTHING;

-- ✅ 15 bencineras importadas desde OpenStreetMap
