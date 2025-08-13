import React, { useEffect, useMemo, useState } from "react";
import { Head, Link } from "@inertiajs/react";
import { Icon } from "@iconify/react";
import Footer from "@/Components/Footer";
import Meta from "@/Components/Metaheads";
import Header from "@/components/Header";
import CookieConsent from "@/Components/CookieConsent";
import Breadcrumb from "@/Components/BreadcrumbHome";
import axios from "axios";
import ProductCard from "@/Components/ProductCard";

/* --------------------------- Skeletons (unchanged) --------------------------- */
const imgFallback = "/images/default.png";
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

/* ------------------------------ Helpers ------------------------------ */
const formatMoney = (num) =>
    (typeof num === "number" ? num : Number(num || 0)).toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
const safeImg = (url) => (url && typeof url === "string" ? url : imgFallback);
const toSlug = (str = "") =>
    str.toString().trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");

/* --------------------------- Lightbox Modal (unchanged) --------------------------- */
const Lightbox = ({ images = [], startIndex = 0, onClose }) => {
    const [idx, setIdx] = useState(startIndex);
    useEffect(() => {
        const prev = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        const onKey = (e) => {
            if (e.key === "Escape") onClose();
            if (e.key === "ArrowRight") setIdx((i) => (i + 1) % images.length);
            if (e.key === "ArrowLeft") setIdx((i) => (i - 1 + images.length) % images.length);
        };
        window.addEventListener("keydown", onKey);
        return () => {
            document.body.style.overflow = prev;
            window.removeEventListener("keydown", onKey);
        };
    }, [images.length, onClose]);
    if (!images.length) return null;

    return (
        <div className="tw-fixed tw-inset-0 tw-z-50 tw-bg-black/70 tw-flex tw-items-center tw-justify-center">
            <button className="tw-absolute tw-top-4 tw-right-4 tw-p-2 tw-rounded-xl tw-bg-white/90" onClick={onClose}>
                <Icon icon="mdi:close" className="tw-text-2xl" />
            </button>
            <button
                aria-label="Previous"
                className="tw-absolute tw-left-4 tw-p-3 tw-rounded-full tw-bg-white/80 hover:tw-bg-white"
                onClick={() => setIdx((i) => (i - 1 + images.length) % images.length)}
            >
                <Icon icon="mdi:chevron-left" className="tw-text-2xl" />
            </button>
            <img
                src={safeImg(images[idx]?.image_url || images[idx])}
                alt={`Image ${idx + 1}`}
                className="tw-max-h-[85vh] tw-max-w-[90vw] tw-object-contain tw-rounded-xl tw-shadow-2xl"
            />
            <button
                aria-label="Next"
                className="tw-absolute tw-right-4 tw-p-3 tw-rounded-full tw-bg-white/80 hover:tw-bg-white"
                onClick={() => setIdx((i) => (i + 1) % images.length)}
            >
                <Icon icon="mdi:chevron-right" className="tw-text-2xl" />
            </button>
        </div>
    );
};

// Masonry card for a single design (natural aspect ratio)
const DesignCard = ({ d, i, onPreview }) => {
    const [loaded, setLoaded] = React.useState(false);

    return (
        <figure
            className="tw-inline-block tw-w-full tw-mb-4 tw-rounded-2xl tw-overflow-hidden tw-border tw-border-gray-200 dark:tw-border-gray-800 tw-bg-white tw-relative tw-group tw-break-inside-avoid"
            title={d?.name || "Design"}
        >
            {/* Image keeps natural ratio: width 100%, height auto */}
            <img
                src={safeImg(d?.image_url)}
                alt={d?.name || "Design"}
                loading="lazy"
                onLoad={() => setLoaded(true)}
                className="tw-block tw-w-full tw-h-auto"
            />
            {!loaded && (
                <div className="tw-absolute tw-inset-0 tw-bg-gray-100 dark:tw-bg-gray-800 tw-animate-pulse" />
            )}

            {/* Top-right preview button (shows on hover / always on touch) */}
            <button
                type="button"
                onClick={() => onPreview(i)}
                className="tw-absolute tw-top-2 tw-right-2 tw-p-2 tw-rounded-xl tw-bg-white/80 hover:tw-bg-white tw-shadow tw-backdrop-blur-sm"
                aria-label="Preview design"
            >
                <Icon icon="mdi:magnify-plus-outline" className="tw-text-lg" />
            </button>

            {/* Bottom gradient caption (Unsplash-style) */}
            <figcaption className="tw-pointer-events-none tw-absolute tw-inset-x-0 tw-bottom-0 tw-px-3 tw-py-2 tw-flex tw-items-center tw-justify-between tw-text-white tw-text-xs tw-bg-gradient-to-t tw-from-black/80 tw-to-transparent">
                <span className="tw-truncate tw-font-medium">
                    {d?.name || "Untitled"}
                </span>
                {(d?.width || d?.height) && (
                    <span className="tw-ml-2 tw-shrink-0 tw-opacity-90">
                        {(d?.width ?? "—")}×{(d?.height ?? "—")}
                    </span>
                )}
            </figcaption>
        </figure>
    );
};


/* ------------------------------- Main Page -------------------------------- */
export default function ProductDetails({ product, similarProducts = [], seo }) {
    const [pageReady, setPageReady] = useState(false);
    const [activeIndex, setActiveIndex] = useState(0);
    const [lightboxOpen, setLightboxOpen] = useState(false);

    // pricing state
    const [quantity, setQuantity] = useState(1);
    const [sizeUnit, setSizeUnit] = useState("in"); // 'in' or 'ft'
    const [width, setWidth] = useState("");
    const [height, setHeight] = useState("");

    const [selectedOptions, setSelectedOptions] = useState({});
    const [imgLoading, setImgLoading] = useState(true);
    const [descOpen, setDescOpen] = useState(false); // NEW: collapsible description on mobile

    useEffect(() => {
        const t = setTimeout(() => setPageReady(true), 250);
        return () => clearTimeout(t);
    }, []);

    if (!product) {
        return (
            <div className="tw-container tw-mx-auto tw-px-4 tw-py-14">
                <Head title="Product not found" />
                <p className="tw-text-center tw-text-gray-600">Product not found.</p>
            </div>
        );
    }

    const images = product?.images || [];
    const activeImage = images[activeIndex]?.image_url ?? imgFallback;

    /* ------------------------------- Price Calc ------------------------------- */
    const computed = useMemo(() => {
        if (!product) return { total: 0, area: 0 };

        if (product.pricing_method === "roll") {
            const pricePerSqft = Number(product.price_per_sqft || 0);
            const w = Number(width || 0);
            const h = Number(height || 0);
            if (!pricePerSqft || !w || !h) return { total: 0, area: 0 };

            const wFeet = sizeUnit === "in" ? (w / 12) : w;
            const hFeet = sizeUnit === "in" ? (h / 12) : h;
            const area = Math.max(wFeet * hFeet, 0);
            const unit = area * pricePerSqft;
            const total = Math.max(unit, 0) * Math.max(Number(quantity || 1), 1);
            return { total, area };
        }

        // STANDARD PRICING → use product.price (not base_price)
        const unit = Number(product.price || 0);
        const total = Math.max(unit, 0) * Math.max(Number(quantity || 1), 1);
        return { total, area: 0 };
    }, [product, width, height, sizeUnit, quantity]);


    const isRoll = product.pricing_method === "roll";
    const hasSize = Number(width) > 0 && Number(height) > 0;
    const rollNeedsSize = isRoll && computed.total === 0;

    const changeQuantity = (delta) => setQuantity((q) => Math.max(1, Number(q || 1) + delta));
    const handleSelectThumb = (i) => { setActiveIndex(i); setImgLoading(true); };
    const handleAddToQuote = () => { /* router.post(...) */ };

    /* ------------------------------ Meta ------------------------------ */
    const slug = toSlug(product?.name || "");
    const canonical = `https://printair.lk/public/${product?.id}/product/${slug}`;
    const buildKeywords = (p) => {
        const base = ["Printair", "digital printing Sri Lanka", "premium printing", "fast printing", "custom printing"];
        const cats = (p?.categories || []).map((c) => c.name);
        const tags = (p?.tags || []).map((t) => t.name);
        const extras = [p?.name, p?.pricing_method === "roll" ? "roll based printing" : "standard printing", "banners", "brochures", "business cards", "posters"];
        return [...new Set([...base, ...cats, ...tags, ...extras])].filter(Boolean).join(", ");
    };
    const metaTitle = seo?.title || `${product?.name} | Printair Advertising – Premium Printing in Sri Lanka`;
    const metaDescription =
        seo?.description ||
        (product?.meta_description ? String(product.meta_description).replace(/<[^>]*>/g, "").slice(0, 160)
            : "Order premium quality printing with fast turnaround. Banners, brochures, business cards, posters and more.");
    const metaKeywords = buildKeywords(product);
    const ogImage = safeImg((product?.images && product.images[0]?.image_url) || imgFallback);

    const crumbs = React.useMemo(() => {
        const firstCat = product?.categories?.[0];
        return [
            { label: "Products", href: "/products/all" },
            ...(firstCat ? [{ label: firstCat.name, href: `/products/all?category_id=${firstCat.id}` }] : []),
            { label: product.name, href: null },
        ];
    }, [product]);

    const [fullDescOpen, setFullDescOpen] = useState(false);

    const [designs, setDesigns] = useState([]);
    const [loadingDesigns, setLoadingDesigns] = useState(true);
    const [designErr, setDesignErr] = useState(null);

    const unwrap = (res) =>
        Array.isArray(res?.data) ? res.data :
            Array.isArray(res?.data?.data) ? res.data.data :
                Array.isArray(res) ? res : [];

    useEffect(() => {
        const fetchDesigns = async () => {
            setLoadingDesigns(true);
            setDesignErr(null);
            try {
                const res = await axios.get(`/api/products/${product.id}/designs`, {
                    params: { per_page: 12 }, // tweak as you like
                    headers: { Accept: "application/json" },
                });
                setDesigns(unwrap(res));
            } catch (e) {
                setDesigns([]);
                setDesignErr("Failed to load designs.");
            } finally {
                setLoadingDesigns(false);
            }
        };

        if (product?.id) fetchDesigns();
    }, [product?.id]);


    const [lbImages, setLbImages] = useState([]);
    const [lbIndex, setLbIndex] = useState(0);

    // when opening:
    const openDesignPreview = (index) => {
        setLbImages(designs.map(d => d.image_url));
        setLbIndex(index);
        setLightboxOpen(true);
    };



    return (
        <>
            <Head title={metaTitle} />
            <Meta
                title={metaTitle}
                description={metaDescription}
                url={canonical}
                keywords={metaKeywords}
                canonical={canonical}
                author="Printair Team"
                robots="index, follow"
                image={ogImage}
            />
            <Header />

            {/* NOTE: add bottom padding for sticky CTA on mobile */}
            <div className="tw-container tw-mx-auto tw-px-4 tw-pt-6 md:tw-pt-8 tw-pb-24 md:tw-pb-10">
                <Breadcrumb className="tw-mb-4 md:tw-mb-6" items={crumbs} separator="›" />

                {!pageReady ? (
                    <ProductSkeleton />
                ) : (
                    <div className="tw-grid lg:tw-grid-cols-2 tw-gap-6 md:tw-gap-10">
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
                                <button
                                    type="button"
                                    onClick={() => setLightboxOpen(true)}
                                    className="tw-absolute tw-top-3 tw-right-3 tw-bg-white/80 dark:tw-bg-gray-900/70 tw-backdrop-blur tw-p-2 tw-rounded-xl tw-border tw-border-gray-200 dark:tw-border-gray-700"
                                    aria-label="Open full view"
                                >
                                    <Icon icon="mdi:magnify-plus" className="tw-text-xl" />
                                </button>
                                {isRoll && (
                                    <span className="tw-absolute tw-top-3 tw-left-3 tw-text-[11px] tw-font-medium tw-bg-black/80 tw-text-white tw-rounded-full tw-px-2 tw-py-1">
                                        Per sq.ft
                                    </span>
                                )}
                            </div>

                            {/* Thumbs: horizontal scroll on mobile, grid on md+ */}
                            <div className="tw-mt-3 md:tw-mt-4">
                                {/* mobile */}
                                <div className="md:tw-hidden tw-flex tw-gap-2 tw-overflow-x-auto tw-py-1">
                                    {(images.length ? images : [{ image_url: imgFallback }]).slice(0, 10).map((img, i) => {
                                        const active = i === activeIndex;
                                        return (
                                            <button
                                                key={i}
                                                type="button"
                                                onClick={() => handleSelectThumb(i)}
                                                className={`tw-relative tw-w-16 tw-h-16 tw-rounded-xl tw-overflow-hidden tw-flex-none tw-border ${active ? "tw-border-[#f44032]" : "tw-border-gray-200 dark:tw-border-gray-800"
                                                    }`}
                                                aria-label={`Image ${i + 1}`}
                                            >
                                                <img src={safeImg(img.image_url)} alt={`${product.name} ${i + 1}`} className="tw-w-full tw-h-full tw-object-cover" />
                                            </button>
                                        );
                                    })}
                                </div>
                                {/* desktop */}
                                <div className="tw-hidden md:tw-grid md:tw-grid-cols-5 tw-gap-3">
                                    {(images.length ? images : [{ image_url: imgFallback }]).slice(0, 5).map((img, i) => {
                                        const active = i === activeIndex;
                                        return (
                                            <button
                                                key={i}
                                                type="button"
                                                onClick={() => handleSelectThumb(i)}
                                                className={`tw-relative tw-rounded-xl tw-overflow-hidden tw-border ${active ? "tw-border-[#f44032]" : "tw-border-gray-200 dark:tw-border-gray-800"}`}
                                            >
                                                <img src={safeImg(img.image_url)} alt={`${product.name} ${i + 1}`} className="tw-w-full tw-aspect-square tw-object-cover" />
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </section>

                        {/* ---------------------------- Right Column ---------------------------- */}
                        <section>
                            {/* Title: smaller on mobile */}
                            <h1 className="tw-text-xl md:tw-text-3xl tw-font-bold tw-leading-snug md:tw-leading-[1.25] tw-tracking-tight tw-break-words tw-max-w-[40ch]">
                                {product.name}
                            </h1>

                            {/* Price block: avoid 0.00 for roll until size is set */}
                            <div className="tw-mt-2 tw-flex tw-items-center tw-gap-3">
                                <span className="tw-text-lg md:tw-text-xl tw-font-semibold tw-text-[#f44032]">
                                    {isRoll
                                        ? (hasSize ? <>Rs. {formatMoney(computed.total)}</> : <>Enter size to see price</>)
                                        : <>Rs. {formatMoney(computed.total || product.price)}</>}
                                </span>
                                {isRoll && product.price_per_sqft && (
                                    <span className="tw-text-sm tw-text-gray-500">({formatMoney(product.price_per_sqft)} / sq.ft)</span>
                                )}
                            </div>

                            {/* Categories (your improved version) */}
                            {product.categories?.length > 0 && (
                                <div className="tw-mt-4">
                                    <div className="tw-flex tw-items-center tw-gap-2 tw-mb-2">
                                        <Icon icon="mdi:tag-multiple-outline" className="tw-text-lg tw-text-gray-500" />
                                        <h6 className="tw-text-sm tw-font-semibold tw-text-gray-800">Categories</h6>
                                        <span className="tw-text-xs tw-text-gray-500">Tap a category to see related items</span>
                                    </div>
                                    <ul className="tw-flex tw-flex-wrap tw-gap-2" role="list">
                                        {product.categories.map((c) => (
                                            <li key={c.id}>
                                                <Link
                                                    href={`/products/all?category_id=${c.id}`}
                                                    className="tw-group tw-inline-flex tw-items-center tw-gap-1.5 tw-text-xs tw-font-medium tw-px-3 tw-py-1.5 tw-rounded-full tw-border tw-border-gray-200 tw-bg-white tw-text-gray-700 hover:tw-border-[#f44032] hover:tw-text-[#f44032] dark:tw-bg-gray-900 dark:tw-border-gray-700"
                                                    title={`See more ${c.name}`}
                                                    aria-label={`See more "${c.name}" products`}
                                                >
                                                    <Icon icon="mdi:tag-outline" className="tw-text-sm tw-opacity-70 group-hover:tw-opacity-100" />
                                                    {c.name}
                                                </Link>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {/* Description: collapsible on mobile */}
                            <div className="tw-prose dark:tw-prose-invert tw-max-w-none tw-mt-5 tw-text-gray-700 dark:tw-text-gray-200">
                                <div
                                    className={`md:tw-line-clamp-none ${descOpen ? "" : "tw-line-clamp-6 md:tw-line-clamp-none"}`}
                                    dangerouslySetInnerHTML={{ __html: product.meta_description || "" }}
                                />
                                <div className="md:tw-hidden tw-mt-2">
                                    <button
                                        type="button"
                                        onClick={() => setDescOpen((v) => !v)}
                                        className="tw-text-sm tw-underline tw-text-gray-600 hover:tw-text-[#f44032]"
                                    >
                                        {descOpen ? "Show less" : "Read more"}
                                    </button>
                                </div>
                            </div>

                            {/* Variants (unchanged logic) */}
                            {Array.isArray(product.variants) && product.variants.length > 0 && (
                                <div className="tw-mt-6 tw-space-y-4">
                                    {product.variants.map((v) => (
                                        <div key={v.id} className="tw-space-y-2">
                                            <label className="tw-text-sm tw-font-medium">{v.name}</label>
                                            <div className="tw-flex tw-flex-wrap tw-gap-2">
                                                {Array.isArray(v.options) &&
                                                    v.options.map((opt) => {
                                                        const active = selectedOptions[v.name] === opt.value;
                                                        return (
                                                            <button
                                                                key={opt.id ?? opt.value}
                                                                type="button"
                                                                onClick={() => setSelectedOptions((prev) => ({ ...prev, [v.name]: opt.value }))}
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

                            {/* Pricing Controls: stacked & larger tap targets on mobile */}
                            <div className="tw-mt-6">
                                {isRoll ? (
                                    <div className="tw-space-y-2 tw-min-w-0">
                                        <label className="tw-text-sm tw-font-medium">Size</label>

                                        {/* Ensure children can shrink inside the column */}
                                        <div className="tw-flex tw-min-w-0 tw-flex-wrap md:tw-flex-nowrap tw-items-stretch tw-gap-2">
                                            <input
                                                type="number"
                                                inputMode="decimal"
                                                min="0"
                                                step="0.1"
                                                value={width}
                                                onChange={(e) => setWidth(e.target.value)}
                                                className="tw-basis-0 tw-flex-1 tw-min-w-0 tw-h-12 tw-border tw-rounded-xl tw-px-3 dark:tw-bg-gray-900 dark:tw-border-gray-700"
                                                placeholder={`Width (${sizeUnit})`}
                                            />
                                            <input
                                                type="number"
                                                inputMode="decimal"
                                                min="0"
                                                step="0.1"
                                                value={height}
                                                onChange={(e) => setHeight(e.target.value)}
                                                className="tw-basis-0 tw-flex-1 tw-min-w-0 tw-h-12 tw-border tw-rounded-xl tw-px-3 dark:tw-bg-gray-900 dark:tw-border-gray-700"
                                                placeholder={`Height (${sizeUnit})`}
                                            />

                                            {/* Segmented unit: fixed width so it never pushes into the next column */}
                                            <div className="tw-inline-flex tw-h-12 tw-rounded-xl tw-border tw-overflow-hidden tw-flex-none tw-w-[92px] md:tw-w-[96px] tw-whitespace-nowrap dark:tw-border-gray-700">
                                                <button
                                                    type="button"
                                                    aria-pressed={sizeUnit === 'in'}
                                                    onClick={() => setSizeUnit('in')}
                                                    className={`tw-flex-1 tw-h-full tw-px-3 tw-text-sm tw-font-medium ${sizeUnit === 'in' ? 'tw-bg-black tw-text-white' : 'tw-bg-white tw-text-gray-700'
                                                        }`}
                                                >
                                                    in
                                                </button>
                                                <div className="tw-w-px tw-bg-gray-200 dark:tw-bg-gray-700" />
                                                <button
                                                    type="button"
                                                    aria-pressed={sizeUnit === 'ft'}
                                                    onClick={() => setSizeUnit('ft')}
                                                    className={`tw-flex-1 tw-h-full tw-px-3 tw-text-sm tw-font-medium ${sizeUnit === 'ft' ? 'tw-bg-black tw-text-white' : 'tw-bg-white tw-text-gray-700'
                                                        }`}
                                                >
                                                    ft
                                                </button>
                                            </div>
                                        </div>

                                        <p className="tw-text-xs tw-text-gray-500">
                                            Area = W × H → sq.ft pricing
                                            {computed.area > 0 && (
                                                <span className="tw-text-gray-800"> (≈ {formatMoney(computed.area)} sq.ft)</span>
                                            )}
                                        </p>
                                    </div>
                                ) : (
                                    <div />
                                )}

                                {/* Quantity */}
                                <div className="tw-space-y-2">
                                    <label className="tw-text-sm tw-font-medium">Quantity</label>

                                    <div className="tw-inline-flex tw-items-stretch tw-h-12 tw-rounded-xl tw-border tw-overflow-hidden tw-bg-white dark:tw-bg-gray-900 dark:tw-border-gray-700">
                                        <button
                                            type="button"
                                            onClick={() => changeQuantity(-1)}
                                            aria-label="Decrease quantity"
                                            disabled={quantity <= 1}
                                            className="tw-w-12 tw-grid tw-place-content-center hover:tw-bg-gray-50 dark:hover:tw-bg-gray-800 disabled:tw-opacity-40"
                                        >
                                            <Icon icon="mdi:minus" />
                                        </button>

                                        <span aria-hidden className="tw-w-px tw-bg-gray-200 dark:tw-bg-gray-700" />

                                        <input
                                            type="number"
                                            min="1"
                                            inputMode="numeric"
                                            pattern="[0-9]*"
                                            value={quantity}
                                            onChange={(e) => {
                                                const v = e.target.value.replace(/\D/g, '');
                                                setQuantity(Math.max(1, Number(v || 1)));
                                            }}
                                            onBlur={(e) => {
                                                if (!e.target.value || Number(e.target.value) < 1) setQuantity(1);
                                            }}
                                            className="tw-w-24 md:tw-w-28 tw-text-center tw-border-0 tw-outline-none tw-bg-transparent focus:tw-ring-0 tw-text-base tw-font-medium"
                                            aria-live="polite"
                                        />

                                        <span aria-hidden className="tw-w-px tw-bg-gray-200 dark:tw-bg-gray-700" />

                                        <button
                                            type="button"
                                            onClick={() => changeQuantity(1)}
                                            aria-label="Increase quantity"
                                            className="tw-w-12 tw-grid tw-place-content-center hover:tw-bg-gray-50 dark:hover:tw-bg-gray-800"
                                        >
                                            <Icon icon="mdi:plus" />
                                        </button>
                                    </div>

                                    <p className="tw-text-[11px] tw-text-gray-500">Tip: you can also type a number</p>
                                </div>

                            </div>

                            {/* CTA: full-width on mobile */}
                            <div className="tw-mt-6 tw-flex tw-flex-col md:tw-flex-row tw-gap-3 tw-items-stretch md:tw-items-center">
                                <button
                                    type="button"
                                    onClick={handleAddToQuote}
                                    disabled={rollNeedsSize}
                                    className={`tw-w-full md:tw-w-auto tw-inline-flex tw-justify-center tw-items-center tw-gap-2 tw-font-semibold tw-px-5 tw-py-3 tw-rounded-2xl tw-transition ${rollNeedsSize ? "tw-bg-gray-300 tw-text-gray-500 cursor-not-allowed" : "tw-bg-[#f44032] tw-text-white hover:tw-scale-[1.01]"
                                        }`}
                                >
                                    <Icon icon="mdi:cart-outline" className="tw-text-xl" />
                                    Add to Quote
                                </button>

                                <div className="md:tw-ml-2 tw-flex tw-justify-center md:tw-justify-start tw-items-center tw-gap-2 tw-text-gray-600">
                                    <Icon icon="mdi:cash-multiple" className="tw-text-xl" />
                                    <span className="tw-text-sm">
                                        Current total: Rs. {formatMoney(computed.total)}
                                        {isRoll && computed.area > 0 && <span className="tw-text-xs tw-text-gray-500">  •  {formatMoney(computed.area)} sq.ft</span>}
                                    </span>
                                </div>
                            </div>
                            {isRoll && (
                                <div
                                    role="alert"
                                    aria-live="polite"
                                    className="tw-mt-3 tw-rounded-xl tw-border tw-border-amber-300 tw-bg-amber-50 tw-text-amber-900 tw-p-4 tw-flex tw-gap-3"
                                >
                                    <Icon icon="mdi:alert-circle-outline" className="tw-text-2xl tw-flex-shrink-0 tw-mt-0.5" />
                                    <div>
                                        <p className="tw-font-semibold">Price shown is an estimate</p>
                                        <p className="tw-text-sm tw-leading-relaxed">
                                            This is a roll-based product. The final total may vary <span className="tw-font-medium">up or down</span> after we
                                            verify the exact size and finishing.
                                        </p>
                                        <ul className="tw-mt-2 tw-text-xs tw-leading-5 tw-list-disc tw-ps-5">
                                            <li>Usable print area after trimming</li>
                                            <li>Material/lamination & finishing options</li>
                                            <li>Special cutting, heavy ink coverage, or urgency</li>
                                        </ul>
                                        <p className="tw-text-xs tw-mt-2">
                                            We’ll review your order and <span className="tw-font-medium">call you as soon as possible</span> to confirm the final price before we proceed.
                                        </p>
                                    </div>
                                </div>
                            )}


                            {/* Tags */}
                            {product.tags?.length > 0 && (
                                <div className="tw-mt-6">
                                    {/* Header + helper */}
                                    <div className="tw-flex tw-items-center tw-gap-2 tw-mb-2">
                                        <Icon icon="mdi:label-multiple-outline" className="tw-text-lg tw-text-gray-500" />
                                        <h6 className="tw-text-sm tw-font-semibold tw-text-gray-800">Tags</h6>
                                        <span className="tw-text-xs tw-text-gray-500">Tap a tag to see related items</span>
                                    </div>

                                    {/* Clickable chips */}
                                    <ul className="tw-flex tw-flex-wrap tw-gap-2" role="list">
                                        {product.tags.map((t) => (
                                            <li key={t.id}>
                                                <Link
                                                    href={`/products/all?q=${encodeURIComponent(t.name)}`}
                                                    className="tw-group tw-inline-flex tw-items-center tw-gap-1.5 tw-text-xs tw-font-medium tw-px-3 tw-py-1.5 tw-rounded-full
                       tw-border tw-border-[#f44032]/20 tw-bg-[#f44032]/5 tw-text-[#f44032]
                       hover:tw-bg-[#f44032]/10 dark:tw-border-[#f44032]/30"
                                                    title={`Search for ${t.name}`}
                                                    aria-label={`Search for ${t.name}`}
                                                >
                                                    <Icon icon="mdi:tag-outline" className="tw-text-sm tw-opacity-80 group-hover:tw-opacity-100" />
                                                    {t.name}
                                                </Link>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                        </section>
                    </div >
                )
                }
                {/* Description */}
                {product?.description && (
                    <section id="product-description" className="tw-mt-10 md:tw-mt-12">
                        <h4 className="tw-text-xl md:tw-text-2xl tw-font-bold tw-mb-3">Description</h4>

                        {/* Preview/Expanded container */}
                        <div className="tw-relative">
                            {/* Content: clamp when collapsed */}
                            <div
                                className={`tw-prose dark:tw-prose-invert tw-max-w-none tw-text-gray-700 dark:tw-text-gray-200 ${fullDescOpen ? "" : "tw-line-clamp-6"
                                    }`}
                                dangerouslySetInnerHTML={{ __html: product.description }}
                            />

                            {/* Fade at bottom only when collapsed */}
                            {!fullDescOpen && (
                                <div className="tw-pointer-events-none tw-absolute tw-inset-x-0 tw-bottom-0 tw-h-16 tw-bg-gradient-to-t tw-from-white dark:tw-from-gray-900 tw-to-transparent" />
                            )}
                        </div>

                        {/* Toggle button */}
                        <div className="tw-mt-3">
                            <button
                                type="button"
                                aria-expanded={fullDescOpen}
                                onClick={() => setFullDescOpen((v) => !v)}
                                className="tw-inline-flex tw-items-center tw-gap-2 tw-rounded-full tw-px-4 tw-py-2 tw-text-sm tw-font-semibold
                   tw-border tw-border-gray-200 tw-bg-white tw-text-gray-800 hover:tw-bg-gray-50
                   dark:tw-bg-gray-900 dark:tw-border-gray-700"
                            >
                                {fullDescOpen ? (
                                    <>
                                        <Icon icon="mdi:chevron-up" className="tw-text-base" />
                                        Show less
                                    </>
                                ) : (
                                    <>
                                        <Icon icon="mdi:chevron-down" className="tw-text-base" />
                                        Read more
                                    </>
                                )}
                            </button>
                        </div>
                    </section>
                )}


                {/* ---------- Designs (accordion, shows ALL) ---------- */}
                {(!loadingDesigns && designs.length === 0) ? null : (
                    <section id="product-designs" className="tw-mt-10 md:tw-mt-12">
                        <details
                            className="group tw-rounded-2xl tw-border tw-border-gray-200 dark:tw-border-gray-800 tw-bg-white dark:tw:bg-gray-900"
                            // auto-open if there are very few items
                            open={designs.length > 0 && designs.length <= 4}
                        >
                            <summary className="tw-cursor-pointer tw-select-none tw-list-none tw-flex tw-items-center tw-justify-between tw-gap-3 tw-px-4 tw-py-3 md:tw-px-5 md:tw-py-4">
                                <div className="tw-flex tw-items-center tw-gap-2">
                                    <Icon icon="mdi:palette-outline" className="tw-text-xl tw-text-gray-500" />
                                    <h4 className="tw-text-base md:tw-text-lg tw-font-bold">Designs for this product</h4>
                                    {designs.length > 0 && (
                                        <span className="tw-text-xs tw-text-gray-500">({designs.length})</span>
                                    )}
                                </div>
                                <Icon
                                    icon="mdi:chevron-down"
                                    className="tw-transition group-open:tw-rotate-180 tw-text-xl tw-text-gray-500"
                                />
                            </summary>

                            <div className="tw-px-4 tw-pb-4 md:tw-px-5 md:tw-pb-5">
                                {designErr && (
                                    <div className="tw-rounded-xl tw-border tw-border-amber-300 tw-bg-amber-50 tw-text-amber-900 tw-p-3 tw-text-sm tw-mb-3">
                                        {designErr}
                                    </div>
                                )}

                                {loadingDesigns ? (
                                    <div className="tw-grid tw-grid-cols-2 md:tw-grid-cols-4 lg:tw-grid-cols-5 tw-gap-4">
                                        {[...Array(8)].map((_, i) => (
                                            <div key={i} className="tw-rounded-2xl tw-border tw-border-gray-200 tw-overflow-hidden">
                                                <div className="tw-aspect-[4/3] tw-bg-gray-200 tw-animate-pulse" />
                                                <div className="tw-p-3">
                                                    <div className="tw-h-3 tw-w-3/4 tw-bg-gray-200 tw-rounded tw-animate-pulse" />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    designs.length > 0 && (
                                        <div className="tw-columns-2 sm:tw-columns-3 lg:tw-columns-4 tw-gap-4">
                                            {designs.map((d, i) => (
                                                <DesignCard key={d.id || i} d={d} i={i} onPreview={openDesignPreview} />
                                            ))}
                                        </div>
                                    )
                                )}
                            </div>
                        </details>
                    </section>
                )}


                {/* Similar Products (unchanged except tighter gaps on mobile) */}
                <section className="tw-mt-12 md:tw-mt-14">
                    <div className="tw-flex tw-items-center tw-justify-between tw-mb-4">
                        <h3 className="tw-text-xl tw-font-bold">You might also like</h3>
                        <Link href="/products/all" className="tw-text-sm tw-text-[#f44032] hover:tw-underline">View all</Link>
                    </div>

                    {!pageReady ? (
                        <div className="tw-grid sm:tw-grid-cols-2 md:tw-grid-cols-3 lg:tw-grid-cols-4 tw-gap-4 md:tw-gap-6">
                            {Array.from({ length: 8 }).map((_, i) => <CardSkeleton key={i} />)}
                        </div>
                    ) : similarProducts?.length ? (
                        <div className="tw-grid grid-cols-2 sm:tw-grid-cols-2 md:tw-grid-cols-3 lg:tw-grid-cols-4 tw-gap-4 md:tw-gap-6">
                            {similarProducts.map((sp) => (

                                <ProductCard
                                    product={sp}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="tw-text-gray-500">No related products available.</div>
                    )}
                </section>
            </div >

            {/* Sticky mobile CTA bar (space already reserved via pb-24) */}
            < div className="md:tw-hidden tw-fixed tw-bottom-0 tw-inset-x-0 tw-z-40 tw-bg-white tw-border-t tw-border-gray-200 tw-p-3" >
                <div className="tw-container tw-mx-auto tw-flex tw-items-center tw-gap-2">
                    <div className="tw-flex-1 tw-text-xs tw-text-gray-600">
                        Total: <span className="tw-font-semibold tw-text-gray-800">Rs. {formatMoney(computed.total)}</span>
                        {isRoll && computed.area > 0 && <span className="tw-text-[11px] tw-text-gray-500">  •  {formatMoney(computed.area)} sq.ft</span>}
                    </div>
                    <button
                        onClick={handleAddToQuote}
                        disabled={rollNeedsSize}
                        className={`tw-flex-1 tw-inline-flex tw-justify-center tw-items-center tw-gap-2 tw-h-11 tw-rounded-full tw-font-semibold tw-text-sm tw-shadow-sm ${rollNeedsSize ? "tw-bg-gray-300 tw-text-gray-500" : "tw-bg-[#f44032] tw-text-white"
                            }`}
                    >
                        <Icon icon="mdi:cart-outline" className="tw-text-lg" />
                        Add to Quote
                    </button>
                </div>
            </div >

            {lightboxOpen && (
                <Lightbox
                    images={images.length ? images : [activeImage]}
                    startIndex={activeIndex}
                    onClose={() => setLightboxOpen(false)}
                />
            )}

            <CookieConsent />
            <Footer />
        </>
    );
}
