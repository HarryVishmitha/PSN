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
                        <div className="tw-font-semibold tw-text-2xl tw-text-black dark:tw-text-white">Product Name goes here.</div>
                        <div className="tw-text-green-500 d-flex align-items-center tw-text-sm"><span className='tw-me-1'><Icon icon='jam:store' /></span>In Stock</div>
                        <div className="lg:tw-grid lg:tw-grid-cols-2 lg:tw-gap-8 xl:tw-gap-16 tw-mt-4">
                            <div className="image-section">hi</div>
                            <div className="details-section">
                                <div className="tw-text-2xl tw-text-black dark:tw-text-white tw-font-semibold">Product name again here</div>
                                <div className="tw-text-green-500 d-flex align-items-center tw-text-sm"><span className='tw-me-1'><Icon icon='jam:store' /></span>In Stock</div>
                                <div className="d-flex align-items-center">
                                    <button className="btn tw-bg-gray-50 dark:tw-bg-gray-700  hover:tw-bg-gray-200 hover:dark:tw-bg-gray-500 tw-text-black hover:tw-text-blue-600 tw-me-4 tw-min-w-48 dark:tw-text-gray-300 hover:dark:tw-text-white tw-border-gray-400 dark:tw-border-gray-500 hover:dark:tw-border-gray-300 tw-border-2 tw-rounded-lg tw-py-2 tw-px-4 d-flex tw-text-inlien">
                                        <Icon icon="mdi:heart-outline" className="tw-text-xl tw-mr-2" />
                                        Add to favorites
                                    </button>
                                    <div className="btn btn-primary tw-min-w-48">Hi</div>
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
