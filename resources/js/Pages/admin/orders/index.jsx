import React, { useEffect, useMemo, useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AdminDashboard from '@/Layouts/AdminDashboard';
import Breadcrumb from '@/Components/Breadcrumb';
import { Icon } from '@iconify/react';

const money = (value) => {
    const amount = Number(value || 0);
    return `LKR ${amount.toLocaleString('en-LK', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })}`;
};

const statusPalette = {
    pending: 'tw-bg-amber-100 tw-text-amber-700',
    estimating: 'tw-bg-slate-100 tw-text-slate-700',
    quoted: 'tw-bg-sky-100 tw-text-sky-700',
    awaiting_approval: 'tw-bg-emerald-100 tw-text-emerald-700',
    confirmed: 'tw-bg-blue-100 tw-text-blue-700',
    production: 'tw-bg-purple-100 tw-text-purple-700',
    ready_for_dispatch: 'tw-bg-indigo-100 tw-text-indigo-700',
    shipped: 'tw-bg-cyan-100 tw-text-cyan-700',
    completed: 'tw-bg-emerald-200 tw-text-emerald-900',
    on_hold: 'tw-bg-orange-100 tw-text-orange-700',
    cancelled: 'tw-bg-rose-100 tw-text-rose-700',
};

const StatusBadge = ({ status, label }) => {
    const classes = statusPalette[status] || 'tw-bg-gray-100 tw-text-gray-700';
    return (
        <span className={`tw-inline-flex tw-items-center tw-rounded-full tw-px-2.5 tw-py-1 tw-text-xs tw-font-semibold ${classes}`}>
            {label}
        </span>
    );
};

const OrderIndex = ({ orders, filters, statusOptions, workingGroups, statusSummary, userDetails }) => {
    const [search, setSearch] = useState(filters.search || '');
    const [from, setFrom] = useState(filters.from || '');
    const [to, setTo] = useState(filters.to || '');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        setSearch(filters.search || '');
    }, [filters.search]);

    const applyFilters = (extra = {}) => {
        setLoading(true);
        router.get(
            route('admin.orders.index'),
            {
                ...filters,
                search,
                from,
                to,
                ...extra,
            },
            {
                preserveScroll: true,
                preserveState: true,
                onFinish: () => setLoading(false),
            },
        );
    };

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        applyFilters();
    };

    const activeStatus = filters.status || 'all';

    const summaryMap = useMemo(() => {
        const map = {};
        (statusSummary || []).forEach((row) => {
            map[row.status] = row;
        });
        return map;
    }, [statusSummary]);

    return (
        <AdminDashboard userDetails={userDetails}>
            <Head title="Orders" />
            <div className="tw-flex tw-flex-col sm:tw-flex-row tw-items-start sm:tw-items-center tw-justify-between tw-mb-6 tw-gap-4">
                <div>
                    <Breadcrumb items={[
                        { label: 'Dashboard', href: route('admin.dashboard') },
                        { label: 'Orders' },
                    ]}/>
                    <h1 className="tw-text-3xl tw-font-bold tw-text-slate-900 tw-mt-2 tw-flex tw-items-center tw-gap-3">
                        <Icon icon="solar:clipboard-list-bold-duotone" className="tw-text-blue-600" />
                        Order Management
                    </h1>
                </div>
                <div className="tw-flex tw-items-center tw-gap-2 tw-text-sm tw-text-slate-500 tw-bg-slate-50 tw-px-4 tw-py-2 tw-rounded-lg tw-border tw-border-slate-200">
                    <Icon icon="solar:info-circle-bold-duotone" className="tw-text-lg tw-text-blue-500" />
                    <span className="tw-hidden sm:tw-inline">Manage and track all customer orders</span>
                </div>
            </div>

            <section className="tw-grid tw-gap-4 lg:tw-grid-cols-6 tw-mb-8">
                {statusOptions.slice(0, 5).map((status) => {
                    const row = summaryMap[status.value] || { total: 0, value: 0 };
                    const isActive = activeStatus === status.value;
                    return (
                        <button
                            key={status.value}
                            onClick={() => applyFilters({ status: status.value })}
                            className={`tw-rounded-xl tw-bg-white tw-border-2 tw-p-5 tw-flex tw-flex-col tw-gap-2 tw-shadow-sm tw-transition-all tw-duration-200 hover:tw-shadow-lg hover:tw--translate-y-1 tw-text-left ${
                                isActive ? 'tw-border-blue-500 tw-ring-2 tw-ring-blue-200' : 'tw-border-slate-200 hover:tw-border-slate-300'
                            }`}
                        >
                            <div className="tw-flex tw-items-center tw-justify-between tw-gap-2">
                                <StatusBadge status={status.value} label={status.label}/>
                                {isActive && <Icon icon="solar:check-circle-bold" className="tw-text-blue-500 tw-text-lg" />}
                            </div>
                            <span className="tw-text-3xl tw-font-bold tw-text-slate-900">{row.total || 0}</span>
                            <div className="tw-flex tw-items-center tw-justify-between">
                                <span className="tw-text-sm tw-font-medium tw-text-slate-600">{money(row.value || 0)}</span>
                                <Icon icon="solar:arrow-right-line-duotone" className="tw-text-slate-400" />
                            </div>
                        </button>
                    );
                })}
                <div className="tw-rounded-xl tw-bg-gradient-to-br tw-from-blue-600 tw-to-blue-800 tw-text-white tw-p-5 tw-flex tw-flex-col tw-gap-2 tw-shadow-lg tw-relative tw-overflow-hidden">
                    <div className="tw-absolute tw-top-0 tw-right-0 tw-w-32 tw-h-32 tw-bg-white/10 tw-rounded-full tw--mr-16 tw--mt-16"></div>
                    <div className="tw-absolute tw-bottom-0 tw-left-0 tw-w-24 tw-h-24 tw-bg-white/10 tw-rounded-full tw--ml-12 tw--mb-12"></div>
                    <div className="tw-relative tw-z-10">
                        <span className="tw-text-sm tw-font-semibold tw-uppercase tw-tracking-wider tw-text-blue-100 tw-flex tw-items-center tw-gap-2">
                            <Icon icon="solar:chart-2-bold-duotone" className="tw-text-lg" />
                            Total Orders
                        </span>
                        <span className="tw-text-4xl tw-font-bold tw-mt-2 tw-block">{orders.total}</span>
                        <span className="tw-text-xs tw-text-blue-100 tw-mt-1 tw-block">In current filter</span>
                    </div>
                </div>
            </section>

            <form onSubmit={handleSearchSubmit} className="tw-rounded-2xl tw-bg-white tw-border tw-border-slate-200 tw-p-6 tw-mb-6 tw-shadow-md">
                <div className="tw-flex tw-items-center tw-gap-3 tw-mb-6 tw-pb-4 tw-border-b tw-border-slate-200">
                    <div className="tw-w-10 tw-h-10 tw-rounded-full tw-bg-blue-100 tw-flex tw-items-center tw-justify-center">
                        <Icon icon="solar:filters-bold-duotone" className="tw-text-blue-600 tw-text-xl" />
                    </div>
                    <div>
                        <h2 className="tw-text-lg tw-font-bold tw-text-slate-900">Filters & Search</h2>
                        <p className="tw-text-xs tw-text-slate-500">Refine your order list</p>
                    </div>
                </div>

                <div className="tw-grid tw-gap-4 lg:tw-grid-cols-12 tw-items-end tw-mb-6">
                    <div className="lg:tw-col-span-4">
                        <label className="tw-text-xs tw-font-bold tw-text-slate-700 tw-block tw-mb-2 tw-uppercase tw-tracking-wide">
                            Search Orders
                        </label>
                        <div className="tw-relative">
                            <Icon icon="solar:magnifer-bold-duotone" className="tw-absolute tw-left-3 tw-top-1/2 tw--translate-y-1/2 tw-text-slate-400 tw-text-xl" />
                            <input
                                type="text"
                                className="tw-w-full tw-rounded-lg tw-border tw-border-slate-300 tw-pl-11 tw-pr-4 tw-py-2.5 tw-text-sm focus:tw-ring-2 focus:tw-ring-blue-500/40 focus:tw-border-blue-400 tw-transition-all"
                                placeholder="Customer, email, phone or order #"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                            {search && (
                                <button
                                    type="button"
                                    onClick={() => setSearch('')}
                                    className="tw-absolute tw-right-3 tw-top-1/2 tw--translate-y-1/2 tw-text-slate-400 hover:tw-text-slate-600"
                                >
                                    <Icon icon="solar:close-circle-bold" className="tw-text-lg" />
                                </button>
                            )}
                        </div>
                    </div>
                    <div className="lg:tw-col-span-2">
                        <label className="tw-text-xs tw-font-bold tw-text-slate-700 tw-block tw-mb-2 tw-uppercase tw-tracking-wide">
                            Working Group
                        </label>
                        <select
                            value={filters.working_group_id || ''}
                            onChange={(e) => applyFilters({ working_group_id: e.target.value || null })}
                            className="tw-w-full tw-rounded-lg tw-border tw-border-slate-300 tw-py-2.5 tw-px-3 tw-text-sm focus:tw-ring-2 focus:tw-ring-blue-500/40 focus:tw-border-blue-400 tw-transition-all"
                        >
                            <option value="">All Groups</option>
                            {workingGroups.map((wg) => (
                                <option key={wg.id} value={wg.id}>{wg.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="lg:tw-col-span-2">
                        <label className="tw-text-xs tw-font-bold tw-text-slate-700 tw-block tw-mb-2 tw-uppercase tw-tracking-wide">
                            From Date
                        </label>
                        <input
                            type="date"
                            value={from}
                            onChange={(e) => setFrom(e.target.value)}
                            className="tw-w-full tw-rounded-lg tw-border tw-border-slate-300 tw-py-2.5 tw-px-3 tw-text-sm focus:tw-ring-2 focus:tw-ring-blue-500/40 focus:tw-border-blue-400 tw-transition-all"
                        />
                    </div>
                    <div className="lg:tw-col-span-2">
                        <label className="tw-text-xs tw-font-bold tw-text-slate-700 tw-block tw-mb-2 tw-uppercase tw-tracking-wide">
                            To Date
                        </label>
                        <input
                            type="date"
                            value={to}
                            onChange={(e) => setTo(e.target.value)}
                            className="tw-w-full tw-rounded-lg tw-border tw-border-slate-300 tw-py-2.5 tw-px-3 tw-text-sm focus:tw-ring-2 focus:tw-ring-blue-500/40 focus:tw-border-blue-400 tw-transition-all"
                        />
                    </div>
                    <div className="lg:tw-col-span-2 tw-flex tw-gap-2">
                        <button
                            type="submit"
                            className="tw-flex-1 tw-inline-flex tw-items-center tw-justify-center tw-gap-2 tw-rounded-lg tw-bg-blue-600 tw-text-white tw-py-2.5 tw-text-sm tw-font-semibold hover:tw-bg-blue-700 focus:tw-ring-2 focus:tw-ring-offset-2 focus:tw-ring-blue-500 disabled:tw-opacity-60 tw-transition-all tw-shadow-md hover:tw-shadow-lg"
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <Icon icon="svg-spinners:ring-resize" className="tw-text-lg" />
                                    Loading...
                                </>
                            ) : (
                                <>
                                    <Icon icon="solar:filter-bold-duotone" className="tw-text-lg" />
                                    Apply
                                </>
                            )}
                        </button>
                        <button
                            type="button"
                            className="tw-inline-flex tw-items-center tw-justify-center tw-gap-1 tw-rounded-lg tw-border-2 tw-border-slate-300 tw-bg-white tw-py-2.5 tw-px-3 tw-text-sm tw-font-semibold tw-text-slate-700 hover:tw-border-slate-400 hover:tw-bg-slate-50 tw-transition-all"
                            onClick={() => {
                                setSearch('');
                                setFrom('');
                                setTo('');
                                applyFilters({
                                    search: '',
                                    from: null,
                                    to: null,
                                    working_group_id: null,
                                });
                            }}
                        >
                            <Icon icon="solar:restart-bold" className="tw-text-lg" />
                        </button>
                    </div>
                </div>

                <div className="tw-flex tw-flex-wrap tw-gap-2">
                    <button
                        type="button"
                        onClick={() => applyFilters({ status: 'all' })}
                        className={`tw-inline-flex tw-items-center tw-gap-1.5 tw-rounded-full tw-border-2 tw-px-4 tw-py-2 tw-text-xs tw-font-bold tw-transition-all tw-uppercase tw-tracking-wide ${
                            activeStatus === 'all'
                                ? 'tw-bg-slate-900 tw-text-white tw-border-slate-900 tw-shadow-md'
                                : 'tw-border-slate-300 tw-text-slate-600 hover:tw-border-slate-400 hover:tw-bg-slate-50'
                        }`}
                    >
                        <Icon icon="solar:list-check-bold-duotone" className="tw-text-base" />
                        All Orders
                        <span className={`tw-ml-1 tw-px-2 tw-py-0.5 tw-rounded-full tw-text-[10px] ${
                            activeStatus === 'all' ? 'tw-bg-white/20' : 'tw-bg-slate-200'
                        }`}>
                            {orders.total}
                        </span>
                    </button>
                    {statusOptions.map((status) => (
                        <button
                            key={status.value}
                            type="button"
                            onClick={() => applyFilters({ status: status.value })}
                            className={`tw-inline-flex tw-items-center tw-gap-1.5 tw-rounded-full tw-border-2 tw-px-4 tw-py-2 tw-text-xs tw-font-bold tw-transition-all ${
                                activeStatus === status.value
                                    ? 'tw-bg-slate-900 tw-text-white tw-border-slate-900 tw-shadow-md'
                                    : 'tw-border-slate-300 tw-text-slate-600 hover:tw-border-slate-400 hover:tw-bg-slate-50'
                            }`}
                        >
                            {status.label}
                            <span className={`tw-px-2 tw-py-0.5 tw-rounded-full tw-text-[10px] tw-font-semibold ${
                                activeStatus === status.value ? 'tw-bg-white/20' : 'tw-bg-slate-200'
                            }`}>
                                {(summaryMap[status.value]?.total) || 0}
                            </span>
                        </button>
                    ))}
                </div>
            </form>

            <div className="tw-overflow-hidden tw-rounded-2xl tw-bg-white tw-border tw-border-slate-200 tw-shadow-lg">
                <div className="tw-px-6 tw-py-4 tw-bg-gradient-to-r tw-from-slate-50 tw-to-white tw-border-b tw-border-slate-200">
                    <div className="tw-flex tw-items-center tw-justify-between">
                        <div className="tw-flex tw-items-center tw-gap-3">
                            <div className="tw-w-10 tw-h-10 tw-rounded-lg tw-bg-blue-100 tw-flex tw-items-center tw-justify-center">
                                <Icon icon="solar:bag-4-bold-duotone" className="tw-text-blue-600 tw-text-xl" />
                            </div>
                            <div>
                                <h3 className="tw-text-lg tw-font-bold tw-text-slate-900">Orders List</h3>
                                <p className="tw-text-xs tw-text-slate-500">Showing {orders.from || 0} - {orders.to || 0} of {orders.total} orders</p>
                            </div>
                        </div>
                        <div className="tw-hidden md:tw-flex tw-items-center tw-gap-2 tw-text-xs tw-text-slate-500">
                            <Icon icon="solar:calendar-bold-duotone" className="tw-text-base tw-text-blue-500" />
                            Updated: {new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </div>
                    </div>
                </div>
                <div className="tw-overflow-x-auto">
                    <table className="tw-min-w-full tw-divide-y tw-divide-slate-200">
                        <thead className="tw-bg-slate-100">
                            <tr className="tw-text-left tw-text-xs tw-font-bold tw-text-slate-700 tw-uppercase tw-tracking-wider">
                                <th className="tw-px-6 tw-py-4">Order Details</th>
                                <th className="tw-px-6 tw-py-4">Customer</th>
                                <th className="tw-px-6 tw-py-4">Working Group</th>
                                <th className="tw-px-6 tw-py-4">Status</th>
                                <th className="tw-px-6 tw-py-4 tw-text-right">Amount</th>
                                <th className="tw-px-6 tw-py-4 tw-text-center">Items</th>
                                <th className="tw-px-6 tw-py-4">Created</th>
                                <th className="tw-px-6 tw-py-4 tw-text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="tw-divide-y tw-divide-slate-100 tw-text-sm tw-text-slate-600">
                            {orders.data.map((order) => {
                                const createdAt = order.created_at ? new Date(order.created_at) : null;
                                const createdLabel = createdAt
                                    ? createdAt.toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                                    : '—';
                                const status = statusOptions.find((s) => s.value === order.status);
                                const statusLabel = status ? status.label : order.status;
                                const customerName = order.contact?.name || '—';
                                return (
                                    <tr key={order.id} className="hover:tw-bg-blue-50/50 tw-transition-colors tw-duration-150 tw-group">
                                        <td className="tw-px-6 tw-py-4">
                                            <div className="tw-flex tw-items-center tw-gap-3">
                                                <div className="tw-w-10 tw-h-10 tw-rounded-lg tw-bg-gradient-to-br tw-from-blue-100 tw-to-blue-200 tw-flex tw-items-center tw-justify-center tw-flex-shrink-0">
                                                    <Icon icon="solar:document-text-bold-duotone" className="tw-text-blue-600 tw-text-lg" />
                                                </div>
                                                <div className="tw-flex tw-flex-col">
                                                    <span className="tw-font-bold tw-text-slate-900 group-hover:tw-text-blue-600 tw-transition-colors">{order.number}</span>
                                                    <span className="tw-text-xs tw-text-slate-400">ID: #{order.id}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="tw-px-6 tw-py-4">
                                            <div className="tw-flex tw-flex-col tw-gap-1">
                                                <span className="tw-font-semibold tw-text-slate-800">{customerName}</span>
                                                <span className="tw-text-xs tw-text-slate-500 tw-flex tw-items-center tw-gap-1">
                                                    {order.contact?.email ? (
                                                        <>
                                                            <Icon icon="solar:letter-bold-duotone" className="tw-text-sm" />
                                                            {order.contact.email}
                                                        </>
                                                    ) : order.contact?.phone ? (
                                                        <>
                                                            <Icon icon="solar:phone-bold-duotone" className="tw-text-sm" />
                                                            {order.contact.phone}
                                                        </>
                                                    ) : '—'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="tw-px-6 tw-py-4">
                                            <span className="tw-inline-flex tw-items-center tw-gap-1.5 tw-px-2.5 tw-py-1 tw-rounded-full tw-bg-slate-100 tw-text-xs tw-font-medium tw-text-slate-700">
                                                <Icon icon="solar:users-group-rounded-bold-duotone" className="tw-text-sm" />
                                                {order.working_group?.name || 'Unassigned'}
                                            </span>
                                        </td>
                                        <td className="tw-px-6 tw-py-4">
                                            <StatusBadge status={order.status} label={statusLabel}/>
                                        </td>
                                        <td className="tw-px-6 tw-py-4 tw-text-right">
                                            <div className="tw-flex tw-flex-col tw-items-end tw-gap-1">
                                                <span className="tw-font-bold tw-text-slate-900 tw-text-base">{money(order.total_amount)}</span>
                                                <span className="tw-text-xs tw-text-slate-400">Sub: {money(order.subtotal_amount)}</span>
                                            </div>
                                        </td>
                                        <td className="tw-px-6 tw-py-4 tw-text-center">
                                            <span className="tw-inline-flex tw-items-center tw-justify-center tw-w-8 tw-h-8 tw-rounded-full tw-bg-blue-100 tw-text-blue-700 tw-font-bold tw-text-sm">
                                                {order.items_count}
                                            </span>
                                        </td>
                                        <td className="tw-px-6 tw-py-4">
                                            <div className="tw-flex tw-items-center tw-gap-1.5 tw-text-xs tw-text-slate-500">
                                                <Icon icon="solar:calendar-bold-duotone" className="tw-text-sm tw-text-slate-400" />
                                                {createdLabel}
                                            </div>
                                        </td>
                                        <td className="tw-px-6 tw-py-4 tw-text-center">
                                            <Link
                                                href={route('admin.orders.show', order.id)}
                                                className="tw-inline-flex tw-items-center tw-gap-1.5 tw-rounded-lg tw-border-2 tw-border-blue-600 tw-bg-blue-600 tw-px-4 tw-py-2 tw-text-xs tw-font-bold tw-text-white hover:tw-bg-blue-700 hover:tw-border-blue-700 tw-transition-all tw-shadow-md hover:tw-shadow-lg"
                                            >
                                                <Icon icon="solar:eye-bold-duotone" className="tw-text-sm" />
                                                View
                                            </Link>
                                        </td>
                                    </tr>
                                );
                            })}
                            {orders.data.length === 0 && (
                                <tr>
                                    <td colSpan={8} className="tw-px-6 tw-py-16 tw-text-center">
                                        <div className="tw-flex tw-flex-col tw-items-center tw-gap-3">
                                            <div className="tw-w-16 tw-h-16 tw-rounded-full tw-bg-slate-100 tw-flex tw-items-center tw-justify-center">
                                                <Icon icon="solar:inbox-line-bold-duotone" className="tw-text-slate-400 tw-text-3xl" />
                                            </div>
                                            <div>
                                                <p className="tw-text-sm tw-font-semibold tw-text-slate-700 tw-mb-1">No orders found</p>
                                                <p className="tw-text-xs tw-text-slate-500">Try adjusting your filters or search criteria</p>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {orders.links.length > 1 && (
                    <div className="tw-flex tw-flex-col sm:tw-flex-row tw-items-center tw-justify-between tw-gap-4 tw-px-6 tw-py-4 tw-border-t tw-border-slate-200 tw-bg-gradient-to-r tw-from-slate-50 tw-to-white">
                        <div className="tw-flex tw-items-center tw-gap-2 tw-text-sm tw-text-slate-600">
                            <Icon icon="solar:document-text-bold-duotone" className="tw-text-blue-500" />
                            <span className="tw-font-semibold">
                                Showing <span className="tw-text-blue-600">{orders.from}</span> – <span className="tw-text-blue-600">{orders.to}</span> of <span className="tw-text-blue-600">{orders.total}</span> orders
                            </span>
                        </div>
                        <div className="tw-flex tw-gap-1 tw-flex-wrap tw-justify-center">
                            {orders.links.map((link, idx) => (
                                <Link
                                    // eslint-disable-next-line react/no-array-index-key
                                    key={idx}
                                    href={link.url || '#'}
                                    className={`tw-min-w-[40px] tw-h-10 tw-flex tw-items-center tw-justify-center tw-rounded-lg tw-text-sm tw-font-bold tw-px-3 tw-transition-all tw-duration-200 ${
                                        link.active
                                            ? 'tw-bg-blue-600 tw-text-white tw-shadow-lg tw-scale-110'
                                            : link.url
                                                ? 'tw-bg-white tw-text-slate-700 tw-border-2 tw-border-slate-200 hover:tw-border-blue-400 hover:tw-bg-blue-50 hover:tw-text-blue-600'
                                                : 'tw-bg-slate-100 tw-text-slate-400 tw-cursor-not-allowed'
                                    }`}
                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                    preserveScroll
                                />
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </AdminDashboard>
    );
};

export default OrderIndex;
