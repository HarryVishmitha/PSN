import React from 'react';
import { Link, usePage, Head } from '@inertiajs/react';
import { Icon } from '@iconify/react';

const appUrl = import.meta.env.VITE_APP_URL || 'https://printair.lk';

const generateFromUrl = (url) => {
    const segments = url.split('/').filter(Boolean);
    let path = '';
    return segments.map((seg, index) => {
        path += `/${seg}`;
        return {
            label: decodeURIComponent(seg.charAt(0).toUpperCase() + seg.slice(1).replace(/-/g, ' ')),
            href: index === segments.length - 1 ? null : path,
        };
    });
};

const Breadcrumb = ({
    items = null,           // Array of { label, href } or null to auto-generate
    separator = '/',        // Custom separator
    className = '',         // Optional custom styling
    showSchema = true       // Whether to inject SEO schema
}) => {
    const { url } = usePage();
    const breadcrumbItems = items ?? generateFromUrl(url);

    // SEO: JSON-LD schema for breadcrumbs
    const breadcrumbSchema = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": breadcrumbItems.map((item, index) => ({
            "@type": "ListItem",
            "position": index + 1,
            "name": item.label,
            ...(item.href && { item: `${appUrl}${item.href}` })
        }))
    };

    return (
        <>
            {showSchema && (
                <Head>
                    <script type="application/ld+json">
                        {JSON.stringify(breadcrumbSchema)}
                    </script>
                </Head>
            )}

            <nav aria-label="Breadcrumb" className={`tw-py-4 tw-px-4 tw-bg-gray-50 dark:tw-bg-gray-900 ${className}`}>
                <ol className="tw-flex tw-items-center tw-flex-wrap tw-gap-1 text-sm tw-text-gray-600 dark:tw-text-gray-300 tw-bg-gray-200 tw-ps-3 tw-rounded tw-py-1">
                    <li>
                        <Link href="/" className="tw-flex tw-items-center hover:tw-text-primary">
                            <Icon icon="mdi:home" className="tw-mr-1" />
                            Home
                        </Link>
                    </li>

                    {breadcrumbItems.map((item, i) => (
                        <li key={i} className="tw-flex tw-items-center">
                            <span className="tw-mx-1 tw-select-none">{separator}</span>
                            {item.href ? (
                                <Link
                                    href={item.href}
                                    className="hover:tw-text-primary"
                                >
                                    {item.label}
                                </Link>
                            ) : (
                                <span className="tw-text-primary">{item.label}</span>
                            )}
                        </li>
                    ))}
                </ol>
            </nav>
        </>
    );
};

export default Breadcrumb;
