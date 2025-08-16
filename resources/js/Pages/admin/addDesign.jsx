import React, {
    useState,
    useEffect,
    useRef,
    useCallback,
    useMemo,
} from 'react';
import PropTypes from 'prop-types';
import axios from 'axios';
import { Head } from '@inertiajs/react';
import AdminDashboard from '../../Layouts/AdminDashboard';
import Breadcrumb from '@/Components/Breadcrumb';
import { Icon } from '@iconify/react';
import CookiesV from '@/Components/CookieConsent';
import Alert from '@/Components/Alert';
import Meta from '@/Components/Metaheads';

/**
 * Custom hook to manage drag-and-drop state and events.
 * Calls onFilesDropped(newFiles: File[]) whenever files are added.
 */
function useFileDragDrop(onFilesDropped) {
    const [dragging, setDragging] = useState(false);

    const onDragEnter = useCallback((e) => {
        e.preventDefault();
        setDragging(true);
    }, []);

    const onDragOver = useCallback((e) => {
        e.preventDefault();
    }, []);

    const onDragLeave = useCallback((e) => {
        e.preventDefault();
        setDragging(false);
    }, []);

    const onDrop = useCallback(
        (e) => {
            e.preventDefault();
            setDragging(false);
            const droppedFiles = Array.from(e.dataTransfer.files);
            onFilesDropped(droppedFiles);
        },
        [onFilesDropped]
    );

    return { dragging, onDragEnter, onDragOver, onDragLeave, onDrop };
}

/**
 * FilePreview renders:
 * - A thumbnail (local preview)
 * - A remove (×) button
 * - A <progress> bar when status === 'uploading'
 * - A green check icon when status === 'uploaded'
 * - A red × icon when status === 'error'
 * - Once uploaded, it also shows the remote image (uploadedUrls[idx])
 */
function FilePreview({
    src,
    idx,
    status,
    progress,
    uploadedUrl,
    dim,
    onRemove,
    onImageLoad,
}) {
    // Calculate CSS aspect-ratio for the <div>
    const ratio = dim ? `${dim.w}/${dim.h}` : '1/1';

    return (
        <div
            className="tw-relative tw-border tw-rounded-lg tw-overflow-hidden tw-flex-shrink-0 tw-flex-grow"
            style={{
                aspectRatio: ratio,
                maxWidth: '250px',
                flex: '1 1 150px',
            }}
        >
            {/* Remove Button */}
            <button
                type="button"
                onClick={() => onRemove(idx)}
                className="tw-absolute tw-top-1 tw-right-1 tw-z-10 tw-p-1 tw-bg-white tw-rounded-full tw-shadow"
                aria-label={`Remove image ${idx + 1}`}
            >
                <Icon icon="radix-icons:cross-2" className="tw-text-red-600" />
            </button>

            {/* Local Preview Image */}
            <img
                src={src}
                alt={`Preview ${idx + 1}`}
                className="tw-w-full tw-h-full tw-object-contain"
                onLoad={(e) => {
                    const { naturalWidth: w, naturalHeight: h } = e.target;
                    onImageLoad(idx, { w, h });
                }}
                aria-hidden="true"
            />

            {/* Progress Bar (visible only when uploading) */}
            {status === 'uploading' && (
                <div className="tw-absolute tw-bottom-0 tw-left-0 tw-w-full tw-bg-gray-200 tw-rounded-full tw-overflow-hidden">
                    <div
                        className="tw-bg-blue-600 tw-text-xs tw-font-medium tw-text-blue-100 tw-text-center tw-p-0.5 tw-leading-none tw-rounded-full"
                        style={{ width: `${progress}%` }}
                        aria-valuenow={progress}
                        aria-valuemin="0"
                        aria-valuemax="100"
                    >
                        {progress}%
                    </div>
                </div>
            )}

            {/* Success Icon (once fully uploaded) */}
            {status === 'uploaded' && (
                <div
                    className="tw-absolute tw-top-1 tw-left-1 tw-bg-green-100 tw-text-green-800 tw-text-xs tw-px-2 tw-py-1 tw-rounded"
                    aria-label="Upload successful"
                >
                    Uploaded Successfully
                    {/* <Icon
                        icon="eva:checkmark-circle-2-outline"
                        className="tw-absolute tw-top-1 tw-left-1 tw-text-green-600 tw-me-4"
                        aria-label="Upload successful"
                    /> Uploaded Successfully */}
                </div>
            )}

            {/* Remote Uploaded Image Preview */}
            {status === 'uploaded' && uploadedUrl && (
                <img
                    src={uploadedUrl}
                    alt="Uploaded"
                    className="tw-w-full tw-mt-2 tw-border tw-rounded"
                    style={{ maxHeight: '100px', objectFit: 'contain' }}
                />
            )}

            {/* Error Icon */}
            {status === 'error' && (
                <div
                    className="tw-absolute tw-top-1 tw-left-1 tw-bg-red-100 tw-text-red-800 tw-text-xs tw-px-2 tw-py-1 tw-rounded"
                    aria-label="Upload failed"
                >
                    Upload Failed
                    {/* <Icon
                        icon="eva:close-circle-2-outline"
                        className="tw-absolute tw-top-1 tw-left-1 tw-text-red-600 tw-me-4"
                        aria-label="Upload failed"
                    /> Upload Failed */}
                </div>
            )}
        </div>
    );
}

FilePreview.propTypes = {
    src: PropTypes.string.isRequired,
    idx: PropTypes.number.isRequired,
    status: PropTypes.oneOf([
        'pending',
        'uploading',
        'uploaded',
        'error',
    ]).isRequired,
    progress: PropTypes.number.isRequired,
    uploadedUrl: PropTypes.string,
    dim: PropTypes.shape({
        w: PropTypes.number,
        h: PropTypes.number,
    }),
    onRemove: PropTypes.func.isRequired,
    onImageLoad: PropTypes.func.isRequired,
};
FilePreview.defaultProps = {
    uploadedUrl: null,
    dim: null,
};

const AddDesign = ({ userDetails, workingGroups }) => {
    // -------- State Declarations --------
    // Global alert / validation
    const [alert, setAlert] = useState(null); // { type: 'success'|'danger', message: string }
    const [errors, setErrors] = useState({}); // { field: message }

    // Form data
    const [selectedGroup, setSelectedGroup] = useState('');
    const [selectedProduct, setSelectedProduct] = useState('');
    const [dimensions, setDimensions] = useState({
        width: '',
        height: '',
    });

    // File upload
    const [files, setFiles] = useState([]); // File[]
    const [previews, setPreviews] = useState([]); // dataURL[]
    const [dims, setDims] = useState({}); // { idx: { w, h } }

    // Upload state arrays
    const [statuses, setStatuses] = useState([]); // 'pending'|'uploading'|'uploaded'|'error'
    const [progress, setProgress] = useState([]); // 0–100
    const [uploadedUrls, setUploadedUrls] = useState([]); // URL from backend

    const [isSubmitting, setIsSubmitting] = useState(false);

    // Refs & constants
    const fileInputRef = useRef(null);
    const CHUNK_SIZE = 2 * 1024 * 1024; // 2 MB chunk size (makes progress more visible)
    const MAX_FILE_COUNT = 25;
    const MAX_FILE_SIZE = 1024 * 1024 * 1024; // 10 MB

    // -------- Derived Data --------
    // Products for the selected group
    const products = useMemo(() => {
        if (!selectedGroup) return [];
        const group = workingGroups.find(
            (g) => String(g.id) === selectedGroup
        );
        return group?.products || [];
    }, [selectedGroup, workingGroups]);

    // -------- Effects --------
    // Whenever `files` changes, rebuild `statuses`, `progress`, `uploadedUrls` and generate previews
    useEffect(() => {
        // Initialize statuses/progress/uploadedUrls for each file
        setStatuses(files.map(() => 'pending'));
        setProgress(files.map(() => 0));
        setUploadedUrls(files.map(() => null));

        // If no files, clear previews
        if (files.length === 0) {
            setPreviews([]);
        } else {
            // Create an array of the same length
            const newPreviews = Array(files.length).fill(null);
            let loadedCount = 0;

            files.forEach((file, index) => {
                const reader = new FileReader();
                reader.onload = (e) => {
                    newPreviews[index] = e.target.result;
                    loadedCount++;
                    if (loadedCount === files.length) {
                        setPreviews(newPreviews);
                    }
                };
                reader.readAsDataURL(file);
            });
        }

        // Clear the file input so user can re-add the same file name if needed
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    }, [files]);


    // -------- Handlers --------
    // Remove a file at index `idx`
    const removeImage = useCallback(
        (idx) => {
            // 1) Drop from files
            setFiles((prev) => prev.filter((_, i) => i !== idx));

            // 2) Drop from statuses
            setStatuses((prev) => {
                const copy = [...prev];
                copy.splice(idx, 1);
                return copy;
            });

            // 3) Drop from progress
            setProgress((prev) => {
                const copy = [...prev];
                copy.splice(idx, 1);
                return copy;
            });

            // 4) Drop from uploadedUrls
            setUploadedUrls((prev) => {
                const copy = [...prev];
                copy.splice(idx, 1);
                return copy;
            });

            // 5) Rebuild dims with shifted keys
            setDims((prev) => {
                const newDims = {};
                Object.keys(prev)
                    .map((key) => parseInt(key, 10))
                    .filter((key) => key !== idx)
                    .sort((a, b) => a - b)
                    .forEach((oldKey) => {
                        const newKey = oldKey < idx ? oldKey : oldKey - 1;
                        newDims[newKey] = prev[oldKey];
                    });
                return newDims;
            });

            // NOTE: Do NOT touch setPreviews here—useEffect will rebuild previews from files.
        },
        [setFiles, setStatuses, setProgress, setUploadedUrls, setDims]
    );

    // When a preview <img> loads, record its natural dimensions for aspect-ratio
    const handleImageLoad = useCallback(
        (idx, { w, h }) => {
            setDims((cur) => ({ ...cur, [idx]: { w, h } }));
        },
        [setDims]
    );

    // Validate all form fields. Returns an object with any errors.
    const validateFields = useCallback(() => {
        const errs = {};
        if (!selectedGroup) {
            errs.workingGroup = 'Please select a working group.';
            setAlert({
                type: 'danger',
                message: 'Please select a working group.',
            });
        }
        if (!selectedProduct) {
            errs.product = 'Please select a product.';
            setAlert({
                type: 'danger',
                message: 'Please select a product.',
            });
        }
        if (!dimensions.width) {
            errs.width = 'Width is required.';
            setAlert({
                type: 'danger',
                message: 'Width is required.',
            });
        } else if (Number(dimensions.width) <= 0) {
            errs.width = 'Width must be greater than zero.';
            setAlert({
                type: 'danger',
                message: 'Width must be greater than zero.',
            });
        }
        if (!dimensions.height) {
            errs.height = 'Height is required.';
            setAlert({
                type: 'danger',
                message: 'Height is required.',
            });
        } else if (Number(dimensions.height) <= 0) {
            errs.height = 'Height must be greater than zero.';
            setAlert({
                type: 'danger',
                message: 'Height must be greater than zero.',
            });
        }
        if (files.length === 0) {
            errs.files = 'Please select at least one file.';
            setAlert({
                type: 'danger',
                message: 'Please select at least one file.',
            });
        }
        return errs;
    }, [selectedGroup, selectedProduct, dimensions, files]);

    // Add or replace files from input/drop, enforcing type/size/count
    const updateFiles = useCallback(
        (newFiles) => {
            // Limit count
            if (newFiles.length > MAX_FILE_COUNT) {
                setErrors((prev) => ({
                    ...prev,
                    files: `You can upload up to ${MAX_FILE_COUNT} files.`,
                }));
                return;
            }

            // Filter and validate each file
            const validFiles = [];
            for (const f of newFiles) {
                if (!/\.jpe?g$/i.test(f.name) || !f.type.startsWith('image/jpeg')) {
                    setErrors((prev) => ({
                        ...prev,
                        files: 'Only JPG files are allowed.',
                    }));
                    return;
                }
                if (f.size > MAX_FILE_SIZE) {
                    setErrors((prev) => ({
                        ...prev,
                        files: `Each file must be ≤ ${MAX_FILE_SIZE / (1024 * 1024)} MB.`,
                    }));
                    return;
                }
                validFiles.push(f);
            }

            setErrors((prev) => ({ ...prev, files: null }));
            setAlert(null);
            setFiles(validFiles);
            setDims({});
        },
        [MAX_FILE_COUNT, MAX_FILE_SIZE]
    );

    // Input `<input type="file" />` change handler
    const handleFileChange = useCallback(
        (e) => {
            updateFiles(Array.from(e.target.files));
        },
        [updateFiles]
    );

    // Drag-and-drop hook
    const { dragging, onDragEnter, onDragOver, onDragLeave, onDrop } =
        useFileDragDrop(updateFiles);

    // Form field handlers
    const handleGroupChange = useCallback((e) => {
        setSelectedGroup(e.target.value);
        setSelectedProduct('');
        setErrors((prev) => ({ ...prev, workingGroup: null }));
    }, []);

    const handleProductChange = useCallback((e) => {
        setSelectedProduct(e.target.value);
        setErrors((prev) => ({ ...prev, product: null }));
    }, []);

    const handleDimensionChange = useCallback((e) => {
        const { name, value } = e.target;
        setDimensions((prev) => ({ ...prev, [name]: value }));
        setErrors((prev) => ({ ...prev, [name]: null }));
    }, []);

    // Upload a single file in chunks, return final response
    async function uploadFileInChunks(file, idx) {
        const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
        const identifier = `${file.name.replace(/[^0-9a-z_\-\.]/gi, '')}-${file.size}`;
        let lastResponse = null;

        for (let chunkNumber = 1; chunkNumber <= totalChunks; chunkNumber++) {
            const start = (chunkNumber - 1) * CHUNK_SIZE;
            const end = Math.min(file.size, start + CHUNK_SIZE);
            const blob = file.slice(start, end, file.type);

            const form = new FormData();
            form.append('working_group_id', selectedGroup);
            form.append('product_id', selectedProduct);
            form.append('width', dimensions.width);
            form.append('height', dimensions.height);
            form.append('file', blob, file.name);

            // Pion chunk‐upload required fields
            form.append('flowChunkNumber', chunkNumber);
            form.append('flowChunkSize', CHUNK_SIZE);
            form.append('flowCurrentChunkSize', blob.size);
            form.append('flowTotalSize', file.size);
            form.append('flowIdentifier', identifier);
            form.append('flowFilename', file.name);
            form.append('flowRelativePath', file.name);
            form.append('flowTotalChunks', totalChunks);

            // Also add the “resumable*” fields just in case
            form.append('resumableChunkNumber', chunkNumber);
            form.append('resumableChunkSize', CHUNK_SIZE);
            form.append('resumableCurrentChunkSize', blob.size);
            form.append('resumableTotalSize', file.size);
            form.append('resumableIdentifier', identifier);
            form.append('resumableFilename', file.name);
            form.append('resumableRelativePath', file.name);
            form.append('resumableTotalChunks', totalChunks);

            try {
                lastResponse = await axios.post(route('admin.storeDesign'), form, {
                    headers: {
                        'X-CSRF-TOKEN': document
                            .querySelector('meta[name="csrf-token"]')
                            .getAttribute('content'),
                    },
                    onUploadProgress: (ev) => {
                        // Calculate overall percent of this chunk
                        const pct = Math.round(((start + ev.loaded) / file.size) * 100);
                        setProgress((prev) => {
                            const copy = [...prev];
                            copy[idx] = pct;
                            console.log(
                                `File idx=${idx}, chunk ${chunkNumber}/${totalChunks}, progress=${pct}%`
                            );
                            return copy;
                        });
                    },
                });
            } catch (err) {
                // Rethrow so handleSubmit can catch it
                throw err;
            }
        }

        return lastResponse;
    }

    // Handle form submission and begin chunked uploads sequentially
    const handleSubmit = useCallback(
        async (e) => {
            e.preventDefault();
            setAlert(null);
            setIsSubmitting(true);

            // Clear any previous file‐related error
            setErrors((prev) => ({ ...prev, files: null }));

            const validationErrors = validateFields();
            if (Object.keys(validationErrors).length > 0) {
                setErrors(validationErrors);
                setAlert({ type: 'danger', message: 'Please fix the errors below.' });
                setIsSubmitting(false);
                return;
            }

            const failedFiles = [];

            // For each file, set status to "uploading", then call uploadFileInChunks
            for (let idx = 0; idx < files.length; idx++) {
                const file = files[idx];

                // Mark as uploading
                setStatuses((prev) => {
                    const copy = [...prev];
                    copy[idx] = 'uploading';
                    console.log(`Status for file idx=${idx} set to 'uploading'`);
                    return copy;
                });

                try {
                    const res = await uploadFileInChunks(file, idx);

                    // After all chunks succeed:
                    setStatuses((prev) => {
                        const copy = [...prev];
                        copy[idx] = 'uploaded';
                        console.log(`Status for file idx=${idx} set to 'uploaded'`);
                        return copy;
                    });
                    setUploadedUrls((prev) => {
                        const copy = [...prev];
                        copy[idx] = res.data.image_url || '';
                        return copy;
                    });
                    setProgress((prev) => {
                        const copy = [...prev];
                        copy[idx] = 100;
                        return copy;
                    });

                    if (res.data && res.data.message) {
                        setAlert({ type: 'success', message: res.data.message });
                    }
                } catch (err) {
                    // Mark this file as errored and record its name
                    setStatuses((prev) => {
                        const copy = [...prev];
                        copy[idx] = 'error';
                        return copy;
                    });
                    failedFiles.push(file.name);
                }
            }

            // After all files attempted, show aggregated errors if any
            if (failedFiles.length > 0) {
                const message =
                    failedFiles.length > 1
                        ? `Uploads failed for: ${failedFiles.join(', ')}.`
                        : `Upload failed for ${failedFiles[0]}.`;
                setErrors((prev) => ({ ...prev, files: message }));
                setAlert({ type: 'danger', message });
            } else {
                setAlert({ type: 'success', message: 'All files uploaded successfully.' });
            }

            setIsSubmitting(false);
        },
        [files, selectedGroup, selectedProduct, dimensions, validateFields]
    );

    // -------- JSX Return --------
    return (
        <>
            <Head title="Add New Design - Admin Dashboard" />
            <Meta
                title="Add New Design - Admin Dashboard"
                description="Add New Design to the system"
            />

            <AdminDashboard userDetails={userDetails}>
                <Breadcrumb title="Add New Design" />

                {alert && <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} />}

                <div className="card">
                    <div className="card-body">
                        {errors && Object.keys(errors).length > 0 && (
                            <div
                                className="alert alert-danger tw-bg-danger-100 tw-mb-3 tw-text-danger-600 tw-border-danger-600 tw-border-start-width-4-px tw-px-4 tw-py-3 d-flex"
                                role="alert"
                            >
                                <ol className="tw-mb-0">
                                    {Object.values(errors).map(
                                        (error, i) => error && <li key={i}>{error}</li>
                                    )}
                                </ol>
                            </div>
                        )}

                        {/* Instruction Block */}
                        <div className="alert alert-primary">
                            <span className="tw-underline tw-font-medium">Please note:</span>
                            <ol className="tw-list-decimal tw-ml-5">
                                <li>Designs must be print-ready JPG files only.</li>
                                <li>
                                    Always save a local copy: the server-stored version{' '}
                                    <strong>cannot be printed directly</strong>.
                                </li>
                                <li>Rename local files to match the system’s names for easy selection.</li>
                                <li>You can upload up to {MAX_FILE_COUNT} files at once.</li>
                                <li>
                                    Google Drive may throttle uploads; <strong>verify each design</strong> after
                                    upload.
                                </li>
                            </ol>
                        </div>

                        <form id="designUploadForm" onSubmit={handleSubmit} noValidate>
                            {/* Working Group */}
                            <div className="mb-3">
                                <label htmlFor="workingGroup" className="form-label">
                                    Select a working group for design
                                </label>
                                <select
                                    id="workingGroup"
                                    name="workingGroup"
                                    className={`form-select ${errors.workingGroup ? 'is-invalid' : ''}`}
                                    value={selectedGroup}
                                    onChange={handleGroupChange}
                                    aria-required="true"
                                    aria-invalid={errors.workingGroup ? 'true' : 'false'}
                                >
                                    <option value="">Select a working group</option>
                                    {workingGroups.map((g) => (
                                        <option key={g.id} value={g.id}>
                                            {g.name}
                                        </option>
                                    ))}
                                </select>
                                {errors.workingGroup && (
                                    <div className="invalid-feedback">{errors.workingGroup}</div>
                                )}
                            </div>

                            {/* Product */}
                            <div className="mb-3">
                                <label htmlFor="product" className="form-label">
                                    Select a product
                                </label>
                                <select
                                    id="product"
                                    name="product"
                                    className={`form-select ${errors.product ? 'is-invalid' : ''}`}
                                    value={selectedProduct}
                                    onChange={handleProductChange}
                                    disabled={!selectedGroup || products.length === 0}
                                    aria-required="true"
                                    aria-invalid={errors.product ? 'true' : 'false'}
                                >
                                    <option value="">
                                        {!selectedGroup
                                            ? 'Select a working group first'
                                            : 'Select a product'}
                                    </option>
                                    {products.map((p) => (
                                        <option key={p.id} value={p.id}>
                                            {p.name}
                                        </option>
                                    ))}
                                </select>
                                {errors.product && <div className="invalid-feedback">{errors.product}</div>}
                                {!selectedGroup && (
                                    <small className="form-text text-muted">
                                        Please pick a group above to see its products.
                                    </small>
                                )}
                                {selectedGroup && products.length === 0 && (
                                    <small className="form-text text-muted">
                                        No products available for this group.
                                    </small>
                                )}
                            </div>

                            {/* Dimensions */}
                            <div className="mb-3">
                                <label htmlFor="width" className="form-label">
                                    Dimensions (inches)
                                </label>
                                <div className="input-group">
                                    <input
                                        type="number"
                                        id="width"
                                        name="width"
                                        value={dimensions.width}
                                        onChange={handleDimensionChange}
                                        className={`form-control ${errors.width ? 'is-invalid' : ''}`}
                                        placeholder="Width"
                                        min="1"
                                        aria-required="true"
                                        aria-invalid={errors.width ? 'true' : 'false'}
                                    />
                                    <span className="input-group-text">×</span>
                                    <input
                                        type="number"
                                        id="height"
                                        name="height"
                                        value={dimensions.height}
                                        onChange={handleDimensionChange}
                                        className={`form-control ${errors.height ? 'is-invalid' : ''}`}
                                        placeholder="Height"
                                        min="1"
                                        aria-required="true"
                                        aria-invalid={errors.height ? 'true' : 'false'}
                                    />
                                </div>
                                {errors.width && (
                                    <div className="invalid-feedback tw-block">{errors.width}</div>
                                )}
                                {errors.height && (
                                    <div className="invalid-feedback tw-block">{errors.height}</div>
                                )}
                            </div>

                            {/* File Upload */}
                            <label htmlFor="file-input" className="tw-font-semibold tw-text-xl">
                                Upload Designs
                            </label>
                            <div className="d-flex tw-justify-between mb-2">
                                <div className="tw-text-sm">
                                    Supported: JPG | Max files: {MAX_FILE_COUNT}
                                </div>
                                <div className="tw-text-sm">Total selected: {files.length}</div>
                            </div>
                            {errors.files && <div className="text-danger mb-2">{errors.files}</div>}

                            <div
                                className={`upload-image-wrapper d-flex align-items-center tw-gap-3 tw-mt-4 tw-p-3 tw-border-2 tw-rounded ${dragging
                                        ? 'tw-bg-blue-50 tw-border-blue-400'
                                        : 'tw-bg-neutral-50 tw-border-dashed tw-border-gray-300'
                                    }`}
                                onDragEnter={onDragEnter}
                                onDragOver={onDragOver}
                                onDragLeave={onDragLeave}
                                onDrop={onDrop}
                                role="button"
                                tabIndex={0}
                                aria-label="Drag & drop files here or click to browse"
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' || e.key === ' ') {
                                        fileInputRef.current.click();
                                    }
                                }}
                            >
                                <label
                                    htmlFor="file-input"
                                    className="d-flex flex-column align-items-center justify-content-center w-100 h-100 m-0 cursor-pointer"
                                >
                                    <Icon
                                        icon="solar:camera-outline"
                                        className="tw-text-xl tw-text-secondary-light"
                                    />
                                    <span className="fw-semibold text-secondary-light">
                                        Drag & Drop or Browse Files
                                    </span>
                                </label>
                                <input
                                    id="file-input"
                                    type="file"
                                    accept=".jpg,.jpeg"
                                    multiple
                                    hidden
                                    ref={fileInputRef}
                                    onChange={handleFileChange}
                                    disabled={files.length >= MAX_FILE_COUNT || isSubmitting}
                                />
                            </div>

                            {/* Previews */}
                            {previews.length > 0 && (
                                <div className="d-flex flex-wrap tw-gap-3 tw-mt-4">
                                    {previews.map((src, idx) => (
                                        <FilePreview
                                            key={idx}
                                            src={src}
                                            idx={idx}
                                            status={statuses[idx]}
                                            progress={progress[idx]}
                                            uploadedUrl={uploadedUrls[idx]}
                                            dim={dims[idx]}
                                            onRemove={removeImage}
                                            onImageLoad={handleImageLoad}
                                        />
                                    ))}
                                </div>
                            )}

                            <button
                                type="submit"
                                className="btn btn-primary tw-mt-4"
                                disabled={isSubmitting}
                            >
                                {isSubmitting && (
                                    <span className="spinner-border spinner-border-sm me-2" role="status" />
                                )}
                                Upload Design
                            </button>
                        </form>
                    </div>
                </div>
            </AdminDashboard>
            <CookiesV />
        </>
    );
};

AddDesign.propTypes = {
    userDetails: PropTypes.object.isRequired,
    workingGroups: PropTypes.arrayOf(
        PropTypes.shape({
            id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
            name: PropTypes.string.isRequired,
            products: PropTypes.arrayOf(
                PropTypes.shape({
                    id: PropTypes.oneOfType([PropTypes.number, PropTypes.string])
                        .isRequired,
                    name: PropTypes.string.isRequired,
                })
            ),
        })
    ).isRequired,
};

export default AddDesign;
