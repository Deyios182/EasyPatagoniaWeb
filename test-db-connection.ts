// Test de Conexión a Supabase
// Ejecuta este archivo para diagnosticar problemas de base de datos

import { supabase } from './supabaseClient';

async function testDatabaseConnection() {
    console.log('🔍 INICIANDO DIAGNÓSTICO DE BASE DE DATOS\n');

    // Test 1: Conexión básica
    console.log('Test 1: Verificando conexión básica...');
    try {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error) {
            console.log('❌ No hay usuario autenticado:', error.message);
        } else {
            console.log('✅ Usuario autenticado:', user?.id);
        }
    } catch (e) {
        console.error('❌ Error de conexión:', e);
    }

    // Test 2: Verificar tabla users
    console.log('\nTest 2: Verificando tabla users...');
    try {
        const { data, error, count } = await supabase
            .from('users')
            .select('id', { count: 'exact', head: true });

        if (error) {
            console.error('❌ Error accediendo tabla users:', error);
            console.error('Detalles:', error.message);
            console.error('Código:', error.code);
        } else {
            console.log('✅ Tabla users accesible. Total registros:', count);
        }
    } catch (e) {
        console.error('❌ Excepción:', e);
    }

    // Test 3: Verificar tabla persons
    console.log('\nTest 3: Verificando tabla persons...');
    try {
        const { data, error, count } = await supabase
            .from('persons')
            .select('id', { count: 'exact', head: true });

        if (error) {
            console.error('❌ Error accediendo tabla persons:', error);
        } else {
            console.log('✅ Tabla persons accesible. Total registros:', count);
        }
    } catch (e) {
        console.error('❌ Excepción:', e);
    }

    // Test 4: Query complejo (el que está fallando)
    console.log('\nTest 4: Probando query complejo con joins...');
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
        try {
            const { data, error } = await supabase
                .from('users')
                .select(`
                    id,
                    username,
                    is_active,
                    person_id,
                    persons (
                        id, first_name, last_name, email
                    ),
                    user_roles (
                        roles (
                            name
                        )
                    )
                `)
                .eq('id', user.id)
                .single();

            if (error) {
                console.error('❌ Query complejo falló:', error);
                console.error('Mensaje:', error.message);
            } else {
                console.log('✅ Query complejo exitoso!');
                console.log('Datos:', JSON.stringify(data, null, 2));
            }
        } catch (e) {
            console.error('❌ Excepción en query complejo:', e);
        }
    }

    console.log('\n🏁 DIAGNÓSTICO COMPLETADO');
}

testDatabaseConnection();
