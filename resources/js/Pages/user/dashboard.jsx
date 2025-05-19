import React, { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import { Head, router } from '@inertiajs/react'
import UserDashboard from '../../Layouts/UserDashboard'
import Breadcrumb from "@/components/Breadcrumb"
import { Icon } from "@iconify/react"
import CookiesV from '@/Components/CookieConsent'
import Alert from "@/Components/Alert"
import Meta from "@/Components/Metaheads"

const Dashboard = ({ userDetails, WG, wgInactive, wginactivating }) => {
    const [loading, setLoading] = useState(false);
    const [alert, setAlert] = useState(null)    // { type, message }

    useEffect(() => {
        if (wgInactive) {
            setAlert({ type: 'error', message: 'Your account is inactive. Please contact support.' });
        } else if (wginactivating) {
            setAlert({ type: 'warning', message: 'Your account is being inactivated. Please wait.' });
        }
    }, [wgInactive, wginactivating]);

    return (
        <>
            <Head title='User Dashboard' />
            <Meta title="Dashboard" description="Dashboard" />
            <UserDashboard userDetails={userDetails} WG={WG} wgInactive={wgInactive} wginactivating={wginactivating}>
                <Breadcrumb title="Dashboard" />
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
                        <div className="d-flex justify-content-center align-items-center flex-column">
                            <img src="/assets/images/asset/building.png" alt="building" className="img-fluid mb-3 tw-w-96" />
                            <div className="tw-ml-4 d-flex align-items-center flex-column">
                                <div className="h5 tw-font-semibold tw-text-center">Welcome to Printair Advertising</div>
                                <p className='tw-w-2/3 tw-text-center'>It's pleasure to meet you! Always we try to give you better service. Our developers building your dashboard right now. Thank you for your patient!</p>
                            </div>
                        </div>
                    </div>
                </div>
            </UserDashboard>
            <CookiesV />
        </>
    );
}
export default Dashboard;
