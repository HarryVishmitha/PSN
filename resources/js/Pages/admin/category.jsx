import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Head, router, Link } from '@inertiajs/react';
import AdminDashboard from '../../Layouts/AdminDashboard';
import Breadcrumb from "@/components/Breadcrumb";
import { Icon } from "@iconify/react";
import CookiesV from '@/Components/CookieConsent';
import Alert from "@/Components/Alert";
import Meta from "@/Components/Metaheads";
import hljs from "highlight.js";
import ReactQuill from "react-quill-new";
import 'react-quill-new/dist/quill.snow.css';

const Category = ({ userDetails, categories, filters }) => {
    const [alert, setAlert] = useState(null); // { type, message }

    console.log(categories);

    return (
        <>
            <Head title="Categories - Admin Dashboard" />
            <Meta title="Categories - Admin Dashboard" description="Manage categories" />

            <AdminDashboard userDetails={userDetails}>
                <Breadcrumb title="Manage Categories" />
                {alert && <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} />}
                <div className="card h-100 p-0 radius-12">
                    <div className="card-header border-bottom bg-base py-16 px-24 d-flex align-items-center flex-wrap gap-3 justify-content-between">
                        <div className="d-flex align-items-center flex-wrap gap-3">
                            <span className="text-md fw-medium text-secondary-light mb-0">Show</span>
                            <select
                                name="per_page"
                                className="form-select form-select-sm w-auto ps-12 py-6 radius-12 h-40-px"
                            // value={data.per_page}
                            // onChange={handleChange}
                            >
                                {[5, 10, 20, 25, 50, 100].map(n => (
                                    <option key={n} value={n}>{n}</option>
                                ))}
                            </select>

                            <input
                                type="text"
                                name="search"
                                className="bg-base h-40-px w-auto form-input ps-12"
                                placeholder="Search"
                            // value={data.search}
                            // onChange={handleChange}
                            />

                            <select
                                name="status"
                                className="form-select form-select-sm w-auto ps-12 py-6 radius-12 h-40-px"
                            // value={data.status}
                            // onChange={handleChange}
                            >
                                <option value="">All Status</option>
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                            </select>
                        </div>
                        <Link
                            href={route('admin.category.view')}
                            className="btn btn-primary text-sm btn-sm px-12 py-12 radius-8 d-flex align-items-center gap-2"
                        >
                            <Icon icon="ic:baseline-plus" className="icon text-xl line-height-1" />
                            Add New Category
                        </Link>
                    </div>
                    <div className="card-body p-24">
                        <div className="table-responsive scroll-sm">
                            <table className="table bordered-table sm-table mb-0">
                                <thead>
                                    <tr>
                                        <th><input type="checkbox" className="form-check-input" /></th>
                                        <th>S.L</th>
                                        <th>Name</th>
                                        <th>Description</th>
                                        <th>Status</th>
                                        <th>Added by / Updated by</th>
                                        <th>No. of Products (contain)</th>
                                        <th className="text-center">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {categories.data.map((category, index)=>(
                                        <tr key={category.id}>
                                            <td><input type="checkbox" className="form-check-input" /></td>
                                            <td>{index + 1}</td>
                                            <td>
                                                hi
                                            </td>
                                            <td>hi</td>
                                            <td>hi</td>
                                            <td>hi</td>
                                            {/* <td className="text-center">
                                                <span className={design.status === 'active' ? 'bg-success-focus text-success-600 px-24 py-4 radius-4 fw-medium text-sm' : 'bg-danger-focus text-danger-600 px-24 py-4 radius-4 fw-medium text-sm'}>
                                                    {design.status.charAt(0).toUpperCase() + design.status.slice(1)}
                                                </span>
                                            </td> */}
                                            <td className="text-center">
                                                <div className="d-flex justify-content-center gap-10">
                                                    <button className="bg-info-focus bg-hover-info-200 text-info-600 fw-medium w-40-px h-40-px d-flex justify-content-center align-items-center rounded-circle" data-bs-toggle="modal" data-bs-target="#viewCateModal">
                                                        <Icon icon="majesticons:eye-line" className="icon text-xl" />
                                                    </button>
                                                    <button className="bg-success-focus bg-hover-success-200 text-success-600 fw-medium w-40-px h-40-px d-flex justify-content-center align-items-center rounded-circle" data-bs-toggle="modal" data-bs-target="#editCateModal">
                                                        <Icon icon="lucide:edit" className="menu-icon" />
                                                    </button>
                                                    <button className="remove-item-btn bg-danger-focus bg-hover-danger-200 text-danger-600 fw-medium w-40-px h-40-px d-flex justify-content-center align-items-center rounded-circle" data-bs-toggle="modal" data-bs-target="#deleteCateModal">
                                                        <Icon icon="fluent:delete-24-regular" className="menu-icon" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </AdminDashboard>
        </>
    );
}

export default Category;