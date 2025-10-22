import React, { useMemo } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import AdminDashboard from '@/Layouts/AdminDashboard';
import Breadcrumb from '@/Components/Breadcrumb';
import CookiesV from '@/Components/CookieConsent';
import Meta from '@/Components/Metaheads';
import { Icon } from '@iconify/react';

// Utility: Format date and time
const formatDateTime = (value) => {
    if (!value) return '—';
    try {
        return new Intl.DateTimeFormat('en-GB', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        }).format(new Date(value));
    } catch {
        return '—';
    }
};

// Utility: Convert status to readable label
const statusLabel = (status) => {
    return status?.replace(/_/g, ' ').toUpperCase() || 'UNKNOWN';
};

// Utility: Get status badge classes
const getStatusBadgeClass = (status) => {
    const statusMap = {
        approved: 'bg-success-focus text-success-600 border border-success-main',
        in_review: 'bg-primary-100 text-primary-600 border border-primary-main',
        awaiting_customer: 'bg-warning-100 text-warning-700 border border-warning-main',
        completed: 'bg-info-focus text-info-700 border border-info-main',
        closed: 'bg-neutral-200 text-secondary-light border border-neutral-400',
    };
    return statusMap[status] || statusMap.closed;
};

export default function SupportRequestShow({ userDetails, request, statuses = [] }) {
    // Normalize request data
    const supportRequest = useMemo(() => request?.data ?? request ?? {}, [request]);

    // Initialize form with Inertia useForm
    const form = useForm({
        message: '',
        status: supportRequest.status || '',
        notify_customer: true,
    });

    // Extract data from support request
    const contact = supportRequest.contact || {};
    const files = supportRequest.files || [];
    const messages = supportRequest.messages || [];
    const specs = supportRequest.specs || {};
    const budget = supportRequest.budget || {};

    // Handle form submission
    const handleSubmitReply = (e) => {
        e.preventDefault();
        
        if (!supportRequest.id) {
            console.error('Support request ID is missing');
            return;
        }

        form.post(route('admin.requests.reply', { supportRequest: supportRequest.id }), {
            preserveScroll: true,
            onSuccess: () => {
                form.reset('message');
            },
            onError: (errors) => {
                console.error('Reply submission failed:', errors);
            },
        });
    };

    const pageTitle = supportRequest.reference 
        ? `Request ${supportRequest.reference}` 
        : 'Support Request';

    return (
        <>
            <Head title={pageTitle} />
            <Meta 
                title={pageTitle} 
                description={`Support request details for ${supportRequest.reference || 'customer'}`} 
            />

            <AdminDashboard userDetails={userDetails}>
                <Breadcrumb
                    title={supportRequest.reference || 'Request Details'}
                    previous={[
                        { label: 'Support Requests', url: route('admin.requests.index') },
                    ]}
                />

                <div className="row gy-4">
                    {/* Main Content Column - 8/12 */}
                    <div className="col-12 col-lg-8">
                        
                        {/* Request Details Card */}
                        <div className="card radius-12 overflow-hidden">
                            {/* Card Header */}
                            <div className="card-header bg-base border-bottom py-16 px-24">
                                <div className="d-flex justify-content-between align-items-start gap-3 flex-wrap">
                                    <div className="flex-grow-1">
                                        <div className="d-flex align-items-center gap-2 mb-2">
                                            <Icon icon="fluent:document-24-regular" className="text-primary-600 text-xl" />
                                            <h5 className="text-lg fw-semibold text-neutral-900 mb-0">
                                                {supportRequest.title || 'Untitled Request'}
                                            </h5>
                                        </div>
                                        <div className="d-flex align-items-center gap-3 flex-wrap text-xs text-secondary-light">
                                            <span className="d-flex align-items-center gap-1">
                                                <Icon icon="fluent:calendar-add-20-regular" />
                                                {formatDateTime(supportRequest.created_at)}
                                            </span>
                                            <span>•</span>
                                            <span className="d-flex align-items-center gap-1">
                                                <Icon icon="fluent:arrow-sync-circle-20-regular" />
                                                Updated {formatDateTime(supportRequest.updated_at)}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex-shrink-0">
                                        <span className={`${getStatusBadgeClass(supportRequest.status)} px-24 py-4 radius-4 fw-medium text-sm d-inline-block`}>
                                            {statusLabel(supportRequest.status)}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Card Body */}
                            <div className="card-body px-24 py-20">
                                
                                {/* Customer Brief Section */}
                                {supportRequest.description && (
                                    <div className="mb-4 pb-4 border-bottom">
                                        <div className="d-flex align-items-center gap-2 mb-3">
                                            <Icon icon="fluent:note-20-regular" className="text-primary-600 text-lg" />
                                            <h6 className="text-sm fw-semibold text-neutral-900 text-uppercase mb-0">
                                                Customer Brief
                                            </h6>
                                        </div>
                                        <p className="text-sm text-neutral-700 mb-0 ps-4" style={{ whiteSpace: 'pre-line' }}>
                                            {supportRequest.description}
                                        </p>
                                    </div>
                                )}

                                {/* Contact & Specifications Row */}
                                <div className="row g-4 mb-4 tw-mt-0.5">
                                    
                                    {/* Contact Information */}
                                    <div className="col-12 col-md-6">
                                        <div className="d-flex align-items-center gap-2 mb-3">
                                            <Icon icon="fluent:person-24-regular" className="text-primary-600 text-lg" />
                                            <h6 className="text-sm fw-semibold text-neutral-900 text-uppercase mb-0">
                                                Contact Information
                                            </h6>
                                        </div>
                                        <div className="bg-neutral-50 radius-8 p-3">
                                            <dl className="row g-2 mb-0 text-sm">
                                                <dt className="col-5 text-secondary-light d-flex align-items-center gap-1">
                                                    <Icon icon="fluent:person-20-regular" style={{ fontSize: '16px' }} />
                                                    <span>Name</span>
                                                </dt>
                                                <dd className="col-7 fw-medium text-neutral-900 mb-0">
                                                    {contact.name || '—'}
                                                </dd>

                                                <dt className="col-5 text-secondary-light d-flex align-items-center gap-1">
                                                    <Icon icon="fluent:mail-20-regular" style={{ fontSize: '16px' }} />
                                                    <span>Email</span>
                                                </dt>
                                                <dd className="col-7 mb-0">
                                                    {contact.email ? (
                                                        <a 
                                                            href={`mailto:${contact.email}`} 
                                                            className="text-primary-600 fw-normal"
                                                            style={{ textDecoration: 'none', wordBreak: 'break-word' }}
                                                        >
                                                            {contact.email}
                                                        </a>
                                                    ) : '—'}
                                                </dd>

                                                <dt className="col-5 text-secondary-light d-flex align-items-center gap-1">
                                                    <Icon icon="mdi:whatsapp" style={{ fontSize: '16px' }} />
                                                    <span>WhatsApp</span>
                                                </dt>
                                                <dd className="col-7 fw-medium text-neutral-900 mb-0">
                                                    {contact.phone_whatsapp || '—'}
                                                </dd>

                                                {contact.company && (
                                                    <>
                                                        <dt className="col-5 text-secondary-light d-flex align-items-center gap-1">
                                                            <Icon icon="fluent:building-20-regular" style={{ fontSize: '16px' }} />
                                                            <span>Company</span>
                                                        </dt>
                                                        <dd className="col-7 fw-medium text-neutral-900 mb-0">
                                                            {contact.company}
                                                        </dd>
                                                    </>
                                                )}
                                            </dl>
                                        </div>
                                    </div>

                                    {/* Specifications */}
                                    <div className="col-12 col-md-6">
                                        <div className="d-flex align-items-center gap-2 mb-3">
                                            <Icon icon="fluent:clipboard-text-ltr-24-regular" className="text-primary-600 text-lg" />
                                            <h6 className="text-sm fw-semibold text-neutral-900 text-uppercase mb-0">
                                                Specifications
                                            </h6>
                                        </div>
                                        <div className="bg-neutral-50 radius-8 p-3">
                                            <dl className="row g-2 mb-0 text-sm">
                                                <dt className="col-5 text-secondary-light d-flex align-items-center gap-1">
                                                    <Icon icon="fluent:tag-20-regular" style={{ fontSize: '16px' }} />
                                                    <span>Category</span>
                                                </dt>
                                                <dd className="col-7 fw-medium text-neutral-900 mb-0">
                                                    {supportRequest?.category?.label || 'Other'}
                                                </dd>

                                                {(specs?.size?.width || specs?.size?.height) && (
                                                    <>
                                                        <dt className="col-5 text-secondary-light d-flex align-items-center gap-1">
                                                            <Icon icon="fluent:resize-20-regular" style={{ fontSize: '16px' }} />
                                                            <span>Size</span>
                                                        </dt>
                                                        <dd className="col-7 fw-medium text-neutral-900 mb-0">
                                                            {`${specs.size.width || ''} × ${specs.size.height || ''} ${specs.size.unit || ''}`}
                                                        </dd>
                                                    </>
                                                )}

                                                {specs?.quantity && (
                                                    <>
                                                        <dt className="col-5 text-secondary-light d-flex align-items-center gap-1">
                                                            <Icon icon="fluent:number-symbol-20-regular" style={{ fontSize: '16px' }} />
                                                            <span>Quantity</span>
                                                        </dt>
                                                        <dd className="col-7 fw-medium text-neutral-900 mb-0">
                                                            {specs.quantity}
                                                        </dd>
                                                    </>
                                                )}

                                                {specs?.material && (
                                                    <>
                                                        <dt className="col-5 text-secondary-light d-flex align-items-center gap-1">
                                                            <Icon icon="fluent:cube-20-regular" style={{ fontSize: '16px' }} />
                                                            <span>Material</span>
                                                        </dt>
                                                        <dd className="col-7 fw-medium text-neutral-900 mb-0">
                                                            {specs.material}
                                                        </dd>
                                                    </>
                                                )}

                                                {specs?.finishing && (
                                                    <>
                                                        <dt className="col-5 text-secondary-light d-flex align-items-center gap-1">
                                                            <Icon icon="fluent:sparkle-20-regular" style={{ fontSize: '16px' }} />
                                                            <span>Finishing</span>
                                                        </dt>
                                                        <dd className="col-7 fw-medium text-neutral-900 mb-0">
                                                            {specs.finishing}
                                                        </dd>
                                                    </>
                                                )}

                                                {specs?.delivery_type && (
                                                    <>
                                                        <dt className="col-5 text-secondary-light d-flex align-items-center gap-1">
                                                            <Icon icon="fluent:vehicle-truck-cube-20-regular" style={{ fontSize: '16px' }} />
                                                            <span>Delivery</span>
                                                        </dt>
                                                        <dd className="col-7 fw-medium text-neutral-900 mb-0">
                                                            {specs.delivery_type}
                                                        </dd>
                                                    </>
                                                )}

                                                <dt className="col-5 text-secondary-light d-flex align-items-center gap-1">
                                                    <Icon icon="fluent:money-20-regular" style={{ fontSize: '16px' }} />
                                                    <span>Budget</span>
                                                </dt>
                                                <dd className="col-7 fw-medium text-neutral-900 mb-0">
                                                    {budget?.min || budget?.max
                                                        ? `LKR ${budget?.min || '0'} - ${budget?.max || '0'}`
                                                        : 'Not specified'}
                                                </dd>
                                            </dl>
                                        </div>
                                    </div>
                                </div>

                                {/* Attachments Section */}
                                <div className="pt-4 border-top mt-3 mb-3">
                                    <div className="d-flex align-items-center gap-2 mb-3">
                                        <Icon icon="fluent:attach-24-regular" className="text-primary-600 text-lg" />
                                        <h6 className="text-sm fw-semibold text-neutral-900 text-uppercase mb-0">
                                            Attachments
                                        </h6>
                                    </div>
                                    
                                    {files.length === 0 ? (
                                        <div className="bg-neutral-50 radius-8 p-4 text-center">
                                            <Icon icon="fluent:document-dismiss-24-regular" className="text-secondary-light mb-2" style={{ fontSize: '2.5rem' }} />
                                            <p className="text-sm text-secondary-light mb-0">
                                                No files attached to this request
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="row g-3">
                                            {files.map((file) => (
                                                <div key={file.id} className="col-12 col-sm-6">
                                                    <div className="bg-neutral-50 radius-8 p-3 d-flex align-items-center gap-3">
                                                        <div className="w-40-px h-40-px rounded bg-primary-100 d-flex align-items-center justify-content-center flex-shrink-0">
                                                            <Icon icon="fluent:document-24-regular" className="text-primary-600 text-xl" />
                                                        </div>
                                                        <div className="flex-grow-1 overflow-hidden">
                                                            <p className="mb-0 fw-medium text-sm text-neutral-900 text-truncate">
                                                                {file.name}
                                                            </p>
                                                            <p className="mb-0 text-xs text-secondary-light">
                                                                {file.mime_type}
                                                            </p>
                                                        </div>
                                                        <a
                                                            href={file.download_url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="bg-primary-600 text-white w-32-px h-32-px d-flex align-items-center justify-content-center rounded-circle flex-shrink-0"
                                                            title="Download file"
                                                        >
                                                            <Icon icon="fluent:arrow-download-20-regular" />
                                                        </a>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Messages Timeline Card */}
                        <div className="card radius-12 mt-4">
                            <div className="card-header bg-base border-bottom py-16 px-24">
                                <div className="d-flex align-items-center justify-content-between flex-wrap gap-2">
                                    <div className="d-flex align-items-center gap-2">
                                        <Icon icon="fluent:chat-multiple-24-regular" className="text-primary-600 text-xl" />
                                        <h6 className="text-md fw-semibold text-neutral-900 mb-0">
                                            Messages & Timeline
                                        </h6>
                                    </div>
                                    {messages.length > 0 && (
                                        <span className="bg-primary-100 text-primary-600 px-12 py-4 radius-4 fw-medium text-xs">
                                            {messages.length}
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div className="card-body p-24">
                                {messages.length === 0 ? (
                                    <div className="text-center py-5">
                                        <div className="w-80-px h-80-px rounded-circle bg-neutral-100 d-flex align-items-center justify-content-center mx-auto mb-3">
                                            <Icon icon="fluent:chat-empty-24-regular" className="text-secondary-light" style={{ fontSize: '3rem' }} />
                                        </div>
                                        <h6 className="text-md fw-medium text-neutral-900 mb-2">
                                            No messages yet
                                        </h6>
                                        <p className="text-sm text-secondary-light mb-0">
                                            Send your first reply using the form on the right
                                        </p>
                                    </div>
                                ) : (
                                    <div className="messages-list">
                                        {messages.map((message, index) => {
                                            const isAdmin = message.sender_type === 'admin';
                                            const isLast = index === messages.length - 1;

                                            return (
                                                <div
                                                    key={message.id}
                                                    className={`d-flex gap-3 ${!isLast ? 'mb-4 pb-4 border-bottom' : ''}`}
                                                >
                                                    {/* Avatar */}
                                                    <div className="flex-shrink-0">
                                                        <div
                                                            className="w-40-px h-40-px rounded-circle d-flex align-items-center justify-content-center"
                                                            style={{
                                                                backgroundColor: isAdmin ? '#EEF2FF' : '#DCFCE7'
                                                            }}
                                                        >
                                                            <Icon
                                                                icon={isAdmin ? 'fluent:shield-person-20-filled' : 'fluent:person-20-filled'}
                                                                className={`text-xl ${isAdmin ? 'text-primary-600' : 'text-success-600'}`}
                                                            />
                                                        </div>
                                                    </div>

                                                    {/* Message Content */}
                                                    <div className="flex-grow-1">
                                                        <div className="mb-2">
                                                            <h6 className="text-md fw-semibold text-neutral-900 mb-1">
                                                                {isAdmin ? (message.sender_name || 'Printair Admin') : 'Customer'}
                                                            </h6>
                                                            <p className="text-xs text-secondary-light mb-0">
                                                                <Icon icon="fluent:clock-20-regular" className="me-1" />
                                                                {formatDateTime(message.created_at)}
                                                            </p>
                                                        </div>
                                                        <div className="bg-neutral-50 radius-8 p-3">
                                                            <p className="text-sm text-neutral-800 mb-0" style={{ whiteSpace: 'pre-line' }}>
                                                                {message.body}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Sidebar Column - 4/12 */}
                    <div className="col-12 col-lg-4">
                        
                        {/* Reply Form Card */}
                        <div className="card radius-12 sticky-top" style={{ top: '20px' }}>
                            <div className="card-header bg-primary-600 text-white border-0 py-16 px-24">
                                <div className="d-flex align-items-center gap-2">
                                    <Icon icon="fluent:mail-edit-24-regular" className="text-lg" />
                                    <h6 className="text-sm fw-semibold mb-0">
                                        Reply to Customer
                                    </h6>
                                </div>
                            </div>

                            <form onSubmit={handleSubmitReply} className="card-body px-24 py-20">
                                
                                {/* Status Field */}
                                <div className="mb-3">
                                    <label htmlFor="status" className="form-label text-sm fw-semibold mb-2 d-flex align-items-center gap-1">
                                        <Icon icon="fluent:status-20-regular" className="text-primary-600" style={{ fontSize: '16px' }} />
                                        <span className="text-neutral-900">Update Status</span>
                                    </label>
                                    <select
                                        id="status"
                                        className="form-select radius-8"
                                        value={form.data.status}
                                        onChange={(e) => form.setData('status', e.target.value)}
                                    >
                                        {statuses.map((statusValue) => (
                                            <option key={statusValue} value={statusValue}>
                                                {statusLabel(statusValue)}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Message Field */}
                                <div className="mb-3">
                                    <label htmlFor="message" className="form-label text-sm fw-semibold mb-2 d-flex align-items-center gap-1">
                                        <Icon icon="fluent:chat-24-regular" className="text-primary-600" style={{ fontSize: '16px' }} />
                                        <span className="text-neutral-900">Your Message <span className="text-danger">*</span></span>
                                    </label>
                                    <textarea
                                        id="message"
                                        rows="6"
                                        className={`form-control radius-8 ${form.errors.message ? 'is-invalid' : ''}`}
                                        placeholder="Type your response to the customer..."
                                        value={form.data.message}
                                        onChange={(e) => form.setData('message', e.target.value)}
                                        required
                                    />
                                    {form.errors.message && (
                                        <div className="invalid-feedback d-flex align-items-center gap-1">
                                            <Icon icon="fluent:error-circle-20-regular" />
                                            {form.errors.message}
                                        </div>
                                    )}
                                </div>

                                {/* Notify Customer Checkbox */}
                                <div className="mb-4 p-3 bg-neutral-50 radius-8">
                                    <label className="d-flex align-items-start gap-3 cursor-pointer mb-0" htmlFor="notifyCustomer" style={{ cursor: 'pointer' }}>
                                        <input
                                            className="form-check-input mt-1"
                                            type="checkbox"
                                            id="notifyCustomer"
                                            checked={form.data.notify_customer}
                                            onChange={(e) => form.setData('notify_customer', e.target.checked)}
                                            style={{
                                                width: '18px',
                                                height: '18px',
                                                cursor: 'pointer',
                                                flexShrink: 0
                                            }}
                                        />
                                        <div className="d-flex align-items-start gap-2">
                                            <Icon icon="fluent:mail-alert-20-regular" className="text-primary-600 flex-shrink-0" style={{ fontSize: '20px', marginTop: '0px' }} />
                                            <span className="text-sm text-neutral-900">
                                                Send email to <strong>{contact.email || 'customer'}</strong>
                                            </span>
                                        </div>
                                    </label>
                                </div>

                                {/* Submit Button */}
                                <button
                                    type="submit"
                                    className="btn btn-primary-600 w-100 d-flex align-items-center justify-content-center gap-2"
                                    disabled={form.processing || !supportRequest.id}
                                >
                                    {form.processing ? (
                                        <>
                                            <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true" />
                                            <span>Sending...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Icon icon="fluent:send-24-regular" />
                                            <span>Send Reply</span>
                                        </>
                                    )}
                                </button>
                            </form>
                        </div>

                        {/* Quick Actions Card */}
                        <div className="card radius-12 mt-4">
                            <div className="card-header bg-base border-bottom py-16 px-24">
                                <div className="d-flex align-items-center gap-2">
                                    <Icon icon="fluent:flash-24-regular" className="text-primary-600 text-lg" />
                                    <h6 className="text-sm fw-semibold text-neutral-900 mb-0">
                                        Quick Actions
                                    </h6>
                                </div>
                            </div>
                            <div className="card-body px-24 py-16">
                                <div className="d-flex flex-column gap-2">
                                    <Link
                                        href={route('admin.requests.index')}
                                        className="btn btn-outline-primary w-100 d-flex align-items-center justify-content-center gap-2"
                                    >
                                        <Icon icon="fluent:arrow-left-24-regular" />
                                        <span>Back to Requests</span>
                                    </Link>
                                    <button
                                        type="button"
                                        className="btn btn-outline-secondary w-100 d-flex align-items-center justify-content-center gap-2"
                                        onClick={() => window.print()}
                                    >
                                        <Icon icon="fluent:print-24-regular" />
                                        <span>Print Details</span>
                                    </button>
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




