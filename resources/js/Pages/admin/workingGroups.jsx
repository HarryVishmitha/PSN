import React, { useState, useEffect } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AdminDashboard from '../../Layouts/AdminDashboard';
import Breadcrumb from "@/components/Breadcrumb";
import CookiesV from '@/Components/CookieConsent';
import { Icon } from "@iconify/react";
import Alert from "@/Components/Alert";
import Meta from "@/Components/Metaheads";

const WorkingGroups = ({ userDetails, workingGroups, status: selectedStatus }) => {
    // Initialize filtering and pagination from URL parameters
    const queryParams = new URLSearchParams(window.location.search);
    const initialPerPage = queryParams.get('perPage') || 10;
    const [perPage, setPerPage] = useState(initialPerPage);
    const [status, setStatus] = useState(selectedStatus || '');
    const [search, setSearch] = useState('');

    // State for alerts, loading, and error messages
    const [alert, setAlert] = useState(null);
    const [updateLoading, setUpdateLoading] = useState(false);
    const [errors, setErrors] = useState({});

    // State for selected working group for editing and its form data
    const [selectedWG, setSelectedWG] = useState(null);
    const [editData, setEditData] = useState({
        name: '',
        description: '',
        wg_image: '', // This holds the preview URL
        status: 'active',
    });
    // State for the actual file object
    const [selectedImageFile, setSelectedImageFile] = useState(null);

    // When a working group is selected for editing, prepopulate the form fields
    useEffect(() => {
        if (selectedWG) {
            setEditData({
                name: selectedWG.name || '',
                description: selectedWG.description || '',
                wg_image: selectedWG.wg_image || '',
                status: selectedWG.status || 'active',
            });
            // Reset file object when editing an existing record.
            setSelectedImageFile(null);
        }
    }, [selectedWG]);

    // Reset modal details when modal is closed
    useEffect(() => {
        const modalEl = document.getElementById('editWG');
        const handleModalHidden = () => {
            setSelectedWG(null);
            setEditData({ name: '', description: '', wg_image: '', status: 'active' });
            setErrors({});
            setSelectedImageFile(null);
        };
        modalEl?.addEventListener('hidden.bs.modal', handleModalHidden);
        return () => {
            modalEl?.removeEventListener('hidden.bs.modal', handleModalHidden);
        };
    }, []);

    // Handle changes in the edit modal inputs (for text/radio fields)
    const handleEditChange = (e) => {
        setEditData({
            ...editData,
            [e.target.name]: e.target.value,
        });
    };

    // Handle file change for single image upload
    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const src = URL.createObjectURL(file);
            setEditData({ ...editData, wg_image: src });
            setSelectedImageFile(file);
        }
    };

    // Update working group details when the form is submitted
    const handleUpdate = (e) => {
        e.preventDefault();
        setUpdateLoading(true);

        // Create a FormData object and append the fields.
        const formData = new FormData();
        formData.append('name', editData.name);
        formData.append('description', editData.description);
        formData.append('status', editData.status);
        // Append the image file if one is selected.
        if (selectedImageFile) {
            formData.append('wg_image', selectedImageFile);
        }

        // (For debugging, you can iterate over formData entries if needed)
        // for (let [key, value] of formData.entries()) {
        //   console.log(`${key}: ${value}`);
        // }

        if (selectedWG) {

            formData.append('_method', 'PATCH');

            router.post(`/admin/api/working-groups/${selectedWG.id}/edit`, formData, {
                preserveState: true,
                forceFormData: true,
                onSuccess: () => {
                    setAlert({ type: "success", message: "Working Group updated successfully." });
                    setErrors({});
                    // Hide modal
                    document.querySelector('#editWG .btn-close').click();
                },
                onError: (err) => {
                    setAlert({ type: "danger", message: "Failed to update Working Group." });
                    setErrors(err);
                },
                onFinish: () => {
                    setUpdateLoading(false);
                },
            });


        } else {
            // Create new working group via POST
            router.post(route('admin.addWS'), formData, {
                preserveState: true,
                forceFormData: true,
                onSuccess: () => {
                    setAlert({ type: "success", message: "Working Group created successfully." });
                    setErrors({});
                    // Hide modal
                    document.querySelector('#editWG .btn-close').click();
                },
                onError: (err) => {
                    setAlert({ type: "danger", message: "Failed to create Working Group." });
                    setErrors(err);
                },
                onFinish: () => {
                    setUpdateLoading(false);
                },
            });
        }
    };

    // Handle pagination and filtering
    const handlePerPageChangeFn = (event) => {
        const value = event.target.value;
        setPerPage(value);
        router.visit(`${workingGroups.path}?page=${workingGroups.current_page}&perPage=${value}&status=${status}`);
    };

    const handleSearchChange = (event) => {
        setSearch(event.target.value);
        // (Optional: Add search filtering logic here)
    };

    const handleStatusChange = (event) => {
        const value = event.target.value;
        setStatus(value);
        router.visit(`${workingGroups.path}?page=${workingGroups.current_page}&perPage=${perPage}&status=${value}`);
    };

    // Update local state when URL parameters change
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const pagePerPage = params.get('perPage');
        const pageStatus = params.get('status');
        if (pagePerPage) setPerPage(pagePerPage);
        if (pageStatus) setStatus(pageStatus);
    }, [workingGroups.path]);

    const formatTimestamp = (timestamp) => {
        const date = new Date(timestamp);
        return date.toLocaleDateString();
    };

    return (
        <>
            <Head title="Working Groups - Admin Dashboard" />
            <Meta title="Working Groups - Admin Dashboard" description="Manage working groups efficiently." />
            <AdminDashboard userDetails={userDetails}>
                <Breadcrumb title="Working Groups" />
                {alert && <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} />}
                <div className="card h-100 p-0 radius-12">
                    <div className="card-header border-bottom bg-base py-16 px-24 d-flex align-items-center flex-wrap gap-3 justify-content-between">
                        <div className="d-flex align-items-center flex-wrap gap-3">
                            <span className="text-md fw-medium text-secondary-light mb-0">Show</span>
                            <select
                                className="form-select form-select-sm w-auto ps-12 py-6 radius-12 h-40-px"
                                value={perPage}
                                onChange={handlePerPageChangeFn}
                            >
                                <option value="5">5</option>
                                <option value="10">10</option>
                                <option value="15">15</option>
                                <option value="20">20</option>
                                <option value="50">50</option>
                                <option value="100">100</option>
                            </select>
                            <form className="navbar-search">
                                <input
                                    type="text"
                                    className="bg-base h-40-px w-auto"
                                    name="search"
                                    placeholder="Search"
                                    value={search}
                                    onChange={handleSearchChange}
                                />
                                <Icon icon="ion:search-outline" className="icon" />
                            </form>
                            <select
                                className="form-select form-select-sm w-auto ps-12 py-6 radius-12 h-40-px"
                                value={status}
                                onChange={handleStatusChange}
                            >
                                <option value="" disabled>
                                    Select Status
                                </option>
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                                <option value="inactivating">Inactivating</option>
                            </select>
                        </div>
                        {/* "Add New Working Group" button opens the modal in add mode */}
                        <button
                            className="btn btn-primary text-sm btn-sm px-12 py-12 radius-8 d-flex align-items-center gap-2"
                            data-bs-toggle="modal"
                            data-bs-target="#editWG"
                            onClick={() => {
                                setSelectedWG(null);
                                setEditData({ name: '', description: '', wg_image: '', status: 'active' });
                                setErrors({});
                                setSelectedImageFile(null);
                            }}
                        >
                            <Icon icon="ic:baseline-plus" className="icon text-xl line-height-1" />
                            Add New Working Group
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
                                        <th scope="col">Created Date</th>
                                        <th scope="col">Name</th>
                                        <th scope="col">Description</th>
                                        <th scope="col">Total Users</th>
                                        <th scope="col">Total Products</th>
                                        <th scope="col" className="text-center">Status</th>
                                        <th scope="col" className="text-center">Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {workingGroups.data.map((group, index) => (
                                        <tr key={group.id}>
                                            <td>
                                                <div className="d-flex align-items-center gap-10">
                                                    <div className="form-check style-check d-flex align-items-center">
                                                        <input
                                                            className="form-check-input radius-4 border border-neutral-400"
                                                            type="checkbox"
                                                            name="checkbox"
                                                        />
                                                    </div>
                                                    {Number(workingGroups.from) + index}
                                                </div>
                                            </td>
                                            <td>{formatTimestamp(group.created_at)}</td>
                                            <td>
                                                <div className="d-flex align-items-center">
                                                    <div className="position-relative flex-shrink-0 me-12">
                                                        <img
                                                            src={group.wg_image || '/images/favicon.png'}
                                                            alt="Working Group"
                                                            className="w-40-px h-40-px rounded-circle overflow-hidden"
                                                        />
                                                        <span className="position-absolute bottom-0 end-0 bg-dark text-white small px-1 rounded tw-text-[8px]">
                                                            WG
                                                        </span>
                                                    </div>
                                                    <div className="flex-grow-1">
                                                        <span className="text-md mb-0 fw-normal text-secondary-light tw-capitalize">
                                                            {group.name}
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <span className="text-md mb-0 fw-normal text-secondary-light tw-capitalize">
                                                    {group.description}
                                                </span>
                                            </td>
                                            <td>{group.users_count || 0}</td>
                                            <td>{group.products_count || 0}</td>
                                            <td className="text-center">
                                                <span
                                                    className={`px-24 py-4 radius-4 fw-medium text-sm tw-capitalize ${group.status === 'active'
                                                            ? 'bg-success-focus text-success-600 border border-success-main'
                                                            : group.status === 'inactive'
                                                                ? 'bg-danger-focus text-danger-600 border border-danger-main'
                                                                : 'bg-warning-focus text-warning-600 border border-warning-main'
                                                        }`}
                                                >
                                                    {group.status}
                                                </span>
                                            </td>
                                            <td className="text-center">
                                                <div className="d-flex align-items-center gap-10 justify-content-center">
                                                    <button
                                                        type="button"
                                                        className="bg-info-focus bg-hover-info-200 text-info-600 fw-medium w-40-px h-40-px d-flex justify-content-center align-items-center rounded-circle"
                                                        data-bs-toggle="modal"
                                                        data-bs-target="#editWG"
                                                        onClick={() => setSelectedWG(group)}
                                                    >
                                                        <Icon icon="majesticons:eye-line" className="icon text-xl" />
                                                    </button>
                                                    <Link
                                                        type="button"
                                                        className="bg-success-focus text-success-600 bg-hover-success-200 fw-medium w-40-px h-40-px d-flex justify-content-center align-items-center rounded-circle"
                                                        href={`/admin/manage/${group.id}/working-group`}
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
                        <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mt-24">
                            <span>
                                Showing {workingGroups.from} to {workingGroups.to} of {workingGroups.total} entries
                            </span>
                            <ul className="pagination d-flex flex-wrap align-items-center gap-2 justify-content-center">
                                <li className={`page-item ${!workingGroups.prev_page_url ? 'disabled' : ''}`}>
                                    <Link
                                        className="page-link bg-neutral-200 text-secondary-light fw-semibold radius-8 border-0 d-flex align-items-center justify-content-center h-32-px text-md"
                                        to={workingGroups.prev_page_url || '#'}
                                    >
                                        <Icon icon="ep:d-arrow-left" className="" />
                                    </Link>
                                </li>
                                {Array.from({ length: workingGroups.last_page }, (_, i) => i + 1).map(page => (
                                    <li key={page} className={`page-item ${page === workingGroups.current_page ? 'active' : ''}`}>
                                        <Link
                                            className="page-link text-secondary-light fw-semibold radius-8 border-0 d-flex align-items-center justify-content-center h-32-px w-32-px"
                                            to={`${workingGroups.path}?page=${page}&perPage=${perPage}&status=${status}`}
                                        >
                                            {page}
                                        </Link>
                                    </li>
                                ))}
                                <li className={`page-item ${!workingGroups.next_page_url ? 'disabled' : ''}`}>
                                    <Link
                                        className="page-link bg-neutral-200 text-secondary-light fw-semibold radius-8 border-0 d-flex align-items-center justify-content-center h-32-px text-md"
                                        to={workingGroups.next_page_url || '#'}
                                    >
                                        <Icon icon="ep:d-arrow-right" className="" />
                                    </Link>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Edit / Add Working Group Modal */}
                <div className="modal fade" id="editWG" tabIndex="-1" aria-labelledby="editWGLabel" aria-hidden="true">
                    <div className="modal-dialog modal-lg modal-dialog-centered">
                        <div className="modal-content radius-16 bg-base">
                            <div className="modal-header py-16 px-24 border-0">
                                <h1 className="modal-title fs-5" id="editWGLabel">
                                    {selectedWG ? 'Edit Working Group' : 'Add New Working Group'}
                                </h1>
                                <button
                                    type="button"
                                    className="btn-close"
                                    data-bs-dismiss="modal"
                                    aria-label="Close"
                                    onClick={() => setSelectedWG(null)}
                                ></button>
                            </div>
                            <div className="modal-body p-24">
                                <form onSubmit={handleUpdate} encType="multipart/form-data">
                                    <div className="row">
                                        <div className="col-12 mb-20">
                                            <label className="form-label fw-semibold text-primary-light text-sm mb-8">
                                                Working Group Name
                                            </label>
                                            <input
                                                type="text"
                                                name="name"
                                                className={`form-control radius-8 ${errors.name ? 'is-invalid' : ''}`}
                                                placeholder="Enter Working Group Name"
                                                value={editData.name}
                                                onChange={handleEditChange}
                                            />
                                            {errors.name && <div className="invalid-feedback">{errors.name}</div>}
                                        </div>
                                        <div className="col-12 mb-20">
                                            <label className="form-label fw-semibold text-primary-light text-sm mb-8">
                                                Description
                                            </label>
                                            <textarea
                                                name="description"
                                                className={`form-control ${errors.description ? 'is-invalid' : ''}`}
                                                rows={4}
                                                placeholder="Enter Description"
                                                value={editData.description}
                                                onChange={handleEditChange}
                                            />
                                            {errors.description && <div className="invalid-feedback">{errors.description}</div>}
                                        </div>
                                        <div className="col-12 mb-20">
                                            <label className="form-label fw-semibold text-primary-light text-sm mb-8">
                                                Image Upload
                                            </label>
                                            <div className="upload-image-wrapper d-flex align-items-center gap-3 flex-wrap">
                                                <div className="uploaded-img-container position-relative h-120-px w-120-px border input-form-light radius-8 overflow-hidden border-dashed bg-neutral-50">
                                                    {editData.wg_image ? (
                                                        <>
                                                            <img
                                                                className="w-100 h-100 object-fit-cover"
                                                                src={editData.wg_image}
                                                                alt="Uploaded Preview"
                                                            />
                                                            <button
                                                                type="button"
                                                                className="position-absolute top-0 end-0 z-1 text-2xxl line-height-1 me-8 mt-8 d-flex"
                                                                onClick={() => {
                                                                    setEditData({ ...editData, wg_image: '' });
                                                                    setSelectedImageFile(null);
                                                                }}
                                                            >
                                                                <Icon icon="radix-icons:cross-2" className="text-xl text-danger-600" />
                                                            </button>
                                                        </>
                                                    ) : (
                                                        <label
                                                            className="d-flex align-items-center justify-content-center flex-column h-100 w-100 cursor-pointer"
                                                            htmlFor="upload-single"
                                                        >
                                                            <Icon icon="solar:camera-outline" className="text-xl text-secondary-light" />
                                                            <span className="fw-semibold text-secondary-light">Upload</span>
                                                        </label>
                                                    )}
                                                    <input
                                                        id="upload-single"
                                                        type="file"
                                                        name="wg_image"
                                                        hidden
                                                        onChange={handleFileChange}
                                                    />
                                                </div>
                                            </div>
                                            {errors.wg_image && <div className="invalid-feedback d-block">{errors.wg_image}</div>}
                                        </div>
                                        <div className="d-flex align-items-center flex-wrap gap-28">
                                            <div className="form-check checked-success d-flex align-items-center gap-2">
                                                <input
                                                    className="form-check-input"
                                                    type="radio"
                                                    name="status"
                                                    id="Personal"
                                                    value="active"
                                                    checked={editData.status === 'active'}
                                                    onChange={handleEditChange}
                                                />
                                                <label
                                                    className="form-check-label line-height-1 fw-medium text-secondary-light text-sm d-flex align-items-center gap-1"
                                                    htmlFor="Personal"
                                                >
                                                    <span className="w-8-px h-8-px bg-success-600 rounded-circle" />
                                                    Active
                                                </label>
                                            </div>
                                            <div className="form-check checked-danger d-flex align-items-center gap-2">
                                                <input
                                                    className="form-check-input"
                                                    type="radio"
                                                    name="status"
                                                    id="Holiday"
                                                    value="inactive"
                                                    checked={editData.status === 'inactive'}
                                                    onChange={handleEditChange}
                                                />
                                                <label
                                                    className="form-check-label line-height-1 fw-medium text-secondary-light text-sm d-flex align-items-center gap-1"
                                                    htmlFor="Holiday"
                                                >
                                                    <span className="w-8-px h-8-px bg-danger-600 rounded-circle" />
                                                    Inactive
                                                </label>
                                            </div>
                                        </div>
                                        <div className="d-flex align-items-center justify-content-center gap-3 mt-24">
                                            <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">
                                                Cancel
                                            </button>
                                            <button type="submit" className="btn btn-primary" disabled={updateLoading}>
                                                {updateLoading ? (
                                                    <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                                                ) : (
                                                    "Save Changes"
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
                {/* End Edit Modal */}
            </AdminDashboard>
            <CookiesV />
        </>
    );
};

export default WorkingGroups;
