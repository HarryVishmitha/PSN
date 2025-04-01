import React, { useState, useEffect } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AdminDashboard from '../../Layouts/AdminDashboard';
import Breadcrumb from "@/components/Breadcrumb";
import { Icon } from "@iconify/react";
import CookiesV from '@/Components/CookieConsent';
import Alert from '@/Components/Alert';
import Meta from '@/Components/Metaheads';

const AssignRole = ({ userDetails, users, roles }) => {
    // Get initial perPage from query params or default to 10
    const queryParams = new URLSearchParams(window.location.search);
    const initialPerPage = queryParams.get('perPage') || 10;
    const [perPage, setPerPage] = useState(initialPerPage);
    const [search, setSearch] = useState('');
    const [status, setStatus] = useState('');
    const [alert, setAlert] = useState(null);
    const [loading, setLoading] = useState(false);

    // Update perPage selection and refresh the data
    const handlePerPageChange = (event) => {
        const value = event.target.value;
        setPerPage(value);
        router.visit(`${users.path}?page=${users.current_page}&perPage=${value}&search=${search}&status=${status}`);
    };

    // Update search state
    const handleSearchChange = (event) => {
        setSearch(event.target.value);
    };

    // Update status filter and refresh the data
    const handleStatusChange = (event) => {
        const value = event.target.value;
        setStatus(value);
        router.visit(`${users.path}?page=${users.current_page}&perPage=${perPage}&status=${value}&search=${search}`);
    };

    // Function to handle role assignment using router.patch, similar to how Users component handles updates
    const handleAssignRole = (userId, roleId) => {
        setLoading(true);
        router.patch(route('admin.storeAssignRole'), { userId, roleId }, {
            preserveState: true,
            onSuccess: () => {
                setAlert({ type: 'success', message: 'User role updated successfully.' });
            },
            onError: () => {
                setAlert({ type: 'danger', message: 'Failed to update user role.' });
            },
            onFinish: () => {
                setLoading(false);
            }
        });
    };

    return (
        <>
            <Head title="Assign Roles - Admin Dashboard" />
            <Meta title='Assign Roles - Admin Dashboard' description='Manage user roles and permissions in the admin dashboard.' />
            <AdminDashboard userDetails={userDetails}>
                <Breadcrumb title="Roles & Access" />
                {alert && <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} />}
                <div className="card h-100 p-0 radius-12">
                    {/* Header Section */}
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
                            <form
                                className="navbar-search"
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    router.visit(`${users.path}?page=${users.current_page}&perPage=${perPage}&search=${search}&status=${status}`);
                                }}
                            >
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
                                    Status
                                </option>
                                <option value="Active">Active</option>
                                <option value="Inactive">Inactive</option>
                            </select>
                        </div>
                    </div>

                    {/* Table Section */}
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
                                        <th scope="col">Username</th>
                                        <th scope="col" className="text-center">Current Role</th>
                                        <th scope="col" className="text-center">Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {users.data.map((user, index) => (
                                        <tr key={user.id}>
                                            <td>
                                                <div className="d-flex align-items-center gap-10">
                                                    <div className="form-check style-check d-flex align-items-center">
                                                        <input
                                                            className="form-check-input radius-4 border border-neutral-400"
                                                            type="checkbox"
                                                            name="checkbox"
                                                        />
                                                    </div>
                                                    {index + 1 < 10 ? `0${index + 1}` : index + 1}
                                                </div>
                                            </td>
                                            <td>
                                                <div className="d-flex align-items-center">
                                                    <img
                                                        src={user.profile_picture || '/assets/images/user.png'}
                                                        alt={user.name}
                                                        className="w-40-px h-40-px rounded-circle flex-shrink-0 me-12 overflow-hidden"
                                                    />
                                                    <div className="flex-grow-1">
                                                        <span className="text-md mb-0 fw-normal text-secondary-light">{user.name}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="text-center tw-capitalize">{user.role.name}</td>
                                            <td className="text-center">
                                                <div className="dropdown">
                                                    <button
                                                        className="btn btn-outline-primary-600 not-active px-18 py-11 dropdown-toggle toggle-icon"
                                                        type="button"
                                                        data-bs-toggle="dropdown"
                                                        aria-expanded="false"
                                                    >
                                                        {loading ? 'Updating...' : 'Assign Role'}
                                                    </button>
                                                    <ul className="dropdown-menu">
                                                        {roles.map((role) => (
                                                            <li key={role.id}>
                                                                <button
                                                                    className="dropdown-item text-secondary-light tw-capitalize"
                                                                    onClick={() => handleAssignRole(user.id, role.id)}
                                                                    disabled={loading}
                                                                >
                                                                    {role.name}
                                                                </button>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination Section */}
                        <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mt-24">
                            <span>
                                Showing {users.from} to {users.to} of {users.total} entries
                            </span>
                            <ul className="pagination d-flex flex-wrap align-items-center gap-2 justify-content-center">
                                <li className={`page-item ${!users.prev_page_url ? 'disabled' : ''}`}>
                                    <Link
                                        className="page-link bg-neutral-200 text-secondary-light fw-semibold radius-8 border-0 d-flex align-items-center justify-content-center h-32-px text-md"
                                        to={users.prev_page_url || '#'}
                                    >
                                        <Icon icon="ep:d-arrow-left" />
                                    </Link>
                                </li>
                                {Array.from({ length: users.last_page }, (_, i) => i + 1).map((page) => (
                                    <li key={page} className={`page-item ${page === users.current_page ? 'active' : ''}`}>
                                        <Link
                                            className="page-link text-secondary-light fw-semibold radius-8 border-0 d-flex align-items-center justify-content-center h-32-px w-32-px"
                                            to={`${users.path}?page=${page}&perPage=${perPage}&search=${search}&status=${status}`}
                                        >
                                            {page}
                                        </Link>
                                    </li>
                                ))}
                                <li className={`page-item ${!users.next_page_url ? 'disabled' : ''}`}>
                                    <Link
                                        className="page-link bg-neutral-200 text-secondary-light fw-semibold radius-8 border-0 d-flex align-items-center justify-content-center h-32-px text-md"
                                        to={users.next_page_url || '#'}
                                    >
                                        <Icon icon="ep:d-arrow-right" />
                                    </Link>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </AdminDashboard>
            <CookiesV />
        </>
    );
};

export default AssignRole;
