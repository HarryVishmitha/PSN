// components/MetaHeads.jsx
import { Head } from "@inertiajs/react";

const appUrl = import.meta.env.VITE_APP_URL || 'https://printair.lk';

export default function MetaHeads({
    title = "Printair Advertising",
    description = "You think it, We ink it.",
    image = `${appUrl}/images/favicon.png`,
    url = window.location.href
}) {
    return (
        <Head>
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
