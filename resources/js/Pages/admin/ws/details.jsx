import React, { useState, useEffect } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AdminDashboard from '../../../Layouts/AdminDashboard';
import Breadcrumb from "@/components/Breadcrumb";
import CookiesV from '@/Components/CookieConsent';
import { Icon } from "@iconify/react";
import Alert from "@/Components/Alert";
import Meta from "@/Components/Metaheads";

const Details = ({ userDetails, workingGroups, status: selectedStatus }) => {

    return (
        <>
            <Head title="Working Groups - Admin Dashboard" />
            <Meta title="Manage Group - Admin Dashboard" description="Manage Working Group in details" />
            <AdminDashboard userDetails={userDetails}>
                <Breadcrumb title="Manage - Working Group" />
                
            </AdminDashboard>
        </>
    );
};

export default Details;