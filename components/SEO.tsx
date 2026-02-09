import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useLocation } from 'react-router-dom';

interface SEOProps {
    title?: string;
    description?: string;
    keywords?: string[];
    image?: string;
    type?: 'website' | 'article' | 'profile';
    noindex?: boolean;
}

const SEO: React.FC<SEOProps> = ({
    title,
    description,
    keywords = [],
    image,
    type = 'website',
    noindex = false,
}) => {
    const location = useLocation();
    const siteUrl = 'https://easypatagonia.com';
    const currentUrl = `${siteUrl}${location.pathname}`;

    // Default values
    const defaultTitle = 'Easy Patagonia - Descubre Aysén, Chile';
    const defaultDescription =
        'Guía inteligente de la Patagonia Chilena. Descubre atractivos turísticos, empresas locales, restaurantes, hoteles y actividades en la Región de Aysén. Tu compañero digital para explorar la Carretera Austral.';
    const defaultImage = `${siteUrl}/og-image.png`;
    const defaultKeywords = [
        'patagonia',
        'aysén',
        'chile',
        'turismo',
        'carretera austral',
        'atractivos turísticos',
        'hoteles patagonia',
        'restaurantes aysén',
        'guía turística',
        'viajes chile',
        'puyuhuapi',
        'coyhaique',
        'puerto cisnes',
        'villa o\'higgins',
        'caleta tortel',
    ];

    const pageTitle = title ? `${title} | Easy Patagonia` : defaultTitle;
    const pageDescription = description || defaultDescription;
    const pageImage = image || defaultImage;
    const pageKeywords = [...defaultKeywords, ...keywords].join(', ');

    return (
        <Helmet>
            {/* Basic Meta Tags */}
            <title>{pageTitle}</title>
            <meta name="description" content={pageDescription} />
            <meta name="keywords" content={pageKeywords} />
            <link rel="canonical" href={currentUrl} />

            {/* Robots */}
            {noindex ? (
                <meta name="robots" content="noindex, nofollow" />
            ) : (
                <meta name="robots" content="index, follow, max-image-preview:large" />
            )}

            {/* Open Graph (Facebook, WhatsApp, LinkedIn) */}
            <meta property="og:type" content={type} />
            <meta property="og:url" content={currentUrl} />
            <meta property="og:title" content={pageTitle} />
            <meta property="og:description" content={pageDescription} />
            <meta property="og:image" content={pageImage} />
            <meta property="og:image:width" content="1200" />
            <meta property="og:image:height" content="630" />
            <meta property="og:site_name" content="Easy Patagonia" />
            <meta property="og:locale" content="es_CL" />

            {/* Twitter Card */}
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:url" content={currentUrl} />
            <meta name="twitter:title" content={pageTitle} />
            <meta name="twitter:description" content={pageDescription} />
            <meta name="twitter:image" content={pageImage} />

            {/* Additional Meta Tags */}
            <meta name="author" content="Easy Patagonia" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            <meta name="theme-color" content="#dd6e42" />
            <meta name="apple-mobile-web-app-capable" content="yes" />
            <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />

            {/* Schema.org Organization */}
            <script type="application/ld+json">
                {JSON.stringify({
                    '@context': 'https://schema.org',
                    '@type': 'Organization',
                    name: 'Easy Patagonia',
                    description: defaultDescription,
                    url: siteUrl,
                    logo: `${siteUrl}/logo.png`,
                    sameAs: [
                        'https://www.facebook.com/easypatagonia',
                        'https://www.instagram.com/easypatagonia',
                    ],
                    contactPoint: {
                        '@type': 'ContactPoint',
                        contactType: 'Customer Service',
                        availableLanguage: ['Spanish', 'English'],
                    },
                })}
            </script>

            {/* Schema.org Website */}
            <script type="application/ld+json">
                {JSON.stringify({
                    '@context': 'https://schema.org',
                    '@type': 'WebSite',
                    name: 'Easy Patagonia',
                    url: siteUrl,
                    potentialAction: {
                        '@type': 'SearchAction',
                        target: `${siteUrl}/search?q={search_term_string}`,
                        'query-input': 'required name=search_term_string',
                    },
                })}
            </script>
        </Helmet>
    );
};

export default SEO;
