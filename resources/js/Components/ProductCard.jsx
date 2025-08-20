// resources/js/Components/ProductCard.jsx
import React, { useMemo, useState } from 'react';
import { Link } from '@inertiajs/react';
import { Icon } from '@iconify/react';

const slugify = (s = '') =>
    s.toString().toLowerCase().trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');

const fmtMoney = (n) => {
    const num = Number(n);
    if (Number.isNaN(num)) return null;
    return num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const safe = (u) => (u && typeof u === 'string' ? u : '/images/default.png');

const ProductCard = ({
    product,
    onQuickView,          // optional: (product) => void
    onToggleCompare,      // optional: (id) => void
    isCompared = false,   // optional
}) => {
    if (!product) return null;

    const {
        id,
        name,
        image,
        images,                 // optional: [{image_url: "..."}]
        short_description,
        pricing_method,         // 'standard' | 'roll'
        effective_price,
        price_unit,             // e.g. "per sq.ft" | "piece"
        display_price,
        rating,
        views,
        stock,
        badge,                  // e.g. "NEW"
        discount,               // e.g. "-10%"
        link,
    } = product;

    const href = link || `/product/${id}/${slugify(name)}`;

    // images (enable hover swap if second exists)
    const primaryImg = useMemo(() => safe(images?.[0]?.image_url || image), [images, image]);
    const hoverImg = useMemo(() => safe(images?.[1]?.image_url || images?.[0]?.image_url || image), [images, image]);
    const hasHover = hoverImg !== primaryImg;

    const [loaded1, setLoaded1] = useState(false);
    const [loaded2, setLoaded2] = useState(false);

    const priceNumber = fmtMoney(effective_price);
    const perSqft = pricing_method === 'roll';

    const priceMain = display_price
        ? display_price
        : priceNumber
            ? `Rs ${priceNumber}`
            : 'Contact for price';

    const unitText = display_price
        ? ''
        : priceNumber && price_unit
            ? price_unit
            : perSqft && !priceNumber && price_unit
                ? price_unit
                : '';

    const stars = Math.round(Number(rating || 0));
    const safeViews = Number.isFinite(views) ? views : 0;

    return (
        <div className="not-prose tw-group tw-rounded-2xl tw-border tw-border-gray-200 dark:tw-border-gray-800 tw-bg-white tw-overflow-hidden tw-shadow-sm hover:tw-shadow-md focus-within:tw-ring-2 focus-within:tw-ring-[#f44032]/70 tw-transition">
            {/* ---------- Media ---------- */}
            <Link href={href} aria-label={`View ${name}`} className="tw-block tw-relative tw-aspect-[4/3] tw-overflow-hidden">
                {/* Badges */}
                <div className="tw-absolute tw-inset-x-3 tw-top-3 tw-z-10 tw-flex tw-justify-between">
                    <div className="tw-flex tw-gap-2">
                        {badge && (
                            <span className="tw-text-[11px] tw-font-bold tw-bg-black tw-text-white tw-rounded-full tw-px-2 tw-py-1">
                                {badge}
                            </span>
                        )}
                        {discount && (
                            <span className="tw-text-[11px] tw-font-bold tw-bg-red-100 tw-text-red-700 tw-rounded-full tw-px-2 tw-py-1">
                                {discount}
                            </span>
                        )}
                    </div>
                    {perSqft && (
                        <span className="tw-text-[11px] tw-font-medium tw-bg-black/80 tw-text-white tw-rounded-full tw-px-2 tw-py-1">
                            Per sq.ft
                        </span>
                    )}
                </div>

                {/* Blur-up + optional hover-swap */}
                <img
                    src={primaryImg}
                    alt={name}
                    loading="lazy"
                    onLoad={() => setLoaded1(true)}
                    className={`tw-absolute tw-inset-0 tw-w-full tw-h-full tw-object-cover tw-transition-opacity ${loaded1 ? 'tw-opacity-100 tw-blur-0' : 'tw-opacity-80 tw-blur-md'} ${hasHover ? 'group-hover:tw-opacity-0' : ''}`}
                />
                {hasHover && (
                    <img
                        src={hoverImg}
                        alt={name}
                        loading="lazy"
                        onLoad={() => setLoaded2(true)}
                        className={`tw-absolute tw-inset-0 tw-w-full tw-h-full tw-object-cover tw-transition-opacity ${loaded2 ? 'tw-opacity-0 group-hover:tw-opacity-100 tw-blur-0' : 'tw-opacity-0 tw-blur-md'}`}
                    />
                )}

                {/* Hover glass */}
                <div className="tw-absolute tw-inset-0 tw-opacity-0 group-hover:tw-opacity-100 tw-bg-gradient-to-t tw-from-black/20 tw-to-transparent tw-transition" />
            </Link>

            {/* ---------- Content ---------- */}
            <div className="tw-p-3 md:tw-p-4">
                {/* Title */}
                <Link href={href} className="tw-no-underline">
                    <h4 className="tw-text-[15px] md:tw-text-[16px] tw-font-semibold tw-leading-snug tw-text-gray-900 tw-line-clamp-2 tw-min-h-[2.3rem]">
                        {name}
                    </h4>
                </Link>

                {/* Short description (tiny, clamped) */}
                {short_description && (
                    <div
                        className="tw-text-xs tw-text-gray-500 tw-mt-1 tw-mb-2 tw-line-clamp-2"
                        dangerouslySetInnerHTML={{ __html: short_description }}
                    />
                )}

                {/* Rating + views */}
                <div className="tw-flex tw-items-center tw-justify-between tw-mb-2">
                    <div className="tw-flex tw-items-center tw-gap-0.5">
                        {[...Array(5)].map((_, i) => (
                            <Icon
                                key={i}
                                icon="mdi:star"
                                className={`tw-text-[16px] ${i < stars ? 'tw-text-amber-400' : 'tw-text-gray-300'}`}
                                aria-hidden="true"
                            />
                        ))}
                    </div>
                    <div className="tw-text-[11px] tw-text-gray-500">
                        ({views.length} {safeViews === 1 ? 'view' : 'views'})
                    </div>
                </div>

                {/* Price */}
                <div className="tw-flex tw-items-baseline tw-justify-between tw-mb-3">
                    <div className="tw-flex tw-flex-col">
                        <span className="tw-text-[12px] tw-text-gray-400">Price</span>
                        <div className="tw-flex tw-items-baseline tw-gap-1">
                            <span className="tw-text-[#f44032] tw-font-bold tw-text-base md:tw-text-lg">{priceMain}</span>
                            {unitText && <span className="tw-text-[12px] tw-text-gray-500">{unitText}</span>}
                        </div>
                    </div>
                    {typeof stock !== 'undefined' && stock !== null && (
                        <div className={`tw-text-[11px] ${stock > 0 ? 'tw-text-gray-500' : 'tw-text-red-600'}`}>
                            {stock > 0 ? `Only ${stock} left!` : 'Out of stock'}
                        </div>
                    )}
                </div>

                {/* Actions — mobile-style CTAs on all screens */}
                <div className="tw-mt-2 tw-space-y-2">
                    {/* Add to Cart — red, full width, pill */}
                    <Link
                        href={href}
                        className="tw-w-full tw-inline-flex tw-justify-center tw-items-center tw-gap-2 tw-h-12 tw-rounded-3xl tw-font-semibold tw-text-base tw-bg-[#f44032] tw-text-white tw-shadow-sm hover:tw-bg-[#e13124] focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-[#f44032]/40 active:tw-scale-[.99] tw-no-underline"
                        aria-label={`Add ${name} to cart`}
                    >
                        <Icon icon="mdi:cart-plus" className="tw-text-xl" />
                        Add to Cart
                    </Link>

                    {/* Ask a Quote — white, bordered, full width, pill */}
                    <Link
                        href="/quote"
                        className="tw-w-full tw-inline-flex tw-justify-center tw-items-center tw-gap-2 tw-h-12 tw-rounded-3xl tw-font-semibold tw-text-base tw-border tw-border-gray-200 tw-bg-white tw-text-gray-800 hover:tw-bg-gray-50 focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-gray-200 active:tw-scale-[.99] tw-no-underline"
                    >
                        <Icon icon="mdi:email-fast-outline" className="tw-text-xl" />
                        Ask a Quote
                    </Link>

                    {/* Compare — attractive toggle button */}
                    {/* {onToggleCompare && (
                        <button
                            type="button"
                            onClick={() => onToggleCompare(id)}
                            aria-pressed={isCompared}
                            className={`tw-w-full tw-inline-flex tw-justify-center tw-items-center tw-gap-2 tw-h-11 tw-rounded-3xl tw-font-semibold tw-text-sm tw-shadow-sm focus-visible:tw-outline-none focus-visible:tw-ring-2 active:tw-scale-[.99] ${isCompared
                                    ? 'tw-bg-[#f44032]/10 tw-text-[#f44032] tw-border tw-border-[#f44032]/40 focus-visible:tw-ring-[#f44032]/30'
                                    : 'tw-bg-white tw-text-gray-800 tw-border tw-border-gray-200 hover:tw-bg-gray-50 focus-visible:tw-ring-gray-200'
                                }`}
                        >
                            <Icon
                                icon={isCompared ? 'mdi:checkbox-marked-outline' : 'mdi:checkbox-blank-outline'}
                                className="tw-text-lg"
                            />
                            {isCompared ? 'Added to Compare' : 'Compare'}
                        </button>
                    )} */}

                    {/* Quick view — small underlined link */}
                    {/* {onQuickView && (
                        <button
                            type="button"
                            onClick={() => onQuickView(product)}
                            className="tw-w-full tw-inline-flex tw-justify-center tw-items-center tw-gap-1 tw-text-sm tw-text-gray-700 hover:tw-text-[#f44032] tw-underline tw-pt-1"
                            aria-label="Quick view"
                        >
                            <Icon icon="mdi:eye-outline" className="tw-text-base" />
                            Quick view
                        </button>
                    )} */}
                </div>
            </div>
        </div>
    );
};

export default ProductCard;
