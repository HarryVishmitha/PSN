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
            <Head title="Products" />
            <Meta title="Products" description={`Products for ${WG}`} />
            <UserDashboard userDetails={userDetails} WG={WG}>
                <Breadcrumb title="Products" />

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
                        
                    </div>
                </div>

            </UserDashboard>
        </>
    );
}

export default ProductView