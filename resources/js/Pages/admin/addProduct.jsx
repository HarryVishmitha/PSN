import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Head, router } from '@inertiajs/react';
import AdminDashboard from '../../Layouts/AdminDashboard';
import Breadcrumb from "@/components/Breadcrumb";
import { Icon } from "@iconify/react";
import CookiesV from '@/Components/CookieConsent';
import Alert from "@/Components/Alert";
import Meta from "@/Components/Metaheads";
import hljs from "highlight.js";
import ReactQuill from "react-quill-new";
import 'react-quill-new/dist/quill.snow.css';
import ReactSelect from 'react-select';

const AddProduct = ({ userDetails, workingGroups, categories, providers }) => {
    // Global states
    const [alert, setAlert] = useState(null); // { type: 'success' | 'danger', message: string }
    const [currentStep, setCurrentStep] = useState(1);
    const [formDataArray, setFormDataArray] = useState([]);
    const [selectedWorkingGroup, setSelectedWorkingGroup] = useState('');
    const [errors, setErrors] = useState({});
    const [showCookieConsent, setShowCookieConsent] = useState(true);
    const [name, setName] = useState('');
    const [productDescription, setProductDescription] = useState('');
    const [seoTitle, setSeoTitle] = useState('');
    const [seoDescription, setSeoDescription] = useState('');
    // Instead of using the prop directly, we set categories into a state variable
    const [categoriesState, setCategoriesState] = useState(categories);
    const [selectedCategories, setSelectedCategories] = useState([]);
    const [loading, setLoading] = useState(false);

    // Modal for adding new category
    const [newCategoryName, setNewCategoryName] = useState('');
    const [newCategoryDescription, setNewCategoryDescription] = useState('');
    const [modalErrors, setModalErrors] = useState({});
    const [modalLoading, setModalLoading] = useState(false);

    // Global product fields (if no variants)
    const [basePrice, setBasePrice] = useState('');
    const [globalQuantity, setGlobalQuantity] = useState('');
    const [globalReorderThreshold, setGlobalReorderThreshold] = useState('');
    const [globalProvider, setGlobalProvider] = useState(''); // Provider as select
    const [globalUnitDetails, setGlobalUnitDetails] = useState('');

    // Pricing Method (new state)
    const [pricingMethod, setPricingMethod] = useState('standard'); // "standard" (piece based) or "roll"
    // Roll based price per square foot (only applicable if pricingMethod is "roll")
    const [pricePerSqft, setPricePerSqft] = useState('');

    // Variants state and toggle for variants (only applicable for standard pricing)
    const [hasVariants, setHasVariants] = useState(false);
    const [variants, setVariants] = useState([]);

    // Images state for product images
    const [uploadedImages, setUploadedImages] = useState([]);

    //Check for saved inputs
    useEffect(() => {
        const storedData = localStorage.getItem("addProductFormData");
        if (storedData) {
            const parsedData = JSON.parse(storedData);
            if (parsedData.selectedWorkingGroup) setSelectedWorkingGroup(parsedData.selectedWorkingGroup);
            if (parsedData.name) setName(parsedData.name);
            if (parsedData.productDescription) setProductDescription(parsedData.productDescription);
            if (parsedData.seoTitle) setSeoTitle(parsedData.seoTitle);
            if (parsedData.seoDescription) setSeoDescription(parsedData.seoDescription);
            if (parsedData.selectedCategories) setSelectedCategories(parsedData.selectedCategories);
            if (parsedData.basePrice) setBasePrice(parsedData.basePrice);
            if (parsedData.globalQuantity) setGlobalQuantity(parsedData.globalQuantity);
            if (parsedData.globalReorderThreshold) setGlobalReorderThreshold(parsedData.globalReorderThreshold);
            if (parsedData.globalProvider) setGlobalProvider(parsedData.globalProvider);
            if (parsedData.globalUnitDetails) setGlobalUnitDetails(parsedData.globalUnitDetails);
            if (parsedData.pricingMethod) setPricingMethod(parsedData.pricingMethod);
            if (parsedData.pricePerSqft) setPricePerSqft(parsedData.pricePerSqft);
            if (parsedData.hasVariants !== undefined) setHasVariants(parsedData.hasVariants);
            if (parsedData.variants) setVariants(parsedData.variants);
            if (parsedData.uploadedImages) setUploadedImages(parsedData.uploadedImages);
            if (parsedData.currentStep) setCurrentStep(parsedData.currentStep);
            if (parsedData.formDataArray) setFormDataArray(parsedData.formDataArray);
        }
    }, []);


    // --- Image functions ---
    const handleFileChange = (e) => {
        const files = Array.from(e.target.files);
        const newImages = files.map((file) => ({
            src: URL.createObjectURL(file),
            file,
            isPrimary: false,
        }));
        setUploadedImages((prev) => [...prev, ...newImages]);
        e.target.value = '';
    };

    const removeImage = (src) => {
        setUploadedImages((prev) => prev.filter((image) => image.src !== src));
        URL.revokeObjectURL(src);
    };

    // Set a given image as primary (only one can be primary)
    const setPrimaryImage = (index) => {
        const newImages = uploadedImages.map((img, i) => ({
            ...img,
            isPrimary: i === index,
        }));
        setUploadedImages(newImages);
    };

    // Reorder functions: move image up or down
    const moveImageUp = (index) => {
        if (index === 0) return;
        const newImages = [...uploadedImages];
        [newImages[index - 1], newImages[index]] = [newImages[index], newImages[index - 1]];
        setUploadedImages(newImages);
    };

    const moveImageDown = (index) => {
        if (index === uploadedImages.length - 1) return;
        const newImages = [...uploadedImages];
        [newImages[index], newImages[index + 1]] = [newImages[index + 1], newImages[index]];
        setUploadedImages(newImages);
    };

    // Add a new variant with inventory fields (provider & unitDetails added)
    const addVariant = () => {
        setVariants([
            ...variants,
            {
                name: '',
                value: '',
                priceAdjustment: '',
                hasSubvariants: false,
                inventory: {
                    quantity: '',
                    reorderThreshold: '',
                    provider: '',
                    unitDetails: ''
                },
                subvariants: []
            },
        ]);
    };

    const removeVariant = (index) => {
        setVariants(variants.filter((_, i) => i !== index));
    };

    const handleVariantChange = (index, field, value) => {
        const updated = [...variants];
        updated[index][field] = value;
        setVariants(updated);
    };

    // Add a new subvariant with inventory fields (provider & unitDetails added)
    // Note the new "value" field included for subvariants.
    const addSubvariant = (vIndex) => {
        const updated = [...variants];
        updated[vIndex].subvariants.push({
            name: '',
            value: '', // New subvariant value field
            priceAdjustment: '',
            inventory: {
                quantity: '',
                reorderThreshold: '',
                provider: '',
                unitDetails: ''
            }
        });
        setVariants(updated);
    };

    const handleSubvariantChange = (vIndex, sIndex, field, value) => {
        const updated = [...variants];
        updated[vIndex].subvariants[sIndex][field] = value;
        setVariants(updated);
    };

    // Remove subvariant helper
    const removeSubvariant = (vIndex, sIndex) => {
        const updated = [...variants];
        updated[vIndex].subvariants = updated[vIndex].subvariants.filter((_, i) => i !== sIndex);
        setVariants(updated);
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

    // Handle saving editor content
    const handleSave = () => {
        const editorContent = quillRef.current.getEditor().root.innerHTML;
        console.log("Editor content:", editorContent);
    };

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

    // Validation for Step 2 (Basic Product Information)
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

    // Validation for Pricing Section (Step 4)
    const validatePricing = () => {
        const pricingErrors = {};
        if (pricingMethod === 'standard') {
            if (!basePrice || isNaN(basePrice) || Number(basePrice) <= 0) {
                pricingErrors.basePrice = "Base price is required and must be greater than 0.";
            }
            if (!hasVariants) {
                if (globalQuantity === '' || isNaN(globalQuantity) || Number(globalQuantity) < 0) {
                    pricingErrors.globalQuantity = "Quantity is required and must be non-negative.";
                }
                if (globalReorderThreshold === '' || isNaN(globalReorderThreshold) || Number(globalReorderThreshold) < 0) {
                    pricingErrors.globalReorderThreshold = "Reorder threshold is required and must be non-negative.";
                }
                if (!globalProvider) {
                    pricingErrors.globalProvider = "Provider is required.";
                }
            } else {
                variants.forEach((variant, vIndex) => {
                    if (!variant.name.trim()) {
                        pricingErrors[`variant_${vIndex}_name`] = "Variant name is required.";
                    }
                    if (!variant.value.trim()) {
                        pricingErrors[`variant_${vIndex}_value`] = "Variant value is required.";
                    }
                    if (variant.priceAdjustment === '') {
                        pricingErrors[`variant_${vIndex}_priceAdjustment`] = "Variant price adjustment is required.";
                    }
                    if (!variant.hasSubvariants) {
                        if (variant.inventory.quantity === '' || isNaN(variant.inventory.quantity) || Number(variant.inventory.quantity) < 0) {
                            pricingErrors[`variant_${vIndex}_quantity`] = "Inventory quantity is required and must be non-negative.";
                        }
                        if (variant.inventory.reorderThreshold === '' || isNaN(variant.inventory.reorderThreshold) || Number(variant.inventory.reorderThreshold) < 0) {
                            pricingErrors[`variant_${vIndex}_reorderThreshold`] = "Reorder threshold is required and must be non-negative.";
                        }
                        if (!variant.inventory.provider) {
                            pricingErrors[`variant_${vIndex}_provider`] = "Provider is required.";
                        }
                    } else {
                        variant.subvariants.forEach((subvariant, sIndex) => {
                            if (!subvariant.name.trim()) {
                                pricingErrors[`variant_${vIndex}_subvariant_${sIndex}_name`] = "Subvariant name is required.";
                            }
                            if (!subvariant.value.trim()) {
                                pricingErrors[`variant_${vIndex}_subvariant_${sIndex}_value`] = "Subvariant value is required.";
                            }
                            if (subvariant.priceAdjustment === '') {
                                pricingErrors[`variant_${vIndex}_subvariant_${sIndex}_priceAdjustment`] = "Subvariant price adjustment is required.";
                            }
                            if (subvariant.inventory.quantity === '' || isNaN(subvariant.inventory.quantity) || Number(subvariant.inventory.quantity) < 0) {
                                pricingErrors[`variant_${vIndex}_subvariant_${sIndex}_quantity`] = "Inventory quantity is required and must be non-negative.";
                            }
                            if (subvariant.inventory.reorderThreshold === '' || isNaN(subvariant.inventory.reorderThreshold) || Number(subvariant.inventory.reorderThreshold) < 0) {
                                pricingErrors[`variant_${vIndex}_subvariant_${sIndex}_reorderThreshold`] = "Reorder threshold is required and must be non-negative.";
                            }
                            if (!subvariant.inventory.provider) {
                                pricingErrors[`variant_${vIndex}_subvariant_${sIndex}_provider`] = "Provider is required.";
                            }
                        });
                    }
                });
            }
        } else if (pricingMethod === 'roll') {
            if (!pricePerSqft || isNaN(pricePerSqft) || Number(pricePerSqft) <= 0) {
                pricingErrors.pricePerSqft = "Price per square foot is required and must be greater than 0.";
            }
            if (hasVariants) {
                pricingErrors.hasVariants = "Roll based products should not have variants.";
            }
        }
        return pricingErrors;
    };

    const nextStep = () => {
        if (currentStep === 1 && !selectedWorkingGroup) {
            setAlert({ type: 'danger', message: 'Please select a working group.' });
            setErrors({ workingGroup: 'Please select a working group.' });
            return;
        }
        if (currentStep === 1) {
            setFormDataArray(prev => [...prev, { workingGroup: selectedWorkingGroup }]);
        }
        if (currentStep === 2) {
            const newErrors = validateStepTwo();
            if (Object.keys(newErrors).length > 0) {
                setErrors(newErrors);
                setAlert({ type: "danger", message: "Please enter all required fields" });
                return;
            }
            setFormDataArray(prev => [...prev, { productName: name, productDescription, seoTitle, seoDescription }]);
        }
        if (currentStep === 3) {
            if (selectedCategories.length === 0) {
                setAlert({ type: 'danger', message: 'Please select at least one category.' });
                setErrors({ categories: 'Please select at least one category.' });
                return;
            }
            setFormDataArray(prev => [...prev, { categories: selectedCategories.map(cat => cat.value) }]);
        }
        if (currentStep === 4) {
            const pricingErrors = validatePricing();
            if (Object.keys(pricingErrors).length > 0) {
                setErrors(pricingErrors);
                setAlert({ type: 'danger', message: 'Please fill all required pricing fields.' });
                return;
            }
            // Save pricing details
            setFormDataArray(prev => [
                ...prev,
                {
                    pricingMethod,
                    basePrice,
                    pricePerSqft,
                    hasVariants,
                    variants,
                    globalQuantity,
                    globalReorderThreshold,
                    globalProvider,
                    globalUnitDetails
                }
            ]);
        }
        if (currentStep === 5) {
            // Validate that at least one image is uploaded
            if (uploadedImages.length === 0) {
                setAlert({ type: 'danger', message: 'Please upload at least one image.' });
                return;
            }
            // Reorder images so that the primary image goes first
            const primaryIndex = uploadedImages.findIndex(img => img.isPrimary);
            let sortedImages = [];
            if (primaryIndex === -1) {
                // No primary selected, automatically mark first image as primary
                sortedImages = [...uploadedImages];
                sortedImages[0].isPrimary = true;
            } else {
                const primaryImage = uploadedImages[primaryIndex];
                sortedImages = [primaryImage, ...uploadedImages.filter((img, i) => i !== primaryIndex)];
            }
            setFormDataArray(prev => [...prev, { images: sortedImages }]);
        }
        setAlert(null);
        setErrors({});
        if (currentStep < 6) {
            setCurrentStep(currentStep + 1);
        }
    };

    useEffect(() => {
        console.log('Form Data Array Updated:', formDataArray);
    }, [formDataArray]);

    const prevStep = () => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1);
        }
    };

    //Save inputs to localStorage
    useEffect(() => {
        const data = {
            selectedWorkingGroup,
            name,
            productDescription,
            seoTitle,
            seoDescription,
            selectedCategories,
            basePrice,
            globalQuantity,
            globalReorderThreshold,
            globalProvider,
            globalUnitDetails,
            pricingMethod,
            pricePerSqft,
            hasVariants,
            variants,
            uploadedImages,
            currentStep,
            formDataArray
        };
        localStorage.setItem("addProductFormData", JSON.stringify(data));
    }, [
        selectedWorkingGroup,
        name,
        productDescription,
        seoTitle,
        seoDescription,
        selectedCategories,
        basePrice,
        globalQuantity,
        globalReorderThreshold,
        globalProvider,
        globalUnitDetails,
        pricingMethod,
        pricePerSqft,
        hasVariants,
        variants,
        uploadedImages,
        currentStep,
        formDataArray
    ]);


    // Function to fetch updated categories list from the backend
    const getCategories = async () => {
        try {
            const response = await axios.get('/admin/api/json-categories');
            // Assuming the API returns an object with a "categories" key
            setCategoriesState(response.data.categories);
        } catch (error) {
            console.error('Error fetching categories:', error);
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
            await axios.post('/admin/api/add-new-category', {
                newCategoryName,
                description: newCategoryDescription,
            });
            setAlert({ type: 'success', message: 'Category added successfully!' });
            document.querySelector('#addCat .btn-close').click();
            // Fetch updated categories so that the form reflects the new category without reloading
            getCategories();
        } catch (error) {
            if (error.response && error.response.data && error.response.data.errors) {
                setModalErrors(error.response.data.errors);
                setAlert({ type: 'danger', message: 'Failed to add category. Please check the errors.' });
                console.log(error.response.data);
            } else {
                setModalErrors({ general: 'Backend error happened. Please try again later.' });
                setAlert({ type: 'danger', message: 'Failed to add category. Please try again later.' });
            }
        } finally {
            setModalLoading(false);
        }
    };

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

    // Map current categoriesState to options for ReactSelect
    const categoryOptions = categoriesState.map(cat => ({
        value: cat.id,
        label: cat.name,
    }));

    // Build a user-friendly summary for review
    // Get selected working group name
    const workingGroupName = workingGroups.find(group => group.id === selectedWorkingGroup)?.name;
    // Get selected category names
    const selectedCategoryNames = formDataArray[2]?.categories?.map(catId => {
        const cat = categoriesState.find(c => c.id === catId);
        return cat ? cat.name : catId;
    });

    // Get basic info from formDataArray[1]
    const basicInfo = formDataArray[1] || {};

    // Get pricing info from formDataArray[3]
    const pricingInfo = formDataArray[3] || {};

    // Get images info from formDataArray[4]
    const imagesInfo = formDataArray[4]?.images || [];


    //Product submission
    const handleFormsubmit = (e) => {
        e.preventDefault();
        setLoading(true);
        const data = new FormData();
        data.append('workingGroup', selectedWorkingGroup);
        data.append('productName', name);
        data.append('productDescription', productDescription);
        data.append('seoTitle', seoTitle);
        data.append('seoDescription', seoDescription);
        data.append('pricingMethod', pricingMethod);
        if (pricingMethod === 'standard') {
            data.append('basePrice', basePrice);

            if (hasVariants) {
                data.append('hasVariants', hasVariants);
                data.append('variants', JSON.stringify(variants));
            } else {
                data.append('hasVariants', hasVariants);
                data.append('globalQuantity', globalQuantity);
                data.append('globalReorderThreshold', globalReorderThreshold);
                data.append('globalProvider', globalProvider);
                data.append('globalUnitDetails', globalUnitDetails);
            }
        }
        else if (pricingMethod === 'roll') {
            data.append('hasVariants', hasVariants);
            data.append('pricePerSqft', pricePerSqft);
        }
        data.append('pricePerSqft', pricePerSqft || '0');
        data.append('categories', JSON.stringify(selectedCategories.map(cat => cat.value)));
        // Process images: Ensure the primary image is the first image
        const primaryIndex = uploadedImages.findIndex(img => img.isPrimary);
        let sortedImages = [];
        if (primaryIndex === -1) {
            sortedImages = [...uploadedImages];
            // If no primary is selected, mark the first one as primary
            sortedImages[0].isPrimary = true;
        } else {
            const primaryImage = uploadedImages[primaryIndex];
            sortedImages = [primaryImage, ...uploadedImages.filter((img, i) => i !== primaryIndex)];
        }

        console.log('Sorted Images:', sortedImages);

        // Append each image file along with its metadata
        sortedImages.forEach((image, index) => {
            // Append the file object
            data.append(`images[${index}][file]`, image.file);
            // Append the order (here, simply the array index)
            data.append(`images[${index}][order]`, index);
            // Append the primary flag (1 if true, 0 if false)
            data.append(`images[${index}][is_primary]`, image.isPrimary ? 1 : 0);
        });

        router.post(route('admin.storeProduct'), data, {
            preserveState: true,
            onSuccess: () => {
                setAlert({ type: 'success', message: 'Product added successfully!' });
                localStorage.removeItem("addProductFormData");
                console.log('Product added successfully!');
                router.get(route('admin.products'));
            },
            onError: (errors) => {
                setErrors(errors);
                setAlert({ type: 'danger', message: 'Failed to add product. Please check the errors.' });
                console.log(errors);
            },
            onFinish: () => {
                setLoading(false);

            }

        });

    }
    return (
        <>
            <Head title="Add New Product - Admin Dashboard" />
            <Meta title="Add New Product - Admin Dashboard" description="Add New Product to the system" />
            <AdminDashboard userDetails={userDetails}>
                <Breadcrumb title="Add New Product" />
                {alert && <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} />}

                <div className="card">
                    <div className="card-body">
                        {errors && Object.keys(errors).length > 0 && (
                            <div
                                className="alert alert-danger bg-danger-100 text-danger-600 border-danger-600 border-start-width-4-px border-top-0 border-end-0 border-bottom-0 px-24 py-13 mb-0 fw-semibold text-lg radius-4 d-flex align-items-center justify-content-between"
                                role="alert"
                            >
                                <ol>
                                    {Object.values(errors).map((error, index) => (
                                        <li key={index}>{error}</li>
                                    ))}
                                </ol>
                            </div>
                        )}
                        <div className="form-wizard">
                            <form onSubmit={handleFormsubmit} className="form-wizard-form">
                                <div className="form-wizard-header overflow-x-auto scroll-sm pb-8 my-32">
                                    <ul className="list-unstyled form-wizard-list">
                                        <li className={`form-wizard-list__item ${[2, 3, 4, 5, 6].includes(currentStep) && "activated"} ${currentStep === 1 && "active"}`}>
                                            <div className="form-wizard-list__line">
                                                <span className="count">1</span>
                                            </div>
                                            <span className="text text-xs fw-semibold">Select Working Group</span>
                                        </li>
                                        <li className={`form-wizard-list__item ${[3, 4, 5, 6].includes(currentStep) && "activated"} ${currentStep === 2 && "active"}`}>
                                            <div className="form-wizard-list__line">
                                                <span className="count">2</span>
                                            </div>
                                            <span className="text text-xs fw-semibold">Basic Information</span>
                                        </li>
                                        <li className={`form-wizard-list__item ${[4, 5, 6].includes(currentStep) && "activated"} ${currentStep === 3 && "active"}`}>
                                            <div className="form-wizard-list__line">
                                                <span className="count">3</span>
                                            </div>
                                            <span className="text text-xs fw-semibold">Categorizing</span>
                                        </li>
                                        <li className={`form-wizard-list__item ${[5, 6].includes(currentStep) && "activated"} ${currentStep === 4 && "active"}`}>
                                            <div className="form-wizard-list__line">
                                                <span className="count">4</span>
                                            </div>
                                            <span className="text text-xs fw-semibold">Pricing &amp; Inventory</span>
                                        </li>
                                        <li className={`form-wizard-list__item ${[6].includes(currentStep) && "activated"} ${currentStep === 5 && "active"}`}>
                                            <div className="form-wizard-list__line">
                                                <span className="count">5</span>
                                            </div>
                                            <span className="text text-xs fw-semibold">Images</span>
                                        </li>
                                        <li className={`form-wizard-list__item ${currentStep === 6 && "active"}`}>
                                            <div className="form-wizard-list__line">
                                                <span className="count">6</span>
                                            </div>
                                            <span className="text text-xs fw-semibold">Review &amp; Finish</span>
                                        </li>
                                    </ul>
                                </div>

                                {/* Step 1: Working Group */}
                                <fieldset className={`wizard-fieldset ${currentStep === 1 && "show"}`}>
                                    <h6 className="text-md text-neutral-500 mb-3">Working Group Information</h6>
                                    <div className="form-group mb-3">
                                        <label className="form-label">Select Category*</label>
                                        <div className="position-relative">
                                            <select className={`form-control form-select ${errors.workingGroup ? 'is-invalid' : ''}`}
                                                value={selectedWorkingGroup}
                                                onChange={(e) => setSelectedWorkingGroup(e.target.value)}
                                            >
                                                <option value="" disabled>Select a working group</option>
                                                {workingGroups.map((group) => (
                                                    <option key={group.id} value={group.id}>{group.name}</option>
                                                ))}
                                            </select>
                                            {errors.workingGroup && (
                                                <div className="invalid-feedback">{errors.workingGroup}</div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="form-group d-flex align-items-center justify-content-end gap-8">
                                        <button onClick={prevStep} type="button" className="form-wizard-previous-btn btn btn-neutral-500 border-neutral-100 px-32">Back</button>
                                        <button onClick={nextStep} type="button" className="form-wizard-next-btn btn btn-primary-600 px-32">Next</button>
                                    </div>
                                </fieldset>

                                {/* Step 2: Basic Product Information */}
                                <fieldset className={`wizard-fieldset ${currentStep === 2 && "show"}`}>
                                    <h6 className="text-md text-neutral-500">Basic Product Information</h6>
                                    <div className="row gy-3">
                                        <div className="col-12">
                                            <label className="form-label">Product Name*</label>
                                            <div className="position-relative">
                                                <input
                                                    type="text"
                                                    className={`form-control ${errors.productName ? 'is-invalid' : ''} wizard-required`}
                                                    placeholder="Enter Product Name"
                                                    onChange={(e) => setName(e.target.value)}
                                                />
                                                {errors.productName && (
                                                    <div className="invalid-feedback">{errors.productName}</div>
                                                )}
                                            </div>
                                        </div>
                                        <div className="col-12 mb-3">
                                            <div>
                                                <label className="form-label fw-bold text-neutral-900">Product Description*</label>
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
                                                            value={productDescription}
                                                            onChange={setProductDescription}
                                                            modules={modules}
                                                            formats={formats}
                                                            placeholder="This product is specially made to..."
                                                            className={`${errors.productDescription ? 'is-invalid' : ''}`}
                                                            id="editor"
                                                        />
                                                    </div>
                                                </div>
                                                {errors.productDescription && (
                                                    <div className="tw-text-red-500">{errors.productDescription}</div>
                                                )}
                                            </div>
                                        </div>
                                        <div className="col-sm-6 mt-1">
                                            <label className="form-label">SEO title*</label>
                                            <textarea className={`form-control ${errors.seoTitle ? 'is-invalid' : ''}`} onChange={(e) => setSeoTitle(e.target.value)}></textarea>
                                            {errors.seoTitle && (
                                                <div className="invalid-feedback">{errors.seoTitle}</div>
                                            )}
                                        </div>
                                        <div className="col-sm-6 mt-1">
                                            <label className="form-label">SEO description*</label>
                                            <textarea className={`form-control ${errors.seoDescription ? 'is-invalid' : ''}`} onChange={(e) => setSeoDescription(e.target.value)}></textarea>
                                            {errors.seoDescription && (
                                                <div className="invalid-feedback">{errors.seoDescription}</div>
                                            )}
                                        </div>
                                        <div className="form-group d-flex align-items-center justify-content-end gap-8">
                                            <button onClick={prevStep} type="button" className="form-wizard-previous-btn btn btn-neutral-500 border-neutral-100 px-32">Back</button>
                                            <button onClick={nextStep} type="button" className="form-wizard-next-btn btn btn-primary-600 px-32">Next</button>
                                        </div>
                                    </div>
                                </fieldset>

                                {/* Step 3: Categorizing */}
                                <fieldset className={`wizard-fieldset ${currentStep === 3 && "show"}`}>
                                    <h6 className="text-md tw-text-neutral-500">Add product categories and other attributions</h6>
                                    <div className="tw-text-yellow-500">Select at least one category for a product</div>
                                    <div className="form-group mb-3">
                                        <label className="form-label">Select Categories*</label>
                                        {categoriesState && categoriesState.length > 0 ? (
                                            <ReactSelect
                                                isMulti
                                                options={categoryOptions}
                                                value={selectedCategories}
                                                onChange={(selectedOptions) => setSelectedCategories(selectedOptions)}
                                                classNamePrefix="react-select mb-3"
                                            />
                                        ) : (
                                            <div className="tw-w-full tw-bg-neutral-100 tw-border tw-border-neutral-500 tw-rounded-lg tw-p-4 d-flex justify-content-center align-items-center gap-2 mb-3">
                                                <Icon icon="material-symbols:info" className="tw-text-2xl tw-text-neutral-500" />
                                                <p>No categories available</p>
                                            </div>
                                        )}
                                        {errors.categories && (
                                            <div className="invalid-feedback">{errors.categories}</div>
                                        )}
                                        <div className="btn btn-outline-secondary mb-3 mt-3 d-flex align-items-center tw-w-52 justify-content-center tw-gap-1" data-bs-toggle="modal" data-bs-target="#addCat">
                                            <Icon icon="ic:outline-add" width="24px" />
                                            Add new category
                                        </div>
                                        <hr />
                                    </div>
                                    <div className="form-group d-flex align-items-center justify-content-end gap-8 mt-3">
                                        <button onClick={prevStep} type="button" className="form-wizard-previous-btn btn btn-neutral-500 border-neutral-100 px-32">Back</button>
                                        <button onClick={nextStep} type="button" className="form-wizard-next-btn btn btn-primary-600 px-32">Next</button>
                                    </div>
                                </fieldset>

                                {/* Step 4: Pricing & Inventory */}
                                <fieldset className={`wizard-fieldset ${currentStep === 4 && "show"}`}>
                                    <h6 className="tw-text-md tw-text-neutral-500 tw-font-semibold">Pricing</h6>
                                    {/* Pricing Method Selection */}
                                    <div className="form-group mb-3">
                                        <label className="form-label">Pricing Method</label>
                                        <div>
                                            <label className="me-3">
                                                <input
                                                    type="radio"
                                                    checked={pricingMethod === 'standard'}
                                                    onChange={() => setPricingMethod('standard')}
                                                /> Piece Based (Standard)
                                            </label>
                                            <label>
                                                <input
                                                    type="radio"
                                                    checked={pricingMethod === 'roll'}
                                                    onChange={() => setPricingMethod('roll')}
                                                /> Roll Based
                                            </label>
                                        </div>
                                    </div>

                                    {pricingMethod === 'standard' && (
                                        <>
                                            <div className="form-group mb-3">
                                                <label className="form-label">Base Price*</label>
                                                <input
                                                    type="number"
                                                    className="form-control"
                                                    placeholder="Enter base price"
                                                    value={basePrice}
                                                    onChange={(e) => setBasePrice(e.target.value)}
                                                />
                                                {errors.basePrice && <div className="invalid-feedback">{errors.basePrice}</div>}
                                            </div>
                                            <div className="form-group mb-3">
                                                <label className="form-label">Does this product have variants?</label>
                                                <div>
                                                    <label className="me-3">
                                                        <input
                                                            type="radio"
                                                            checked={!hasVariants}
                                                            onChange={() => setHasVariants(false)}
                                                        /> No
                                                    </label>
                                                    <label>
                                                        <input
                                                            type="radio"
                                                            checked={hasVariants}
                                                            onChange={() => setHasVariants(true)}
                                                        /> Yes
                                                    </label>
                                                </div>
                                            </div>
                                            {!hasVariants && (
                                                <div className="form-group">
                                                    <h6 className="tw-text-md tw-font-semibold tw-text-neutral-500">Inventory</h6>
                                                    <div className="row">
                                                        <div className="col-md-3 mb-3">
                                                            <label className="form-label">Quantity*</label>
                                                            <input
                                                                type="number"
                                                                className="form-control"
                                                                placeholder="Enter quantity"
                                                                value={globalQuantity}
                                                                onChange={(e) => setGlobalQuantity(e.target.value)}
                                                            />
                                                            {errors.globalQuantity && <div className="invalid-feedback">{errors.globalQuantity}</div>}
                                                        </div>
                                                        <div className="col-md-3 mb-3">
                                                            <label className="form-label">Reorder Threshold*</label>
                                                            <input
                                                                type="number"
                                                                className="form-control"
                                                                placeholder="Enter reorder threshold"
                                                                value={globalReorderThreshold}
                                                                onChange={(e) => setGlobalReorderThreshold(e.target.value)}
                                                            />
                                                            {errors.globalReorderThreshold && <div className="invalid-feedback">{errors.globalReorderThreshold}</div>}
                                                        </div>
                                                        <div className="col-md-3 mb-3">
                                                            <label className="form-label">Provider*</label>
                                                            <select
                                                                className="form-control"
                                                                value={globalProvider}
                                                                onChange={(e) => setGlobalProvider(e.target.value)}
                                                            >
                                                                <option value="">Select Provider</option>
                                                                {providers.map((prov) => (
                                                                    <option key={prov.id} value={prov.id}>{prov.name}</option>
                                                                ))}
                                                            </select>
                                                            {errors.globalProvider && <div className="invalid-feedback">{errors.globalProvider}</div>}
                                                        </div>
                                                        <div className="col-md-3 mb-3">
                                                            <label className="form-label">Unit Details</label>
                                                            <textarea
                                                                className="form-control"
                                                                placeholder="Enter unit details"
                                                                value={globalUnitDetails}
                                                                onChange={(e) => setGlobalUnitDetails(e.target.value)}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                            {hasVariants && (
                                                <div className="form-group">
                                                    <h6 className="tw-text-md tw-text-neutral-500 tw-font-semibold mb-3">Variants</h6>
                                                    {variants.map((variant, vIndex) => (
                                                        <div key={vIndex} className="tw-border p-3 mb-3 tw-border-gray-500 tw-rounded-lg">
                                                            <div className="row">
                                                                <div className="col-md-6 mb-3">
                                                                    <label className="form-label">Variant Name*</label>
                                                                    <input
                                                                        type="text"
                                                                        className="form-control"
                                                                        placeholder="Variant Name (e.g., Size)"
                                                                        value={variant.name}
                                                                        onChange={(e) => handleVariantChange(vIndex, 'name', e.target.value)}
                                                                    />
                                                                    {errors[`variant_${vIndex}_name`] && <div className="invalid-feedback">{errors[`variant_${vIndex}_name`]}</div>}
                                                                </div>
                                                                <div className="col-md-6 mb-3">
                                                                    <label className="form-label">Variant Value*</label>
                                                                    <input
                                                                        type="text"
                                                                        className="form-control"
                                                                        placeholder="Variant Value (e.g., 18x24)"
                                                                        value={variant.value}
                                                                        onChange={(e) => handleVariantChange(vIndex, 'value', e.target.value)}
                                                                    />
                                                                    {errors[`variant_${vIndex}_value`] && <div className="invalid-feedback">{errors[`variant_${vIndex}_value`]}</div>}
                                                                </div>
                                                                <div className="col-md-6 mb-3">
                                                                    <label className="form-label">Variant Price Adjustment*</label>
                                                                    <div className="tw-text-xs tw-text-yellow-500 mb-3">
                                                                        Define the adjustable price relative to the base price.
                                                                    </div>
                                                                    <input
                                                                        type="number"
                                                                        className="form-control"
                                                                        placeholder="Price Adjustment"
                                                                        value={variant.priceAdjustment}
                                                                        onChange={(e) => handleVariantChange(vIndex, 'priceAdjustment', e.target.value)}
                                                                    />
                                                                    {errors[`variant_${vIndex}_priceAdjustment`] && <div className="invalid-feedback">{errors[`variant_${vIndex}_priceAdjustment`]}</div>}
                                                                </div>
                                                            </div>
                                                            {!variant.hasSubvariants && (
                                                                <>
                                                                    <h6 className="tw-text-xs mb-3 tw-font-semibold tw-text-gray-500">Inventory</h6>
                                                                    <div className="row">
                                                                        <div className="col-md-3 mb-3">
                                                                            <label className="form-label">Quantity*</label>
                                                                            <input
                                                                                type="number"
                                                                                className="form-control"
                                                                                placeholder="Enter quantity"
                                                                                value={variant.inventory.quantity}
                                                                                onChange={(e) =>
                                                                                    handleVariantChange(vIndex, 'inventory', {
                                                                                        ...variant.inventory,
                                                                                        quantity: e.target.value,
                                                                                    })
                                                                                }
                                                                            />
                                                                            {errors[`variant_${vIndex}_quantity`] && <div className="invalid-feedback">{errors[`variant_${vIndex}_quantity`]}</div>}
                                                                        </div>
                                                                        <div className="col-md-3 mb-3">
                                                                            <label className="form-label">Reorder Threshold*</label>
                                                                            <input
                                                                                type="number"
                                                                                className="form-control"
                                                                                placeholder="Enter reorder threshold"
                                                                                value={variant.inventory.reorderThreshold}
                                                                                onChange={(e) =>
                                                                                    handleVariantChange(vIndex, 'inventory', {
                                                                                        ...variant.inventory,
                                                                                        reorderThreshold: e.target.value,
                                                                                    })
                                                                                }
                                                                            />
                                                                            {errors[`variant_${vIndex}_reorderThreshold`] && <div className="invalid-feedback">{errors[`variant_${vIndex}_reorderThreshold`]}</div>}
                                                                        </div>
                                                                        <div className="col-md-3 mb-3">
                                                                            <label className="form-label">Provider*</label>
                                                                            <select
                                                                                className="form-control"
                                                                                value={variant.inventory.provider}
                                                                                onChange={(e) =>
                                                                                    handleVariantChange(vIndex, 'inventory', {
                                                                                        ...variant.inventory,
                                                                                        provider: e.target.value,
                                                                                    })
                                                                                }
                                                                            >
                                                                                <option value="">Select Provider</option>
                                                                                {providers.map((prov) => (
                                                                                    <option key={prov.id} value={prov.id}>{prov.name}</option>
                                                                                ))}
                                                                            </select>
                                                                            {errors[`variant_${vIndex}_provider`] && <div className="invalid-feedback">{errors[`variant_${vIndex}_provider`]}</div>}
                                                                        </div>
                                                                        <div className="col-md-3 mb-3">
                                                                            <label className="form-label">Unit Details</label>
                                                                            <textarea
                                                                                className="form-control"
                                                                                placeholder="Enter unit details"
                                                                                value={variant.inventory.unitDetails}
                                                                                onChange={(e) =>
                                                                                    handleVariantChange(vIndex, 'inventory', {
                                                                                        ...variant.inventory,
                                                                                        unitDetails: e.target.value,
                                                                                    })
                                                                                }
                                                                            />
                                                                        </div>
                                                                    </div>
                                                                </>
                                                            )}
                                                            <div className="mt-2">
                                                                <label>
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={variant.hasSubvariants}
                                                                        onChange={(e) =>
                                                                            handleVariantChange(vIndex, 'hasSubvariants', e.target.checked)
                                                                        }
                                                                    /> This variant has subvariants
                                                                </label>
                                                            </div>
                                                            {variant.hasSubvariants && (
                                                                <div className="mt-2">
                                                                    <h6 className="tw-text-gray-500 mb-3 mt-3">Subvariants</h6>
                                                                    {variant.subvariants.map((subvariant, sIndex) => (
                                                                        <div key={sIndex} className="row mb-2 align-items-center mt-3">
                                                                            <hr />
                                                                            <div className="d-flex align-items-center gap-3 mb-3 mt-3">
                                                                                <strong>Subvariant {sIndex + 1}</strong>
                                                                                <button
                                                                                    type="button"
                                                                                    className="btn btn-danger btn-sm"
                                                                                    onClick={() => removeSubvariant(vIndex, sIndex)}
                                                                                >
                                                                                    <Icon icon="fluent:delete-24-regular" alt="delete" />
                                                                                </button>
                                                                            </div>
                                                                            <div className="col-md-3 mb-3">
                                                                                <label className="form-label">Subvariant Name*</label>
                                                                                <input
                                                                                    type="text"
                                                                                    className="form-control"
                                                                                    placeholder="Enter subvariant name"
                                                                                    value={subvariant.name}
                                                                                    onChange={(e) =>
                                                                                        handleSubvariantChange(vIndex, sIndex, 'name', e.target.value)
                                                                                    }
                                                                                />
                                                                                {errors[`variant_${vIndex}_subvariant_${sIndex}_name`] && <div className="invalid-feedback">{errors[`variant_${vIndex}_subvariant_${sIndex}_name`]}</div>}
                                                                            </div>
                                                                            <div className="col-md-3 mb-3">
                                                                                <label className="form-label">Subvariant Value*</label>
                                                                                <input
                                                                                    type="text"
                                                                                    className="form-control"
                                                                                    placeholder="Enter subvariant value (e.g., red, 18x24)"
                                                                                    value={subvariant.value}
                                                                                    onChange={(e) =>
                                                                                        handleSubvariantChange(vIndex, sIndex, 'value', e.target.value)
                                                                                    }
                                                                                />
                                                                                {errors[`variant_${vIndex}_subvariant_${sIndex}_value`] && <div className="invalid-feedback">{errors[`variant_${vIndex}_subvariant_${sIndex}_value`]}</div>}
                                                                            </div>
                                                                            <div className="col-md-3 mb-3">
                                                                                <label className="form-label">Subvariant Price Adjustment*</label>
                                                                                <input
                                                                                    type="number"
                                                                                    className="form-control"
                                                                                    placeholder="Enter price adjustment"
                                                                                    value={subvariant.priceAdjustment}
                                                                                    onChange={(e) =>
                                                                                        handleSubvariantChange(vIndex, sIndex, 'priceAdjustment', e.target.value)
                                                                                    }
                                                                                />
                                                                                {errors[`variant_${vIndex}_subvariant_${sIndex}_priceAdjustment`] && <div className="invalid-feedback">{errors[`variant_${vIndex}_subvariant_${sIndex}_priceAdjustment`]}</div>}
                                                                            </div>
                                                                            <div className="col-md-3 mb-3">
                                                                                <label className="form-label">Quantity*</label>
                                                                                <input
                                                                                    type="number"
                                                                                    className="form-control"
                                                                                    placeholder="Enter quantity"
                                                                                    value={subvariant.inventory.quantity}
                                                                                    onChange={(e) =>
                                                                                        handleSubvariantChange(vIndex, sIndex, 'inventory', {
                                                                                            ...subvariant.inventory,
                                                                                            quantity: e.target.value,
                                                                                        })
                                                                                    }
                                                                                />
                                                                                {errors[`variant_${vIndex}_subvariant_${sIndex}_quantity`] && <div className="invalid-feedback">{errors[`variant_${vIndex}_subvariant_${sIndex}_quantity`]}</div>}
                                                                            </div>
                                                                            <div className="col-md-3 mb-3">
                                                                                <label className="form-label">Reorder Threshold*</label>
                                                                                <input
                                                                                    type="number"
                                                                                    className="form-control"
                                                                                    placeholder="Enter reorder threshold"
                                                                                    value={subvariant.inventory.reorderThreshold}
                                                                                    onChange={(e) =>
                                                                                        handleSubvariantChange(vIndex, sIndex, 'inventory', {
                                                                                            ...subvariant.inventory,
                                                                                            reorderThreshold: e.target.value,
                                                                                        })
                                                                                    }
                                                                                />
                                                                                {errors[`variant_${vIndex}_subvariant_${sIndex}_reorderThreshold`] && <div className="invalid-feedback">{errors[`variant_${vIndex}_subvariant_${sIndex}_reorderThreshold`]}</div>}
                                                                            </div>
                                                                            <div className="col-md-3 mb-3">
                                                                                <label className="form-label">Provider*</label>
                                                                                <select
                                                                                    className="form-control"
                                                                                    value={subvariant.inventory.provider}
                                                                                    onChange={(e) =>
                                                                                        handleSubvariantChange(vIndex, sIndex, 'inventory', {
                                                                                            ...subvariant.inventory,
                                                                                            provider: e.target.value,
                                                                                        })
                                                                                    }
                                                                                >
                                                                                    <option value="">Select Provider</option>
                                                                                    {providers.map((prov) => (
                                                                                        <option key={prov.id} value={prov.id}>{prov.name}</option>
                                                                                    ))}
                                                                                </select>
                                                                                {errors[`variant_${vIndex}_subvariant_${sIndex}_provider`] && <div className="invalid-feedback">{errors[`variant_${vIndex}_subvariant_${sIndex}_provider`]}</div>}
                                                                            </div>
                                                                            <div className="col-md-3 mb-3">
                                                                                <label className="form-label">Unit Details</label>
                                                                                <textarea
                                                                                    className="form-control"
                                                                                    placeholder="Enter unit details"
                                                                                    value={subvariant.inventory.unitDetails}
                                                                                    onChange={(e) =>
                                                                                        handleSubvariantChange(vIndex, sIndex, 'inventory', {
                                                                                            ...subvariant.inventory,
                                                                                            unitDetails: e.target.value,
                                                                                        })
                                                                                    }
                                                                                />
                                                                            </div>
                                                                        </div>
                                                                    ))}
                                                                    <button
                                                                        type="button"
                                                                        className="btn btn-outline-secondary btn-sm"
                                                                        onClick={() => addSubvariant(vIndex)}
                                                                    >
                                                                        Add Subvariant
                                                                    </button>
                                                                </div>
                                                            )}
                                                            <button
                                                                type="button"
                                                                className="btn btn-danger btn-sm mt-2"
                                                                onClick={() => removeVariant(vIndex)}
                                                            >
                                                                Remove Variant
                                                            </button>
                                                        </div>
                                                    ))}
                                                    <button type="button" className="btn btn-outline-primary" onClick={addVariant}>
                                                        Add Variant
                                                    </button>
                                                </div>
                                            )}
                                        </>
                                    )}

                                    {pricingMethod === 'roll' && (
                                        <>
                                            <div className="form-group mb-3">
                                                <label className="form-label">Price per Square Foot*</label>
                                                <input
                                                    type="number"
                                                    className="form-control"
                                                    placeholder="Enter price per square foot"
                                                    value={pricePerSqft}
                                                    onChange={(e) => setPricePerSqft(e.target.value)}
                                                />
                                                {errors.pricePerSqft && <div className="invalid-feedback">{errors.pricePerSqft}</div>}
                                            </div>
                                            <div className="alert alert-info">
                                                Roll based products do not support variants. Inventory for rolls is managed separately.
                                            </div>
                                        </>
                                    )}

                                    <div className="form-group d-flex align-items-center justify-content-end gap-8 mt-3">
                                        <button type="button" className="btn btn-neutral-500 border-neutral-100 px-32" onClick={prevStep}>Back</button>
                                        <button type="button" className="btn btn-primary-600 px-32" onClick={nextStep}>Next</button>
                                    </div>
                                </fieldset>

                                {/* Step 5: Images */}
                                <fieldset className={`wizard-fieldset ${currentStep === 5 && "show"}`}>
                                    <h6 className="tw-text-md tw-text-neutral-500 tw-font-semibold">Images</h6>
                                    <div className="card-body p-24">
                                        <div className="upload-image-wrapper d-flex align-items-center gap-3 flex-wrap">
                                            <div className="uploaded-imgs-container d-flex gap-3 flex-wrap">
                                                {uploadedImages.map((image, index) => (
                                                    <div
                                                        key={index}
                                                        className="position-relative border radius-8 overflow-hidden border-dashed bg-neutral-50 tw-h-[250px] tw-w-[250px]"
                                                    >


                                                        {/* Remove button */}
                                                        <button
                                                            type="button"
                                                            className="position-absolute top-0 end-0 z-1 text-2xxl me-8 mt-8 d-flex"
                                                            onClick={() => removeImage(image.src)}
                                                        >
                                                            <Icon icon="radix-icons:cross-2" className="text-xl text-danger-600" />
                                                        </button>

                                                        {/* Primary selection radio */}
                                                        <div className="position-absolute bottom-0 start-0 z-1 p-1 tw-bg-slate-300">
                                                            <input
                                                                type="radio"
                                                                name="primaryImage"
                                                                checked={!!image.isPrimary}
                                                                onChange={() => setPrimaryImage(index)}
                                                            />{" "}
                                                            <span className="text-black fw-semibold">Set as Primary</span>
                                                        </div>

                                                        {/* Reorder buttons */}
                                                        <div className="position-absolute bottom-0 end-0 z-1 p-1 d-flex flex-column">
                                                            <button
                                                                type="button"
                                                                onClick={() => moveImageUp(index)}
                                                                className="btn btn-sm btn-secondary mb-1"
                                                            >
                                                                <Icon icon="akar-icons:arrow-up" />
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => moveImageDown(index)}
                                                                className="btn btn-sm btn-secondary"
                                                            >
                                                                <Icon icon="akar-icons:arrow-down" />
                                                            </button>
                                                        </div>

                                                        <img
                                                            className="w-100 h-100 object-fit-cover"
                                                            src={image.src}
                                                            alt="Uploaded Preview"
                                                        />
                                                    </div>
                                                ))}
                                            </div>

                                            {/* Upload button */}
                                            <label
                                                className="upload-file-multiple tw-h-[250px] tw-w-[250px] border radius-8 overflow-hidden border-dashed bg-neutral-50 d-flex align-items-center flex-column justify-content-center gap-1"
                                                htmlFor="upload-file-multiple"
                                            >
                                                <Icon icon="solar:camera-outline" className="text-xl text-secondary-light" />
                                                <span className="fw-semibold text-secondary-light">Upload</span>
                                                <span className="fw-semibold text-secondary-light">1080px by 1080px</span>
                                                <input
                                                    id="upload-file-multiple"
                                                    type="file"
                                                    hidden
                                                    multiple
                                                    onChange={handleFileChange}
                                                    className="tw-h-[250px] tw-w-[250px]"
                                                />
                                            </label>
                                        </div>
                                    </div>
                                    <div className="form-group d-flex align-items-center justify-content-end gap-8 mt-3">
                                        <button type="button" className="btn btn-neutral-500 border-neutral-100 px-32" onClick={prevStep}>
                                            Back
                                        </button>
                                        <button type="button" className="btn btn-primary-600 px-32" onClick={nextStep}>
                                            Next
                                        </button>
                                    </div>
                                </fieldset>


                                {/* Step 6: Review & Finish */}
                                {/* Step 6: Review & Finish */}
                                <fieldset className={`wizard-fieldset ${currentStep === 6 && "show"}`}>
                                    <h6 className="tw-text-md tw-text-neutral-500 tw-font-semibold mb-4">Review &amp; Finish</h6>
                                    <div className="space-y-6">
                                        {/* Working Group */}
                                        <div className="p-4 border rounded-lg">
                                            <h3 className="font-bold mb-2">Working Group</h3>
                                            <p>{workingGroupName || "Not selected"}</p>
                                        </div>

                                        {/* Basic Information */}
                                        <div className="p-4 border rounded-lg">
                                            <h3 className="font-bold mb-2">Basic Information</h3>
                                            <p><strong>Product Name:</strong> {basicInfo.productName}</p>
                                            <p>
                                                <strong>Description:</strong>
                                                <span dangerouslySetInnerHTML={{ __html: basicInfo.productDescription }} />
                                            </p>
                                            <p><strong>SEO Title:</strong> {basicInfo.seoTitle}</p>
                                            <p><strong>SEO Description:</strong> {basicInfo.seoDescription}</p>
                                        </div>

                                        {/* Categories */}
                                        <div className="p-4 border rounded-lg">
                                            <h3 className="font-bold mb-2">Categories</h3>
                                            <ul className="list-disc pl-5">
                                                {selectedCategoryNames && selectedCategoryNames.length > 0 ? (
                                                    selectedCategoryNames.map((cat, index) => (
                                                        <li key={index}>{cat}</li>
                                                    ))
                                                ) : (
                                                    <li>None selected</li>
                                                )}
                                            </ul>
                                        </div>

                                        {/* Pricing & Inventory */}
                                        <div className="p-4 border rounded-lg">
                                            <h3 className="font-bold mb-2">Pricing &amp; Inventory</h3>
                                            {pricingMethod === 'standard' ? (
                                                <>
                                                    <p><strong>Pricing Method:</strong> Piece Based (Standard)</p>
                                                    <p><strong>Base Price:</strong> {basePrice}</p>
                                                    {hasVariants ? (
                                                        <>
                                                            <p><strong>Variants:</strong></p>
                                                            <div className="space-y-2">
                                                                {variants.map((variant, vIndex) => (
                                                                    <div key={vIndex} className="p-2 border rounded">
                                                                        <p><strong>Name:</strong> {variant.name}</p>
                                                                        <p><strong>Value:</strong> {variant.value}</p>
                                                                        <p><strong>Price Adjustment:</strong> {variant.priceAdjustment}</p>
                                                                        {variant.hasSubvariants ? (
                                                                            <>
                                                                                <p><strong>Subvariants:</strong></p>
                                                                                <ul className="list-disc pl-5">
                                                                                    {variant.subvariants.map((subvariant, sIndex) => (
                                                                                        <li key={sIndex}>
                                                                                            {subvariant.name} - {subvariant.value} (Adj: {subvariant.priceAdjustment})
                                                                                        </li>
                                                                                    ))}
                                                                                </ul>
                                                                            </>
                                                                        ) : (
                                                                            <>
                                                                                <p><strong>Inventory Quantity:</strong> {variant.inventory.quantity}</p>
                                                                                <p><strong>Reorder Threshold:</strong> {variant.inventory.reorderThreshold}</p>
                                                                                <p><strong>Provider:</strong> {providers.find(p => p.id === variant.inventory.provider)?.name || variant.inventory.provider}</p>
                                                                                <p><strong>Unit Details:</strong> {variant.inventory.unitDetails}</p>
                                                                            </>
                                                                        )}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <p><strong>Inventory Quantity:</strong> {globalQuantity}</p>
                                                            <p><strong>Reorder Threshold:</strong> {globalReorderThreshold}</p>
                                                            <p><strong>Provider:</strong> {providers.find(p => p.id === globalProvider)?.name || globalProvider}</p>
                                                            <p><strong>Unit Details:</strong> {globalUnitDetails}</p>
                                                        </>
                                                    )}
                                                </>
                                            ) : (
                                                <>
                                                    <p><strong>Pricing Method:</strong> Roll Based</p>
                                                    <p><strong>Price per Square Foot:</strong> {pricePerSqft}</p>
                                                </>
                                            )}
                                        </div>

                                        {/* Images */}
                                        <div className="p-4 border rounded-lg">
                                            <h3 className="font-bold mb-2">Images</h3>
                                            <div className="d-flex flex-wrap gap-3 ">
                                                {imagesInfo.length > 0 ? (
                                                    imagesInfo.map((image, index) => (
                                                        <img
                                                            key={index}
                                                            src={image.src}
                                                            alt={`Image ${index + 1}`}
                                                            className="tw-h-[250px] tw-w-[250px] object-cover border rounded"
                                                        />
                                                    ))
                                                ) : (
                                                    <p>No images uploaded</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="form-group d-flex align-items-center justify-content-end gap-8 mt-6">
                                        <button type="button" className="btn btn-neutral-500 border-neutral-100 px-32" onClick={prevStep}>
                                            Back
                                        </button>
                                        <button type="submit" className="btn btn-primary-600 px-32" onClick={() => console.log("Submitting final data")} disabled={loading}>
                                            {loading ? (
                                                <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                                            ) : (
                                                "Add New Product"
                                            )}
                                        </button>
                                    </div>
                                </fieldset>
                            </form>
                        </div>
                    </div>
                </div>

                <div className="modal fade" id="addCat" tabIndex={-1} aria-labelledby="addCatLabel" aria-hidden="true">
                    <div className="modal-dialog modal-lg modal-dialog-centered">
                        <div className="modal-content radius-16 bg-base">
                            <div className="modal-header py-16 px-24 border-0">
                                <h5 className="modal-title fs-5" id="addCatLabel">Add New Category</h5>
                                <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close" />
                            </div>
                            <div className="modal-body px-24">
                                <form onSubmit={handleAddCategory}>
                                    <div className="mb-3">
                                        <label htmlFor="categoryName" className="form-label">Category Name*</label>
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
                                        <label htmlFor="categoryDescription" className="form-label">Category Description</label>
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
                                        <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
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
