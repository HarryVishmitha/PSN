import React, { useState } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import AdminDashboard from '@/Layouts/AdminDashboard';
import Breadcrumb from '@/Components/Breadcrumb';
import { Icon } from '@iconify/react';
import Alert from '@/Components/Alert';
import Meta from '@/Components/Metaheads';

export default function EditOffer({ userDetails, offer, products, workingGroups }) {
    const [alert, setAlert] = useState(null);
    
    const { data, setData, put, processing, errors } = useForm({
        name: offer.name || '',
        code: offer.code || '',
        description: offer.description || '',
        offer_type: offer.offer_type || 'percentage',
        discount_value: offer.discount_value || '',
        min_purchase_amt: offer.min_purchase_amt || '',
        start_date: offer.start_date ? offer.start_date.slice(0, 16) : '',
        end_date: offer.end_date ? offer.end_date.slice(0, 16) : '',
        usage_limit: offer.usage_limit || '',
        per_customer_limit: offer.per_customer_limit || '',
        status: offer.status || 'active',
        working_group_ids: offer.working_groups?.map(wg => wg.id) || [],
        product_ids: offer.products?.map(p => p.id) || [],
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        put(route('admin.offers.update', offer.id), {
            onSuccess: () => {
                setAlert({ type: 'success', message: 'Offer updated successfully!' });
            },
            onError: () => {
                setAlert({ type: 'danger', message: 'Failed to update offer. Please check the form.' });
            }
        });
    };

    const generateCode = () => {
        const code = `OFFER${Date.now().toString().slice(-6)}`;
        setData('code', code);
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

    return (
        <>
            <Head title={`Edit ${offer.name} - Admin Dashboard`} />
            <Meta title={`Edit Offer: ${offer.name}`} description="Edit offer details" />

            <AdminDashboard userDetails={userDetails}>
                <Breadcrumb
                    title={`Edit: ${offer.name}`}
                    items={[
                        { label: 'Offers', href: route('admin.offers.index') },
                        { label: 'Edit' }
                    ]}
                />

                {alert && <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} />}

                <div className="card h-100 p-0 radius-12">
                    <div className="card-header border-bottom bg-base py-16 px-24">
                        <div className="d-flex align-items-center justify-content-between">
                            <h5 className="fw-bold mb-0">Edit Offer</h5>
                            <div className="d-flex gap-2">
                                <span className={`badge ${offer.status === 'active' ? 'bg-success' : 'bg-secondary'}`}>
                                    {offer.status}
                                </span>
                                <Link
                                    href={route('admin.offers.index')}
                                    className="btn btn-outline-secondary d-flex align-items-center gap-2"
                                >
                                    <Icon icon="mdi:arrow-left" />
                                    Back to List
                                </Link>
                            </div>
                        </div>
                    </div>

                    <div className="card-body">
                        <form onSubmit={handleSubmit}>
                            <div className="row g-3">
                                {/* Usage Stats */}
                                <div className="col-12">
                                    <div className="alert alert-info d-flex align-items-center gap-3">
                                        <Icon icon="mdi:information-outline" className="text-2xl" />
                                        <div>
                                            <strong>Usage Statistics:</strong> This offer has been used {offer.usages_count || 0} time(s).
                                        </div>
                                    </div>
                                </div>

                                {/* Basic Info */}
                                <div className="col-12">
                                    <h6 className="fw-semibold text-primary-600 mb-3">Basic Information</h6>
                                </div>

                                <div className="col-md-6">
                                    <label className="form-label fw-semibold">Offer Name <span className="text-danger">*</span></label>
                                    <input
                                        type="text"
                                        className={`form-control ${errors.name ? 'is-invalid' : ''}`}
                                        value={data.name}
                                        onChange={e => setData('name', e.target.value)}
                                        placeholder="e.g., New Year Sale"
                                    />
                                    {errors.name && <div className="invalid-feedback">{errors.name}</div>}
                                </div>

                                <div className="col-md-6">
                                    <label className="form-label fw-semibold">Offer Code <span className="text-danger">*</span></label>
                                    <div className="input-group">
                                        <input
                                            type="text"
                                            className={`form-control ${errors.code ? 'is-invalid' : ''}`}
                                            value={data.code}
                                            onChange={e => setData('code', e.target.value.toUpperCase())}
                                            placeholder="NEWYEAR2024"
                                        />
                                        <button
                                            type="button"
                                            className="btn btn-outline-secondary"
                                            onClick={generateCode}
                                        >
                                            <Icon icon="mdi:refresh" />
                                        </button>
                                        {errors.code && <div className="invalid-feedback">{errors.code}</div>}
                                    </div>
                                </div>

                                <div className="col-12">
                                    <label className="form-label fw-semibold">Description</label>
                                    <textarea
                                        className={`form-control ${errors.description ? 'is-invalid' : ''}`}
                                        value={data.description}
                                        onChange={e => setData('description', e.target.value)}
                                        rows="3"
                                        placeholder="Brief description of the offer..."
                                    />
                                    {errors.description && <div className="invalid-feedback">{errors.description}</div>}
                                </div>

                                <div className="col-12">
                                    <label className="form-label fw-semibold">Offer Image (Optional)</label>
                                    {offer.image && (
                                        <div className="mb-2">
                                            <img 
                                                src={`/storage/${offer.image}`} 
                                                alt="Current offer" 
                                                className="img-thumbnail"
                                                style={{ maxHeight: '150px' }}
                                            />
                                        </div>
                                    )}
                                    <input
                                        type="file"
                                        className={`form-control ${errors.image ? 'is-invalid' : ''}`}
                                        accept="image/*"
                                        onChange={e => setData('image', e.target.files[0])}
                                    />
                                    <small className="text-secondary-light">Recommended size: 800x400px (PNG, JPG, WEBP). Leave empty to keep current image.</small>
                                    {errors.image && <div className="invalid-feedback">{errors.image}</div>}
                                </div>

                                {/* Discount Details */}
                                <div className="col-12 mt-4">
                                    <h6 className="fw-semibold text-primary-600 mb-3">Discount Details</h6>
                                </div>

                                <div className="col-md-4">
                                    <label className="form-label fw-semibold">Offer Type <span className="text-danger">*</span></label>
                                    <select
                                        className={`form-select ${errors.offer_type ? 'is-invalid' : ''}`}
                                        value={data.offer_type}
                                        onChange={e => setData('offer_type', e.target.value)}
                                    >
                                        <option value="percentage">Percentage Discount</option>
                                        <option value="fixed">Fixed Amount</option>
                                        <option value="buy_x_get_y">Buy X Get Y</option>
                                        <option value="free_shipping">Free Shipping</option>
                                    </select>
                                    {errors.offer_type && <div className="invalid-feedback">{errors.offer_type}</div>}
                                </div>

                                <div className="col-md-4">
                                    <label className="form-label fw-semibold">
                                        {data.offer_type === 'percentage' ? 'Discount Percentage' : 'Discount Value'} <span className="text-danger">*</span>
                                    </label>
                                    <div className="input-group">
                                        <input
                                            type="number"
                                            step="0.01"
                                            className={`form-control ${errors.discount_value ? 'is-invalid' : ''}`}
                                            value={data.discount_value}
                                            onChange={e => setData('discount_value', e.target.value)}
                                            placeholder="10"
                                        />
                                        <span className="input-group-text">
                                            {data.offer_type === 'percentage' ? '%' : 'LKR'}
                                        </span>
                                        {errors.discount_value && <div className="invalid-feedback">{errors.discount_value}</div>}
                                    </div>
                                </div>

                                <div className="col-md-4">
                                    <label className="form-label fw-semibold">Minimum Purchase Amount (Optional)</label>
                                    <div className="input-group">
                                        <input
                                            type="number"
                                            step="0.01"
                                            className={`form-control ${errors.min_purchase_amt ? 'is-invalid' : ''}`}
                                            value={data.min_purchase_amt}
                                            onChange={e => setData('min_purchase_amt', e.target.value)}
                                            placeholder="500"
                                        />
                                        <span className="input-group-text">LKR</span>
                                        {errors.min_purchase_amt && <div className="invalid-feedback">{errors.min_purchase_amt}</div>}
                                    </div>
                                </div>

                                {/* Validity Period */}
                                <div className="col-12 mt-4">
                                    <h6 className="fw-semibold text-primary-600 mb-3">Validity Period</h6>
                                </div>

                                <div className="col-md-6">
                                    <label className="form-label fw-semibold">Start Date <span className="text-danger">*</span></label>
                                    <input
                                        type="datetime-local"
                                        className={`form-control ${errors.start_date ? 'is-invalid' : ''}`}
                                        value={data.start_date}
                                        onChange={e => setData('start_date', e.target.value)}
                                    />
                                    {errors.start_date && <div className="invalid-feedback">{errors.start_date}</div>}
                                </div>

                                <div className="col-md-6">
                                    <label className="form-label fw-semibold">End Date <span className="text-danger">*</span></label>
                                    <input
                                        type="datetime-local"
                                        className={`form-control ${errors.end_date ? 'is-invalid' : ''}`}
                                        value={data.end_date}
                                        onChange={e => setData('end_date', e.target.value)}
                                    />
                                    {errors.end_date && <div className="invalid-feedback">{errors.end_date}</div>}
                                </div>

                                {/* Usage Limits */}
                                <div className="col-12 mt-4">
                                    <h6 className="fw-semibold text-primary-600 mb-3">Usage Limits</h6>
                                </div>

                                <div className="col-md-6">
                                    <label className="form-label fw-semibold">Total Usage Limit (Optional)</label>
                                    <input
                                        type="number"
                                        className={`form-control ${errors.usage_limit ? 'is-invalid' : ''}`}
                                        value={data.usage_limit}
                                        onChange={e => setData('usage_limit', e.target.value)}
                                        placeholder="100"
                                    />
                                    <small className="text-secondary-light">Current usage: {offer.usages_count || 0}</small>
                                    {errors.usage_limit && <div className="invalid-feedback">{errors.usage_limit}</div>}
                                </div>

                                <div className="col-md-6">
                                    <label className="form-label fw-semibold">Per Customer Limit (Optional)</label>
                                    <input
                                        type="number"
                                        className={`form-control ${errors.per_customer_limit ? 'is-invalid' : ''}`}
                                        value={data.per_customer_limit}
                                        onChange={e => setData('per_customer_limit', e.target.value)}
                                        placeholder="1"
                                    />
                                    <small className="text-secondary-light">Maximum uses per customer</small>
                                    {errors.per_customer_limit && <div className="invalid-feedback">{errors.per_customer_limit}</div>}
                                </div>

                                {/* Working Groups */}
                                <div className="col-12 mt-4">
                                    <h6 className="fw-semibold text-primary-600 mb-3">Applicable Working Groups</h6>
                                    <div className="row g-2">
                                        {workingGroups?.map(group => (
                                            <div key={group.id} className="col-md-4">
                                                <div className="form-check">
                                                    <input
                                                        type="checkbox"
                                                        className="form-check-input"
                                                        id={`wg-${group.id}`}
                                                        checked={data.working_group_ids.includes(group.id)}
                                                        onChange={() => toggleWorkingGroup(group.id)}
                                                    />
                                                    <label className="form-check-label" htmlFor={`wg-${group.id}`}>
                                                        {group.name}
                                                    </label>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    {errors.working_group_ids && <div className="text-danger text-sm mt-1">{errors.working_group_ids}</div>}
                                </div>

                                {/* Products */}
                                <div className="col-12 mt-4">
                                    <h6 className="fw-semibold text-primary-600 mb-3">Applicable Products (Optional)</h6>
                                    <div className="row g-2" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                                        {products?.map(product => (
                                            <div key={product.id} className="col-md-4">
                                                <div className="form-check">
                                                    <input
                                                        type="checkbox"
                                                        className="form-check-input"
                                                        id={`prod-${product.id}`}
                                                        checked={data.product_ids.includes(product.id)}
                                                        onChange={() => toggleProduct(product.id)}
                                                    />
                                                    <label className="form-check-label" htmlFor={`prod-${product.id}`}>
                                                        {product.name}
                                                    </label>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <small className="text-secondary-light">Leave empty to apply to all products</small>
                                    {errors.product_ids && <div className="text-danger text-sm mt-1">{errors.product_ids}</div>}
                                </div>

                                {/* Status */}
                                <div className="col-12 mt-4">
                                    <label className="form-label fw-semibold">Status <span className="text-danger">*</span></label>
                                    <select
                                        className={`form-select ${errors.status ? 'is-invalid' : ''}`}
                                        value={data.status}
                                        onChange={e => setData('status', e.target.value)}
                                    >
                                        <option value="active">Active</option>
                                        <option value="inactive">Inactive</option>
                                        <option value="scheduled">Scheduled</option>
                                    </select>
                                    {errors.status && <div className="invalid-feedback">{errors.status}</div>}
                                </div>

                                {/* Submit */}
                                <div className="col-12 mt-4">
                                    <div className="d-flex gap-3">
                                        <button
                                            type="submit"
                                            className="btn btn-primary px-4"
                                            disabled={processing}
                                        >
                                            {processing ? (
                                                <>
                                                    <span className="spinner-border spinner-border-sm me-2" />
                                                    Updating...
                                                </>
                                            ) : (
                                                <>
                                                    <Icon icon="mdi:check" className="me-2" />
                                                    Update Offer
                                                </>
                                            )}
                                        </button>
                                        <Link
                                            href={route('admin.offers.index')}
                                            className="btn btn-outline-secondary px-4"
                                        >
                                            Cancel
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            </AdminDashboard>
        </>
    );
}
