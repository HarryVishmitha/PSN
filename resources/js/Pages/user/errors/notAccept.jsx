import React, { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import { Head, router } from '@inertiajs/react'
import UserDashboard from '@/Layouts/UserDashboard'
import Breadcrumb from "@/components/Breadcrumb"
import { Icon } from "@iconify/react"
import CookiesV from '@/Components/CookieConsent'
import Alert from "@/Components/Alert"
import Meta from "@/Components/Metaheads"

const NotAccept = ({ userDetails, WG, wgInactive, wginactivating }) => {

    return (
        <>
            <Head title='404' />
            <Meta title="404" description="Product Not Available" />
            <div className="blockedFromSystem tw-h-screen tw-mx-4">
                <div className="d-flex justify-content-center align-items-center flex-column">
                    <div className="bImg">
                        <img src="/assets/images/asset/errors.png" alt="building" className="img-fluid mb-3 tw-w-full" />
                    </div>
                    <div className="bText">
                        <h2 className='tw-font-semibold tw-text-center tw-text-red-500'>404</h2>
                        <p className='tw-text-center'>Sorry! This product not available right now or you can't access to this product page. <br /> If you think this is mistake, contact us via WhatsApp. We are here to help us.</p>
                    </div>
                    <button className='btn btn-outline-primary tw-mt-4 tw-flex tw-justify-center' onClick={() => router.visit(route('user.products'))}>
                        Go Back to Products
                    </button>
                    <img src="/assets/images/logo-icon.png" alt="logo" className="img-fluid mb-3 tw-w-20 tw-mt-16" />
                    <div className='tw-font-bold tw-text-lg tw-text-gray-500'>Printair Advertising</div>
                    <div className='tw-text-sm tw-text-gray-500'>+94 76 886 0175 / +94 72 661 1748 / +94 71 358 5692</div>
                    <div className='tw-text-sm tw-text-gray-500'>contact@printair.lk / printair2@gmail.com</div>
                </div>
            </div>
            <CookiesV />
        </>
    );
}

export default NotAccept;