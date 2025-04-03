import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AdminDashboard from '../../Layouts/AdminDashboard';
import Breadcrumb from "@/components/Breadcrumb";
import CookiesV from '@/Components/CookieConsent';
import Meta from '@/Components/Metaheads';
import { Icon } from "@iconify/react";
import Alert from "@/Components/Alert";

const Inventory = ({ userDetails, inventory, rolls }) => {
    const [showCount, setShowCount] = useState("10");
    const [searchTerm, setSearchTerm] = useState("");
    const [inventoryType, setInventoryType] = useState("all");

    // If using Laravel paginator, the data might be in the "data" field.
    const inventoryItems = inventory?.data ? inventory.data : inventory;
    const rollsItems = rolls?.data ? rolls.data : rolls;

    // Helper to update the query parameters via Inertia router.
    const updateQuery = (params) => {
        router.get(window.location.pathname, params, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleShowCountChange = (e) => {
        const value = e.target.value;
        setShowCount(value);
        updateQuery({ show: value, search: searchTerm, inventoryType });
    };

    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
    };

    const handleInventoryTypeChange = (e) => {
        const value = e.target.value;
        setInventoryType(value);
        updateQuery({ inventoryType: value, search: searchTerm, show: showCount });
    };

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        updateQuery({ search: searchTerm, show: showCount, inventoryType });
    };

    return (
        <>
            <Head title="Inventory - Admin" />
            <Meta
                title="Inventory - Admin"
                description="Manage inventory, view details, and update information."
            />
            <AdminDashboard userDetails={userDetails}>
                <Breadcrumb title="Inventory" />
                <div className="card h-100 p-0 radius-12">
                    <div className="card-header border-bottom bg-base py-16 px-24 d-flex align-items-center flex-wrap gap-3 justify-content-between">
                        <div className="d-flex align-items-center flex-wrap gap-3">
                            <span className="text-md fw-medium text-secondary-light mb-0">Show</span>
                            <select
                                className="form-select form-select-sm w-auto ps-12 py-6 radius-12 h-40-px"
                                value={showCount}
                                onChange={handleShowCountChange}
                            >
                                <option value="Select Number" disabled>
                                    Select Number
                                </option>
                                <option value="10">10</option>
                                <option value="25">25</option>
                                <option value="50">50</option>
                                <option value="75">75</option>
                                <option value="100">100</option>
                                <option value="200">200</option>
                            </select>
                            <form className="navbar-search" onSubmit={handleSearchSubmit}>
                                <input
                                    type="text"
                                    className="bg-base h-40-px w-auto"
                                    name="search"
                                    placeholder="Search"
                                    value={searchTerm}
                                    onChange={handleSearchChange}
                                />
                                <Icon icon="ion:search-outline" className="icon" />
                            </form>
                            <select
                                className="form-select form-select-sm w-auto ps-12 py-6 radius-12 h-40-px"
                                value={inventoryType}
                                onChange={handleInventoryTypeChange}
                            >
                                <option value="Select inventory type" disabled>
                                    Select inventory type
                                </option>
                                <option value="all">All</option>
                                <option value="rolls">Rolls</option>
                                <option value="other">Other Inventory</option>
                            </select>
                        </div>
                        <button
                            type="button"
                            className="btn btn-primary text-sm btn-sm px-12 py-12 radius-8 d-flex align-items-center gap-2"
                            data-bs-toggle="modal"
                            data-bs-target="#addnewRoll"
                        >
                            <Icon
                                icon="ic:baseline-plus"
                                className="icon text-xl line-height-1"
                            />
                            Add New Roll
                        </button>
                    </div>
                    <div className="card-body p-24">
                        {/* Render Rolls table if inventory type is "all" or "rolls" */}
                        {(inventoryType === "all" || inventoryType === "rolls") && (
                            <div className="table-responsive scroll-sm">
                                <div className="tw-font-medium tw-mb-3 tw-text-2xl tw-to-black">Rolls</div>
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
                                                            id="selectAllRolls"
                                                        />
                                                    </div>
                                                    Roll ID
                                                </div>
                                            </th>
                                            <th scope="col">Provider</th>
                                            <th scope="col">Roll type</th>
                                            <th scope="col">Roll size name</th>
                                            <th scope="col">Fixed Width</th>
                                            <th scope="col">Height</th>
                                            <th scope="col">Price per Sq. Ft. LKR</th>
                                            <th scope="col" className="text-center">Last Updated</th>
                                            <th scope="col" className="text-center">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {rollsItems && rollsItems.length > 0 ? (
                                            rollsItems.map((roll) => (
                                                <tr key={roll.id}>
                                                    <td>
                                                        <div className="d-flex align-items-center gap-10">
                                                            <div className="form-check style-check d-flex align-items-center">
                                                                <input
                                                                    className="form-check-input radius-4 border input-form-dark"
                                                                    type="checkbox"
                                                                    name="checkbox"
                                                                    id={`rollCheckbox-${roll.id}`}
                                                                />
                                                            </div>
                                                            {roll.id}
                                                        </div>
                                                    </td>
                                                    <td>{roll.provider?.name || 'N/A'}</td>
                                                    <td>{roll.roll_type || 'N/A'}</td>
                                                    <td>{roll.roll_size || 'N/A'}</td>
                                                    <td>{roll.roll_width || '-'}</td>
                                                    <td>{roll.roll_height || '-'}</td>
                                                    <td>{roll.price_rate_per_sqft || '-'}</td>
                                                    <td className="text-center">{roll.updated_at}</td>
                                                    <td className="text-center">
                                                        <div className="d-flex align-items-center gap-10 justify-content-center">
                                                            <button
                                                                type="button"
                                                                className="bg-info-focus bg-hover-info-200 text-info-600 fw-medium w-40-px h-40-px d-flex justify-content-center align-items-center rounded-circle"
                                                            >
                                                                <Icon icon="majesticons:eye-line" className="icon text-xl" />
                                                            </button>
                                                            <button
                                                                type="button"
                                                                className="bg-success-focus text-success-600 bg-hover-success-200 fw-medium w-40-px h-40-px d-flex justify-content-center align-items-center rounded-circle"
                                                            >
                                                                <Icon icon="lucide:edit" className="menu-icon" />
                                                            </button>
                                                            <button
                                                                type="button"
                                                                className="remove-item-btn bg-danger-focus bg-hover-danger-200 text-danger-600 fw-medium w-40-px h-40-px d-flex justify-content-center align-items-center rounded-circle"
                                                            >
                                                                <Icon icon="fluent:delete-24-regular" className="menu-icon" />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan="9" className="text-center">No Rolls found.</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}
                        {/* Render Others table if inventory type is "all" or "other" */}
                        {(inventoryType === "all" || inventoryType === "other") && (
                            <>
                                <div className="table-responsive scroll-sm tw-mt-8">
                                    <div className="tw-font-medium tw-mb-3 tw-text-2xl tw-to-black">Others</div>
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
                                                                id="selectAllOthers"
                                                            />
                                                        </div>
                                                        Item ID
                                                    </div>
                                                </th>
                                                <th scope="col">Provider</th>
                                                <th scope="col">Quantity</th>
                                                <th scope="col">Reorder Threshold</th>
                                                <th scope="col">Unit Details</th>
                                                <th scope="col" className="text-center">Last Updated</th>
                                                <th scope="col" className="text-center">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {inventoryItems && inventoryItems.length > 0 ? (
                                                inventoryItems.map((item) => (
                                                    <tr key={item.id}>
                                                        <td>
                                                            <div className="d-flex align-items-center gap-10">
                                                                <div className="form-check style-check d-flex align-items-center">
                                                                    <input
                                                                        className="form-check-input radius-4 border input-form-dark"
                                                                        type="checkbox"
                                                                        name="checkbox"
                                                                        id={`otherCheckbox-${item.id}`}
                                                                    />
                                                                </div>
                                                                {item.id}
                                                            </div>
                                                        </td>
                                                        <td>{item.provider?.name || 'N/A'}</td>
                                                        <td>{item.quantity}</td>
                                                        <td>{item.reorder_threshold}</td>
                                                        <td>
                                                            {item.unit_details
                                                                ? JSON.stringify(item.unit_details)
                                                                : '-'
                                                            }
                                                        </td>
                                                        <td className="text-center">{item.updated_at}</td>
                                                        <td className="text-center">
                                                            <div className="d-flex align-items-center gap-10 justify-content-center">
                                                                <button
                                                                    type="button"
                                                                    className="bg-info-focus bg-hover-info-200 text-info-600 fw-medium w-40-px h-40-px d-flex justify-content-center align-items-center rounded-circle"
                                                                >
                                                                    <Icon icon="majesticons:eye-line" className="icon text-xl" />
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    className="bg-success-focus text-success-600 bg-hover-success-200 fw-medium w-40-px h-40-px d-flex justify-content-center align-items-center rounded-circle"
                                                                >
                                                                    <Icon icon="lucide:edit" className="menu-icon" />
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    className="remove-item-btn bg-danger-focus bg-hover-danger-200 text-danger-600 fw-medium w-40-px h-40-px d-flex justify-content-center align-items-center rounded-circle"
                                                                >
                                                                    <Icon icon="fluent:delete-24-regular" className="menu-icon" />
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr>
                                                    <td colSpan="7" className="text-center">No Inventory Items found.</td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </>
                        )}
                        {/* Dynamic Pagination */}
                        {inventory && inventory.last_page > 1 && (
                            <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mt-24">
                                <span>
                                    Showing {inventory.from || 0} to {inventory.to || 0} of {inventory.total || 0} entries
                                </span>
                                <ul className="pagination d-flex flex-wrap align-items-center gap-2 justify-content-center">
                                    {inventory.current_page > 1 && (
                                        <li className="page-item">
                                            <Link
                                                className="page-link bg-neutral-200 text-secondary-light fw-semibold radius-8 border-0 d-flex align-items-center justify-content-center h-32-px text-md"
                                                href={inventory.prev_page_url}
                                            >
                                                <Icon icon="ep:d-arrow-left" />
                                            </Link>
                                        </li>
                                    )}
                                    {Array.from({ length: inventory.last_page }, (_, i) => i + 1).map((page) => (
                                        <li className="page-item" key={page}>
                                            <Link
                                                className={`page-link fw-semibold radius-8 border-0 d-flex align-items-center justify-content-center h-32-px w-32-px text-md ${page === inventory.current_page
                                                    ? "bg-primary-600 text-white"
                                                    : "bg-neutral-200 text-secondary-light"
                                                    }`}
                                                href={`?page=${page}`}
                                            >
                                                {page}
                                            </Link>
                                        </li>
                                    ))}
                                    {inventory.current_page < inventory.last_page && (
                                        <li className="page-item">
                                            <Link
                                                className="page-link bg-neutral-200 text-secondary-light fw-semibold radius-8 border-0 d-flex align-items-center justify-content-center h-32-px text-md"
                                                href={inventory.next_page_url}
                                            >
                                                <Icon icon="ep:d-arrow-right" />
                                            </Link>
                                        </li>
                                    )}
                                </ul>
                            </div>
                        )}
                    </div>
                </div>

                {/* Add New Roll Modal */}
                <div className="modal fade" id="addnewRoll" tabIndex={-1} aria-labelledby="addnewRollLabel" aria-hidden="true">
                    <div className="modal-dialog modal-lg modal-dialog-centered">
                        <div className="modal-content radius-16 bg-base">
                            <div className="modal-header py-16 px-24 border-0">
                                <h5 className="modal-title fs-5" id="addnewRollLabel">
                                    Add New Roll
                                </h5>
                                <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close" />
                            </div>
                            <div className="modal-body p-24">
                                
                            </div>
                        </div>
                    </div>
                </div>
            </AdminDashboard>
            <CookiesV />
        </>
    );
};

export default Inventory;
