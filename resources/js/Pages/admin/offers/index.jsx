import React, { useEffect, useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AdminDashboard from '@/Layouts/AdminDashboard';
import Breadcrumb from '@/Components/Breadcrumb';
import { Icon } from '@iconify/react';
import Alert from '@/Components/Alert';
import Meta from '@/Components/Metaheads';
import axios from 'axios';

const useDebounced = (value, delay = 400) => {
    const [v, setV] = useState(value);
    useEffect(() => {
        const t = setTimeout(() => setV(value), delay);
        return () => clearTimeout(t);
    }, [value, delay]);
    return v;
};

export default function OffersIndex({ userDetails, offers, filters = {} }) {
    const [alert, setAlert] = useState(null);
    const [search, setSearch] = useState(filters?.search || '');
    const [status, setStatus] = useState(filters?.status || '');
    const [offerType, setOfferType] = useState(filters?.offer_type || '');
    const [perPage, setPerPage] = useState(Number(filters?.per_page || 10));
    const [sortBy, setSortBy] = useState(filters?.sort_by || 'created_at');
    const [sortDir, setSortDir] = useState(filters?.sort_dir || 'desc');
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [selectedOffer, setSelectedOffer] = useState(null);

    const debouncedSearch = useDebounced(search);

    const buildQuery = () => ({
        per_page: perPage,
        search: debouncedSearch || undefined,
        status: status || undefined,
        offer_type: offerType || undefined,
        sort_by: sortBy,
        sort_dir: sortDir,
    });

    useEffect(() => {
        router.get(route('admin.offers.index'), buildQuery(), {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    }, [debouncedSearch, status, offerType, perPage, sortBy, sortDir]);

    const toggleSort = (col) => {
        if (sortBy !== col) {
            setSortBy(col);
            setSortDir('asc');
        } else {
            setSortDir(d => d === 'asc' ? 'desc' : 'asc');
        }
    };

    const deleteOffer = async (offer) => {
        if (!confirm(`Are you sure you want to delete "${offer.name}"?`)) return;

        setDeleteLoading(true);
        try {
            await axios.delete(route('admin.offers.destroy', offer.id));
            setAlert({ type: 'success', message: 'Offer deleted successfully!' });
            router.reload({ only: ['offers'] });
        } catch (error) {
            setAlert({ type: 'danger', message: 'Failed to delete offer.' });
        } finally {
            setDeleteLoading(false);
        }
    };

    const toggleStatus = async (offer) => {
        try {
            const response = await axios.patch(route('admin.offers.toggle', offer.id));
            setAlert({ type: 'success', message: 'Status updated successfully!' });
            router.reload({ only: ['offers'] });
        } catch (error) {
            setAlert({ type: 'danger', message: 'Failed to update status.' });
        }
    };

    const badge = (s) => {
        const map = {
            active: 'bg-success-focus text-success-600',
            inactive: 'bg-neutral-200 text-secondary-light',
            scheduled: 'bg-warning-focus text-warning-600',
        };
        return (
            <span className={`${map[s] || 'bg-neutral-200 text-secondary-light'} px-24 py-4 radius-4 fw-medium text-sm`}>
                {s}
            </span>
        );
    };

    const offerTypeBadge = (type) => {
        const map = {
            percentage: { color: 'bg-info-focus text-info-600', icon: 'mdi:percent-outline' },
            fixed: { color: 'bg-primary-focus text-primary-600', icon: 'mdi:currency-usd' },
            buy_x_get_y: { color: 'bg-success-focus text-success-600', icon: 'mdi:gift-outline' },
            free_shipping: { color: 'bg-warning-focus text-warning-600', icon: 'mdi:truck-fast-outline' },
        };
        const config = map[type] || { color: 'bg-neutral-200', icon: 'mdi:tag-outline' };
        return (
            <span className={`${config.color} px-16 py-4 radius-4 fw-medium text-sm d-inline-flex align-items-center gap-1`}>
                <Icon icon={config.icon} className="text-base" />
                {type.replace(/_/g, ' ')}
            </span>
        );
    };

    const pagination = offers?.links || [];

    return (
        <>
            <Head title="Offers - Admin Dashboard" />
            <Meta title="Offers Management" description="Manage limited-time offers" />

            <AdminDashboard userDetails={userDetails}>
                <Breadcrumb title="Offers" />

                {alert && <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} />}

                <div className="card h-100 p-0 radius-12">
                    {/* Header */}
                    <div className="card-header border-bottom bg-base py-16 px-24">
                        <div className="d-flex align-items-center justify-content-between gap-3 flex-wrap">
                            <h5 className="fw-bold mb-0">Limited-Time Offers</h5>
                            <Link
                                href={route('admin.offers.create')}
                                className="btn btn-primary d-flex align-items-center gap-2"
                            >
                                <Icon icon="mdi:plus" className="text-xl" />
                                Create Offer
                            </Link>
                        </div>
                    </div>

                    {/* Filters */}
                    <div className="card-body border-bottom">
                        <div className="row g-3">
                            <div className="col-md-3">
                                <input
                                    type="text"
                                    className="form-control"
                                    placeholder="Search offers..."
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                />
                            </div>
                            <div className="col-md-2">
                                <select className="form-select" value={status} onChange={e => setStatus(e.target.value)}>
                                    <option value="">All Status</option>
                                    <option value="active">Active</option>
                                    <option value="inactive">Inactive</option>
                                    <option value="scheduled">Scheduled</option>
                                </select>
                            </div>
                            <div className="col-md-2">
                                <select className="form-select" value={offerType} onChange={e => setOfferType(e.target.value)}>
                                    <option value="">All Types</option>
                                    <option value="percentage">Percentage</option>
                                    <option value="fixed">Fixed</option>
                                    <option value="buy_x_get_y">Buy X Get Y</option>
                                    <option value="free_shipping">Free Shipping</option>
                                </select>
                            </div>
                            <div className="col-md-2">
                                <select className="form-select" value={perPage} onChange={e => setPerPage(Number(e.target.value))}>
                                    <option value="10">10 per page</option>
                                    <option value="25">25 per page</option>
                                    <option value="50">50 per page</option>
                                    <option value="100">100 per page</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="card-body p-0">
                        <div className="table-responsive">
                            <table className="table table-bordered mb-0">
                                <thead className="bg-neutral-100">
                                    <tr>
                                        <th className="fw-semibold">Name</th>
                                        <th className="fw-semibold">Code</th>
                                        <th className="fw-semibold">Type</th>
                                        <th className="fw-semibold">Discount</th>
                                        <th className="fw-semibold">Valid Period</th>
                                        <th className="fw-semibold">Usage</th>
                                        <th className="fw-semibold">Status</th>
                                        <th className="fw-semibold text-center">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {offers?.data?.length > 0 ? (
                                        offers.data.map(offer => (
                                            <tr key={offer.id}>
                                                <td>
                                                    <div className="fw-medium">{offer.name}</div>
                                                    {offer.description && (
                                                        <div className="text-sm text-secondary-light">{offer.description.substring(0, 60)}...</div>
                                                    )}
                                                </td>
                                                <td>
                                                    <code className="bg-neutral-100 px-2 py-1 radius-4">{offer.code}</code>
                                                </td>
                                                <td>{offerTypeBadge(offer.offer_type)}</td>
                                                <td className="fw-semibold text-primary-600">
                                                    {offer.offer_type === 'percentage' ? `${offer.discount_value}%` : `LKR ${offer.discount_value}`}
                                                </td>
                                                <td className="text-sm">
                                                    <div>{new Date(offer.start_date).toLocaleDateString()}</div>
                                                    <div className="text-secondary-light">to {new Date(offer.end_date).toLocaleDateString()}</div>
                                                </td>
                                                <td>
                                                    <span className="text-sm">
                                                        {offer.usages_count || 0} / {offer.usage_limit || '∞'}
                                                    </span>
                                                </td>
                                                <td>{badge(offer.status)}</td>
                                                <td className="text-center">
                                                    <div className="d-flex justify-content-center gap-10">
                                                        <Link
                                                            href={route('admin.offers.edit', offer.id)}
                                                            className="bg-success-focus bg-hover-success-200 text-success-600 fw-medium w-40-px h-40-px d-flex justify-content-center align-items-center rounded-circle"
                                                            title="Edit"
                                                        >
                                                            <Icon icon="lucide:edit" className="text-xl" />
                                                        </Link>
                                                        <button
                                                            type="button"
                                                            className="bg-warning-focus bg-hover-warning-200 text-warning-600 fw-medium w-40-px h-40-px d-flex justify-content-center align-items-center rounded-circle"
                                                            title="Toggle Status"
                                                            onClick={() => toggleStatus(offer)}
                                                        >
                                                            <Icon icon="mdi:toggle-switch-outline" className="text-xl" />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            className="bg-danger-focus bg-hover-danger-200 text-danger-600 fw-medium w-40-px h-40-px d-flex justify-content-center align-items-center rounded-circle"
                                                            title="Delete"
                                                            onClick={() => deleteOffer(offer)}
                                                        >
                                                            <Icon icon="fluent:delete-24-regular" className="text-xl" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="8" className="text-center py-5 text-secondary-light">
                                                No offers found.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Pagination */}
                    <div className="card-footer d-flex align-items-center justify-content-between">
                        <span className="text-sm text-secondary-light">
                            Showing {offers?.from || 0} to {offers?.to || 0} of {offers?.total || 0} entries
                        </span>
                        <ul className="pagination d-flex gap-2 mb-0">
                            {pagination.map((link, i) => (
                                <li key={i} className="page-item">
                                    <button
                                        className={`page-link radius-8 ${link.active ? 'bg-primary-600 text-white' : 'bg-neutral-200'}`}
                                        disabled={!link.url}
                                        onClick={() => link.url && router.get(link.url)}
                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                    />
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </AdminDashboard>
        </>
    );
}
