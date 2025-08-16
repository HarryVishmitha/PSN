import React, { useEffect, useMemo, useState, useRef } from "react";
import { Head, Link } from "@inertiajs/react";
import { Icon } from "@iconify/react";
import Footer from "@/Components/Footer";
import Meta from "@/Components/Metaheads";
import Header from "@/Components/Header";
import CookieConsent from "@/Components/CookieConsent";
import Breadcrumb from "@/Components/BreadcrumbHome";
import axios from "axios";
import ProductCard from "@/Components/ProductCard";
import DesignSelector from "@/Components/DesignSelector";

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
                className="tw-max-h-[85vh] tw-max-w-[90vw] tw-object-contain tw-rounded-xl tw-shadow-2xl tw-select-none"
                draggable={false}
                onContextMenu={(e) => e.preventDefault()}
                onDragStart={(e) => e.preventDefault()}
                style={{ WebkitTouchCallout: 'none', userSelect: 'none' }}
            />
            <div
                aria-hidden
                className="tw-absolute tw-inset-0 tw-pointer-events-none tw-opacity-35"
                style={{
                    backgroundImage: `url("data:image/svg+xml;utf8,${encodeURIComponent(
                        `<svg xmlns='http://www.w3.org/2000/svg' width='260' height='200'>
        <text x='0' y='140' font-size='36' font-family='sans-serif'
              fill='rgba(255,255,255,0.65)' transform='rotate(-25 130 100)'>
          PRINTAIR • SAMPLE
        </text>
      </svg>`
                    )}")`,
                    backgroundRepeat: 'repeat',
                    backgroundSize: '260px 200px'
                }}
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
const DesignCard = ({ d, i, onPreview, isSelected, onSelect }) => {
    const [loaded, setLoaded] = React.useState(false);

    return (
        <figure
            className={[
                "tw-inline-block tw-w-full tw-mb-4 tw-rounded-2xl tw-overflow-hidden",
                "tw-border tw-bg-white tw-relative tw-group tw-break-inside-avoid",
                isSelected ? "tw-border-[#f44032] tw-ring-2 tw-ring-[#f44032]/30"
                    : "tw-border-gray-200 dark:tw-border-gray-800",
            ].join(" ")}
            title={d?.name || "Design"}
            aria-selected={!!isSelected}
        >
            <img
                src={safeImg(d?.image_url)}
                alt={d?.name || "Design"}
                loading="lazy"
                onLoad={() => setLoaded(true)}
                className="tw-block tw-w-full tw-h-auto tw-select-none"
                draggable={false}
                onContextMenu={(e) => e.preventDefault()}
                onDragStart={(e) => e.preventDefault()}
                style={{ WebkitTouchCallout: 'none', userSelect: 'none' }}
            />
            {!loaded && <div className="tw-absolute tw-inset-0 tw-bg-gray-100 dark:tw-bg-gray-800 tw-animate-pulse" />}

            {/* Preview */}
            <button
                type="button"
                onClick={() => onPreview(i)}
                className="tw-absolute tw-top-2 tw-right-2 tw-p-2 tw-rounded-xl tw-bg-white/80 hover:tw-bg-white tw-shadow tw-backdrop-blur-sm"
                aria-label="Preview design"
            >
                <Icon icon="mdi:magnify-plus-outline" className="tw-text-lg" />
            </button>

            {/* Select / Selected (ensure above gradient) */}
            <button
                type="button"
                onClick={() => onSelect?.(d)}
                className={[
                    "tw-absolute tw-bottom-2 tw-right-2 tw-rounded-xl tw-px-3 tw-py-1.5 tw-text-xs tw-font-semibold tw-shadow tw-z-10",
                    isSelected ? "tw-bg-[#f44032] tw-text-white"
                        : "tw-bg-white/90 hover:tw-bg-white tw-text-gray-800",
                ].join(" ")}
                aria-pressed={!!isSelected}
            >
                {isSelected ? "Selected" : "Select"}
            </button>

            <div
                aria-hidden
                className="tw-absolute tw-inset-0 tw-pointer-events-none tw-opacity-35 tw-mix-blend-multiply"
                style={{
                    backgroundImage: `url("data:image/svg+xml;utf8,${encodeURIComponent(
                        `<svg xmlns='http://www.w3.org/2000/svg' width='220' height='160'>
        <text x='0' y='120' font-size='28' font-family='sans-serif'
              fill='rgba(255,255,255,0.7)' transform='rotate(-25 110 80)'>
          PRINTAIR • SAMPLE
        </text>
      </svg>`
                    )}")`,
                    backgroundRepeat: 'repeat',
                    backgroundSize: '220px 160px'
                }}
            />

            {/* Caption gradient (pointer-events none, under the pill) */}
            <figcaption className="tw-pointer-events-none tw-absolute tw-inset-x-0 tw-bottom-0 tw-px-3 tw-py-2 tw-flex tw-items-center tw-justify-between tw-text-white tw-text-xs tw-bg-gradient-to-t tw-from-black/80 tw-to-transparent">
                <span className="tw-truncate tw-font-medium tw-text-center">{d?.name || "Untitled"} <br /> {(d?.width || d?.height) && (
                    <span className="tw-ml-2 tw-shrink-0 tw-opacity-90">{(d?.width ?? "—")} in ×{(d?.height ?? "—")} in</span>
                )}</span>
                {/* {(d?.width || d?.height) && (
                    <span className="tw-ml-2 tw-shrink-0 tw-opacity-90">{(d?.width ?? "—")}×{(d?.height ?? "—")}</span>
                )} */}
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

    // design choice coming from <DesignSelector />
    const [selectedDesign, setSelectedDesign] = useState(null);


    // CART states
    const [cartBusy, setCartBusy] = useState(false);
    const [cartAdded, setCartAdded] = useState(false);
    const [cartMsg, setCartMsg] = useState(null);
    const [cartErr, setCartErr] = useState(null);

    // QUOTE states
    const [quoteBusy, setQuoteBusy] = useState(false);
    const [quoteRequested, setQuoteRequested] = useState(false);
    const [quoteMsg, setQuoteMsg] = useState(null);
    const [quoteErr, setQuoteErr] = useState(null);

    // 'gallery' | 'file' | 'link' | 'hire' | null
    const [designSource, setDesignSource] = useState(null);



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

    const chooseVariant = (groupName, opt) => {
        setSelectedOptions(prev => ({
            ...prev,
            [groupName]: { id: opt.id, value: opt.value, sub: {} }, // reset subs when parent changes
        }));
    };

    const chooseSubvariant = (groupName, subGroupName, opt) => {
        setSelectedOptions(prev => ({
            ...prev,
            [groupName]: {
                ...(prev[groupName] || {}),
                sub: {
                    ...((prev[groupName] || {}).sub || {}),
                    [subGroupName]: { id: opt.id, value: opt.value },
                }
            }
        }));
    };

    const images = product?.images || [];
    const activeImage = images[activeIndex]?.image_url ?? imgFallback;

    const variantAdj = useMemo(() => {
        if (!Array.isArray(product?.variants)) return 0;
        let adj = 0;

        for (const group of product.variants) {
            const pick = selectedOptions[group.name];
            if (!pick) continue;

            const parent = (group.options || []).find(o => o.value === pick.value || o.id === pick.id);
            if (parent?.price_adjustment) adj += Number(parent.price_adjustment || 0);

            if (parent?.subgroups && pick.sub) {
                for (const sg of parent.subgroups) {
                    const chosen = pick.sub[sg.name];
                    if (!chosen) continue;
                    const subOpt = (sg.options || []).find(o => o.value === chosen.value || o.id === chosen.id);
                    if (subOpt?.price_adjustment) adj += Number(subOpt.price_adjustment || 0);
                }
            }
        }
        return adj;
    }, [product?.variants, selectedOptions]);


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
            // base per-unit price is area * rate, then add variant adjustments (per unit)
            const unit = Math.max(area * pricePerSqft + Number(variantAdj || 0), 0);
            const total = unit * Math.max(Number(quantity || 1), 1);
            return { total, area };
        }

        // STANDARD
        const unitBase = Number(product.price || 0);
        const unit = Math.max(unitBase + Number(variantAdj || 0), 0);
        const total = unit * Math.max(Number(quantity || 1), 1);
        return { total, area: 0 };
    }, [product, width, height, sizeUnit, quantity, variantAdj]);



    const isRoll = product.pricing_method === "roll";
    const hasSize = Number(width) > 0 && Number(height) > 0;
    const rollNeedsSize = isRoll && computed.total === 0;

    const changeQuantity = (delta) => setQuantity((q) => Math.max(1, Number(q || 1) + delta));
    const handleSelectThumb = (i) => { setActiveIndex(i); setImgLoading(true); };

    const buildPayload = (intent /* 'cart' | 'quote' */) => {
        const payload = {
            product_id: product.id,
            quantity: Math.max(1, Number(quantity || 1)),
            intent,
        };

        if (product.pricing_method === "roll") {
            if (width) payload.width = Number(width);
            if (height) payload.height = Number(height);
            payload.size_unit = sizeUnit;
        }

        if (selectedOptions && Object.keys(selectedOptions).length) {
            payload.selected_options = selectedOptions;
        }

        if (selectedDesign?.type === "file" || selectedDesign?.type === "link") {
            payload.user_design_upload_id = selectedDesign.upload_id;
        } else if (selectedDesign?.type === "hire") {
            payload.hire_designer = true;
        } else if (selectedDesign?.type === "gallery") {
            const ids = Array.isArray(selectedDesign.ids) ? selectedDesign.ids : [];
            if (ids.length === 1) payload.product_design_id = ids[0];
            if (ids.length > 1) payload.product_design_ids = ids; // <— add array key your API expects
        }


        return payload;
    };

    const handleAddToCart = async () => {
        if (!selectedDesign && designs.length > 0) {
            setCartErr("Please select or upload a design first.");
            return;
        }


        if (rollNeedsSize || cartBusy || cartAdded) return;

        setCartBusy(true);
        setCartMsg(null);
        setCartErr(null);

        try {
            const payload = buildPayload('cart');
            const { data } = await axios.post('/api/cart/items', payload, {
                headers: { Accept: 'application/json' },
                validateStatus: s => s >= 200 && s < 500,
            });

            if (data?.ok) {
                setCartAdded(true);
                setCartMsg('Added to cart.');
            } else {
                setCartErr(data?.message || 'Could not add to cart.');
            }
        } catch (e) {
            setCartErr(e?.response?.data?.message || 'Could not add to cart.');
        } finally {
            setCartBusy(false);
        }
    };

    const handleAddToQuote = async () => {
        if (quoteBusy || quoteRequested) return;

        setQuoteBusy(true);
        setQuoteMsg(null);
        setQuoteErr(null);

        try {
            // If you use a dedicated endpoint for quotes, change the URL below.
            // Option A (same endpoint, flagged by intent):
            const payload = buildPayload('quote');
            const { data } = await axios.post('/api/cart/items', payload, {
                headers: { Accept: 'application/json' },
                validateStatus: s => s >= 200 && s < 500,
            });

            // Option B (separate endpoint):
            // const { data } = await axios.post('/api/quotes', buildPayload('quote'), { ... });

            if (data?.ok) {
                setQuoteRequested(true);
                setQuoteMsg('Quote request sent.');
            } else {
                setQuoteErr(data?.message || 'Could not send quote request.');
            }
        } catch (e) {
            setQuoteErr(e?.response?.data?.message || 'Could not send quote request.');
        } finally {
            setQuoteBusy(false);
        }
    };


    // when user chooses from the gallery
    const selectGalleryDesign = (d) =>
        setSelectedDesign({ type: "gallery", id: d?.id, name: d?.name, image_url: d?.image_url });

    const [selectedGallery, setSelectedGallery] = useState([]);

    const clearSelectedDesign = () => setSelectedDesign(null);

    const toggleGalleryDesign = (d) => {
        // ensure we're in gallery mode and the accordion is open
        if (designSource !== 'gallery') setDesignSource('gallery');
        openDesignsSection();

        setSelectedGallery((prev) => {
            const exists = prev.some(x => x.id === d.id);
            const next = exists ? prev.filter(x => x.id !== d.id)
                : [...prev, { id: d.id, name: d.name, image_url: d.image_url }];

            setSelectedDesign(next.length ? { type: "gallery", ids: next.map(x => x.id) } : null);
            setQuantity(next.length > 0 ? next.length : 1);
            return next;
        });
    };



    // Clear gallery selection (and keep quantity >=1)
    const clearGallerySelection = () => {

        setSelectedGallery([]);
        if (selectedDesign?.type === "gallery") setSelectedDesign(null);
        setQuantity(1);
    };



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


    const designsDetailsRef = useRef(null);

    const openDesignsSection = () => {
        try {
            if (designsDetailsRef.current) {
                // Ensure <details> is open then scroll
                designsDetailsRef.current.open = true;
                designsDetailsRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
            } else {
                // Fallback: scroll by id
                document.getElementById("product-designs")?.scrollIntoView({ behavior: "smooth" });
            }
        } catch (_) { }
    };

    // simple hire flow — adjust to your route/modal
    const hireDesigner = () => {
        clearGallerySelection();
        const url = `/hire-designer?product_id=${encodeURIComponent(product.id)}&name=${encodeURIComponent(product.name)}`;
        window.location.href = url;
        clearAllDesigns();
        setDesignSource('hire');
    };

    useEffect(() => {
        if (selectedDesign?.type === "gallery") {
            setQuantity(selectedGallery.length > 0 ? selectedGallery.length : 1);
        }
    }, [selectedGallery, selectedDesign?.type]);

    const clearAllDesigns = () => {
        setSelectedGallery([]);
        setSelectedDesign(null);
        setDesignSource(null);
        setQuantity(1); // ← back to 1
    };

    useEffect(() => {
        // if the selector/tab is not "gallery", wipe gallery picks & reset qty
        if (designSource && designSource !== 'gallery') {
            if (selectedGallery.length || selectedDesign?.type === 'gallery') {
                setSelectedGallery([]);
                setSelectedDesign(null);
                setQuantity(1);
            }
        }
    }, [designSource]);

    useEffect(() => {
        // keep qty in sync with gallery count, otherwise reset to 1
        if (selectedDesign?.type === 'gallery') {
            setQuantity(selectedGallery.length || 1);
        } else if (!selectedDesign || selectedDesign?.type !== 'gallery') {
            setQuantity(1);
        }
    }, [selectedDesign?.type, selectedGallery.length]);


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
                        <section className="tw-bg-white tw-p-7 tw-rounded-md">
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
                            {variantAdj !== 0 && (
                                <div className="tw-text-xs tw-text-gray-500">
                                    Includes option adjustments: {variantAdj > 0 ? '+' : ''}Rs. {formatMoney(variantAdj)} per unit
                                </div>
                            )}
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
                                                    className="tw-group tw-inline-flex tw-items-center tw-gap-1.5 tw-text-xs tw-font-medium tw-px-3 tw-py-1.5 tw-rounded-full border tw-border-gray-200 tw-bg-white tw-text-gray-700 hover:tw-border-[#f44032] hover:tw-text-[#f44032] dark:tw-bg-gray-900 dark:tw-border-gray-700"
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
                                    {product.variants.map((group) => {
                                        const current = selectedOptions[group.name];
                                        return (
                                            <div key={group.id ?? group.name} className="tw-space-y-3">
                                                <label className="tw-text-sm tw-font-medium">{group.name}</label>

                                                {/* Parent options */}
                                                <div className="tw-flex tw-flex-wrap tw-gap-2">
                                                    {(group.options || []).map((opt) => {
                                                        const active = current?.value === opt.value || current?.id === opt.id;
                                                        return (
                                                            <button
                                                                key={opt.id ?? opt.value}
                                                                type="button"
                                                                onClick={() => chooseVariant(group.name, opt)}
                                                                className={`tw-px-3 tw-py-2 tw-rounded-xl tw-text-sm border transition
                    ${active
                                                                        ? "tw-border-[#f44032] tw-text-[#f44032] tw-bg-[#f44032]/5"
                                                                        : "tw-border-gray-300 dark:tw-border-gray-700 hover:tw-border-[#f44032]"}
                  `}
                                                                title={opt.price_adjustment ? `+Rs ${formatMoney(opt.price_adjustment)}` : undefined}
                                                            >
                                                                {opt.label ?? opt.value}
                                                                {opt.price_adjustment
                                                                    ? <span className="tw-ml-1 tw-text-xs tw-text-gray-500">(+{formatMoney(opt.price_adjustment)})</span>
                                                                    : null}
                                                            </button>
                                                        );
                                                    })}
                                                </div>

                                                {/* Subgroups for the active parent option */}
                                                {(() => {
                                                    const parent = (group.options || []).find(o =>
                                                        current && (o.value === current.value || o.id === current.id)
                                                    );
                                                    if (!parent?.subgroups?.length) return null;

                                                    return parent.subgroups.map((sg) => {
                                                        const chosen = current?.sub?.[sg.name];
                                                        return (
                                                            <div key={`${group.name}-${sg.name}`} className="tw-pt-1">
                                                                <div className="tw-text-xs tw-font-medium tw-mb-1">{sg.name}</div>
                                                                <div className="tw-flex tw-flex-wrap tw-gap-2">
                                                                    {(sg.options || []).map(opt => {
                                                                        const active = chosen && (chosen.value === opt.value || chosen.id === opt.id);
                                                                        return (
                                                                            <button
                                                                                key={opt.id ?? opt.value}
                                                                                type="button"
                                                                                onClick={() => chooseSubvariant(group.name, sg.name, opt)}
                                                                                className={`tw-px-3 tw-py-2 tw-rounded-xl tw-text-sm border transition
                            ${active
                                                                                        ? "tw-border-[#f44032] tw-text-[#f44032] tw-bg-[#f44032]/5"
                                                                                        : "tw-border-gray-300 dark:tw-border-gray-700 hover:tw-border-[#f44032]"}
                          `}
                                                                                title={opt.price_adjustment ? `+Rs ${formatMoney(opt.price_adjustment)}` : undefined}
                                                                            >
                                                                                {opt.label ?? opt.value}
                                                                                {opt.price_adjustment
                                                                                    ? <span className="tw-ml-1 tw-text-xs tw-text-gray-500">(+{formatMoney(opt.price_adjustment)})</span>
                                                                                    : null}
                                                                            </button>
                                                                        );
                                                                    })}
                                                                </div>
                                                            </div>
                                                        );
                                                    });
                                                })()}
                                            </div>
                                        );
                                    })}
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


                                <DesignSelector
                                    productId={product.id}
                                    designsCount={designs.length}
                                    onOpenGallery={() => { setDesignSource('gallery'); openDesignsSection(); }}
                                    onHireDesigner={hireDesigner}
                                    onUploaded={(res) => {
                                        clearAllDesigns();
                                        setDesignSource(res?.type === 'link' ? 'link' : 'file');
                                        setSelectedDesign({ type: res?.type, upload_id: res?.upload_id ?? null });
                                    }}
                                    // NEW (make DesignSelector controlled; see next block)
                                    source={designSource}
                                    onChangeSource={(src) => {
                                        setDesignSource(src);
                                        if (src !== 'gallery') clearAllDesigns();
                                        if (src === 'gallery') openDesignsSection();
                                    }}
                                />

                            </div>

                            {/* CTA: full-width on mobile */}

                            <div className="tw-mt-6 tw-flex tw-flex-col md:tw-flex-row tw-gap-3 tw-items-stretch md:tw-items-center">
                                {/* Add to Cart */}
                                <button
                                    type="button"
                                    onClick={handleAddToCart}
                                    disabled={rollNeedsSize || cartBusy || cartAdded}
                                    className={`tw-w-full md:tw-w-auto tw-inline-flex tw-justify-center tw-items-center tw-gap-2 tw-font-semibold tw-px-5 tw-py-3 tw-rounded-2xl tw-transition ${rollNeedsSize || cartBusy || cartAdded
                                        ? 'tw-bg-gray-300 tw-text-gray-500 cursor-not-allowed'
                                        : 'tw-bg-[#f44032] tw-text-white hover:tw-scale-[1.01]'
                                        }`}
                                >
                                    <Icon icon="mdi:cart-outline" className="tw-text-xl" />
                                    {cartAdded ? 'Added to Cart' : cartBusy ? 'Adding…' : 'Add to Cart'}
                                </button>

                                {/* Request Quote */}
                                <button
                                    type="button"
                                    onClick={handleAddToQuote}
                                    disabled={quoteBusy || quoteRequested}
                                    className={[
                                        "tw-w-full md:tw-w-auto tw-inline-flex tw-justify-center tw-items-center tw-gap-2 tw-font-semibold tw-px-5 tw-py-3 tw-rounded-2xl tw-transition border",
                                        "focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-inset focus-visible:tw-ring-[#f44032] focus-visible:tw-ring-offset-2",
                                        (quoteBusy || quoteRequested)
                                            ? "tw-bg-gray-300 tw-text-gray-500 tw-border-gray-300 tw-cursor-not-allowed disabled:tw-pointer-events-none"
                                            : "tw-bg-white tw-text-black tw-border-gray-900 hover:tw-bg-black hover:tw-text-white hover:tw-border-black hover:tw-scale-[1.01]"
                                    ].join(" ")}

                                >
                                    <Icon icon="mdi:file-document-edit-outline" className="tw-text-xl" />
                                    {quoteRequested ? 'Quote Requested' : quoteBusy ? 'Sending…' : 'Request Quote'}
                                </button>

                                {/* Running total display (unchanged) */}
                                <div className="md:tw-ml-2 tw-flex tw-justify-center md:tw-justify-start tw-items-center tw-gap-2 tw-text-gray-600">
                                    <Icon icon="mdi:cash-multiple" className="tw-text-xl" />
                                    <span className="tw-text-sm">
                                        Current total: Rs. {formatMoney(computed.total)}
                                        {isRoll && computed.area > 0 && (
                                            <span className="tw-text-xs tw-text-gray-500">  •  {formatMoney(computed.area)} sq.ft</span>
                                        )}
                                    </span>
                                </div>
                            </div>

                            {/* One banner per action, independent */}
                            {cartMsg && !cartErr && (
                                <div className="tw-mt-2 tw-rounded-xl tw-border tw-border-emerald-300 tw-bg-emerald-50 tw-text-emerald-900 tw-p-3 tw-text-sm">
                                    {cartMsg}
                                </div>
                            )}
                            {cartErr && !cartMsg && (
                                <div className="tw-mt-2 tw-rounded-xl tw-border tw-border-rose-300 tw-bg-rose-50 tw-text-rose-900 tw-p-3 tw-text-sm">
                                    {cartErr}
                                </div>
                            )}
                            {quoteMsg && !quoteErr && (
                                <div className="tw-mt-2 tw-rounded-xl tw-border tw-border-sky-300 tw-bg-sky-50 tw-text-sky-900 tw-p-3 tw-text-sm">
                                    {quoteMsg}
                                </div>
                            )}
                            {quoteErr && !quoteMsg && (
                                <div className="tw-mt-2 tw-rounded-xl tw-border tw-border-rose-300 tw-bg-rose-50 tw-text-rose-900 tw-p-3 tw-text-sm">
                                    {quoteErr}
                                </div>
                            )}

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
                            ref={designsDetailsRef}
                            className="group tw-rounded-2xl tw-border tw-border-gray-200 dark:tw-border-gray-800 tw-bg-white dark:tw:bg-gray-900"
                            // auto-open if there are very few items
                            open={designs.length > 0 && designs.length <= 4}
                        >
                            <summary className="tw-cursor-pointer tw-select-none tw-list-none tw-flex tw-items-center tw-justify-between tw-gap-3 tw-px-4 tw-py-3 md:tw-px-5 md:tw-py-6">
                                <div className="tw-flex tw-items-center tw-gap-2">
                                    <Icon icon="mdi:palette-outline" className="tw-text-3xl tw-text-red-500" />
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


                                {selectedGallery.length > 0 && (
                                    <div className="tw-flex tw-items-center tw-gap-2 tw-px-4 md:tw-px-5 tw-mb-3">
                                        <span className="tw-text-sm tw-font-medium">Selected designs: {selectedGallery.length}</span>
                                        <div className="tw-flex -tw-space-x-2">
                                            {selectedGallery.slice(0, 5).map(s => (
                                                <img key={s.id} src={safeImg(s.image_url)} alt="" className="tw-w-7 tw-h-7 tw-rounded-md tw-object-cover tw-border tw-border-white tw-shadow" />
                                            ))}
                                            {selectedGallery.length > 5 && <span className="tw-text-xs tw-ml-2">+{selectedGallery.length - 5}</span>}
                                        </div>
                                        <button type="button" onClick={clearGallerySelection} className="tw-ml-auto tw-text-xs tw-underline tw-text-gray-600 hover:tw-text-[#f44032]">
                                            Clear
                                        </button>
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
                                                <DesignCard
                                                    key={d.id || i}
                                                    d={d}
                                                    i={i}
                                                    onPreview={openDesignPreview}
                                                    isSelected={selectedGallery.some(x => x.id === d.id)}
                                                    onSelect={toggleGalleryDesign}
                                                />
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
            <div className="md:tw-hidden tw-fixed tw-bottom-0 tw-inset-x-0 tw-z-40 tw-bg-white tw-border-t tw-border-gray-200 tw-p-3">
                <div className="tw-container tw-mx-auto tw-flex tw-items-center tw-gap-2">
                    <button
                        onClick={handleAddToCart}
                        disabled={rollNeedsSize || cartBusy || cartAdded}
                        className={`tw-flex-1 tw-inline-flex tw-justify-center tw-items-center tw-gap-2 tw-h-11 tw-rounded-full tw-font-semibold tw-text-sm tw-shadow-sm ${rollNeedsSize || cartBusy || cartAdded ? 'tw-bg-gray-300 tw-text-gray-500' : 'tw-bg-[#f44032] tw-text-white'
                            }`}
                    >
                        <Icon icon="mdi:cart-outline" className="tw-text-lg" />
                        {cartAdded ? 'Added' : cartBusy ? 'Adding…' : 'Add to Cart'}
                    </button>

                    <button
                        onClick={handleAddToQuote}
                        disabled={quoteBusy || quoteRequested}
                        className={`tw-flex-1 tw-inline-flex tw-justify-center tw-items-center tw-gap-2 tw-h-11 tw-rounded-full tw-font-semibold tw-text-sm tw-shadow-sm ${quoteBusy || quoteRequested ? 'tw-bg-gray-300 tw-text-gray-500' : 'tw-bg-black tw-text-white'
                            }`}
                    >
                        <Icon icon="mdi:file-document-edit-outline" className="tw-text-lg" />
                        {quoteRequested ? 'Requested' : quoteBusy ? 'Sending…' : 'Quote'}
                    </button>
                </div>
            </div>


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
