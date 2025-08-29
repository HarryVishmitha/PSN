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
 * - Category-UI aligned: bordered table, compact rows, square pagination, circular soft icon actions
 * - Server-driven pagination & sorting
 * - Debounced search & filters (status, WG, amount range, date range, PO)
 * - Sticky toolbar, responsive table
 * - Preserves query string with Inertia router.get
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

    // Filters & sort
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

    // Fetch on debounced inputs
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
    const onChangeStatus = onChangeSimple(setStatus);
    const onChangeGroup = onChangeSimple(setGroup);
    const onChangeDate = (setter) => (e) => setter(e.target.value);

    const onChangePerPage = (e) => {
        const v = Number(e.target.value || 10);
        setPerPage(v);
        router.get(route("admin.estimates"), { ...buildQuery(), per_page: v }, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
            only: ["estimates", "filters", "aggregates"],
        });
    };

    // Fetch on non-debounced filters
    useEffect(() => {
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

    const money = (n) =>
        new Intl.NumberFormat("en-LK", {
            style: "currency",
            currency: "LKR",
            maximumFractionDigits: 2,
        }).format(Number(n || 0));

    const badge = (s) => {
        const map = {
            draft: "bg-neutral-200 text-secondary-light",
            published: "bg-success-focus text-success-600",
            expired: "bg-danger-focus text-danger-600",
        };
        return (
            <span className={`${map[s] || "bg-neutral-200 text-secondary-light"} px-24 py-4 radius-4 fw-medium text-sm`}>
                {s}
            </span>
        );
    };

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

    // Delete modal state
    const [selected, setSelected] = useState(null);
    const [deleteLoading, setDeleteLoading] = useState(false);

    const openDelete = (estimate) => {
        setSelected(estimate);
        const modalEl = document.getElementById("deleteEstimateModal");
        if (modalEl) {
            const bs = new bootstrap.Modal(modalEl);
            bs.show();
        }
    };

    const closeDeleteModal = () => {
        const modalEl = document.getElementById("deleteEstimateModal");
        if (modalEl) {
            const inst = bootstrap.Modal.getInstance(modalEl);
            inst?.hide();
        }
    };

    const confirmDelete = () => {
        if (!selected?.id) return;
        setDeleteLoading(true);
        setAlert(null);

        // Adjust route if your backend uses a different name
        router.delete(route("admin.estimates.destroy", selected.id), {
            preserveState: true,
            onSuccess: () => {
                setAlert({ type: "success", message: "Estimate deleted successfully!" });
            },
            onError: (error) => {
                setAlert({
                    type: "danger",
                    message: error?.response?.data?.error || "Failed to delete estimate. Please try again.",
                });
            },
            onFinish: () => {
                setDeleteLoading(false);
                closeDeleteModal();
            },
            only: ["estimates", "filters", "aggregates"],
        });
    };

    return (
        <>
            {/* Category-style quick tokens */}
            <style>{`
        .btn-circle { width: 38px; height: 38px; border-radius: 50%;
          display: inline-flex; align-items: center; justify-content: center; line-height: 1; padding: 0; border: 0;}
        .scroll-sm { scrollbar-width: thin; }
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

                <div className="card h-100 p-0 radius-12">
                    {/* Sticky header / toolbar */}
                    <div className="card-header border-bottom bg-base py-16 px-24 tw-sticky tw-top-0 tw-z-10">
                        <div className="d-flex align-items-center justify-content-between gap-3 flex-wrap">
                            <div className="tw-font-semibold tw-text-black dark:tw-text-white tw-text-2xl">
                                Estimates
                            </div>

                            <div className="d-flex align-items-center flex-wrap gap-2">
                                <span className="text-md fw-medium text-secondary-light mb-0">Show</span>
                                <select
                                    name="per_page"
                                    className="form-select form-select-sm w-auto ps-12 py-6 radius-12 h-40-px"
                                    value={perPage}
                                    onChange={onChangePerPage}
                                >
                                    {[5, 10, 20, 25, 50, 100].map((n) => (
                                        <option key={n} value={n}>{n}</option>
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
                                    All: <span className="tw-font-semibold">{aggregates.count_all}</span> | Sum:{" "}
                                    <span className="tw-font-semibold">{money(aggregates.sum_all)}</span>
                                </div>
                                <div className="tw-text-xs">
                                    Draft: <span className="tw-font-semibold">{money(aggregates.draft)}</span>
                                </div>
                                <div className="tw-text-xs">
                                    Published: <span className="tw-font-semibold">{money(aggregates.published)}</span>
                                </div>
                                <div className="tw-text-xs">
                                    Expired: <span className="tw-font-semibold">{money(aggregates.expired)}</span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Body */}
                    <div className="card-body p-24">
                        <div className="table-responsive scroll-sm">
                            <table className="table bordered-table sm-table mb-0">
                                <thead>
                                    <tr>
                                        {headCell("estimate_number", "Estimate #")}
                                        {headCell("customer", "Customer")}
                                        {headCell("working_group", "Group")}
                                        {headCell("valid_from", "Valid From")}
                                        {headCell("valid_to", "Valid To")}
                                        {headCell("total_amount", "Total (LKR)")}
                                        {headCell("status", "Status")}
                                        <th className="text-uppercase small fw-semibold text-secondary">Items</th>
                                        <th className="text-uppercase small fw-semibold text-secondary text-center">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {estimates?.data?.length ? (
                                        estimates.data.map((e, idx) => (
                                            <tr key={e.id} className="tw-text-sm">
                                                {/* Estimate # + PO */}
                                                <td className="tw-font-medium tw-whitespace-nowrap">
                                                    <div className="tw-flex tw-items-center tw-gap-2">
                                                        <Icon icon="mdi:file-document-edit-outline" className="tw-text-lg" />
                                                        <span>#{e.estimate_number}</span>
                                                    </div>
                                                    {e.po_number && (
                                                        <div className="text-xs text-secondary-light">PO: {e.po_number}</div>
                                                    )}
                                                </td>

                                                {/* Customer */}
                                                <td className="tw-whitespace-nowrap">
                                                    <span className="text-md mb-0 fw-normal text-secondary-light">
                                                        {e.customer?.name || e.customer?.full_name || "—"}
                                                    </span>
                                                    {e.customer?.phone_number && (
                                                        <div className="tw-text-[11px] tw-text-zinc-500">
                                                            {e.customer.phone_number}
                                                        </div>
                                                    )}
                                                </td>

                                                {/* Group */}
                                                <td className="tw-whitespace-nowrap text-secondary-light">
                                                    {e.working_group?.name || "—"}
                                                </td>

                                                {/* Dates */}
                                                <td className="tw-whitespace-nowrap">
                                                    {e.valid_from ? new Date(e.valid_from).toLocaleString() : "—"}
                                                </td>
                                                <td className="tw-whitespace-nowrap">
                                                    {e.valid_to ? new Date(e.valid_to).toLocaleString() : "—"}
                                                </td>

                                                {/* Total */}
                                                <td className="tw-font-semibold tw-whitespace-nowrap">
                                                    {money(e.total_amount)}
                                                </td>

                                                {/* Status */}
                                                <td className="tw-whitespace-nowrap">{badge(e.status)}</td>

                                                {/* Items count */}
                                                <td className="text-center tw-whitespace-nowrap">
                                                    {e.items_count ?? e.items?.length ?? 0}
                                                </td>

                                                {/* Actions */}
                                                <td className="text-center">
                                                    <div className="d-flex justify-content-center gap-10">
                                                        {/* View */}
                                                        <Link
                                                            href={route("admin.estimate.preview", e.id)}
                                                            className="bg-info-focus bg-hover-info-200 text-info-600 fw-medium w-40-px h-40-px d-flex justify-content-center align-items-center rounded-circle"
                                                            title="View"
                                                            aria-label={`View estimate ${e.estimate_number}`}
                                                        >
                                                            <Icon icon="majesticons:eye-line" className="icon text-xl" />
                                                        </Link>

                                                        {/* Edit */}
                                                        <Link
                                                            href={route("admin.estimates.edit", e.id)}
                                                            className="bg-success-focus bg-hover-success-200 text-success-600 fw-medium w-40-px h-40-px d-flex justify-content-center align-items-center rounded-circle"
                                                            title="Edit"
                                                            aria-label={`Edit estimate ${e.estimate_number}`}
                                                        >
                                                            <Icon icon="lucide:edit" className="menu-icon" />
                                                        </Link>

                                                        {/* Delete */}
                                                        <button
                                                            type="button"
                                                            className="remove-item-btn bg-danger-focus bg-hover-danger-200 text-danger-600 fw-medium w-40-px h-40-px d-flex justify-content-center align-items-center rounded-circle"
                                                            title="Delete"
                                                            aria-label={`Delete estimate ${e.estimate_number}`}
                                                            onClick={() => openDelete(e)}
                                                        >
                                                            <Icon icon="fluent:delete-24-regular" className="menu-icon" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={9} className="tw-text-center tw-text-sm tw-text-zinc-500 tw-py-10">
                                                No estimates found.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Category-style Pagination */}
                        <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mt-24">
                            <span className="text-sm text-secondary-light">
                                Showing {estimates?.from || 0} to {estimates?.to || 0} of {estimates?.total || 0} entries
                            </span>

                            <ul className="pagination d-flex flex-wrap align-items-center gap-2 justify-content-center mb-0">
                                {/* Prev */}
                                {pagination.find((p) => p.label.toLowerCase().includes("previous")) && (
                                    <li className="page-item">
                                        <button
                                            className="page-link bg-neutral-200 text-secondary-light fw-semibold radius-8 border-0 d-flex align-items-center justify-content-center h-32-px w-32-px text-md"
                                            disabled={!pagination.find((p) => p.label.toLowerCase().includes("previous"))?.url}
                                            onClick={() => goToPage(pagination.find((p) => p.label.toLowerCase().includes("previous"))?.url)}
                                        >
                                            <Icon icon="ep:d-arrow-left" />
                                        </button>
                                    </li>
                                )}

                                {/* Numbered */}
                                {pagination
                                    .filter((p) => /^\d+$/.test(p.label))
                                    .map((p, i) => (
                                        <li className="page-item" key={i}>
                                            <button
                                                className={`page-link fw-semibold radius-8 border-0 d-flex align-items-center justify-content-center h-32-px w-32-px text-md ${p.active ? "bg-primary-600 text-white" : "bg-neutral-200 text-secondary-light"
                                                    }`}
                                                onClick={() => goToPage(p.url)}
                                                disabled={!p.url}
                                            >
                                                {p.label}
                                            </button>
                                        </li>
                                    ))}

                                {/* Next */}
                                {pagination.find((p) => p.label.toLowerCase().includes("next")) && (
                                    <li className="page-item">
                                        <button
                                            className="page-link bg-neutral-200 text-secondary-light fw-semibold radius-8 border-0 d-flex align-items-center justify-content-center h-32-px w-32-px text-md"
                                            disabled={!pagination.find((p) => p.label.toLowerCase().includes("next"))?.url}
                                            onClick={() => goToPage(pagination.find((p) => p.label.toLowerCase().includes("next"))?.url)}
                                        >
                                            <Icon icon="ep:d-arrow-right" />
                                        </button>
                                    </li>
                                )}
                            </ul>
                        </div>
                    </div>
                </div>
            </AdminDashboard>

            {/* Delete Confirmation Modal */}
            <div className="modal fade" id="deleteEstimateModal" tabIndex={-1} aria-labelledby="deleteEstimateModalLabel" aria-hidden="true">
                <div className="modal-dialog">
                    <div className="modal-content radius-12">
                        <div className="modal-header">
                            <h1 className="modal-title fs-5 text-red-500" id="deleteEstimateModalLabel">Are you sure?</h1>
                            <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close" />
                        </div>
                        <div className="modal-body font-light">
                            <p>Do you really want to delete estimate <strong>#{selected?.estimate_number}</strong>? This cannot be undone.</p>
                        </div>
                        <div className="modal-footer">
                            <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                            <button type="button" className="btn btn-outline-danger" onClick={confirmDelete} disabled={deleteLoading}>
                                {deleteLoading ? <span className="spinner-border spinner-border-sm" role="status" /> : "Delete Estimate"}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <CookiesV />
        </>
    );
}
