// resources/js/Pages/Aproducts.jsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Head } from '@inertiajs/react';
import axios from 'axios';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import AOS from 'aos';
import 'aos/dist/aos.css';
import ProductCard from '@/Components/ProductCard';
import { Icon } from '@iconify/react';

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
                <div className="tw-h-9 tw-rounded tw-bg-gray-200 tw-overflow-hidden">
                    <Shimmer />
                </div>
            </li>
        ))}
    </ul>
);

const SkeletonProductGrid = ({ count = 9 }) => (
    <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-3 xl:tw-grid-cols-3 tw-gap-6">
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

/* ---------------------- main ---------------------- */
const AllProducts = () => {
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);         // [{id,name}]
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [sort, setSort] = useState('');
    const [q, setQ] = useState('');
    const [qCommitted, setQCommitted] = useState('');         // debounced value

    const [loadingInitialCats, setLoadingInitialCats] = useState(true);
    const [loadingProducts, setLoadingProducts] = useState(true);
    const [catError, setCatError] = useState(null);
    const [prodError, setProdError] = useState(null);

    // Preselect category via ?category_id=
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const cid = params.get('category_id');
        if (cid) setSelectedCategory(Number(cid));
    }, []);

    useEffect(() => {
        AOS.init({ once: true, duration: 600 });
    }, []);

    /* -------- fetch categories (correct endpoint!) -------- */
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

    useEffect(() => {
        fetchCategories();
    }, []);

    /* -------- debounce search -------- */
    useEffect(() => {
        const t = setTimeout(() => setQCommitted(q.trim()), 350);
        return () => clearTimeout(t);
    }, [q]);

    /* -------- fetch products on filters change -------- */
    useEffect(() => {
        fetchProducts();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedCategory, sort, qCommitted]);

    const fetchProducts = async () => {
        setProdError(null);
        setLoadingProducts(true);
        try {
            const params = {};
            if (selectedCategory !== null && selectedCategory !== undefined) params.category_id = selectedCategory;
            if (sort) params.sort = sort;
            if (qCommitted) params.q = qCommitted;

            const res = await axios.get('/api/products', {
                params,
                headers: { Accept: 'application/json' },
            });
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

    return (
        <>
            <Head title="All Products - Printair" />
            <Header />

            <div className="tw-container tw-mx-auto tw-py-8">
                {/* -------- top filter bar -------- */}
                <div className="tw-bg-white tw-rounded-2xl tw-shadow-sm tw-px-4 md:tw-px-6 tw-py-4 tw-mb-6 tw-flex tw-flex-col md:tw-flex-row tw-gap-3 tw-items-start md:tw-items-center tw-justify-between">
                    <div className="tw-flex tw-items-center tw-gap-3 tw-flex-wrap">
                        <h3 className="tw-text-3xl tw-font-bold">All Products</h3>
                        {/* active chips */}
                        <div className="tw-flex tw-items-center tw-gap-2 tw-flex-wrap">
                            <Chip icon="mdi:folder-outline" label={activeCategoryName} onClear={selectedCategory !== null ? () => setSelectedCategory(null) : null} />
                            {sort && <Chip icon="mdi:sort" label={sort === 'price_low' ? 'Price ↑' : sort === 'price_high' ? 'Price ↓' : sort} onClear={() => setSort('')} />}
                            {qCommitted && <Chip icon="mdi:magnify" label={`“${qCommitted}”`} onClear={() => { setQ(''); setQCommitted(''); }} />}
                        </div>
                    </div>

                    {/* search box */}
                    <div className="tw-w-full md:tw-w-80 tw-relative">
                        <Icon icon="mdi:magnify" className="tw-absolute tw-left-3 tw-top-1/2 -tw-translate-y-1/2 tw-text-gray-400 tw-text-xl" />
                        <input
                            value={q}
                            onChange={(e) => setQ(e.target.value)}
                            placeholder="Search products..."
                            className="tw-w-full tw-pl-10 tw-pr-3 tw-py-2 tw-rounded-xl tw-border tw-border-gray-200 focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-black/5"
                        />
                    </div>
                </div>

                <div className="tw-flex tw-flex-col lg:tw-flex-row tw-gap-8">
                    {/* -------- sidebar -------- */}
                    <aside className="tw-w-full lg:tw-w-1/4" data-aos="fade-right">
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

                    {/* -------- content -------- */}
                    <main className="tw-w-full lg:tw-w-3/4 tw-px-3 md:tw-px-0">
                        <div className="tw-mb-2 tw-flex tw-justify-end">
                            {!loadingProducts && (
                                <span className="tw-text-sm tw-text-gray-500">{products.length} result(s)</span>
                            )}
                        </div>

                        {prodError && <div className="tw-text-sm tw-text-red-600 tw-mb-4">{prodError}</div>}

                        {loadingProducts ? (
                            <SkeletonProductGrid />
                        ) : products.length > 0 ? (
                            <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-3 xl:tw-grid-cols-3 tw-gap-6">
                                {products.map((product) => (
                                    <ProductCard product={product} key={product.id} />
                                ))}
                            </div>
                        ) : (
                            <EmptyState />
                        )}
                    </main>
                </div>
            </div>

            <Footer />
        </>
    );
};

/* ---------------------- small UI pieces ---------------------- */
const FilterItem = ({ active, onClick, icon, label }) => (
    <button
        onClick={onClick}
        className={`tw-w-full tw-flex tw-items-center tw-gap-2 tw-text-sm tw-p-2 tw-rounded-xl tw-transition ${active ? 'tw-bg-black tw-text-white' : 'tw-bg-gray-100 hover:tw-bg-gray-200'
            }`}
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
    <span className="tw-inline-flex tw-items-center tw-gap-1 tw-text-xs tw-bg-gray-100 tw-text-gray-700 tw-rounded-full tw-px-2.5 tw-py-1">
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

export default AllProducts;

/* Tailwind keyframes (global, once):
@keyframes shimmer {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}
*/
