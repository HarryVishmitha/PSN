import React, { useEffect, useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AdminDashboard from '@/Layouts/AdminDashboard';
import Breadcrumb from '@/Components/Breadcrumb';
import CookiesV from '@/Components/CookieConsent';
import Meta from '@/Components/Metaheads';
import { Icon } from "@iconify/react";

const useDebounced = (value, delay = 400) => {
    const [debounced, setDebounced] = useState(value);

    useEffect(() => {
        const timer = setTimeout(() => setDebounced(value), delay);
        return () => clearTimeout(timer);
    }, [value, delay]);

    return debounced;
};

const formatDateTime = (value) => {
    if (!value) return '—';
    try {
        return new Intl.DateTimeFormat('en-GB', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        }).format(new Date(value));
    } catch (error) {
        return value;
    }
};

const statusTone = (status) => {
    const map = {
        approved: 'bg-success-focus text-success-600 border border-success-main px-24 py-4 radius-4 fw-medium text-sm',
        in_review: 'bg-primary-100 text-primary-600 border border-primary-main px-24 py-4 radius-4 fw-medium text-sm',
        awaiting_customer: 'bg-warning-100 text-warning-700 border border-warning-main px-24 py-4 radius-4 fw-medium text-sm',
        completed: 'bg-info-focus text-info-700 border border-info-main px-24 py-4 radius-4 fw-medium text-sm',
        closed: 'bg-neutral-200 text-secondary-light border border-neutral-400 px-24 py-4 radius-4 fw-medium text-sm',
    };
    return map[status] || map.closed;
};

export default function SupportRequestIndex({ userDetails, requests, filters = {}, statuses = [], categories = [] }) {
    const [search, setSearch] = useState(filters.search || '');
    const [status, setStatus] = useState(filters.status || '');
    const [category, setCategory] = useState(filters.category || '');

    const debouncedSearch = useDebounced(search);

    useEffect(() => {
        router.get(
            route('admin.requests.index'),
            {
                search: debouncedSearch || undefined,
                status: status || undefined,
                category: category || undefined,
            },
            {
                preserveState: true,
                preserveScroll: true,
                replace: true,
                only: ['requests'],
            },
        );
    }, [debouncedSearch, status, category]);

    const rows = requests?.data || [];
    const pagination = requests?.links || [];

    const summary = {
        total: requests?.meta?.total || 0,
        today: rows.filter((req) => req.created_at?.slice(0, 10) === new Date().toISOString().slice(0, 10)).length,
    };

    return (
        <>
            <Head title="Support Requests - Admin" />
            <Meta title="Support Requests - Admin" description="Manage support requests, customer briefs, and inquiries." />
            <AdminDashboard userDetails={userDetails}>
                <Breadcrumb title="Support Requests" />

                <div className="card h-100 p-0 radius-12">
                    <div className="card-header border-bottom bg-base py-16 px-24 d-flex align-items-center flex-wrap gap-3 justify-content-between">
                        <div className="d-flex align-items-center flex-wrap gap-3">
                            <form className="navbar-search">
                                <input
                                    type="text"
                                    className="bg-base h-40-px w-auto"
                                    name="search"
                                    placeholder="Search by reference, title or contact..."
                                    value={search}
                                    onChange={(event) => setSearch(event.target.value)}
                                />
                                <Icon icon="ion:search-outline" className="icon" />
                            </form>
                            <select
                                className="form-select form-select-sm w-auto ps-12 py-6 radius-12 h-40-px"
                                value={status}
                                onChange={(event) => setStatus(event.target.value)}
                            >
                                <option value="">All Statuses</option>
                                {statuses.map((value) => (
                                    <option key={value} value={value}>
                                        {value.replace(/_/g, ' ').toUpperCase()}
                                    </option>
                                ))}
                            </select>
                            <select
                                className="form-select form-select-sm w-auto ps-12 py-6 radius-12 h-40-px"
                                value={category}
                                onChange={(event) => setCategory(event.target.value)}
                            >
                                <option value="">All Categories</option>
                                {categories.map((cat) => (
                                    <option key={cat.value} value={cat.value}>
                                        {cat.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="d-flex align-items-center gap-2">
                            <div className="text-end">
                                <div className="text-sm fw-semibold text-neutral-900">{summary.total} Total</div>
                                <div className="text-xs text-secondary-light">{summary.today} Today</div>
                            </div>
                            <Icon icon="fluent:mail-inbox-24-regular" className="text-primary-600 text-4xl" />
                        </div>
                    </div>

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
                                                Reference
                                            </div>
                                        </th>
                                        <th scope="col">Customer</th>
                                        <th scope="col">Title</th>
                                        <th scope="col">Category</th>
                                        <th scope="col" className="text-center">Status</th>
                                        <th scope="col">Desired Date</th>
                                        <th scope="col">Updated</th>
                                        <th scope="col" className="text-center">Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {rows.length === 0 && (
                                        <tr>
                                            <td colSpan="8" className="text-center py-5">
                                                <div className="d-flex flex-column align-items-center gap-3 py-4">
                                                    <Icon icon="fluent:document-search-24-regular" className="text-secondary-light text-6xl" />
                                                    <div>
                                                        <p className="text-md fw-medium text-secondary-light mb-1">No requests found</p>
                                                        <p className="text-sm text-secondary-light mb-0">Try adjusting your filters</p>
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                    {rows.map((request, index) => (
                                        <tr key={request.id}>
                                            <td>
                                                <div className="d-flex align-items-center gap-10">
                                                    <div className="form-check style-check d-flex align-items-center">
                                                        <input
                                                            className="form-check-input radius-4 border border-neutral-400"
                                                            type="checkbox"
                                                            name="checkbox"
                                                            id={`request-${request.id}`}
                                                        />
                                                    </div>
                                                    <span className="fw-semibold text-primary-600">{request.reference}</span>
                                                </div>
                                            </td>
                                            <td>
                                                <div className="d-flex align-items-center">
                                                    <div className="w-40-px h-40-px rounded-circle flex-shrink-0 me-12 overflow-hidden bg-primary-100 d-flex align-items-center justify-content-center">
                                                        <Icon icon="fluent:person-24-regular" className="text-primary-600 text-xl" />
                                                    </div>
                                                    <div className="flex-grow-1">
                                                        <span className="text-md mb-0 fw-medium text-secondary-light d-block">{request.contact?.name || 'N/A'}</span>
                                                        <span className="text-xs text-secondary-light">{request.contact?.email || 'N/A'}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <div className="d-flex flex-column">
                                                    <span className="text-md fw-medium text-neutral-900 mb-1">{request.title}</span>
                                                    {request.description && (
                                                        <span className="text-xs text-secondary-light text-truncate" style={{ maxWidth: '280px' }}>
                                                            {request.description}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td>
                                                <span className="text-sm text-secondary-light">{request.category?.label || 'Uncategorized'}</span>
                                            </td>
                                            <td className="text-center">
                                                <span className={statusTone(request.status)}>
                                                    {request.status.replace(/_/g, ' ').toUpperCase()}
                                                </span>
                                            </td>
                                            <td>
                                                <div className="d-flex align-items-center gap-2">
                                                    <Icon icon="fluent:calendar-20-regular" className="text-secondary-light" />
                                                    <span className="text-sm text-secondary-light">
                                                        {request.desired_date ? new Date(request.desired_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td>
                                                <span className="text-sm text-secondary-light">{formatDateTime(request.updated_at)}</span>
                                            </td>
                                            <td className="text-center">
                                                <div className="d-flex align-items-center gap-10 justify-content-center">
                                                    <Link
                                                        href={route('admin.requests.show', request.id)}
                                                        className="bg-info-focus bg-hover-info-200 text-info-600 fw-medium w-40-px h-40-px d-flex justify-content-center align-items-center rounded-circle"
                                                        title="View details"
                                                    >
                                                        <Icon icon="majesticons:eye-line" className="icon text-xl" />
                                                    </Link>
                                                    <Link
                                                        href={route('admin.requests.show', request.id)}
                                                        className="bg-success-focus text-success-600 bg-hover-success-200 fw-medium w-40-px h-40-px d-flex justify-content-center align-items-center rounded-circle"
                                                        title="Edit request"
                                                    >
                                                        <Icon icon="lucide:edit" className="menu-icon" />
                                                    </Link>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {requests && requests.last_page > 1 && (
                            <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mt-24">
                                <span className="text-sm text-secondary-light">
                                    Showing {requests?.from || 0} to {requests?.to || 0} of {requests?.total || 0} entries
                                </span>
                                <ul className="pagination d-flex flex-wrap align-items-center gap-2 justify-content-center">
                                    {requests.current_page > 1 && (
                                        <li className="page-item">
                                            <button
                                                className="page-link bg-neutral-200 text-secondary-light fw-semibold radius-8 border-0 d-flex align-items-center justify-content-center h-32-px w-32-px text-md"
                                                onClick={() => router.get(requests.prev_page_url)}
                                            >
                                                <Icon icon="ep:d-arrow-left" />
                                            </button>
                                        </li>
                                    )}
                                    {Array.from({ length: requests.last_page }, (_, i) => i + 1).map((page) => (
                                        <li className="page-item" key={page}>
                                            <button
                                                className={`page-link fw-semibold radius-8 border-0 d-flex align-items-center justify-content-center h-32-px w-32-px text-md ${
                                                    page === requests.current_page
                                                        ? 'bg-primary-600 text-white'
                                                        : 'bg-neutral-200 text-secondary-light'
                                                }`}
                                                onClick={() => router.get(`${requests.path}?page=${page}&search=${search}&status=${status}&category=${category}`)}
                                            >
                                                {page}
                                            </button>
                                        </li>
                                    ))}
                                    {requests.current_page < requests.last_page && (
                                        <li className="page-item">
                                            <button
                                                className="page-link bg-neutral-200 text-secondary-light fw-semibold radius-8 border-0 d-flex align-items-center justify-content-center h-32-px w-32-px text-md"
                                                onClick={() => router.get(requests.next_page_url)}
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
}

