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
                                    <span className="tw-font-semibold tw-text-black dark:tw-text-white">
                                        {product.pricing_method == "standard" ? product.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : null}
                                        {product.pricing_method == "roll" ? product.price_per_sqft.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : null}
                                        {product.pricing_method == "standard" ? <span className="tw-text-sm tw-text-gray-500 dark:tw-text-gray-400 tw-font-normal tw-ms-2"> per unit</span> : null}
                                        {product.pricing_method == "roll" ? <span className="tw-text-sm tw-font-normal tw-text-gray-500 dark:tw-text-gray-400 tw-ms-2"> per Sq.Feet</span> : null}
                                    </span>
                                </div>

                                {/* varients section */}
                                <div className="varients lg:tw-grid lg:tw-grid-cols-2 lg:tw-gap-4 xl:tw-gap-8 tw-mt-4">
                                    {variantGroups.map((group, gi) => (
                                        <div key={group.name} className="tw-text-gray-700 dark:tw-text-gray-300 tw-text-sm">
                                            <div className="tw-font-semibold">{group.label}</div>
                                            <div className="varient-values tw-mt-2 tw-flex tw-flex-wrap">
                                                {group.options.map((opt, idx) => {
                                                    const inputId = `${group.name}-${opt}-${idx}`;
                                                    return (
                                                        <div key={inputId} className="tw-mr-2 tw-mb-2">
                                                            <input
                                                                type="radio"
                                                                name={group.name}
                                                                id={inputId}
                                                                value={opt}
                                                                className="tw-hidden tw-peer"
                                                                defaultChecked={group.name === 'color' && opt === 'Blue'}
                                                            />
                                                            <label
                                                                htmlFor={inputId}
                                                                className={`
                                                                    tw-transition tw-cursor-pointer tw-px-4 tw-py-1 tw-rounded-md tw-border tw-text-sm
                                                                    tw-border-gray-500
                                                                    peer-checked:tw-bg-blue-600 peer-checked:tw-text-white peer-checked:tw-border-blue-600
                                                                    `}
                                                            >
                                                                {opt}
                                                            </label>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    ))}
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
                        <details
                            className="dark:tw-border-gray-600 tw-rounded-lg tw-mb-4"
                            onToggle={e => setIsOpen(e.currentTarget.open)}
                        >
                            <summary className="tw-flex tw-justify-between tw-items-center tw-p-4 tw-cursor-pointer tw-text-gray-800 dark:tw-text-gray-200 tw-font-medium tw-bg-emerald-200 dark:tw-bg-emerald-900 tw-rounded-lg">
                                Group 1
                                <Icon
                                    icon={isOpen ? 'mdi:minus' : 'mdi:plus'}
                                    className="tw-w-5 tw-h-5"
                                />
                            </summary>
                            <div
                                className="design-section tw-mt-5 lg:tw-grid lg:tw-grid-cols-5 lg:tw-gap-6 xl:tw-gap-6 tw-border tw-border-gray-300 tw-p-3 tw-rounded-lg tw-overflow-hidden tw-transition-all tw-duration-300 tw-ease-in-out">
                                {/* group 1 */}
                                {Array.from({ length: 15 }).map((_, index) => (
                                    <div key={index} className="tw-bg-gray-200 dark:tw-bg-gray-700 tw-rounded-lg tw-p-4 tw-flex tw-items-center tw-justify-center">
                                        <span className="tw-text-gray-600 dark:tw-text-gray-300">Design {index + 1}</span>
                                    </div>
                                ))}
                            </div>
                        </details>
                    </div>
                </div>

            </UserDashboard>
        </>
    );
}

export default ProductView
