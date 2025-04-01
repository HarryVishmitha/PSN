import React, { useState, useEffect } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AdminHeader from '../../Components/AdminHeader';
import AdminNav from '@/Components/AdminNav';
import CookiesV from '@/Components/CookieConsent';
import { Icon } from "@iconify/react";
import AdminDashboard from '../../Layouts/AdminDashboard';
import Breadcrumb from "@/components/Breadcrumb";
import Alert from "@/Components/Alert";
import Meta from '@/Components/Metaheads';

const Users = ({ users, userDetails, status: selectedStatus, workingGroups }) => {
    const queryParams = new URLSearchParams(window.location.search);
    const initialPerPage = queryParams.get('perPage') || 10;
    const [perPage, setPerPage] = useState(initialPerPage);
    const [search, setSearch] = useState('');
    const [status, setStatus] = useState(selectedStatus || '');
    const [selectedUserId, setSelectedUserId] = useState(null);
    const [selectedUser, setSelectedUser] = useState(null);
    const [selectedWorkingGroup, setSelectedWorkingGroup] = useState('');
    const [selectedStatusModal, setSelectedStatusModal] = useState('');
    const [alert, setAlert] = useState(null); // { type: 'success'|'danger', message: string }
    const [showUserModal, setShowUserModal] = useState(false);

    // Loading states for asynchronous actions
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [updateLoading, setUpdateLoading] = useState(false);

    // When the selected user changes, update the modal inputs
    useEffect(() => {
        if (selectedUser) {
            setSelectedWorkingGroup(selectedUser.working_group_id || '');
            setSelectedStatusModal(selectedUser.status || '');
        }
    }, [selectedUser]);

    // Handle table header changes
    const handlePerPageChange = (event) => {
        const value = event.target.value;
        setPerPage(value);
        router.visit(`${users.path}?page=${users.current_page}&perPage=${value}&status=${status}`);
    };

    const handleSearchChange = (event) => {
        setSearch(event.target.value);
        // Optionally, add search filtering logic here.
    };

    const handleStatusChange = (event) => {
        const value = event.target.value;
        setStatus(value);
        router.visit(`${users.path}?page=${users.current_page}&perPage=${perPage}&status=${value}`);
    };

    useEffect(() => {
        const queryParams = new URLSearchParams(window.location.search);
        const pagePerPage = queryParams.get('perPage');
        const pageStatus = queryParams.get('status');
        if (pagePerPage) setPerPage(pagePerPage);
        if (pageStatus) setStatus(pageStatus);
    }, [users.path]);

    // Modal handling: set selected user and let Bootstrap trigger the modal
    const handleViewUser = (user) => {
        setSelectedUser(user);
    };

    // Enhanced delete function: after deletion, if the current page becomes empty and it's not the first page,
    // redirect the admin to the previous page.
    const handleuserDelete = (userID) => {
        if (window.confirm("Are you sure you want to delete this user? This process cannot be undone.")) {
            setDeleteLoading(true);
            router.delete(`/admin/api/users/${userID}`, {
                preserveState: true,
                onSuccess: () => {
                    // Check if current page only had one record and it's not the first page.
                    if (users.data.length === 1 && users.current_page > 1) {
                        router.visit(`${users.path}?page=${users.current_page - 1}&perPage=${perPage}&status=${status}`);
                    } else {
                        setAlert({ type: "success", message: "User deleted successfully." });
                    }
                },
                onError: () => {
                    setAlert({ type: "danger", message: "Failed to delete user. Please try again later." });
                },
                onFinish: () => {
                    setDeleteLoading(false);
                }
            });
        }
    };

    const handleuserSuspension = (userID) => {
        // Implement user suspension logic here
    };

    const openDeleteModal = (userID) => {
        setSelectedUserId(userID);
    };

    // Combined update function: update working group then update status
    const updateUserInfo = (userId) => {
        setUpdateLoading(true);
        router.patch(`/admin/api/users/${userId}/assign-working-group`,
            { working_group_id: selectedWorkingGroup },
            {
                preserveState: true,
                onSuccess: () => {
                    router.patch(`/admin/api/users/${userId}/update-status`,
                        { status: selectedStatusModal },
                        {
                            preserveState: true,
                            onSuccess: () => {
                                setAlert({ type: "success", message: "User info updated successfully." });
                            },
                            onError: () => {
                                setAlert({ type: "danger", message: "Failed to update user status." });
                            },
                            onFinish: () => {
                                setUpdateLoading(false);
                            }
                        }
                    );
                },
                onError: () => {
                    setAlert({ type: "danger", message: "Failed to update working group." });
                    setUpdateLoading(false);
                }
            }
        );
    };

    return (
        <>
            <Head title="Users - Admin" />
            <Meta title='Users - Admin' description='Manage users, view details, and update information.' />
            <AdminDashboard userDetails={userDetails}>
                <Breadcrumb title="All Users" />
                {/* Display Alert if any */}
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
                                <option value="" disabled>Select Status</option>
                                <option value="Active">Active</option>
                                <option value="Inactive">Inactive</option>
                                <option value="Suspended">Suspended</option>
                            </select>
                        </div>
                        {/* Uncomment if needed */}
                        {/* <Link
              to="/add-user"
              className="btn btn-primary text-sm btn-sm px-12 py-12 radius-8 d-flex align-items-center gap-2"
            >
              <Icon icon="ic:baseline-plus" className="icon text-xl line-height-1" />
              Add New User
            </Link> */}
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
                                        <th scope="col">Join Date</th>
                                        <th scope="col">Name</th>
                                        <th scope="col">Email</th>
                                        <th scope="col">Role</th>
                                        <th scope="col">Working Group</th>
                                        <th scope="col">Phone Number</th>
                                        <th scope="col" className="text-center">Status</th>
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
                                                    {index + 1}
                                                </div>
                                            </td>
                                            <td>{new Date(user.created_at).toLocaleDateString()}</td>
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
                                            <td>
                                                <span className="text-md mb-0 fw-normal text-secondary-light">{user.email}</span>
                                            </td>
                                            <td>
                                                <span className="text-md mb-0 fw-normal text-secondary-light tw-capitalize">{user.role.name}</span>
                                            </td>
                                            <td>
                                                <span className="text-md mb-0 fw-normal text-secondary-light tw-capitalize">
                                                    {user.working_group && user.working_group.name ? user.working_group.name : 'Public'}
                                                </span>
                                            </td>
                                            <td>
                                                <span className="text-md mb-0 fw-normal text-secondary-light">{user.phone_number}</span>
                                            </td>
                                            <td className="text-center">
                                                <span className={`bg-${user.status === 'active' ? 'success' : user.status === 'inactive' ? 'warning' : 'danger'}-focus text-${user.status === 'active' ? 'success' : user.status === 'inactive' ? 'warning' : 'danger'}-600 border border-${user.status === 'active' ? 'success' : user.status === 'inactive' ? 'warning' : 'danger'}-main px-24 py-4 radius-4 fw-medium text-sm tw-capitalize`}>
                                                    {user.status}
                                                </span>
                                            </td>
                                            <td className="text-center">
                                                <div className="d-flex align-items-center gap-10 justify-content-center">
                                                    {/* Trigger Bootstrap modal for view/update */}
                                                    <button
                                                        type="button"
                                                        className="bg-info-focus bg-hover-info-200 text-info-600 fw-medium w-40-px h-40-px d-flex justify-content-center align-items-center rounded-circle"
                                                        data-bs-toggle="modal"
                                                        data-bs-target="#viewUserModal"
                                                        onClick={() => handleViewUser(user)}
                                                    >
                                                        <Icon icon="majesticons:eye-line" className="icon text-xl" />
                                                    </button>
                                                    <Link href={`/admin/edit-user/${user.id}`}>
                                                        <button
                                                            type="button"
                                                            className="bg-success-focus text-success-600 bg-hover-success-200 fw-medium w-40-px h-40-px d-flex justify-content-center align-items-center rounded-circle"
                                                        >
                                                            <Icon icon="lucide:edit" className="menu-icon" />
                                                        </button>
                                                    </Link>
                                                    <button
                                                        type="button"
                                                        className="remove-item-btn bg-danger-focus bg-hover-danger-200 text-danger-600 fw-medium w-40-px h-40-px d-flex justify-content-center align-items-center rounded-circle"
                                                        data-bs-toggle="modal"
                                                        data-bs-target="#deleteModal"
                                                        onClick={() => openDeleteModal(user.id)}
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
                        <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mt-24">
                            <span>Showing {users.from} to {users.to} of {users.total} entries</span>
                            <ul className="pagination d-flex flex-wrap align-items-center gap-2 justify-content-center">
                                <li className={`page-item ${!users.prev_page_url ? 'disabled' : ''}`}>
                                    <Link
                                        className="page-link bg-neutral-200 text-secondary-light fw-semibold radius-8 border-0 d-flex align-items-center justify-content-center h-32-px text-md"
                                        to={users.prev_page_url || '#'}
                                    >
                                        <Icon icon="ep:d-arrow-left" className="" />
                                    </Link>
                                </li>
                                {Array.from({ length: users.last_page }, (_, i) => i + 1).map(page => (
                                    <li key={page} className={`page-item ${page === users.current_page ? 'active' : ''}`}>
                                        <Link
                                            className="page-link text-secondary-light fw-semibold radius-8 border-0 d-flex align-items-center justify-content-center h-32-px w-32-px"
                                            to={`${users.path}?page=${page}`}
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
                                        <Icon icon="ep:d-arrow-right" className="" />
                                    </Link>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Bootstrap View User Modal */}
                <div className="modal fade" id="viewUserModal" tabIndex="-1" aria-labelledby="viewUserModalLabel" aria-hidden="true">
                    <div className="modal-dialog modal-lg modal-dialog-centered">
                        <div className="modal-content">
                            <div className="modal-header border-0">
                                <h5 className="modal-title" id="viewUserModalLabel">User Details</h5>
                                <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close" onClick={() => setSelectedUser(null)}></button>
                            </div>
                            <div className="modal-body">
                                {selectedUser ? (
                                    <div>
                                        <div className="text-center mb-4">
                                            <img
                                                src={selectedUser.profile_picture || '/assets/images/user.png'}
                                                alt={`Profile of ${selectedUser.name}`}
                                                className="border br-white border-width-2-px w-200-px h-200-px rounded-circle object-fit-cover mx-auto"
                                            />
                                            <h2 className="mt-4 text-2xl font-bold">{selectedUser.name}</h2>
                                            <p className="text-secondary-light">{selectedUser.email}</p>
                                        </div>
                                        <div className="mb-4">
                                            <h3 className="text-xl font-semibold mb-1 text-blue-700">Personal Info</h3>
                                            <ul className="list-unstyled">
                                                <li><strong>Full Name:</strong> {selectedUser.name}</li>
                                                <li><strong>Email:</strong> {selectedUser.email}</li>
                                                <li><strong>Phone Number:</strong> {selectedUser.phone_number || 'Not Set'}</li>
                                                <li><strong>Account:</strong> {selectedUser.role?.name}</li>
                                                <li><strong>Working Group:</strong> {selectedUser.working_group && selectedUser.working_group.name ? selectedUser.working_group.name : 'Public'}</li>
                                            </ul>
                                        </div>
                                        {/* Combined Update Section */}
                                        <hr className="my-3" />
                                        <div>
                                            <h3 className="text-xl font-semibold mb-1 text-red-700">Update User Info</h3>
                                            <div className="row g-3">
                                                <div className="col-md-6">
                                                    <label className="form-label">Working Group</label>
                                                    <select
                                                        value={selectedWorkingGroup}
                                                        onChange={(e) => setSelectedWorkingGroup(e.target.value)}
                                                        className="form-select"
                                                    >
                                                        <option value="">Public</option>
                                                        {workingGroups.map((group) => (
                                                            <option key={group.id} value={group.id}>
                                                                {group.name}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>
                                                <div className="col-md-6">
                                                    <label className="form-label">Status</label>
                                                    <select
                                                        value={selectedStatusModal}
                                                        onChange={(e) => setSelectedStatusModal(e.target.value)}
                                                        className="form-select"
                                                    >
                                                        <option value="active">Active</option>
                                                        <option value="inactive">Inactive</option>
                                                        <option value="suspended">Suspended</option>
                                                    </select>
                                                </div>
                                            </div>
                                            <div className="mt-3 text-end">
                                                <button
                                                    className="btn btn-primary"
                                                    onClick={() => updateUserInfo(selectedUser.id)}
                                                    disabled={updateLoading}
                                                >
                                                    {updateLoading ? (
                                                        <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                                                    ) : (
                                                        "Update"
                                                    )}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-center">Loading...</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Delete Modal (Bootstrap) */}
                <div className="modal fade" id="deleteModal" tabIndex="-1" aria-labelledby="deleteModalLabel" aria-hidden="true">
                    <div className="modal-dialog">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h1 className="modal-title fs-5 text-red-500" id="deleteconfirmLabel">Are you sure?</h1>
                                <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                            </div>
                            <div className="modal-body font-light">
                                <p>Do you really want to delete this user? This process cannot be undone.</p>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                                <button
                                    type="button"
                                    className="btn btn-outline-danger"
                                    onClick={() => handleuserDelete(selectedUserId)}
                                    disabled={deleteLoading}
                                >
                                    {deleteLoading ? (
                                        <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                                    ) : (
                                        "Delete User"
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

export default Users;
