import React, { useState, useEffect, useMemo } from 'react';
import { Head, router } from '@inertiajs/react';
import AdminDashboard from '@/Layouts/AdminDashboard';
import Breadcrumb from '@/components/Breadcrumb';
import { Icon } from '@iconify/react';
import CookiesV from '@/Components/CookieConsent';
import Meta from '@/Components/Metaheads';
import Alert from '@/Components/Alert';
import axios from 'axios';

const PreviewEstimate = ({ userDetails, workingGroups, estimate }) => {
    const [alert, setAlert] = useState(null);
    
    return (
        <>
            <Head title={'Preview of '.estimate.estimate_number} />
            <Meta
                title={estimate.estimate_number + 'Preview - Admin Dashboard'}
                description="Estimate preview page for admin dashboard"
            />

            <AdminDashboard userDetails={userDetails}>
                <Breadcrumb title={'Preview'} />
                {alert && <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} />}

            </AdminDashboard>
        </>
    );

}

export default PreviewEstimate;
