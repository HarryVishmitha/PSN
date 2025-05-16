import React, { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import { Head, router } from '@inertiajs/react'
import UserDashboard from '../../Layouts/UserDashboard'
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
                        <div className="row">
                            <div className="col-sm-2 tw-p-4">
                                <div className="card border rounded tw-shadow-sm hover:tw-shadow-xl">
                                    <img src="/assets/images/asset/productImg.jpg" class="card-img-top" alt="Product Image" />
                                    <div className="card-body">
                                        <div class="tw-text-xl tw-font-bold tw-tracking-tight text-primary-light">Apple Watch Series 7 GPS, Aluminium Case, Starlight Sport</div>
                                        
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