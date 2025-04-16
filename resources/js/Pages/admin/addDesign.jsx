import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Head, router } from '@inertiajs/react';
import AdminDashboard from '../../Layouts/AdminDashboard';
import Breadcrumb from "@/components/Breadcrumb";
import { Icon } from "@iconify/react";
import CookiesV from '@/Components/CookieConsent';
import Alert from "@/Components/Alert";
import Meta from "@/Components/Metaheads";
import hljs from "highlight.js";
import ReactQuill from "react-quill-new";
import 'react-quill-new/dist/quill.snow.css';
import ReactSelect from 'react-select';

const AddDesign = ({userDetails, }) => {
    const [alert, setAlert] = useState(null); // { type: 'success' | 'danger', message: string }

    return (
        <>
            <Head title="Add New Design - Admin Dashboard" />
            <Meta title="Add New Design - Admin Dashboard" description="Add New Design to the system" />
            <AdminDashboard userDetails={userDetails}>
                <Breadcrumb title="Add New Design" />
                {alert && <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} />}

            </AdminDashboard>
            <CookiesV />
        </>
    );
};

export default AddDesign;