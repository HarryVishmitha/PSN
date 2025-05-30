import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Head, router, Link } from '@inertiajs/react';
import AdminDashboard from '../../Layouts/AdminDashboard';
import Breadcrumb from "@/components/Breadcrumb";
import { Icon } from "@iconify/react";
import CookiesV from '@/Components/CookieConsent';
import Alert from "@/Components/Alert";
import Meta from "@/Components/Metaheads";
import hljs from "highlight.js";
import ReactQuill from "react-quill-new";
import 'react-quill-new/dist/quill.snow.css';

const DailyCustomers = ({ userDetails, customers, filters, workingGroups }) => {
    const [alert, setAlert] = useState(null); // { type, message }
    const [errors, setErrors] = useState({}); // validation errors

    const [search, setSearch] = useState(filters.search || '');
    const [perPage, setPerPage] = useState(filters.per_page || 10); // Default to 10
    const [status, setStatus] = useState(filters.status || '');
    const [loading, setLoading] = useState(false);
    const [viewCustomer, setViewCustomer] = useState(null);

    const applyFilters = () => {
        router.get(
            route('admin.dailyCustomers'),
            {
                search,
                per_page: perPage ? perPage : undefined,
                status: status || undefined,
            },
            {
                preserveState: true,
                replace: true,
            }
        );
    };

    useEffect(() => {
        setSearch(filters.search || '');
        setPerPage(filters.per_page || 10);
        setStatus(filters.status || '');
    }, [filters.search, filters.per_page, filters.status]);

    // State for "Add Customer" form
    const emptyForm = {
        full_name: '',
        phone_number: '0000000000',
        email: '',
        address: '',
        notes: '',
        visit_date: new Date().toISOString().split('T')[0], // Set today's date
        working_group_id: '',
    };
    const [addForm, setAddForm] = useState(emptyForm);
    const [addErrors, setAddErrors] = useState({});

    // Clear form & errors whenever the modal opens
    useEffect(() => {
        const modalEl = document.getElementById('addCustomerModal');
        modalEl.addEventListener('show.bs.modal', () => {
            setAddForm(emptyForm);
            setAddErrors({});
        });
    }, []);

    // Handle input changes
    const handleAddChange = e => {
        setAddForm({ ...addForm, [e.target.name]: e.target.value });
    };

    // Submit the form
    const submitAdd = e => {
        e.preventDefault();
        setLoading(true);

        router.post(route('admin.addDailyCustomer'), addForm, {
            preserveState: true,
            preserveScroll: true,
            onSuccess: (page) => {
                // Close the modal after successful submission
                document.querySelector('#addCustomerModal .btn-close').click();

                // Display success alert
                setAlert({
                    type: 'success',
                    message: 'Walk-in Customer added successfully!',
                });

                // Optionally, you can update the customer list if needed
                // For example, adding the new customer to the existing list
                // setCustomers(prevCustomers => [...prevCustomers, page.customer]);
            },
            onError: (errs) => {
                // Handle form validation errors
                setAddErrors(errs);

                // Show error message
                setAlert({
                    type: 'danger',
                    message: 'Please correct the errors below.',
                });
            },
            onFinish: () => {
                setLoading(false);
            },

        });
    };

    const openViewCustomerModal = (customer) => setViewCustomer(customer);

    const [editForm, setEditForm] = useState({
        full_name: '',
        phone_number: '',
        email: '',
        address: '',
        notes: '',
        visit_date: '',
        working_group_id: '',
    });

    // console.log('editForm', editForm);

    const [editErrors, setEditErrors] = useState({});
    const [editloading, seteditLoading] = useState(false); // Loader state

    // Function to open the Edit modal and populate the form with the selected customer's data
    const openEditModal = (customer) => {
        setEditForm({
            id: customer.id,                // ← make sure id is set
            full_name: customer.full_name,
            phone_number: customer.phone_number,
            email: customer.email,
            address: customer.address,
            notes: customer.notes,
            visit_date: new Date(customer.visit_date).toISOString().split('T')[0],
            working_group_id: customer.working_group_id || '',
        });
    };
    // Handle input changes for the Edit form
    const handleEditChange = (e) => {
        setEditForm({ ...editForm, [e.target.name]: e.target.value });
    };

    // Submit the edit form
    const submitEdit = e => {
        e.preventDefault();
        seteditLoading(true);

        // Build the URL: /api/daily-customers/{id}/edit
        const url = route('admin.editDailyCustomer', { id: editForm.id });

        router.patch(url, editForm, {
            preserveState: true,
            preserveScroll: true,
            onSuccess: () => {
                // close modal, show alert, hide loader
                document.querySelector('#editCustomerModal .btn-close').click();
                setAlert({ type: 'success', message: 'Customer updated!' });
                seteditLoading(false);
            },
            onError: errors => {
                setEditErrors(errors);
                setAlert({ type: 'danger', message: 'Fix the errors below.' });
                seteditLoading(false);
            },
        });
    };

    const handlePerPageChange = e => {
        const newPerPage = e.target.value;
        setPerPage(newPerPage);

        // trigger your filter with the fresh value
        router.get(
            route('admin.dailyCustomers'),
            {
                search,
                per_page: newPerPage || undefined,
            },
            { preserveState: true, replace: true }
        );
    };


    // inside DailyCustomers component:

    const [deleteCustomerId, setDeleteCustomerId] = useState(null);
    const [deleteLoading, setDeleteLoading] = useState(false);

    const openDeleteModal = (id) => {
        setDeleteCustomerId(id);
    };

    // invoked when user confirms deletion
    const confirmDelete = () => {
        setDeleteLoading(true);
        setAlert(null);

        router.delete(
            route('admin.deleteDailyCustomer', { customer: deleteCustomerId }),
            {
                preserveState: true,
                preserveScroll: true,
                onSuccess: () => {
                    setAlert({ type: 'success', message: 'Customer deleted.' });
                    // optionally refetch list or remove from local state
                    document.querySelector('#deleteCustomerModal .btn-close').click();
                    setDeleteLoading(false);
                },
                onError: () => {
                    setAlert({ type: 'danger', message: 'Delete failed.' });
                    document.querySelector('#deleteCustomerModal .btn-close').click();
                    setDeleteLoading(false);
                },
            }
        );
    };



    return (
        <>
            <Head title="Daily Customer Management - Admin Dashboard" />
            <Meta title="Daily Customer Management - Admin Dashboard" description="Manage walk-in customers" />

            <AdminDashboard userDetails={userDetails}>
                <Breadcrumb title="Daily Customers (Walk-in Customers)" />
                {alert && <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} />}

                <div className="card h-100 p-0 radius-12">
                    <div className="card-header border-bottom bg-base py-16 px-24 d-flex align-items-center flex-wrap gap-3 justify-content-between">
                        {errors && Object.keys(errors).length > 0 && (
                            <div
                                className="alert alert-danger bg-danger-100 mb-3 text-danger-600 border-danger-600 border-start-width-4-px border-top-0 border-end-0 border-bottom-0 px-24 py-13 mb-0 fw-semibold text-lg radius-4 d-flex align-items-center justify-content-between"
                                role="alert"
                            >
                                <ol>
                                    {Object.values(errors).map((error, index) => (
                                        <li key={index}>{error}</li>
                                    ))}
                                </ol>
                            </div>
                        )}
                        <div className="d-flex align-items-center flex-wrap gap-3">
                            <span className="text-md fw-medium text-secondary-light mb-0">Show</span>
                            <select
                                className="form-select form-select-sm w-auto ps-12 py-6 radius-12 h-40-px"
                                value={perPage}
                                onChange={handlePerPageChange}
                            >
                                <option value="" disabled>Select Number</option>
                                {[10, 20, 25, 50, 75, 100].map(n => (
                                    <option key={n} value={n}>{n}</option>
                                ))}
                            </select>
                            <form
                                className="navbar-search"
                                onSubmit={e => { e.preventDefault(); applyFilters(); }}
                            >
                                <input
                                    type="text"
                                    className="bg-base h-40-px w-auto"
                                    name="search"
                                    placeholder="Search"
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                />
                                <button type="submit" className="btn p-0 bg-transparent">
                                    <Icon icon="ion:search-outline" className="icon" />
                                </button>
                            </form>
                            {/* — status filter — */}
                            {/* <select
                                className="form-select form-select-sm w-auto ps-12 py-6 radius-12 h-40-px"
                                value={status}
                                onChange={e => { setStatus(e.target.value); applyFilters(); }}
                            >
                                <option value="" disabled>Select Status</option>
                                <option value="Active">Active</option>
                                <option value="Inactive">Inactive</option>
                            </select> */}
                        </div>
                        <button
                            className="btn btn-primary text-sm btn-sm px-12 py-12 radius-8 d-flex align-items-center gap-2" data-bs-toggle="modal" data-bs-target="#addCustomerModal"
                        >
                            <Icon
                                icon="ic:baseline-plus"
                                className="icon text-xl line-height-1"
                            />
                            Add New Customer
                        </button>
                    </div>
                    <div className="card-body p-24">
                        <div className="table-responsive scroll-sm">
                            <table className="table bordered-table sm-table mb-0">
                                <thead>
                                    <tr>
                                        <th><div className="d-flex align-items-center gap-10"><input type="checkbox" className="form-check-input radius-4" /> S.L</div></th>
                                        <th>Visit Date</th>
                                        <th>Name</th>
                                        <th>Email</th>
                                        <th>Phone</th>
                                        <th>Working Group</th>
                                        <th className="text-center">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {customers && customers.data.length === 0 ? (
                                        <tr>
                                            <td colSpan="7" className="text-center">No walk-in customers found.</td>
                                        </tr>
                                    ) : (
                                        customers.data.map((cust, idx) => (
                                            <tr key={cust.id}>
                                                <td>
                                                    <div className="d-flex align-items-center gap-10">
                                                        <input type="checkbox" className="form-check-input radius-4" />
                                                        {(customers.from + idx)}
                                                    </div>
                                                </td>
                                                <td>{new Date(cust.visit_date).toLocaleDateString()}</td>
                                                <td>{cust.full_name}</td>
                                                <td>{cust.email}</td>
                                                <td>{cust.phone_number}</td>
                                                <td>{cust.working_group ? cust.working_group.name : '—'}</td>
                                                <td className="text-center">
                                                    <div className="d-flex justify-content-center gap-2">
                                                        <button
                                                            className="bg-info-focus text-info-600 w-40-px h-40-px d-flex justify-content-center align-items-center rounded-circle"
                                                            data-bs-toggle="modal"
                                                            data-bs-target="#viewCustomerModal"
                                                            onClick={() => openViewCustomerModal(cust)}
                                                        >
                                                            <Icon icon="majesticons:eye-line" className="icon text-xl" />
                                                        </button>

                                                        <button
                                                            onClick={() => openEditModal(cust)}
                                                            className="bg-success-focus text-success-600 w-40-px h-40-px d-flex justify-content-center align-items-center rounded-circle"
                                                            data-bs-toggle="modal"
                                                            data-bs-target="#editCustomerModal"
                                                        >
                                                            <Icon icon="lucide:edit" className="menu-icon" />
                                                        </button>

                                                        <button
                                                            className="bg-danger-focus text-danger-600 w-40-px h-40-px d-flex justify-content-center align-items-center rounded-circle"
                                                            data-bs-toggle="modal"
                                                            data-bs-target="#deleteCustomerModal"
                                                            onClick={() => openDeleteModal(cust.id)}
                                                        >
                                                            <Icon icon="fluent:delete-24-regular" className="menu-icon" />
                                                        </button>

                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>


                        <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mt-24">
                            <span>Showing {customers.from} to {customers.to} of {customers.total} entries</span>
                            <ul className="pagination d-flex flex-wrap align-items-center gap-2 justify-content-center">
                                {customers && customers.last_page > 1 && (
                                    <li className="page-item">
                                        <Link
                                            className="page-link bg-neutral-200 text-secondary-light fw-semibold radius-8 border-0 d-flex align-items-center justify-content-center h-32-px w-32-px text-md"
                                            href={customers.prev_page_url}
                                        >
                                            <Icon icon="ep:d-arrow-left" />
                                        </Link>
                                    </li>
                                )}
                                {Array.from({ length: customers.last_page }, (_, i) => i + 1).map((page) => (
                                    <li className="page-item" key={page}>
                                        <Link
                                            className={`page-link fw-semibold radius-8 border-0 d-flex align-items-center justify-content-center h-32-px w-32-px text-md ${page === customers.current_page
                                                ? "bg-primary-600 text-white"
                                                : "bg-neutral-200 text-secondary-light"
                                                }`}
                                            href={`?page=${page}`}
                                        >
                                            {page}
                                        </Link>
                                    </li>
                                ))}
                                {customers.current_page < customers.last_page && (
                                    <li className="page-item">
                                        <Link
                                            className="page-link bg-neutral-200 text-secondary-light fw-semibold radius-8 border-0 d-flex align-items-center justify-content-center h-32-px w-32-px text-md"
                                            href={customers.next_page_url}
                                        >
                                            <Icon icon="ep:d-arrow-right" />
                                        </Link>
                                    </li>
                                )}
                            </ul>
                        </div>
                    </div>
                </div>

                <div
                    className="modal fade"
                    id="addCustomerModal"
                    tabIndex={-1}
                    aria-labelledby="addCustomerModallabel"
                    aria-hidden="true"
                >
                    <div className="modal-dialog modal-lg modal-dialog-centered">
                        <div className="modal-content radius-16 bg-base">
                            <div className="modal-header py-16 px-24 border-0">
                                <h5
                                    className="modal-title tw-font-semibold tw-text-gray-500"
                                    id="addCustomerModallabel"
                                >
                                    Add New Customer
                                </h5>
                                <button
                                    type="button"
                                    className="btn-close"
                                    data-bs-dismiss="modal"
                                    aria-label="Close"
                                />
                            </div>

                            <form onSubmit={submitAdd}>
                                <div className="modal-body p-24">
                                    {Object.keys(addErrors).length > 0 && (
                                        <div className="alert alert-danger mb-4">
                                            <ul className="mb-0">
                                                {Object.values(addErrors).map((err, i) => (
                                                    <li key={i}>{err}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}

                                    {/* Full Name */}
                                    <div className="mb-3">
                                        <label className="form-label">Full Name</label>
                                        <input
                                            name="full_name"
                                            type="text"
                                            className="form-control"
                                            value={addForm.full_name}
                                            onChange={handleAddChange}
                                        />
                                    </div>

                                    {/* Phone Number */}
                                    <div className="mb-3">
                                        <label className="form-label">Phone Number</label>
                                        <input
                                            name="phone_number"
                                            type="text"
                                            className="form-control"
                                            value={addForm.phone_number}
                                            onChange={handleAddChange}
                                        />
                                    </div>

                                    {/* Email */}
                                    <div className="mb-3">
                                        <label className="form-label">Email (optional)</label>
                                        <input
                                            name="email"
                                            type="email"
                                            className="form-control"
                                            value={addForm.email}
                                            onChange={handleAddChange}
                                        />
                                    </div>

                                    {/* Address */}
                                    <div className="mb-3">
                                        <label className="form-label">Address (optional)</label>
                                        <textarea
                                            name="address"
                                            className="form-control"
                                            rows="2"
                                            value={addForm.address}
                                            onChange={handleAddChange}
                                        />
                                    </div>

                                    {/* Notes */}
                                    <div className="mb-3">
                                        <label className="form-label">Notes (optional)</label>
                                        <textarea
                                            name="notes"
                                            className="form-control"
                                            rows="2"
                                            value={addForm.notes}
                                            onChange={handleAddChange}
                                        />
                                    </div>

                                    {/* Visit Date */}
                                    <div className="mb-3">
                                        <label className="form-label">Visit Date</label>
                                        <input
                                            name="visit_date"
                                            type="date"
                                            className="form-control"
                                            value={addForm.visit_date}
                                            onChange={handleAddChange}
                                        />
                                    </div>

                                    {/* Working Group */}
                                    <div className="mb-3">
                                        <label className="form-label">Working Group</label>
                                        <select
                                            name="working_group_id"
                                            className="form-select"
                                            value={addForm.working_group_id}
                                            onChange={handleAddChange}
                                        >
                                            {/* <option value="">Public</option> */}
                                            {workingGroups.map(wg => (
                                                <option key={wg.id} value={wg.id}>
                                                    {wg.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="modal-footer d-flex justify-content-end">
                                    {loading ? (
                                        <div className="spinner-border text-primary" role="status">
                                            <span className="visually-hidden">Loading...</span>
                                        </div>
                                    ) : (
                                        <>
                                            <button
                                                type="button"
                                                className="btn btn-secondary"
                                                data-bs-dismiss="modal"
                                            >
                                                Close
                                            </button>
                                            <button type="submit" className="btn btn-primary">
                                                Save Customer
                                            </button>
                                        </>
                                    )}
                                </div>
                            </form>
                        </div>
                    </div>
                </div>

                <div
                    className="modal fade"
                    id="viewCustomerModal"
                    tabIndex={-1}
                    aria-labelledby="viewCustomerModallabel"
                    aria-hidden="true"
                >
                    <div className="modal-dialog modal-lg modal-dialog-centered">
                        <div className="modal-content radius-16 bg-base">
                            <div className="modal-header py-16 px-24 border-0">
                                <h5
                                    className="modal-title tw-font-semibold tw-text-gray-500"
                                    id="viewCustomerModallabel"
                                >
                                    View Customer
                                </h5>
                                <button
                                    type="button"
                                    className="btn-close"
                                    data-bs-dismiss="modal"
                                    aria-label="Close"
                                />
                            </div>

                            <div className="modal-body p-24">
                                {viewCustomer && (
                                    <>
                                        <h6>Full Name: {viewCustomer.full_name}</h6>
                                        <p>Email: {viewCustomer.email}</p>
                                        <p>Phone: {viewCustomer.phone_number}</p>
                                        <p>Address: {viewCustomer.address}</p>
                                        <p>Notes: {viewCustomer.notes}</p>
                                        <p>Visit Date: {new Date(viewCustomer.visit_date).toLocaleDateString()}</p>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Edit Customer Modal */}
                <div className="modal fade" id="editCustomerModal" tabIndex={-1} aria-labelledby="editCustomerModallabel" aria-hidden="true">
                    <div className="modal-dialog modal-lg modal-dialog-centered">
                        <div className="modal-content radius-16 bg-base">
                            <div className="modal-header py-16 px-24 border-0">
                                <h5 className="modal-title" id="editCustomerModallabel">Edit Customer</h5>
                                <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close" />
                            </div>

                            {/* Edit form */}
                            <form onSubmit={submitEdit}>
                                <div className="modal-body p-24">
                                    {Object.keys(editErrors).length > 0 && (
                                        <div className="alert alert-danger mb-4">
                                            <ul className="mb-0">
                                                {Object.values(editErrors).map((err, i) => (
                                                    <li key={i}>{err}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}

                                    {/* Full Name */}
                                    <div className="mb-3">
                                        <label className="form-label">Full Name</label>
                                        <input
                                            name="full_name"
                                            type="text"
                                            className="form-control"
                                            value={editForm.full_name}
                                            onChange={handleEditChange}
                                        />
                                    </div>

                                    {/* Phone Number */}
                                    <div className="mb-3">
                                        <label className="form-label">Phone Number</label>
                                        <input
                                            name="phone_number"
                                            type="text"
                                            className="form-control"
                                            value={editForm.phone_number}
                                            onChange={handleEditChange}
                                        />
                                    </div>

                                    {/* Email */}
                                    <div className="mb-3">
                                        <label className="form-label">Email (optional)</label>
                                        <input
                                            name="email"
                                            type="email"
                                            className="form-control"
                                            value={editForm.email}
                                            onChange={handleEditChange}
                                        />
                                    </div>

                                    {/* Address */}
                                    <div className="mb-3">
                                        <label className="form-label">Address (optional)</label>
                                        <textarea
                                            name="address"
                                            className="form-control"
                                            rows="2"
                                            value={editForm.address}
                                            onChange={handleEditChange}
                                        />
                                    </div>

                                    {/* Notes */}
                                    <div className="mb-3">
                                        <label className="form-label">Notes (optional)</label>
                                        <textarea
                                            name="notes"
                                            className="form-control"
                                            rows="2"
                                            value={editForm.notes}
                                            onChange={handleEditChange}
                                        />
                                    </div>

                                    {/* Visit Date */}
                                    <div className="mb-3">
                                        <label className="form-label">Visit Date</label>
                                        <input
                                            name="visit_date"
                                            type="date"
                                            className="form-control"
                                            value={editForm.visit_date}
                                            onChange={handleEditChange}
                                        />
                                    </div>

                                    {/* Working Group */}
                                    <div className="mb-3">
                                        <label className="form-label">Working Group</label>
                                        <select
                                            name="working_group_id"
                                            className="form-select"
                                            value={editForm.working_group_id}
                                            onChange={handleEditChange}
                                        >
                                            {/* <option value="">Public</option> */}
                                            {workingGroups.map((wg) => (
                                                <option key={wg.id} value={wg.id}>
                                                    {wg.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="modal-footer d-flex justify-content-end">
                                    {editloading ? (
                                        <div className="spinner-border text-primary" role="status">
                                            <span className="visually-hidden">Loading...</span>
                                        </div>
                                    ) : (
                                        <>
                                            <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">
                                                Close
                                            </button>
                                            <button type="submit" className="btn btn-primary">
                                                Save Changes
                                            </button>
                                        </>
                                    )}
                                </div>
                            </form>
                        </div>
                    </div>
                </div>

                {/* Delete Confirmation Modal */}
                <div
                    className="modal fade"
                    id="deleteCustomerModal"
                    tabIndex={-1}
                    aria-labelledby="deleteCustomerModalLabel"
                    aria-hidden="true"
                >
                    <div className="modal-dialog">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h1 className="modal-title fs-5 text-red-500" id="deleteCustomerModalLabel">
                                    Are you sure?
                                </h1>
                                <button type="button" className="btn-close" data-bs-dismiss="modal"></button>
                            </div>
                            <div className="modal-body font-light">
                                <p>
                                    Do you really want to delete this customer? This process cannot be undone.
                                </p>
                            </div>
                            <div className="modal-footer">
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    data-bs-dismiss="modal"
                                >
                                    Close
                                </button>
                                <button
                                    type="button"
                                    className="btn btn-outline-danger"
                                    onClick={confirmDelete}
                                    disabled={deleteLoading}
                                >
                                    {deleteLoading
                                        ? <span className="spinner-border spinner-border-sm" role="status"></span>
                                        : "Delete Customer"}
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

export default DailyCustomers;
