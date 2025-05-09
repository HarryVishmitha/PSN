import React, { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import { Head, router } from '@inertiajs/react'
import UserDashboard from '../../Layouts/UserDashboard'
import Breadcrumb from "@/components/Breadcrumb"
import { Icon } from "@iconify/react"
import CookiesV from '@/Components/CookieConsent'
import Alert from "@/Components/Alert"
import Meta from "@/Components/Metaheads"

const Dashboard = ({ userDetails, WG }) => {

    return(
        <>
            <Head title='User Dashboard' />
            <Meta title="Dashboard" description="Dashboard" />
            <UserDashboard userDetails={userDetails} WG={WG}>
                <Breadcrumb title="Dashboard" />

            </UserDashboard>
            <CookiesV />
        </>
    );
}
export default Dashboard;
