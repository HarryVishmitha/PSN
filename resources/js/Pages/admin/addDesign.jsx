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
import ReactSelect from 'react-select'

const AddDesign = ({ userDetails }) => {
    const [alert, setAlert] = useState(null)    // { type, message }
    const [errors, setErrors] = useState({})

    // upload state
    const [files, setFiles] = useState([])
    const [previews, setPreviews] = useState([])
    const [dims, setDims] = useState({})   // { idx: { w, h } }
    const [dragging, setDragging] = useState(false)
    const fileInputRef = useRef(null)

    // build previews whenever files change
    useEffect(() => {
        const urls = files.map(f => URL.createObjectURL(f))
        setPreviews(urls)
        return () => urls.forEach(u => URL.revokeObjectURL(u))
    }, [files])

    // handle incoming File objects array
    const handleFiles = incoming => {
        // filter JPG only
        const jpgs = incoming.filter(f =>
            f.type === 'image/jpeg' || /\.(jpe?g)$/i.test(f.name)
        )
        if (jpgs.length < incoming.length) {
            setAlert({ type: 'danger', message: 'Only JPG files are allowed.' })
        }
        // enforce 25‑file maximum
        if (files.length + jpgs.length > 25) {
            setAlert({ type: 'danger', message: 'You can upload up to 25 files.' })
            return
        }
        setFiles(cur => [...cur, ...jpgs])
    }

    // file‑browse selection
    const handleFileChange = e => {
        handleFiles(Array.from(e.target.files))
        e.target.value = '' // reset so same file can be re‑selected
    }

    // drag & drop handlers
    const handleDragEnter = e => { e.preventDefault(); e.stopPropagation(); setDragging(true) }
    const handleDragOver = e => { e.preventDefault(); e.stopPropagation(); setDragging(true) }
    const handleDragLeave = e => { e.preventDefault(); e.stopPropagation(); setDragging(false) }
    const handleDrop = e => {
        e.preventDefault(); e.stopPropagation(); setDragging(false)
        handleFiles(Array.from(e.dataTransfer.files))
    }

    // remove a single file
    const removeImage = idx => {
        setFiles(cur => cur.filter((_, i) => i !== idx))
        setDims(cur => {
            const next = { ...cur }
            delete next[idx]
            return next
        })
    }

    return (
        <>
            <Head title="Add New Design - Admin Dashboard" />
            <Meta title="Add New Design - Admin Dashboard" description="Add New Design to the system" />

            <AdminDashboard userDetails={userDetails}>
                <Breadcrumb title="Add New Design" />

                {alert && (
                    <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} />
                )}

                <div className="card">
                    <div className="card-body">
                        {Object.keys(errors).length > 0 && (
                            <div
                                className="alert alert-danger bg-danger-100 text-danger-600 border-danger-600 border-start-width-4-px border-top-0 border-end-0 border-bottom-0 px-24 py-13 mb-0 fw-semibold text-lg radius-4 d-flex align-items-center justify-content-between"
                                role="alert"
                            >
                                <ol>
                                    {Object.values(errors).map((err, i) => <li key={i}>{err}</li>)}
                                </ol>
                            </div>
                        )}

                        <div className="alert alert-primary">
                            <span className="tw-underline tw-font-medium">Please consider this,</span>
                            <ol className="tw-list-decimal tw-ms-5">
                                <li>Designs must be print‑ready JPG files only.</li>
                                <li>
                                    Always save a local copy: the server‑stored version{' '}
                                    <strong>cannot be printed directly</strong>.
                                </li>
                                <li>Rename local files to match the system’s names for easy selection.</li>
                                <li>You can upload up to 25 files at once.</li>
                                <li>
                                    Google Drive may throttle uploads; <strong>verify each design</strong> after upload.
                                </li>
                            </ol>
                        </div>

                        <div className="tw-text-black tw-mt-3">
                            <label htmlFor="designUpload" className="tw-font-semibold tw-text-xl">
                                Upload Designs
                            </label>
                            <div className="d-flex tw-justify-between">
                                <div className="tw-text-sm tw-mt-3">
                                    <span className="tw-font-semibold tw-me-3">Files Upload</span>
                                    Support file types: JPG | Max size: 1 GB
                                </div>
                                <div className="tw-text-sm">
                                    <span className="tw-font-semibold tw-me-3">Total files selected:</span>
                                    {files.length}
                                </div>
                            </div>

                            {/* — upload wrapper with drag & drop — */}
                            <div
                                className={`upload-image-wrapper d-flex align-items-center gap-3 tw-mt-4 ${dragging ? 'bg-blue-50 border-blue-400' : ''}`}
                                onDragEnter={handleDragEnter}
                                onDragOver={handleDragOver}
                                onDragLeave={handleDragLeave}
                                onDrop={handleDrop}
                            >
                                <label
                                    className="upload-file tw-h-[200px] tw-w-full border input-form-light radius-8 overflow-hidden border-dashed bg-neutral-50 bg-hover-neutral-200 d-flex align-items-center flex-column justify-content-center gap-1"
                                    htmlFor="designUpload"
                                >
                                    <Icon icon="solar:camera-outline" className="text-xl text-secondary-light" />
                                    <span className="fw-semibold text-secondary-light">
                                        Drag &amp; Drop or browse files
                                    </span>
                                </label>

                                <input
                                    id="designUpload"
                                    type="file"
                                    accept=".jpg,.jpeg"
                                    multiple
                                    hidden
                                    ref={fileInputRef}
                                    onChange={handleFileChange}
                                    disabled={files.length >= 25}
                                />
                            </div>

                            {/* — responsive, ratio‑preserving previews — */}
                            {previews.length > 0 && (
                                <div className="d-flex flex-wrap gap-3 tw-mt-4">
                                    {previews.map((src, idx) => {
                                        // fetch dims only once per image
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
                                                <button
                                                    type="button"
                                                    onClick={() => removeImage(idx)}
                                                    className="position-absolute top-0 end-0 z-1 p-1 bg-white rounded-full shadow"
                                                    aria-label="Remove uploaded image"
                                                >
                                                    <Icon icon="radix-icons:cross-2" className="text-danger-600" />
                                                </button>
                                                <img
                                                    src={src}
                                                    alt={`Preview ${idx + 1}`}
                                                    className="w-full h-full object-contain"
                                                    onLoad={e => {
                                                        const { naturalWidth: w, naturalHeight: h } = e.target
                                                        setDims(cur => cur[idx] ? cur : { ...cur, [idx]: { w, h } })
                                                    }}
                                                />
                                            </div>
                                        )
                                    })}
                                </div>
                            )}
                            {/* — end previews — */}
                        </div>
                    </div>
                </div>
            </AdminDashboard>

            <CookiesV />
        </>
    )
}

export default AddDesign
