-- =====================================================
-- SCRIPT: Import OpenStreetMap Points of Interest
-- Descripción: Importa campings, hostales, bencineras y estacionamientos desde OSM
-- Nota: Ejecutar después de tener localities pobladas
-- =====================================================

-- CAMPINGS / CAMPING SITES
-- =====================================================

INSERT INTO attractions (id, locality_id, name, short_description, latitude, longitude, keywords, is_active) VALUES
-- Camping Parque Nacional Queulat (CONAF)
('osm-camp-queulat', NULL, 'Camping Parque Nacional Queulat', 'Camping administrado por CONAF con servicios completos: duchas calientes, agua potable, mesas de picnic. Acepta tarjetas de crédito y débito.', -44.4695, -72.5476, ARRAY['camping', 'parque nacional', 'queulat', 'conaf'], true),

-- Gendarmaría Camping (Gratuito)
('osm-camp-gendarmaria', NULL, 'Camping Gendarmaría', 'Camping gratuito sin servicios de caravanas. Permite carpas.', -49.0997, -72.8379, ARRAY['camping', 'gratuito', 'carpas'], true),

-- La Araucaria
('osm-camp-araucaria', NULL, 'Camping La Araucaria', 'Camping con tarifa que acepta caravanas y carpas.', -47.4964, -72.8951, ARRAY['camping', 'caravanas', 'carpas'], true),

-- San Lorenzo (Cochrane)
('osm-camp-san-lorenzo', 'cochrane', 'Camping San Lorenzo', 'Camping con electricidad 220V, cocina compartida, duchas calientes, wifi y lavandería. Operado por Gaston Torres.', -47.2541, -72.5794, ARRAY['camping', 'cochrane', 'electricidad', 'wifi', 'cocina'], true),

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
('osm-camp-el-camping', 'coyhaique', 'El Camping', 'Camping con electricidad, wifi, duchas calientes y lavandería. Acepta mascotas. Tarifa: CLP $10,000 para 2 adultos. Tel: +56 9 7619 7716', -45.5775, -72.0789, ARRAY['camping', 'coyhaique', 'wifi', 'mascotas', 'duchas'], true),

-- Camping La Sirena (Puyuhuapi)
('osm-camp-la-sirena', 'puyuhuapi', 'Camping La Sirena', 'Espacio para 2 vehículos con sala común y cocina con estufa a leña. Operado por Elio Nuñez Delgado. Av. Costanera 148. Tel: +56 6 7232 5100', -44.3260, -72.5606, ARRAY['camping', 'puyuhuapi', 'cocina', 'sala común'], true),

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
('osm-camp-la-chabe', 'villa-castillo', 'Camping La Chabe', 'Camping ubicado en Villa Castillo.', -46.1307, -72.1218, ARRAY['camping', 'villa castillo'], true),

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
('osm-camp-refugio-cisnes', NULL, 'Refugio Río Cisnes', 'Refugio/camping en km 140 Carretera Austral con wifi, electricidad, duchas y fogatas. Email: info@refugioriocisnes.com. Tel: +56 9 7154 8068', -44.7033, -72.2301, ARRAY['camping', 'refugio', 'carretera austral', 'wifi'], true);

-- HOSTALES / HOSTELS
-- =====================================================

INSERT INTO attractions (id, locality_id, name, short_description, latitude, longitude, keywords, is_active) VALUES
-- Posada Queulat
('osm-hostel-queulat', NULL, 'Posada Queulat', 'Hostal en Carretera Austral. Email: rosario1@aisen.cl. Tel: +56 9 9919 3520. Web: posadaqueulat.cl', -44.5272, -72.5348, ARRAY['hostal', 'carretera austral'], true),

-- El Mosco (Hostal)
('osm-hostel-mosco', NULL, 'Hostal El Mosco', 'Hostal con internet en Carretera Austral.', -48.4646, -72.5608, ARRAY['hostal', 'internet', 'carretera austral'], true),

-- Ruca Chonos
('osm-hostel-ruca-chonos', NULL, 'Ruca Chonos', 'Hostal en zona rural.', -43.8983, -73.7463, ARRAY['hostal'], true),

-- Canto DeLluvia
('osm-hostel-canto-lluvia', NULL, 'Canto DeLluvia', 'Hostal acogedor.', -45.4929, -72.2048, ARRAY['hostal'], true),

-- Residencial Patagonia
('osm-hostel-res-patagonia', NULL, 'Residencial Patagonia', 'Residencial. Tel: +56 8 7259 186', -46.4410, -72.7119, ARRAY['hostal', 'residencial'], true),

-- Parador Austral Lodge
('osm-hostel-parador-austral', NULL, 'Parador Austral Lodge', 'Lodge en la Patagonia.', -46.8971, -72.7915, ARRAY['hostal', 'lodge'], true),

-- Hospedaje Chanito
('osm-hostel-chanito', NULL, 'Hospedaje Chanito', 'Hospedaje familiar.', -47.7961, -73.5319, ARRAY['hostal', 'hospedaje'], true),

-- Termas de Quitralco
('osm-hostel-quitralco', NULL, 'Termas de Quitralco', 'Hostal con termas naturales.', -45.6432, -73.2104, ARRAY['hostal', 'termas'], true),

-- Hostal Gladys (Coyhaique)
('osm-hostel-gladys', 'coyhaique', 'Hostal Gladys', 'General Parra 65. Email: patagoniagladys@hotmail.com. Wifi. Tel: +56 6 7224 5288. Web: hostalgladys.cl', -45.5686, -72.0656, ARRAY['hostal', 'coyhaique', 'wifi'], true),

-- Patagonia Hostel (Coyhaique)
('osm-hostel-patagonia', 'coyhaique', 'Patagonia Hostel', 'Lautaro 667. Email: reservations@patagonia-hostel.com. Web: patagonia-hostel.com', -45.5768, -72.0676, ARRAY['hostal', 'coyhaique'], true),

-- La Victoria (Chile Chico)
('osm-hostel-la-victoria', 'chile-chico', 'La Victoria', 'Hostal en Chile Chico.', -46.5386, -71.7286, ARRAY['hostal', 'chile chico'], true),

-- La Casona
('osm-hostel-la-casona', NULL, 'La Casona', 'Hostal y restaurant con comida regional. Wifi.', -46.4303, -72.7039, ARRAY['hostal', 'restaurant', 'wifi'], true),

-- Latitud 47 Sur (Cochrane)
('osm-hostel-latitud47', 'cochrane', 'Latitud 47 Sur', 'Lago Brown 564. Email: latitud47sur_patagonia@hotmail.com. Tel: +56 9 5491 2576', -47.2532, -72.5688, ARRAY['hostal', 'cochrane'], true),

-- Hostel Benito (Cochrane)
('osm-hostel-benito', 'cochrane', 'Hostel Benito', 'Lago Brown 558. Wifi. Horario: 07:30-23:30. Tel: +56 9 7760 6888', -47.2533, -72.5688, ARRAY['hostal', 'cochrane', 'wifi'], true),

-- Patagonia 47g
('osm-hostel-patagonia47g', NULL, 'Patagonia 47g', 'Carretera Austral. Email: Patagonia47g@gmail.com. Tel: +56 9 9999 4861', -46.8358, -72.8034, ARRAY['hostal', 'carretera austral'], true),

-- Senderos Patagonia
('osm-hostel-senderos', NULL, 'Hostel and Camping Senderos Patagonia', 'Wifi. Horario: 06:00-01:00', -46.1233, -72.1638, ARRAY['hostal', 'camping', 'wifi'], true),

-- Huella Patagonica (Coyhaique)
('osm-hostel-huella', 'coyhaique', 'Huella Patagonia Alojamientos', 'Ignacio Serrano 621. Email: contacto@huellapatagonica.cl. Wifi. Horario: 08:30-22:00. Tel: +56 9 4410 1571. Web: huellapatagonica.cl', -45.5769, -72.0671, ARRAY['hostal', 'coyhaique', 'wifi'], true),

-- Albergue Municipal (Los Antiguos)
('osm-hostel-municipal-antiguos', NULL, 'Albergue Municipal', 'Albergue municipal con 72 camas en Los Antiguos, Argentina.', -46.5432, -71.6101, ARRAY['hostal', 'albergue', 'municipal', 'argentina'], true),

-- Un Destino no turistico
('osm-hostel-destino-notur', NULL, 'Un Destino no turistico', 'Camino laguna la Manga. Email: info@destino-noturistico.com. Wifi gratuito. Web: destino-noturistico.com', -46.8583, -72.6995, ARRAY['hostal', 'wifi'], true),

-- Hostal Salamandras (Coyhaique)
('osm-hostel-salamandras', 'coyhaique', 'Hostal Salamandras', 'Email: info@salamandras.cl. Wifi. Tel: +56 6 7221 1865. Web: salamandras.cl', -45.5840, -72.0845, ARRAY['hostal', 'coyhaique', 'wifi'], true),

-- Cabañas Kela (Bahía Murta)
('osm-hostel-kela', 'bahia-murta', 'Cabañas Kela', 'Colombia 93, Bahía Murta. Tel: +56 9 9473 6788', -46.4557, -72.6728, ARRAY['hostal', 'cabañas', 'bahía murta'], true);

-- BENCINERAS / FUEL STATIONS
-- =====================================================

INSERT INTO attractions (id, locality_id, name, short_description, latitude, longitude, keywords, is_active) VALUES
-- YPF Los Antiguos (Argentina)
('osm-fuel-ypf-antiguos', NULL, 'YPF Los Antiguos', 'Estación de servicio YPF. Combustibles: Diesel, Diesel G2, 95, 98 octanos. Av. 11 de Julio, Los Antiguos, Argentina.', -46.5505, -71.6274, ARRAY['bencinera', 'ypf', 'los antiguos', 'argentina'], true),

-- Copec Coyhaique (24/7)
('osm-fuel-copec-coyhaique1', 'coyhaique', 'Copec Coyhaique', 'Estación Copec abierta 24/7. Diesel y gasolinas 93, 95, 97. Tel: +56 9 4391 512', -45.4618, -72.8125, ARRAY['bencinera', 'copec', 'coyhaique', '24 horas'], true),

-- Copec Puyuhuapi
('osm-fuel-copec-puyuhuapi', 'puyuhuapi', 'Copec Puyuhuapi', 'Estación Copec solo diesel. Horario: Lun-Dom 08:00-23:00. Tel: +56 8 4011 432', -44.3262, -72.5661, ARRAY['bencinera', 'copec', 'puyuhuapi', 'diesel'], true),

-- Copec Cochrane
('osm-fuel-copec-cochrane', 'cochrane', 'Copec Cochrane', 'Estación Copec en Cochrane.', -47.2557, -72.5778, ARRAY['bencinera', 'copec', 'cochrane'], true),

-- Petrobras Cochrane
('osm-fuel-petrobras-cochrane', 'cochrane', 'Petrobras Cochrane', 'Estación Petrobras. Diesel y gasolinas 93, 95, 97.', -47.2457, -72.5946, ARRAY['bencinera', 'petrobras', 'cochrane'], true),

-- Bencinera Puerto Guadal
('osm-fuel-guadal', 'puerto-guadal', 'Bencinera Combustible', 'Estación Bandera Blanca. Las Magnolias, Puerto Guadal.', -46.8428, -72.7043, ARRAY['bencinera', 'puerto guadal'], true),

-- Shell Coyhaique
('osm-fuel-shell-coyhaique1', 'coyhaique', 'Shell Coyhaique', 'Estación Shell. Diesel y gasolinas 93, 95, 97.', -45.5688, -72.0695, ARRAY['bencinera', 'shell', 'coyhaique'], true),

-- Petrobras Coyhaique
('osm-fuel-petrobras-coyhaique1', 'coyhaique', 'Petrobras Coyhaique', 'Estación Petrobras en Coyhaique.', -45.5695, -72.0688, ARRAY['bencinera', 'petrobras', 'coyhaique'], true),

-- Petrobras Coyhaique 2
('osm-fuel-petrobras-coyhaique2', 'coyhaique', 'Petrobras Coyhaique', 'Estación Petrobras en Coyhaique.', -45.5765, -72.0735, ARRAY['bencinera', 'petrobras', 'coyhaique'], true),

-- Copec Chile Chico
('osm-fuel-copec-chilechico', 'chile-chico', 'Copec Chile Chico', 'Estación Copec. Manuel Rodríguez, Chile Chico.', -46.5364, -71.7313, ARRAY['bencinera', 'copec', 'chile chico'], true),

-- Copec Coyhaique 24/7 (2)
('osm-fuel-copec-coyhaique2', 'coyhaique', 'Copec Coyhaique', 'Estación Copec 24/7. Diesel y gasolinas 93, 95, 97.', -45.5827, -72.0749, ARRAY['bencinera', 'copec', 'coyhaique', '24 horas'], true),

-- Shell Coyhaique 2
('osm-fuel-shell-coyhaique2', 'coyhaique', 'Shell Coyhaique', 'Estación Shell. Diesel y gasolinas 93, 95, 97.', -45.5776, -72.0737, ARRAY['bencinera', 'shell', 'coyhaique'], true),

-- Copec Puerto Aysén
('osm-fuel-copec-aysen', 'puerto-aysen', 'Copec Puerto Aysén', 'Estación Copec 24/7. Sargento Aldea. Diesel y 95 octanos. Tel: +56 9 4391 512', -45.3998, -72.6813, ARRAY['bencinera', 'copec', 'puerto aysén', '24 horas'], true),

-- Shell Puerto Aysén
('osm-fuel-shell-aysen', 'puerto-aysen', 'Shell Puerto Aysén', 'Estación Shell. Sargento Aldea. Diesel, 95 y 98 octanos.', -45.3995, -72.6805, ARRAY['bencinera', 'shell', 'puerto aysén'], true),

-- Copec Villa O'Higgins (con wifi)
('osm-fuel-copec-ohiggins', 'villa-ohiggins', 'Copec Villa O''Higgins', 'Estación Copec con aire comprimido, wifi. Carretera Austral.', -48.4634, -72.5611, ARRAY['bencinera', 'copec', 'villa ohiggins', 'wifi'], true);

-- =====================================================
-- NOTAS FINALES
-- =====================================================
-- Este script importa aproximadamente 80 puntos de interés desde OpenStreetMap
-- Se recomienda actualizar el campo locality_id manualmente o con un script
-- adicional que calcule la localidad más cercana basándose en coordenadas

-- Para actualizar locality_id automáticamente (ejecutar después):
/*
UPDATE attractions SET locality_id = (
  SELECT id FROM localities 
  ORDER BY 
    POW(localities.latitude - attractions.latitude, 2) + 
    POW(localities.longitude - attractions.longitude, 2) 
  LIMIT 1
) WHERE locality_id IS NULL;
*/
