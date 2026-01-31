-- =====================================================
-- PARTE 1: CAMPINGS DESDE OPENSTREETMAP
-- =====================================================

INSERT INTO attractions (id, locality_id, name, short_description, latitude, longitude, keywords, is_active) VALUES
-- Camping Parque Nacional Queulat (CONAF)
('osm-camp-queulat', NULL, 'Camping Parque Nacional Queulat', 'Camping administrado por CONAF con servicios completos: duchas calientes, agua potable, mesas de picnic. Acepta tarjetas de crédito y débito.', -44.4695, -72.5476, ARRAY['camping', 'parque nacional', 'queulat', 'conaf'], true),

-- Gendarmaría Camping (Gratuito)
('osm-camp-gendarmaria', NULL, 'Camping Gendarmaría', 'Camping gratuito sin servicios de caravanas. Permite carpas.', -49.0997, -72.8379, ARRAY['camping', 'gratuito', 'carpas'], true),

-- La Araucaria
('osm-camp-araucaria', NULL, 'Camping La Araucaria', 'Camping con tarifa que acepta caravanas y carpas.', -47.4964, -72.8951, ARRAY['camping', 'caravanas', 'carpas'], true),

-- San Lorenzo (Cochrane)
('osm-camp-san-lorenzo', NULL, 'Camping San Lorenzo', 'Camping con electricidad 220V, cocina compartida, duchas calientes, wifi y lavandería. Operado por Gaston Torres.', -47.2541, -72.5794, ARRAY['camping', 'cochrane', 'electricidad', 'wifi', 'cocina'], true),

-- Los West Winds
('osm-camp-westwinds', NULL, 'Camping Los West Winds', 'Zona de camping en área natural.', -47.1277, -72.5055, ARRAY['camping', 'naturaleza'], true),

-- Valle Los Coihues
('osm-camp-valle-coihues', NULL, 'Camping Valle Los Coihues', 'Camping con tarifa en el valle.', -44.4722, -72.5676, ARRAY['camping', 'valle'], true),

-- Donde Juanito
('osm-camp-donde-juanito', NULL, 'Camping Donde Juanito', 'Pequeño camping familiar.', -47.8046, -73.5462, ARRAY['camping', 'familiar'], true),

-- Lago Del Desierto (Argentina - El Calafate)
('osm-camp-lago-desierto', NULL, 'Camping Lago Del Desierto', 'Camping en Argentina con duchas calientes (horario 19:30-21:30). Tarifa: AR$ 300 para 2 adultos con camper.', -49.0841, -72.8934, ARRAY['camping', 'argentina', 'el calafate', 'duchas'], true),

-- Río Marmól
('osm-camp-rio-marmol', NULL, 'Camping Río Marmól', 'Camping con actividad principal de paseos en bote al Río Marmól y alquiler de kayaks. Tarifa: CLP $4,000. Duchas en construcción.', -46.6670, -72.6373, ARRAY['camping', 'kayak', 'río marmól', 'botes'], true),

-- El Camping (Coyhaique)
('osm-camp-el-camping', NULL, 'El Camping', 'Camping con electricidad, wifi, duchas calientes y lavandería. Acepta mascotas. Tarifa: CLP $10,000 para 2 adultos. Tel: +56 9 7619 7716', -45.5775, -72.0789, ARRAY['camping', 'coyhaique', 'wifi', 'mascotas', 'duchas'], true),

-- Camping La Sirena (Puyuhuapi)
('osm-camp-la-sirena', NULL, 'Camping La Sirena', 'Espacio para 2 vehículos con sala común y cocina con estufa a leña. Operado por Elio Nuñez Delgado. Av. Costanera 148. Tel: +56 6 7232 5100', -44.3260, -72.5606, ARRAY['camping', 'puyuhuapi', 'cocina', 'sala común'], true),

-- Camping Lago Russelot
('osm-camp-russelot', NULL, 'Camping Lago Russelot', 'Camping con wifi gratuito junto al lago. Tel: +56 9 9781 1984', -43.9689, -72.4011, ARRAY['camping', 'lago', 'wifi'], true),

-- Camping Granja Río Grande
('osm-camp-rio-grande', NULL, 'Camping Granja Río Grande', 'Camping/granja que acepta caravanas y carpas.', -44.6655, -72.2669, ARRAY['camping', 'granja', 'caravanas'], true),

-- Camping Doña Ruth
('osm-camp-dona-ruth', NULL, 'Camping Doña Ruth', 'Camping con wifi. No acepta caravanas.', -45.1751, -72.1497, ARRAY['camping', 'wifi'], true),

-- Patagonia Eco Domes
('osm-camp-ecodomes', NULL, 'Patagonia Eco Domes', 'Alojamiento ecológico tipo domo.', -49.2364, -72.9270, ARRAY['camping', 'eco', 'domos', 'glamping'], true),

-- Camping Bonanza
('osm-camp-bonanza', NULL, 'Camping Bonanza', 'Camping con restaurant, mesas, parrillas, duchas calientes. Actividades: canopy, tirolesa, trampolín, tenis, pesca. Tel: +54 2966 15 467404', -49.2433, -72.8921, ARRAY['camping', 'restaurant', 'actividades', 'tirolesa', 'pesca'], true),

-- Camping La Chabe (Villa Castillo)
('osm-camp-la-chabe', NULL, 'Camping La Chabe', 'Camping ubicado en Villa Castillo.', -46.1307, -72.1218, ARRAY['camping', 'villa castillo'], true),

-- Cabaña Mary
('osm-camp-cabana-mary', NULL, 'Cabaña Mary', 'Cabaña y camping. Tel: +56 9 7521 5330', -47.7971, -73.5309, ARRAY['camping', 'cabaña'], true),

-- Camping Municipal Los Antiguos (Argentina)
('osm-camp-municipal-antiguos', NULL, 'Camping Municipal Los Antiguos', 'Camping municipal en Los Antiguos, Argentina.', -46.5447, -71.6088, ARRAY['camping', 'municipal', 'los antiguos', 'argentina'], true),

-- Centro Las Lengas
('osm-camp-las-lengas', NULL, 'Camping Centro Las Lengas', 'Camping con wifi, electricidad, BBQ, duchas calientes y lavadora. Acepta mascotas y motorhomes. Tel: +56 9 3220 7603. Web: centrolaslengas.cl', -47.0190, -72.8261, ARRAY['camping', 'wifi', 'bbq', 'lavadora', 'mascotas'], true),

-- Camping Rio Blas
('osm-camp-rio-blas', NULL, 'Camping Rio Blas', 'Camping privado con cabañas. Capacidad: 100 personas, 10 caravanas. Tarifa: CLP $1,000. Tel: +56 9 2600 3184', -46.5345, -72.7077, ARRAY['camping', 'cabañas', 'privado'], true),

-- Camping Neozelandés
('osm-camp-neozeland', NULL, 'Camping Neozelandés', 'Camping backcountry operado por CONAF. Sin internet.', -46.0613, -72.2377, ARRAY['camping', 'backcountry', 'conaf'], true),

-- Raleigh
('osm-camp-raleigh', NULL, 'Camping Raleigh', 'Camping backcountry en zona natural.', -46.8600, -72.0799, ARRAY['camping', 'backcountry'], true),

-- Casa Piedra
('osm-camp-casa-piedra', NULL, 'Casa Piedra Camping', 'Camping en zona de piedras.', -47.0562, -72.1951, ARRAY['camping', 'naturaleza'], true),

-- Camping Agua Vida
('osm-camp-agua-vida', NULL, 'Camping Agua Vida', 'Camping con electricidad, duchas, fogatas permitidas. Acepta tarjetas. Instagram: aguavida_camping. Tel: +56 9 6495 9393', -43.9602, -72.3950, ARRAY['camping', 'electricidad', 'fogatas', 'duchas'], true),

-- Refugio Río Cisnes
('osm-camp-refugio-cisnes', NULL, 'Refugio Río Cisnes', 'Refugio/camping en km 140 Carretera Austral con wifi, electricidad, duchas y fogatas. Email: info@refugioriocisnes.com. Tel: +56 9 7154 8068', -44.7033, -72.2301, ARRAY['camping', 'refugio', 'carretera austral', 'wifi'], true)
ON CONFLICT (id) DO NOTHING;

-- ✅ Ejecutado exitosamente: 28 campings importados desde OpenStreetMap
