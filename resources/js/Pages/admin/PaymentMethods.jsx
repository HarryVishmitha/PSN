import React, { useEffect, useMemo, useRef, useState } from "react";
import { Head, Link, router, usePage } from "@inertiajs/react";
import { Icon } from "@iconify/react";
import AdminDashboard from "../../Layouts/AdminDashboard";
import Breadcrumb from "@/Components/Breadcrumb";
import Alert from "@/Components/Alert";
import Meta from "@/Components/Metaheads";
import axios from "@/lib/axios";

/* ============================================================
   Reusable UploadField (axios)
============================================================ */
const ACCEPTED = ["image/png", "image/jpeg", "image/jpg", "image/svg+xml", "image/webp"];
const MAX_MB = 2;

function UploadField({ label = "Upload", value, onChange, disabled = false, uploadUrl }) {
    const [dragOver, setDragOver] = useState(false);
    const [busy, setBusy] = useState(false);
    const [pct, setPct] = useState(0);
    const [err, setErr] = useState(null);
    const inputRef = useRef(null);
    const cancelRef = useRef(null);

    const reset = () => {
        setBusy(false);
        setPct(0);
        setErr(null);
        if (cancelRef.current) {
            cancelRef.current();
            cancelRef.current = null;
        }
    };

    const validate = (file) => {
        if (!ACCEPTED.includes(file.type)) return "Only PNG, JPG, JPEG, SVG, WEBP allowed.";
        if (file.size > MAX_MB * 1024 * 1024) return `Max file size ${MAX_MB}MB.`;
        return null;
    };

    const doUpload = async (file) => {
        const v = validate(file);
        if (v) {
            setErr(v);
            return;
        }
        setErr(null);
        setBusy(true);
        setPct(0);

        const fd = new FormData();
        fd.append("file", file);

        const CancelToken = axios.CancelToken;
        const source = CancelToken.source();
        cancelRef.current = source.cancel;

        try {
            const res = await axios.post(uploadUrl, fd, {
                cancelToken: source.token,
                onUploadProgress: (e) => {
                    if (!e.total) return;
                    setPct(Math.round((e.loaded / e.total) * 100));
                },
            });
            const { path } = res.data || {};
            if (path) onChange?.(path);
        } catch (e) {
            setErr(axios.isCancel(e) ? "Upload canceled." : e?.response?.data?.message || "Upload failed.");
        } finally {
            setBusy(false);
            cancelRef.current = null;
        }
    };

    const onFile = (files) => {
        if (files?.[0]) doUpload(files[0]);
    };

    const onDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragOver(false);
        if (disabled || busy) return;
        const file = e.dataTransfer.files?.[0];
        if (file) doUpload(file);
    };

    const remove = () => {
        onChange?.("");
        reset();
    };

    return (
        <div>
            <label className="form-label">{label}</label>
            <div
                className={`border rounded-3 p-3 text-center position-relative ${dragOver ? "border-primary" : "border-neutral-300"
                    } ${busy ? "opacity-75" : ""}`}
                style={{ minHeight: 120 }}
                onDragOver={(e) => {
                    e.preventDefault();
                    if (!disabled) setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={onDrop}
            >
                {!value && (
                    <>
                        <input
                            ref={inputRef}
                            type="file"
                            className="d-none"
                            accept={ACCEPTED.join(",")}
                            onChange={(e) => onFile(e.target.files)}
                            disabled={disabled || busy}
                        />
                        <button
                            type="button"
                            className="btn btn-outline-secondary btn-sm mb-2"
                            onClick={() => inputRef.current?.click()}
                            disabled={disabled || busy}
                        >
                            <Icon icon="mdi:upload-outline" className="me-1" />
                            Choose Image
                        </button>
                        <div className="small text-muted">
                            Drag & drop here or click to upload
                            <br />
                            Allowed: PNG, JPG, JPEG, SVG, WEBP • Max {MAX_MB}MB
                        </div>
                    </>
                )}

                {value && (
                    <div className="d-flex align-items-center gap-3 justify-content-center">
                        <img src={value} alt="preview" style={{ width: 64, height: 64, objectFit: "contain" }} />
                        <div className="d-flex gap-2">
                            <a href={value} target="_blank" rel="noreferrer" className="btn btn-light btn-sm" title="Open">
                                <Icon icon="mdi:open-in-new" />
                            </a>
                            <button
                                type="button"
                                className="btn btn-outline-danger btn-sm"
                                onClick={remove}
                                disabled={disabled || busy}
                                title="Remove"
                            >
                                <Icon icon="mdi:trash-can-outline" />
                            </button>
                        </div>
                    </div>
                )}

                {busy && (
                    <div className="mt-3">
                        <div className="progress" role="progressbar" aria-valuenow={pct} aria-valuemin="0" aria-valuemax="100">
                            <div className="progress-bar" style={{ width: `${pct}%` }}>
                                {pct}%
                            </div>
                        </div>
                        <button type="button" className="btn btn-link btn-sm mt-1" onClick={reset}>
                            Cancel
                        </button>
                    </div>
                )}
            </div>
            {err && <div className="text-danger small mt-1">{err}</div>}
        </div>
    );
}

/* ============================================================
   Main Page
============================================================ */
const PaymentMethods = ({
    paymentMethods,
    filters,
    statusOptions,
    typeOptions,
    flowOptions,
    userDetails,
    urls,
}) => {
    const { props } = usePage();
    const flashSuccess = props.flash?.success;
    const flashError = props.flash?.error;

    // Safe fallbacks so URLs never become "undefined"
    const API_BASE = urls?.base || "/admin/api/payment-methods";
    const API_REORDER = urls?.reorder || "/admin/api/payment-methods/reorder";
    const API_UPLOAD = urls?.upload || "/admin/api/payment-methods/upload";

    // Header controls
    const [perPage, setPerPage] = useState(filters.perPage || 10);
    const [search, setSearch] = useState(filters.search || "");
    const [status, setStatus] = useState(filters.status || "");
    const [type, setType] = useState(filters.type || "");
    const [flow, setFlow] = useState(filters.flow || "");

    // Modal/UI state
    const [alert, setAlert] = useState(null);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState(getEmptyForm());
    const [deleteId, setDeleteId] = useState(null);
    const [saving, setSaving] = useState(false);
    const [toggling, setToggling] = useState(null);
    const [reorderMap, setReorderMap] = useState({}); // id => sort_order

    // flash -> alert
    useEffect(() => {
        if (flashSuccess) setAlert({ type: "success", message: flashSuccess });
    }, [flashSuccess]);
    useEffect(() => {
        if (flashError) setAlert({ type: "danger", message: flashError });
    }, [flashError]);

    // hydrate modal form from selected record
    useEffect(() => {
        if (editing) {
            setForm({
                id: editing.id,
                display_name: editing.display_name || "",
                code: editing.code || "",
                type: editing.type || "custom",
                flow: editing.flow || "manual",
                status: editing.status || "inactive",
                fee_type: editing.fee_type || "none",
                fee_value: editing.fee_value ?? "",
                min_order_total: editing.min_order_total ?? "",
                max_order_total: editing.max_order_total ?? "",
                allowed_currencies: editing.allowed_currencies || ["LKR"],
                instructions: editing.instructions || "",
                config: editing.config || {},
                logo_path: editing.logo_path || "",
                locked: !!editing.locked,
                sort_order: editing.sort_order ?? 0,
            });
        } else {
            setForm(getEmptyForm());
        }
    }, [editing]);

    // debounce search
    useEffect(() => {
        const t = setTimeout(() => visitWithFilters(), 450);
        return () => clearTimeout(t);
    }, [search]);

    function getEmptyForm() {
        return {
            id: null,
            display_name: "",
            code: "",
            type: "custom",
            flow: "manual",
            status: "inactive",
            fee_type: "none",
            fee_value: "",
            min_order_total: "",
            max_order_total: "",
            allowed_currencies: ["LKR"],
            instructions: "",
            config: {},
            logo_path: "",
            locked: false,
            sort_order: 0,
        };
    }

    function visitWithFilters(extra = {}) {
        const params = new URLSearchParams({ perPage, search, status, type, flow, ...extra });
        router.visit(`/admin/payment-methods?${params.toString()}`, { preserveState: true, preserveScroll: true });
    }

    // Header handlers
    const onPerPage = (e) => {
        setPerPage(e.target.value);
        visitWithFilters({ perPage: e.target.value });
    };
    const onStatus = (e) => {
        setStatus(e.target.value);
        visitWithFilters({ status: e.target.value });
    };
    const onType = (e) => {
        setType(e.target.value);
        visitWithFilters({ type: e.target.value });
    };
    const onFlow = (e) => {
        setFlow(e.target.value);
        visitWithFilters({ flow: e.target.value });
    };

    // CRUD (axios)
    const saveMethod = async () => {
        setSaving(true);
        const payload = normalizePayload(form);
        try {
            if (form.id) {
                await axios.patch(`${API_BASE}/${form.id}`, payload);
                setAlert({ type: "success", message: "Payment method updated." });
            } else {
                await axios.post(`${API_BASE}`, payload);
                setAlert({ type: "success", message: "Payment method created." });
            }
            closeModal();
            router.reload({ only: ["paymentMethods"] });
        } catch (e) {
            const msg =
                e?.response?.data?.message || (form.id ? "Failed to update method." : "Failed to create method.");
            setAlert({ type: "danger", message: msg });
        } finally {
            setSaving(false);
        }
    };

    const toggleStatus = async (m) => {
        setToggling(m.id);
        try {
            await axios.patch(`${API_BASE}/${m.id}/toggle`);
            setAlert({ type: "success", message: "Status updated." });
            router.reload({ only: ["paymentMethods"] });
        } catch (e) {
            setAlert({ type: "danger", message: e?.response?.data?.message || "Failed to update status." });
        } finally {
            setToggling(null);
        }
    };

    const deleteMethod = async () => {
        if (!deleteId) return;
        try {
            await axios.delete(`${API_BASE}/${deleteId}`);
            setAlert({ type: "success", message: "Payment method deleted." });
            router.reload({ only: ["paymentMethods"] });
        } catch (e) {
            setAlert({
                type: "danger",
                message: e?.response?.data?.message || "Delete failed (static methods can’t be deleted).",
            });
        } finally {
            setDeleteId(null);
        }
    };

    const handleReorderChange = (id, value) => {
        const v = Number(value) || 0;
        setReorderMap((prev) => ({ ...prev, [id]: v }));
    };
    const hasReorderChanges = useMemo(() => Object.keys(reorderMap).length > 0, [reorderMap]);

    const saveReorder = async () => {
        const order = Object.entries(reorderMap).map(([id, sort_order]) => ({ id: Number(id), sort_order }));
        if (!order.length) return setAlert({ type: "warning", message: "No changes to order." });
        try {
            await axios.patch(API_REORDER, { order });
            setAlert({ type: "success", message: "Order saved." });
            setReorderMap({});
            router.reload({ only: ["paymentMethods"] });
        } catch (e) {
            setAlert({ type: "danger", message: e?.response?.data?.message || "Failed to save order." });
        }
    };

    function normalizePayload(f) {
        return {
            display_name: f.display_name?.trim(),
            code: f.code?.trim(),
            type: f.type,
            flow: f.flow,
            status: f.status,
            fee_type: f.fee_type,
            fee_value: f.fee_value === "" ? null : Number(f.fee_value),
            min_order_total: f.min_order_total === "" ? null : Number(f.min_order_total),
            max_order_total: f.max_order_total === "" ? null : Number(f.max_order_total),
            allowed_currencies: f.allowed_currencies?.filter(Boolean) ?? null,
            instructions: f.instructions,
            config: f.config,
            sort_order: f.sort_order ?? 0,
            logo_path: f.logo_path || null,
        };
    }

    const closeModal = () => {
        setEditing(null);
        setForm(getEmptyForm());
    };

    const badgeClass = (s) =>
        `bg-${s === "active" ? "success" : "warning"}-focus text-${s === "active" ? "success" : "warning"}-600 border border-${s === "active" ? "success" : "warning"
        }-main px-16 py-2 radius-4 fw-medium text-sm tw-capitalize`;

    return (
        <>
            <Head title="Payment Methods - Admin" />
            <Meta title="Payment Methods - Admin" description="Manage payment options, fees, and configurations." />
            <AdminDashboard userDetails={userDetails}>
                <Breadcrumb title="Payment Methods" />
                {alert && <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} />}

                <div className="card h-100 p-0 radius-12">
                    <div className="card-header border-bottom bg-base py-16 px-24 d-flex align-items-center flex-wrap gap-3 justify-content-between">
                        <div className="d-flex align-items-center flex-wrap gap-3">
                            <span className="text-md fw-medium text-secondary-light mb-0">Show</span>
                            <select
                                className="form-select form-select-sm w-auto ps-12 py-6 radius-12 h-40-px"
                                value={perPage}
                                onChange={onPerPage}
                            >
                                {[5, 10, 15, 20, 50, 100].map((n) => (
                                    <option key={n} value={n}>
                                        {n}
                                    </option>
                                ))}
                            </select>

                            <form
                                className="navbar-search"
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    visitWithFilters();
                                }}
                            >
                                <input
                                    type="text"
                                    className="bg-base h-40-px w-auto"
                                    name="search"
                                    placeholder="Search name or code"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                />
                                <Icon icon="ion:search-outline" className="icon" />
                            </form>

                            <select
                                className="form-select form-select-sm w-auto ps-12 py-6 radius-12 h-40-px"
                                value={status}
                                onChange={onStatus}
                            >
                                <option value="">All Status</option>
                                {statusOptions.map((s) => (
                                    <option key={s} value={s}>
                                        {s}
                                    </option>
                                ))}
                            </select>

                            <select
                                className="form-select form-select-sm w-auto ps-12 py-6 radius-12 h-40-px"
                                value={type}
                                onChange={onType}
                            >
                                <option value="">All Types</option>
                                {typeOptions.map((s) => (
                                    <option key={s} value={s}>
                                        {s}
                                    </option>
                                ))}
                            </select>

                            <select
                                className="form-select form-select-sm w-auto ps-12 py-6 radius-12 h-40-px"
                                value={flow}
                                onChange={onFlow}
                            >
                                <option value="">All Flows</option>
                                {flowOptions.map((s) => (
                                    <option key={s} value={s}>
                                        {s}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <button
                            className="btn btn-primary text-sm btn-sm px-12 py-12 radius-8 d-flex align-items-center gap-2"
                            data-bs-toggle="modal"
                            data-bs-target="#methodModal"
                            onClick={() => setEditing(null)}
                        >
                            <Icon icon="ic:baseline-plus" className="icon text-xl" />
                            Add Method
                        </button>
                    </div>

                    <div className="card-body p-24">
                        <div className="table-responsive scroll-sm">
                            <table className="table bordered-table sm-table mb-0">
                                <thead>
                                    <tr>
                                        <th>#</th>
                                        <th>Order</th>
                                        <th>Logo</th>
                                        <th>Name</th>
                                        <th>Code</th>
                                        <th>Type</th>
                                        <th>Flow</th>
                                        <th className="text-center">Status</th>
                                        <th>Fee</th>
                                        <th className="text-center">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {paymentMethods.data.map((m, idx) => (
                                        <tr key={m.id}>
                                            <td>{(paymentMethods.from ?? 1) + idx}</td>
                                            <td style={{ width: 110 }}>
                                                <input
                                                    type="number"
                                                    className="form-control form-control-sm"
                                                    defaultValue={m.sort_order ?? 0}
                                                    onBlur={(e) => handleReorderChange(m.id, e.target.value)}
                                                    title="Change sort order and click Save Order"
                                                />
                                            </td>
                                            <td>
                                                {m.logo_path ? (
                                                    <img
                                                        src={m.logo_path}
                                                        alt={m.display_name}
                                                        style={{ width: 40, height: 40, objectFit: "contain" }}
                                                    />
                                                ) : (
                                                    <span className="text-muted">—</span>
                                                )}
                                            </td>
                                            <td className="fw-medium">
                                                {m.display_name}
                                                {m.locked && <span className="badge bg-neutral-300 ms-2">static</span>}
                                            </td>
                                            <td>
                                                <code>{m.code}</code>
                                            </td>
                                            <td className="tw-capitalize">{m.type}</td>
                                            <td className="tw-capitalize">{m.flow}</td>
                                            <td className="text-center">
                                                <span className={badgeClass(m.status)}>{m.status}</span>
                                            </td>
                                            <td>
                                                {m.fee_type === "flat" && <>LKR {Number(m.fee_value || 0).toFixed(2)}</>}
                                                {m.fee_type === "percent" && <>{Number(m.fee_value || 0)}%</>}
                                                {(m.fee_type === "none" || !m.fee_type) && <span className="text-muted">None</span>}
                                            </td>
                                            <td className="text-center">
                                                <div className="d-flex align-items-center gap-10 justify-content-center">
                                                    <button
                                                        className="bg-info-focus bg-hover-info-200 text-info-600 fw-medium w-40-px h-40-px d-flex justify-content-center align-items-center rounded-circle"
                                                        data-bs-toggle="modal"
                                                        data-bs-target="#methodModal"
                                                        onClick={() => setEditing(m)}
                                                        title="View / Edit"
                                                    >
                                                        <Icon icon="majesticons:eye-line" className="icon text-xl" />
                                                    </button>

                                                    <button
                                                        className="bg-success-focus text-success-600 bg-hover-success-200 fw-medium w-40-px h-40-px d-flex justify-content-center align-items-center rounded-circle"
                                                        onClick={() => toggleStatus(m)}
                                                        disabled={toggling === m.id}
                                                        title="Toggle status"
                                                    >
                                                        {toggling === m.id ? (
                                                            <span className="spinner-border spinner-border-sm" />
                                                        ) : (
                                                            <Icon icon="material-symbols:power-settings-new" className="menu-icon" />
                                                        )}
                                                    </button>

                                                    <button
                                                        className="remove-item-btn bg-danger-focus bg-hover-danger-200 text-danger-600 fw-medium w-40-px h-40-px d-flex justify-content-center align-items-center rounded-circle"
                                                        data-bs-toggle="modal"
                                                        data-bs-target="#deleteModal"
                                                        onClick={() => setDeleteId(m.id)}
                                                        title="Delete"
                                                        disabled={m.locked}
                                                    >
                                                        <Icon icon="fluent:delete-24-regular" className="menu-icon" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {paymentMethods.data.length === 0 && (
                                        <tr>
                                            <td colSpan="10" className="text-center py-4 text-muted">
                                                No methods found.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mt-24">
                            {/* Save Order CTA – improved UI */}
                            <div className="d-flex align-items-center gap-3">
                                <button
                                    className="btn btn-primary d-flex align-items-center gap-2 px-16 py-8 radius-8 shadow-sm"
                                    onClick={saveReorder}
                                    disabled={!hasReorderChanges}
                                >
                                    <Icon icon="solar:sort-outline" className="text-lg" />
                                    <span className="fw-semibold">Save Order</span>
                                </button>
                                {!hasReorderChanges && (
                                    <span className="text-muted small">
                                        Change a value in <strong>Order</strong> then click Save
                                    </span>
                                )}
                            </div>

                            <span>
                                Showing {paymentMethods.from} to {paymentMethods.to} of {paymentMethods.total} entries
                            </span>
                            <ul className="pagination d-flex flex-wrap align-items-center gap-2 justify-content-center">
                                <li className={`page-item ${!paymentMethods.prev_page_url ? "disabled" : ""}`}>
                                    <Link
                                        className="page-link bg-neutral-200 text-secondary-light fw-semibold radius-8 border-0 d-flex align-items-center justify-content-center h-32-px text-md"
                                        href={paymentMethods.prev_page_url || "#"}
                                    >
                                        <Icon icon="ep:d-arrow-left" />
                                    </Link>
                                </li>
                                {Array.from({ length: paymentMethods.last_page }, (_, i) => i + 1).map((page) => (
                                    <li key={page} className={`page-item ${page === paymentMethods.current_page ? "active" : ""}`}>
                                        <Link
                                            className="page-link text-secondary-light fw-semibold radius-8 border-0 d-flex align-items-center justify-content-center h-32-px w-32-px"
                                            href={`${paymentMethods.path}?page=${page}`}
                                        >
                                            {page}
                                        </Link>
                                    </li>
                                ))}
                                <li className={`page-item ${!paymentMethods.next_page_url ? "disabled" : ""}`}>
                                    <Link
                                        className="page-link bg-neutral-200 text-secondary-light fw-semibold radius-8 border-0 d-flex align-items-center justify-content-center h-32-px text-md"
                                        href={paymentMethods.next_page_url || "#"}
                                    >
                                        <Icon icon="ep:d-arrow-right" />
                                    </Link>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Add/Edit Modal */}
                <div className="modal fade" id="methodModal" tabIndex="-1" aria-labelledby="methodModalLabel" aria-hidden="true">
                    <div className="modal-dialog modal-lg modal-dialog-centered">
                        <div className="modal-content">
                            <div className="modal-header border-0">
                                <h5 className="modal-title" id="methodModalLabel">
                                    {form.id ? "Edit Payment Method" : "Add Payment Method"}
                                </h5>
                                <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close" onClick={closeModal}></button>
                            </div>
                            <div className="modal-body">
                                <div className="row g-3">
                                    <div className="col-md-6">
                                        <label className="form-label">Display Name</label>
                                        <input
                                            className="form-control"
                                            value={form.display_name}
                                            onChange={(e) => setForm({ ...form, display_name: e.target.value })}
                                        />
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label">Code</label>
                                        <input
                                            className="form-control"
                                            value={form.code}
                                            disabled={form.locked || !!form.id}
                                            onChange={(e) => setForm({ ...form, code: e.target.value })}
                                        />
                                    </div>

                                    <div className="col-md-4">
                                        <label className="form-label">Type</label>
                                        <select
                                            className="form-select"
                                            value={form.type}
                                            disabled={form.locked}
                                            onChange={(e) => setForm({ ...form, type: e.target.value })}
                                        >
                                            <option value="static">static</option>
                                            <option value="custom">custom</option>
                                            <option value="gateway">gateway</option>
                                        </select>
                                    </div>
                                    <div className="col-md-4">
                                        <label className="form-label">Flow</label>
                                        <select
                                            className="form-select"
                                            value={form.flow}
                                            disabled={form.locked}
                                            onChange={(e) => setForm({ ...form, flow: e.target.value })}
                                        >
                                            <option value="cod">cod</option>
                                            <option value="manual">manual</option>
                                            <option value="online">online</option>
                                        </select>
                                    </div>
                                    <div className="col-md-4">
                                        <label className="form-label">Status</label>
                                        <select
                                            className="form-select"
                                            value={form.status}
                                            onChange={(e) => setForm({ ...form, status: e.target.value })}
                                        >
                                            <option value="active">active</option>
                                            <option value="inactive">inactive</option>
                                        </select>
                                    </div>

                                    <div className="col-md-4">
                                        <label className="form-label">Fee Type</label>
                                        <select
                                            className="form-select"
                                            value={form.fee_type}
                                            onChange={(e) => setForm({ ...form, fee_type: e.target.value })}
                                        >
                                            <option value="none">none</option>
                                            <option value="flat">flat</option>
                                            <option value="percent">percent</option>
                                        </select>
                                    </div>
                                    <div className="col-md-4">
                                        <label className="form-label">Fee Value</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            className="form-control"
                                            value={form.fee_value}
                                            onChange={(e) => setForm({ ...form, fee_value: e.target.value })}
                                            placeholder="0.00"
                                        />
                                    </div>
                                    <div className="col-md-4">
                                        <label className="form-label">Sort Order</label>
                                        <input
                                            type="number"
                                            className="form-control"
                                            value={form.sort_order}
                                            onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) || 0 })}
                                        />
                                    </div>

                                    <div className="col-md-6">
                                        <label className="form-label">Min Order Total (LKR)</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            className="form-control"
                                            value={form.min_order_total}
                                            onChange={(e) => setForm({ ...form, min_order_total: e.target.value })}
                                        />
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label">Max Order Total (LKR)</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            className="form-control"
                                            value={form.max_order_total}
                                            onChange={(e) => setForm({ ...form, max_order_total: e.target.value })}
                                        />
                                    </div>

                                    <div className="col-md-6">
                                        <label className="form-label">Allowed Currencies (comma separated)</label>
                                        <input
                                            className="form-control"
                                            value={(form.allowed_currencies || []).join(",")}
                                            onChange={(e) =>
                                                setForm({
                                                    ...form,
                                                    allowed_currencies: e.target.value
                                                        .split(",")
                                                        .map((s) => s.trim())
                                                        .filter(Boolean),
                                                })
                                            }
                                        />
                                    </div>

                                    {/* Logo with progress & preview */}
                                    <div className="col-md-6">
                                        <UploadField
                                            label="Logo"
                                            value={form.logo_path}
                                            uploadUrl={API_UPLOAD}
                                            onChange={(url) => setForm({ ...form, logo_path: url })}
                                        />
                                    </div>

                                    {/* Conditional fields for manual flow */}
                                    {form.flow === "manual" && (
                                        <>
                                            <div className="col-12">
                                                <label className="form-label">Instructions for Customer</label>
                                                <textarea
                                                    className="form-control"
                                                    rows="3"
                                                    value={form.instructions}
                                                    onChange={(e) => setForm({ ...form, instructions: e.target.value })}
                                                    placeholder="e.g., Deposit to bank account and upload slip at checkout..."
                                                />
                                            </div>

                                            {/* Manual config + QR image */}
                                            <div className="col-md-6">
                                                <label className="form-label">Bank Name</label>
                                                <input
                                                    className="form-control"
                                                    value={form.config?.bank_name || ""}
                                                    onChange={(e) => setForm({ ...form, config: { ...form.config, bank_name: e.target.value } })}
                                                />
                                            </div>
                                            <div className="col-md-6">
                                                <label className="form-label">Branch</label>
                                                <input
                                                    className="form-control"
                                                    value={form.config?.branch || ""}
                                                    onChange={(e) => setForm({ ...form, config: { ...form.config, branch: e.target.value } })}
                                                />
                                            </div>
                                            <div className="col-md-6">
                                                <label className="form-label">Account Name</label>
                                                <input
                                                    className="form-control"
                                                    value={form.config?.account_name || ""}
                                                    onChange={(e) =>
                                                        setForm({ ...form, config: { ...form.config, account_name: e.target.value } })
                                                    }
                                                />
                                            </div>
                                            <div className="col-md-6">
                                                <label className="form-label">Account Number</label>
                                                <input
                                                    className="form-control"
                                                    value={form.config?.account_number || ""}
                                                    onChange={(e) =>
                                                        setForm({ ...form, config: { ...form.config, account_number: e.target.value } })
                                                    }
                                                />
                                            </div>
                                            <div className="col-md-6">
                                                <label className="form-label">SWIFT</label>
                                                <input
                                                    className="form-control"
                                                    value={form.config?.swift || ""}
                                                    onChange={(e) => setForm({ ...form, config: { ...form.config, swift: e.target.value } })}
                                                />
                                            </div>

                                            <div className="col-md-6">
                                                <UploadField
                                                    label="QR Image (optional)"
                                                    value={form.config?.qr_path || ""}
                                                    uploadUrl={API_UPLOAD}
                                                    onChange={(url) => setForm({ ...form, config: { ...form.config, qr_path: url } })}
                                                />
                                            </div>
                                        </>
                                    )}

                                    {/* Conditional fields for gateway */}
                                    {(form.type === "gateway" || form.flow === "online") && (
                                        <>
                                            <div className="col-12">
                                                <div className="alert alert-info py-2">Configure your gateway keys (example fields):</div>
                                            </div>
                                            <div className="col-md-6">
                                                <label className="form-label">Publishable/Merchant Key</label>
                                                <input
                                                    className="form-control"
                                                    value={form.config?.publishable_key || form.config?.merchant_id || ""}
                                                    onChange={(e) =>
                                                        setForm({
                                                            ...form,
                                                            config: { ...form.config, publishable_key: e.target.value, merchant_id: e.target.value },
                                                        })
                                                    }
                                                />
                                            </div>
                                            <div className="col-md-6">
                                                <label className="form-label">Secret Key</label>
                                                <input
                                                    className="form-control"
                                                    value={form.config?.secret_key || form.config?.merchant_secret || ""}
                                                    onChange={(e) =>
                                                        setForm({
                                                            ...form,
                                                            config: { ...form.config, secret_key: e.target.value, merchant_secret: e.target.value },
                                                        })
                                                    }
                                                />
                                            </div>
                                            <div className="col-md-4">
                                                <label className="form-label">Mode</label>
                                                <select
                                                    className="form-select"
                                                    value={form.config?.mode || (form.config?.sandbox ? "test" : "live")}
                                                    onChange={(e) =>
                                                        setForm({
                                                            ...form,
                                                            config: { ...form.config, mode: e.target.value, sandbox: e.target.value === "test" },
                                                        })
                                                    }
                                                >
                                                    <option value="test">test</option>
                                                    <option value="live">live</option>
                                                </select>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button className="btn btn-secondary" data-bs-dismiss="modal" onClick={closeModal}>
                                    Close
                                </button>
                                <button className="btn btn-primary" onClick={saveMethod} disabled={saving}>
                                    {saving ? <span className="spinner-border spinner-border-sm" /> : "Save"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Delete Modal */}
                <div className="modal fade" id="deleteModal" tabIndex="-1" aria-labelledby="deleteModalLabel" aria-hidden="true">
                    <div className="modal-dialog">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h1 className="modal-title fs-5 text-red-500" id="deleteModalLabel">
                                    Are you sure?
                                </h1>
                                <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                            </div>
                            <div className="modal-body">Deleting a method cannot be undone.</div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">
                                    Close
                                </button>
                                <button type="button" className="btn btn-outline-danger" onClick={deleteMethod}>
                                    Delete
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </AdminDashboard>
        </>
    );
};

export default PaymentMethods;
