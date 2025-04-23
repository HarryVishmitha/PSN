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

    // upload status & progress per file
    const [statuses, setStatuses] = useState([])      // 'pending'|'uploading'|'uploaded'|'error'
    const [progress, setProgress] = useState([])      // number 0–100
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

    // generate previews when files change
    useEffect(() => {
        setStatuses(files.map(() => 'pending'))
        setProgress(files.map(() => 0))

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
        const selected = Array.from(e.target.files)
        updateFiles(selected)
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

    const handleSubmit = async e => {
        e.preventDefault()

        // --- client-side validation ---
        const newErrors = {}
        if (!selectedGroup) newErrors.workingGroup = 'Please select a working group'
        if (!selectedProduct) newErrors.product = 'Please select a product'
        if (!dimensions.width) newErrors.width = 'Width is required'
        if (!dimensions.height) newErrors.height = 'Height is required'
        if (files.length === 0) newErrors.files = 'Please upload at least one file'

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors)
            setAlert({ type: 'danger', message: 'Fix validation errors before submitting.' })
            return
        }

        setAlert(null)
        setIsSubmitting(true)

        // upload each file in parallel
        await Promise.all(files.map((file, idx) => {
            setStatuses(s => { const c = [...s]; c[idx] = 'uploading'; return c })

            const form = new FormData()
            form.append('working_group_id', selectedGroup)
            form.append('product_id', selectedProduct)
            form.append('width', dimensions.width)
            form.append('height', dimensions.height)
            form.append('file', file)

            return axios.post(route('admin.storeDesign'), form, {
                onUploadProgress: ev => {
                    const pct = Math.round((ev.loaded * 100) / ev.total)
                    setProgress(p => { const c = [...p]; c[idx] = pct; return c })
                }
            })
                .then(() => {
                    setStatuses(s => { const c = [...s]; c[idx] = 'uploaded'; return c })
                })
                .catch(() => {
                    setStatuses(s => { const c = [...s]; c[idx] = 'error'; return c })
                })
        }))

        setIsSubmitting(false)
        setAlert({ type: 'success', message: 'All uploads complete.' })
    }

    return (
        <>
            <Head title="Add New Design - Admin Dashboard" />
            <Meta title="Add New Design - Admin Dashboard" description="Add New Design to the system" />

            <AdminDashboard userDetails={userDetails}>
                <Breadcrumb title="Add New Design" />
                {alert && <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} />}

                <div className="card">
                    <div className="card-body">
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
                                {errors.workingGroup && (
                                    <div className="text-danger mt-1">{errors.workingGroup}</div>
                                )}
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
                                {errors.product && (
                                    <div className="text-danger mt-1">{errors.product}</div>
                                )}
                            </div>

                            {/* Dimensions */}
                            <div className="input-group mb-3">
                                <input
                                    type="text"
                                    name="width"
                                    value={dimensions.width}
                                    onChange={handleDimensionChange}
                                    className="form-control"
                                    placeholder="Width"
                                    aria-label="width"
                                />
                                <span className="input-group-text">x</span>
                                <input
                                    type="text"
                                    name="height"
                                    value={dimensions.height}
                                    onChange={handleDimensionChange}
                                    className="form-control"
                                    placeholder="Height"
                                    aria-label="height"
                                />
                            </div>
                            {errors.width && (
                                <div className="text-danger mb-2">{errors.width}</div>
                            )}
                            {errors.height && (
                                <div className="text-danger mb-2">{errors.height}</div>
                            )}

                            {/* File Upload */}
                            <label htmlFor="file-input" className="tw-font-semibold tw-text-xl">
                                Upload Designs
                            </label>
                            <div className="d-flex tw-justify-between mb-2">
                                <div className="tw-text-sm">Support file types: JPG | Max files: 25</div>
                                <div className="tw-text-sm">Total selected: {files.length}</div>
                            </div>
                            {errors.files && (
                                <div className="text-danger mb-2">{errors.files}</div>
                            )}

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

                            {/* Previews with progress & status */}
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
                                                {/* Remove button */}
                                                <button
                                                    type="button"
                                                    onClick={() => removeImage(idx)}
                                                    className="position-absolute top-0 end-0 z-1 p-1 bg-white rounded-full shadow"
                                                    aria-label="Remove uploaded image"
                                                    disabled={isSubmitting}
                                                >
                                                    <Icon icon="radix-icons:cross-2" className="text-danger-600" />
                                                </button>

                                                {/* Thumbnail */}
                                                <img
                                                    src={src}
                                                    alt={`Preview ${idx + 1}`}
                                                    className="w-full h-full	object-contain"
                                                    onLoad={e => {
                                                        const { naturalWidth: w, naturalHeight: h } = e.target
                                                        setDims(cur => ({ ...cur, [idx]: { w, h } }))
                                                    }}
                                                />

                                                {/* Uploading progress bar */}
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
