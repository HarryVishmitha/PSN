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

                        <div className="tw-mt-3">
                            
                        </div>
                    </div>
                </div>
            </AdminDashboard>

            <CookiesV />
        </>
    )
}

export default AddDesign
