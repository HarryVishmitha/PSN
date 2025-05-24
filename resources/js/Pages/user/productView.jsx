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
    const [loading, setLoading] = useState(true)
    const [alert, setAlert] = useState(null)    // { type, message }

    const variantGroups = [
        { label: 'Color', name: 'color', options: ['Green', 'Pink', 'Silver', 'Blue', 'Blue', 'Blue', 'Blue', 'Blue', 'Blue', 'Blue', 'Blue', 'Blue'] },
        { label: 'Variant type 2', name: 'variant2', options: ['Green', 'Pink', 'Silver', 'Blue', 'Blue', 'Blue', 'Blue', 'Blue'] },
        { label: 'Variant type 3', name: 'variant3', options: ['Green', 'Pink', 'Silver', 'Blue', 'Blue', 'Blue', 'Blue', 'Blue', 'Blue'] },
    ];

    const images = [
        {
            light: 'https://flowbite.s3.amazonaws.com/blocks/e-commerce/imac-front.svg',
            dark: 'https://flowbite.s3.amazonaws.com/blocks/e-commerce/imac-front-dark.svg',
        },
        {
            light: 'https://flowbite.s3.amazonaws.com/blocks/e-commerce/imac-back.svg',
            dark: 'https://flowbite.s3.amazonaws.com/blocks/e-commerce/imac-back-dark.svg',
        },
        {
            light: 'https://flowbite.s3.amazonaws.com/blocks/e-commerce/imac-side.svg',
            dark: 'https://flowbite.s3.amazonaws.com/blocks/e-commerce/imac-side-dark.svg',
        },
    ];

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
                                {/* Main image */}
                                <div className="tw-shrink-0 tw-max-w-md lg:tw-max-w-lg tw-mx-auto">
                                    <img
                                        className="tw-w-full dark:tw-hidden"
                                        src={images[selectedIndex].light}
                                        alt={`View ${selectedIndex + 1}`}
                                    />
                                    <img
                                        className="tw-w-full tw-hidden dark:tw-block"
                                        src={images[selectedIndex].dark}
                                        alt={`Dark view ${selectedIndex + 1}`}
                                    />
                                </div>

                                {/* Thumbnails */}
                                <div className="tw-flex tw-justify-center tw-mt-6">
                                    <div className="tw-flex tw-gap-5">
                                        {images.map((img, idx) => (
                                            <img
                                                key={idx}
                                                className={`
                                                    tw-w-16 tw-h-16 tw-object-cover tw-rounded-lg tw-cursor-pointer
                                                    ${selectedIndex === idx ? 'tw-ring-2 tw-ring-blue-600' : ''}
                                                `}
                                                src={img.light}
                                                alt={`Thumbnail ${idx + 1}`}
                                                onClick={() => setSelectedIndex(idx)}
                                            />
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="details-section">
                                <div className="tw-text-2xl tw-text-black dark:tw-text-white tw-font-semibold">Product name again here</div>
                                <div className="tw-text-green-500 d-flex align-items-center tw-text-sm"><span className='tw-me-1'><Icon icon='jam:store' /></span>In Stock</div>
                                {/* price section */}
                                <div className="tw-text-black dark:tw-text-white tw-text-xl tw-mt-4">
                                    <span className="tw-text-semibold tw-text-gray-700 dark:tw-text-gray-400 tw-text-sm tw-me-1">LKR.</span>
                                    <span className="tw-font-semibold tw-text-black dark:tw-text-white">450.00</span>
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
                                        __html: `
Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.
` }}
                                />

                                <hr class="my-6 md:my-8 border-gray-200 dark:border-gray-800" />
                                {/* additional information section */}
                                <div className="additional-info tw-text-sm tw-text-gray-600 dark:tw-text-gray-400 tw-mt-3 tw-mb-3">
                                    <div className="categories">
                                        <span className="tw-font-semibold tw-text-xs tw-text-gray-700 dark:tw-text-gray-300 tw-me-2">Categories:</span>
                                        <span className="tw-text-blue-500 tw-me-2 tw-text-xs">Category 1</span>
                                        <span className="tw-text-blue-500 tw-me-2 tw-text-xs">Category 2</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

            </UserDashboard>
        </>
    );
}

export default ProductView
