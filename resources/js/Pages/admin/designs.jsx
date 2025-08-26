import React, { useEffect, useRef, useState, useMemo, useCallback } from "react";
import { Head, router, Link, useForm, usePage } from "@inertiajs/react";
import AdminDashboard from "../../Layouts/AdminDashboard";
import Breadcrumb from "@/Components/Breadcrumb";
import { Icon } from "@iconify/react";
import CookiesV from "@/Components/CookieConsent";
import Alert from "@/Components/Alert";
import Meta from "@/Components/Metaheads";
import "react-quill-new/dist/quill.snow.css";

function fmtDate(d) {
  if (!d) return "-";
  try {
    return new Date(d).toLocaleString();
  } catch {
    return String(d);
  }
}

function AccessBadge({ type }) {
  const map = {
    public: {
      label: "Public",
      className: "bg-success-focus text-success-600",
      icon: "mdi:earth",
      hint: "Visible to everyone",
    },
    working_group: {
      label: "Working Group",
      className: "bg-warning-focus text-warning-700",
      icon: "mdi:account-group",
      hint: "Hidden from WG end-users",
    },
    restricted: {
      label: "Restricted",
      className: "bg-danger-focus text-danger-600",
      icon: "mdi:lock",
      hint: "Only selected users",
    },
  };
  const m = map[type] || {
    label: type || "Unknown",
    className: "bg-neutral-200 text-secondary-light",
    icon: "mdi:help-circle",
    hint: "",
  };
  return (
    <span
      className={`${m.className} px-12 py-4 radius-4 fw-medium text-sm d-inline-flex align-items-center gap-1`}
      title={m.hint}
    >
      <Icon icon={m.icon} className="tw-text-base" />
      {m.label}
    </span>
  );
}

export default function Designs({ userDetails, designs, filters = {}, workingGroups = [] }) {
  const { flash } = usePage().props;

  const [selectedRow, setSelectedRow] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [editProducts, setEditProducts] = useState([]);
  const [alert, setAlert] = useState(null); // { type, message }
  const [editLoading, setEditLoading] = useState(false);
  const [editErrors, setEditErrors] = useState({});

  // Selection state (for bulk utilities)
  const [selectedIds, setSelectedIds] = useState(() => new Set());

  // Edit form
  const { data: editData, setData: setEditData, put: updateDesign, reset: resetEdit } =
    useForm({
      name: "",
      description: "",
      width: "",
      height: "",
      status: "",
      access_type: "",
      product_id: "",
      working_group_id: "",
    });

  const openView = (design) => setSelectedRow(design);
  const openEdit = (design) => {
    setSelectedRow(design);
    setEditData({
      name: design.name,
      description: design.description || "",
      width: design.width,
      height: design.height,
      status: design.status,
      access_type: design.access_type,
      product_id: design.product_id,
      working_group_id: design.working_group_id,
    });
  };
  const openDelete = (design) => setSelectedRow(design);

  useEffect(() => {
    if (!editData.working_group_id) {
      setEditProducts([]);
      return;
    }
    const group = workingGroups.find((g) => g.id === Number(editData.working_group_id));
    setEditProducts(group?.products || []);
  }, [editData.working_group_id, workingGroups]);

  // List filters (added optional WG + Access filters; harmless if backend ignores)
  const { data, setData } = useForm({
    search: filters.search || "",
    status: filters.status || "",
    per_page: filters.per_page || 10,
    working_group_id: filters.working_group_id || "",
    access_type: filters.access_type || "",
  });

  const initialRender = useRef(true);
  useEffect(() => {
    if (initialRender.current) {
      initialRender.current = false;
      return;
    }
    router.get(route("admin.designs"), { ...data }, { preserveState: true, replace: true });
  }, [data.search, data.status, data.per_page, data.working_group_id, data.access_type]);

  const handleChange = (e) => setData(e.target.name, e.target.value);

  const confirmDelete = () => {
    if (!selectedRow) return;
    setDeleteLoading(true);
    setAlert(null);
    router.delete(route("admin.deleteDesign", selectedRow.id), {
      preserveState: true,
      onSuccess: () => setAlert({ type: "success", message: "Design deleted successfully!" }),
      onError: () =>
        setAlert({ type: "danger", message: "Failed to delete design. Please try again." }),
      onFinish: () => {
        setDeleteLoading(false);
        document.querySelector("#deleteDesignModal .btn-close")?.click();
        // remove from selection if it was selected
        setSelectedIds((prev) => {
          const next = new Set(prev);
          next.delete(selectedRow.id);
          return next;
        });
      },
    });
  };

  const submitEdit = (e) => {
    e.preventDefault();
    if (!selectedRow) return;

    setEditLoading(true);
    setEditErrors({});
    setAlert(null);

    updateDesign(route("admin.editDesign", selectedRow.id), {
      preserveState: true,
      onSuccess: () => {
        document.querySelector("#editDesignModal .btn-close")?.click();
        setAlert({ type: "success", message: "Design details updated successfully!" });
        resetEdit();
      },
      onError: (errors) => {
        setEditErrors(errors);
        setAlert({ type: "danger", message: "Please correct the errors below." });
      },
      onFinish: () => setEditLoading(false),
    });
  };

  // --- Selection helpers ---
  const allIds = useMemo(() => designs?.data?.map((d) => d.id) ?? [], [designs]);
  const allSelected = selectedIds.size > 0 && allIds.every((id) => selectedIds.has(id));
  const someSelected = selectedIds.size > 0 && !allSelected;

  const toggleRow = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };
  const toggleAll = () => {
    setSelectedIds((prev) => {
      if (prev.size && allSelected) return new Set();
      const next = new Set(allIds);
      return next;
    });
  };
  const clearSelection = () => setSelectedIds(new Set());

  const copySelectedLinks = async () => {
    const rows = designs?.data || [];
    const links = rows.filter((r) => selectedIds.has(r.id)).map((r) => r.image_url).filter(Boolean);
    if (!links.length) {
      setAlert({ type: "danger", message: "No links to copy. Select at least one row." });
      return;
    }
    try {
      await navigator.clipboard.writeText(links.join("\n"));
      setAlert({ type: "success", message: "Links copied to clipboard." });
    } catch {
      setAlert({ type: "danger", message: "Failed to copy links." });
    }
  };

  // --- Render ---
  return (
    <>
      <Head title="All designs - Admin Dashboard" />
      <Meta title="All designs - Admin Dashboard" description="Check all designs" />

      <AdminDashboard userDetails={userDetails}>
        <Breadcrumb title="Designs" />

        {alert && <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} />}

        <div className="card h-100 p-0 radius-12">
          <div className="card-header border-bottom bg-base py-16 px-24 d-flex align-items-center flex-wrap gap-3 justify-content-between">
            {/* Left: Controls */}
            <div className="d-flex align-items-center flex-wrap gap-3">
              <span className="text-md fw-medium text-secondary-light mb-0">Show</span>
              <select
                name="per_page"
                className="form-select form-select-sm w-auto ps-12 py-6 radius-12 h-40-px"
                value={data.per_page}
                onChange={handleChange}
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
                placeholder="Search by name or product"
                value={data.search}
                onChange={handleChange}
              />

              <select
                name="status"
                className="form-select form-select-sm w-auto ps-12 py-6 radius-12 h-40-px"
                value={data.status}
                onChange={handleChange}
                title="Filter by status"
              >
                <option value="">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>

              {/* New: WG filter */}
              <select
                name="working_group_id"
                className="form-select form-select-sm w-auto ps-12 py-6 radius-12 h-40-px"
                value={data.working_group_id}
                onChange={handleChange}
                title="Filter by working group"
              >
                <option value="">All WG</option>
                {workingGroups.map((wg) => (
                  <option key={wg.id} value={wg.id}>
                    {wg.name}
                  </option>
                ))}
              </select>

              {/* New: Access type filter */}
              <select
                name="access_type"
                className="form-select form-select-sm w-auto ps-12 py-6 radius-12 h-40-px"
                value={data.access_type}
                onChange={handleChange}
                title="Filter by access type"
              >
                <option value="">All Access</option>
                <option value="public">Public</option>
                <option value="working_group">Working Group</option>
                <option value="restricted">Restricted</option>
              </select>
            </div>

            {/* Right: Add + selection tools */}
            <div className="d-flex align-items-center gap-2">
              {selectedIds.size > 0 && (
                <>
                  <button
                    type="button"
                    className="btn btn-success btn-sm d-flex align-items-center gap-2"
                    onClick={copySelectedLinks}
                    title="Copy preview links for selected rows"
                  >
                    <Icon icon="mdi:content-copy" className="text-lg" />
                    Copy links ({selectedIds.size})
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline-secondary btn-sm"
                    onClick={clearSelection}
                  >
                    Clear selection
                  </button>
                </>
              )}
              <Link
                href={route("admin.addDesign")}
                className="btn btn-primary text-sm btn-sm px-12 py-12 radius-8 d-flex align-items-center gap-2"
              >
                <Icon icon="ic:baseline-plus" className="icon text-xl line-height-1" />
                Add New Design
              </Link>
            </div>
          </div>

          <div className="card-body p-24">
            <div className="table-responsive scroll-sm">
              <table className="table bordered-table sm-table mb-0">
                <thead>
                  <tr>
                    <th>
                      <input
                        type="checkbox"
                        className="form-check-input"
                        aria-checked={someSelected ? "mixed" : allSelected}
                        checked={allSelected}
                        onChange={toggleAll}
                      />
                    </th>
                    <th>S.L</th>
                    <th>Design</th>
                    <th>Product</th>
                    <th>WG</th>
                    <th>Size</th>
                    <th>Access</th>
                    <th className="text-center">Status</th>
                    <th className="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {designs?.data?.length ? (
                    designs.data.map((design, index) => (
                      <tr key={design.id}>
                        <td>
                          <input
                            type="checkbox"
                            className="form-check-input"
                            checked={selectedIds.has(design.id)}
                            onChange={() => toggleRow(design.id)}
                            aria-label={`Select ${design.name}`}
                          />
                        </td>
                        <td>{(designs.current_page - 1) * designs.per_page + index + 1}</td>
                        <td>
                          <div className="d-flex align-items-center">
                            <img
                              src={design.image_url}
                              alt={design.name}
                              className="w-40-px h-40-px rounded-circle flex-shrink-0 me-12 overflow-hidden"
                            />
                            <div className="d-flex flex-column">
                              <span className="text-md mb-0 fw-medium text-secondary-light">
                                {design.name}
                              </span>
                              <small className="text-muted">
                                {design?.created_at ? `Added ${fmtDate(design.created_at)}` : ""}
                              </small>
                            </div>
                          </div>
                        </td>
                        <td>{design?.product?.name || "-"}</td>
                        <td>{design?.working_group?.name || "-"}</td>
                        <td>
                          {design.width} × {design.height} in
                        </td>
                        <td>
                          <AccessBadge type={design.access_type} />
                        </td>
                        <td className="text-center">
                          <span
                            className={
                              design.status === "active"
                                ? "bg-success-focus text-success-600 px-24 py-4 radius-4 fw-medium text-sm"
                                : "bg-danger-focus text-danger-600 px-24 py-4 radius-4 fw-medium text-sm"
                            }
                          >
                            {design.status?.charAt(0).toUpperCase() + design.status?.slice(1)}
                          </span>
                        </td>
                        <td className="text-end">
                          <div className="d-flex justify-content-end gap-8">
                            <button
                              className="bg-info-focus bg-hover-info-200 text-info-600 fw-medium w-36-px h-36-px d-flex justify-content-center align-items-center rounded-circle"
                              data-bs-toggle="modal"
                              data-bs-target="#viewDesignModal"
                              onClick={() => openView(design)}
                              title="View"
                            >
                              <Icon icon="majesticons:eye-line" className="icon text-lg" />
                            </button>

                            <button
                              className="bg-success-focus bg-hover-success-200 text-success-600 fw-medium w-36-px h-36-px d-flex justify-content-center align-items-center rounded-circle"
                              data-bs-toggle="modal"
                              data-bs-target="#editDesignModal"
                              onClick={() => openEdit(design)}
                              title="Edit"
                            >
                              <Icon icon="lucide:edit" className="text-lg" />
                            </button>

                            <button
                              className="bg-neutral-200 bg-hover-neutral-300 text-secondary-600 fw-medium w-36-px h-36-px d-flex justify-content-center align-items-center rounded-circle"
                              onClick={async () => {
                                if (!design.image_url) return;
                                try {
                                  await navigator.clipboard.writeText(design.image_url);
                                  setAlert({ type: "success", message: "Link copied." });
                                } catch {
                                  setAlert({ type: "danger", message: "Failed to copy link." });
                                }
                              }}
                              title="Copy preview link"
                            >
                              <Icon icon="mdi:content-copy" className="text-lg" />
                            </button>

                            <button
                              className="remove-item-btn bg-danger-focus bg-hover-danger-200 text-danger-600 fw-medium w-36-px h-36-px d-flex justify-content-center align-items-center rounded-circle"
                              data-bs-toggle="modal"
                              data-bs-target="#deleteDesignModal"
                              onClick={() => openDelete(design)}
                              title="Delete"
                            >
                              <Icon icon="fluent:delete-24-regular" className="text-lg" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={9} className="text-center py-4">
                        <div className="d-flex flex-column align-items-center gap-2">
                          <Icon icon="mdi:image-off-outline" className="text-2xl text-muted" />
                          <div>No designs found.</div>
                          <Link href={route("admin.addDesign")} className="btn btn-primary btn-sm">
                            Add your first design
                          </Link>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Footer: pagination + selection info */}
            <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mt-24">
              <span>
                Showing {designs.from} to {designs.to} of {designs.total} entries{" "}
                {selectedIds.size > 0 && (
                  <strong className="ms-2">• {selectedIds.size} selected</strong>
                )}
              </span>

              <ul className="pagination d-flex flex-wrap align-items-center gap-2 justify-content-center mb-0">
                {/* First */}
                <li className="page-item">
                  <Link
                    href="?page=1"
                    aria-label="First Page"
                    className={`page-link fw-semibold radius-8 border-0 d-flex align-items-center justify-content-center h-32-px w-32-px text-md ${
                      designs.current_page === 1
                        ? "disabled pointer-events-none opacity-50 bg-neutral-100"
                        : "bg-neutral-200 text-secondary-light"
                    }`}
                  >
                    «
                  </Link>
                </li>

                {/* Prev */}
                <li className="page-item">
                  <Link
                    href={designs.prev_page_url || "#"}
                    aria-label="Previous Page"
                    className={`page-link fw-semibold radius-8 border-0 d-flex align-items-center justify-content-center h-32-px w-32-px text-md ${
                      !designs.prev_page_url
                        ? "disabled pointer-events-none opacity-50 bg-neutral-100"
                        : "bg-neutral-200 text-secondary-light"
                    }`}
                  >
                    ‹
                  </Link>
                </li>

                {/* Numbers with ellipsis */}
                {Array.from({ length: designs.last_page }, (_, i) => i + 1)
                  .filter(
                    (page) =>
                      page === 1 ||
                      page === designs.last_page ||
                      Math.abs(page - designs.current_page) <= 2
                  )
                  .reduce((acc, page, index, array) => {
                    if (index > 0 && page - array[index - 1] > 1) acc.push("ellipsis");
                    acc.push(page);
                    return acc;
                  }, [])
                  .map((item, idx) =>
                    item === "ellipsis" ? (
                      <li className="page-item" key={`ellipsis-${idx}`}>
                        <span className="page-link bg-transparent border-0 text-secondary-light">
                          ...
                        </span>
                      </li>
                    ) : (
                      <li className="page-item" key={item}>
                        <Link
                          href={`?page=${item}`}
                          aria-label={`Page ${item}`}
                          className={`page-link fw-semibold radius-8 border-0 d-flex align-items-center justify-content-center h-32-px w-32-px text-md ${
                            item === designs.current_page
                              ? "bg-primary-600 text-white pointer-events-none"
                              : "bg-neutral-200 text-secondary-light"
                          }`}
                        >
                          {item}
                        </Link>
                      </li>
                    )
                  )}

                {/* Next */}
                <li className="page-item">
                  <Link
                    href={designs.next_page_url || "#"}
                    aria-label="Next Page"
                    className={`page-link fw-semibold radius-8 border-0 d-flex align-items-center justify-content-center h-32-px w-32-px text-md ${
                      !designs.next_page_url
                        ? "disabled pointer-events-none opacity-50 bg-neutral-100"
                        : "bg-neutral-200 text-secondary-light"
                    }`}
                  >
                    ›
                  </Link>
                </li>

                {/* Last */}
                <li className="page-item">
                  <Link
                    href={`?page=${designs.last_page}`}
                    aria-label="Last Page"
                    className={`page-link fw-semibold radius-8 border-0 d-flex align-items-center justify-content-center h-32-px w-32-px text-md ${
                      designs.current_page === designs.last_page
                        ? "disabled pointer-events-none opacity-50 bg-neutral-100"
                        : "bg-neutral-200 text-secondary-light"
                    }`}
                  >
                    »
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        <div
          className="modal fade"
          id="deleteDesignModal"
          tabIndex={-1}
          aria-labelledby="deleteDesignModalLabel"
          aria-hidden="true"
        >
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h1 className="modal-title fs-5 text-red-500" id="deleteDesignModalLabel">
                  Are you sure?
                </h1>
                <button type="button" className="btn-close" data-bs-dismiss="modal"></button>
              </div>
              <div className="modal-body font-light">
                <p>Do you really want to delete this design? This process cannot be undone.</p>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">
                  Close
                </button>
                <button
                  type="button"
                  className="btn btn-outline-danger"
                  onClick={confirmDelete}
                  disabled={deleteLoading}
                >
                  {deleteLoading ? (
                    <span className="spinner-border spinner-border-sm" role="status"></span>
                  ) : (
                    "Delete Design"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* View Design Modal */}
        <div
          className="modal fade"
          id="viewDesignModal"
          tabIndex={-1}
          aria-labelledby="viewDesignModalLabel"
          aria-hidden="true"
        >
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content radius-16 bg-base">
              <div className="modal-header py-16 px-24 border-0">
                <h5 className="modal-title tw-font-semibold tw-text-gray-500" id="viewDesignModalLabel">
                  View Design
                </h5>
                <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close" />
              </div>
              <div className="modal-body p-24">
                {selectedRow && (
                  <div>
                    <div className="d-flex mb-4 gap-3">
                      <img
                        src={selectedRow.image_url}
                        alt={selectedRow.name}
                        className="rounded tw-border tw-border-gray-300 tw-shadow-sm tw-max-h-[60vh] tw-object-contain"
                        style={{ maxWidth: "50%" }}
                      />
                      <div className="flex-grow-1">
                        <h5 className="tw-font-semibold mb-1">{selectedRow.name}</h5>
                        <div className="mb-2">
                          <AccessBadge type={selectedRow.access_type} />
                        </div>

                        <div className="tw-grid tw-grid-cols-2 tw-gap-y-2 tw-text-sm">
                          <div className="text-muted">Product</div>
                          <div>{selectedRow?.product?.name || "-"}</div>

                          <div className="text-muted">Working group</div>
                          <div>{selectedRow?.working_group?.name || "-"}</div>

                          <div className="text-muted">Size</div>
                          <div>
                            {selectedRow.width} × {selectedRow.height} in
                          </div>

                          <div className="text-muted">Status</div>
                          <div className="tw-capitalize">{selectedRow.status}</div>

                          <div className="text-muted">Created</div>
                          <div>{fmtDate(selectedRow.created_at)}</div>

                          <div className="text-muted">Updated</div>
                          <div>{fmtDate(selectedRow.updated_at)}</div>
                        </div>

                        {selectedRow.description && (
                          <>
                            <hr />
                            <p className="mb-0">{selectedRow.description}</p>
                          </>
                        )}

                        <div className="d-flex gap-2 mt-3">
                          <a
                            href={selectedRow.image_url}
                            target="_blank"
                            rel="noreferrer"
                            className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-1"
                          >
                            <Icon icon="mdi:open-in-new" />
                            Open
                          </a>
                          <button
                            type="button"
                            className="btn btn-outline-primary btn-sm d-flex align-items-center gap-1"
                            onClick={async () => {
                              try {
                                await navigator.clipboard.writeText(selectedRow.image_url || "");
                                setAlert({ type: "success", message: "Preview link copied." });
                              } catch {
                                setAlert({ type: "danger", message: "Failed to copy link." });
                              }
                            }}
                          >
                            <Icon icon="mdi:content-copy" />
                            Copy link
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <div className="modal-footer d-flex justify-content-end">
                <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Edit Design Modal */}
        <div
          className="modal fade"
          id="editDesignModal"
          tabIndex={-1}
          aria-labelledby="editDesignModalLabel"
          aria-hidden="true"
        >
          <div className="modal-dialog modal-xl modal-dialog-centered">
            <div className="modal-content radius-16 bg-base">
              <div className="modal-header py-16 px-24 border-0">
                <h5 className="modal-title" id="editDesignModalLabel">
                  Edit Design
                </h5>
                <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close" />
              </div>
              <div className="modal-body p-24">
                <div className="row">
                  <div className="col-sm-4">
                    <img
                      src={selectedRow?.image_url}
                      alt={selectedRow?.name}
                      className="rounded tw-border tw-border-gray-300 tw-shadow-sm tw-max-w-full tw-max-h-[60vh] tw-object-contain"
                    />
                  </div>
                  <div className="col-sm-8">
                    <form onSubmit={submitEdit}>
                      {/* Keep name hidden (immutable from here) */}
                      <input
                        type="text"
                        name="name"
                        className="form-control"
                        value={editData.name}
                        onChange={(e) => setEditData("name", e.target.value)}
                        hidden
                      />

                      <div className="mb-3">
                        <label className="form-label">Description</label>
                        <textarea
                          name="description"
                          className={`form-control ${editErrors.description ? "is-invalid" : ""}`}
                          value={editData.description}
                          onChange={(e) => setEditData("description", e.target.value)}
                        />
                        {editErrors.description && (
                          <div className="invalid-feedback">{editErrors.description}</div>
                        )}
                      </div>

                      <div className="row">
                        <div className="col mb-3">
                          <label className="form-label">Width (in)</label>
                          <input
                            type="number"
                            name="width"
                            className={`form-control ${editErrors.width ? "is-invalid" : ""}`}
                            value={editData.width}
                            onChange={(e) => setEditData("width", e.target.value)}
                          />
                          {editErrors.width && (
                            <div className="invalid-feedback">{editErrors.width}</div>
                          )}
                        </div>
                        <div className="col mb-3">
                          <label className="form-label">Height (in)</label>
                          <input
                            type="number"
                            name="height"
                            className={`form-control ${editErrors.height ? "is-invalid" : ""}`}
                            value={editData.height}
                            onChange={(e) => setEditData("height", e.target.value)}
                          />
                          {editErrors.height && (
                            <div className="invalid-feedback">{editErrors.height}</div>
                          )}
                        </div>
                      </div>

                      <div className="mb-3">
                        <label className="form-label">Access Type</label>
                        <select
                          name="access_type"
                          className={`form-select ${editErrors.access_type ? "is-invalid" : ""}`}
                          value={editData.access_type}
                          onChange={(e) => setEditData("access_type", e.target.value)}
                        >
                          <option value="">Select access</option>
                          <option value="public">Public</option>
                          <option value="working_group">Working Group</option>
                          <option value="restricted">Restricted</option>
                        </select>
                        {editErrors.access_type && (
                          <div className="invalid-feedback">{editErrors.access_type}</div>
                        )}
                      </div>

                      <div className="mb-3">
                        <label className="form-label">Working Group</label>
                        <select
                          name="working_group_id"
                          className={`form-select ${editErrors.working_group_id ? "is-invalid" : ""}`}
                          value={editData.working_group_id}
                          onChange={(e) => setEditData("working_group_id", e.target.value)}
                        >
                          <option value="">Select a WG</option>
                          {workingGroups.map((wg) => (
                            <option key={wg.id} value={wg.id}>
                              {wg.name}
                            </option>
                          ))}
                        </select>
                        {editErrors.working_group_id && (
                          <div className="invalid-feedback">{editErrors.working_group_id}</div>
                        )}
                      </div>

                      <div className="mb-3">
                        <label className="form-label">Product</label>
                        <select
                          name="product_id"
                          className={`form-select ${editErrors.product_id ? "is-invalid" : ""}`}
                          value={editData.product_id}
                          onChange={(e) => setEditData("product_id", e.target.value)}
                          disabled={!editData.working_group_id}
                        >
                          <option value="">Select a product</option>
                          {editProducts.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name}
                            </option>
                          ))}
                        </select>
                        {editErrors.product_id && (
                          <div className="invalid-feedback">{editErrors.product_id}</div>
                        )}
                      </div>

                      <div className="mb-3">
                        <label className="form-label">Status</label>
                        <select
                          name="status"
                          className={`form-select ${editErrors.status ? "is-invalid" : ""}`}
                          value={editData.status}
                          onChange={(e) => setEditData("status", e.target.value)}
                        >
                          <option value="active">Active</option>
                          <option value="inactive">Inactive</option>
                        </select>
                        {editErrors.status && <div className="invalid-feedback">{editErrors.status}</div>}
                      </div>

                      <div className="modal-footer d-flex justify-content-end px-0">
                        <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">
                          Cancel
                        </button>
                        <button type="submit" className="btn btn-primary" disabled={editLoading}>
                          {editLoading && (
                            <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                          )}
                          Update Design
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </AdminDashboard>
      <CookiesV />
    </>
  );
}
