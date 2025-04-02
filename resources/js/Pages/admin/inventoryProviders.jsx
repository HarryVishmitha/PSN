import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AdminDashboard from '../../Layouts/AdminDashboard';
import Breadcrumb from "@/components/Breadcrumb";
import CookiesV from '@/Components/CookieConsent';
import Meta from '@/Components/Metaheads';
import { Icon } from "@iconify/react";
import Alert from "@/Components/Alert";

const InventoryProviders = ({ userDetails, inProviders }) => {
    // Extract initial perPage from URL query or default to 10
    const queryParams = new URLSearchParams(window.location.search);
    const initialPerPage = queryParams.get('perPage') || 10;

    // State for per-page, search, and filtering.
    const [perPage, setPerPage] = useState(initialPerPage);
    const [search, setSearch] = useState('');

    // Alert state for notifications.
    const [alert, setAlert] = useState(null);

    // State for add new provider form.
    const [newProvider, setNewProvider] = useState({
        name: '',
        contact_info: ''
    });
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);

    // States for editing provider.
    const [editProvider, setEditProvider] = useState(null);
    const [editErrors, setEditErrors] = useState({});
    const [editLoading, setEditLoading] = useState(false);

    // Handler for perPage change.
    const handlePerPageChange = (event) => {
        const value = event.target.value;
        setPerPage(value);
        router.visit(`${inProviders.path}?page=${inProviders.current_page}&perPage=${value}&search=${search}`);
    };

    // Handler for search change.
    const handleSearchChange = (event) => {
        setSearch(event.target.value);
    };

    // Handler for add new provider input changes.
    const handleInputChange = (event) => {
        const { name, value } = event.target;
        setNewProvider((prev) => ({ ...prev, [name]: value }));
    };

    // Handler for form submission (Add).
    const handleSubmitNewProvider = (event) => {
        event.preventDefault();
        setLoading(true);
        router.post(route('admin.addInventoryProvider'), newProvider, {
            onError: (error) => {
                setErrors(error);
                setAlert({ type: 'danger', message: 'Failed to add provider' });
                setLoading(false);
            },
            onSuccess: () => {
                setNewProvider({ name: '', contact_info: '' });
                setErrors({});
                setLoading(false);
                setAlert({ type: 'success', message: 'Provider added successfully' });
                // Close the modal manually (Bootstrap 5)
                document.querySelector('#addnewprovider .btn-close').click();
            },
        });
    };

    // Handler when edit button is clicked: set the provider to be edited.
    const handleEditClick = (provider) => {
        setEditProvider(provider);
        setEditErrors({});
    };

    // Handler for edit input changes.
    const handleEditInputChange = (event) => {
        const { name, value } = event.target;
        setEditProvider((prev) => ({ ...prev, [name]: value }));
    };

    // Handler for edit form submission.
    const handleSubmitEditProvider = (event) => {
        event.preventDefault();
        if (!editProvider) return;
        setEditLoading(true);
        router.patch(route('admin.editInventoryProvider', editProvider.id), editProvider, {
            onError: (error) => {
                setEditErrors(error);
                setAlert({ type: 'danger', message: 'Failed to update provider.' });
                setEditLoading(false);
            },
            onSuccess: () => {
                setAlert({ type: 'success', message: 'Provider updated successfully.' });
                setEditErrors({});
                setEditLoading(false);
                // Close the edit modal manually.
                document.querySelector('#editProviderModal .btn-close').click();
            },
        });
    };

    return (
        <>
            <Head title="Providers - Admin" />
            <Meta title='Providers - Admin' description='Manage providers, view details, and update information.' />
            <AdminDashboard userDetails={userDetails}>
                <Breadcrumb title="Providers" />
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
                                <option value="5">5</option>
                                <option value="10">10</option>
                                <option value="15">15</option>
                                <option value="20">20</option>
                                <option value="50">50</option>
                                <option value="100">100</option>
                            </select>
                            <form className="navbar-search" onSubmit={(e) => e.preventDefault()}>
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
                        </div>
                        <button
                            type="button"
                            className="btn btn-primary text-sm btn-sm px-12 py-12 radius-8 d-flex align-items-center gap-2"
                            data-bs-toggle="modal"
                            data-bs-target="#addnewprovider"
                        >
                            <Icon icon="ic:baseline-plus" className="icon text-xl line-height-1" />
                            Add New Provider
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
                                        <th scope="col">Added at</th>
                                        <th scope="col">Name</th>
                                        <th scope="col">Contact info</th>
                                        <th scope="col" className="text-center">Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {inProviders.data && inProviders.data.length > 0 ? (
                                        inProviders.data.map((provider, index) => (
                                            <tr key={provider.id}>
                                                <td>
                                                    <div className="d-flex align-items-center gap-10">
                                                        <div className="form-check style-check d-flex align-items-center">
                                                            <input
                                                                className="form-check-input radius-4 border border-neutral-400"
                                                                type="checkbox"
                                                                name="checkbox"
                                                            />
                                                        </div>
                                                        {inProviders.from + index}
                                                    </div>
                                                </td>
                                                <td>{new Date(provider.created_at).toLocaleDateString()}</td>
                                                <td>
                                                    <div className="d-flex align-items-center">
                                                        <div className="flex-grow-1">
                                                            <span className="text-md mb-0 fw-normal text-secondary-light">
                                                                {provider.name}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td>
                                                    <span className="text-md mb-0 fw-normal text-secondary-light">
                                                        {provider.contact_info}
                                                    </span>
                                                </td>
                                                <td className="text-center">
                                                    <div className="d-flex align-items-center gap-10 justify-content-center">
                                                        <button
                                                            type="button"
                                                            className="bg-success-focus text-success-600 bg-hover-success-200 fw-medium w-40-px h-40-px d-flex justify-content-center align-items-center rounded-circle"
                                                            data-bs-toggle="modal"
                                                            data-bs-target="#editProviderModal"
                                                            onClick={() => handleEditClick(provider)}
                                                        >
                                                            <Icon icon="lucide:edit" className="menu-icon" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="5" className="text-center">No providers found.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                        <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mt-24">
                            <span>
                                Showing {inProviders.from} to {inProviders.to} of {inProviders.total} entries
                            </span>
                            <ul className="pagination d-flex flex-wrap align-items-center gap-2 justify-content-center">
                                <li className={`page-item ${!inProviders.prev_page_url ? 'disabled' : ''}`}>
                                    <Link
                                        className="page-link bg-neutral-200 text-secondary-light fw-semibold radius-8 border-0 d-flex align-items-center justify-content-center h-32-px text-md"
                                        href={inProviders.prev_page_url || '#'}
                                    >
                                        <Icon icon="ep:d-arrow-left" />
                                    </Link>
                                </li>
                                {Array.from({ length: inProviders.last_page }, (_, i) => i + 1).map(page => (
                                    <li key={page} className={`page-item ${page === inProviders.current_page ? 'active' : ''}`}>
                                        <Link
                                            className="page-link text-secondary-light fw-semibold radius-8 border-0 d-flex align-items-center justify-content-center h-32-px w-32-px"
                                            href={`${inProviders.path}?page=${page}&perPage=${perPage}&search=${search}`}
                                        >
                                            {page}
                                        </Link>
                                    </li>
                                ))}
                                <li className={`page-item ${!inProviders.next_page_url ? 'disabled' : ''}`}>
                                    <Link
                                        className="page-link bg-neutral-200 text-secondary-light fw-semibold radius-8 border-0 d-flex align-items-center justify-content-center h-32-px text-md"
                                        href={inProviders.next_page_url || '#'}

                                    >
                                        <Icon icon="ep:d-arrow-right" />
                                    </Link>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Add New Provider Modal */}
                <div className="modal fade" id="addnewprovider" tabIndex={-1} aria-labelledby="addnewproviderlabel" aria-hidden="true">
                    <div className="modal-dialog modal-lg modal-dialog-centered">
                        <div className="modal-content radius-16 bg-base">
                            <div className="modal-header py-16 px-24 border-0">
                                <h5 className="modal-title fs-5" id="addnewproviderlabel">
                                    Add New Provider
                                </h5>
                                <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close" />
                            </div>
                            <div className="modal-body p-24">
                                <form onSubmit={handleSubmitNewProvider}>
                                    <div className="mb-3">
                                        <label htmlFor="providerName" className="form-label">Name <span className='tw-text-red-500'>*</span></label>
                                        <input
                                            type="text"
                                            name="name"
                                            id="providerName"
                                            value={newProvider.name}
                                            onChange={handleInputChange}
                                            className={`form-control ${errors.name ? 'is-invalid' : ''}`}
                                            placeholder="Enter provider name"
                                            required
                                        />
                                        {errors.name && (
                                            <div className="invalid-feedback">
                                                {Array.isArray(errors.name) ? errors.name[0] : errors.name}
                                            </div>
                                        )}
                                    </div>
                                    <div className="mb-3">
                                        <label htmlFor="providerContact" className="form-label">Contact Info <span className='tw-text-red-500'>*</span></label>
                                        <textarea
                                            name="contact_info"
                                            id="providerContact"
                                            rows={4}
                                            value={newProvider.contact_info}
                                            onChange={handleInputChange}
                                            className={`form-control ${errors.contact_info ? 'is-invalid' : ''}`}
                                            placeholder="Enter contact info"
                                            required
                                        ></textarea>
                                        {errors.contact_info && (
                                            <div className="invalid-feedback">
                                                {Array.isArray(errors.contact_info) ? errors.contact_info[0] : errors.contact_info}
                                            </div>
                                        )}
                                    </div>
                                    <div className="modal-footer">
                                        <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                                        <button type="submit" className="btn btn-primary" disabled={loading}>
                                            {loading ? 'Saving...' : 'Save Provider'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Edit Provider Modal */}
                <div className="modal fade" id="editProviderModal" tabIndex={-1} aria-labelledby="editProviderModalLabel" aria-hidden="true">
                    <div className="modal-dialog modal-lg modal-dialog-centered">
                        <div className="modal-content radius-16 bg-base">
                            <div className="modal-header py-16 px-24 border-0">
                                <h5 className="modal-title fs-5" id="editProviderModalLabel">
                                    Edit Provider
                                </h5>
                                <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close" />
                            </div>
                            <div className="modal-body p-24">
                                {editProvider && (
                                    <form onSubmit={handleSubmitEditProvider}>
                                        <div className="mb-3">
                                            <label htmlFor="editProviderName" className="form-label">Name <span className='tw-text-red-500'>*</span></label>
                                            <input
                                                type="text"
                                                name="name"
                                                id="editProviderName"
                                                value={editProvider.name}
                                                onChange={handleEditInputChange}
                                                className={`form-control ${editErrors.name ? 'is-invalid' : ''}`}
                                                placeholder="Enter provider name"
                                                required
                                            />
                                            {editErrors.name && (
                                                <div className="invalid-feedback">
                                                    {Array.isArray(editErrors.name) ? editErrors.name[0] : editErrors.name}
                                                </div>
                                            )}
                                        </div>
                                        <div className="mb-3">
                                            <label htmlFor="editProviderContact" className="form-label">Contact Info <span className='tw-text-red-500'>*</span></label>
                                            <textarea
                                                name="contact_info"
                                                id="editProviderContact"
                                                rows={4}
                                                value={editProvider.contact_info}
                                                onChange={handleEditInputChange}
                                                className={`form-control ${editErrors.contact_info ? 'is-invalid' : ''}`}
                                                placeholder="Enter contact info"
                                                required
                                            ></textarea>
                                            {editErrors.contact_info && (
                                                <div className="invalid-feedback">
                                                    {Array.isArray(editErrors.contact_info) ? editErrors.contact_info[0] : editErrors.contact_info}
                                                </div>
                                            )}
                                        </div>
                                        <div className="modal-footer">
                                            <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                                            <button type="submit" className="btn btn-primary" disabled={editLoading}>
                                                {editLoading ? 'Updating...' : 'Update Provider'}
                                            </button>
                                        </div>
                                    </form>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

            </AdminDashboard>
            <CookiesV />
        </>
    );
};

export default InventoryProviders;
