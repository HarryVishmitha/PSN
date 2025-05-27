import React, { useState, useEffect, useRef } from 'react'
import { Head, Link, router } from '@inertiajs/react'
import axios from 'axios'
import UserDashboard from '@/Layouts/UserDashboard'
import Breadcrumb from '@/components/Breadcrumb'
import { Icon } from '@iconify/react'
import CookiesV from '@/Components/CookieConsent'
import Alert from '@/Components/Alert'
import Meta from '@/Components/Metaheads'

const ProductView = ({ userDetails, WG, product, wginactivating }) => {
    console.log(product);
    const [loading, setLoading] = useState(true)
    const [alert, setAlert] = useState(null)    // { type, message }
    const [isOpen, setIsOpen] = useState(false)
    const [selectedVariants, setSelectedVariants] = useState({})
    // designs state
    const [designs, setDesigns] = useState([]);
    const [groupedDesigns, setGroupedDesigns] = useState({});
    const [loadingDesigns, setLoadingDesigns] = useState(true);


    const variantGroups = [
        { label: 'Color', name: 'color', options: ['Green', 'Pink', 'Silver', 'Blue', 'Blue', 'Blue', 'Blue', 'Blue', 'Blue', 'Blue', 'Blue', 'Blue'] },
        { label: 'Variant type 2', name: 'variant2', options: ['Green', 'Pink', 'Silver', 'Blue', 'Blue', 'Blue', 'Blue', 'Blue'] },
        { label: 'Variant type 3', name: 'variant3', options: ['Green', 'Pink', 'Silver', 'Blue', 'Blue', 'Blue', 'Blue', 'Blue', 'Blue'] },
    ];

    // const images = [
    //     {
    //         light: 'https://flowbite.s3.amazonaws.com/blocks/e-commerce/imac-front.svg',
    //         dark: 'https://flowbite.s3.amazonaws.com/blocks/e-commerce/imac-front-dark.svg',
    //     },
    //     {
    //         light: 'https://flowbite.s3.amazonaws.com/blocks/e-commerce/imac-back.svg',
    //         dark: 'https://flowbite.s3.amazonaws.com/blocks/e-commerce/imac-back-dark.svg',
    //     },
    //     {
    //         light: 'https://flowbite.s3.amazonaws.com/blocks/e-commerce/imac-side.svg',
    //         dark: 'https://flowbite.s3.amazonaws.com/blocks/e-commerce/imac-side-dark.svg',
    //     },
    // ];

    // Prepare images array from product.images
    const images = product.images && product.images.length > 0
        ? product.images.map(img => img.image_url)
        : ['/images/default-product.png']

    const [selectedIndex, setSelectedIndex] = useState(0);

    // Group variants and extract subvariants
    const groupedVariants = product.variants.reduce((acc, v) => {
        let group = acc.find(g => g.name === v.variant_name)
        if (!group) {
            group = { name: v.variant_name, label: v.variant_name, options: [] }
            acc.push(group)
        }
        const subs = (v.subvariants || []).map(sv => ({
            value: sv.subvariant_value,
            priceAdjustment: parseFloat(sv.price_adjustment) || 0,
        }))
        group.options.push({
            value: v.variant_value,
            priceAdjustment: parseFloat(v.price_adjustment) || 0,
            subvariants: subs,
            subLabel: subs.length ? v.subvariants[0].subvariant_name : ''
        })
        return acc
    }, [])

    // Compute total price: base + selected variant adjustments + subvariant adjustments
    const computePrice = () => {
        const base = parseFloat(
            product.pricing_method === 'roll'
                ? product.price_per_sqft
                : product.price
        ) || 0
        return groupedVariants.reduce((sum, group) => {
            const sel = selectedVariants[group.name]
            if (!sel) return sum
            const opt = group.options.find(o => o.value === sel)
            let total = sum + (opt?.priceAdjustment || 0)
            const subSel = selectedVariants[`${group.name}-sub`]
            if (subSel && opt) {
                const subOpt = opt.subvariants.find(s => s.value === subSel)
                total += (subOpt?.priceAdjustment || 0)
            }
            return total
        }, base)
    }

    useEffect(() => {
        // 1️⃣ skeleton loader
        const timer = setTimeout(() => setLoading(false), 300);

        // 2️⃣ start designs-loading spinner
        setLoadingDesigns(true);

        // 3️⃣ fetch & group
        axios.get(`/user/api/${product.id}/designs`)
            .then(res => {
                const data = res.data || [];
                setDesigns(data);

                // group by “width x height”
                const grouped = data.reduce((acc, d) => {
                    const key = `${d.width} x ${d.height}`;
                    if (!acc[key]) acc[key] = [];
                    acc[key].push(d);
                    return acc;
                }, {});
                setGroupedDesigns(grouped);
            })
            .catch(() => {
                setDesigns([]);
                setGroupedDesigns({});
            })
            .finally(() => {
                // 4️⃣ stop designs-loading spinner
                setLoadingDesigns(false);
            });

        return () => clearTimeout(timer);
    }, [product.id]);




    return (
        <>
            <Head title={product.name} />
            <Meta title={product.name} description={product.meta_description} />
            <UserDashboard userDetails={userDetails} WG={WG}>
                <Breadcrumb title={`Product View`} />

                {alert && (
                    <Alert
                        type={alert.type}
                        message={alert.message}
                        onClose={() => setAlert(null)}
                    />
                )}

                {wginactivating && (
                    <div className="alert alert-warning d-flex align-items-center" role="alert">
                        <Icon icon="ri:information-line" className="tw-text-2xl tw-mr-2" />
                        <div>
                            Your account is being inactivated. Please contact admins for more
                            information.
                        </div>
                    </div>
                )}

                <div className="card">
                    <div className="card-body">
                        <div className="lg:tw-grid lg:tw-grid-cols-2 lg:tw-gap-8 xl:tw-gap-16 tw-mt-4">
                            {/* image section */}
                            <div className="image-section tw-w-full">
                                <div className="tw-shrink-0 tw-max-w-md lg:tw-max-w-lg tw-mx-auto">
                                    <img
                                        className="tw-w-full tw-object-contain"
                                        src={images[selectedIndex]}
                                        alt={`View ${selectedIndex + 1}`}
                                    />
                                </div>

                                {/* Thumbnails */}
                                <div className="tw-flex tw-justify-center tw-mt-6">
                                    <div className="tw-flex tw-gap-5">
                                        {images.map((imgUrl, idx) => (
                                            <img
                                                key={idx}
                                                className={`
                                                    tw-w-16 tw-h-16 tw-object-cover tw-rounded-lg tw-cursor-pointer
                                                    ${selectedIndex === idx ? 'tw-ring-2 tw-ring-blue-600' : ''}
                                                    `}
                                                src={imgUrl}
                                                alt={`Thumbnail ${idx + 1}`}
                                                onClick={() => setSelectedIndex(idx)}
                                            />
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="details-section">
                                <div className="tw-text-2xl tw-text-black dark:tw-text-white tw-font-semibold">{product.name}</div>
                                <div className="tw-text-green-500 d-flex align-items-center tw-text-sm"><span className='tw-me-1'><Icon icon='jam:store' /></span>In Stock</div>
                                {/* price section */}
                                <div className="tw-text-black dark:tw-text-white tw-text-xl tw-mt-4">
                                    <span className="tw-text-semibold tw-text-gray-700 dark:tw-text-gray-400 tw-text-sm tw-me-1">LKR.</span>
                                    <span className="tw-font-semibold">
                                        {computePrice().toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </span>
                                    <span className="tw-text-sm tw-font-normal tw-text-gray-500 dark:tw-text-gray-400 tw-ms-2">
                                        per {product.pricing_method === 'roll' ? 'Sq.Ft' : 'unit'}
                                    </span>
                                </div>

                                {/* varients section */}
                                <div className="varients lg:tw-grid lg:tw-grid-cols-2 lg:tw-gap-4 xl:tw-gap-8 tw-mt-4">
                                    {groupedVariants.map(group => {
                                        const selected = selectedVariants[group.name];
                                        const parentOpt = group.options.find(o => o.value === selected);
                                        return (
                                            <div key={group.name} className="tw-text-gray-700 dark:tw-text-gray-300 tw-text-sm">
                                                <div className="tw-font-semibold">{group.label}</div>
                                                <div className="varient-values tw-mt-2 tw-flex tw-flex-wrap">
                                                    {group.options.map((opt, idx) => (
                                                        <div key={`${group.name}-${opt.value}-${idx}`} className="tw-mr-2 tw-mb-2">
                                                            <input
                                                                type="radio"
                                                                name={group.name}
                                                                id={`${group.name}-${opt.value}-${idx}`}
                                                                value={opt.value}
                                                                checked={selected === opt.value}
                                                                onChange={() => setSelectedVariants({ ...selectedVariants, [group.name]: opt.value })}
                                                                className="tw-hidden tw-peer"
                                                            />
                                                            <label
                                                                htmlFor={`${group.name}-${opt.value}-${idx}`}
                                                                className="tw-transition tw-cursor-pointer tw-px-4 tw-py-1 tw-rounded-md tw-border tw-text-sm tw-border-gray-500 peer-checked:tw-bg-blue-600 peer-checked:tw-text-white peer-checked:tw-border-blue-600"
                                                            >
                                                                {opt.value}
                                                            </label>
                                                        </div>
                                                    ))}
                                                </div>

                                                {/* Only render subvariants for this group when the selected option has them */}
                                                {parentOpt && parentOpt.subvariants.length > 0 && (
                                                    <div className="tw-mt-4">
                                                        <div className="tw-font-semibold">{parentOpt.subLabel}</div>
                                                        <div className="varient-values tw-mt-2 tw-flex tw-flex-wrap">
                                                            {parentOpt.subvariants.map((sub, si) => (
                                                                <div key={`${group.name}-sub-${sub.value}-${si}`} className="tw-mr-2 tw-mb-2">
                                                                    <input
                                                                        type="radio"
                                                                        name={`${group.name}-sub`}
                                                                        id={`${group.name}-sub-${sub.value}-${si}`}
                                                                        value={sub.value}
                                                                        checked={selectedVariants[`${group.name}-sub`] === sub.value}
                                                                        onChange={() => setSelectedVariants({ ...selectedVariants, [`${group.name}-sub`]: sub.value })}
                                                                        className="tw-hidden tw-peer"
                                                                    />
                                                                    <label
                                                                        htmlFor={`${group.name}-sub-${sub.value}-${si}`}
                                                                        className="tw-transition tw-cursor-pointer tw-px-4 tw-py-1 tw-rounded-md tw-border tw-text-sm tw-border-gray-500 peer-checked:tw-bg-blue-600 peer-checked:tw-text-white peer-checked:tw-border-blue-600"
                                                                    >
                                                                        {sub.value}
                                                                    </label>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )
                                    })}
                                </div>

                                {/* buttons section */}
                                <div className="lg:tw-grid lg:tw-grid-cols-2 lg:tw-gap-4 xl:tw-gap-8 tw-mt-4 lg:tw-w-3/4 tw-w-full tw-mb-3">
                                    <button className="btn tw-w-full tw-bg-gray-50 dark:tw-bg-gray-700
                                    hover:tw-bg-gray-200 hover:dark:tw-bg-gray-500 tw-text-gray-600
                                    hover:tw-text-blue-600 dark:tw-text-gray-300
                                    hover:dark:tw-text-white tw-border-gray-400 dark:tw-border-gray-500
                                    hover:dark:tw-border-gray-300 hover:tw-border-gray-400 tw-border tw-rounded-lg tw-py-2 tw-px-4
                                    d-flex align-items-center tw-text-center justify-content-center">
                                        <Icon icon="mdi:heart-outline" className="tw-text-xl tw-mr-2" />
                                        Add to favorites
                                    </button>
                                    <div className="btn btn-outline-primary tw-min-w-48 tw-w-full d-flex align-items-center justify-content-center tw-text-center tw-mt-3 lg:tw-mt-0">
                                        <Icon icon="mdi:cart-plus" className="tw-text-xl tw-mr-2" />
                                        Add to cart
                                    </div>
                                </div>

                                <hr class="my-6 md:my-8 border-gray-200 dark:border-gray-800" />

                                {/* description section */}
                                <div
                                    className="tw-text-gray-500 tw-text-sm dark:tw-text-gray-400 tw-leading-relaxed tw-mt-3"
                                    dangerouslySetInnerHTML={{
                                        __html: product.description || 'No description available for this product. Contact the shop for more details. Call us - 076 886 0175 or email us - contact@printair.lk'
                                    }}
                                />

                                <hr class="my-6 md:my-8 border-gray-200 dark:border-gray-800" />
                                {/* additional information section */}
                                <div className="additional-info tw-text-sm tw-text-gray-600 dark:tw-text-gray-400 tw-mt-3 tw-mb-3">
                                    <div className="categories">
                                        <span className="tw-font-semibold tw-text-xs tw-text-gray-700 dark:tw-text-gray-300 tw-me-2">Categories:</span>
                                        {product.categories && product.categories.length > 0 ? (
                                            product.categories.map((category, index) => (
                                                <span key={index} className="tw-text-blue-500 tw-me-2 tw-text-xs">{category.name}</span>
                                            ))
                                        ) : (
                                            <span className="tw-text-gray-400 dark:tw-text-gray-600 tw-me-2 tw-text-xs">Category 2</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <hr class="my-6 md:my-8 border-gray-200 dark:border-gray-800" />

                        {/* design section */}
                        <div className="tw-text-xl tw-text-black dark:tw-text-white tw-font-semibold">
                            Designs
                        </div>
                        <p className="tw-text-gray-500 dark:tw-text-gray-400 tw-text-sm tw-mb-4">
                            Here are some designs related to this product.
                        </p>
                        {loadingDesigns ? (
                            <div className="tw-flex tw-justify-center tw-items-center tw-py-6">
                                <Icon icon="mdi:loading" className="tw-animate-spin tw-text-2xl tw-text-gray-500" />
                                <span className="tw-text-gray-500">Loding Designs...</span>
                            </div>
                        ) : designs.length === 0 ? (
                            <div className="tw-text-center tw-text-gray-500 tw-py-6">No designs added to this product.</div>
                        ) : (
                            // one <details> per size group
                            Object.entries(groupedDesigns).map(([sizeLabel, items]) => (
                                <details
                                    key={sizeLabel}
                                    className="dark:tw-border-gray-600 tw-rounded-lg tw-mb-4"
                                    onToggle={e => setIsOpen(e.currentTarget.open)}
                                >
                                    <summary className="tw-flex tw-justify-between tw-items-center tw-p-4 tw-cursor-pointer tw-text-gray-800 dark:tw-text-gray-200 tw-font-medium tw-bg-emerald-200 dark:tw-bg-emerald-900 tw-rounded-lg">
                                        {sizeLabel}
                                        <Icon
                                            icon={isOpen ? 'mdi:minus' : 'mdi:plus'}
                                            className="tw-w-5 tw-h-5"
                                        />
                                    </summary>

                                    <div className="tw-mt-5 lg:tw-grid lg:tw-grid-cols-5 lg:tw-gap-6 xl:tw-gap-6 tw-border tw-border-gray-300 tw-p-3 tw-rounded-lg tw-overflow-hidden tw-transition-all tw-duration-300 tw-ease-in-out">
                                        {items.map(design => (
                                            <div
                                                key={design.id}
                                                className="tw-bg-gray-100 dark:tw-bg-gray-800 tw-rounded-lg tw-p-4 tw-flex tw-flex-col tw-items-center"
                                            >
                                                <img
                                                    src={design.image_url}
                                                    alt={design.name}
                                                    className="tw-w-full tw-rounded-md"
                                                />
                                                <div className="tw-mt-2 tw-text-xs tw-text-gray-700 dark:tw-text-gray-300 tw-text-center">
                                                    {design.name}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </details>
                            ))
                        )}
                    </div>
                </div>

            </UserDashboard>
        </>
    );
}

export default ProductView
