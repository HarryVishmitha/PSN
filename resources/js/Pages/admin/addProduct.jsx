import React, { useState, useEffect, useRef, } from 'react';
import { Head, router } from '@inertiajs/react';
import AdminDashboard from '../../Layouts/AdminDashboard';
import Breadcrumb from "@/components/Breadcrumb";
import { Icon } from "@iconify/react";
import CookiesV from '@/Components/CookieConsent';
import Alert from "@/Components/Alert";
import Meta from "@/Components/Metaheads";
import hljs from "highlight.js";
import ReactQuill from "react-quill-new";

const AddProduct = ({ userDetails, workingGroups, categories }) => {
    const [alert, setAlert] = useState(null); // { type: 'success' | 'danger', message: string }
    const [currentStep, setCurrentStep] = useState(1);
    const [formDataArray, setFormDataArray] = useState([]);
    const [selectedWorkingGroup, setSelectedWorkingGroup] = useState('');
    const [errors, setErrors] = useState({}); // To capture errors for each step
    const [showCookieConsent, setShowCookieConsent] = useState(true);
    const [name, setName] = useState('');
    const [productDescription, setProductDescription] = useState('');
    const [seoTitle, setSeoTitle] = useState('');
    const [seoDescription, setSeoDescription] = useState('');
    const [selectedCategories, setSelectedCategories] = useState([]);
    const [loading, setLoading] = useState(false);

    // States for "Add New Category" modal
    const [newCategoryName, setNewCategoryName] = useState('');
    const [newCategoryDescription, setNewCategoryDescription] = useState('');
    const [modalErrors, setModalErrors] = useState({});
    const [modalLoading, setModalLoading] = useState(false);



    //Text Editor
    const quillRef = useRef(null);
    // const [value, setValue] = useState(``);
    const [isHighlightReady, setIsHighlightReady] = useState(false);

    useEffect(() => {
        // Load highlight.js configuration and signal when ready
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

    // eslint-disable-next-line no-unused-vars
    const handleSave = () => {
        const editorContent = quillRef.current.getEditor().root.innerHTML;
        console.log("Editor content:", editorContent);
    };

    // Quill editor modules with syntax highlighting (only load if highlight.js is ready)
    const modules = isHighlightReady
        ? {
            syntax: {
                highlight: (text) => hljs?.highlightAuto(text).value, // Enable highlight.js in Quill
            },
            toolbar: {
                container: "#toolbar-container", // Custom toolbar container
            },
        }
        : {
            toolbar: {
                container: "#toolbar-container", // Custom toolbar container
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

    const validateStepTwo = () => {
        const errors = {};

        if (!name || name.trim() === "") {
            errors.productName = "Please enter a product name.";
        }
        if (!productDescription || productDescription.trim() === "") {
            errors.productDescription = "Please enter a product description.";
        }
        if (!seoTitle || seoTitle.trim() === "") {
            errors.seoTitle = "Please enter a SEO title.";
        }
        if (!seoDescription || seoDescription.trim() === "") {
            errors.seoDescription = "Please enter a SEO description.";
        }

        return errors;
    };

    const nextStep = () => {
        if (currentStep === 1 && !selectedWorkingGroup) {
            setAlert({ type: 'danger', message: 'Please select a working group.' });
            setErrors({ workingGroup: 'Please select a working group.' });
            return;
        }
        // Capture data from the current step; for example, step 1 data:
        if (currentStep === 1) {
            // Append the working group selection to the array.
            setFormDataArray(prev => [...prev, { workingGroup: selectedWorkingGroup }]);
        }

        if (currentStep === 2) {
            const newErrors = validateStepTwo();
            if (Object.keys(newErrors).length > 0) {
                setErrors(newErrors);
                setAlert({ type: "danger", message: "Please enter all required fields" });
                return;
            }
            // Capture data from step 2 and add to the array.
            setFormDataArray(prev => [...prev, { productName: name, productDescription: productDescription, seoTitle: seoTitle, seoDescription: seoDescription }]);

        }

        setAlert(null);
        setErrors({}); // Clear errors
        if (currentStep < 5) {
            setCurrentStep(currentStep + 1);
        }
    };

    useEffect(() => {
        console.log('Form Data Array Updated:', formDataArray);
    }, [formDataArray]); // Runs whenever formDataArray changes

    const prevStep = () => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1);
        }
    };

    // Modal functions for adding a new category
    const resetCategoryForm = () => {
        setNewCategoryName('');
        setNewCategoryDescription('');
        setModalErrors({});
    };

    const handleAddCategory = async (e) => {
        e.preventDefault();
        setModalErrors({});
        if (!newCategoryName.trim()) {
            setModalErrors({ newCategoryName: 'Category name is required.' });
            return;
        }
        setModalLoading(true);
        try {
            const response = await axios.post('/admin/api/add-new-category', {
                newCategoryName: newCategoryName,
                description: newCategoryDescription,
            });
            // alert('Category added successfully');
            setAlert({ type: 'success', message: 'Category added successfully!' });
            document.querySelector('#addCat .btn-close').click();
            // Optionally update the categories list here
            // Optionally close the modal programmatically if desired
        } catch (error) {
            if (error.response && error.response.data && error.response.data.errors) {
                setModalErrors(error.response.data.errors);
                setAlert({ type: 'danger', message: 'Failed to add category. Please check the errors.' });
                console.log(error.response.data);
            } else {
                setModalErrors({ general: 'Backend error happened. Please try again later.' });
                setAlert({ type: 'danger', message: 'Failed to add category. Please try again later.' });
                // console.log(error.response ? error.response.data : error);
            }
        } finally {
            setModalLoading(false);
        }
    };

    // Reset modal form on modal hide
    useEffect(() => {
        const modalElement = document.getElementById('addCat');
        const handleModalHidden = () => {
            resetCategoryForm();
        };
        if (modalElement) {
            modalElement.addEventListener('hidden.bs.modal', handleModalHidden);
        }
        return () => {
            if (modalElement) {
                modalElement.removeEventListener('hidden.bs.modal', handleModalHidden);
            }
        };
    }, []);

    return (
        <>
            <Head title="Add New Product - Admin Dashboard" />
            <Meta title="Add New Product - Admin Dashboard" description='Add New Product to the system' />
            <AdminDashboard userDetails={userDetails}>
                <Breadcrumb title="Add New Product" />
                {alert && <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} />}

                <div className='card'>
                    <div className='card-body'>
                        {/* Form Wizard Start */}
                        <div className='form-wizard'>
                            <form action='#' method='post'>
                                <div className='form-wizard-header overflow-x-auto scroll-sm pb-8 my-32'>
                                    <ul className='list-unstyled form-wizard-list'>
                                        <li
                                            className={`form-wizard-list__item
                      ${[2, 3, 4, 5].includes(currentStep) && "activated"}
                    ${currentStep === 1 && "active"} `}
                                        >
                                            <div className='form-wizard-list__line'>
                                                <span className='count'>1</span>
                                            </div>
                                            <span className='text text-xs fw-semibold'>
                                                Select Working Group{" "}
                                            </span>
                                        </li>
                                        <li
                                            className={`form-wizard-list__item
                      ${[3, 4, 5].includes(currentStep) && "activated"}
                    ${currentStep === 2 && "active"} `}
                                        >
                                            <div className='form-wizard-list__line'>
                                                <span className='count'>2</span>
                                            </div>
                                            <span className='text text-xs fw-semibold'>
                                                Basic Information
                                            </span>
                                        </li>
                                        <li
                                            className={`form-wizard-list__item
                      ${[4, 5].includes(currentStep) && "activated"}
                    ${currentStep === 3 && "active"} `}
                                        >
                                            <div className='form-wizard-list__line'>
                                                <span className='count'>3</span>
                                            </div>
                                            <span className='text text-xs fw-semibold'>
                                                Add Product Category & more attributions
                                            </span>
                                        </li>
                                        <li
                                            className={`form-wizard-list__item
                      ${[5].includes(currentStep) && "activated"}
                    ${currentStep === 4 && "active"} `}
                                        >
                                            <div className='form-wizard-list__line'>
                                                <span className='count'>4</span>
                                            </div>
                                            <span className='text text-xs fw-semibold'>
                                                Pricing & Inventory
                                            </span>
                                        </li>
                                        <li
                                            className={`form-wizard-list__item

                    ${currentStep === 5 && "active"} `}
                                        >
                                            <div className='form-wizard-list__line'>
                                                <span className='count'>5</span>
                                            </div>
                                            <span className='text text-xs fw-semibold'>Review & Finish</span>
                                        </li>
                                    </ul>
                                </div>

                                {/* Step 1 */}
                                <fieldset
                                    className={`wizard-fieldset ${currentStep === 1 && "show"} `}
                                >
                                    <h6 className='text-md text-neutral-500 mb-3'>
                                        Working Group Information
                                    </h6>
                                    <div className='form-group mb-3'>
                                        <label className='form-label'>Select Category*</label>
                                        <div className='position-relative'>
                                            <select className={`form-control form-select ${errors.workingGroup ? 'is-invalid' : ''}`}
                                                value={selectedWorkingGroup}
                                                onChange={(e) => setSelectedWorkingGroup(e.target.value)}
                                            >
                                                <option value='' disabled>
                                                    Select a working group
                                                </option>
                                                {workingGroups.map((group) => (
                                                    <option key={group.id} value={group.id}>
                                                        {group.name}
                                                    </option>
                                                ))}
                                            </select>
                                            {/* <div className='wizard-form-error' /> */}
                                            <div className='wizard-form-error' />
                                            {errors.workingGroup && (
                                                <div className="invalid-feedback">{errors.workingGroup}</div>
                                            )}
                                        </div>
                                    </div>

                                    <div className='form-group d-flex align-items-center justify-content-end gap-8'>
                                        <button
                                            onClick={prevStep}
                                            type='button'
                                            className='form-wizard-previous-btn btn btn-neutral-500 border-neutral-100 px-32'
                                        >
                                            Back
                                        </button>
                                        <button
                                            onClick={nextStep}
                                            type='button'
                                            className='form-wizard-next-btn btn btn-primary-600 px-32'
                                        >
                                            Next
                                        </button>
                                    </div>
                                </fieldset>

                                {/* Step 2 */}
                                <fieldset
                                    className={`wizard-fieldset ${currentStep === 2 && "show"} `}
                                >
                                    <h6 className='text-md text-neutral-500'>
                                        Basic Product Information
                                    </h6>
                                    <div className='row gy-3'>
                                        <div className='col-12'>
                                            <label className='form-label'>Product Name*</label>
                                            <div className='position-relative'>
                                                <input
                                                    type='text'
                                                    className={`form-control ${errors.productName ? 'is-invalid' : ''} wizard-required`}
                                                    placeholder='Enter Product Name'
                                                    onChange={(e) => setName(e.target.value)}
                                                />
                                                <div className='wizard-form-error' />
                                                {errors.productName && (
                                                    <div className="invalid-feedback">{errors.productName}</div>
                                                )}
                                            </div>
                                        </div>
                                        <div className='col-12 mb-3'>
                                            <div>
                                                <label className='form-label fw-bold text-neutral-900'>
                                                    Product Description*
                                                </label>
                                                <div className='border border-neutral-200 radius-8 overflow-hidden'>
                                                    <div className='height-200'>
                                                        {/* Toolbar */}
                                                        <div id='toolbar-container'>
                                                            <span className='ql-formats'>
                                                                <select className='ql-font'></select>
                                                                <select className='ql-size'></select>
                                                            </span>
                                                            <span className='ql-formats'>
                                                                <button className='ql-bold'></button>
                                                                <button className='ql-italic'></button>
                                                                <button className='ql-underline'></button>
                                                                <button className='ql-strike'></button>
                                                            </span>
                                                            <span className='ql-formats'>
                                                                <select className='ql-color'></select>
                                                                <select className='ql-background'></select>
                                                            </span>
                                                            <span className='ql-formats'>
                                                                <button className='ql-script' value='sub'></button>
                                                                <button className='ql-script' value='super'></button>
                                                            </span>
                                                            <span className='ql-formats'>
                                                                <button className='ql-header' value='1'></button>
                                                                <button className='ql-header' value='2'></button>
                                                                <button className='ql-blockquote'></button>
                                                                <button className='ql-code-block'></button>
                                                            </span>
                                                            <span className='ql-formats'>
                                                                <button className='ql-list' value='ordered'></button>
                                                                <button className='ql-list' value='bullet'></button>
                                                                <button className='ql-indent' value='-1'></button>
                                                                <button className='ql-indent' value='+1'></button>
                                                            </span>
                                                            <span className='ql-formats'>
                                                                <button className='ql-direction' value='rtl'></button>
                                                                <select className='ql-align'></select>
                                                            </span>
                                                            <span className='ql-formats'>
                                                                <button className='ql-link'></button>
                                                                <button className='ql-image'></button>
                                                                <button className='ql-video'></button>
                                                                <button className='ql-formula'></button>
                                                            </span>
                                                            <span className='ql-formats'>
                                                                <button className='ql-clean'></button>
                                                            </span>
                                                        </div>

                                                        {/* Editor */}
                                                        <ReactQuill
                                                            ref={quillRef}
                                                            theme='snow'
                                                            value={productDescription}
                                                            onChange={setProductDescription}
                                                            modules={modules}
                                                            formats={formats}
                                                            placeholder='This product is specially made to...'
                                                            className={`${errors.productDescription ? 'is-invalid' : ''}`}
                                                            id='editor'
                                                        />
                                                    </div>
                                                </div>
                                                <div className='wizard-form-error' />
                                                {errors.productDescription && (
                                                    <div className="tw-text-red-500">{errors.productDescription}</div>
                                                )}
                                            </div>
                                        </div>
                                        <div className="col-sm-6 mt-1">
                                            <>
                                                <label className='form-label'>SEO title*</label>
                                                <textarea className={`form-control ${errors.seoTitle ? 'is-invalid' : ''}`} onChange={(e) => setSeoTitle(e.target.value)}></textarea>
                                                <div className='wizard-form-error' />
                                                {errors.seoTitle && (
                                                    <div className="invalid-feedback">{errors.seoTitle}</div>
                                                )}
                                            </>
                                        </div>
                                        <div className="col-sm-6 mt-1">
                                            <>
                                                <label className='form-label'>SEO description*</label>
                                                <textarea className={`form-control ${errors.seoDescription ? 'is-invalid' : ''}`} onChange={(e) => setSeoDescription(e.target.value)}></textarea>
                                                <div className='wizard-form-error' />
                                                {errors.seoDescription && (
                                                    <div className="invalid-feedback">{errors.seoDescription}</div>
                                                )}
                                            </>
                                        </div>
                                        <div className='form-group d-flex align-items-center justify-content-end gap-8'>
                                            <button
                                                onClick={prevStep}
                                                type='button'
                                                className='form-wizard-previous-btn btn btn-neutral-500 border-neutral-100 px-32'
                                            >
                                                Back
                                            </button>
                                            <button
                                                onClick={nextStep}
                                                type='button'
                                                className='form-wizard-next-btn btn btn-primary-600 px-32'
                                            >
                                                Next
                                            </button>
                                        </div>
                                    </div>
                                </fieldset>

                                {/* Step 3 */}
                                <fieldset className={`wizard-fieldset ${currentStep === 3 && "show"} `}>
                                    <h6 className='text-md tw-text-neutral-500'>Add product categories and other attributions</h6>
                                    <div className='tw-text-yellow-500'> Select at least one category for a product</div>
                                    <div className="form-group">
                                        <label className='form-label'>Select Categories*</label>
                                        {categories && categories.length > 0 ? (
                                            <select
                                                multiple
                                                value={selectedCategories}
                                                onChange={(e) => {
                                                    // Capture selected options as an array of IDs
                                                    const selected = Array.from(e.target.selectedOptions, option => option.value);
                                                    setSelectedCategories(selected);
                                                }}
                                                className={`form-control ${errors.categories ? 'is-invalid' : ''}`}
                                            >
                                                {categories.map(category => (
                                                    <option key={category.id} value={category.id}>
                                                        {category.name}
                                                    </option>
                                                ))}
                                            </select>
                                        ) : (
                                            <div className="tw-w-full tw-bg-neutral-100 tw-border tw-border-neutral-500 tw-rounded-lg tw-p-4 d-flex justify-content-center align-items-center gap-2 mb-3">
                                                <Icon icon="material-symbols:info" className="tw-text-2xl tw-text-neutral-500" />
                                                <p>No categories available</p>
                                            </div>
                                        )}
                                        <div className='wizard-form-error' />
                                        {errors.categories && (
                                            <div className="invalid-feedback">{errors.categories}</div>
                                        )}
                                        <div className="btn btn-outline-secondary mb-3" data-bs-toggle="modal" data-bs-target="#addCat">Add new category</div>
                                        <hr />

                                    </div>
                                    <div className='form-group d-flex align-items-center justify-content-end gap-8 mt-3'>
                                        <button
                                            onClick={prevStep}
                                            type='button'
                                            className='form-wizard-previous-btn btn btn-neutral-500 border-neutral-100 px-32'
                                        >
                                            Back
                                        </button>
                                        <button
                                            onClick={nextStep}
                                            type='button'
                                            className='form-wizard-next-btn btn btn-primary-600 px-32'
                                        >
                                            Next
                                        </button>
                                    </div>
                                </fieldset>

                            </form>
                        </div>
                        {/* Form Wizard End */}
                    </div>
                </div>

                <div className="modal fade" id="addCat" tabIndex={-1} aria-labelledby="addCatLabel" aria-hidden="true">
                    <div className="modal-dialog modal-lg modal-dialog-centered">
                        <div className="modal-content radius-16 bg-base">
                            <div className="modal-header py-16 px-24 border-0">
                                <h5 className="modal-title fs-5" id="addCatLabel">
                                    Add New Category
                                </h5>
                                <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close" />
                            </div>
                            <div className="modal-body px-24">
                                <form onSubmit={handleAddCategory}>
                                    <div className="mb-3">
                                        <label htmlFor="categoryName" className="form-label">
                                            Category Name*
                                        </label>
                                        <input
                                            type="text"
                                            id="categoryName"
                                            className={`form-control ${modalErrors.newCategoryName ? 'is-invalid' : ''}`}
                                            placeholder="Enter category name"
                                            value={newCategoryName}
                                            onChange={(e) => setNewCategoryName(e.target.value)}
                                        />
                                        {modalErrors.newCategoryName && <div className="invalid-feedback">{modalErrors.newCategoryName}</div>}
                                    </div>
                                    <div className="mb-3">
                                        <label htmlFor="categoryDescription" className="form-label">
                                            Category Description
                                        </label>
                                        <textarea
                                            id="categoryDescription"
                                            className="form-control"
                                            placeholder="Enter category description (optional)"
                                            value={newCategoryDescription}
                                            onChange={(e) => setNewCategoryDescription(e.target.value)}
                                        />
                                    </div>
                                    {modalErrors.general && <div className="alert alert-danger">{modalErrors.general}</div>}
                                    <div className="modal-footer px-24">
                                        <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">
                                            Cancel
                                        </button>
                                        <button type="submit" className="btn btn-primary" disabled={modalLoading}>
                                            {modalLoading ? 'Saving...' : 'Save Category'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            </AdminDashboard>
            <CookiesV />
        </>
    );

};

export default AddProduct;
