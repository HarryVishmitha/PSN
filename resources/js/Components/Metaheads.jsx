// components/MetaHeads.jsx
import { Head } from "@inertiajs/react";

const appUrl = import.meta.env.VITE_APP_URL || 'https://printair.lk';

export default function MetaHeads({
    title = "Printair Advertising",
    description = "You think it, We ink it.",
    image = `${appUrl}/images/favicon.png`,
    url = typeof window !== 'undefined' ? window.location.href : appUrl,
    keywords = "digital printing, Printair, banners, business cards, advertising, Sri Lanka",
    robots = "index, follow",
    canonical = url,
    author = "Printair Team"
}) {
    return (
        <Head>
            {/* Basic SEO */}
            
            <meta name="description" content={description} />
            <meta name="keywords" content={keywords} />
            <meta name="robots" content={robots} />
            <meta name="author" content={author} />
            <link rel="canonical" href={canonical} />

            {/* Open Graph Meta Tags */}
            <meta property="og:type" content="website" />
            <meta property="og:title" content={title} />
            <meta property="og:description" content={description} />
            <meta property="og:image" content={image} />
            <meta property="og:url" content={url} />

            {/* Twitter Card Meta Tags */}
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:title" content={title} />
            <meta name="twitter:description" content={description} />
            <meta name="twitter:image" content={image} />
            <meta name="twitter:url" content={url} />
        </Head>
    );
}
