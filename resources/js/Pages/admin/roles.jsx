import React, { useState, useEffect } from 'react';
import { Head, router } from '@inertiajs/react';
import AdminDashboard from '../../Layouts/AdminDashboard';
import Breadcrumb from "@/components/Breadcrumb";
import { Icon } from "@iconify/react";
import CookiesV from '@/Components/CookieConsent';
import Alert from "@/Components/Alert";
import Meta from "@/Components/Metaheads";

const Roles = ({ userDetails, roles }) => {
    const queryParams = new URLSearchParams(window.location.search);
    const initialPerPage = queryParams.get("perPage") || 10;
    const initialPage = parseInt(queryParams.get("page") || 1, 10);

    const [perPage, setPerPage] = useState(initialPerPage);
    const [currentPage, setCurrentPage] = useState(initialPage);
    const [alert, setAlert] = useState(null); // { type: 'success' | 'danger', message: string }
    const [newRoleName, setNewRoleName] = useState('');
    const [newDescription, setNewDescription] = useState('');
    const [errors, setErrors] = useState({}); // Errors for add role
    const [loading, setLoading] = useState(false);

    // States for editing a role
    const [editingRole, setEditingRole] = useState(null); // { id, name, description }
    const [editingErrors, setEditingErrors] = useState({}); // Errors for edit role
    const [editingLoading, setEditingLoading] = useState(false);

    // State for delete feature
    const [selectedRoleId, setSelectedRoleId] = useState(null);
    const [deleteLoading, setDeleteLoading] = useState(false);

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const pagePerPage = params.get("perPage");
        const page = parseInt(params.get("page") || initialPage, 10);
        if (page) setCurrentPage(page);
        if (pagePerPage) setPerPage(pagePerPage);
    }, []);

    const handlePerPageChange = (event) => {
        const value = event.target.value;
        setPerPage(value);
        setCurrentPage(1);
        if (roles.path) {
            router.visit(`${roles.path}?page=1&perPage=${value}`);
        }
    };

    const handlePageChange = (page) => {
        setCurrentPage(page);
        if (roles.path) {
            router.visit(`${roles.path}?page=${page}&perPage=${perPage}`);
        }
    };

    const formatTimestamp = (timestamp) => {
        const date = new Date(timestamp);
        return date.toLocaleDateString();
    };

    // Determine roles list (use roles.data if available)
    const rolesList = Array.isArray(roles) && roles.length > 0
        ? roles
        : Array.isArray(roles.data) && roles.data.length > 0
            ? roles.data
            : [];

    if (!rolesList || rolesList.length === 0) {
        return (
            <>
                <Head title="Roles - Admin Dashboard" />
                <Meta title="Roles - Admin Dashboard"  description='User roles'/>
                <AdminDashboard userDetails={userDetails}>
                    <Breadcrumb title="Roles & Access" />
                    <div className="card h-100 p-0 radius-12">
                        <div className="card-body p-24">
                            <p>No roles available.</p>
                        </div>
                    </div>
                </AdminDashboard>
            </>
        );
    }

    const totalEntries = roles.total || rolesList.length;
    const lastPage = roles.last_page || 1;
    const path = roles.path || '';

    const getPaginationNumbers = () => {
        const pages = [];
        const delta = 2;
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

    // Add Role Submit Handler
    const handleAddRoleSubmit = (e) => {
        e.preventDefault();
        setLoading(true);
        setErrors({}); // Reset add role errors

        router.post(
            route('admin.storeRole'),
            {
                name: newRoleName,
                description: newDescription,
            },
            {
                preserveState: true,
                onSuccess: () => {
                    setNewRoleName('');
                    setNewDescription('');
                    setAlert({ type: 'success', message: 'Role added successfully' });
                    // Close the add modal
                    document.querySelector('#exampleModal .btn-close').click();
                },
                onError: (errors) => {
                    setErrors(errors);
                    setAlert({ type: 'danger', message: 'Failed to add role' });
                },
                onFinish: () => {
                    setLoading(false);
                },
            }
        );
    };

    // Simplified edit click: only set the editing role state.
    const handleEditClick = (role) => {
        setEditingRole({ id: role.id, name: role.name, description: role.description });
        setEditingErrors({});
    };

    // Edit Role Submit Handler
    const handleEditRoleSubmit = (e) => {
        e.preventDefault();
        if (!editingRole) return;
        setEditingLoading(true);
        setEditingErrors({});
        router.patch(
            route('admin.updateRole', editingRole.id),
            {
                name: editingRole.name,
                description: editingRole.description,
            },
            {
                preserveState: true,
                onSuccess: () => {
                    setAlert({ type: 'success', message: 'Role updated successfully' });
                    // Close the edit modal using Bootstrap's data API
                    document.querySelector('#editRolemodel .btn-close').click();
                },
                onError: (errors) => {
                    setEditingErrors(errors);
                    setAlert({ type: 'danger', message: 'Failed to update role' });
                },
                onFinish: () => {
                    setEditingLoading(false);
                },
            }
        );
    };

    // Delete feature functions
    const openDeleteModal = (roleId) => {
        setSelectedRoleId(roleId);
    };

    // Updated delete handler: if the current page contains only one role and it's not the first page,
    // redirect to the previous page.
    const handleRoleDelete = () => {
        setDeleteLoading(true);
        router.delete(`/admin/api/roles/${selectedRoleId}`, {
            preserveState: true,
            onSuccess: () => {
                if (rolesList.length === 1 && currentPage > 1) {
                    router.visit(`${path}?page=${currentPage - 1}&perPage=${perPage}`);
                    setAlert({ type: "success", message: "Role deleted successfully." });
                } else {
                    setAlert({ type: "success", message: "Role deleted successfully." });
                }
            },
            onError: () => {
                setAlert({ type: "danger", message: "Failed to delete role. Please try again later." });
            },
            onFinish: () => {
                setDeleteLoading(false);
                document.querySelector('#deleteModal .btn-close').click();
            }
        });
    };

    return (
        <>
            <Head title="Roles - Admin Dashboard" />
            <Meta title="Roles - Admin Dashboard" description='User roles' />
            <AdminDashboard userDetails={userDetails}>
                <Breadcrumb title="Roles & Access" />
                {alert && <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} />}
                <div className="card h-100 p-0 radius-12">
                    <div className="card-header border-bottom bg-base py-16 px-24 d-flex align-items-center flex-wrap gap-3 justify-content-between">
                        <div className="d-flex align-items-center flex-wrap gap-3">
                            <span className="text-md fw-medium text-secondary-light mb-0">Show</span>
                            <select
                                className="form-select form-select-sm w-auto ps-12 py-6 radius-12 h-40-px"
                                value={perPage}
                                onChange={handlePerPageChange}
                            >
                                {[5, 10, 15, 20, 50, 100].map((value) => (
                                    <option key={value} value={value}>
                                        {value}
                                    </option>
                                ))}
                            </select>
                            <form className="navbar-search">
                                <input
                                    type="text"
                                    className="bg-base h-40-px w-auto"
                                    name="search"
                                    placeholder="Search"
                                />
                                <Icon icon="ion:search-outline" className="icon" />
                            </form>
                        </div>
                        <button
                            type="button"
                            className="btn btn-primary text-sm btn-sm px-12 py-12 radius-8 d-flex align-items-center gap-2"
                            data-bs-toggle="modal"
                            data-bs-target="#exampleModal"
                        >
                            <Icon icon="ic:baseline-plus" className="icon text-xl line-height-1" />
                            Add New Role
                        </button>
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
                                                S.L
                                            </div>
                                        </th>
                                        <th scope="col">Create Date</th>
                                        <th scope="col">Role</th>
                                        <th scope="col">Description</th>
                                        <th scope="col" className="text-center">Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {rolesList.map((role, index) => (
                                        <tr key={role.id}>
                                            <td>
                                                <div className="d-flex align-items-center gap-10">
                                                    <div className="form-check style-check d-flex align-items-center">
                                                        <input
                                                            className="form-check-input radius-4 border border-neutral-400"
                                                            type="checkbox"
                                                            name="checkbox"
                                                        />
                                                    </div>
                                                    {(currentPage - 1) * perPage + index + 1}
                                                </div>
                                            </td>
                                            <td>{role.created_at ? formatTimestamp(role.created_at) : "Null"}</td>
                                            <td className="tw-capitalize">{role.name}</td>
                                            <td>
                                                <p className="max-w-500-px">{role.description}</p>
                                            </td>
                                            <td className="text-center">
                                                <div className="d-flex align-items-center gap-10 justify-content-center">
                                                    <button
                                                        type="button"
                                                        className="bg-success-focus text-success-600 bg-hover-success-200 fw-medium w-40-px h-40-px d-flex justify-content-center align-items-center rounded-circle"
                                                        data-bs-toggle="modal"
                                                        data-bs-target="#editRolemodel"
                                                        onClick={() => handleEditClick(role)}
                                                    >
                                                        <Icon icon="lucide:edit" className="menu-icon" />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className="remove-item-btn bg-danger-focus bg-hover-danger-200 text-danger-600 fw-medium w-40-px h-40-px d-flex justify-content-center align-items-center rounded-circle"
                                                        data-bs-toggle="modal"
                                                        data-bs-target="#deleteModal"
                                                        onClick={() => openDeleteModal(role.id)}
                                                    >
                                                        <Icon icon="fluent:delete-24-regular" className="menu-icon" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        {path && totalEntries > rolesList.length && (
                            <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mt-24">
                                <span>
                                    Showing {(currentPage - 1) * perPage + 1} to{" "}
                                    {Math.min(currentPage * perPage, totalEntries)} of {totalEntries} entries
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
                                                <span className="page-link bg-neutral-200 text-secondary-light fw-semibold radius-8 d-flex align-items-center justify-content-center h-32-px w-32-px">
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
                                    {currentPage < lastPage && (
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

                {/* Add New Role Modal */}
                <div className="modal fade" id="exampleModal" tabIndex={-1} aria-labelledby="exampleModalLabel" aria-hidden="true">
                    <div className="modal-dialog modal-lg modal-dialog-centered">
                        <div className="modal-content radius-16 bg-base">
                            <div className="modal-header py-16 px-24 border-0">
                                <h5 className="modal-title fs-5" id="exampleModalLabel">
                                    Add New Role
                                </h5>
                                <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close" />
                            </div>
                            <div className="modal-body p-24">
                                <form onSubmit={handleAddRoleSubmit}>
                                    <div className="row">
                                        <div className="col-12 mb-20">
                                            <label className="form-label fw-semibold text-primary-light text-sm mb-8">
                                                Role Name
                                            </label>
                                            <input
                                                type="text"
                                                className={`form-control radius-8 ${errors.name ? 'is-invalid' : ''}`}
                                                placeholder="Enter Role Name"
                                                value={newRoleName}
                                                onChange={(e) => setNewRoleName(e.target.value)}
                                                required
                                            />
                                            {errors.name && (
                                                <div className="invalid-feedback">
                                                    {Array.isArray(errors.name) ? errors.name[0] : errors.name}
                                                </div>
                                            )}
                                        </div>
                                        <div className="col-12 mb-20">
                                            <label htmlFor="desc" className="form-label fw-semibold text-primary-light text-sm mb-8">
                                                Description
                                            </label>
                                            <textarea
                                                className={`form-control ${errors.description ? 'is-invalid' : ''}`}
                                                id="desc"
                                                rows={4}
                                                placeholder="Write some text"
                                                value={newDescription}
                                                onChange={(e) => setNewDescription(e.target.value)}
                                            />
                                            {errors.description && (
                                                <div className="invalid-feedback">
                                                    {Array.isArray(errors.description) ? errors.description[0] : errors.description}
                                                </div>
                                            )}
                                        </div>
                                        <div className="d-flex align-items-center justify-content-center gap-3 mt-24">
                                            <button type="reset" className="border border-danger-600 bg-hover-danger-200 text-danger-600 text-md px-40 py-11 radius-8" data-bs-dismiss="modal" aria-label="Close">
                                                Cancel
                                            </button>
                                            <button type="submit" className="btn btn-primary border border-primary-600 text-md px-48 py-12 radius-8" disabled={loading}>
                                                {loading ? (
                                                    <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                                                ) : (
                                                    "Save"
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Edit Role Modal */}
                <div className="modal fade" id="editRolemodel" tabIndex={-1} aria-labelledby="editRoleModalLabel" aria-hidden="true">
                    <div className="modal-dialog modal-lg modal-dialog-centered">
                        <div className="modal-content radius-16 bg-base">
                            <div className="modal-header py-16 px-24 border-0">
                                <h5 className="modal-title fs-5" id="editRoleModalLabel">
                                    Edit Role
                                </h5>
                                <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close" />
                            </div>
                            <div className="modal-body p-24">
                                <form onSubmit={handleEditRoleSubmit}>
                                    <div className="row">
                                        <div className="col-12 mb-20">
                                            <label className="form-label fw-semibold text-primary-light text-sm mb-8">
                                                Role Name
                                            </label>
                                            <input
                                                type="text"
                                                className={`form-control radius-8 ${editingErrors.name ? 'is-invalid' : ''}`}
                                                placeholder="Enter Role Name"
                                                value={editingRole ? editingRole.name : ''}
                                                onChange={(e) => setEditingRole({ ...editingRole, name: e.target.value })}
                                                required
                                            />
                                            {editingErrors.name && (
                                                <div className="invalid-feedback">
                                                    {Array.isArray(editingErrors.name) ? editingErrors.name[0] : editingErrors.name}
                                                </div>
                                            )}
                                        </div>
                                        <div className="col-12 mb-20">
                                            <label htmlFor="desc" className="form-label fw-semibold text-primary-light text-sm mb-8">
                                                Description
                                            </label>
                                            <textarea
                                                className={`form-control ${editingErrors.description ? 'is-invalid' : ''}`}
                                                id="desc"
                                                rows={4}
                                                placeholder="Write some text"
                                                value={editingRole ? editingRole.description : ''}
                                                onChange={(e) => setEditingRole({ ...editingRole, description: e.target.value })}
                                            />
                                            {editingErrors.description && (
                                                <div className="invalid-feedback">
                                                    {Array.isArray(editingErrors.description) ? editingErrors.description[0] : editingErrors.description}
                                                </div>
                                            )}
                                        </div>
                                        <div className="d-flex align-items-center justify-content-center gap-3 mt-24">
                                            <button type="reset" className="border border-danger-600 bg-hover-danger-200 text-danger-600 text-md px-40 py-11 radius-8" data-bs-dismiss="modal" aria-label="Close">
                                                Cancel
                                            </button>
                                            <button type="submit" className="btn btn-primary border border-primary-600 text-md px-48 py-12 radius-8" disabled={editingLoading}>
                                                {editingLoading ? (
                                                    <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                                                ) : (
                                                    "Save"
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Delete Role Modal */}
                <div className="modal fade" id="deleteModal" tabIndex="-1" aria-labelledby="deleteModalLabel" aria-hidden="true">
                    <div className="modal-dialog">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h1 className="modal-title fs-5 text-red-500" id="deleteModalLabel">Are you sure?</h1>
                                <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                            </div>
                            <div className="modal-body font-light">
                                <p>Do you really want to delete this role? This process cannot be undone.</p>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                                <button
                                    type="button"
                                    className="btn btn-outline-danger"
                                    onClick={handleRoleDelete}
                                    disabled={deleteLoading}
                                >
                                    {deleteLoading ? (
                                        <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                                    ) : (
                                        "Delete Role"
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

            </AdminDashboard>
            <CookiesV />
        </>
    );
};

export default Roles;
