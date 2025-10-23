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
            disabled: 'bg-neutral-200 text-secondary-light',
            draft: 'bg-warning-focus text-warning-600',
            expired: 'bg-danger-focus text-danger-600',
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
                    {/* Header + Filters Combined */}
                    <div className="card-header border-bottom bg-base py-16 px-24 d-flex flex-wrap align-items-center justify-content-between gap-3">
                        <h5 className="fw-bold mb-0">Limited-Time Offers</h5>
                        
                        {/* Filters Row */}
                        <div className="d-flex flex-wrap align-items-center gap-2">
                            <input
                                type="text"
                                name="search"
                                className="form-control form-control-sm w-auto ps-40 pe-16 py-8 radius-12 h-40-px"
                                placeholder="Search..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                            />
                            <select
                                name="status"
                                className="form-select form-select-sm w-auto ps-12 py-6 radius-12 h-40-px"
                                value={status}
                                onChange={e => setStatus(e.target.value)}
                            >
                                <option value="">All Status</option>
                                <option value="draft">Draft</option>
                                <option value="active">Active</option>
                                <option value="disabled">Disabled</option>
                                <option value="expired">Expired</option>
                            </select>
                            <select
                                name="offer_type"
                                className="form-select form-select-sm w-auto ps-12 py-6 radius-12 h-40-px"
                                value={offerType}
                                onChange={e => setOfferType(e.target.value)}
                            >
                                <option value="">All Types</option>
                                <option value="percentage">Percentage</option>
                                <option value="fixed">Fixed</option>
                                <option value="buy_x_get_y">Buy X Get Y</option>
                                <option value="free_shipping">Free Shipping</option>
                            </select>
                            <select
                                name="per_page"
                                className="form-select form-select-sm w-auto ps-12 py-6 radius-12 h-40-px"
                                value={perPage}
                                onChange={e => setPerPage(Number(e.target.value))}
                            >
                                <option value="10">10</option>
                                <option value="25">25</option>
                                <option value="50">50</option>
                                <option value="100">100</option>
                            </select>
                        </div>

                        {/* Add Button */}
                        <div className="d-flex align-items-center gap-2">
                            <Link
                                href={route('admin.offers.create')}
                                className="btn btn-primary text-sm btn-sm px-12 py-12 radius-8 d-flex align-items-center gap-2"
                            >
                                <Icon icon="ic:baseline-plus" className="icon text-xl line-height-1" />
                                Add New Offer
                            </Link>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="card-body p-24">
                        <div className="table-responsive scroll-sm">
                            <table className="table bordered-table sm-table mb-0">
                                <thead>
                                    <tr>
                                        <th>S.L</th>
                                        <th>Offer</th>
                                        <th>Code</th>
                                        <th>Type</th>
                                        <th>Discount</th>
                                        <th>Valid Period</th>
                                        <th>Usage</th>
                                        <th className="text-center">Status</th>
                                        <th className="text-end">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {offers?.data?.length > 0 ? (
                                        offers.data.map((offer, index) => (
                                            <tr key={offer.id}>
                                                <td>{(offers.current_page - 1) * offers.per_page + index + 1}</td>
                                                <td>
                                                    <div className="d-flex align-items-center">
                                                        {offer.image ? (
                                                            <img
                                                                src={`/storage/${offer.image}`}
                                                                alt={offer.name}
                                                                className="w-40-px h-40-px rounded-circle flex-shrink-0 me-12 overflow-hidden"
                                                                style={{ objectFit: 'cover' }}
                                                            />
                                                        ) : (
                                                            <div className="w-40-px h-40-px rounded-circle flex-shrink-0 me-12 bg-neutral-200 d-flex align-items-center justify-content-center">
                                                                <Icon icon="mdi:tag-outline" className="text-secondary-light" />
                                                            </div>
                                                        )}
                                                        <div className="d-flex flex-column">
                                                            <span className="text-md mb-0 fw-medium text-secondary-light">
                                                                {offer.name}
                                                            </span>
                                                            {offer.description && (
                                                                <small className="text-muted">
                                                                    {offer.description.substring(0, 50)}{offer.description.length > 50 ? '...' : ''}
                                                                </small>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td>
                                                    <code className="bg-neutral-100 px-8 py-4 radius-4 text-sm">{offer.code}</code>
                                                </td>
                                                <td>{offerTypeBadge(offer.offer_type)}</td>
                                                <td className="fw-semibold text-primary-600">
                                                    {offer.offer_type === 'percentage' ? `${offer.discount_value}%` : `LKR ${offer.discount_value}`}
                                                </td>
                                                <td className="text-sm">
                                                    <div>{new Date(offer.start_date).toLocaleDateString()}</div>
                                                    <div className="text-secondary-light">to {new Date(offer.end_date).toLocaleDateString()}</div>
                                                </td>
                                                <td className="text-sm">
                                                    {offer.usages_count || 0} / {offer.usage_limit || '∞'}
                                                </td>
                                                <td className="text-center">{badge(offer.status)}</td>
                                                <td>
                                                    <div className="d-flex align-items-center justify-content-end gap-10">
                                                        <Link
                                                            href={route('admin.offers.edit', offer.id)}
                                                            className="bg-success-focus bg-hover-success-200 text-success-600 fw-medium w-40-px h-40-px d-flex justify-content-center align-items-center rounded-circle"
                                                            title="Edit"
                                                        >
                                                            <Icon icon="lucide:edit" className="menu-icon" />
                                                        </Link>
                                                        <button
                                                            type="button"
                                                            className="bg-warning-focus bg-hover-warning-200 text-warning-600 fw-medium w-40-px h-40-px d-flex justify-content-center align-items-center rounded-circle"
                                                            title="Toggle Status"
                                                            onClick={() => toggleStatus(offer)}
                                                        >
                                                            <Icon icon="mdi:toggle-switch-outline" className="menu-icon" />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            className="bg-danger-focus bg-hover-danger-200 text-danger-600 fw-medium w-40-px h-40-px d-flex justify-content-center align-items-center rounded-circle"
                                                            title="Delete"
                                                            onClick={() => deleteOffer(offer)}
                                                            disabled={deleteLoading}
                                                        >
                                                            <Icon icon="fluent:delete-24-regular" className="menu-icon" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="9" className="text-center py-32 text-secondary-light">
                                                <Icon icon="mdi:tag-off-outline" className="text-64 mb-16 text-secondary-light" />
                                                <div>No offers found.</div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Pagination */}
                    {offers?.last_page > 1 && (
                        <div className="card-footer d-flex align-items-center justify-content-between flex-wrap gap-2 py-16 px-24">
                            <span className="text-sm text-secondary-light">
                                Showing {offers?.from || 0} to {offers?.to || 0} of {offers?.total || 0} entries
                            </span>
                            <ul className="pagination d-flex flex-wrap align-items-center gap-2 justify-content-center">
                                {pagination.map((link, i) => (
                                    <li key={i}>
                                        <button
                                            className={`btn ${link.active ? 'btn-primary-600' : 'btn-neutral-200'} ${!link.url ? 'disabled' : ''} radius-8 py-6 px-12 fw-medium text-sm`}
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
