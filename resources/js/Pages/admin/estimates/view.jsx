// resources/js/Pages/Admin/EstimateView.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Head, Link, router, usePage } from "@inertiajs/react";
import AdminDashboard from "@/Layouts/AdminDashboard";
import Breadcrumb from "@/Components/Breadcrumb";
import { Icon } from "@iconify/react";
import CookiesV from "@/Components/CookieConsent";
import Alert from "@/Components/Alert";
import Meta from "@/Components/Metaheads";

/**
 * EstimateView (Admin)
 * - Bootstrap table + Tailwind utilities
 * - Server-driven pagination & sorting
 * - Debounced search, filters (status, group, amount range, date range, PO)
 * - Sticky toolbar, responsive table, compact rows
 * - Preserves query string with Inertia router.get
 * - Safe sort whitelist handled server-side (controller accepts `sort_by`, `sort_dir`)
 */

const STATUSES = [
    { value: "", label: "None" },
    { value: "draft", label: "Draft" },
    { value: "published", label: "Published" },
    { value: "expired", label: "Expired" },
];

const SORT_ICONS = {
    none: "mdi:unfold-more-horizontal",
    asc: "mdi:chevron-up",
    desc: "mdi:chevron-down",
};

const useDebounced = (value, delay = 400) => {
    const [v, setV] = useState(value);
    useEffect(() => {
        const t = setTimeout(() => setV(value), delay);
        return () => clearTimeout(t);
    }, [value, delay]);
    return v;
};

export default function EstimateView({
    userDetails,
    estimates = { data: [], links: [], meta: {} },
    workingGroups = [],
    filters = {},
    aggregates = null,
}) {
    const { url } = usePage();
    const [alert, setAlert] = useState(null);

    // Local UI state mirrors current filters
    const [perPage, setPerPage] = useState(Number(filters?.per_page || 10));
    const [search, setSearch] = useState(filters?.search || "");
    const [status, setStatus] = useState(filters?.status || "");
    const [group, setGroup] = useState(filters?.group || "");
    const [minTotal, setMinTotal] = useState(filters?.min_total || "");
    const [maxTotal, setMaxTotal] = useState(filters?.max_total || "");
    const [validFrom, setValidFrom] = useState(filters?.valid_from || "");
    const [validTo, setValidTo] = useState(filters?.valid_to || "");
    const [po, setPo] = useState(filters?.po || "");
    const [sortBy, setSortBy] = useState(filters?.sort_by || "valid_from");
    const [sortDir, setSortDir] = useState(filters?.sort_dir || "desc");

    const debouncedSearch = useDebounced(search);
    const debouncedPO = useDebounced(po);
    const debouncedMin = useDebounced(minTotal);
    const debouncedMax = useDebounced(maxTotal);

    // Build query params consistently
    const buildQuery = () => ({
        per_page: perPage,
        search: debouncedSearch || undefined,
        status: status || undefined,
        group: group || undefined,
        min_total: debouncedMin || undefined,
        max_total: debouncedMax || undefined,
        valid_from: validFrom || undefined,
        valid_to: validTo || undefined,
        po: debouncedPO || undefined,
        sort_by: sortBy,
        sort_dir: sortDir,
    });

    // Trigger fetch when any debounced filter changes
    useEffect(() => {
        if (!filters) return;
        router.get(route("admin.estimates"), buildQuery(), {
            preserveState: true,
            preserveScroll: true,
            replace: true,
            only: ["estimates", "filters", "aggregates", "workingGroups"],
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [debouncedSearch, debouncedPO, debouncedMin, debouncedMax]);

    const onChangeSimple = (setter) => (e) => setter(e.target.value);

    const onChangePerPage = (e) => {
        const v = Number(e.target.value || 10);
        setPerPage(v);
        router.get(
            route("admin.estimates"),
            { ...buildQuery(), per_page: v },
            {
                preserveState: true,
                preserveScroll: true,
                replace: true,
                only: ["estimates", "filters", "aggregates"],
            }
        );
    };

    const onChangeStatus = onChangeSimple(setStatus);
    const onChangeGroup = onChangeSimple(setGroup);
    const onChangeDate = (setter) => (e) => setter(e.target.value);

    useEffect(() => {
        // refetch when non-debounced filters change (status, group, date, perPage, sort)
        router.get(route("admin.estimates"), buildQuery(), {
            preserveState: true,
            preserveScroll: true,
            replace: true,
            only: ["estimates", "filters", "aggregates"],
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [status, group, validFrom, validTo, perPage, sortBy, sortDir]);

    const toggleSort = (col) => {
        if (sortBy !== col) {
            setSortBy(col);
            setSortDir("asc");
        } else {
            setSortDir((d) => (d === "asc" ? "desc" : "asc"));
        }
    };

    const sortIconFor = (col) => {
        if (sortBy !== col) return SORT_ICONS.none;
        return sortDir === "asc" ? SORT_ICONS.asc : SORT_ICONS.desc;
    };

    const badge = (s) => {
        const base =
            "tw-inline-flex tw-items-center tw-gap-1 tw-text-xs tw-font-medium tw-rounded-full tw-px-2.5 tw-py-1";
        const map = {
            draft:
                "tw-bg-zinc-100 dark:tw-bg-zinc-800 tw-text-zinc-700 dark:tw-text-zinc-100",
            published:
                "tw-bg-emerald-100 dark:tw-bg-emerald-900/40 tw-text-emerald-700 dark:tw-text-emerald-200",
            expired:
                "tw-bg-rose-100 dark:tw-bg-rose-900/40 tw-text-rose-700 dark:tw-text-rose-200",
        };
        return <span className={`${base} ${map[s] || "tw-bg-zinc-100"}`}>{s}</span>;
    };

    const money = (n) =>
        new Intl.NumberFormat("en-LK", {
            style: "currency",
            currency: "LKR",
            maximumFractionDigits: 2,
        }).format(Number(n || 0));

    const headCell = (key, label, className = "") => (
        <th className={`text-start ${className}`}>
            <button
                type="button"
                onClick={() => toggleSort(key)}
                className="btn btn-link p-0 tw-no-underline tw-text-zinc-500 hover:tw-text-zinc-800 dark:tw-text-zinc-400 dark:hover:tw-text-zinc-100 tw-text-[0.78rem] tw-font-semibold"
                title={`Sort by ${label}`}
            >
                <span className="tw-align-middle">{label}</span>
                <Icon icon={sortIconFor(key)} className="tw-text-base tw-ms-1" />
            </button>
        </th>
    );

    const pagination = estimates?.links || estimates?.meta?.links || [];

    const goToPage = (href) => {
        if (!href) return;
        router.get(href, {}, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
            only: ["estimates", "filters", "aggregates"],
        });
    };

    return (
        <>
            {/* Drop-in styles (you can move to your global CSS) */}
            <style>{`
        .btn-circle {
          width: 38px; height: 38px; border-radius: 50%;
          display: inline-flex; align-items: center; justify-content: center;
          line-height: 1; padding: 0;
          transition: transform .15s ease, box-shadow .15s ease;
          border: 0;
        }
        .btn-circle:hover { transform: translateY(-1px); }

        .btn-soft-primary { background: rgba(var(--bs-primary-rgb), .12); color: var(--bs-primary); }
        .btn-soft-success { background: rgba(var(--bs-success-rgb), .12); color: var(--bs-success); }
        .btn-soft-danger  { background: rgba(var(--bs-danger-rgb),  .12); color: var(--bs-danger); }

        .btn-soft-primary:hover { background: rgba(var(--bs-primary-rgb), .18); }
        .btn-soft-success:hover { background: rgba(var(--bs-success-rgb), .18); }
        .btn-soft-danger:hover  { background: rgba(var(--bs-danger-rgb),  .18); }

        .table thead th {
          font-weight: 600; font-size: .75rem; letter-spacing: .02em; color: #6b7280;
        }
        .table tbody td { vertical-align: middle; }
      `}</style>

            <Head title="Estimates - Admin Dashboard" />
            <Meta title="Estimates - Admin Dashboard" description="Manage your estimates" />

            <AdminDashboard userDetails={userDetails}>
                <Breadcrumb title="Estimates" />
                {alert && (
                    <Alert
                        type={alert.type}
                        message={alert.message}
                        onClose={() => setAlert(null)}
                    />
                )}

                {/* Header / Toolbar */}
                <div className="card h-100 p-0 radius-12">
                    <div className="card-header border-bottom bg-base py-16 px-24 tw-sticky tw-top-0 tw-z-10">
                        <div className="d-flex align-items-center justify-content-between gap-3 flex-wrap">
                            <div className="tw-font-semibold tw-text-black dark:tw-text-white tw-text-2xl">
                                Estimates
                            </div>

                            <div className="d-flex align-items-center flex-wrap gap-2">
                                <span className="text-md fw-medium text-secondary-light mb-0">
                                    Show
                                </span>
                                <select
                                    name="per_page"
                                    className="form-select form-select-sm w-auto ps-12 py-6 radius-12 h-40-px"
                                    value={perPage}
                                    onChange={onChangePerPage}
                                >
                                    {[5, 10, 20, 25, 50, 100].map((n) => (
                                        <option key={n} value={n}>
                                            {n}
                                        </option>
                                    ))}
                                </select>

                                <input
                                    type="text"
                                    name="search"
                                    className="bg-base h-40-px w-auto form-input ps-12"
                                    placeholder="Search (Est # / WG / Customer)"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                />

                                <input
                                    type="text"
                                    name="po"
                                    className="bg-base h-40-px w-auto form-input ps-12"
                                    placeholder="PO #"
                                    value={po}
                                    onChange={(e) => setPo(e.target.value)}
                                />

                                <select
                                    name="status"
                                    className="form-select form-select-sm w-auto ps-12 py-6 radius-12 h-40-px"
                                    value={status}
                                    onChange={onChangeStatus}
                                >
                                    {STATUSES.map((s) => (
                                        <option key={s.value} value={s.value}>
                                            {s.label}
                                        </option>
                                    ))}
                                </select>

                                <select
                                    name="working_group"
                                    className="form-select form-select-sm w-auto ps-12 py-6 radius-12 h-40-px"
                                    value={group}
                                    onChange={onChangeGroup}
                                >
                                    <option value="">None</option>
                                    {workingGroups.map((wg) => (
                                        <option key={wg.id} value={wg.id}>
                                            {wg.name}
                                        </option>
                                    ))}
                                </select>

                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    className="bg-base h-40-px w-120-px form-input ps-12"
                                    placeholder="Min LKR"
                                    value={minTotal}
                                    onChange={(e) => setMinTotal(e.target.value)}
                                />
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    className="bg-base h-40-px w-120-px form-input ps-12"
                                    placeholder="Max LKR"
                                    value={maxTotal}
                                    onChange={(e) => setMaxTotal(e.target.value)}
                                />

                                <input
                                    type="date"
                                    className="bg-base h-40-px w-auto form-input ps-12"
                                    value={validFrom}
                                    onChange={onChangeDate(setValidFrom)}
                                />
                                <input
                                    type="date"
                                    className="bg-base h-40-px w-auto form-input ps-12"
                                    value={validTo}
                                    onChange={onChangeDate(setValidTo)}
                                />

                                <Link
                                    href={route("admin.addEstimate")}
                                    className="btn btn-primary text-sm btn-sm px-12 py-12 radius-8 d-flex align-items-center gap-2"
                                >
                                    <Icon icon="ic:baseline-plus" className="icon text-xl line-height-1" />
                                    Add New Estimate
                                </Link>
                            </div>
                        </div>

                        {aggregates && (
                            <div className="tw-mt-3 tw-flex tw-flex-wrap tw-gap-2">
                                <div className="tw-text-xs tw-text-zinc-500 dark:tw-text-zinc-400">
                                    All: <span className="tw-font-semibold">{aggregates.count_all}</span>{" "}
                                    | Sum:{" "}
                                    <span className="tw-font-semibold">{money(aggregates.sum_all)}</span>
                                </div>
                                <div className="tw-text-xs">
                                    Draft: <span className="tw-font-semibold">{money(aggregates.draft)}</span>
                                </div>
                                <div className="tw-text-xs">
                                    Published:{" "}
                                    <span className="tw-font-semibold">{money(aggregates.published)}</span>
                                </div>
                                <div className="tw-text-xs">
                                    Expired:{" "}
                                    <span className="tw-font-semibold">{money(aggregates.expired)}</span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Table */}
                    <div className="card-body p-0">
                        <div className="table-responsive">
                            <table className="table table-hover table-striped table-sm align-middle mb-0">
                                <thead className="table-light">
                                    <tr>
                                        {headCell("estimate_number", "Estimate #")}
                                        {headCell("customer", "Customer")}
                                        {headCell("working_group", "Group")}
                                        {headCell("valid_from", "Valid From")}
                                        {headCell("valid_to", "Valid To")}
                                        {headCell("total_amount", "Total (LKR)")}
                                        {headCell("status", "Status")}
                                        <th className="text-uppercase small fw-semibold text-secondary">
                                            Items
                                        </th>
                                        <th className="text-uppercase small fw-semibold text-secondary">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {estimates?.data?.length ? (
                                        estimates.data.map((e) => (
                                            <tr key={e.id} className="tw-text-sm">
                                                <td className="tw-font-medium tw-whitespace-nowrap">
                                                    <div className="tw-flex tw-items-center tw-gap-2">
                                                        <Icon icon="mdi:file-document-edit-outline" className="tw-text-lg" />
                                                        <span>#{e.estimate_number}</span>
                                                    </div>
                                                    {e.po_number && (
                                                        <div className="tw-text-[11px] tw-text-zinc-500">
                                                            PO: {e.po_number}
                                                        </div>
                                                    )}
                                                </td>

                                                <td className="tw-whitespace-nowrap">
                                                    {e.customer?.name || e.customer?.full_name || "—"}
                                                    {e.customer?.phone_number && (
                                                        <div className="tw-text-[11px] tw-text-zinc-500">
                                                            {e.customer.phone_number}
                                                        </div>
                                                    )}
                                                </td>

                                                <td className="tw-whitespace-nowrap">
                                                    {e.working_group?.name || "—"}
                                                </td>

                                                <td className="tw-whitespace-nowrap">
                                                    {e.valid_from
                                                        ? new Date(e.valid_from).toLocaleString()
                                                        : "—"}
                                                </td>

                                                <td className="tw-whitespace-nowrap">
                                                    {e.valid_to ? new Date(e.valid_to).toLocaleString() : "—"}
                                                </td>

                                                <td className="tw-font-semibold tw-whitespace-nowrap">
                                                    {money(e.total_amount)}
                                                </td>

                                                <td className="tw-whitespace-nowrap">{badge(e.status)}</td>

                                                <td className="text-center tw-whitespace-nowrap">
                                                    {e.items_count ?? e.items?.length ?? 0}
                                                </td>

                                                {/* Actions: circle soft buttons (View / Edit / Delete) */}
                                                <td className="text-nowrap">
                                                    <div className="d-flex align-items-center gap-2">
                                                        {/* View */}
                                                        <Link
                                                            href={route("admin.estimate.preview", e.id)}
                                                            className="btn btn-circle btn-soft-primary"
                                                            title="View"
                                                            aria-label={`View estimate ${e.estimate_number}`}
                                                        >
                                                            <Icon icon="mdi:eye-outline" className="fs-5" />
                                                        </Link>

                                                        {/* Edit */}
                                                        <Link
                                                            href={route("admin.estimates.edit", e.id)}
                                                            className="btn btn-circle btn-soft-success"
                                                            title="Edit"
                                                            aria-label={`Edit estimate ${e.estimate_number}`}
                                                        >
                                                            <Icon icon="mdi:pencil-outline" className="fs-5" />
                                                        </Link>

                                                        {/* Delete (hook up when ready) */}
                                                        <button
                                                            type="button"
                                                            className="btn btn-circle btn-soft-danger"
                                                            title="Delete"
                                                            aria-label={`Delete estimate ${e.estimate_number}`}
                                                            onClick={() => {
                                                                // TODO: open Bootstrap confirmation modal
                                                            }}
                                                        >
                                                            <Icon icon="mdi:trash-can-outline" className="fs-5" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td
                                                colSpan={9}
                                                className="tw-text-center tw-text-sm tw-text-zinc-500 tw-py-10"
                                            >
                                                No estimates found.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        <div className="d-flex align-items-center justify-content-between p-16 border-top">
                            <div className="tw-text-xs tw-text-zinc-500">
                                Showing {estimates?.from || 0}–{estimates?.to || 0} of{" "}
                                {estimates?.total || 0}
                            </div>
                            <div className="tw-flex tw-gap-1 tw-flex-wrap">
                                {pagination.map((l, i) => (
                                    <button
                                        key={i}
                                        type="button"
                                        disabled={!l.url}
                                        onClick={() => goToPage(l.url)}
                                        className={`btn btn-sm ${l.active ? "btn-primary" : "btn-light"
                                            } tw-min-w-[40px]`}
                                        dangerouslySetInnerHTML={{ __html: l.label }}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </AdminDashboard>
            <CookiesV />
        </>
    );
}
