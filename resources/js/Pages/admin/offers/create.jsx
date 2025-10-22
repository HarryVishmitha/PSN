import React, { useState } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import AdminDashboard from '@/Layouts/AdminDashboard';
import Breadcrumb from '@/Components/Breadcrumb';
import { Icon } from '@iconify/react';
import Alert from '@/Components/Alert';
import Meta from '@/Components/Metaheads';

export default function CreateOffer({ userDetails, products, workingGroups }) {
    const [alert, setAlert] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        code: '',
        description: '',
        image: null,
        offer_type: 'percentage',
        discount_value: '',
        min_purchase_amt: '',
        start_date: '',
        end_date: '',
        usage_limit: '',
        per_customer_limit: '',
        status: 'active',
        working_group_ids: [],
        product_ids: [],
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('admin.offers.store'), {
            forceFormData: true,
            onSuccess: () => {
                setAlert({ type: 'success', message: 'Offer created successfully!' });
            },
            onError: () => {
                setAlert({ type: 'danger', message: 'Failed to create offer. Please check the form.' });
            }
        });
    };

    const generateCode = () => {
        const code = `OFFER${Date.now().toString().slice(-6)}`;
        setData('code', code);
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setData('image', file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const removeImage = () => {
        setData('image', null);
        setImagePreview(null);
    };

    const toggleProduct = (productId) => {
        if (data.product_ids.includes(productId)) {
            setData('product_ids', data.product_ids.filter(id => id !== productId));
        } else {
            setData('product_ids', [...data.product_ids, productId]);
        }
    };

    const toggleWorkingGroup = (groupId) => {
        if (data.working_group_ids.includes(groupId)) {
            setData('working_group_ids', data.working_group_ids.filter(id => id !== groupId));
        } else {
            setData('working_group_ids', [...data.working_group_ids, groupId]);
        }
    };

    const selectAllProducts = () => {
        setData('product_ids', products.map(p => p.id));
    };

    const clearAllProducts = () => {
        setData('product_ids', []);
    };

    const selectAllWorkingGroups = () => {
        setData('working_group_ids', workingGroups.map(wg => wg.id));
    };

    const clearAllWorkingGroups = () => {
        setData('working_group_ids', []);
    };

    return (
        <>
            <Head title="Create Offer - Admin Dashboard" />
            <Meta title="Create New Offer" description="Create a new limited-time offer" />

            <AdminDashboard userDetails={userDetails}>
                <Breadcrumb
                    title="Create Offer"
                    items={[
                        { label: 'Offers', href: route('admin.offers.index') },
                        { label: 'Create' }
                    ]}
                />

                {alert && <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} />}

                <div className="card h-100 p-0 radius-12 shadow-sm">
                    <div className="card-header border-bottom py-16 px-24" style={{ background: 'linear-gradient(135deg, #f44032 0%, #d32f2f 100%)' }}>
                        <div className="d-flex align-items-center justify-content-between">
                            <div className="d-flex align-items-center gap-2">
                                <Icon icon="mdi:tag-plus" className="text-white" style={{ fontSize: '28px' }} />
                                <h5 className="fw-bold mb-0 text-white">New Offer Details</h5>
                            </div>
                            <Link
                                href={route('admin.offers.index')}
                                className="btn btn-light d-flex align-items-center gap-2"
                            >
                                <Icon icon="mdi:arrow-left" />
                                Back to List
                            </Link>
                        </div>
                    </div>

                    <div className="card-body">
                        <form onSubmit={handleSubmit}>
                            <div className="row g-4">
                                {/* Basic Info */}
                                <div className="col-12">
                                    <div className="section-header d-flex align-items-center gap-2 mb-3 pb-2 border-bottom">
                                        <Icon icon="mdi:information" className="text-primary" style={{ fontSize: '24px' }} />
                                        <h6 className="fw-bold text-dark mb-0">Basic Information</h6>
                                    </div>
                                </div>

                                <div className="col-md-6">
                                    <label className="form-label fw-semibold text-dark d-flex align-items-center gap-1">
                                        <Icon icon="mdi:tag-text" className="text-primary" />
                                        Offer Name <span className="text-danger">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        className={`form-control form-control-lg ${errors.name ? 'is-invalid' : ''}`}
                                        value={data.name}
                                        onChange={e => setData('name', e.target.value)}
                                        placeholder="e.g., New Year Sale"
                                    />
                                    <small className="text-muted mt-1 d-flex align-items-center gap-1">
                                        <Icon icon="mdi:lightbulb-outline" className="text-warning" style={{ fontSize: '16px', flexShrink: 0 }} /> 
                                        <span>Enter a catchy name that customers will remember</span>
                                    </small>
                                    {errors.name && <div className="invalid-feedback">{errors.name}</div>}
                                </div>

                                <div className="col-md-6">
                                    <label className="form-label fw-semibold text-dark d-flex align-items-center gap-1">
                                        <Icon icon="mdi:barcode" className="text-primary" />
                                        Offer Code <span className="text-danger">*</span>
                                    </label>
                                    <div className="input-group input-group-lg">
                                        <span className="input-group-text bg-light d-flex align-items-center">
                                            <Icon icon="mdi:ticket-percent" />
                                        </span>
                                        <input
                                            type="text"
                                            className={`form-control ${errors.code ? 'is-invalid' : ''}`}
                                            value={data.code}
                                            onChange={e => setData('code', e.target.value.toUpperCase())}
                                            placeholder="NEWYEAR2024"
                                            style={{ fontWeight: '600', letterSpacing: '1px' }}
                                        />
                                        <button
                                            type="button"
                                            className="btn btn-primary"
                                            onClick={generateCode}
                                            title="Generate Random Code"
                                        >
                                            <Icon icon="mdi:refresh" /> Generate
                                        </button>
                                        {errors.code && <div className="invalid-feedback">{errors.code}</div>}
                                    </div>
                                    <small className="text-muted mt-1 d-flex align-items-center gap-1">
                                        <Icon icon="mdi:information-outline" className="text-info" style={{ fontSize: '16px', flexShrink: 0 }} /> 
                                        <span>Use uppercase letters and numbers (e.g., SUMMER2024)</span>
                                    </small>
                                </div>

                                <div className="col-12">
                                    <label className="form-label fw-semibold text-dark d-flex align-items-center gap-1">
                                        <Icon icon="mdi:text-box-outline" className="text-primary" />
                                        Description
                                    </label>
                                    <textarea
                                        className={`form-control ${errors.description ? 'is-invalid' : ''}`}
                                        value={data.description}
                                        onChange={e => setData('description', e.target.value)}
                                        rows="4"
                                        placeholder="Describe what makes this offer special..."
                                        style={{ resize: 'vertical' }}
                                    />
                                    <small className="text-muted mt-1 d-flex align-items-center gap-1">
                                        <Icon icon="mdi:lightbulb-outline" className="text-warning" style={{ fontSize: '16px', flexShrink: 0 }} /> 
                                        <span>Tell customers about the benefits and terms of this offer</span>
                                    </small>
                                    {errors.description && <div className="invalid-feedback">{errors.description}</div>}
                                </div>

                                <div className="col-12">
                                    <label className="form-label fw-semibold text-dark d-flex align-items-center gap-1 mb-3">
                                        <Icon icon="mdi:image" className="text-primary" />
                                        Offer Image (Optional)
                                    </label>
                                    {!imagePreview ? (
                                        <div className="text-center">
                                            <label className="upload-area d-block cursor-pointer p-5 border border-3 border-dashed rounded-3 bg-light position-relative" style={{ transition: 'all 0.3s' }}>
                                                <input
                                                    type="file"
                                                    className="d-none"
                                                    accept="image/*"
                                                    onChange={handleImageChange}
                                                />
                                                <div className="py-4">
                                                    <Icon icon="mdi:cloud-upload" style={{ fontSize: '100px' }} className="text-primary mb-3 d-block opacity-75" />
                                                    <h5 className="fw-bold text-dark mb-2">
                                                        Click to upload or drag and drop
                                                    </h5>
                                                    <p className="text-muted mb-3">
                                                        <Icon icon="mdi:file-image-outline" className="me-1" />
                                                        PNG, JPG, GIF up to 2MB
                                                    </p>
                                                    <div className="d-flex justify-content-center gap-2 mb-3">
                                                        <span className="badge text-white px-3 py-2" style={{ background: 'linear-gradient(135deg, #f44032 0%, #d32f2f 100%)', fontSize: '13px' }}>
                                                            <Icon icon="mdi:crop-square" className="me-1" />
                                                            1080 × 1080 px
                                                        </span>
                                                        <span className="text-muted fw-bold">or</span>
                                                        <span className="badge text-white px-3 py-2" style={{ background: 'linear-gradient(135deg, #f44032 0%, #d32f2f 100%)', fontSize: '13px' }}>
                                                            <Icon icon="mdi:crop-square" className="me-1" />
                                                            1280 × 1280 px
                                                        </span>
                                                    </div>
                                                    <small className="text-muted d-block">
                                                        <Icon icon="mdi:aspect-ratio" className="me-1" />
                                                        Square ratio (1:1) recommended for best display
                                                    </small>
                                                </div>
                                            </label>
                                        </div>
                                    ) : (
                                        <div className="position-relative border border-3 rounded-3 overflow-hidden shadow" style={{ maxWidth: '500px', margin: '0 auto' }}>
                                            <div className="bg-light p-3" style={{ aspectRatio: '1/1' }}>
                                                <img
                                                    src={imagePreview}
                                                    alt="Preview"
                                                    className="w-100 h-100 rounded-2"
                                                    style={{ objectFit: 'cover' }}
                                                />
                                            </div>
                                            <button
                                                type="button"
                                                className="btn btn-danger position-absolute top-0 end-0 m-3 d-flex align-items-center gap-1 shadow"
                                                onClick={removeImage}
                                            >
                                                <Icon icon="mdi:delete" />
                                                Remove
                                            </button>
                                            <div className="position-absolute bottom-0 start-0 end-0 m-3 d-flex justify-content-between align-items-center">
                                                <span className="badge bg-success shadow">
                                                    <Icon icon="mdi:check-circle" /> Image uploaded
                                                </span>
                                                <span className="badge bg-dark shadow">
                                                    <Icon icon="mdi:aspect-ratio" /> Square Format
                                                </span>
                                            </div>
                                        </div>
                                    )}
                                    <small className="text-muted mt-2 d-flex align-items-start gap-1">
                                        <Icon icon="mdi:information-outline" className="text-info" style={{ fontSize: '16px', flexShrink: 0, marginTop: '2px' }} /> 
                                        <span>Upload a square promotional image with offer details. This will be displayed prominently on the offer view page.</span>
                                    </small>
                                    {errors.image && <div className="text-danger mt-2">{errors.image}</div>}
                                </div>

                                {/* Discount Details */}
                                <div className="col-12 mt-4">
                                    <div className="section-header d-flex align-items-center gap-2 mb-3 pb-2 border-bottom">
                                        <Icon icon="mdi:percent-outline" className="text-danger" style={{ fontSize: '24px' }} />
                                        <h6 className="fw-bold text-dark mb-0">Discount Details</h6>
                                    </div>
                                </div>

                                <div className="col-md-4">
                                    <label className="form-label fw-semibold text-dark d-flex align-items-center gap-1">
                                        <Icon icon="mdi:format-list-bulleted-type" className="text-danger" />
                                        Offer Type <span className="text-danger">*</span>
                                    </label>
                                    <select
                                        className={`form-select form-select-lg ${errors.offer_type ? 'is-invalid' : ''}`}
                                        value={data.offer_type}
                                        onChange={e => setData('offer_type', e.target.value)}
                                    >
                                        <option value="percentage">📊 Percentage Discount</option>
                                        <option value="fixed">💰 Fixed Amount</option>
                                        <option value="buy_x_get_y">🎁 Buy X Get Y</option>
                                        <option value="free_shipping">🚚 Free Shipping</option>
                                    </select>
                                    {errors.offer_type && <div className="invalid-feedback">{errors.offer_type}</div>}
                                </div>

                                <div className="col-md-4">
                                    <label className="form-label fw-semibold text-dark d-flex align-items-center gap-1">
                                        <Icon icon="mdi:numeric" className="text-danger" />
                                        {data.offer_type === 'percentage' ? 'Discount Percentage' : 'Discount Value'} <span className="text-danger">*</span>
                                    </label>
                                    <div className="input-group input-group-lg">
                                        <span className="input-group-text bg-danger text-white d-flex align-items-center">
                                            <Icon icon="mdi:sale" />
                                        </span>
                                        <input
                                            type="number"
                                            step="0.01"
                                            className={`form-control ${errors.discount_value ? 'is-invalid' : ''}`}
                                            value={data.discount_value}
                                            onChange={e => setData('discount_value', e.target.value)}
                                            placeholder={data.offer_type === 'percentage' ? '10' : '500'}
                                        />
                                        <span className="input-group-text fw-bold bg-light">
                                            {data.offer_type === 'percentage' ? '%' : 'LKR'}
                                        </span>
                                        {errors.discount_value && <div className="invalid-feedback">{errors.discount_value}</div>}
                                    </div>
                                </div>

                                <div className="col-md-4">
                                    <label className="form-label fw-semibold text-dark d-flex align-items-center gap-1">
                                        <Icon icon="mdi:cart-arrow-up" className="text-warning" />
                                        Minimum Purchase Amount (Optional)
                                    </label>
                                    <div className="input-group input-group-lg">
                                        <span className="input-group-text bg-light d-flex align-items-center">
                                            <Icon icon="mdi:cash" />
                                        </span>
                                        <input
                                            type="number"
                                            step="0.01"
                                            className={`form-control ${errors.min_purchase_amt ? 'is-invalid' : ''}`}
                                            value={data.min_purchase_amt}
                                            onChange={e => setData('min_purchase_amt', e.target.value)}
                                            placeholder="500"
                                        />
                                        <span className="input-group-text fw-bold bg-light">LKR</span>
                                        {errors.min_purchase_amt && <div className="invalid-feedback">{errors.min_purchase_amt}</div>}
                                    </div>
                                    <small className="text-muted mt-1 d-flex align-items-center gap-1">
                                        <Icon icon="mdi:information-outline" className="text-info" style={{ fontSize: '16px', flexShrink: 0 }} /> 
                                        <span>Leave empty for no minimum purchase requirement</span>
                                    </small>
                                </div>

                                {/* Validity Period */}
                                <div className="col-12 mt-4">
                                    <div className="section-header d-flex align-items-center gap-2 mb-3 pb-2 border-bottom">
                                        <Icon icon="mdi:calendar-clock" className="text-success" style={{ fontSize: '24px' }} />
                                        <h6 className="fw-bold text-dark mb-0">Validity Period</h6>
                                    </div>
                                </div>

                                <div className="col-md-6">
                                    <label className="form-label fw-semibold text-dark d-flex align-items-center gap-1">
                                        <Icon icon="mdi:calendar-start" className="text-success" />
                                        Start Date <span className="text-danger">*</span>
                                    </label>
                                    <div className="input-group input-group-lg">
                                        <span className="input-group-text bg-light d-flex align-items-center">
                                            <Icon icon="mdi:calendar" />
                                        </span>
                                        <input
                                            type="datetime-local"
                                            className={`form-control ${errors.start_date ? 'is-invalid' : ''}`}
                                            value={data.start_date}
                                            onChange={e => setData('start_date', e.target.value)}
                                        />
                                        {errors.start_date && <div className="invalid-feedback">{errors.start_date}</div>}
                                    </div>
                                    <small className="text-muted mt-1 d-flex align-items-center gap-1">
                                        <Icon icon="mdi:clock-start" className="text-success" style={{ fontSize: '16px', flexShrink: 0 }} /> 
                                        <span>When this offer becomes active</span>
                                    </small>
                                </div>

                                <div className="col-md-6">
                                    <label className="form-label fw-semibold text-dark d-flex align-items-center gap-1">
                                        <Icon icon="mdi:calendar-end" className="text-danger" />
                                        End Date <span className="text-danger">*</span>
                                    </label>
                                    <div className="input-group input-group-lg">
                                        <span className="input-group-text bg-light d-flex align-items-center">
                                            <Icon icon="mdi:calendar-remove" />
                                        </span>
                                        <input
                                            type="datetime-local"
                                            className={`form-control ${errors.end_date ? 'is-invalid' : ''}`}
                                            value={data.end_date}
                                            onChange={e => setData('end_date', e.target.value)}
                                        />
                                        {errors.end_date && <div className="invalid-feedback">{errors.end_date}</div>}
                                    </div>
                                    <small className="text-muted mt-1 d-flex align-items-center gap-1">
                                        <Icon icon="mdi:clock-end" className="text-danger" style={{ fontSize: '16px', flexShrink: 0 }} /> 
                                        <span>When this offer expires</span>
                                    </small>
                                </div>

                                {/* Usage Limits */}
                                <div className="col-12 mt-4">
                                    <div className="section-header d-flex align-items-center gap-2 mb-3 pb-2 border-bottom">
                                        <Icon icon="mdi:counter" className="text-info" style={{ fontSize: '24px' }} />
                                        <h6 className="fw-bold text-dark mb-0">Usage Limits</h6>
                                    </div>
                                </div>

                                <div className="col-md-6">
                                    <label className="form-label fw-semibold text-dark d-flex align-items-center gap-1">
                                        <Icon icon="mdi:chart-line" className="text-info" />
                                        Total Usage Limit (Optional)
                                    </label>
                                    <div className="input-group input-group-lg">
                                        <span className="input-group-text bg-info text-white d-flex align-items-center">
                                            <Icon icon="mdi:counter" />
                                        </span>
                                        <input
                                            type="number"
                                            className={`form-control ${errors.usage_limit ? 'is-invalid' : ''}`}
                                            value={data.usage_limit}
                                            onChange={e => setData('usage_limit', e.target.value)}
                                            placeholder="e.g., 100 (or leave empty)"
                                        />
                                        {errors.usage_limit && <div className="invalid-feedback">{errors.usage_limit}</div>}
                                    </div>
                                    <small className="text-muted mt-1 d-flex align-items-center gap-1">
                                        <Icon icon="mdi:lightbulb-outline" className="text-warning" style={{ fontSize: '16px', flexShrink: 0 }} /> 
                                        <span>Maximum total times this offer can be used by all customers</span>
                                    </small>
                                </div>

                                <div className="col-md-6">
                                    <label className="form-label fw-semibold text-dark d-flex align-items-center gap-1">
                                        <Icon icon="mdi:account-check" className="text-info" />
                                        Per Customer Limit (Optional)
                                    </label>
                                    <div className="input-group input-group-lg">
                                        <span className="input-group-text bg-info text-white d-flex align-items-center">
                                            <Icon icon="mdi:account-multiple-check" />
                                        </span>
                                        <input
                                            type="number"
                                            className={`form-control ${errors.per_customer_limit ? 'is-invalid' : ''}`}
                                            value={data.per_customer_limit}
                                            onChange={e => setData('per_customer_limit', e.target.value)}
                                            placeholder="e.g., 1 (or leave empty)"
                                        />
                                        {errors.per_customer_limit && <div className="invalid-feedback">{errors.per_customer_limit}</div>}
                                    </div>
                                    <small className="text-muted mt-1 d-flex align-items-center gap-1">
                                        <Icon icon="mdi:lightbulb-outline" className="text-warning" style={{ fontSize: '16px', flexShrink: 0 }} /> 
                                        <span>How many times each customer can use this offer</span>
                                    </small>
                                </div>

                                {/* Working Groups */}
                                <div className="col-12 mt-4">
                                    <div className="section-header d-flex align-items-center gap-2 mb-3 pb-2 border-bottom">
                                        <Icon icon="mdi:account-group" className="text-warning" style={{ fontSize: '24px' }} />
                                        <h6 className="fw-bold text-dark mb-0">Applicable Working Groups</h6>
                                    </div>
                                    <div className="d-flex align-items-center justify-content-between mb-3">
                                        <small className="text-muted d-flex align-items-center gap-1">
                                            <Icon icon="mdi:information-outline" className="text-info" style={{ fontSize: '16px', flexShrink: 0 }} /> 
                                            <span>Select which working groups can use this offer</span>
                                        </small>
                                        <div className="d-flex gap-2">
                                            <button
                                                type="button"
                                                className="btn btn-sm btn-primary d-flex align-items-center gap-1"
                                                onClick={selectAllWorkingGroups}
                                            >
                                                <Icon icon="mdi:checkbox-multiple-marked" />
                                                Select All
                                            </button>
                                            <button
                                                type="button"
                                                className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1"
                                                onClick={clearAllWorkingGroups}
                                            >
                                                <Icon icon="mdi:close-box-multiple" />
                                                Clear
                                            </button>
                                        </div>
                                    </div>
                                    <div className="row g-3">
                                        {workingGroups?.map(group => (
                                            <div key={group.id} className="col-md-4">
                                                <label className="form-check-label border rounded-2 p-3 d-block cursor-pointer" style={{ transition: 'all 0.2s', backgroundColor: data.working_group_ids.includes(group.id) ? '#fff3cd' : 'transparent' }}>
                                                    <div className="form-check">
                                                        <input
                                                            type="checkbox"
                                                            className="form-check-input"
                                                            id={`wg-${group.id}`}
                                                            checked={data.working_group_ids.includes(group.id)}
                                                            onChange={() => toggleWorkingGroup(group.id)}
                                                            style={{ cursor: 'pointer' }}
                                                        />
                                                        <span className="ms-2 fw-semibold">
                                                            <Icon icon="mdi:account-multiple" className="text-warning me-1" />
                                                            {group.name}
                                                        </span>
                                                    </div>
                                                </label>
                                            </div>
                                        ))}
                                    </div>
                                    <small className="text-muted d-flex align-items-center gap-1 mt-3">
                                        <Icon icon="mdi:lightbulb-outline" className="text-warning" style={{ fontSize: '16px', flexShrink: 0 }} /> 
                                        <span>Leave empty to make offer available to all groups</span>
                                    </small>
                                    {errors.working_group_ids && <div className="text-danger text-sm mt-1">{errors.working_group_ids}</div>}
                                </div>

                                {/* Products */}
                                <div className="col-12 mt-4">
                                    <div className="section-header d-flex align-items-center gap-2 mb-3 pb-2 border-bottom">
                                        <Icon icon="mdi:package-variant" className="text-primary" style={{ fontSize: '24px' }} />
                                        <h6 className="fw-bold text-dark mb-0">Applicable Products (Optional)</h6>
                                    </div>
                                    <div className="d-flex align-items-center justify-content-between mb-3">
                                        <small className="text-muted d-flex align-items-center gap-1">
                                            <Icon icon="mdi:information-outline" className="text-info" style={{ fontSize: '16px', flexShrink: 0 }} /> 
                                            <span>Choose specific products or leave empty to apply to all products</span>
                                        </small>
                                        <div className="d-flex gap-2">
                                            <button
                                                type="button"
                                                className="btn btn-sm btn-primary d-flex align-items-center gap-1"
                                                onClick={selectAllProducts}
                                            >
                                                <Icon icon="mdi:checkbox-multiple-marked" />
                                                Select All
                                            </button>
                                            <button
                                                type="button"
                                                className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1"
                                                onClick={clearAllProducts}
                                            >
                                                <Icon icon="mdi:close-box-multiple" />
                                                Clear
                                            </button>
                                        </div>
                                    </div>
                                    <div 
                                        className="row g-3 p-3 border rounded" 
                                        style={{ maxHeight: '350px', overflowY: 'auto', backgroundColor: '#f8f9fa' }}
                                    >
                                        {products?.map(product => (
                                            <div key={product.id} className="col-md-4">
                                                <label className="form-check-label border rounded-2 p-3 d-block cursor-pointer bg-white" style={{ transition: 'all 0.2s', boxShadow: data.product_ids.includes(product.id) ? '0 2px 8px rgba(244,64,50,0.2)' : 'none' }}>
                                                    <div className="form-check">
                                                        <input
                                                            type="checkbox"
                                                            className="form-check-input"
                                                            id={`prod-${product.id}`}
                                                            checked={data.product_ids.includes(product.id)}
                                                            onChange={() => toggleProduct(product.id)}
                                                            style={{ cursor: 'pointer' }}
                                                        />
                                                        <span className="ms-2 fw-semibold">
                                                            <Icon icon="mdi:cube-outline" className="text-primary me-1" />
                                                            {product.name}
                                                        </span>
                                                    </div>
                                                </label>
                                            </div>
                                        ))}
                                    </div>
                                    <small className="text-muted d-flex align-items-center gap-1 mt-3">
                                        <Icon icon="mdi:lightbulb-outline" className="text-warning" style={{ fontSize: '16px', flexShrink: 0 }} /> 
                                        <span>If left empty, this offer will be applicable to all products in your catalog</span>
                                    </small>
                                    {errors.product_ids && <div className="text-danger text-sm mt-1">{errors.product_ids}</div>}
                                </div>

                                {/* Status */}
                                <div className="col-12 mt-4">
                                    <div className="section-header d-flex align-items-center gap-2 mb-3 pb-2 border-bottom">
                                        <Icon icon="mdi:toggle-switch" className="text-secondary" style={{ fontSize: '24px' }} />
                                        <h6 className="fw-bold text-dark mb-0">Offer Status</h6>
                                    </div>
                                    <label className="form-label fw-semibold text-dark d-flex align-items-center gap-1">
                                        <Icon icon="mdi:information-variant" className="text-secondary" />
                                        Status <span className="text-danger">*</span>
                                    </label>
                                    <div className="input-group input-group-lg">
                                        <span className="input-group-text bg-secondary text-white d-flex align-items-center">
                                            <Icon icon="mdi:toggle-switch-outline" />
                                        </span>
                                        <select
                                            className={`form-select ${errors.status ? 'is-invalid' : ''}`}
                                            value={data.status}
                                            onChange={e => setData('status', e.target.value)}
                                        >
                                            <option value="draft">📝 Draft - Not visible to customers</option>
                                            <option value="active">✅ Active - Visible and usable</option>
                                            <option value="disabled">⏸️ Disabled - Temporarily hidden</option>
                                            <option value="expired">⌛ Expired - Past end date</option>
                                        </select>
                                        {errors.status && <div className="invalid-feedback">{errors.status}</div>}
                                    </div>
                                    <small className="text-muted mt-1 d-flex align-items-center gap-1">
                                        <Icon icon="mdi:lightbulb-outline" className="text-warning" style={{ fontSize: '16px', flexShrink: 0 }} /> 
                                        <span>Choose 'Draft' to save without making it live, or 'Active' to publish immediately</span>
                                    </small>
                                </div>

                                {/* Submit */}
                                <div className="col-12 mt-5 pt-4 border-top">
                                    <div className="d-flex gap-3 justify-content-end">
                                        <Link
                                            href={route('admin.offers.index')}
                                            className="btn btn-outline-secondary btn-lg px-5 d-flex align-items-center gap-2"
                                        >
                                            <Icon icon="mdi:arrow-left" />
                                            Cancel
                                        </Link>
                                        <button
                                            type="submit"
                                            className="btn btn-lg px-5 d-flex align-items-center gap-2"
                                            disabled={processing}
                                            style={{ 
                                                background: processing ? '#6c757d' : 'linear-gradient(135deg, #f44032 0%, #d32f2f 100%)',
                                                border: 'none',
                                                color: 'white',
                                                fontWeight: '600',
                                                boxShadow: processing ? 'none' : '0 4px 12px rgba(244, 64, 50, 0.3)'
                                            }}
                                        >
                                            {processing ? (
                                                <>
                                                    <span className="spinner-border spinner-border-sm" />
                                                    Creating Offer...
                                                </>
                                            ) : (
                                                <>
                                                    <Icon icon="mdi:check-circle" />
                                                    Create Offer
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            </AdminDashboard>

            <style jsx>{`
                .upload-area {
                    transition: all 0.3s;
                }

                .upload-area:hover {
                    border-color: var(--primary-600) !important;
                    background-color: var(--primary-50);
                }

                .cursor-pointer {
                    cursor: pointer;
                }

                .hover-bg-light:hover {
                    background-color: #f8f9fa;
                }
            `}</style>
        </>
    );
}
