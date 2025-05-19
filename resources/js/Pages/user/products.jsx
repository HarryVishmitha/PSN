import React, { useState, useEffect, useRef } from 'react'
import { Head, Link, usePage, router } from '@inertiajs/react';
import axios from 'axios'
import UserDashboard from '@/Layouts/UserDashboard'
import Breadcrumb from "@/components/Breadcrumb"
import { Icon } from "@iconify/react"
import CookiesV from '@/Components/CookieConsent'
import Alert from "@/Components/Alert"
import Meta from "@/Components/Metaheads"

const Products = ({ userDetails, WG, wginactivating }) => {
    const [loading, setLoading] = useState(false);
    const [alert, setAlert] = useState(null)    // { type, message }

    useEffect(() => {
        if (wginactivating) {
            setAlert({ type: 'warning', message: 'Your account is being inactivated. Please wait.' });
        }
    }, [wginactivating]);

    return (
        <>
            <Head title='Products' />
            <Meta title="Products" description={`Products for ${WG}`} />
            <UserDashboard userDetails={userDetails} WG={WG}>
                <Breadcrumb title="Products" />
                {alert && <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} />}
                {wginactivating && (
                    <div className="alert alert-warning d-flex align-items-center" role="alert">
                        <Icon icon="ri:information-line" className="tw-text-2xl tw-mr-2" />
                        <div>
                            Your account is being inactivated. Please contact admins for more information.
                        </div>
                    </div>
                )}
                <div className="card">
                    <div className="card-body">
                        <div className="row gy-2 gx-3 liagn-tems-center tw-gap-x-4 tw-gap-2">
                            {/* Product Tile */}
                            <div className="col-sm-6 col-md-4 col-lg-2 card border rounded tw-shadow-sm hover:tw-shadow-xl col-auto">
                                <div className="board12342">
                                    <img src="/assets/images/asset/productImg.jpg" className="card-img-top" alt="Product Image" />
                                    <div className="card-body">
                                        <Link class="tw-text-xl tw-font-bold tw-tracking-tight text-primary-light tw-mt-3 tw-cursor-pointer">Apple Watch Series 7 GPS, Aluminium Case, Starlight Sport</Link>
                                        <p className="text-secondary-light tw-text-sm tw-line-clamp-3">
                                            Lorem ipsum dolor sit amet consectetur adipisicing elit.
                                        </p>
                                        <div className="d-flex justify-content-between align-items-center tw-mt-4">
                                            <div className="tw-text-lg tw-font-bold text-primary-light">$399.00</div>
                                            <button className="tw-cursor-pointer d-flex align-items-center gap-2 tw-text-blue-400 hover:tw-text-blue-600" onClick={() => router.get('/products/1')}>More Info <Icon icon="pajamas:long-arrow" width="16" height="16" /></button>
                                        </div>

                                    </div>
                                </div>
                            </div>

                        </div>
                    </div>
                </div>
            </UserDashboard>
            <CookiesV />
        </>
    );
}

export default Products;