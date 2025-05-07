import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Head, router, Link } from '@inertiajs/react';
import AdminDashboard from '@/Layouts/AdminDashboard';
import Breadcrumb from "@/components/Breadcrumb";
import { Icon } from "@iconify/react";
import CookiesV from '@/Components/CookieConsent';
import Alert from "@/Components/Alert";
import Meta from "@/Components/Metaheads";
import hljs from "highlight.js";
import ReactQuill from "react-quill-new";
import 'react-quill-new/dist/quill.snow.css';

const AddE = ({ userDetails, workingGroups }) => {
    const today = new Date().toISOString().split('T')[0];
    const [alert, setAlert] = useState(null);
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);

    const [form, setForm] = useState({
        estimate_number: '',
        working_group_id: '',
        client_name: '',
        client_address: '',
        client_phone: '',
        issue_date: today,
        due_date: today,
        notes: '',
        items: [
            { description: '', qty: 1, unit: '', unit_price: 0 }
        ]
    });

    // Add new line item
    const addItem = () => {
        setForm(prev => ({
            ...prev,
            items: [...prev.items, { description: '', qty: 1, unit: '', unit_price: 0 }]
        }));
    };

    // Remove a line item
    const removeItem = (idx) => {
        setForm(prev => ({
            ...prev,
            items: prev.items.filter((_, i) => i !== idx)
        }));
    };

    // Handle change on top-level fields
    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    // Handle change in a specific item
    const handleItemChange = (idx, e) => {
        const { name, value } = e.target;
        setForm(prev => {
            const items = [...prev.items];
            items[idx][name] = name === 'qty' || name === 'unit_price' ? parseFloat(value) : value;
            return { ...prev, items };
        });
    };

    // Compute totals
    const subtotal = form.items.reduce((sum, item) => sum + (item.qty * item.unit_price), 0);
    const discount = 0;
    const tax = 0;
    const total = subtotal - discount + tax;

    // Submit handler
    const submit = (e) => {
        e.preventDefault();
        setLoading(true);
        setErrors({});

        router.post(route('admin.estimates.store'), form, {
            preserveState: true,
            preserveScroll: true,
            onSuccess: () => {
                setAlert({ type: 'success', message: 'Estimate created successfully!' });
                setForm({
                    estimate_number: '', working_group_id: '', client_name: '', client_address: '',
                    client_phone: '', issue_date: today, due_date: today, notes: '',
                    items: [{ description: '', qty: 1, unit: '', unit_price: 0 }]
                });
            },
            onError: errs => {
                setErrors(errs);
                setAlert({ type: 'danger', message: 'Please fix the errors below.' });
            },
            onFinish: () => setLoading(false)
        });
    };

    return (
        <>
            <Head title="Add New Estimate - Admin Dashboard" />
            <Meta title="Add New Estimate - Admin Dashboard" description="Add New Estimate" />

            <AdminDashboard userDetails={userDetails}>
                <Breadcrumb title="Add New Estimate" />
                {alert && <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} />}
                <div className="card h-100 p-0 radius-12">
                    <div className="card-header border-bottom bg-base py-16 px-24 d-flex align-items-center flex-wrap gap-3 justify-content-between">
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
                        <div className="mb-0 tw-font-semibold tw-text-2xl">Add New Estimate</div>
                    </div>
                    <div className="card-body p-24">

                        <div className="row">
                            <div className="col-sm-7 p-5">

                                <form onSubmit={submit}>

                                    <div className="mb-3">
                                        <label className="form-label">Estimate #</label>
                                        <input
                                            name="estimate_number"
                                            type="text"
                                            className="form-control"
                                            value={form.estimate_number}
                                            onChange={handleChange}
                                        />
                                        {errors.estimate_number && <div className="text-danger mt-1">{errors.estimate_number}</div>}
                                    </div>

                                    <div className="mb-3">
                                        <label className="form-label">Working Group</label>
                                        <select
                                            name="working_group_id"
                                            className="form-select"
                                            value={form.working_group_id}
                                            onChange={handleChange}
                                        >
                                            <option value="">Select Group</option>
                                            {workingGroups.map(wg => <option key={wg.id} value={wg.id}>{wg.name}</option>)}
                                        </select>
                                        {errors.working_group_id && <div className="text-danger mt-1">{errors.working_group_id}</div>}
                                    </div>

                                    <div className="row">
                                        <div className="col-sm-6 mb-3">
                                            <label className="form-label">Issue Date</label>
                                            <input
                                                name="issue_date"
                                                type="date"
                                                className="form-control"
                                                value={form.issue_date}
                                                onChange={handleChange}
                                            />
                                        </div>
                                        <div className="col-sm-6 mb-3">
                                            <label className="form-label">Due Date</label>
                                            <input
                                                name="due_date"
                                                type="date"
                                                className="form-control"
                                                value={form.due_date}
                                                onChange={handleChange}
                                            />
                                        </div>
                                    </div>

                                    <div className="mb-3">
                                        <label className="form-label">Client Name</label>
                                        <input name="client_name" type="text" className="form-control" value={form.client_name} onChange={handleChange} />
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label">Client Address</label>
                                        <textarea name="client_address" className="form-control" rows={2} value={form.client_address} onChange={handleChange} />
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label">Client Phone</label>
                                        <div className="input-group">
                                            <span className="input-group-text">
                                                <Icon icon="ic:baseline-phone" />
                                            </span>
                                            <input name="client_phone" type="tel" className="form-control" value={form.client_phone} onChange={handleChange} />
                                        </div>
                                    </div>

                                    <h5 className="mt-4">Line Items</h5>
                                    <div className="table-responsive">
                                        <table className="table bordered-table text-sm">
                                            <thead>
                                                <tr>
                                                    <th>SL.</th><th>Description</th><th>Qty</th><th>Unit</th><th>Unit Price</th><th>Price</th><th className="text-center">Action</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {form.items.map((item, i) => (
                                                    <tr key={i}>
                                                        <td>{i + 1}</td>
                                                        <td><input name="description" className="form-control" value={item.description} onChange={e => handleItemChange(i, e)} /></td>
                                                        <td><input name="qty" type="number" className="form-control" value={item.qty} onChange={e => handleItemChange(i, e)} /></td>
                                                        <td><input name="unit" className="form-control" value={item.unit} onChange={e => handleItemChange(i, e)} /></td>
                                                        <td><input name="unit_price" type="number" className="form-control" value={item.unit_price} onChange={e => handleItemChange(i, e)} /></td>
                                                        <td>${(item.qty * item.unit_price).toFixed(2)}</td>
                                                        <td className="text-center">
                                                            <button type="button" className="remove-row" onClick={() => removeItem(i)}>
                                                                <Icon icon="ic:twotone-close" className="text-danger-main text-xl" />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                    <button type="button" className="btn btn-sm btn-primary-600 radius-8 d-inline-flex align-items-center gap-1 mt-2" onClick={addItem}>
                                        <Icon icon="simple-line-icons:plus" className="text-xl" /> Add New
                                    </button>

                                    <div className="mb-3 mt-4">
                                        <label className="form-label">Notes (optional)</label>
                                        <ReactQuill value={form.notes} onChange={val => setForm(prev => ({ ...prev, notes: val }))} />
                                    </div>

                                    <div className="mt-4">
                                        {loading ? (
                                            <button type="button" className="btn btn-primary" disabled>
                                                Saving...
                                            </button>
                                        ) : (
                                            <button type="submit" className="btn btn-primary">Save Estimate</button>
                                        )}
                                    </div>

                                </form>

                            </div>

                            {/* display estimate */}
                            <div className="col-sm-5">

                                <div className="row justify-content-center" id="invoice">
                                    <div className="m-3">
                                        <div className="shadow-4 border radius-8">
                                            <div className="p-20 border-bottom">
                                                <div className="row justify-content-between g-3">
                                                    <div className="col-sm-4">
                                                        <h3 className="text-xl tw-font-bold">Estimate #349245</h3>
                                                        <p className="mb-1 text-sm">
                                                            Date Issued:{" "}
                                                            <span className="asp12df">
                                                                25/08/2020
                                                            </span>{" "}
                                                             
                                                        </p>
                                                        <p className="mb-0 text-sm">
                                                            Date Due:{" "}
                                                            <span className="asp12df">
                                                                29/08/2020
                                                            </span>{" "}
                                                             
                                                        </p>
                                                    </div>
                                                    <div className="col-sm-4">
                                                        <img
                                                            src="/images/printairlogo.png"
                                                            alt="image_icon"
                                                            className="mb-8"
                                                        />
                                                        <p className="mb-1 text-sm">
                                                            <span className="tw-inline-flex tw-items-center">
                                                                <Icon
                                                                    icon="mdi:location"
                                                                    className="tw-flex-shrink-0 tw-mr-1 tw-align-middle"
                                                                />
                                                                <span className="tw-align-middle">No. 67/D/1, Uggashena Road, Walpola, Ragama, Sri Lanka</span>
                                                            </span>
                                                        </p>
                                                        <p className="mb-0 text-sm">
                                                        <span className="tw-inline-flex tw-items-center">
                                                                <Icon
                                                                    icon="lets-icons:e-mail"
                                                                    className="tw-flex-shrink-0 tw-mr-1 tw-align-middle"
                                                                />
                                                                <span className="tw-align-middle">contact@printair.lk</span>
                                                            </span>
                                                            <br />
                                                            <span className="tw-inline-flex tw-items-center">
                                                                <Icon
                                                                    icon="ic:baseline-phone"
                                                                    className="tw-flex-shrink-0 tw-mr-1 tw-align-middle"
                                                                />
                                                                <span className="tw-align-middle">+94 76 886 0175</span>
                                                            </span>
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="py-28 px-20">
                                                <div className="d-flex flex-wrap justify-content-between align-items-end gap-3">
                                                    <div>
                                                        <h6 className="text-md tw-font-semibold">Issus For:</h6>
                                                        <table className="text-sm text-secondary-light">
                                                            <tbody>
                                                                <tr>
                                                                    <td>Name</td>
                                                                    <td className="ps-8">
                                                                        :{" "}
                                                                        <span className="asp12df">
                                                                            Will Marthas
                                                                        </span>
                                                                        
                                                                    </td>
                                                                </tr>
                                                                <tr>
                                                                    <td>Address</td>
                                                                    <td className="ps-8">
                                                                        :{" "}
                                                                        <span className="asp12df">
                                                                            4517 Washington Ave.USA
                                                                        </span>{" "}
                                                                         
                                                                    </td>
                                                                </tr>
                                                                <tr>
                                                                    <td>Phone number</td>
                                                                    <td className="ps-8">
                                                                        :{" "}
                                                                        <span className="asp12df">
                                                                            +1 543 2198
                                                                        </span>{" "}
                                                                         
                                                                    </td>
                                                                </tr>
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                    <div>
                                                        <table className="text-sm text-secondary-light">
                                                            <tbody>
                                                                <tr>
                                                                    <td>Issus Date</td>
                                                                    <td className="ps-8">:25 Jan 2024</td>
                                                                </tr>
                                                                <tr>
                                                                    <td>P.O. #</td>
                                                                    <td className="ps-8">:#653214</td>
                                                                </tr>
                                                                <tr>
                                                                    <td>Shipment ID</td>
                                                                    <td className="ps-8">:#965215</td>
                                                                </tr>
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                </div>
                                                <div className="mt-24">
                                                    <div className="table-responsive scroll-sm">
                                                        <table className="tw-w-full tw-border-collapse tw-text-sm tw-mb-3" id="invoice-table">
                                                            <thead className="tw-bg-red-500">
                                                                <tr>
                                                                    <th className="tw-border  tw-border-gray-200 tw-px-3 tw-py-2 tw-text-white tw-font-semibold">SL.</th>
                                                                    <th className="tw-border tw-border-gray-200 tw-px-3 tw-py-2 tw-text-white tw-font-semibold">Items</th>
                                                                    <th className="tw-border tw-border-gray-200 tw-px-3 tw-py-2 tw-text-white tw-font-semibold">Description</th>
                                                                    <th className="tw-border tw-border-gray-200 tw-px-3 tw-py-2 tw-text-white tw-font-semibold">Qty</th>
                                                                    <th className="tw-border tw-border-gray-200 tw-px-3 tw-py-2 tw-text-white tw-font-semibold">Units</th>
                                                                    <th className="tw-border tw-border-gray-200 tw-px-3 tw-py-2 tw-text-white tw-font-semibold">Unit Price</th>
                                                                    <th className="tw-border tw-border-gray-200 tw-px-3 tw-py-2 tw-text-white tw-font-semibold">Price</th>
                                                                    
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                <tr className="tw-even:bg-gray-50 tw-hover:bg-gray-100">
                                                                    <td className="tw-border tw-border-gray-200 tw-px-3 tw-py-2">01</td>
                                                                    <td className="tw-border tw-border-gray-200 tw-px-3 tw-py-2">Apple’s Shoes</td>
                                                                    <td className="tw-border tw-border-gray-200 tw-px-3 tw-py-2">Description</td>
                                                                    <td className="tw-border tw-border-gray-200 tw-px-3 tw-py-2">5</td>
                                                                    <td className="tw-border tw-border-gray-200 tw-px-3 tw-py-2">PC</td>
                                                                    <td className="tw-border tw-border-gray-200 tw-px-3 tw-py-2">LKR 200</td>
                                                                    <td className="tw-border tw-border-gray-200 tw-px-3 tw-py-2">LKR 1,000.00</td>
                                                                    
                                                                </tr>
                                                                
                                                            </tbody>
                                                        </table>

                                                    </div>
                                                    <div>
                                                        <button
                                                            type="button"
                                                            id="addRow"
                                                            className="btn btn-sm btn-primary-600 radius-8 d-inline-flex align-items-center gap-1"
                                                        >
                                                            <Icon
                                                                icon="simple-line-icons:plus"
                                                                className="text-xl"
                                                            />
                                                            Add New
                                                        </button>
                                                    </div>
                                                    <div className="d-flex flex-wrap justify-content-between gap-3 mt-24">
                                                        <div>
                                                            <p className="text-sm mb-0">
                                                                <span className="text-primary-light fw-semibold">
                                                                    Sales By:
                                                                </span>{" "}
                                                                Jammal
                                                            </p>
                                                            <p className="text-sm mb-0">Thanks for your business</p>
                                                            <div className="mb-0">
                                                                <div className="tw-font-semibold tw-text-sm tw-text-black">Notes</div>
                                                                <p className='tw-text-sm tw-max-w-96'>Notes goes here with payment terms for the customer.</p>
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <table className="text-sm">
                                                                <tbody>
                                                                    <tr>
                                                                        <td className="pe-64">Subtotal:</td>
                                                                        <td className="pe-16">
                                                                            <span className="text-primary-light fw-semibold">
                                                                                LKR 4000.00
                                                                            </span>
                                                                        </td>
                                                                    </tr>
                                                                    <tr>
                                                                        <td className="pe-64">Discount:</td>
                                                                        <td className="pe-16">
                                                                            <span className="text-primary-light fw-semibold">
                                                                                LKR 0.00
                                                                            </span>
                                                                        </td>
                                                                    </tr>
                                                                    <tr>
                                                                        <td className="pe-64 border-bottom pb-4">Tax:</td>
                                                                        <td className="pe-16 border-bottom pb-4">
                                                                            <span className="text-primary-light fw-semibold">
                                                                                LKR 0.00
                                                                            </span>
                                                                        </td>
                                                                    </tr>
                                                                    <tr>
                                                                        <td className="pe-64 pt-4">
                                                                            <span className="text-primary-light fw-semibold">
                                                                                Total:
                                                                            </span>
                                                                        </td>
                                                                        <td className="pe-16 pt-4">
                                                                            <span className="text-primary-light fw-semibold">
                                                                                LKR 1690.00
                                                                            </span>
                                                                        </td>
                                                                    </tr>
                                                                </tbody>
                                                            </table>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="mt-64">
                                                    
                                                    <p className="text-center text-secondary-light text-sm fw-semibold">
                                                        Thank you for your purchase!
                                                    </p>
                                                </div>
                                                <div className="d-flex flex-wrap justify-content-between align-items-end mt-64">
                                                    <div className="text-sm border-top d-inline-block px-12">
                                                        Signature of Customer
                                                    </div>
                                                    <div className="text-sm border-top d-inline-block px-12">
                                                        Signature of Authorized
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
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

export default AddE