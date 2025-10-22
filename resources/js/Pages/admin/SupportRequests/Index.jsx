import React, { useEffect, useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AdminDashboard from '@/Layouts/AdminDashboard';
import Breadcrumb from '@/Components/Breadcrumb';

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
        approved: 'badge bg-success-100 text-success-600 px-12 py-6 radius-8 fw-medium text-xs text-uppercase',
        in_review: 'badge bg-primary-100 text-primary-600 px-12 py-6 radius-8 fw-medium text-xs text-uppercase',
        awaiting_customer: 'badge bg-warning-100 text-warning-700 px-12 py-6 radius-8 fw-medium text-xs text-uppercase',
        completed: 'badge bg-info-100 text-info-700 px-12 py-6 radius-8 fw-medium text-xs text-uppercase',
        closed: 'badge bg-neutral-200 text-secondary-500 px-12 py-6 radius-8 fw-medium text-xs text-uppercase',
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
            <Head title="Support Requests" />
            <AdminDashboard userDetails={userDetails}>
                <Breadcrumb title="Support Requests" />

                <div className="card h-100 p-0 radius-12">
                    <div className="card-header bg-base border-bottom py-16 px-24">
                        <div className="d-flex flex-wrap align-items-center justify-content-between gap-12">
                            <div>
                                <h5 className="text-lg fw-semibold text-neutral-900 mb-2">Requests inbox</h5>
                                <p className="text-sm text-secondary-light mb-0">
                                    Tracking {summary.total} customer briefs. {summary.today} submitted today.
                                </p>
                            </div>
                            <div className="d-flex flex-wrap align-items-center gap-10">
                                <input
                                    type="search"
                                    className="form-control form-control-sm radius-8"
                                    placeholder="Search by reference, title or contact..."
                                    value={search}
                                    onChange={(event) => setSearch(event.target.value)}
                                />
                                <select
                                    className="form-select form-select-sm radius-8"
                                    value={status}
                                    onChange={(event) => setStatus(event.target.value)}
                                >
                                    <option value="">All statuses</option>
                                    {statuses.map((value) => (
                                        <option key={value} value={value}>
                                            {value.replace(/_/g, ' ')}
                                        </option>
                                    ))}
                                </select>
                                <select
                                    className="form-select form-select-sm radius-8"
                                    value={category}
                                    onChange={(event) => setCategory(event.target.value)}
                                >
                                    <option value="">All categories</option>
                                    {categories.map((cat) => (
                                        <option key={cat.value} value={cat.value}>
                                            {cat.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="card-body p-0">
                        <div className="table-responsive">
                            <table className="table table-hover mb-0">
                                <thead className="bg-neutral-50 text-uppercase text-xs text-secondary-light">
                                    <tr>
                                        <th className="px-24 py-12">Reference</th>
                                        <th className="px-24 py-12">Customer</th>
                                        <th className="px-24 py-12">Title</th>
                                        <th className="px-24 py-12">Category</th>
                                        <th className="px-24 py-12 text-center">Status</th>
                                        <th className="px-24 py-12">Desired date</th>
                                        <th className="px-24 py-12">Updated</th>
                                        <th className="px-24 py-12 text-end">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {rows.length === 0 && (
                                        <tr>
                                            <td colSpan="8" className="text-center py-40 text-secondary-light">
                                                No requests found for the current filters.
                                            </td>
                                        </tr>
                                    )}
                                    {rows.map((request) => (
                                        <tr key={request.id}>
                                            <td className="px-24 py-14 align-middle">
                                                <span className="fw-semibold text-neutral-900">{request.reference}</span>
                                            </td>
                                            <td className="px-24 py-14 align-middle">
                                                <div className="d-flex flex-column">
                                                    <span className="fw-medium text-neutral-800">{request.contact?.name}</span>
                                                    <span className="text-xs text-secondary-light">{request.contact?.email}</span>
                                                </div>
                                            </td>
                                            <td className="px-24 py-14 align-middle">
                                                <div className="d-flex flex-column">
                                                    <span className="fw-medium text-neutral-800">{request.title}</span>
                                                    {request.description && (
                                                        <span className="text-xs text-secondary-light text-truncate" style={{ maxWidth: '220px' }}>
                                                            {request.description}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-24 py-14 align-middle">
                                                <span className="text-sm text-neutral-800">{request.category?.label}</span>
                                            </td>
                                            <td className="px-24 py-14 align-middle text-center">
                                                <span className={statusTone(request.status)}>{request.status.replace(/_/g, ' ')}</span>
                                            </td>
                                            <td className="px-24 py-14 align-middle">
                                                <span className="text-sm text-neutral-800">
                                                    {request.desired_date ? formatDateTime(request.desired_date) : 'Not set'}
                                                </span>
                                            </td>
                                            <td className="px-24 py-14 align-middle">
                                                <span className="text-sm text-neutral-800">{formatDateTime(request.updated_at)}</span>
                                            </td>
                                            <td className="px-24 py-14 align-middle text-end">
                                                <Link
                                                    href={route('admin.requests.show', request.id)}
                                                    className="btn btn-sm btn-neutral-200 text-neutral-900 fw-semibold radius-8 px-16"
                                                >
                                                    View
                                                </Link>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {pagination.length > 1 && (
                        <div className="card-footer d-flex align-items-center justify-content-between flex-wrap gap-3 py-16 px-24">
                            <span className="text-sm text-secondary-light">
                                Showing {requests?.meta?.from || 0} – {requests?.meta?.to || 0} of {requests?.meta?.total || 0}
                            </span>
                            <ul className="pagination d-flex flex-wrap align-items-center gap-2">
                                {pagination.map((link, index) => (
                                    <li key={index}>
                                        <button
                                            className={`btn ${link.active ? 'btn-primary-600' : 'btn-neutral-200'} radius-8 py-6 px-12 fw-medium text-sm`}
                                            disabled={!link.url}
                                            onClick={() => link.url && router.get(link.url)}
                                            dangerouslySetInnerHTML={{ __html: link.label }}
                                        />
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            </AdminDashboard>
        </>
    );
}

