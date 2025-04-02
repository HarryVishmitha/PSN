import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AdminDashboard from '../../Layouts/AdminDashboard';
import Breadcrumb from "@/components/Breadcrumb";
import CookiesV from '@/Components/CookieConsent';
import Meta from '@/Components/Metaheads';
import { Icon } from "@iconify/react";
import Alert from "@/Components/Alert";

const Inventory = ({ userDetails }) => {

    return (
        <>
           <Head title="Inventory - Admin" />
            <Meta title='Inventory - Admin' description='Manage inventory, view details, and update information.' />
            <AdminDashboard userDetails={userDetails}>
                <Breadcrumb title="Inventory" />
                
            </AdminDashboard>
            <CookiesV />
        </>
    );

}

export default Inventory;
