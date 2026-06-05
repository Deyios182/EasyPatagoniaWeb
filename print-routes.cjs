const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://auth.easypatagonia.com',
  'sb_publishable_mnaYZsNg6wP-GSGtDad96A_KNyXN1wU'
);

async function run() {
  const { data: routes, error } = await supabase.from('easy_routes').select('*');
  if (error) {
    console.error('Error fetching routes:', error);
    return;
  }
  console.log('Routes in DB:', JSON.stringify(routes, null, 2));
}

run();
