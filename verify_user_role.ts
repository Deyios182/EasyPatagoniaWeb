
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Load env vars
dotenv.config();

const supabase = createClient(
    process.env.VITE_SUPABASE_URL!,
    process.env.VITE_SUPABASE_ANON_KEY!
);

async function checkRole() {
    const email = 'thejozx.182@gmail.com';
    console.log(`Checking roles for ${email}...`);

    // 1. Get User ID (we can't list users with anon key, so we query the public.users table or persons)
    // Assuming public.persons/users is readable

    // Check persons
    const { data: person, error: pError } = await supabase
        .from('persons')
        .select('*')
        .eq('email', email)
        .single();

    if (pError) {
        console.error('Error fetching person:', pError);
    } else {
        console.log('Person found:', person);

        // Check User Roles using the view or RPC if available, or manual join info
        // We might not have direct access to user_roles with anon key due to RLS?
        // Let's try to fetch using the App's logic: profiles view if it exists, or just users table

        // But wait, the app uses 'fetchUserProfile' which joins things.
        // Let's emulate that.

        const { data: userData, error: uError } = await supabase
            .from('users')
            .select(`
                id,
                username,
                is_active,
                persons (
                    email
                )
           `)
            .eq('id', person.id) // wait person id might not match user id if they are separate?
            // Actually users.id is the auth.id. persons.id is different.
            // users.person_id -> persons.id
            // We need to find the user where person_id = person.id
            .single();

        // Actually simpler:
        // The app logic:
        // const { data: profile } = await supabase.rpc('get_user_full_info', { p_user_id: user.id }) -- disabled
        // Direct fetch: users table

        const { data: userEntry, error: uEntryError } = await supabase
            .from('users')
            .select(`*, persons(*)`)
            .eq('person_id', person.id)
            .single();

        if (userEntry) {
            console.log('User Entry found:', userEntry);

            // Now check roles
            // table user_roles is usually protected. 
            // We can check if 'get_user_roles' RPC exists?
        }
    }
}

checkRole();
