const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://auth.easypatagonia.com',
  'sb_publishable_mnaYZsNg6wP-GSGtDad96A_KNyXN1wU'
);

async function run() {
  const { data: routes, error } = await supabase.from('easy_routes').select('*');
  console.log('Current routes count:', routes ? routes.length : 0);
  if (error) {
    console.error('Error fetching routes:', error);
    return;
  }
  if (!routes || routes.length === 0) {
    console.log('Inserting default seed routes...');
    const defaultRoutes = [
      {
        name: 'Ruta de las Capillas de Mármol',
        description: 'Recorrido por la costa del Lago General Carrera visitando miradores y muelles hacia las Capillas de Mármol.',
        total_km: 12,
        difficulty: 'Fácil',
        xp_reward: 150,
        sort_order: 1,
        is_active: true,
        checkpoints: [
          {
            id: 'cp1',
            name: 'Puerto Río Tranquilo',
            lat: -46.6225,
            lng: -72.6745,
            description: 'Punto de partida en el pueblo principal.',
            xp_reward: 30
          },
          {
            id: 'cp2',
            name: 'Mirador del Lago',
            lat: -46.6350,
            lng: -72.6500,
            description: 'Hermosa vista panorámica del Lago General Carrera.',
            xp_reward: 40
          },
          {
            id: 'cp3',
            name: 'Bahía Mansa',
            lat: -46.6500,
            lng: -72.6300,
            description: 'Muelle principal de embarque a las Capillas de Mármol.',
            xp_reward: 80
          }
        ]
      },
      {
        name: 'Sendero Glaciar Exploradores',
        description: 'Trekking moderado de aproximación al impresionante mirador del Glaciar Exploradores.',
        total_km: 25,
        difficulty: 'Moderado',
        xp_reward: 300,
        sort_order: 2,
        is_active: true,
        checkpoints: [
          {
            id: 'cp_exp1',
            name: 'Inicio de Sendero Valle Exploradores',
            lat: -46.5400,
            lng: -72.8500,
            description: 'Entrada al sendero del bosque nativo.',
            xp_reward: 50
          },
          {
            id: 'cp_exp2',
            name: 'Mirador Intermedio',
            lat: -46.5500,
            lng: -72.9000,
            description: 'Vista sobre la morrena y río Exploradores.',
            xp_reward: 100
          },
          {
            id: 'cp_exp3',
            name: 'Mirador de Hielo Glaciar',
            lat: -46.5600,
            lng: -72.9500,
            description: 'Punto más alto con espectacular vista del glaciar.',
            xp_reward: 150
          }
        ]
      }
    ];

    const { data: inserted, error: insError } = await supabase.from('easy_routes').insert(defaultRoutes).select();
    if (insError) {
      console.error('Error inserting routes:', insError);
    } else {
      console.log('Inserted routes successfully:', inserted);
    }
  } else {
    console.log('Routes already exist, no need to insert defaults.');
  }
}

run();
