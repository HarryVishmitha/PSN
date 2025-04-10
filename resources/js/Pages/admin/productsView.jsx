import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Head, router, Link } from '@inertiajs/react';
import AdminDashboard from '../../Layouts/AdminDashboard';
import Breadcrumb from "@/components/Breadcrumb";
import { Icon } from "@iconify/react";
import CookiesV from '@/Components/CookieConsent';
import Alert from "@/Components/Alert";
import Meta from "@/Components/Metaheads";
import 'react-quill-new/dist/quill.snow.css';
import ReactSelect from 'react-select';

const ProductsView = ({
    userDetails,
    products,         // Expected paginated object: { data, total, from, to, last_page, path, links }
    workingGroups,    // Array of working groups (each with id and name)
    categories,       // Array of categories (each with id and name)
    perPage: initialPerPage,
    filters,
}) => {
    // Get initial page from URL query parameters.
    const queryParams = new URLSearchParams(window.location.search);
    const initialPage = parseInt(queryParams.get("page") || 1, 10);

    // Pagination and filter states.
    const [currentPage, setCurrentPage] = useState(initialPage);
    const [perPage, setPerPage] = useState(initialPerPage || 10);
    const [search, setSearch] = useState(filters.search || '');
    const [status, setStatus] = useState(filters.status || '');
    const [selectedWorkingGroup, setSelectedWorkingGroup] = useState(filters.working_group || '');
    const [selectedCategory, setSelectedCategory] = useState(filters.category || '');
    const [alert, setAlert] = useState(null);

    // Update URL with all current filter parameters. Updated values can be merged.
    const updateFilters = (updated = {}) => {
        router.get(
            window.location.pathname,
            {
                ...filters,
                page: currentPage,
                per_page: perPage,
                search,
                status,
                working_group: selectedWorkingGroup,
                category: selectedCategory,
                ...updated,
            },
            { preserveState: true, replace: true }
        );
    };

    // Handlers for filters – reset page number on filter change.
    const handlePerPageChange = (e) => {
        const value = e.target.value;
        setPerPage(value);
        setCurrentPage(1);
        updateFilters({ page: 1, per_page: value });
    };

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        setCurrentPage(1);
        updateFilters({ page: 1 });
    };

    const handleStatusChange = (e) => {
        const value = e.target.value;
        setStatus(value);
        setCurrentPage(1);
        updateFilters({ page: 1, status: value });
    };

    const handleWorkingGroupChange = (e) => {
        const value = e.target.value;
        setSelectedWorkingGroup(value);
        setCurrentPage(1);
        updateFilters({ page: 1, working_group: value });
    };

    const handleCategoryChange = (e) => {
        const value = e.target.value;
        setSelectedCategory(value);
        setCurrentPage(1);
        updateFilters({ page: 1, category: value });
    };

    // Delete handler.
    const handleDelete = (id) => {
        if (confirm("Are you sure you want to delete this product?")) {
            axios.delete(`/admin/products/${id}`)
                .then(() => {
                    setAlert({ type: 'success', message: 'Product deleted successfully.' });
                    router.reload();
                })
                .catch(() => {
                    setAlert({ type: 'error', message: 'Error deleting product.' });
                });
        }
    };

    const formatTimestamp = (timestamp) => {
        const date = new Date(timestamp);
        return date.toLocaleDateString();
    };

    // Custom pagination numbers generator.
    const getPaginationNumbers = () => {
        const pages = [];
        const delta = 2;
        const lastPage = products.last_page || 1;
        if (lastPage <= 7) {
            for (let i = 1; i <= lastPage; i++) {
                pages.push(i);
            }
        } else {
            pages.push(1);
            let left = currentPage - delta;
            let right = currentPage + delta;
            if (left > 2) {
                pages.push("...");
            } else {
                left = 2;
            }
            if (right >= lastPage) {
                right = lastPage - 1;
            }
            for (let i = left; i <= right; i++) {
                pages.push(i);
            }
            if (right < lastPage - 1) {
                pages.push("...");
            }
            pages.push(lastPage);
        }
        return pages;
    };

    // Handler for page change.
    const handlePageChange = (page) => {
        if (page === "...") return;
        setCurrentPage(page);
        updateFilters({ page });
    };

    // Determine products list.
    const productList =
        Array.isArray(products) && products.length > 0
            ? products
            : Array.isArray(products.data) && products.data.length > 0
            ? products.data
            : [];

    return (
        <>
            <Head title="All products - Admin Dashboard" />
            <Meta title="All products - Admin Dashboard" description="Check all products" />
            <AdminDashboard userDetails={userDetails}>
                <Breadcrumb title="Products" />
                {alert && <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} />}
                <div className="card h-100 p-0 radius-12">
                    {/* Header with Filters */}
                    <div className="card-header border-bottom bg-base py-16 px-24 d-flex align-items-center flex-wrap gap-3 justify-content-between">
                        <div className="d-flex align-items-center flex-wrap gap-3">
                            <span className="text-md fw-medium text-secondary-light mb-0">Show</span>
                            <select
                                className="form-select form-select-sm w-auto ps-12 py-6 radius-12 h-40-px"
                                value={perPage}
                                onChange={handlePerPageChange}
                            >
                                <option value="10" disabled>Select Number</option>
                                <option value="1">1</option>
                                <option value="10">10</option>
                                <option value="25">25</option>
                                <option value="50">50</option>
                                <option value="100">100</option>
                            </select>
                            <form className="navbar-search" onSubmit={handleSearchSubmit}>
                                <input
                                    type="text"
                                    className="bg-base h-40-px w-auto"
                                    name="search"
                                    placeholder="Search"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                />
                                <button type="submit" style={{ border: 'none', background: 'none' }}>
                                    <Icon icon="ion:search-outline" className="icon" />
                                </button>
                            </form>
                            <select
                                className="form-select form-select-sm w-auto ps-12 py-6 radius-12 h-40-px"
                                value={status}
                                onChange={handleStatusChange}
                            >
                                <option value="" disabled>Select Status</option>
                                <option value="published">Published</option>
                                <option value="unpublished">Unpublished</option>
                            </select>
                            <select
                                className="form-select form-select-sm w-auto ps-12 py-6 radius-12 h-40-px"
                                value={selectedWorkingGroup}
                                onChange={handleWorkingGroupChange}
                            >
                                <option value="">Select Working Group</option>
                                {workingGroups && workingGroups.map((group) => (
                                    <option key={group.id} value={group.id}>{group.name}</option>
                                ))}
                            </select>
                            <select
                                className="form-select form-select-sm w-auto ps-12 py-6 radius-12 h-40-px"
                                value={selectedCategory}
                                onChange={handleCategoryChange}
                            >
                                <option value="">Select Category</option>
                                {categories && categories.map((cat) => (
                                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                                ))}
                            </select>
                        </div>
                        <Link
                            to="/admin/add-product"
                            className="btn btn-primary text-sm btn-sm px-12 py-12 radius-8 d-flex align-items-center gap-2"
                        >
                            <Icon icon="ic:baseline-plus" className="icon text-xl line-height-1" />
                            Add New Product
                        </Link>
                    </div>

                    {/* Table */}
                    <div className="card-body p-24">
                        <div className="table-responsive scroll-sm">
                            <table className="table bordered-table sm-table mb-0">
                                <thead>
                                    <tr>
                                        <th scope="col">
                                            <div className="d-flex align-items-center gap-10">
                                                <div className="form-check style-check d-flex align-items-center">
                                                    <input
                                                        className="form-check-input radius-4 border input-form-dark"
                                                        type="checkbox"
                                                        name="checkbox"
                                                        id="selectAll"
                                                    />
                                                </div>
                                                S.L
                                            </div>
                                        </th>
                                        <th scope="col">Working Group</th>
                                        <th scope="col">Product Name</th>
                                        <th scope="col">SEO Description</th>
                                        <th scope="col">Base Price</th>
                                        <th scope="col">Last Updated at</th>
                                        <th scope="col" className="text-center">Status</th>
                                        <th scope="col" className="text-center">Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {productList.length > 0 ? (
                                        productList.map((product, index) => (
                                            <tr key={product.id}>
                                                <td>
                                                    <div className="d-flex align-items-center gap-10">
                                                        <div className="form-check style-check d-flex align-items-center">
                                                            <input
                                                                className="form-check-input radius-4 border input-form-dark"
                                                                type="checkbox"
                                                                name="checkbox"
                                                            />
                                                        </div>
                                                        {(currentPage - 1) * perPage + index + 1}
                                                    </div>
                                                </td>
                                                <td>{product.working_group ? product.working_group.name : ''}</td>
                                                <td>
                                                    <div className="d-flex align-items-center">
                                                        <div className="flex-grow-1">
                                                            <span className="text-md mb-0 fw-normal text-secondary-light">
                                                                {product.name}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td>
                                                    <span className="text-md mb-0 fw-normal text-secondary-light tw-line-clamp-2 tw-max-w-[350px]">
                                                        {product.meta_description}
                                                    </span>
                                                </td>
                                                <td>{product.price}</td>
                                                <td>{formatTimestamp(product.updated_at)}</td>
                                                <td className="text-center">
                                                    <span className={`px-24 py-4 radius-4 fw-medium text-sm ${product.status === 'Active' ? 'bg-success-focus text-success-600 border border-success-main' : 'bg-neutral-200 text-neutral-600 border border-neutral-400'}`}>
                                                        {product.status}
                                                    </span>
                                                </td>
                                                <td className="text-center">
                                                    <div className="d-flex align-items-center gap-10 justify-content-center">
                                                        <button
                                                            type="button"
                                                            className="bg-info-focus bg-hover-info-200 text-info-600 fw-medium w-40-px h-40-px d-flex justify-content-center align-items-center rounded-circle"
                                                            onClick={() => router.get(`/admin/products/${product.id}`)}
                                                        >
                                                            <Icon icon="majesticons:eye-line" className="icon text-xl" />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            className="bg-success-focus text-success-600 bg-hover-success-200 fw-medium w-40-px h-40-px d-flex justify-content-center align-items-center rounded-circle"
                                                            onClick={() => router.get(`/admin/products/${product.id}/edit`)}
                                                        >
                                                            <Icon icon="lucide:edit" className="menu-icon" />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            className="remove-item-btn bg-danger-focus bg-hover-danger-200 text-danger-600 fw-medium w-40-px h-40-px d-flex justify-content-center align-items-center rounded-circle"
                                                            onClick={() => handleDelete(product.id)}
                                                        >
                                                            <Icon icon="fluent:delete-24-regular" className="menu-icon" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="8" className="text-center">No products found.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Custom Pagination */}
                        {products && products.total > productList.length && (
                            <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mt-24">
                                <span>
                                    Showing {(currentPage - 1) * perPage + 1} to {Math.min(currentPage * perPage, products.total)} of {products.total} entries
                                </span>
                                <ul className="pagination d-flex flex-wrap align-items-center gap-2 justify-content-center">
                                    {currentPage > 1 && (
                                        <li className="page-item">
                                            <button
                                                className="page-link bg-neutral-200 text-secondary-light fw-semibold radius-8 border-0 d-flex align-items-center justify-content-center h-32-px w-32-px"
                                                onClick={() => handlePageChange(currentPage - 1)}
                                            >
                                                <Icon icon="ep:d-arrow-left" />
                                            </button>
                                        </li>
                                    )}
                                    {getPaginationNumbers().map((page, index) => (
                                        <li key={index} className="page-item">
                                            {page === "..." ? (
                                                <span className="page-link bg-neutral-200 text-secondary-light fw-semibold radius-8 border-0 d-flex align-items-center justify-content-center h-32-px w-32-px">
                                                    {page}
                                                </span>
                                            ) : (
                                                <button
                                                    className={`page-link ${page === currentPage ? "bg-primary-600 text-white" : "bg-neutral-200 text-secondary-light"} fw-semibold radius-8 border-0 d-flex align-items-center justify-content-center h-32-px w-32-px`}
                                                    onClick={() => handlePageChange(page)}
                                                >
                                                    {page}
                                                </button>
                                            )}
                                        </li>
                                    ))}
                                    {currentPage < products.last_page && (
                                        <li className="page-item">
                                            <button
                                                className="page-link bg-neutral-200 text-secondary-light fw-semibold radius-8 border-0 d-flex align-items-center justify-content-center h-32-px w-32-px"
                                                onClick={() => handlePageChange(currentPage + 1)}
                                            >
                                                <Icon icon="ep:d-arrow-right" />
                                            </button>
                                        </li>
                                    )}
                                </ul>
                            </div>
                        )}
                    </div>
                </div>
            </AdminDashboard>
            <CookiesV />
        </>
    );
};

export default ProductsView;
