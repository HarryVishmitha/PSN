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

const Category = ({ userDetails, categories, filters }) => {
    const [alert, setAlert] = useState(null); // { type, message }
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        status: 'active',
        image: null,
    });
    const [isSubmitting, setIsSubmitting] = useState(false);



    // Add new category
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };




    // Quill text editor and highlight.js
    const quillRef = useRef(null);
    const [isHighlightReady, setIsHighlightReady] = useState(false);

    useEffect(() => {
        hljs?.configure({
            languages: [
                "javascript",
                "ruby",
                "python",
                "java",
                "csharp",
                "cpp",
                "go",
                "php",
                "swift",
            ],
        });
    }, []);

    // Quill editor modules & formats
    const modules = isHighlightReady
        ? {
            syntax: {
                highlight: (text) => hljs?.highlightAuto(text).value,
            },
            toolbar: {
                container: "#toolbar-container",
            },
        }
        : {
            toolbar: {
                container: "#toolbar-container",
            },
        };

    const formats = [
        "font",
        "size",
        "bold",
        "italic",
        "underline",
        "strike",
        "color",
        "background",
        "script",
        "header",
        "blockquote",
        "code-block",
        "list",
        "indent",
        "direction",
        "align",
        "link",
        "image",
        "video",
        "formula",
    ];

    const fileInputRef = useRef(null);
    const [dragging, setDragging] = useState(false);
    const [preview, setPreview] = useState(null);

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file && file.type.startsWith("image/")) {
            setFormData(prev => ({ ...prev, image: file }));

            const reader = new FileReader();
            reader.onloadend = () => {
                setPreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const clearPreview = () => {
        setFormData(prev => ({ ...prev, image: null }));
        setPreview(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = null;
        }
    };

    const onDragEnter = (e) => {
        e.preventDefault();
        setDragging(true);
    };

    const onDragLeave = (e) => {
        e.preventDefault();
        setDragging(false);
    };

    const onDragOver = (e) => {
        e.preventDefault();
    };

    const onDrop = (e) => {
        e.preventDefault();
        setDragging(false);

        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith("image/")) {
            setFormData(prev => ({ ...prev, image: file }));

            const reader = new FileReader();
            reader.onloadend = () => {
                setPreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleAddCategory = async (e) => {
        e.preventDefault();
        setIsSubmitting(true); // ⬅ Start loading

        const submitData = new FormData();
        submitData.append('name', formData.name);
        submitData.append('description', formData.description);
        submitData.append('status', formData.status);
        if (formData.image) {
            submitData.append('image', formData.image);
        }

        try {
            const response = await axios.post(route('admin.category.store'), submitData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            setAlert({ type: 'success', message: response.data.message || 'Category added successfully!' });

            setFormData({ name: '', description: '', status: 'active', image: null });
            setPreview(null);
            fileInputRef.current.value = null;

            document.querySelector('#addCateModal .btn-close').click();

            setTimeout(() => {
                router.reload({ only: ['categories'] });
            }, 1000);
        } catch (error) {
            let errorMessage = "Something went wrong. Please try again.";
            if (error.response?.data?.errors) {
                errorMessage = Object.values(error.response.data.errors).flat().join('\n');
            }
            setAlert({ type: 'danger', message: errorMessage });
        } finally {
            setIsSubmitting(false); // ⬅ End loading
        }
    };



    const [modalMode, setModalMode] = useState('view'); // 'view' or 'edit'
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [editData, setEditData] = useState({
        name: '',
        description: '',
        status: 'active',
        image: null,
    });
    const [editPreview, setEditPreview] = useState(null);
    const editFileInputRef = useRef(null);


    const openCategoryModal = (category, mode = 'view') => {
        setModalMode(mode);
        setSelectedCategory(category);

        setEditData({
            name: category.name || '',
            description: category.description || '',
            status: category.active ? 'active' : 'inactive',
            image: null,
        });

        setEditPreview(category.image_link || null);
        setTimeout(() => {
            const modal = new bootstrap.Modal(document.getElementById('addCateModal'));
            modal.show();
        }, 100);
    };


    const handleUpdateCategory = async (e) => {
        e.preventDefault();
        if (!selectedCategory?.id) return;

        setIsSubmitting(true);

        const submitData = new FormData();
        submitData.append('name', editData.name);
        submitData.append('description', editData.description);
        submitData.append('status', editData.status);
        submitData.append('_method', 'PUT'); // Laravel uses this for PUT via POST

        if (editData.image) {
            submitData.append('image', editData.image);
        }

        try {
            const response = await axios.post(
                route('admin.category.update', selectedCategory.id),
                submitData,
                {
                    headers: { 'Content-Type': 'multipart/form-data' },
                }
            );

            setAlert({ type: 'success', message: response.data.message || 'Category updated successfully!' });

            // Reset
            setEditData({ name: '', description: '', status: 'active', image: null });
            setEditPreview(null);
            editFileInputRef.current.value = null;

            document.querySelector('#addCateModal .btn-close')?.click();

            setTimeout(() => {
                router.reload({ only: ['categories'] });
            }, 1000);
        } catch (error) {
            let errorMessage = 'Something went wrong. Please try again.';
            if (error.response?.data?.errors) {
                errorMessage = Object.values(error.response.data.errors).flat().join('\n');
            }
            setAlert({ type: 'danger', message: errorMessage });
        } finally {
            setIsSubmitting(false);
        }
    };

    const openDelete = (category) => setSelected(category);
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [selected, setSelected] = useState(null);

    const confirmDelete = () => {
        setDeleteLoading(true);
        setAlert(null);
        router.delete(route('admin.category.delete', selected.id), {
            preserveState: true,
            onSuccess: () => {

                // const flash = page.props?.flash || {};
                setAlert({ type: 'success', message: 'Category deleted Successfully!' });
                // if (flash.success) {
                //     setAlert({ type: 'success', message: 'Design deleted Successfully!' });
                // } else if (flash.error) {
                //     setAlert({ type: 'danger', message: flash.error });
                // }
            },
            onError: (error) => {
                // show an error alert
                setAlert({
                    type: 'danger',
                    message: error?.response?.data?.error || 'Failed to delete category. Please try again.',
                });
            },
            onFinish: () => {
                setDeleteLoading(false);
                document.querySelector('#deleteCateModal .btn-close').click();
            },
        });
    };





    return (
        <>
            <Head title="Categories - Admin Dashboard" />
            <Meta title="Categories - Admin Dashboard" description="Manage categories" />

            <AdminDashboard userDetails={userDetails}>
                <Breadcrumb title="Manage Categories" />
                {alert && <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} />}
                <div className="card h-100 p-0 radius-12">
                    <div className="card-header border-bottom bg-base py-16 px-24 d-flex align-items-center flex-wrap gap-3 justify-content-between">
                        <div className="d-flex align-items-center flex-wrap gap-3">
                            <span className="text-md fw-medium text-secondary-light mb-0">Show</span>
                            <select
                                name="per_page"
                                className="form-select form-select-sm w-auto ps-12 py-6 radius-12 h-40-px"
                            // value={data.per_page}
                            // onChange={handleChange}
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
                            // value={data.search}
                            // onChange={handleChange}
                            />

                            <select
                                name="status"
                                className="form-select form-select-sm w-auto ps-12 py-6 radius-12 h-40-px"
                            // value={data.status}
                            // onChange={handleChange}
                            >
                                <option value="">All Status</option>
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                            </select>
                        </div>
                        <button
                            className="btn btn-primary text-sm btn-sm px-12 py-12 radius-8 d-flex align-items-center gap-2"
                            data-bs-toggle="modal"
                            data-bs-target="#addCateModal"
                            onClick={() => {
                                setModalMode('add');
                                setFormData({ name: '', description: '', status: 'active', image: null });
                                setPreview(null);
                                if (fileInputRef.current) fileInputRef.current.value = null;
                            }}
                        >
                            <Icon icon="ic:baseline-plus" className="icon text-xl line-height-1" />
                            Add New Category
                        </button>

                    </div>
                    <div className="card-body p-24">
                        <div className="table-responsive scroll-sm">
                            <table className="table bordered-table sm-table mb-0">
                                <thead>
                                    <tr>
                                        <th><input type="checkbox" className="form-check-input" /></th>
                                        <th>S.L</th>
                                        <th>Name</th>
                                        <th style={{ width: "250px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>Description</th>
                                        <th>Status</th>
                                        <th>Added by / Updated by</th>
                                        <th>No. of Products (contain)</th>
                                        <th className="text-center">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {categories.data.map((category, index) => (

                                        <tr key={category.id}>
                                            <td><input type="checkbox" className="form-check-input" /></td>
                                            <td>{index + 1}</td>
                                            <td>
                                                <div className="d-flex align-items-center">
                                                    {category.img_link ? (
                                                        <img
                                                            src={category.img_link}
                                                            alt={category.name}
                                                            className="w-40-px h-40-px rounded-circle flex-shrink-0 me-12 overflow-hidden"
                                                        />
                                                    ) : (
                                                        <Icon icon="tabler:category" className="w-40-px h-40-px rounded-circle flex-shrink-0 me-12 overflow-hidden tw-bg-gray-400 tw-p-2" />
                                                    )}
                                                    <span className="text-md mb-0 fw-normal text-secondary-light">{category.name}</span>
                                                </div>
                                            </td>
                                            <td>
                                                <div
                                                    className="tw-text-gray-500 tw-text-sm dark:tw-text-gray-400 tw-leading-relaxed tw-mt-3"
                                                    dangerouslySetInnerHTML={{
                                                        __html:
                                                            category.description ||
                                                            '-',
                                                    }}
                                                />
                                            </td>
                                            <td className='teext-center'>
                                                <span className={category.active ? 'bg-success-focus text-success-600 px-24 py-4 radius-4 fw-medium text-sm' : 'bg-danger-focus text-danger-600 px-24 py-4 radius-4 fw-medium text-sm'}>
                                                    {category.active ? ("Active") : ("Inactive")}
                                                </span>
                                            </td>
                                            <td>
                                                <div className="d-flex align-items-center">
                                                    {category.updater.profile_picture ? (
                                                        <img
                                                            src={category.updater.profile_picture}
                                                            alt={category.updater.name}
                                                            className="w-40-px h-40-px rounded-circle flex-shrink-0 me-12 overflow-hidden"
                                                        />
                                                    ) : (
                                                        <img
                                                            src='/assets/images/user.png'
                                                            alt={category.updater.name}
                                                            className="w-40-px h-40-px rounded-circle flex-shrink-0 me-12 overflow-hidden"
                                                        />
                                                    )}
                                                    <span className="text-md mb-0 fw-normal text-secondary-light">{category.updater.name}</span>
                                                </div>

                                            </td>
                                            <td className='text-center'>
                                                {category.products_count}
                                            </td>
                                            <td className="text-center">
                                                <div className="d-flex justify-content-center gap-10">
                                                    <button className="bg-info-focus bg-hover-info-200 text-info-600 fw-medium w-40-px h-40-px d-flex justify-content-center align-items-center rounded-circle" onClick={() => openCategoryModal(category, 'view')}>
                                                        <Icon icon="majesticons:eye-line" className="icon text-xl" />
                                                    </button>
                                                    <button className="bg-success-focus bg-hover-success-200 text-success-600 fw-medium w-40-px h-40-px d-flex justify-content-center align-items-center rounded-circle" onClick={() => openCategoryModal(category, 'edit')}>
                                                        <Icon icon="lucide:edit" className="menu-icon" />
                                                    </button>
                                                    <button className="remove-item-btn bg-danger-focus bg-hover-danger-200 text-danger-600 fw-medium w-40-px h-40-px d-flex justify-content-center align-items-center rounded-circle" data-bs-toggle="modal" data-bs-target="#deleteCateModal" onClick={() => openDelete(category)}>
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
                            <span>Showing {categories.from} to {categories.to} of {categories.total} entries</span>
                            <ul className="pagination d-flex flex-wrap align-items-center gap-2 justify-content-center">

                                {categories && categories.last_page > 1 && (
                                    <li className="page-item">
                                        <Link
                                            className="page-link bg-neutral-200 text-secondary-light fw-semibold radius-8 border-0 d-flex align-items-center justify-content-center h-32-px w-32-px text-md"
                                            href={categories.prev_page_url}
                                        >
                                            <Icon icon="ep:d-arrow-left" />
                                        </Link>
                                    </li>
                                )}
                                {Array.from({ length: categories.last_page }, (_, i) => i + 1).map((page) => (
                                    <li className="page-item" key={page}>
                                        <Link
                                            className={`page-link fw-semibold radius-8 border-0 d-flex align-items-center justify-content-center h-32-px w-32-px text-md ${page === categories.current_page
                                                ? "bg-primary-600 text-white"
                                                : "bg-neutral-200 text-secondary-light"
                                                }`}
                                            href={`?page=${page}`}
                                        >
                                            {page}
                                        </Link>
                                    </li>
                                ))}
                                {categories.current_page < categories.last_page && (
                                    <li className="page-item">
                                        <Link
                                            className="page-link bg-neutral-200 text-secondary-light fw-semibold radius-8 border-0 d-flex align-items-center justify-content-center h-32-px w-32-px text-md"
                                            href={categories.next_page_url}
                                        >
                                            <Icon icon="ep:d-arrow-right" />
                                        </Link>
                                    </li>
                                )}
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Add New Category Modal */}
                <div className="modal fade" id="addCateModal" tabIndex="-1" aria-labelledby="addCateModalLabel" aria-hidden="true">
                    <div className="modal-dialog modal-dialog-centered modal-lg">
                        <div className="modal-content radius-12">
                            <div className="modal-header">
                                <h5 className="modal-title">
                                    {modalMode === 'add' && "Add New Category"}
                                    {modalMode === 'edit' && "Edit Category"}
                                    {modalMode === 'view' && "View Category"}
                                </h5>

                                <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                            </div>
                            <div className="modal-body tw-bg-gray-50 tw-rounded-b-xl tw-px-6 tw-py-4">
                                <form onSubmit={(e) => {
                                    e.preventDefault();
                                    if (modalMode === 'add') handleAddCategory(e);
                                    else if (modalMode === 'edit') handleUpdateCategory(e);
                                }} className="tw-space-y-6">
                                    <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-2 tw-gap-6">
                                        {/* Category Name */}
                                        <div className="tw-flex tw-flex-col">
                                            <label className="tw-font-semibold tw-text-sm tw-text-gray-700">Category Name <span className="tw-text-red-500">*</span></label>
                                            <input
                                                type="text"
                                                name="name"
                                                className="tw-form-input tw-border tw-rounded-lg tw-py-2 tw-px-4 tw-mt-1 tw-text-sm"
                                                value={modalMode === 'add' ? formData.name : editData.name}
                                                onChange={(e) => {
                                                    const value = e.target.value;
                                                    if (modalMode === 'add') setFormData(prev => ({ ...prev, name: value }));
                                                    else if (modalMode === 'edit') setEditData(prev => ({ ...prev, name: value }));
                                                }}
                                                required
                                                readOnly={modalMode === 'view'}
                                                placeholder="e.g., Business Cards"
                                            />
                                        </div>

                                        {/* Status */}
                                        <div className="tw-flex tw-flex-col">
                                            <label className="tw-font-semibold tw-text-sm tw-text-gray-700 tw-mb-2">Status</label>
                                            <div className="d-flex align-items-center flex-wrap tw-gap-6">
                                                <div className="form-check checked-success d-flex align-items-center tw-gap-2">
                                                    <input
                                                        className="form-check-input"
                                                        type="radio"
                                                        name="status"
                                                        id={`status-active`}
                                                        value='active'
                                                        checked={(modalMode === 'add' ? formData.status : editData.status) === 'active'}
                                                        onChange={(e) => {
                                                            const value = e.target.value;
                                                            if (modalMode === 'add') setFormData(prev => ({ ...prev, status: value }));
                                                            else if (modalMode === 'edit') setEditData(prev => ({ ...prev, status: value }));
                                                        }}
                                                        disabled={modalMode === 'view'}
                                                    />
                                                    <label
                                                        className="form-check-label tw-font-medium tw-text-sm tw-text-gray-700 d-flex align-items-center tw-gap-1"
                                                        htmlFor="addStatusActive"
                                                    >
                                                        <span className="tw-w-2 tw-h-2 tw-rounded-full tw-bg-green-600" />
                                                        Active
                                                    </label>
                                                </div>
                                                <div className="form-check checked-danger d-flex align-items-center tw-gap-2">
                                                    <input
                                                        className="form-check-input"
                                                        type="radio"
                                                        name="status"
                                                        id={`status-inactive`}
                                                        value='inactive'
                                                        checked={(modalMode === 'add' ? formData.status : editData.status) === 'inactive'}
                                                        onChange={(e) => {
                                                            const value = e.target.value;
                                                            if (modalMode === 'add') setFormData(prev => ({ ...prev, status: value }));
                                                            else if (modalMode === 'edit') setEditData(prev => ({ ...prev, status: value }));
                                                        }}
                                                        disabled={modalMode === 'view'}
                                                    />
                                                    <label
                                                        className="form-check-label tw-font-medium tw-text-sm tw-text-gray-700 d-flex align-items-center tw-gap-1"
                                                        htmlFor="addStatusInactive"
                                                    >
                                                        <span className="tw-w-2 tw-h-2 tw-rounded-full tw-bg-red-600" />
                                                        Inactive
                                                    </label>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Description */}
                                    <div>
                                        <div className="border border-neutral-200 radius-8 overflow-hidden">
                                            <div className="height-200">
                                                <div id="toolbar-container">
                                                    <span className="ql-formats">
                                                        <select className="ql-font"></select>
                                                        <select className="ql-size"></select>
                                                    </span>
                                                    <span className="ql-formats">
                                                        <button className="ql-bold"></button>
                                                        <button className="ql-italic"></button>
                                                        <button className="ql-underline"></button>
                                                        <button className="ql-strike"></button>
                                                    </span>
                                                    <span className="ql-formats">
                                                        <select className="ql-color"></select>
                                                        <select className="ql-background"></select>
                                                    </span>
                                                    <span className="ql-formats">
                                                        <button className="ql-script" value="sub"></button>
                                                        <button className="ql-script" value="super"></button>
                                                    </span>
                                                    <span className="ql-formats">
                                                        <button className="ql-header" value="1"></button>
                                                        <button className="ql-header" value="2"></button>
                                                        <button className="ql-blockquote"></button>
                                                        <button className="ql-code-block"></button>
                                                    </span>
                                                    <span className="ql-formats">
                                                        <button className="ql-list" value="ordered"></button>
                                                        <button className="ql-list" value="bullet"></button>
                                                        <button className="ql-indent" value="-1"></button>
                                                        <button className="ql-indent" value="+1"></button>
                                                    </span>
                                                    <span className="ql-formats">
                                                        <button className="ql-direction" value="rtl"></button>
                                                        <select className="ql-align"></select>
                                                    </span>
                                                    <span className="ql-formats">
                                                        <button className="ql-link"></button>
                                                        <button className="ql-image"></button>
                                                        <button className="ql-video"></button>
                                                        <button className="ql-formula"></button>
                                                    </span>
                                                    <span className="ql-formats">
                                                        <button className="ql-clean"></button>
                                                    </span>
                                                </div>
                                                <ReactQuill
                                                    ref={quillRef}
                                                    theme="snow"
                                                    value={modalMode === 'add' ? formData.description : editData.description}
                                                    onChange={(value) => {
                                                        if (modalMode === 'add') setFormData(prev => ({ ...prev, description: value }));
                                                        else if (modalMode === 'edit') setEditData(prev => ({ ...prev, description: value }));
                                                    }}
                                                    readOnly={modalMode === 'view'}
                                                    modules={modules}
                                                    formats={formats}
                                                    placeholder="This category is used for..."
                                                />
                                            </div>
                                        </div>

                                    </div>

                                    {/* Image Upload */}
                                    {/* Image Upload with Drag & Drop and Preview */}
                                    {/* Image Upload with Drag & Drop and Preview */}
                                    <div className="tw-flex tw-flex-col tw-gap-2">
                                        <label className="tw-font-semibold tw-text-sm tw-text-gray-700">Category Image</label>

                                        {/* ✅ IMAGE PREVIEW */}
                                        {(modalMode === 'add' && preview) || (modalMode !== 'add' && (editPreview || selectedCategory?.img_link)) ? (
                                            <div className="tw-flex tw-items-center tw-gap-4 tw-mt-3 tw-w-[160px] tw-h-[200px]">
                                                <img
                                                    src={modalMode === 'add' ? preview : (editPreview || selectedCategory?.img_link)}
                                                    alt="Preview"
                                                    className="tw-w-full tw-h-full tw-object-cover tw-rounded-md tw-shadow"
                                                />
                                                {modalMode !== 'view' && (
                                                    <button type="button" onClick={() => {
                                                        if (modalMode === 'add') {
                                                            clearPreview();
                                                        } else {
                                                            setEditData(prev => ({ ...prev, image: null }));
                                                            setEditPreview(null);
                                                            if (editFileInputRef.current) editFileInputRef.current.value = null;
                                                        }
                                                    }} className="tw-text-sm tw-text-red-500 hover:tw-underline">
                                                        Remove Image
                                                    </button>
                                                )}
                                            </div>
                                        ) : null}

                                        {/* ✅ IMAGE UPLOADER */}
                                        {modalMode !== 'view' && (
                                            <div
                                                className={`upload-image-wrapper d-flex align-items-center tw-gap-3 tw-p-3 tw-border-2 tw-w-[160px] tw-h-[200px] tw-rounded-md tw-transition-all ${dragging
                                                    ? 'tw-bg-blue-50 tw-border-blue-400'
                                                    : 'tw-bg-neutral-50 tw-border-dashed tw-border-gray-300 '
                                                    }`}
                                                onDragEnter={onDragEnter}
                                                onDragOver={onDragOver}
                                                onDragLeave={onDragLeave}
                                                onDrop={(e) => {
                                                    onDrop(e);
                                                    if (modalMode !== 'add') {
                                                        const file = e.dataTransfer.files[0];
                                                        if (file && file.type.startsWith("image/")) {
                                                            setEditData(prev => ({ ...prev, image: file }));
                                                            const reader = new FileReader();
                                                            reader.onloadend = () => setEditPreview(reader.result);
                                                            reader.readAsDataURL(file);
                                                        }
                                                    }
                                                }}
                                                role="button"
                                                tabIndex={0}
                                                onClick={() => {
                                                    if (modalMode === 'add') fileInputRef.current?.click();
                                                    else editFileInputRef.current?.click();
                                                }}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter' || e.key === ' ') {
                                                        if (modalMode === 'add') fileInputRef.current?.click();
                                                        else editFileInputRef.current?.click();
                                                    }
                                                }}
                                            >
                                                <label
                                                    htmlFor="file-input"
                                                    className="d-flex flex-column align-items-center justify-content-center tw-text-center tw-w-full tw-h-full tw-cursor-pointer tw-select-none tw-gap-1"
                                                >
                                                    <Icon icon="solar:camera-outline" className="tw-text-2xl tw-text-secondary-light" />
                                                    <span className="tw-font-medium tw-text-sm tw-text-secondary-light">
                                                        Drag & Drop or Click to Upload. Size: 160x200px
                                                    </span>
                                                </label>
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    ref={modalMode === 'add' ? fileInputRef : editFileInputRef}
                                                    onChange={(e) => {
                                                        const file = e.target.files[0];
                                                        if (file && file.type.startsWith("image/")) {
                                                            if (modalMode === 'add') {
                                                                setFormData(prev => ({ ...prev, image: file }));
                                                                const reader = new FileReader();
                                                                reader.onloadend = () => setPreview(reader.result);
                                                                reader.readAsDataURL(file);
                                                            } else {
                                                                setEditData(prev => ({ ...prev, image: file }));
                                                                const reader = new FileReader();
                                                                reader.onloadend = () => setEditPreview(reader.result);
                                                                reader.readAsDataURL(file);
                                                            }
                                                        }
                                                    }}
                                                    hidden
                                                />
                                            </div>
                                        )}
                                    </div>



                                    {/* Submit Button */}
                                    <button
                                        type="submit"
                                        className="btn btn-primary d-flex justify-content-center align-items-center tw-w-full"
                                        disabled={isSubmitting}
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <span
                                                    className="spinner-border spinner-border-sm me-2 tw-w-4 tw-h-4"
                                                    role="status"
                                                    aria-hidden="true"
                                                />
                                                {modalMode === 'add' ? 'Adding...' : 'Updating...'}
                                            </>
                                        ) : (
                                            <>
                                                <Icon icon="material-symbols:upload-rounded" className="tw-text-lg" />
                                                {modalMode === 'add' ? 'Add Category' : 'Update Category'}
                                            </>
                                        )}
                                    </button>

                                </form>
                            </div>

                        </div>
                    </div>
                </div>


                {/* Delete Confirmation Modal */}
                <div className="modal fade" id="deleteCateModal" tabIndex={-1} aria-labelledby="deleteCateModalLabel" aria-hidden="true">
                    <div className="modal-dialog">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h1 className="modal-title fs-5 text-red-500" id="deleteCateModalLabel">Are you sure?</h1>
                                <button type="button" className="btn-close" data-bs-dismiss="modal"></button>
                            </div>
                            <div className="modal-body font-light">
                                <p>Do you really want to delete this category? This process cannot be undone.</p>
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


            </AdminDashboard >
        </>
    );
}

export default Category;
