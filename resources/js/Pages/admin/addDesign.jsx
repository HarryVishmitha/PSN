import React, { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import { Head, router } from '@inertiajs/react'
import AdminDashboard from '../../Layouts/AdminDashboard'
import Breadcrumb from "@/components/Breadcrumb"
import { Icon } from "@iconify/react"
import CookiesV from '@/Components/CookieConsent'
import Alert from "@/Components/Alert"
import Meta from "@/Components/Metaheads"
import hljs from "highlight.js"
import ReactQuill from "react-quill-new"
import 'react-quill-new/dist/quill.snow.css'


const AddDesign = ({ userDetails, workingGroups }) => {
    const [alert, setAlert] = useState(null)    // { type, message }
    const [errors, setErrors] = useState({})     // validation errors
    const [selectedGroup, setSelectedGroup] = useState('')
    const [products, setProducts] = useState([])
    const [selectedProduct, setSelectedProduct] = useState('')
    const [dimensions, setDimensions] = useState({ width: '', height: '' })
    const [files, setFiles] = useState([])
    const [previews, setPreviews] = useState([])
    const [dims, setDims] = useState({})
    const [dragging, setDragging] = useState(false)
    const fileInputRef = useRef(null)
    const CHUNK_SIZE = 1 * 1024 * 1024;  // 1 MB


    // upload status & progress per file
    const [statuses, setStatuses] = useState([])      // 'pending'|'uploading'|'uploaded'|'error'
    const [progress, setProgress] = useState([])      // number 0–100
    const [uploadedUrls, setUploadedUrls] = useState([])      // string URLs after success
    const [isSubmitting, setIsSubmitting] = useState(false)

    // derive products from props when selectedGroup changes
    useEffect(() => {
        if (!selectedGroup) {
            setProducts([])
            return
        }
        const group = workingGroups.find(g => String(g.id) === selectedGroup)
        setProducts(group?.products || [])
    }, [selectedGroup, workingGroups])

    // generate previews + init statuses/progress/uploadedUrls when files change
    useEffect(() => {
        setStatuses(files.map(() => 'pending'))
        setProgress(files.map(() => 0))
        setUploadedUrls(files.map(() => null))

        if (files.length === 0) {
            setPreviews([])
            return
        }
        const newPreviews = []
        files.forEach(file => {
            const reader = new FileReader()
            reader.onload = e => {
                newPreviews.push(e.target.result)
                if (newPreviews.length === files.length) {
                    setPreviews(newPreviews)
                }
            }
            reader.readAsDataURL(file)
        })
    }, [files])

    const handleGroupChange = e => {
        setSelectedGroup(e.target.value)
        setSelectedProduct('')
        setErrors(prev => ({ ...prev, workingGroup: null }))
    }

    const handleProductChange = e => {
        setSelectedProduct(e.target.value)
        setErrors(prev => ({ ...prev, product: null }))
    }

    const handleDimensionChange = e => {
        setDimensions({
            ...dimensions,
            [e.target.name]: e.target.value,
        })
        setErrors(prev => ({ ...prev, [e.target.name]: null }))
    }

    const updateFiles = newFiles => {
        if (newFiles.length > 25) {
            setErrors(prev => ({ ...prev, files: 'You can upload up to 25 files.' }))
            return
        }
        const valid = newFiles.filter(f => /\.jpe?g$/i.test(f.name))
        if (valid.length !== newFiles.length) {
            setErrors(prev => ({ ...prev, files: 'Only JPG files are allowed.' }))
            return
        }
        setErrors(prev => ({ ...prev, files: null }))
        setFiles(valid)
        setDims({})
    }

    const handleFileChange = e => {
        updateFiles(Array.from(e.target.files))
    }

    const handleDragEnter = e => { e.preventDefault(); setDragging(true) }
    const handleDragOver = e => e.preventDefault()
    const handleDragLeave = e => { e.preventDefault(); setDragging(false) }
    const handleDrop = e => {
        e.preventDefault()
        setDragging(false)
        updateFiles(Array.from(e.dataTransfer.files))
    }

    const removeImage = idx => {
        setFiles(files.filter((_, i) => i !== idx))
        setDims(prev => {
            const copy = { ...prev }
            delete copy[idx]
            return copy
        })
    }

    // 2) Add this helper right above handleSubmit:
    async function uploadFileInChunks(file, idx) {
        const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
        const identifier = `${file.name.replace(/[^0-9a-z_\-\.]/gi, '')}-${file.size}`;
        let lastResponse;

        for (let chunkNumber = 1; chunkNumber <= totalChunks; chunkNumber++) {
            const start = (chunkNumber - 1) * CHUNK_SIZE;
            const end = Math.min(file.size, start + CHUNK_SIZE);
            const blob = file.slice(start, end, file.type);

            const form = new FormData();
            // append your metadata
            form.append('working_group_id', selectedGroup);
            form.append('product_id', selectedProduct);
            form.append('width', dimensions.width);
            form.append('height', dimensions.height);
            // append the chunk
            form.append('file', blob, file.name);

            // pion/laravel-chunk-upload expects these fields:
            form.append('flowChunkNumber', chunkNumber);
            form.append('flowChunkSize', CHUNK_SIZE);
            form.append('flowCurrentChunkSize', blob.size);
            form.append('flowTotalSize', file.size);
            form.append('flowIdentifier', identifier);
            form.append('flowFilename', file.name);
            form.append('flowRelativePath', file.name);
            form.append('flowTotalChunks', totalChunks);

            form.append('resumableChunkNumber', chunkNumber);
            form.append('resumableChunkSize', CHUNK_SIZE);
            form.append('resumableCurrentChunkSize', blob.size);
            form.append('resumableTotalSize', file.size);
            form.append('resumableIdentifier', identifier);
            form.append('resumableFilename', file.name);
            form.append('resumableRelativePath', file.name);
            form.append('resumableTotalChunks', totalChunks);

            lastResponse = await axios.post(route('admin.storeDesign'), form, {
                onUploadProgress: ev => {
                    // overall percentage for this file
                    const pct = Math.round(((start + ev.loaded) / file.size) * 100);
                    setProgress(p => { const c = [...p]; c[idx] = pct; return c });
                }
            });
        }

        return lastResponse;
    }

    // 3) Your updated handleSubmit:
    const handleSubmit = async e => {
        e.preventDefault();
        // … your existing validation logic …

        setAlert(null);
        setIsSubmitting(true);
        setErrors(prev => ({ ...prev, files: null }));

        if (!selectedGroup || !selectedProduct || !dimensions.width || !dimensions.height || files.length === 0) {
            const validationErrors = {};
            if (!selectedGroup) validationErrors.workingGroup = 'Please select a working group.';
            if (!selectedProduct) validationErrors.product = 'Please select a product.';
            if (!dimensions.width) validationErrors.width = 'Width is required.';
            if (!dimensions.height) validationErrors.height = 'Height is required.';
            if (files.length === 0) validationErrors.files = 'Please select at least one file.';

            setErrors(validationErrors);
            setAlert({ type: 'danger', message: 'Please fill in all required fields.' });
            setIsSubmitting(false);
            return;
        }

        await Promise.all(files.map(async (file, idx) => {
            // mark as uploading
            setStatuses(s => { const c = [...s]; c[idx] = 'uploading'; return c });

            try {
                // this runs the chunked loop
                const res = await uploadFileInChunks(file, idx);

                // lastResponse is the server’s final JSON
                setStatuses(s => { const c = [...s]; c[idx] = 'uploaded'; return c });
                setUploadedUrls(u => { const c = [...u]; c[idx] = res.data.image_url; return c });
                setProgress(p => { const c = [...p]; c[idx] = 100; return c });

                console.log(`Upload complete for ${file.name}: ${idx.done}%`);

                if (res.data && res.data.message) {
                    setAlert({ type: 'success', message: res.data.message });
                }

            } catch (err) {
                setStatuses(s => { const c = [...s]; c[idx] = 'error'; return c });
                setAlert({ type: 'danger', message: 'Upload failed. please try again.' });
                console.error(`Error uploading ${file.name}:`, err);
                setErrors(prev => ({ ...prev, files: `Upload failed. please try again. File Name : ${file.name}` }));
            }
        }));

        setIsSubmitting(false);
    };

    return (
        <>
            <Head title="Add New Design - Admin Dashboard" />
            <Meta title="Add New Design - Admin Dashboard" description="Add New Design to the system" />

            <AdminDashboard userDetails={userDetails}>
                <Breadcrumb title="Add New Design" />

                {alert && <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} />}

                <div className="card">
                    <div className="card-body">
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
                        {/* Instruction Block */}
                        <div className="alert alert-primary">
                            <span className="tw-underline tw-font-medium">Please consider this,</span>
                            <ol className="tw-list-decimal tw-ms-5">
                                <li>Designs must be print-ready JPG files only.</li>
                                <li>Always save a local copy: the server-stored version <strong>cannot be printed directly</strong>.</li>
                                <li>Rename local files to match the system’s names for easy selection.</li>
                                <li>You can upload up to 25 files at once.</li>
                                <li>Google Drive may throttle uploads; <strong>verify each design</strong> after upload.</li>
                            </ol>
                        </div>

                        <form id="designUpload" onSubmit={handleSubmit}>
                            {/* Working Group */}
                            <div className="mb-3">
                                <label htmlFor="workingGroup" className="form-label">
                                    Select a working group for design
                                </label>
                                <select
                                    id="workingGroup"
                                    className="form-select"
                                    value={selectedGroup}
                                    onChange={handleGroupChange}
                                >
                                    <option value="">Select a working group</option>
                                    {workingGroups.map(g => (
                                        <option key={g.id} value={g.id}>{g.name}</option>
                                    ))}
                                </select>
                                {errors.workingGroup && <div className="text-danger mt-1">{errors.workingGroup}</div>}
                            </div>

                            {/* Product */}
                            <div className="mb-3">
                                <label htmlFor="product" className="form-label">
                                    Select a product
                                </label>
                                <select
                                    id="product"
                                    className="form-select"
                                    value={selectedProduct}
                                    onChange={handleProductChange}
                                    disabled={!selectedGroup || products.length === 0}
                                >
                                    <option value="">
                                        {!selectedGroup ? 'Select a working group first' : 'Select a product'}
                                    </option>
                                    {products.map(p => (
                                        <option key={p.id} value={p.id}>{p.name}</option>
                                    ))}
                                </select>
                                {errors.product && <div className="text-danger mt-1">{errors.product}</div>}
                            </div>

                            {/* Dimensions */}
                            <div className="input-group mb-3">
                                <input
                                    type="number"
                                    name="width"
                                    value={dimensions.width}
                                    onChange={handleDimensionChange}
                                    className="form-control"
                                    placeholder="Width"
                                />
                                <span className="input-group-text">x</span>
                                <input
                                    type="number"
                                    name="height"
                                    value={dimensions.height}
                                    onChange={handleDimensionChange}
                                    className="form-control"
                                    placeholder="Height"
                                />
                            </div>
                            {errors.width && <div className="text-danger mb-2">{errors.width}</div>}
                            {errors.height && <div className="text-danger mb-2">{errors.height}</div>}

                            {/* File Upload */}
                            <label htmlFor="file-input" className="tw-font-semibold tw-text-xl">
                                Upload Designs
                            </label>
                            <div className="d-flex tw-justify-between mb-2">
                                <div className="tw-text-sm">Support file types: JPG | Max files: 25</div>
                                <div className="tw-text-sm">Total selected: {files.length}</div>
                            </div>
                            {errors.files && <div className="text-danger mb-2">{errors.files}</div>}

                            <div
                                className={`upload-image-wrapper d-flex align-items-center gap-3 tw-mt-4 ${dragging ? 'bg-blue-50 border-blue-400' : ''}`}
                                onDragEnter={handleDragEnter}
                                onDragOver={handleDragOver}
                                onDragLeave={handleDragLeave}
                                onDrop={handleDrop}
                            >
                                <label
                                    htmlFor="file-input"
                                    className="upload-file tw-h-[200px] tw-w-full border input-form-light radius-8 overflow-hidden border-dashed bg-neutral-50 bg-hover-neutral-200 d-flex align-items-center flex-column justify-content-center gap-1"
                                >
                                    <Icon icon="solar:camera-outline" className="text-xl text-secondary-light" />
                                    <span className="fw-semibold text-secondary-light">
                                        Drag &amp; Drop or browse files
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
                                    disabled={files.length >= 25 || isSubmitting}
                                />
                            </div>

                            {/* Previews with progress, status & uploaded image */}
                            {previews.length > 0 && (
                                <div className="d-flex flex-wrap gap-3 tw-mt-4">
                                    {previews.map((src, idx) => {
                                        const ratio = dims[idx] ? `${dims[idx].w}/${dims[idx].h}` : '1/1'
                                        return (
                                            <div
                                                key={idx}
                                                className="position-relative radius-8 overflow-hidden border input-form-light"
                                                style={{
                                                    aspectRatio: ratio,
                                                    maxWidth: '250px',
                                                    width: '100%',
                                                    flex: '1 1 150px'
                                                }}
                                            >
                                                {/* Remove */}
                                                <button
                                                    type="button"
                                                    onClick={() => removeImage(idx)}
                                                    className="position-absolute top-0 end-0 z-1 p-1 bg-white rounded-full shadow"
                                                    disabled={isSubmitting}
                                                >
                                                    <Icon icon="radix-icons:cross-2" className="text-danger-600" />
                                                </button>

                                                {/* Local preview */}
                                                <img
                                                    src={src}
                                                    alt={`Preview ${idx + 1}`}
                                                    className="w-full h-full object-contain"
                                                    onLoad={e => {
                                                        const { naturalWidth: w, naturalHeight: h } = e.target
                                                        setDims(cur => ({ ...cur, [idx]: { w, h } }))
                                                    }}
                                                />

                                                {/* Progress bar */}
                                                {statuses[idx] === 'uploading' && (
                                                    <progress
                                                        value={progress[idx]}
                                                        max="100"
                                                        className="position-absolute bottom-0 start-0 w-full"
                                                    />
                                                )}

                                                {/* Success icon */}
                                                {statuses[idx] === 'uploaded' && (
                                                    <Icon
                                                        icon="eva:checkmark-circle-2-outline"
                                                        className="position-absolute top-1 end-1 text-success"
                                                    />
                                                )}

                                                {/* Show uploaded image from Drive */}
                                                {statuses[idx] === 'uploaded' && uploadedUrls[idx] && (
                                                    <img
                                                        src={uploadedUrls[idx]}
                                                        alt="Uploaded"
                                                        className="w-full mt-2 border rounded"
                                                        style={{ maxHeight: '100px', objectFit: 'contain' }}
                                                    />
                                                )}

                                                {/* Error icon */}
                                                {statuses[idx] === 'error' && (
                                                    <Icon
                                                        icon="eva:close-circle-outline"
                                                        className="position-absolute top-1 end-1 text-danger"
                                                    />
                                                )}
                                            </div>
                                        )
                                    })}
                                </div>
                            )}

                            <button
                                type="submit"
                                className="btn btn-primary tw-mt-4"
                                disabled={isSubmitting}
                            >
                                {isSubmitting && (
                                    <span
                                        className="spinner-border spinner-border-sm me-2"
                                        role="status"
                                        aria-hidden="true"
                                    />
                                )}
                                Upload Design
                            </button>
                        </form>
                    </div>
                </div>
            </AdminDashboard>
            <CookiesV />




        </>
    )
}

export default AddDesign
