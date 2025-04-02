import React, { useState, useEffect } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AdminHeader from '../../Components/AdminHeader';
import AdminNav from '@/Components/AdminNav';
import CookiesV from '@/Components/CookieConsent';
import { Icon } from "@iconify/react";
import AdminDashboard from '../../Layouts/AdminDashboard';
import Breadcrumb from "@/components/Breadcrumb";
import Alert from "@/Components/Alert";
import Meta from '@/Components/Metaheads';

const InventoryProviders = ({ userDetails }) => {


    return(
        <>
            <Head title="Providers - Admin" />
            <Meta title='Providers - Admin' description='Manage providers, view details, and update information.' />
            <AdminDashboard userDetails={userDetails}>
                <Breadcrumb title="Providers" />
                
            </AdminDashboard>
            <CookiesV />
        </>
    );
}

export default InventoryProviders;
