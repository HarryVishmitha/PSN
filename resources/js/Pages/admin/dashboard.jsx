import React from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
// import AdminHeader from '../../Components/AdminHeader';
// import AdminNav from '@/Components/AdminNav';
import CookiesV from '@/Components/CookieConsent';
import { Icon } from "@iconify/react";
import AdminDashboard from '../../Layouts/AdminDashboard';
import Breadcrumb from "@/components/Breadcrumb";
// import Metrics from '@/Components/Metrics';
import Meta from '@/Components/Metaheads';

const Dashboard = ({ totalUsers, adminUsers, userUsers, workingGroups, dailyCustomers, userDetails }) => {
    const breadcrumbs = [
        { label: 'Home', url: route('home'), icon: 'fluent:home-48-regular' },
        { label: 'Admin Dashboard', url: '', icon: null },
    ];
    return (
        <>
            <Head title="Admin Dashboard" />
            <Meta title="Admin Dashboard" description="Admin Dashboard" />
            <AdminDashboard userDetails={userDetails}>
                <Breadcrumb title="Panels" />
                {/* adding Metrics */}
                <div className="row row-cols-xxxl-5 row-cols-lg-3 row-cols-sm-2 row-cols-1 gy-4">

                    {/* Users count */}
                    <div className="col">
                        <div className="card shadow-none border bg-gradient-start-1">
                            <div className="card-body p-20">
                                <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
                                    <div>
                                        <p className="fw-medium text-primary-light mb-1">
                                            Total Users
                                        </p>
                                        <h6 className="mb-0">{totalUsers}</h6>
                                    </div>
                                    <div className="w-50-px h-50-px bg-cyan rounded-circle d-flex justify-content-center align-items-center">
                                        <Icon
                                            icon="gridicons:multiple-users"
                                            className="text-base text-2xl mb-0"
                                        />
                                    </div>
                                </div>
                                <p>
                                    hi
                                </p>
                            </div>
                        </div>
                        {/* card end */}
                    </div>
                </div>
            </AdminDashboard>
            <CookiesV />
        </>
    );
};

export default Dashboard;
