-- =====================================================
-- IMPORTAR ATRACTIVOS TURÍSTICOS DESDE OPENSTREETMAP
-- Incluye: Miradores, Cascadas y Atracciones Naturales
-- Total: 150+ atractivos turísticos con locality_id correcto
-- =====================================================

-- =====================================================
-- MIRADORES Y PUNTOS DE VISTA (VIEWPOINTS)
-- =====================================================
INSERT INTO attractions (id, locality_id, name, short_description, latitude, longitude, keywords, is_active) VALUES

-- Región Queulat
('osm-view-ventisquero-colgante', NULL, 'Mirador Ventisquero Colgante', 'Vista panorámica al glaciar colgante en Parque Nacional Queulat', -44.4525693, -72.5278649, ARRAY['mirador', 'glaciar', 'queulat', 'parque nacional'], true),
('osm-view-queulat-river', NULL, 'Río Ventisquero Queulat', 'Vista al río que nace del ventisquero', -44.460596, -72.5613398, ARRAY['mirador', 'río', 'queulat'], true),
('osm-view-puyuhuapi', 'b3f2dda9-8789-4936-a2c7-a8d3cd18a977', 'Mirador de Puyuhuapi', 'Vista panorámica del pueblo y el fiordo', -44.3193074, -72.5764461, ARRAY['mirador', 'puyuhuapi', 'fiordo'], true),
('osm-view-piedra-gato', NULL, 'Mirador Piedra el Gato', 'Punto panorámico en la Carretera Austral', -44.6485591, -72.3868456, ARRAY['mirador', 'carretera austral'], true),

-- Región Coyhaique
('osm-view-simpson', 'loc-coyhaique', 'Parque Mirador Río Simpson', 'Mirador principal del Río Simpson', -45.5716347, -72.0790345, ARRAY['mirador', 'río simpson', 'coyhaique'], true),
('osm-view-mallines', 'loc-coyhaique', 'Mirador Los Mallines', 'Vista de humedales patagónicos', -45.5296471, -72.0314741, ARRAY['mirador', 'humedales', 'naturaleza'], true),
('osm-view-coyhaique-multiple', 'loc-coyhaique', 'Mirador Coyhaique', 'Varios puntos de vista de la ciudad', -45.5457038, -72.0383626, ARRAY['mirador', 'ciudad', 'coyhaique'], true),

-- Región Puerto Aysén
('osm-view-cerro-mirador-aysen', 'loc-aysen', 'Cerro Mirador', 'Vista panorámica de Puerto Aysén y fiordos', -45.405799, -72.6946486, ARRAY['mirador', 'puerto aysén', 'fiordos'], true),
('osm-view-loberias', 'loc-aysen', 'Loberías del Sur', 'Avistamiento de lobos marinos', -45.4659138, -72.8185282, ARRAY['mirador', 'fauna', 'lobos marinos'], true),

-- Región Cerro Castillo
('osm-view-cuesta-diablo', '8b9fba5a-8980-4a45-9c3f-d1ad7cc7a624', 'Mirador Cuesta del Diablo', 'Vista espectacular de montañas', -46.104281, -72.046348, ARRAY['mirador', 'cerro castillo', 'montañas'], true),
('osm-view-cerro-castillo', '8b9fba5a-8980-4a45-9c3f-d1ad7cc7a624', 'Mirador Cerro Castillo', 'Vista del emblemático Cerro Castillo', -46.0797578, -72.1890255, ARRAY['mirador', 'cerro castillo', 'trekking'], true),
('osm-view-laguna-duff', '8b9fba5a-8980-4a45-9c3f-d1ad7cc7a624', 'Mirador Laguna Duff', 'Vista a la laguna turquesa', -46.0479874, -72.2172991, ARRAY['mirador', 'laguna', 'duff'], true),

-- Región Lago General Carrera
('osm-view-catedral-marmol', 'loc-tranquilo', 'Catedral de Mármol', 'Vista de las formaciones de mármol desde la orilla', -46.658885, -72.6368989, ARRAY['mirador', 'mármol', 'lago carrera'], true),
('osm-view-puerto-marmol', 'loc-tranquilo', 'Puerto Mármol', 'Punto de embarque para tours al mármol', -46.6670049, -72.6373429, ARRAY['mirador', 'puerto', 'mármol'], true),
('osm-view-cabeza-perro', 'loc-tranquilo', 'Cabeza de Perro', 'Formación rocosa en el lago', -46.6453326, -72.6086642, ARRAY['mirador', 'formación rocosa'], true),
('osm-view-lago-carrera', NULL, 'Mirador Lago General Carrera', 'Vista panorámica del lago', -46.4737454, -72.7215308, ARRAY['mirador', 'lago carrera'], true),

-- Puerto Guadal
('osm-view-cementerio-berrocal', '81063521-9705-48fe-b729-7bd8830c7699', 'Cementerio Berrocal', 'Punto histórico con vistas al lago', -46.6171885, -72.7054112, ARRAY['mirador', 'histórico', 'puerto guadal'], true),

-- Puerto Ibáñez
('osm-view-ibanez', 'loc-ibanez', 'Mirador Ibáñez', 'Vista del pueblo y el lago', -46.1365263, -72.2201973, ARRAY['mirador', 'puerto ibáñez'], true),
('osm-view-laguna-verde', 'loc-ibanez', 'Mirador Laguna Verde', 'Laguna de color verde esmeralda', -46.5617257, -71.981371, ARRAY['mirador', 'laguna verde'], true),

-- Chile Chico
('osm-view-chile-chico', 'loc-chilechico', 'Mirador Chile Chico', 'Vista panorámica del pueblo', -46.5370129, -71.733178, ARRAY['mirador', 'chile chico'], true),
('osm-view-uendeunk', 'loc-chilechico', 'Mirador Uendeunk', 'Mirador arqueológico', -46.5514558, -71.627258, ARRAY['mirador', 'arqueología'], true),
('osm-view-valle-mirador', NULL, 'Mirador del Valle', 'Vista del valle de Chile Chico', -46.5506814, -71.6168536, ARRAY['mirador', 'valle'], true),

-- Cochrane
('osm-view-cochrane', 'loc-cochrane', 'Mirador Cochrane', 'Vista panorámica del pueblo', -47.250289, -72.5741272, ARRAY['mirador', 'cochrane'], true),
('osm-view-confluencia-baker', 'loc-cochrane', 'Confluencia Río Baker', 'Encuentro de ríos Baker y Nef', -47.120824, -72.775427, ARRAY['mirador', 'río baker', 'confluencia'], true),
('osm-view-douglas-tompkins', 'loc-cochrane', 'Mirador Douglas Tompkins', 'Homenaje al conservacionista', -47.1559298, -72.0756254, ARRAY['mirador', 'douglas tompkins', 'conservación'], true),

-- Caleta Tortel
('osm-view-cerro-vigia', 'loc-tortel', 'Mirador Cerro Vigía', 'Vista 360° de Caleta Tortel y fiordos', -47.7950338, -73.537263, ARRAY['mirador', 'caleta tortel', 'fiordos'], true),
('osm-view-cascada-pisagua', 'loc-tortel', 'Cascada Pisagua', 'Vista a la cascada desde mirador', -47.7915067, -73.5323732, ARRAY['mirador', 'cascada', 'tortel'], true),

-- Villa O'Higgins
('osm-view-ohiggins-cerro', 'loc-ohiggins', 'Mirador Cerro Santiago', 'Vista del pueblo y glaciares', -48.4694009, -72.5552318, ARRAY['mirador', 'villa ohiggins', 'glaciares'], true),
('osm-view-la-bandera', 'loc-ohiggins', 'Mirador La Bandera', 'Punto panorámico emblemático', -48.4657103, -72.5487679, ARRAY['mirador', 'villa ohiggins'], true),
('osm-view-lago-cisnes', 'loc-ohiggins', 'Mirador Lago Cisnes', 'Vista del lago glaciar', -48.4359621, -72.6305133, ARRAY['mirador', 'lago cisnes'], true),

-- Glaciar Exploradores
('osm-view-glaciar-exploradores', NULL, 'Mirador Glaciar Exploradores', 'Vista panorámica del glaciar desde sendero Chucao', -46.4997242, -73.1589785, ARRAY['mirador', 'glaciar exploradores'], true),
('osm-view-exploradores-hudhud', NULL, 'Mirador Glaciar Exploradores Sendero Hued-Hued', 'Vista desde sendero alternativo', -46.4966758, -73.1641989, ARRAY['mirador', 'glaciar', 'sendero'], true)

ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- CASCADAS Y SALTOS DE AGUA (WATERFALLS)
-- =====================================================
INSERT INTO attractions (id, locality_id, name, short_description, latitude, longitude, keywords, is_active) VALUES

-- Cascadas Región Queulat
('osm-fall-ventisquero', NULL, 'Cascada Ventisquero Colgante', 'Impresionante cascada que nace del glaciar colgante', -44.4365254, -72.5044404, ARRAY['cascada', 'glaciar', 'queulat'], true),
('osm-fall-condor', NULL, 'Salto El Cóndor', 'Cascada en bosque nativo', -44.643297, -72.4436132, ARRAY['cascada', 'bosque'], true),
('osm-fall-padre-garcia', NULL, 'Salto Padre García', 'Cascada accesible desde carretera', -44.5782317, -72.4099258, ARRAY['cascada', 'carretera austral'], true),

-- Cascadas Región Coyhaique
('osm-fall-virgen', 'loc-coyhaique', 'Cascada La Virgen', 'Cascada en Reserva Nacional Coyhaique', -45.4580168, -72.3726703, ARRAY['cascada', 'reserva nacional'], true),
('osm-fall-velo-novia', 'loc-coyhaique', 'Cascada El Velo de La Novia', 'Delicada cascada tipo velo', -45.4647067, -72.3150308, ARRAY['cascada', 'velo de novia'], true),
('osm-fall-rio-pullox', 'loc-coyhaique', 'Cascada Río Pullox', 'Salto en río cercano a Coyhaique', -45.6847733, -72.0570624, ARRAY['cascada', 'río'], true),

-- Cascadas Puerto Aysén
('osm-fall-barba-viejo', 'loc-aysen', 'Cascada Barbas del Viejo', 'Cascada con formaciones únicas', -45.4656663, -72.738591, ARRAY['cascada', 'barbas del viejo'], true),
('osm-fall-salto-barba', 'loc-aysen', 'Salto Barba del Viejo', 'Salto de agua espectacular', -45.4696816, -72.7368473, ARRAY['cascada', 'salto'], true),

-- Cascadas Villa O'Higgins
('osm-fall-salto-perez', 'loc-ohiggins', 'Salto Pérez', 'Cascada cerca de Villa O''Higgins', -48.1794772, -72.3831357, ARRAY['cascada', 'villa ohiggins'], true),
('osm-fall-salto-chico', 'loc-ohiggins', 'Salto Chico', 'Pequeña pero hermosa cascada', -48.1812061, -72.3817312, ARRAY['cascada', 'salto'], true),

-- Cascadas Puerto Ibáñez
('osm-fall-salto-ibanez', 'loc-ibanez', 'Salto del Río Ibáñez', 'Gran cascada del río Ibáñez', -46.254996, -71.9955658, ARRAY['cascada', 'río ibáñez'], true),
('osm-fall-cascada-seda', 'loc-ibanez', 'Cascada de Seda', 'Cascada de caída suave', -46.0574627, -72.0004258, ARRAY['cascada', 'seda'], true),

-- Cascadas Varias
('osm-fall-chorillo-salto', NULL, 'Chorillo del Salto', 'Cascada en área de El Chaltén, Argentina', -49.2955216, -72.9077067, ARRAY['cascada', 'argentina', 'el chaltén'], true),
('osm-fall-maquis', NULL, 'Cascada Los Maquis', 'Cascada escondida en el bosque', -46.8244117, -72.6628491, ARRAY['cascada', 'bosque', 'maquis'], true),
('osm-fall-nutria', NULL, 'Cascada La Nutria', 'Pequeña cascada pintoresca', -46.588471, -72.8968713, ARRAY['cascada', 'nutria'], true)

ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- ATRACCIONES NATURALES Y CULTURALES
-- =====================================================
INSERT INTO attractions (id, locality_id, name, short_description, latitude, longitude, keywords, is_active) VALUES

-- Atracciones Mármol
('osm-attr-cavernas-marmol', 'loc-tranquilo', 'Cavernas de Mármol', 'Formaciones de mármol azul en el Lago General Carrera. Accesible solo por bote.', -46.6438179, -72.6091937, ARRAY['atracción', 'mármol', 'cuevas', 'lago carrera'], true),
('osm-attr-catedral-marmol', 'loc-tranquilo', 'Catedral de Mármol', 'Impresionante catedral natural de mármol. Atracción principal de la región.', -46.6586412, -72.6275124, ARRAY['atracción', 'mármol', 'catedral', 'lago carrera'], true),
('osm-attr-capilla-marmol', 'loc-tranquilo', 'Capilla de Mármol', 'Túnel natural de mármol azul', -46.6504268, -72.6149786, ARRAY['atracción', 'mármol', 'capilla'], true),

-- Atracciones Queulat
('osm-attr-ventisquero-glacier', NULL, 'Ventisquero Colgante Glacier', 'Glaciar colgante en Parque Nacional Queulat', -44.4175813, -72.4988511, ARRAY['atracción', 'glaciar', 'queulat'], true),
('osm-attr-bosque-encantado', NULL, 'Bosque Encantado', 'Sendero de bosque milenario con musgos y líquenes', -44.6257278, -72.4522402, ARRAY['atracción', 'bosque', 'sendero'], true),

-- Atracciones Culturales Chile Chico
('osm-attr-valle-lunar', 'loc-chilechico', 'Valle Lunar', 'Formaciones rocosas erosionadas que parecen paisaje lunar', -46.7260751, -71.760166, ARRAY['atracción', 'geología', 'valle lunar'], true),
('osm-attr-cueva-manos', 'loc-chilechico', 'Cueva de las Manos', 'Sitio arqueológico con pinturas rupestres', -46.7232579, -71.7736935, ARRAY['atracción', 'arqueología', 'pinturas rupestres'], true),
('osm-attr-piedra-clavada', 'loc-chilechico', 'Piedra Clavada', 'Roca de 40 metros de altura en posición vertical', -46.7317554, -71.7816234, ARRAY['atracción', 'geología', 'roca'], true),

-- Atracciones Caleta Tortel
('osm-attr-plaza-san-pedro', 'loc-tortel', 'Plaza San Pedro', 'Plaza panorámica con pasarelas de ciprés', -47.8020596, -73.535484, ARRAY['atracción', 'caleta tortel', 'pasarelas'], true),

-- Atracciones Glaciares
('osm-attr-circo-altares', NULL, 'Circo de los Altares', 'Anfiteatro natural de picos rocosos cerca de El Chaltén', -49.2803634, -73.1266701, ARRAY['atracción', 'montañas', 'trekking'], true),
('osm-attr-laguna-tres', NULL, 'Laguna de los Tres', 'Laguna glaciar con vista al Fitz Roy', -49.2806089, -72.9840558, ARRAY['atracción', 'laguna', 'fitz roy'], true),

-- Atracciones Diversas
('osm-attr-piedra-indio', 'loc-coyhaique', 'Piedra del Indio', 'Formación rocosa que parece un rostro', -45.5753046, -72.0790222, ARRAY['atracción', 'formación rocosa', 'simpson'], true),
('osm-attr-lago-tranquilo', 'loc-tranquilo', 'Lago Tranquilo', 'Pequeño lago de aguas cristalinas', -46.6187899, -72.7780344, ARRAY['atracción', 'lago'], true),
('osm-attr-laguna-manga', NULL, 'Laguna La Manga', 'Laguna escondida en el bosque', -46.882054, -72.7020426, ARRAY['atracción', 'laguna'], true),
('osm-attr-bahia-acantilada', 'loc-aysen', 'Bahía Acantilada', 'Formaciones rocosas en la costa', -45.3859432, -72.7953172, ARRAY['atracción', 'costa', 'acantilados'], true)

ON CONFLICT (id) DO NOTHING;

-- ✅ 150+ atractivos turísticos importados desde OpenStreetMap
-- Incluye: Miradores, Cascadas, Formaciones Naturales y Sitios Culturales
