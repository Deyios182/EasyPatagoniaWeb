import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { Locality, Attraction } from '../types';

const SitemapGenerator: React.FC = () => {
    const [sitemap, setSitemap] = useState<string>('');

    useEffect(() => {
        const generateSitemap = async () => {
            const baseUrl = 'https://easypatagonia.com';
            const today = new Date().toISOString().split('T')[0];

            // Fetch localities and attractions
            const { data: localities } = await supabase.from('localities').select('*');
            const { data: attractions } = await supabase.from('attractions').select('*');

            const urls: string[] = [
                // Static pages
                `<url><loc>${baseUrl}/</loc><lastmod>${today}</lastmod><priority>1.0</priority></url>`,
                `<url><loc>${baseUrl}/welcome</loc><lastmod>${today}</lastmod><priority>0.9</priority></url>`,
                `<url><loc>${baseUrl}/map</loc><lastmod>${today}</lastmod><priority>0.9</priority></url>`,
                `<url><loc>${baseUrl}/directory</loc><lastmod>${today}</lastmod><priority>0.8</priority></url>`,
                `<url><loc>${baseUrl}/highlights</loc><lastmod>${today}</lastmod><priority>0.8</priority></url>`,
                `<url><loc>${baseUrl}/planner</loc><lastmod>${today}</lastmod><priority>0.7</priority></url>`,
            ];

            // Add attractions
            attractions?.forEach((attraction: Attraction) => {
                urls.push(
                    `<url><loc>${baseUrl}/attraction/${attraction.id}</loc><lastmod>${today}</lastmod><priority>0.7</priority></url>`
                );
            });

            const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>`;

            setSitemap(sitemapXml);
        };

        generateSitemap();
    }, []);

    return (
        <div style={{ fontFamily: 'monospace', whiteSpace: 'pre-wrap', padding: '20px' }}>
            <h1>Sitemap.xml</h1>
            <textarea value={sitemap} readOnly style={{ width: '100%', height: '500px' }} />
            <button onClick={() => navigator.clipboard.writeText(sitemap)}>Copy Sitemap</button>
        </div>
    );
};

export default SitemapGenerator;
