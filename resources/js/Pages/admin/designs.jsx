import React, { useEffect, useRef, useState } from 'react';
import { Head, router, Link, useForm, usePage } from '@inertiajs/react';
import AdminDashboard from '../../Layouts/AdminDashboard';
import Breadcrumb from "@/components/Breadcrumb";
import { Icon } from "@iconify/react";
import CookiesV from '@/Components/CookieConsent';
import Alert from "@/Components/Alert";
import Meta from "@/Components/Metaheads";
import 'react-quill-new/dist/quill.snow.css';

export default function Designs({ userDetails, designs, filters, workingGroups }) {
    const { flash } = usePage().props

    const [selected, setSelected] = useState(null);
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [editProducts, setEditProducts] = useState([]);
    const [alert, setAlert] = useState(null)    // { type, message }
    const [editLoading, setEditLoading] = useState(false)
    const [editErrors, setEditErrors] = useState({})

    // const [errors, setErrors] = useState({})

    // Form for editing an existing design
    const { data: editData, setData: setEditData, put: updateDesign, reset: resetEdit } = useForm({
        name: '',
        description: '',
        width: '',
        height: '',
        status: '',
        access_type: '',
        product_id: '',
        working_group_id: ''
    });

    const openView = (design) => setSelected(design);
    const openEdit = (design) => {
        setSelected(design);
        setEditData({
            name: design.name,
            description: design.description,
            width: design.width,
            height: design.height,
            status: design.status,
            access_type: design.access_type,
            product_id: design.product_id,
            working_group_id: design.working_group_id
        });
    };
    const openDelete = (design) => setSelected(design);

    useEffect(() => {
        if (!editData.working_group_id) {
            setEditProducts([]);
            return;
        }
        const group = workingGroups.find(g => g.id === Number(editData.working_group_id));
        setEditProducts(group?.products || []);
    }, [editData.working_group_id]);

    const { data, setData } = useForm({
        search: filters.search || '',
        status: filters.status || '',
        per_page: filters.per_page || 10,
    });

    const initialRender = useRef(true);
    useEffect(() => {
        if (initialRender.current) {
            initialRender.current = false;
            return;
        }
        router.get(
            route('admin.designs'),
            { ...data },
            { preserveState: true }
        );
    }, [data.search, data.status, data.per_page]);

    const handleChange = (e) => setData(e.target.name, e.target.value);

    const confirmDelete = () => {
        setDeleteLoading(true);
        setAlert(null);
        router.delete(route('admin.deleteDesign', selected.id), {
            preserveState: true,
            onSuccess: () => {

                // const flash = page.props?.flash || {};
                setAlert({ type: 'success', message: 'Design deleted Successfully!' });
                // if (flash.success) {
                //     setAlert({ type: 'success', message: 'Design deleted Successfully!' });
                // } else if (flash.error) {
                //     setAlert({ type: 'danger', message: flash.error });
                // }
            },
            onError: () => {
                // show an error alert
                setAlert({
                    type: 'danger',
                    message: 'Failed to delete design. Please try again.',
                });
            },
            onFinish: () => {
                setDeleteLoading(false);
                document.querySelector('#deleteDesignModal .btn-close').click();
            },
        });
    };

    const submitEdit = (e) => {
        e.preventDefault()

        setEditLoading(true)
        setEditErrors({})
        setAlert(null)

        // call the `put` helper directly with URL + callbacks
        updateDesign(route('admin.editDesign', selected.id), {
            preserveState: true,

            onSuccess: (page) => {
                // 1) close the modal
                document
                    .querySelector('#editDesignModal .btn-close')
                    .click()

                // 2) grab the exact flash (success or error) the backend sent
                setAlert({
                    type: 'success',
                    message: 'Design details updated successfully!',
                })

                // 3) reset the form state
                resetEdit()
            },

            onError: (errors) => {
                // Inertia gives you back the validation errors object
                setEditErrors(errors)
                setAlert({
                    type: 'danger',
                    message: 'Please correct the errors below.',
                })
            },

            onFinish: () => {
                setEditLoading(false)
            },
        })
    }



    return (
        <>
            <Head title="All designs - Admin Dashboard" />
            <Meta title="All designs - Admin Dashboard" description="Check all designs" />
            <AdminDashboard userDetails={userDetails}>
                <Breadcrumb title="Designs" />
                {alert && <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} />}
                <div className="card h-100 p-0 radius-12">
                    <div className="card-header border-bottom bg-base py-16 px-24 d-flex align-items-center flex-wrap gap-3 justify-content-between">
                        <div className="d-flex align-items-center flex-wrap gap-3">
                            <span className="text-md fw-medium text-secondary-light mb-0">Show</span>
                            <select
                                name="per_page"
                                className="form-select form-select-sm w-auto ps-12 py-6 radius-12 h-40-px"
                                value={data.per_page}
                                onChange={handleChange}
                            >
                                {[5, 10, 20, 25, 50, 100].map(n => (
                                    <option key={n} value={n}>{n}</option>
                                ))}
                            </select>

                            <input
                                type="text"
                                name="search"
                                className="bg-base h-40-px w-auto form-input ps-12"
                                placeholder="Search"
                                value={data.search}
                                onChange={handleChange}
                            />

                            <select
                                name="status"
                                className="form-select form-select-sm w-auto ps-12 py-6 radius-12 h-40-px"
                                value={data.status}
                                onChange={handleChange}
                            >
                                <option value="">All Status</option>
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                            </select>
                        </div>
                        <Link
                            href={route('admin.addDesign')}
                            className="btn btn-primary text-sm btn-sm px-12 py-12 radius-8 d-flex align-items-center gap-2"
                        >
                            <Icon icon="ic:baseline-plus" className="icon text-xl line-height-1" />
                            Add New Design
                        </Link>
                    </div>

                    <div className="card-body p-24">
                        <div className="table-responsive scroll-sm">
                            <table className="table bordered-table sm-table mb-0">
                                <thead>
                                    <tr>
                                        <th><input type="checkbox" className="form-check-input" /></th>
                                        <th>S.L</th>
                                        <th>Design</th>
                                        <th>Product</th>
                                        <th>WG</th>
                                        <th>Sizes</th>
                                        <th className="text-center">Status</th>
                                        <th className="text-center">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {designs.data.map((design, index) => (
                                        <tr key={design.id}>
                                            <td><input type="checkbox" className="form-check-input" /></td>
                                            <td>{(designs.current_page - 1) * designs.per_page + index + 1}</td>
                                            <td>
                                                <div className="d-flex align-items-center">
                                                    <img
                                                        src={design.image_url}
                                                        alt={design.name}
                                                        className="w-40-px h-40-px rounded-circle flex-shrink-0 me-12 overflow-hidden"
                                                    />
                                                    <span className="text-md mb-0 fw-normal text-secondary-light">{design.name}</span>
                                                </div>
                                            </td>
                                            <td>{design.product.name}</td>
                                            <td>{design.working_group.name}</td>
                                            <td>{design.width}x{design.height}</td>
                                            <td className="text-center">
                                                <span className={design.status === 'active' ? 'bg-success-focus text-success-600 px-24 py-4 radius-4 fw-medium text-sm' : 'bg-danger-focus text-danger-600 px-24 py-4 radius-4 fw-medium text-sm'}>
                                                    {design.status.charAt(0).toUpperCase() + design.status.slice(1)}
                                                </span>
                                            </td>
                                            <td className="text-center">
                                                <div className="d-flex justify-content-center gap-10">
                                                    <button className="bg-info-focus bg-hover-info-200 text-info-600 fw-medium w-40-px h-40-px d-flex justify-content-center align-items-center rounded-circle" data-bs-toggle="modal" data-bs-target="#viewDesignModal" onClick={() => openView(design)}>
                                                        <Icon icon="majesticons:eye-line" className="icon text-xl" />
                                                    </button>
                                                    <button className="bg-success-focus bg-hover-success-200 text-success-600 fw-medium w-40-px h-40-px d-flex justify-content-center align-items-center rounded-circle" data-bs-toggle="modal" data-bs-target="#editDesignModal" onClick={() => openEdit(design)}>
                                                        <Icon icon="lucide:edit" className="menu-icon" />
                                                    </button>
                                                    <button className="remove-item-btn bg-danger-focus bg-hover-danger-200 text-danger-600 fw-medium w-40-px h-40-px d-flex justify-content-center align-items-center rounded-circle" data-bs-toggle="modal" data-bs-target="#deleteDesignModal" onClick={() => openDelete(design)}>
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
                            <span>Showing {designs.from} to {designs.to} of {designs.total} entries</span>
                            <ul className="pagination d-flex flex-wrap align-items-center gap-2 justify-content-center">
                                {designs && designs.last_page > 1 && (
                                    <li className="page-item">
                                        <Link
                                            className="page-link bg-neutral-200 text-secondary-light fw-semibold radius-8 border-0 d-flex align-items-center justify-content-center h-32-px w-32-px text-md"
                                            href={designs.prev_page_url}
                                        >
                                            <Icon icon="ep:d-arrow-left" />
                                        </Link>
                                    </li>
                                )}
                                {Array.from({ length: designs.last_page }, (_, i) => i + 1).map((page) => (
                                    <li className="page-item" key={page}>
                                        <Link
                                            className={`page-link fw-semibold radius-8 border-0 d-flex align-items-center justify-content-center h-32-px w-32-px text-md ${page === designs.current_page
                                                ? "bg-primary-600 text-white"
                                                : "bg-neutral-200 text-secondary-light"
                                                }`}
                                            href={`?page=${page}`}
                                        >
                                            {page}
                                        </Link>
                                    </li>
                                ))}
                                {designs.current_page < designs.last_page && (
                                    <li className="page-item">
                                        <Link
                                            className="page-link bg-neutral-200 text-secondary-light fw-semibold radius-8 border-0 d-flex align-items-center justify-content-center h-32-px w-32-px text-md"
                                            href={designs.next_page_url}
                                        >
                                            <Icon icon="ep:d-arrow-right" />
                                        </Link>
                                    </li>
                                )}
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Delete Confirmation Modal */}
                <div className="modal fade" id="deleteDesignModal" tabIndex={-1} aria-labelledby="deleteDesignModalLabel" aria-hidden="true">
                    <div className="modal-dialog">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h1 className="modal-title fs-5 text-red-500" id="deleteDesignModalLabel">Are you sure?</h1>
                                <button type="button" className="btn-close" data-bs-dismiss="modal"></button>
                            </div>
                            <div className="modal-body font-light">
                                <p>Do you really want to delete this design? This process cannot be undone.</p>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                                <button type="button" className="btn btn-outline-danger" onClick={confirmDelete} disabled={deleteLoading}>
                                    {deleteLoading ? <span className="spinner-border spinner-border-sm" role="status"></span> : "Delete Design"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* View Design Modal */}
                <div className="modal fade" id="viewDesignModal" tabIndex={-1} aria-labelledby="viewDesignModalLabel" aria-hidden="true">
                    <div className="modal-dialog modal-lg modal-dialog-centered">
                        <div className="modal-content radius-16 bg-base">
                            <div className="modal-header py-16 px-24 border-0">
                                <h5 className="modal-title tw-font-semibold tw-text-gray-500" id="viewDesignModalLabel">View Design</h5>
                                <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close" />
                            </div>
                            <div className="modal-body p-24">
                                {selected && (
                                    <div>
                                        <div className="d-flex mb-4">
                                            <img src={selected.image_url} alt={selected.name} className="rounded me-4 tw-w-1/2 tw-border-4 tw-border-gray-300 tw-shadow-md tw-border-spacing-4 tw-max-h-screen" />
                                            <div className='tw-ms-3'>
                                                <h5 className='tw-font-semibold'>{selected.name}</h5>
                                                <p>{selected.product.name} in {selected.working_group.name}</p>
                                                <p>Size: {selected.width}in × {selected.height}in</p>
                                                <p className='tw-capitalize'>
                                                    <span className={selected.status === 'active' ? 'bg-success-focus text-success-600 px-24 py-4 radius-4 fw-medium text-sm' : 'bg-danger-focus text-danger-600 px-24 py-4 radius-4 fw-medium text-sm'}>
                                                        {selected.status.charAt(0).toUpperCase() + selected.status.slice(1)}
                                                    </span>
                                                </p>
                                            </div>
                                        </div>
                                        <p>{selected.description}</p>
                                    </div>
                                )}
                            </div>
                            <div className="modal-footer d-flex justify-content-end">
                                <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Edit Design Modal */}
                <div className="modal fade" id="editDesignModal" tabIndex={-1} aria-labelledby="editDesignModalLabel" aria-hidden="true">
                    <div className="modal-dialog modal-xl modal-dialog-centered">
                        <div className="modal-content radius-16 bg-base">
                            <div className="modal-header py-16 px-24 border-0">
                                <h5 className="modal-title" id="editDesignModalLabel">Edit Design</h5>
                                <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close" />
                            </div>
                            <div className="modal-body p-24">
                                <div className="row">
                                    <div className="col-sm-4">
                                        <div className="k">
                                            <img src={selected?.image_url} alt={selected?.name} className="rounded me-4 tw-max-w-full tw-border-4 tw-border-gray-300 tw-shadow-md tw-border-spacing-4 tw-max-h-screen" />
                                        </div>
                                    </div>
                                    <div className="col-sm-8">
                                        <form onSubmit={submitEdit}>
                                            <div className="mb-3">
                                                <label className="form-label">Name - {editData.name}</label>
                                                <input type="text" name="name" className="form-control" value={editData.name} onChange={e => setEditData('name', e.target.value)} hidden />
                                            </div>
                                            <div className="mb-3">
                                                <label className="form-label">Description</label>
                                                <textarea name="description" className="form-control" value={editData.description} onChange={e => setEditData('description', e.target.value)} />
                                            </div>
                                            <div className="row">
                                                <div className="col mb-3">
                                                    <label className="form-label">Width</label>
                                                    <input type="number" name="width" className="form-control" value={editData.width} onChange={e => setEditData('width', e.target.value)} />
                                                </div>
                                                <div className="col mb-3">
                                                    <label className="form-label">Height</label>
                                                    <input type="number" name="height" className="form-control" value={editData.height} onChange={e => setEditData('height', e.target.value)} />
                                                </div>
                                            </div>
                                            <div className="mb-3">
                                                <label className="form-label">Access Type</label>
                                                <select
                                                    name="access_type"
                                                    className="form-select"
                                                    value={editData.access_type}
                                                    onChange={e => setEditData('access_type', e.target.value)}
                                                >
                                                    <option value="">Select access</option>
                                                    <option value="public">Public</option>
                                                    <option value="working_group">Working Group</option>
                                                    <option value="restricted">Restricted</option>
                                                </select>
                                            </div>
                                            <div className="mb-3">
                                                <label className="form-label">Working Group</label>
                                                <select
                                                    name="working_group_id"
                                                    className="form-select"
                                                    value={editData.working_group_id}
                                                    onChange={e => setEditData('working_group_id', e.target.value)}
                                                >
                                                    <option value="">Select a WG</option>
                                                    {workingGroups.map(wg => (
                                                        <option key={wg.id} value={wg.id}>{wg.name}</option>
                                                    ))}
                                                </select>
                                            </div>

                                            {/* –– new: Product select, changes when WG changes –– */}
                                            <div className="mb-3">
                                                <label className="form-label">Product</label>
                                                <select
                                                    name="product_id"
                                                    className="form-select"
                                                    value={editData.product_id}
                                                    onChange={e => setEditData('product_id', e.target.value)}
                                                    disabled={!editData.working_group_id}
                                                >
                                                    <option value="">Select a product</option>
                                                    {editProducts.map(p => (
                                                        <option key={p.id} value={p.id}>{p.name}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div className="mb-3">
                                                <label className="form-label">Status</label>
                                                <select name="status" className="form-select" value={editData.status} onChange={e => setEditData('status', e.target.value)}>
                                                    <option value="active">Active</option>
                                                    <option value="inactive">Inactive</option>
                                                </select>
                                            </div>
                                            <div className="modal-footer d-flex justify-content-end">
                                                <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
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
