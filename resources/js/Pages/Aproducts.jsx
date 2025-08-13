import React, { useEffect, useMemo, useState } from 'react';
import { Head } from '@inertiajs/react';
import axios from 'axios';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import AOS from 'aos';
import 'aos/dist/aos.css';
import ProductCard from '@/Components/ProductCard';
import { Icon } from '@iconify/react';
import Meta from '@/Components/Metaheads';
import Breadcrumb from '@/Components/BreadcrumbHome';
import { Link } from "@inertiajs/react";

/* ---------------------- helpers ---------------------- */
const unwrapArray = (payload) => {
    if (Array.isArray(payload)) return payload;
    if (payload && Array.isArray(payload.data)) return payload.data;
    if (payload && payload.ok && Array.isArray(payload.data)) return payload.data;
    if (payload && payload.data && Array.isArray(payload.data.data)) return payload.data.data;
    return [];
};
const unwrapPaginatedItems = (payload) => {
    if (Array.isArray(payload)) return payload;
    if (payload && Array.isArray(payload.data)) return payload.data;
    if (payload && payload.ok && Array.isArray(payload.data)) return payload.data;
    return [];
};

/* ---------------------- skeletons ---------------------- */
const Shimmer = () => (
    <span className="tw-absolute tw-inset-0 tw-animate-[shimmer_2s_infinite] tw-bg-gradient-to-r tw-from-transparent tw-via-white/30 tw-to-transparent tw-rounded-lg" />
);
const SkeletonCategories = () => (
    <ul className="tw-space-y-2">
        {[...Array(6)].map((_, i) => (
            <li key={i} className="tw-relative">
                <div className="tw-h-9 tw-rounded tw-bg-gray-200 tw-overflow-hidden"><Shimmer /></div>
            </li>
        ))}
    </ul>
);
const SkeletonProductGrid = ({ count = 9 }) => (
    <div className="tw-grid tw-grid-cols-2 sm:tw-grid-cols-2 md:tw-grid-cols-3 xl:tw-grid-cols-4 tw-gap-3 md:tw-gap-6">
        {[...Array(count)].map((_, i) => (
            <div key={i} className="tw-bg-white tw-rounded-2xl tw-shadow-sm tw-overflow-hidden tw-relative">
                <div className="tw-aspect-[4/3] tw-bg-gray-200 tw-relative"><Shimmer /></div>
                <div className="tw-p-4 tw-space-y-3">
                    <div className="tw-h-5 tw-w-3/4 tw-bg-gray-200 tw-rounded tw-relative overflow-hidden"><Shimmer /></div>
                    <div className="tw-h-4 tw-w-full tw-bg-gray-200 tw-rounded tw-relative overflow-hidden"><Shimmer /></div>
                    <div className="tw-h-4 tw-w-1/2 tw-bg-gray-200 tw-rounded tw-relative overflow-hidden"><Shimmer /></div>
                </div>
            </div>
        ))}
    </div>
);

/* ---------------------- small UI pieces ---------------------- */
const FilterItem = ({ active, onClick, icon, label }) => (
    <button
        onClick={onClick}
        className={`tw-w-full tw-flex tw-items-center tw-gap-2 tw-text-sm tw-p-2 tw-rounded-xl tw-transition ${active ? 'tw-bg-black tw-text-white' : 'tw-bg-gray-100 hover:tw-bg-gray-200'}`}
    >
        <Icon icon={icon} className="tw-text-base" />
        <span className="tw-truncate">{label}</span>
    </button>
);
const SortPill = ({ label, value, current, onChange }) => {
    const active = current === value;
    return (
        <button
            onClick={() => onChange(value)}
            className={`tw-text-sm tw-ps-2 tw-py-2 tw-rounded-xl tw-transition tw-border ${active
                ? 'tw-bg-black tw-text-white tw-border-black'
                : 'tw-bg-white tw-text-gray-700 tw-border-gray-200 hover:tw-border-gray-300'
                }`}
        >
            {label}
        </button>
    );
};
const Chip = ({ icon, label, onClear }) => (
    <span className="chip tw-inline-flex tw-items-center tw-gap-1 tw-text-xs tw-bg-gray-100 tw-text-gray-700 tw-rounded-full tw-px-2.5 tw-py-1 tw-relative">
        <Icon icon={icon} className="tw-text-sm" />
        <span className="tw-max-w-[16rem] tw-truncate">{label}</span>
        {onClear && (
            <button onClick={onClear} className="tw-ml-1 tw-p-0.5 hover:tw-bg-gray-200 tw-rounded-full" title="Clear">
                <Icon icon="mdi:close" className="tw-text-sm" />
            </button>
        )}
    </span>
);
const EmptyState = () => (
    <div className="tw-text-center tw-bg-white tw-rounded-2xl tw-py-16 tw-px-6 tw-shadow-sm">
        <div className="tw-mx-auto tw-w-16 tw-h-16 tw-rounded-full tw-bg-gray-100 tw-flex tw-items-center tw-justify-center tw-mb-4">
            <Icon icon="mdi:shopping-outline" className="tw-text-2xl tw-text-gray-400" />
        </div>
        <h4 className="tw-text-lg tw-font-semibold">No products found</h4>
        <p className="tw-text-sm tw-text-gray-500 tw-mt-1">Try a different category, search, or sorting option.</p>
    </div>
);

/* ---------------------- mobile sheet ---------------------- */
const MobileSheet = ({ open, title, onClose, children }) => {
    if (!open) return null;
    return (
        <>
            <div className="tw-fixed tw-inset-0 tw-bg-black/50 tw-z-40" onClick={onClose} />
            <div className="tw-fixed tw-inset-x-0 tw-bottom-0 tw-z-50 tw-bg-white dark:tw-bg-gray-900 tw-rounded-t-2xl tw-shadow-lg tw-max-h-[80vh] tw-overflow-y-auto">
                <div className="tw-sticky tw-top-0 tw-bg-white dark:tw-bg-gray-900 tw-border-b tw-border-gray-200 dark:tw-border-gray-800 tw-px-4 tw-py-3 tw-flex tw-items-center tw-justify-between">
                    <h6 className="tw-font-semibold">{title}</h6>
                    <button onClick={onClose} className="tw-p-2 tw-rounded-lg hover:tw-bg-gray-100 dark:hover:tw-bg-gray-800">
                        <Icon icon="mdi:close" className="tw-text-xl" />
                    </button>
                </div>
                <div className="tw-px-4 tw-py-4">{children}</div>
            </div>
        </>
    );
};

/* ---------------------- Quick View Modal ---------------------- */
const QuickView = ({ product, onClose }) => {
    if (!product) return null;

    // Build gallery
    const imgs = Array.isArray(product?.images)
        ? product.images.map(i => i?.image_url).filter(Boolean)
        : [];
    const gallery = imgs.length ? imgs : [product?.image || "/images/default.png"];

    const [active, setActive] = useState(0);

    const url =
        product?.url ??
        `/public/${product?.id}/product/${String(product?.name || "")
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")}`;

    const perSqft = product?.pricing_method === "roll";

    // Lock scroll + ESC to close
    useEffect(() => {
        const prev = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        const onKey = (e) => e.key === "Escape" && onClose?.();
        window.addEventListener("keydown", onKey);
        return () => {
            document.body.style.overflow = prev;
            window.removeEventListener("keydown", onKey);
        };
    }, [onClose]);

    return (
        <div className="tw-fixed tw-inset-0 tw-z-50" role="dialog" aria-modal="true">
            {/* Backdrop */}
            <div className="tw-absolute tw-inset-0 tw-bg-black/50" onClick={onClose} />

            {/* Sheet (mobile) / Dialog (desktop) */}
            <div className="tw-absolute tw-inset-x-0 tw-bottom-0 md:tw:inset-0 md:tw:m-auto md:tw:max-w-2xl tw-w-full tw-bg-white tw-rounded-t-2xl md:tw-rounded-2xl tw-shadow-xl tw-max-h-[85vh] tw-overflow-hidden">
                {/* Header */}
                <div className="tw-sticky tw-top-0 tw-z-10 tw-flex tw-items-center tw-justify-between tw-p-4 tw-border-b tw-border-gray-100 tw-bg-white">
                    <h3 className="tw-text-base md:tw-text-lg tw-font-bold tw-pr-6 tw-truncate">
                        {product?.name}
                    </h3>
                    <button
                        onClick={onClose}
                        aria-label="Close"
                        className="tw-p-2 tw-rounded-xl hover:tw-bg-gray-100"
                    >
                        <Icon icon="mdi:close" className="tw-text-xl" />
                    </button>
                </div>

                {/* Body */}
                <div className="tw-grid md:tw-grid-cols-2 tw-gap-4 tw-p-4 tw-overflow-y-auto tw-max-h-[calc(85vh-4rem)]">
                    {/* Left: main image + thumbs */}
                    <div className="tw-flex tw-flex-col">
                        <div className="tw-relative tw-aspect-square tw-rounded-xl tw-overflow-hidden tw-bg-gray-100">
                            <img
                                src={gallery[active]}
                                alt={`${product?.name} ${active + 1}`}
                                className="tw-w-full tw-h-full tw-object-cover"
                            />
                            {perSqft && (
                                <span className="tw-absolute tw-top-3 tw-right-3 tw-bg-black/80 tw-text-white tw-text-[11px] tw-rounded-full tw-px-2 tw-py-1">
                                    Per sq.ft
                                </span>
                            )}
                        </div>

                        {gallery.length > 1 && (
                            <div className="tw-mt-2 tw-flex tw-gap-2 tw-overflow-x-auto">
                                {gallery.slice(0, 6).map((src, i) => (
                                    <button
                                        key={i}
                                        onClick={() => setActive(i)}
                                        className={`tw-relative tw-w-14 tw-h-14 tw-rounded-lg tw-overflow-hidden tw-border ${i === active ? "tw-border-[#f44032]" : "tw-border-gray-200"
                                            }`}
                                        aria-label={`Image ${i + 1}`}
                                    >
                                        <img
                                            src={src}
                                            alt={`${product?.name} ${i + 1}`}
                                            className="tw-w-full tw-h-full tw-object-cover"
                                        />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Right: info + CTAs */}
                    <div className="tw-flex tw-flex-col">
                        {product?.base_price != null && (
                            <div className="tw-text-[#f44032] tw-font-semibold tw-text-lg">
                                From Rs. {Number(product.base_price).toLocaleString()}
                            </div>
                        )}
                        {perSqft && product?.price_per_sqft && (
                            <div className="tw-text-xs tw-text-gray-500 tw-mt-0.5">
                                {Number(product.price_per_sqft).toLocaleString()} / sq.ft
                            </div>
                        )}

                        <div className="tw-mt-3 tw-text-sm tw-text-gray-600">
                            <div
                                className="tw-max-h-40 tw-overflow-auto tw-prose tw-prose-sm dark:tw-prose-invert tw-max-w-none"
                                dangerouslySetInnerHTML={{ __html: product?.description ?? "" }}
                            />
                        </div>

                        {/* Trust row (optional) */}
                        <div className="tw-flex tw-items-center tw-gap-3 tw-text-xs tw-text-gray-500 tw-mt-3">
                            <span className="tw-inline-flex tw-items-center tw-gap-1">
                                <Icon icon="mdi:check-decagram-outline" />
                                Free design check
                            </span>
                            <span className="tw-inline-flex tw-items-center tw-gap-1">
                                <Icon icon="mdi:truck-fast-outline" />
                                Same-day print
                            </span>
                            <span className="tw-hidden sm:tw-inline-flex tw-items-center tw-gap-1">
                                <Icon icon="mdi:map-marker-distance" />
                                Island-wide delivery
                            </span>
                        </div>

                        {/* CTAs */}
                        <div className="tw-mt-auto tw-pt-4 tw-space-y-2">
                            <Link
                                href={url}
                                className="tw-w-full tw-inline-flex tw-justify-center tw-items-center tw-gap-2 tw-h-12 tw-rounded-3xl tw-font-semibold tw-text-base tw-bg-[#f44032] tw-text-white hover:tw-bg-[#e13124] tw-no-underline"
                            >
                                <Icon icon="mdi:cart-plus" className="tw-text-xl" />
                                Add to Cart
                            </Link>

                            <Link
                                href="/quote"
                                className="tw-w-full tw-inline-flex tw-justify-center tw-items-center tw-gap-2 tw-h-12 tw-rounded-3xl tw-font-semibold tw-text-base tw-border tw-border-gray-200 tw-bg-white tw-text-gray-800 hover:tw-bg-gray-50 tw-no-underline"
                            >
                                <Icon icon="mdi:email-fast-outline" className="tw-text-xl" />
                                Ask a Quote
                            </Link>

                            <a
                                href={url}
                                className="tw-block tw-text-center tw-text-sm tw-underline tw-text-gray-600 hover:tw-text-[#f44032]"
                            >
                                View full details
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

/* ---------------------- main ---------------------- */
const AllProducts = () => {
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);         // [{id,name}]
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [sort, setSort] = useState('');
    const [q, setQ] = useState('');
    const [qCommitted, setQCommitted] = useState('');

    const [loadingInitialCats, setLoadingInitialCats] = useState(true);
    const [loadingProducts, setLoadingProducts] = useState(true);
    const [catError, setCatError] = useState(null);
    const [prodError, setProdError] = useState(null);

    // Mobile sheet
    const [showFilterSheet, setShowFilterSheet] = useState(false);

    // Quick view + compare + saved presets + back-to-top
    const [quick, setQuick] = useState(null);
    const [compare, setCompare] = useState([]); // [ids]
    const [showToTop, setShowToTop] = useState(false);

    // Saved views in localStorage
    const [savedViews, setSavedViews] = useState(() => {
        try { return JSON.parse(localStorage.getItem('pa_saved_views') || '[]'); } catch { return []; }
    });

    // Preselect category via ?category_id=
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const cid = params.get('category_id');
        if (cid) setSelectedCategory(Number(cid));
    }, []);

    useEffect(() => {
        AOS.init({ once: true, duration: 600 });
    }, []);

    // Scroll watcher for FAB
    useEffect(() => {
        const onScroll = () => setShowToTop(window.scrollY > 600);
        window.addEventListener('scroll', onScroll);
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    /* -------- fetch categories -------- */
    const fetchCategories = async () => {
        setCatError(null);
        setLoadingInitialCats(true);
        try {
            const res = await axios.get('/api/categories', { headers: { Accept: 'application/json' } });
            setCategories(unwrapArray(res.data));
        } catch (e) {
            setCategories([]);
            setCatError('Failed to load categories.');
        } finally {
            setLoadingInitialCats(false);
        }
    };
    useEffect(() => { fetchCategories(); }, []);

    /* -------- debounce search -------- */
    useEffect(() => {
        const t = setTimeout(() => setQCommitted(q.trim()), 350);
        return () => clearTimeout(t);
    }, [q]);

    /* -------- fetch products on filters change -------- */
    useEffect(() => { fetchProducts(); /* eslint-disable-next-line */ }, [selectedCategory, sort, qCommitted]);
    const fetchProducts = async () => {
        setProdError(null);
        setLoadingProducts(true);
        try {
            const params = {};
            if (selectedCategory !== null && selectedCategory !== undefined) params.category_id = selectedCategory;
            if (sort) params.sort = sort;
            if (qCommitted) params.q = qCommitted;

            const res = await axios.get('/api/products', { params, headers: { Accept: 'application/json' } });
            setProducts(unwrapPaginatedItems(res.data));
        } catch (e) {
            setProducts([]);
            setProdError('Failed to load products.');
        } finally {
            setLoadingProducts(false);
        }
    };

    const activeCategoryName = useMemo(() => {
        if (selectedCategory === null) return 'All';
        const c = categories.find(c => c.id === selectedCategory);
        return c ? c.name : 'All';
    }, [selectedCategory, categories]);

    const clearAll = () => { setSelectedCategory(null); setSort(''); setQ(''); setQCommitted(''); };

    // Compare toggle
    const toggleCompare = (id) => {
        setCompare(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id].slice(-4));
    };

    // Save / apply presets
    const saveCurrentView = () => {
        const name = prompt('Save this view as:');
        if (!name) return;
        const payload = { name, selectedCategory, sort, q: qCommitted, ts: Date.now() };
        const next = [...savedViews, payload].slice(-8);
        setSavedViews(next);
        localStorage.setItem('pa_saved_views', JSON.stringify(next));
    };
    const applyView = (v) => {
        setSelectedCategory(v.selectedCategory ?? null);
        setSort(v.sort ?? '');
        setQ(v.q ?? '');
        setQCommitted(v.q ?? '');
    };

    return (
        <>
            <Head title="All Products" />
            <Meta
                title="All Products | Printair Advertising – Premium Printing Solutions in Sri Lanka"
                description="Explore our complete range of high-quality printing products including banners, business cards, brochures, photo products, signage, and more. Fast, reliable, and affordable printing in Sri Lanka."
                url="https://printair.lk/products/all"
                keywords="Printair, all products, printing Sri Lanka, digital printing, offset printing, banners, business cards, brochures, posters, photo frames, x-banners, pullups, roll-up banners, signage, promotional materials"
                canonical="https://printair.lk/products/all"
                author="Printair Team"
                robots="index, follow"
            />
            <Header />

            {/* Explicit breadcrumb with chevrons */}
            <Breadcrumb
                items={[
                    { label: 'Products', href: '/products' },
                    { label: 'All Products', href: null },
                ]}
                useChevron
            />

            {/* Sticky filter summary bar */}
            <div className="tw-sticky tw-top-14 tw-z-30 tw-bg-white/90 dark:tw-bg-gray-900/90 tw-backdrop-blur tw-border-b tw-border-gray-200 dark:tw-border-gray-800">
                <div className="tw-container tw-mx-auto tw-px-3 md:tw-px-0 tw-py-2 tw-flex tw-items-center tw-justify-between">
                    <div className="tw-flex tw-items-center tw-gap-2 tw-overflow-x-auto tw-max-w-[70vw]">
                        <Chip icon="mdi:folder-outline" label={activeCategoryName} onClear={selectedCategory !== null ? () => setSelectedCategory(null) : null} />
                        {sort && <Chip icon="mdi:sort" label={sort === 'price_low' ? 'Price ↑' : sort === 'price_high' ? 'Price ↓' : sort} onClear={() => setSort('')} />}
                        {qCommitted && <Chip icon="mdi:magnify" label={`“${qCommitted}”`} onClear={() => { setQ(''); setQCommitted(''); }} />}
                    </div>
                    <div className="tw-flex tw-items-center tw-gap-2">
                        {savedViews.length > 0 && (
                            <div className="tw-relative">
                                <select
                                    onChange={(e) => {
                                        const idx = Number(e.target.value);
                                        if (!isNaN(idx)) applyView(savedViews[idx]);
                                    }}
                                    defaultValue=""
                                    className="tw-text-xs tw-border tw-border-gray-200 tw-rounded-xl tw-px-2 tw-py-1"
                                >
                                    <option value="">My views</option>
                                    {savedViews.map((v, i) => (
                                        <option key={v.ts} value={i}>{v.name}</option>
                                    ))}
                                </select>
                            </div>
                        )}
                        <button onClick={saveCurrentView} className="tw-hidden sm:tw-inline-flex tw-items-center tw-gap-1 tw-text-xs tw-border tw-border-gray-200 tw-rounded-xl tw-px-2.5 tw-py-1.5">
                            <Icon icon="mdi:content-save-outline" /> Save view
                        </button>
                        <button onClick={clearAll} className="tw-text-xs tw-underline">Clear all</button>
                    </div>
                </div>
            </div>

            <div className="tw-container tw-mx-auto tw-px-3 md:tw-px-0 tw-py-6 md:tw-py-8">
                {/* Mobile top bar: search + filter */}
                <div className="tw-flex md:tw-hidden tw-items-center tw-gap-2 tw-mb-4">
                    <div className="tw-relative tw-flex-1">
                        <Icon icon="mdi:magnify" className="tw-absolute tw-left-3 tw-top-1/2 -tw-translate-y-1/2 tw-text-gray-400 tw-text-xl" />
                        <input
                            value={q}
                            onChange={(e) => setQ(e.target.value)}
                            placeholder="Search products…"
                            className="tw-w-full tw-pl-10 tw-pr-3 tw-py-2 tw-rounded-xl tw-border tw-border-gray-200 focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-black/5"
                        />
                    </div>
                    <button
                        onClick={() => setShowFilterSheet(true)}
                        className="tw-flex tw-items-center tw-gap-2 tw-px-3 tw-py-2 tw-rounded-xl tw-border tw-border-gray-200 tw-bg-white"
                    >
                        <Icon icon="mdi:tune-variant" className="tw-text-xl" />
                        <span className="tw-text-sm">Filter</span>
                    </button>
                </div>

                {/* Desktop header row */}
                <div className="tw-hidden md:tw-flex tw-bg-white tw-rounded-2xl tw-shadow-sm tw-px-6 tw-py-4 tw-mb-6 tw-items-center tw-justify-between">
                    <div className="tw-flex tw-items-center tw-gap-3 tw-flex-wrap">
                        <h4 className="tw-text-3xl tw-font-bold tw-text-[#f44032]">All Products</h4>
                    </div>

                    <div className="tw-w-80 tw-relative">
                        <Icon icon="mdi:magnify" className="tw-absolute tw-left-3 tw-top-1/2 -tw-translate-y-1/2 tw-text-gray-400 tw-text-xl" />
                        <input
                            value={q}
                            onChange={(e) => setQ(e.target.value)}
                            placeholder="Search products…"
                            className="tw-w-full tw-pl-10 tw-pr-3 tw-py-2 tw-rounded-xl tw-border tw-border-gray-200 focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-black/5"
                        />
                    </div>
                </div>

                <div className="tw-flex tw-flex-col lg:tw-flex-row tw-gap-8">
                    {/* Sidebar (desktop) */}
                    <aside className="tw-hidden lg:tw-block tw-w-full lg:tw-w-1/4" data-aos="fade-right">
                        <div className="tw-bg-white tw-shadow-md tw-rounded-2xl tw-p-5 tw-sticky tw-top-24 tw-space-y-6">
                            <div className="tw-flex tw-items-center tw-justify-between">
                                <h5 className="tw-font-bold tw-text-2xl">Filter</h5>
                                <button onClick={clearAll} className="tw-text-xs tw-font-medium tw-text-gray-500 hover:tw-text-black">Reset</button>
                            </div>

                            <div>
                                <h6 className="tw-text-sm tw-font-semibold tw-text-gray-600 tw-mb-2">Category</h6>
                                {catError && <div className="tw-text-xs tw-text-red-600 tw-mb-2">{catError}</div>}
                                {loadingInitialCats ? (
                                    <SkeletonCategories />
                                ) : (
                                    <ul className="tw-space-y-2">
                                        <li>
                                            <FilterItem
                                                active={selectedCategory === null}
                                                onClick={() => setSelectedCategory(null)}
                                                icon="mdi:folder-outline"
                                                label="All"
                                            />
                                        </li>
                                        {categories.map((cat) => (
                                            <li key={cat.id}>
                                                <FilterItem
                                                    active={selectedCategory === cat.id}
                                                    onClick={() => setSelectedCategory(cat.id)}
                                                    icon="mdi:tag-outline"
                                                    label={cat.name}
                                                />
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>

                            <div>
                                <h6 className="tw-text-sm tw-font-semibold tw-text-gray-600 tw-mb-2">Sort by</h6>
                                <div className="tw-grid tw-grid-cols-2 tw-gap-2">
                                    <SortPill label="Default" value="" current={sort} onChange={setSort} />
                                    <SortPill label="Price ↑" value="price_low" current={sort} onChange={setSort} />
                                    <SortPill label="Price ↓" value="price_high" current={sort} onChange={setSort} />
                                </div>
                            </div>
                        </div>
                    </aside>

                    {/* Content */}
                    <main className="tw-w-full lg:tw-w-3/4 tw-px-1 md:tw-px-0">
                        <div className="tw-mb-3 tw-flex tw-items-center tw-justify-between">
                            {!loadingProducts && (
                                <span className="tw-text-sm tw-text-gray-500">{products.length} result(s)</span>
                            )}

                            {/* mobile sort select */}
                            <div className="md:tw-hidden">
                                <label className="tw-sr-only" htmlFor="sort">Sort</label>
                                <select
                                    id="sort"
                                    value={sort}
                                    onChange={(e) => setSort(e.target.value)}
                                    className="tw-text-sm tw-border tw-border-gray-200 tw-rounded-xl tw-px-3 tw-py-2"
                                >
                                    <option value="">Default</option>
                                    <option value="price_low">Price ↑</option>
                                    <option value="price_high">Price ↓</option>
                                </select>
                            </div>
                        </div>

                        {prodError && <div className="tw-text-sm tw-text-red-600 tw-mb-4">{prodError}</div>}

                        {loadingProducts ? (
                            <SkeletonProductGrid />
                        ) : products.length > 0 ? (
                            <div className="tw-grid tw-grid-cols-1 sm:tw-grid-cols-1 md:tw-grid-cols-2 xl:tw-grid-cols-3 tw-gap-3 md:tw-gap-6">
                                {products.map((p, i) => (
                                    <div key={p.id} className="fade-up" style={{ animationDelay: `${i * 40}ms` }}>
                                        <ProductCard
                                            product={p}
                                            onQuickView={setQuick}
                                            onToggleCompare={toggleCompare}
                                            isCompared={compare.includes(p.id)}
                                        />
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <EmptyState />
                        )}
                    </main>
                </div>
            </div>

            {/* Footer */}
            <Footer />

            {/* Mobile Filter Sheet */}
            <MobileSheet open={showFilterSheet} title="Filters" onClose={() => setShowFilterSheet(false)}>
                <div className="tw-space-y-6">
                    <div className="tw-flex tw-items-center tw-justify-between">
                        <button onClick={clearAll} className="tw-text-xs tw-font-medium tw-text-gray-500 hover:tw-text-black">Reset</button>
                    </div>

                    <div>
                        <h6 className="tw-text-sm tw-font-semibold tw-text-gray-600 tw-mb-2">Category</h6>
                        {catError && <div className="tw-text-xs tw-text-red-600 tw-mb-2">{catError}</div>}
                        {loadingInitialCats ? (
                            <SkeletonCategories />
                        ) : (
                            <ul className="tw-space-y-2">
                                <li>
                                    <FilterItem
                                        active={selectedCategory === null}
                                        onClick={() => setSelectedCategory(null)}
                                        icon="mdi:folder-outline"
                                        label="All"
                                    />
                                </li>
                                {categories.map((cat) => (
                                    <li key={cat.id}>
                                        <FilterItem
                                            active={selectedCategory === cat.id}
                                            onClick={() => setSelectedCategory(cat.id)}
                                            icon="mdi:tag-outline"
                                            label={cat.name}
                                        />
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    <div>
                        <h6 className="tw-text-sm tw-font-semibold tw-text-gray-600 tw-mb-2">Sort by</h6>
                        <div className="tw-grid tw-grid-cols-2 tw-gap-2">
                            <SortPill label="Default" value="" current={sort} onChange={setSort} />
                            <SortPill label="Price ↑" value="price_low" current={sort} onChange={setSort} />
                            <SortPill label="Price ↓" value="price_high" current={sort} onChange={setSort} />
                        </div>
                    </div>

                    <button onClick={() => setShowFilterSheet(false)} className="tw-w-full tw-bg-black tw-text-white tw-font-semibold tw-px-4 tw-py-3 tw-rounded-xl">
                        Apply
                    </button>
                </div>
            </MobileSheet>

            {/* Quick View */}
            <QuickView product={quick} onClose={() => setQuick(null)} />

            {/* Compare tray */}
            {compare.length > 0 && (
                <div className="tw-fixed tw-bottom-0 tw-inset-x-0 tw-z-40 tw-bg-white dark:tw-bg-gray-900 tw-border-t tw-border-gray-200 dark:tw-border-gray-800 tw-p-3 tw-flex tw-items-center tw-justify-between">
                    <span className="tw-text-sm">{compare.length} selected</span>
                    <div className="tw-flex tw-items-center tw-gap-2">
                        <button onClick={() => setCompare([])} className="tw-text-xs tw-underline">Clear</button>
                        <button className="tw-bg-black tw-text-white tw-rounded-xl tw-px-4 tw-py-2">Compare</button>
                    </div>
                </div>
            )}
        </>
    );
};

export default AllProducts;
