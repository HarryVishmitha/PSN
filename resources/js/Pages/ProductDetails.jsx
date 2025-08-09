import React, { useEffect, useMemo, useState } from "react";
import { Head, Link, router } from "@inertiajs/react";
import { Icon } from "@iconify/react";

/**
 * Props (from controller):
 * - product: { id, name, description, pricing_method, base_price, price_per_sqft, images[], categories[], variants[], tags[] }
 * - similarProducts: [{ id, name, image, base_price, url }]
 * - seo: { title, description }
 */

const imgFallback = "/images/default.png";

/* --------------------------- Skeleton Components --------------------------- */
const Skeleton = ({ className = "" }) => (
    <div className={`tw-animate-pulse tw-bg-gray-200 dark:tw-bg-gray-700 ${className}`} />
);

const ProductSkeleton = () => (
    <div className="tw-grid lg:tw-grid-cols-2 tw-gap-10">
        <div>
            <Skeleton className="tw-w-full tw-aspect-square tw-rounded-2xl" />
            <div className="tw-grid tw-grid-cols-5 tw-gap-3 tw-mt-4">
                {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="tw-w-full tw-aspect-square tw-rounded-xl" />
                ))}
            </div>
        </div>
        <div>
            <Skeleton className="tw-h-10 tw-w-3/4 tw-rounded-md" />
            <Skeleton className="tw-h-6 tw-w-1/3 tw-mt-3 tw-rounded-md" />
            <div className="tw-mt-6 tw-space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="tw-h-4 tw-w-full tw-rounded-md" />
                ))}
            </div>
            <div className="tw-mt-8 tw-grid sm:tw-grid-cols-2 tw-gap-4">
                <Skeleton className="tw-h-12 tw-rounded-xl" />
                <Skeleton className="tw-h-12 tw-rounded-xl" />
            </div>
            <div className="tw-mt-4">
                <Skeleton className="tw-h-14 tw-rounded-xl" />
            </div>
        </div>
    </div>
);

const CardSkeleton = () => (
    <div className="tw-rounded-2xl tw-border tw-border-gray-200 dark:tw-border-gray-800 tw-p-3">
        <Skeleton className="tw-w-full tw-aspect-[4/3] tw-rounded-xl" />
        <Skeleton className="tw-h-4 tw-w-3/4 tw-mt-3 tw-rounded-md" />
        <Skeleton className="tw-h-4 tw-w-1/2 tw-mt-2 tw-rounded-md" />
    </div>
);

/* ------------------------------ Helper Utils ------------------------------ */
const formatMoney = (num) =>
    (typeof num === "number" ? num : Number(num || 0)).toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });

const safeImg = (url) => (url && typeof url === "string" ? url : imgFallback);

/* ------------------------------- Main Page -------------------------------- */
export default function ProductDetails({ product, similarProducts = [], seo }) {
    const [pageReady, setPageReady] = useState(false);
    const [activeIndex, setActiveIndex] = useState(0);

    // pricing state
    const [quantity, setQuantity] = useState(1);

    // For roll pricing (sq.ft) -> width & height in inches or feet
    const [sizeUnit, setSizeUnit] = useState("in"); // 'in' or 'ft'
    const [width, setWidth] = useState("");
    const [height, setHeight] = useState("");

    // Variants (if you wire them later)
    const [selectedOptions, setSelectedOptions] = useState({}); // { optionName: value }

    // Local image loading state to show skeleton per image
    const [imgLoading, setImgLoading] = useState(true);

    // Mount effect to show skeleton briefly (and for SPA transitions)
    useEffect(() => {
        const t = setTimeout(() => setPageReady(true), 250); // tiny delay for skeleton effect
        return () => clearTimeout(t);
    }, []);

    const images = product?.images || [];
    const activeImage = images[activeIndex]?.image_url ?? imgFallback;

    /* ------------------------------- Price Calc ------------------------------- */
    const computedPrice = useMemo(() => {
        if (!product) return 0;

        const pm = product.pricing_method; // 'standard' | 'roll'
        if (pm === "roll") {
            const pricePerSqft = Number(product.price_per_sqft || 0);
            const w = Number(width || 0);
            const h = Number(height || 0);
            if (!pricePerSqft || !w || !h) return 0;

            // Convert to feet if needed
            let wFeet = w;
            let hFeet = h;
            if (sizeUnit === "in") {
                wFeet = w / 12;
                hFeet = h / 12;
            }

            const sqft = Math.max(wFeet * hFeet, 0);
            const unitPrice = sqft * pricePerSqft;
            return Math.max(unitPrice, 0) * Math.max(Number(quantity || 1), 1);
        }

        // standard pricing
        const base = Number(product.base_price || 0);
        return Math.max(base, 0) * Math.max(Number(quantity || 1), 1);
    }, [product, width, height, sizeUnit, quantity]);

    const changeQuantity = (delta) => {
        setQuantity((q) => Math.max(1, Number(q || 1) + delta));
    };

    /* ------------------------------ Event Handlers ----------------------------- */
    const handleSelectThumb = (i) => {
        setActiveIndex(i);
        setImgLoading(true);
    };

    const handleAddToQuote = () => {
        // You can swap to your add-to-cart/quote route here
        // Example: router.post('/quote', { product_id: product.id, ... })
    };

    if (!product) {
        // No product found -> simple fallback
        return (
            <div className="tw-container tw-mx-auto tw-px-4 tw-py-14">
                <Head title="Product not found" />
                <p className="tw-text-center tw-text-gray-600">Product not found.</p>
            </div>
        );
    }

    return (
        <div className="tw-container tw-mx-auto tw-px-4 tw-py-10">
            <Head>
                <title>{seo?.title || product.name}</title>
                {seo?.description && <meta name="description" content={seo.description} />}
                <meta property="og:title" content={seo?.title || product.name} />
                {seo?.description && <meta property="og:description" content={seo.description} />}
                <meta property="og:image" content={safeImg(activeImage)} />
            </Head>

            {/* Breadcrumbs */}
            <nav className="tw-text-sm tw-text-gray-500 tw-mb-6">
                <ol className="tw-flex tw-flex-wrap tw-gap-1 tw-items-center">
                    <li>
                        <Link href="/" className="tw-text-gray-600 hover:tw-text-[#f44032] tw-transition">Home</Link>
                    </li>
                    <li> / </li>
                    <li>
                        <Link href="/products/all" className="tw-text-gray-600 hover:tw-text-[#f44032] tw-transition">Products</Link>
                    </li>
                    <li> / </li>
                    <li className="tw-text-gray-800">{product.name}</li>
                </ol>
            </nav>

            {/* Skeleton while "loading" */}
            {!pageReady ? (
                <ProductSkeleton />
            ) : (
                <div className="tw-grid lg:tw-grid-cols-2 tw-gap-10">
                    {/* ----------------------------- Gallery ----------------------------- */}
                    <section>
                        <div className="tw-relative tw-rounded-2xl tw-overflow-hidden tw-border tw-border-gray-200 dark:tw-border-gray-800">
                            {imgLoading && <Skeleton className="tw-absolute tw-inset-0" />}
                            <img
                                src={safeImg(activeImage)}
                                alt={product.name}
                                onLoad={() => setImgLoading(false)}
                                onError={() => setImgLoading(false)}
                                className={`tw-w-full tw-h-full tw-object-cover tw-aspect-square ${imgLoading ? "tw-invisible" : "tw-visible"}`}
                            />
                            {/* Zoom/Full icon placeholder */}
                            <button
                                type="button"
                                className="tw-absolute tw-top-3 tw-right-3 tw-bg-white/80 dark:tw-bg-gray-900/70 tw-backdrop-blur tw-p-2 tw-rounded-xl tw-border tw-border-gray-200 dark:tw-border-gray-700"
                                aria-label="Open full view"
                            >
                                <Icon icon="mdi:magnify-plus" className="tw-text-xl" />
                            </button>
                        </div>

                        <div className="tw-grid tw-grid-cols-5 tw-gap-3 tw-mt-4">
                            {(images.length ? images : [{ image_url: imgFallback }]).slice(0, 5).map((img, i) => {
                                const active = i === activeIndex;
                                return (
                                    <button
                                        key={i}
                                        type="button"
                                        onClick={() => handleSelectThumb(i)}
                                        className={`tw-relative tw-rounded-xl tw-overflow-hidden tw-border ${active ? "tw-border-[#f44032]" : "tw-border-gray-200 dark:tw-border-gray-800"
                                            }`}
                                    >
                                        <img
                                            src={safeImg(img.image_url)}
                                            alt={`${product.name} ${i + 1}`}
                                            className="tw-w-full tw-aspect-square tw-object-cover"
                                        />
                                    </button>
                                );
                            })}
                        </div>
                    </section>

                    {/* ---------------------------- Right Column ---------------------------- */}
                    <section>
                        <h1 className="tw-text-2xl md:tw-text-3xl tw-font-extrabold tw-leading-tight">{product.name}</h1>

                        {/* Price block */}
                        <div className="tw-mt-3 tw-flex tw-items-center tw-gap-3">
                            <span className="tw-text-xl tw-font-semibold tw-text-[#f44032]">
                                {product.pricing_method === "roll" ? "From" : ""} Rs. {formatMoney(computedPrice || product.base_price)}
                            </span>
                            {product.pricing_method === "roll" && product.price_per_sqft ? (
                                <span className="tw-text-sm tw-text-gray-500">({formatMoney(product.price_per_sqft)} / sq.ft)</span>
                            ) : null}
                        </div>

                        {/* Categories */}
                        {product.categories?.length ? (
                            <div className="tw-mt-4 tw-flex tw-flex-wrap tw-gap-2">
                                {product.categories.map((c) => (
                                    <span key={c.id} className="tw-text-xs tw-bg-gray-100 dark:tw-bg-gray-800 tw-text-gray-700 dark:tw-text-gray-300 tw-px-3 tw-py-1 tw-rounded-full">
                                        {c.name}
                                    </span>
                                ))}
                            </div>
                        ) : null}

                        {/* Description */}
                        <div className="tw-prose dark:tw-prose-invert tw-max-w-none tw-mt-6 tw-text-gray-700 dark:tw-text-gray-200">
                            <div dangerouslySetInnerHTML={{ __html: product.description || "" }} />
                        </div>

                        {/* Variant pickers (placeholder, wire as needed) */}
                        {Array.isArray(product.variants) && product.variants.length > 0 && (
                            <div className="tw-mt-6 tw-space-y-4">
                                {product.variants.map((v) => (
                                    <div key={v.id} className="tw-space-y-2">
                                        <label className="tw-text-sm tw-font-medium">{v.name}</label>
                                        <div className="tw-flex tw-flex-wrap tw-gap-2">
                                            {Array.isArray(v.options) && v.options.map((opt) => {
                                                const active = selectedOptions[v.name] === opt.value;
                                                return (
                                                    <button
                                                        key={opt.id ?? opt.value}
                                                        type="button"
                                                        onClick={() =>
                                                            setSelectedOptions((prev) => ({ ...prev, [v.name]: opt.value }))
                                                        }
                                                        className={`tw-px-3 tw-py-2 tw-rounded-xl tw-border ${active
                                                                ? "tw-border-[#f44032] tw-text-[#f44032] tw-bg-[#f44032]/5"
                                                                : "tw-border-gray-300 dark:tw-border-gray-700 hover:tw-border-[#f44032]"
                                                            } tw-text-sm`}
                                                    >
                                                        {opt.label ?? opt.value}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Pricing Controls */}
                        <div className="tw-mt-6 tw-grid md:tw-grid-cols-2 tw-gap-4">
                            {/* For roll pricing: size inputs */}
                            {product.pricing_method === "roll" ? (
                                <div className="tw-space-y-2">
                                    <label className="tw-text-sm tw-font-medium">Size</label>
                                    <div className="tw-flex tw-gap-2">
                                        <input
                                            type="number"
                                            min="0"
                                            step="0.1"
                                            value={width}
                                            onChange={(e) => setWidth(e.target.value)}
                                            className="tw-flex-1 tw-border tw-rounded-xl tw-px-3 tw-py-2 dark:tw-bg-gray-900 dark:tw-border-gray-700"
                                            placeholder={`Width (${sizeUnit})`}
                                        />
                                        <input
                                            type="number"
                                            min="0"
                                            step="0.1"
                                            value={height}
                                            onChange={(e) => setHeight(e.target.value)}
                                            className="tw-flex-1 tw-border tw-rounded-xl tw-px-3 tw-py-2 dark:tw-bg-gray-900 dark:tw-border-gray-700"
                                            placeholder={`Height (${sizeUnit})`}
                                        />
                                        <select
                                            value={sizeUnit}
                                            onChange={(e) => setSizeUnit(e.target.value)}
                                            className="tw-border tw-rounded-xl tw-px-3 tw-py-2 dark:tw-bg-gray-900 dark:tw-border-gray-700"
                                        >
                                            <option value="in">in</option>
                                            <option value="ft">ft</option>
                                        </select>
                                    </div>
                                    <p className="tw-text-xs tw-text-gray-500">Area = W × H → sq.ft pricing</p>
                                </div>
                            ) : (
                                <div />
                            )}

                            {/* Quantity */}
                            <div className="tw-space-y-2">
                                <label className="tw-text-sm tw-font-medium">Quantity</label>
                                <div className="tw-flex tw-items-center tw-gap-2">
                                    <button
                                        type="button"
                                        className="tw-w-10 tw-h-10 tw-rounded-xl tw-border tw-grid tw-place-content-center hover:tw-border-[#f44032]"
                                        onClick={() => changeQuantity(-1)}
                                    >
                                        <Icon icon="mdi:minus" />
                                    </button>
                                    <input
                                        type="number"
                                        min="1"
                                        value={quantity}
                                        onChange={(e) => setQuantity(Math.max(1, Number(e.target.value || 1)))}
                                        className="tw-w-20 tw-text-center tw-border tw-rounded-xl tw-px-3 tw-py-2 dark:tw-bg-gray-900 dark:tw-border-gray-700"
                                    />
                                    <button
                                        type="button"
                                        className="tw-w-10 tw-h-10 tw-rounded-xl tw-border tw-grid tw-place-content-center hover:tw-border-[#f44032]"
                                        onClick={() => changeQuantity(1)}
                                    >
                                        <Icon icon="mdi:plus" />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* CTA */}
                        <div className="tw-mt-6 tw-flex tw-flex-wrap tw-gap-3">
                            <button
                                type="button"
                                onClick={handleAddToQuote}
                                className="tw-inline-flex tw-items-center tw-gap-2 tw-bg-[#f44032] tw-text-white tw-font-semibold tw-px-5 tw-py-3 tw-rounded-2xl hover:tw-scale-[1.01] tw-transition"
                            >
                                <Icon icon="mdi:cart-outline" className="tw-text-xl" />
                                Add to Quote
                            </button>

                            <div className="tw-flex tw-items-center tw-gap-2 tw-text-gray-600">
                                <Icon icon="mdi:cash-multiple" className="tw-text-xl" />
                                <span className="tw-text-sm">Current total: Rs. {formatMoney(computedPrice)}</span>
                            </div>
                        </div>

                        {/* Meta info */}
                        {product.tags?.length ? (
                            <div className="tw-mt-6 tw-flex tw-flex-wrap tw-gap-2">
                                {product.tags.map((t) => (
                                    <span key={t.id} className="tw-text-xs tw-px-2 tw-py-1 tw-rounded tw-bg-gray-100 dark:tw-bg-gray-800">
                                        #{t.name}
                                    </span>
                                ))}
                            </div>
                        ) : null}
                    </section>
                </div>
            )}

            {/* --------------------------- Similar Products --------------------------- */}
            <section className="tw-mt-14">
                <div className="tw-flex tw-items-center tw-justify-between tw-mb-4">
                    <h2 className="tw-text-xl tw-font-bold">You might also like</h2>
                    <Link href="/products/all" className="tw-text-sm tw-text-[#f44032] hover:tw-underline">
                        View all
                    </Link>
                </div>

                {!pageReady ? (
                    <div className="tw-grid sm:tw-grid-cols-2 md:tw-grid-cols-3 lg:tw-grid-cols-4 tw-gap-6">
                        {Array.from({ length: 8 }).map((_, i) => (
                            <CardSkeleton key={i} />
                        ))}
                    </div>
                ) : similarProducts?.length ? (
                    <div className="tw-grid sm:tw-grid-cols-2 md:tw-grid-cols-3 lg:tw-grid-cols-4 tw-gap-6">
                        {similarProducts.map((sp) => (
                            <Link
                                key={sp.id}
                                href={sp.url}
                                className="tw-group tw-block tw-rounded-2xl tw-border tw-border-gray-200 dark:tw-border-gray-800 tw-overflow-hidden hover:tw-shadow-md tw-transition"
                            >
                                <div className="tw-relative tw-aspect-[4/3] tw-overflow-hidden">
                                    <img
                                        src={safeImg(sp.image)}
                                        alt={sp.name}
                                        className="tw-w-full tw-h-full tw-object-cover group-hover:tw-scale-105 tw-transition"
                                        loading="lazy"
                                    />
                                </div>
                                <div className="tw-p-4">
                                    <h3 className="tw-font-semibold tw-leading-tight">{sp.name}</h3>
                                    {sp.base_price != null && (
                                        <p className="tw-text-sm tw-text-gray-600 tw-mt-1">From Rs. {formatMoney(sp.base_price)}</p>
                                    )}
                                </div>
                            </Link>
                        ))}
                    </div>
                ) : (
                    <div className="tw-text-gray-500">No related products available.</div>
                )}
            </section>
        </div>
    );
}
