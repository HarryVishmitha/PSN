import React, { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import { Head, router } from '@inertiajs/react'
import UserDashboard from '@/Layouts/UserDashboard'
import Breadcrumb from "@/components/Breadcrumb"
import { Icon } from "@iconify/react"
import CookiesV from '@/Components/CookieConsent'
import Alert from "@/Components/Alert"
import Meta from "@/Components/Metaheads"

const WorkingGroups1 = ({ userDetails, msg, WG }) => {
    return (
        <>
            <Head title='Blocked' />
            <Meta title="Blocked" description={msg} />
            <div className="blockedFromSystem tw-h-screen tw-mx-4">
                <div className="d-flex justify-content-center align-items-center flex-column">
                    <div className="bImg">
                        <img src="/assets/images/asset/errors.png" alt="building" className="img-fluid mb-3 tw-w-full" />
                    </div>
                    <div className="bText">
                        <h5 className='tw-font-semibold tw-text-center tw-text-red-500'>Some of actions are taken for your account or other data that related to it.</h5>
                        <p className='tw-text-center'>{msg}</p>
                    </div>
                    <img src="/assets/images/logo-icon.png" alt="logo" className="img-fluid mb-3 tw-w-20 tw-mt-16" />
                    <div className='tw-font-bold tw-text-lg tw-text-gray-500'>Printair Advertising</div>
                </div>
            </div>
        </>
    );
}

export default WorkingGroups1;