import React, { useState, useEffect } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AdminDashboard from '../../Layouts/AdminDashboard';
import Breadcrumb from "@/Components/Breadcrumb";
import CookiesV from '@/Components/CookieConsent';
import Meta from '@/Components/Metaheads';
import { Icon } from "@iconify/react";
import Alert from "@/Components/Alert";
import axios from '@/lib/axios';

const Inventory = ({ userDetails, inventory, rolls, providers }) => {
    // General filters and alerts.
    const [showCount, setShowCount] = useState("10");
    const [searchTerm, setSearchTerm] = useState("");
    const [inventoryType, setInventoryType] = useState("all");
    const [alert, setAlert] = useState(null);

    // New Roll modal state.
    const [newRoll, setNewRoll] = useState({
        provider: '',
        rollType: '',
        rollSize: '',
        rollWidth: '',
        rollHeight: '',
        priceRate: '',
        offcutPrice: ''
    });
    const [newRollLoading, setNewRollLoading] = useState(false);
    const [newRollErrors, setNewRollErrors] = useState({});

    // Edit Roll modal state.
    const [editingRoll, setEditingRoll] = useState(null);
    const [editingRollLoading, setEditingRollLoading] = useState(false);
    const [editingRollErrors, setEditingRollErrors] = useState({});

    // Delete Roll state.
    const [selectedRollId, setSelectedRollId] = useState(null);
    const [deleteRollLoading, setDeleteRollLoading] = useState(false);

    // If using Laravel paginator, data may be in the "data" field.
    const inventoryItems = inventory?.data ? inventory.data : inventory;
    const rollsItems = rolls?.data ? rolls.data : rolls;

    const [bindModalOpen, setBindModalOpen] = useState(false);
    const [bindProductId, setBindProductId] = useState('');
    const [bindRollIds, setBindRollIds] = useState([]); // multi-select rolls
    const [bindDefault, setBindDefault] = useState(null); // selected default roll id
    const [bindBusy, setBindBusy] = useState(false);
    const [productsList, setProductsList] = useState([]);  // from /admin/api/products
    const [bindErrors, setBindErrors] = useState({});

    // Helper to update query parameters.
    const updateQuery = (params) => {
        router.get(window.location.pathname, params, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const formatTimestamp = (timestamp) => {
        const date = new Date(timestamp);
        return date.toLocaleDateString();
    };

    // Filter handlers.
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

    // New Roll modal handlers.
    const handleNewRollChange = (e) => {
        const { name, value } = e.target;
        setNewRoll(prev => ({ ...prev, [name]: value }));
    };

    const handleAddNewRoll = (e) => {
        e.preventDefault();
        setNewRollLoading(true);
        setNewRollErrors({});
        router.post(
            route('admin.addInventoryItem'),
            newRoll,
            {
                preserveState: true,
                onSuccess: () => {
                    setNewRollLoading(false);
                    setAlert({ type: 'success', message: 'New Roll Added Successfully' });
                    setNewRoll({
                        provider: '',
                        rollType: '',
                        rollSize: '',
                        rollWidth: '',
                        rollHeight: '',
                        priceRate: '',
                        offcutPrice: ''
                    });
                    document.querySelector('#addnewRoll .btn-close').click();
                },
                onError: (errors) => {
                    setNewRollErrors(errors);
                    setAlert({ type: 'danger', message: 'Failed to add roll' });
                    setNewRollLoading(false);
                }
            }
        );
    };

    useEffect(() => {
        const modal = document.getElementById('addnewRoll');
        const handleModalClose = () => {
            setNewRoll({
                provider: '',
                rollType: '',
                rollSize: '',
                rollWidth: '',
                rollHeight: '',
                priceRate: '',
                offcutPrice: ''
            });
            setNewRollErrors({});
        };
        if (modal) {
            modal.addEventListener('hidden.bs.modal', handleModalClose);
        }
        return () => {
            if (modal) modal.removeEventListener('hidden.bs.modal', handleModalClose);
        };
    }, []);

    // Edit Roll modal handlers.
    const handleEditRollClick = (roll) => {
        setEditingRoll({
            id: roll.id,
            provider: roll.provider?.id || '',
            rollType: roll.roll_type || '',
            rollSize: roll.roll_size || '',
            rollWidth: roll.roll_width || '',
            rollHeight: roll.roll_height || '',
            priceRate: roll.price_rate_per_sqft || '',
            offcutPrice: roll.offcut_price || ''
        });
        setEditingRollErrors({});
    };

    const handleEditRollChange = (e) => {
        const { name, value } = e.target;
        setEditingRoll(prev => ({ ...prev, [name]: value }));
    };

    const handleEditRollSubmit = (e) => {
        e.preventDefault();
        if (!editingRoll) return;
        setEditingRollLoading(true);
        setEditingRollErrors({});
        router.patch(
            route('admin.editInventoryItem', editingRoll.id),
            editingRoll,
            {
                preserveState: true,
                onSuccess: () => {
                    setEditingRollLoading(false);
                    setAlert({ type: 'success', message: 'Roll successfully updated' });
                    document.querySelector('#editRollModal .btn-close').click();
                },
                onError: (errors) => {
                    setEditingRollErrors(errors);
                    setAlert({ type: 'danger', message: 'Failed to edit roll' });
                    setEditingRollLoading(false);
                }
            }
        );
    };

    // Delete Roll handler.
    const handleRollDelete = async () => {
        setDeleteRollLoading(true);
        try {
            await axios.delete(route('admin.deleteInventoryItem', selectedRollId));
            setAlert({ type: 'success', message: 'Roll deleted successfully' });
            // refresh only the rolls list
            router.reload({ only: ['rolls'], preserveState: true, preserveScroll: true });
        } catch (e) {
            setAlert({ type: 'danger', message: e?.response?.data?.message || 'Failed to delete roll.' });
        } finally {
            setDeleteRollLoading(false);
            document.querySelector('#deleteRollModal .btn-close')?.click();
        }
    };


    // Rolls pagination (using backend paginator).
    const handleRollPageChange = (page) => {
        if (rolls.path) {
            router.visit(`${rolls.path}?inventoryType=${inventoryType}&search=${searchTerm}&page=${page}&show=${showCount}`, {
                preserveState: true,
                preserveScroll: true,
            });
        }
    };

    const refreshRolls = () => {
        router.reload({
            only: ['rolls'],          // fetch just the rolls prop from the server
            preserveState: true,      // keep your component state (alerts, modal state, filters)
            preserveScroll: true,
        });
    };


    const renderRollsPagination = () => (
        rolls && rolls.last_page > 1 && (
            <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mt-24">
                <ul className="pagination d-flex flex-wrap align-items-center gap-2 justify-content-center">
                    {rolls.current_page > 1 && (
                        <li className="page-item">
                            <button
                                className="page-link bg-neutral-200 text-secondary-light fw-semibold radius-8 border-0 d-flex align-items-center justify-content-center h-32-px w-32-px text-md"
                                onClick={() => handleRollPageChange(rolls.current_page - 1)}
                            >
                                <Icon icon="ep:d-arrow-left" />
                            </button>
                        </li>
                    )}
                    {Array.from({ length: rolls.last_page }, (_, i) => i + 1).map((page) => (
                        <li className="page-item" key={page}>
                            <button
                                className={`page-link fw-semibold radius-8 border-0 d-flex align-items-center justify-content-center h-32-px w-32-px text-md ${page === rolls.current_page ? "bg-primary-600 text-white" : "bg-neutral-200 text-secondary-light"}`}
                                onClick={() => handleRollPageChange(page)}
                            >
                                {page}
                            </button>
                        </li>
                    ))}
                    {rolls.current_page < rolls.last_page && (
                        <li className="page-item">
                            <button
                                className="page-link bg-neutral-200 text-secondary-light fw-semibold radius-8 border-0 d-flex align-items-center justify-content-center h-32-px w-32-px text-md"
                                onClick={() => handleRollPageChange(rolls.current_page + 1)}
                            >
                                <Icon icon="ep:d-arrow-right" />
                            </button>
                        </li>
                    )}
                </ul>
            </div>
        )
    );

    // Inventory (Others) pagination is rendered similar to your Roles component.
    const renderInventoryPagination = () => (
        inventory && inventory.last_page > 1 && (
            <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mt-24">
                <span>
                    Showing {inventory.from || 0} to {inventory.to || 0} of {inventory.total || 0} entries
                </span>
                <ul className="pagination d-flex flex-wrap align-items-center gap-2 justify-content-center">
                    {inventory.current_page > 1 && (
                        <li className="page-item">
                            <Link
                                className="page-link bg-neutral-200 text-secondary-light fw-semibold radius-8 border-0 d-flex align-items-center justify-content-center h-32-px w-32-px text-md"
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
                                className="page-link bg-neutral-200 text-secondary-light fw-semibold radius-8 border-0 d-flex align-items-center justify-content-center h-32-px w-32-px text-md"
                                href={inventory.next_page_url}
                            >
                                <Icon icon="ep:d-arrow-right" />
                            </Link>
                        </li>
                    )}
                </ul>
            </div>
        )
    );

    // preload products (use your existing JSON endpoint)
    useEffect(() => {
        (async () => {
            try {
                const { data } = await axios.get(route('admin.getProducts')); // returns JSON
                // adapt to your controller’s shape; assuming { products: [...] }
                setProductsList(Array.isArray(data?.products) ? data.products : (data ?? []));
            } catch (err) {
                console.error(err);
                setAlert({ type: 'danger', message: 'Failed to load products list' });
            }
        })();
    }, []);



    return (
        <>
            <Head title="Inventory - Admin" />
            <Meta
                title="Inventory - Admin"
                description="Manage inventory, view details, and update information."
            />
            <AdminDashboard userDetails={userDetails}>
                <Breadcrumb title="Inventory" />
                {alert && <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} />}
                <div className="card h-100 p-0 radius-12">
                    <div className="card-header border-bottom bg-base py-16 px-24 d-flex align-items-center flex-wrap gap-3 justify-content-between">
                        <div className="d-flex align-items-center flex-wrap gap-3">
                            <span className="text-md fw-medium text-secondary-light mb-0">Show</span>
                            <select
                                className="form-select form-select-sm w-auto ps-12 py-6 radius-12 h-40-px"
                                value={showCount}
                                onChange={handleShowCountChange}
                            >
                                <option value="Select Number" disabled>Select Number</option>
                                <option value="1">1</option>
                                <option value="5">5</option>
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
                                <option value="Select inventory type" disabled>Select inventory type</option>
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
                            <Icon icon="ic:baseline-plus" className="icon text-xl line-height-1" />
                            Add New Roll
                        </button>
                    </div>
                    <div className="card-body p-24">
                        {(inventoryType === "all" || inventoryType === "rolls") && (
                            <>
                                <div className="table-responsive scroll-sm">
                                    <div className="tw-font-medium tw-mb-3 tw-text-2xl tw-to-black">Rolls</div>
                                    <table className="table bordered-table sm-table mb-0">
                                        <thead>
                                            <tr>
                                                <th scope="col">
                                                    <div className="d-flex align-items-center gap-10">
                                                        <div className="form-check style-check d-flex align-items-center">
                                                            <input className="form-check-input radius-4 border input-form-dark" type="checkbox" name="checkbox" id="selectAllRolls" />
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
                                                <th scope="col">Offcut Price</th>
                                                <th scope="col">Products</th>
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
                                                                    <input className="form-check-input radius-4 border input-form-dark" type="checkbox" name="checkbox" id={`rollCheckbox-${roll.id}`} />
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
                                                        <td>{roll.offcut_price || '-'}</td>
                                                        <td>
                                                            {Array.isArray(roll.products) && roll.products.length > 0 ? (
                                                                <div className="tw-flex tw-flex-wrap tw-gap-1">
                                                                    {roll.products.slice(0, 3).map((p) => (
                                                                        <Link
                                                                            key={p.id}
                                                                            href={route('admin.producteditView', p.id)}
                                                                            className="tw-text-xs tw-bg-neutral-100 tw-border tw-border-neutral-200 tw-rounded tw-px-2 tw-py-0.5 hover:tw-underline"
                                                                            title="Edit product"
                                                                        >
                                                                            {p.name ?? `#${p.id}`}
                                                                        </Link>
                                                                    ))}
                                                                    {roll.products_count > 3 && (
                                                                        <span className="tw-text-xs tw-text-gray-500">
                                                                            +{roll.products_count - 3} more
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            ) : (
                                                                <span className="tw-text-gray-400">—</span>
                                                            )}
                                                        </td>
                                                        <td className="text-center">{formatTimestamp(roll.updated_at)}</td>
                                                        <td className="text-center">
                                                            <div className="d-flex align-items-center gap-10 justify-content-center">
                                                                <button
                                                                    type="button"
                                                                    className="bg-success-focus text-success-600 bg-hover-success-200 fw-medium w-40-px h-40-px d-flex justify-content-center align-items-center rounded-circle"
                                                                    data-bs-toggle="modal"
                                                                    data-bs-target="#editRollModal"
                                                                    onClick={() => handleEditRollClick(roll)}
                                                                >
                                                                    <Icon icon="lucide:edit" className="menu-icon" />
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    className="remove-item-btn bg-danger-focus bg-hover-danger-200 text-danger-600 fw-medium w-40-px h-40-px d-flex justify-content-center align-items-center rounded-circle"
                                                                    data-bs-toggle="modal"
                                                                    data-bs-target="#deleteRollModal"
                                                                    onClick={() => setSelectedRollId(roll.id)}
                                                                >
                                                                    <Icon icon="fluent:delete-24-regular" className="menu-icon" />
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    className="bg-primary-100 text-primary-700 fw-medium w-40-px h-40-px d-flex justify-content-center align-items-center rounded-circle"
                                                                    data-bs-toggle="modal"
                                                                    data-bs-target="#bindRollsModal"
                                                                    onClick={() => {
                                                                        setBindModalOpen(true);
                                                                        // pre-select the clicked roll
                                                                        setBindRollIds([roll.id]);
                                                                        setBindDefault(roll.id);
                                                                    }}
                                                                    title="Bind to products"
                                                                >
                                                                    <Icon icon="mdi:link-variant" className="menu-icon" />
                                                                </button>

                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr>
                                                    <td colSpan="10" className="text-center">No Rolls found.</td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                                <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mt-24">
                                    <span>
                                        Showing {rolls.from || 0} to {rolls.to || 0} of {rolls.total || 0} entries
                                    </span>
                                    {renderRollsPagination()}
                                </div>
                            </>
                        )}
                        {(inventoryType === "all" || inventoryType === "other") && (
                            <div className="table-responsive scroll-sm tw-mt-8">
                                <div className="tw-font-medium tw-mb-3 tw-text-2xl tw-to-black">Others</div>
                                <table className="table bordered-table sm-table mb-0">
                                    <thead>
                                        <tr>
                                            <th scope="col">
                                                <div className="d-flex align-items-center gap-10">
                                                    <div className="form-check style-check d-flex align-items-center">
                                                        <input className="form-check-input radius-4 border input-form-dark" type="checkbox" name="checkbox" id="selectAllOthers" />
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
                                                                <input className="form-check-input radius-4 border input-form-dark" type="checkbox" name="checkbox" id={`otherCheckbox-${item.id}`} />
                                                            </div>
                                                            {item.id}
                                                        </div>
                                                    </td>
                                                    <td>{item.provider?.name || 'N/A'}</td>
                                                    <td>{item.quantity}</td>
                                                    <td>{item.reorder_threshold}</td>
                                                    <td>{item.unit_details ? JSON.stringify(item.unit_details) : '-'}</td>
                                                    <td className="text-center">{item.updated_at}</td>
                                                    <td className="text-center">
                                                        <div className="d-flex align-items-center gap-10 justify-content-center">
                                                            <button type="button" className="bg-info-focus bg-hover-info-200 text-info-600 fw-medium w-40-px h-40-px d-flex justify-content-center align-items-center rounded-circle">
                                                                <Icon icon="majesticons:eye-line" className="icon text-xl" />
                                                            </button>
                                                            <button type="button" className="bg-success-focus text-success-600 bg-hover-success-200 fw-medium w-40-px h-40-px d-flex justify-content-center align-items-center rounded-circle">
                                                                <Icon icon="lucide:edit" className="menu-icon" />
                                                            </button>
                                                            <button type="button" className="remove-item-btn bg-danger-focus bg-hover-danger-200 text-danger-600 fw-medium w-40-px h-40-px d-flex justify-content-center align-items-center rounded-circle">
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
                                <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mt-24">
                                    <span>
                                        Showing {inventory.from || 0} to {inventory.to || 0} of {inventory.total || 0} entries
                                    </span>
                                    {renderInventoryPagination()}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Add New Roll Modal */}
                <div className="modal fade" id="addnewRoll" tabIndex={-1} aria-labelledby="addnewRollLabel" aria-hidden="true">
                    <div className="modal-dialog modal-lg modal-dialog-centered">
                        <div className="modal-content radius-16 bg-base">
                            <div className="modal-header py-16 px-24 border-0">
                                <h5 className="modal-title fs-5" id="addnewRollLabel">Add New Roll</h5>
                                <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close" />
                            </div>
                            <div className="modal-body p-24">
                                <form onSubmit={handleAddNewRoll}>
                                    <div className="mb-3">
                                        <label htmlFor="provider" className="form-label">Provider</label>
                                        <select id="provider" name="provider" className="form-select" value={newRoll.provider} onChange={handleNewRollChange}>
                                            <option value="">Select Provider</option>
                                            {providers && providers.map(provider => (
                                                <option key={provider.id} value={provider.id}>{provider.name}</option>
                                            ))}
                                        </select>
                                        {newRollErrors.provider && (
                                            <div className="invalid-feedback">
                                                {Array.isArray(newRollErrors.provider) ? newRollErrors.provider[0] : newRollErrors.provider}
                                            </div>
                                        )}
                                    </div>
                                    <div className="mb-3">
                                        <label htmlFor="rollType" className="form-label">Roll Type</label>
                                        <input type="text" id="rollType" name="rollType" className={`form-control ${newRollErrors.rollType ? 'is-invalid' : ''}`} placeholder="e.g. Flex" value={newRoll.rollType} onChange={handleNewRollChange} />
                                        {newRollErrors.rollType && (
                                            <div className="invalid-feedback">
                                                {Array.isArray(newRollErrors.rollType) ? newRollErrors.rollType[0] : newRollErrors.rollType}
                                            </div>
                                        )}
                                    </div>
                                    <div className="mb-3">
                                        <label htmlFor="rollSize" className="form-label">Roll Size Name</label>
                                        <input type="text" id="rollSize" name="rollSize" className={`form-control ${newRollErrors.rollSize ? 'is-invalid' : ''}`} placeholder="e.g. 2ft" value={newRoll.rollSize} onChange={handleNewRollChange} />
                                        {newRollErrors.rollSize && (
                                            <div className="invalid-feedback">
                                                {Array.isArray(newRollErrors.rollSize) ? newRollErrors.rollSize[0] : newRollErrors.rollSize}
                                            </div>
                                        )}
                                    </div>
                                    <div className="mb-3">
                                        <label htmlFor="rollWidth" className="form-label">Fixed Width (ft)</label>
                                        <input type="number" step="0.01" id="rollWidth" name="rollWidth" className={`form-control ${newRollErrors.rollWidth ? 'is-invalid' : ''}`} value={newRoll.rollWidth} onChange={handleNewRollChange} />
                                        {newRollErrors.rollWidth && (
                                            <div className="invalid-feedback">
                                                {Array.isArray(newRollErrors.rollWidth) ? newRollErrors.rollWidth[0] : newRollErrors.rollWidth}
                                            </div>
                                        )}
                                    </div>
                                    <div className="mb-3">
                                        <label htmlFor="rollHeight" className="form-label">Height (ft)</label>
                                        <input type="number" step="0.01" id="rollHeight" name="rollHeight" className={`form-control ${newRollErrors.rollHeight ? 'is-invalid' : ''}`} value={newRoll.rollHeight} onChange={handleNewRollChange} />
                                        {newRollErrors.rollHeight && (
                                            <div className="invalid-feedback">
                                                {Array.isArray(newRollErrors.rollHeight) ? newRollErrors.rollHeight[0] : newRollErrors.rollHeight}
                                            </div>
                                        )}
                                    </div>
                                    <div className="mb-3">
                                        <label htmlFor="priceRate" className="form-label">Price per Sq. Ft. (LKR)</label>
                                        <input type="number" step="0.01" id="priceRate" name="priceRate" className={`form-control ${newRollErrors.priceRate ? 'is-invalid' : ''}`} value={newRoll.priceRate} onChange={handleNewRollChange} />
                                        {newRollErrors.priceRate && (
                                            <div className="invalid-feedback">
                                                {Array.isArray(newRollErrors.priceRate) ? newRollErrors.priceRate[0] : newRollErrors.priceRate}
                                            </div>
                                        )}
                                    </div>
                                    <div className="mb-3">
                                        <label htmlFor="offcutPrice" className="form-label">Offcut Price (LKR)</label>
                                        <input type="number" step="0.01" id="offcutPrice" name="offcutPrice" className={`form-control ${newRollErrors.offcutPrice ? 'is-invalid' : ''}`} value={newRoll.offcutPrice} onChange={handleNewRollChange} />
                                        {newRollErrors.offcutPrice && (
                                            <div className="invalid-feedback">
                                                {Array.isArray(newRollErrors.offcutPrice) ? newRollErrors.offcutPrice[0] : newRollErrors.offcutPrice}
                                            </div>
                                        )}
                                    </div>
                                    <div className="modal-footer d-flex justify-content-end">
                                        <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                                        <button type="submit" className="btn btn-primary" disabled={newRollLoading}>
                                            {newRollLoading ? (
                                                <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                                            ) : (
                                                "Add Roll"
                                            )}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Edit Roll Modal */}
                <div className="modal fade" id="editRollModal" tabIndex={-1} aria-labelledby="editRollModalLabel" aria-hidden="true">
                    <div className="modal-dialog modal-lg modal-dialog-centered">
                        <div className="modal-content radius-16 bg-base">
                            <div className="modal-header py-16 px-24 border-0">
                                <h5 className="modal-title fs-5" id="editRollModalLabel">Edit Roll</h5>
                                <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close" />
                            </div>
                            <div className="modal-body p-24">
                                <form onSubmit={handleEditRollSubmit}>
                                    <div className="mb-3">
                                        <label htmlFor="editProvider" className="form-label">Provider</label>
                                        <select id="editProvider" name="provider" className="form-select" value={editingRoll?.provider || ''} onChange={handleEditRollChange}>
                                            <option value="">Select Provider</option>
                                            {providers && providers.map(provider => (
                                                <option key={provider.id} value={provider.id}>{provider.name}</option>
                                            ))}
                                        </select>
                                        {editingRollErrors.provider && (
                                            <div className="invalid-feedback">
                                                {Array.isArray(editingRollErrors.provider) ? editingRollErrors.provider[0] : editingRollErrors.provider}
                                            </div>
                                        )}
                                    </div>
                                    <div className="mb-3">
                                        <label htmlFor="editRollType" className="form-label">Roll Type</label>
                                        <input type="text" id="editRollType" name="rollType" className={`form-control ${editingRollErrors.rollType ? 'is-invalid' : ''}`} placeholder="e.g. Flex" value={editingRoll?.rollType || ''} onChange={handleEditRollChange} />
                                        {editingRollErrors.rollType && (
                                            <div className="invalid-feedback">
                                                {Array.isArray(editingRollErrors.rollType) ? editingRollErrors.rollType[0] : editingRollErrors.rollType}
                                            </div>
                                        )}
                                    </div>
                                    <div className="mb-3">
                                        <label htmlFor="editRollSize" className="form-label">Roll Size Name</label>
                                        <input type="text" id="editRollSize" name="rollSize" className={`form-control ${editingRollErrors.rollSize ? 'is-invalid' : ''}`} placeholder="e.g. 2ft" value={editingRoll?.rollSize || ''} onChange={handleEditRollChange} />
                                        {editingRollErrors.rollSize && (
                                            <div className="invalid-feedback">
                                                {Array.isArray(editingRollErrors.rollSize) ? editingRollErrors.rollSize[0] : editingRollErrors.rollSize}
                                            </div>
                                        )}
                                    </div>
                                    <div className="mb-3">
                                        <label htmlFor="editRollWidth" className="form-label">Fixed Width (ft)</label>
                                        <input type="number" step="0.01" id="editRollWidth" name="rollWidth" className={`form-control ${editingRollErrors.rollWidth ? 'is-invalid' : ''}`} value={editingRoll?.rollWidth || ''} onChange={handleEditRollChange} />
                                        {editingRollErrors.rollWidth && (
                                            <div className="invalid-feedback">
                                                {Array.isArray(editingRollErrors.rollWidth) ? editingRollErrors.rollWidth[0] : editingRollErrors.rollWidth}
                                            </div>
                                        )}
                                    </div>
                                    <div className="mb-3">
                                        <label htmlFor="editRollHeight" className="form-label">Height (ft)</label>
                                        <input type="number" step="0.01" id="editRollHeight" name="rollHeight" className={`form-control ${editingRollErrors.rollHeight ? 'is-invalid' : ''}`} value={editingRoll?.rollHeight || ''} onChange={handleEditRollChange} />
                                        {editingRollErrors.rollHeight && (
                                            <div className="invalid-feedback">
                                                {Array.isArray(editingRollErrors.rollHeight) ? editingRollErrors.rollHeight[0] : editingRollErrors.rollHeight}
                                            </div>
                                        )}
                                    </div>
                                    <div className="mb-3">
                                        <label htmlFor="editPriceRate" className="form-label">Price per Sq. Ft. (LKR)</label>
                                        <input type="number" step="0.01" id="editPriceRate" name="priceRate" className={`form-control ${editingRollErrors.priceRate ? 'is-invalid' : ''}`} value={editingRoll?.priceRate || ''} onChange={handleEditRollChange} />
                                        {editingRollErrors.priceRate && (
                                            <div className="invalid-feedback">
                                                {Array.isArray(editingRollErrors.priceRate) ? editingRollErrors.priceRate[0] : editingRollErrors.priceRate}
                                            </div>
                                        )}
                                    </div>
                                    <div className="mb-3">
                                        <label htmlFor="editOffcutPrice" className="form-label">Offcut Price (LKR)</label>
                                        <input type="number" step="0.01" id="editOffcutPrice" name="offcutPrice" className={`form-control ${editingRollErrors.offcutPrice ? 'is-invalid' : ''}`} value={editingRoll?.offcutPrice || ''} onChange={handleEditRollChange} />
                                        {editingRollErrors.offcutPrice && (
                                            <div className="invalid-feedback">
                                                {Array.isArray(editingRollErrors.offcutPrice) ? editingRollErrors.offcutPrice[0] : editingRollErrors.offcutPrice}
                                            </div>
                                        )}
                                    </div>
                                    <div className="modal-footer d-flex justify-content-end">
                                        <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                                        <button type="submit" className="btn btn-primary" disabled={editingRollLoading}>
                                            {editingRollLoading ? (
                                                <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                                            ) : (
                                                "Update Roll"
                                            )}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Delete Roll Modal */}
                <div className="modal fade" id="deleteRollModal" tabIndex={-1} aria-labelledby="deleteRollModalLabel" aria-hidden="true">
                    <div className="modal-dialog">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h1 className="modal-title fs-5 text-red-500" id="deleteRollModalLabel">Are you sure?</h1>
                                <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                            </div>
                            <div className="modal-body font-light">
                                <p>Do you really want to delete this roll? This process cannot be undone.</p>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                                <button
                                    type="button"
                                    className="btn btn-outline-danger"
                                    onClick={handleRollDelete}
                                    disabled={deleteRollLoading}
                                >
                                    {deleteRollLoading ? (
                                        <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                                    ) : (
                                        "Delete Roll"
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="modal fade" id="bindRollsModal" tabIndex={-1} aria-labelledby="bindRollsModalLabel" aria-hidden="true">
                    <div className="modal-dialog modal-lg modal-dialog-centered">
                        <div className="modal-content radius-16 bg-base">
                            <div className="modal-header py-16 px-24 border-0">
                                <h5 className="modal-title fs-5" id="bindRollsModalLabel">Bind Rolls to Product</h5>
                                <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"
                                    onClick={() => { setBindErrors({}); setBindRollIds([]); setBindDefault(null); setBindProductId(''); }} />
                            </div>
                            <div className="modal-body p-24">
                                <form onSubmit={async (e) => {
                                    e.preventDefault();
                                    setBindBusy(true);
                                    setBindErrors({});

                                    try {
                                        await axios.patch(
                                            route('admin.product.rolls.sync', bindProductId),
                                            {
                                                roll_ids: bindRollIds,
                                                default_roll: bindDefault,
                                            }
                                        );

                                        setAlert({ type: 'success', message: 'Product rolls updated' });
                                        refreshRolls();
                                        // close modal
                                        const closeBtn = document.querySelector('#bindRollsModal .btn-close');
                                        if (closeBtn) closeBtn.click();

                                        // optional: reset state
                                        setBindProductId('');
                                        setBindRollIds([]);
                                        setBindDefault(null);
                                    } catch (error) {
                                        const errors = error?.response?.data?.errors ?? {};
                                        setBindErrors(errors);
                                        setAlert({ type: 'danger', message: 'Failed to update product rolls' });
                                        console.error(error);
                                    } finally {
                                        setBindBusy(false);
                                    }
                                }}
                                >
                                    {/* Select product */}
                                    <div className="mb-3">
                                        <label className="form-label">Product</label>
                                        <select className="form-select"
                                            value={bindProductId}
                                            onChange={(e) => setBindProductId(e.target.value)}>
                                            <option value="">Select a product</option>
                                            {Array.isArray(productsList) && productsList.map(p => (
                                                <option key={p.id} value={p.id}>{p.name || `#${p.id}`}</option>
                                            ))}
                                        </select>
                                        {bindErrors.product && <div className="invalid-feedback d-block">
                                            {Array.isArray(bindErrors.product) ? bindErrors.product[0] : bindErrors.product}
                                        </div>}
                                    </div>

                                    {/* Multi-select rolls (use the list already loaded in this page) */}
                                    <div className="mb-3">
                                        <label className="form-label">Select Rolls</label>
                                        <div className="tw-grid tw-grid-cols-2 md:tw-grid-cols-3 tw-gap-2">
                                            {Array.isArray(rollsItems) && rollsItems.map(r => {
                                                const checked = bindRollIds.includes(r.id);
                                                return (
                                                    <label key={r.id} className="tw-flex tw-items-center tw-gap-2 tw-p-2 tw-border tw-rounded">
                                                        <input
                                                            type="checkbox"
                                                            checked={checked}
                                                            onChange={(e) => {
                                                                if (e.target.checked) setBindRollIds(prev => [...prev, r.id]);
                                                                else setBindRollIds(prev => prev.filter(x => x !== r.id));
                                                                // if default was removed, clear it
                                                                if (!e.target.checked && bindDefault === r.id) setBindDefault(null);
                                                            }}
                                                        />
                                                        <span className="tw-text-sm">
                                                            #{r.id} {r.roll_type} {r.roll_size ? `(${r.roll_size})` : ''} {r.roll_width ? `- ${r.roll_width}ft` : ''}
                                                        </span>
                                                    </label>
                                                );
                                            })}
                                        </div>
                                        {bindErrors.roll_ids && <div className="invalid-feedback d-block">
                                            {Array.isArray(bindErrors.roll_ids) ? bindErrors.roll_ids[0] : bindErrors.roll_ids}
                                        </div>}
                                    </div>

                                    {/* Default roll (radio among selected) */}
                                    <div className="mb-3">
                                        <label className="form-label">Default Roll (optional)</label>
                                        <div className="tw-flex tw-flex-wrap tw-gap-3">
                                            {bindRollIds.length === 0 && <div className="tw-text-sm tw-text-gray-500">Select at least one roll to choose a default.</div>}
                                            {bindRollIds.map(rid => {
                                                const roll = rollsItems.find(x => x.id === rid);
                                                return (
                                                    <label key={rid} className="tw-flex tw-items-center tw-gap-2">
                                                        <input type="radio" name="default_roll"
                                                            checked={bindDefault === rid}
                                                            onChange={() => setBindDefault(rid)} />
                                                        <span className="tw-text-sm">
                                                            #{rid} {roll?.roll_type} {roll?.roll_size ? `(${roll.roll_size})` : ''}
                                                        </span>
                                                    </label>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    <div className="modal-footer d-flex justify-content-end">
                                        <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                                        <button type="submit" className="btn btn-primary" disabled={bindBusy || !bindProductId}>
                                            {bindBusy ? <span className="spinner-border spinner-border-sm" /> : 'Save'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>


            </AdminDashboard >
            <CookiesV />
        </>
    );
};

export default Inventory;
