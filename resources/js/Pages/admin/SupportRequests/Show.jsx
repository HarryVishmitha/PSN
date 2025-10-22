import React, { useMemo } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import AdminDashboard from '@/Layouts/AdminDashboard';
import Breadcrumb from '@/Components/Breadcrumb';

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
    } catch (error) {
        return value;
    }
};

const statusLabel = (status) => status?.replace(/_/g, ' ') || 'unknown';

export default function SupportRequestShow({ userDetails, request, statuses = [] }) {
    const supportRequest = useMemo(() => request?.data ?? request ?? {}, [request]);

    const form = useForm({
        message: '',
        status: supportRequest.status || '',
        notify_customer: true,
    });

    const contact = supportRequest.contact || {};
    const files = supportRequest.files || [];
    const messages = supportRequest.messages || [];
    const specs = supportRequest.specs || {};

    const submitReply = (event) => {
        event.preventDefault();
        if (!supportRequest.id) return;

        form.post(route('admin.requests.reply', { supportRequest: supportRequest.id }), {
            preserveScroll: true,
            onSuccess: () => form.reset('message'),
        });
    };

    const pageTitle = supportRequest.reference ? `Request ${supportRequest.reference}` : 'Request';

    return (
        <>
            <Head title={pageTitle} />
            <AdminDashboard userDetails={userDetails}>
                <Breadcrumb
                    title={supportRequest.reference || 'Request'}
                    previous={[
                        { label: 'Support Requests', url: route('admin.requests.index') },
                    ]}
                />

                <div className="row g-4">
                    <div className="col-12 col-lg-8">
                        <div className="card h-100 radius-12">
                            <div className="card-header bg-base border-bottom py-16 px-24">
                                <h5 className="text-lg fw-semibold text-neutral-900 mb-2">
                                    {supportRequest.title || 'Untitled request'}
                                </h5>
                                <p className="text-sm text-secondary-light mb-0">
                                    Submitted {formatDateTime(supportRequest.created_at)} • Last update {formatDateTime(supportRequest.updated_at)}
                                </p>
                            </div>

                            <div className="card-body px-24 py-20">
                                {supportRequest.description && (
                                    <div className="mb-4">
                                        <h6 className="text-sm fw-semibold text-neutral-900 text-uppercase mb-2">Brief</h6>
                                        <p className="text-sm text-neutral-700 mb-0 whitespace-pre-line">{supportRequest.description}</p>
                                    </div>
                                )}

                                <div className="row g-4">
                                    <div className="col-12 col-md-6">
                                        <h6 className="text-sm fw-semibold text-neutral-900 text-uppercase mb-2">Contact</h6>
                                        <dl className="row gy-2 text-sm">
                                            <dt className="col-5 text-secondary-light">Name</dt>
                                            <dd className="col-7 fw-medium text-neutral-900">{contact.name || '—'}</dd>
                                            <dt className="col-5 text-secondary-light">Email</dt>
                                            <dd className="col-7">
                                                {contact.email ? (
                                                    <a href={`mailto:${contact.email}`} className="text-primary-600">
                                                        {contact.email}
                                                    </a>
                                                ) : (
                                                    '—'
                                                )}
                                            </dd>
                                            <dt className="col-5 text-secondary-light">WhatsApp</dt>
                                            <dd className="col-7 fw-medium text-neutral-900">{contact.phone_whatsapp || '—'}</dd>
                                            {contact.company && (
                                                <>
                                                    <dt className="col-5 text-secondary-light">Company</dt>
                                                    <dd className="col-7 fw-medium text-neutral-900">{contact.company}</dd>
                                                </>
                                            )}
                                        </dl>
                                    </div>
                                    <div className="col-12 col-md-6">
                                        <h6 className="text-sm fw-semibold text-neutral-900 text-uppercase mb-2">Specs</h6>
                                        <dl className="row gy-2 text-sm">
                                            <dt className="col-5 text-secondary-light">Category</dt>
                                            <dd className="col-7 fw-medium text-neutral-900">{supportRequest?.category?.label || '—'}</dd>
                                            <dt className="col-5 text-secondary-light">Size</dt>
                                            <dd className="col-7 fw-medium text-neutral-900">
                                                {specs?.size?.width && specs?.size?.height
                                                    ? `${specs.size.width} × ${specs.size.height} ${specs.size.unit}`
                                                    : '—'}
                                            </dd>
                                            <dt className="col-5 text-secondary-light">Quantity</dt>
                                            <dd className="col-7 fw-medium text-neutral-900">{specs?.quantity || '—'}</dd>
                                            <dt className="col-5 text-secondary-light">Material</dt>
                                            <dd className="col-7 fw-medium text-neutral-900">{specs?.material || '—'}</dd>
                                            <dt className="col-5 text-secondary-light">Finishing</dt>
                                            <dd className="col-7 fw-medium text-neutral-900">{specs?.finishing || '—'}</dd>
                                            <dt className="col-5 text-secondary-light">Delivery</dt>
                                            <dd className="col-7 fw-medium text-neutral-900">{specs?.delivery_type || '—'}</dd>
                                            <dt className="col-5 text-secondary-light">Budget</dt>
                                            <dd className="col-7 fw-medium text-neutral-900">
                                                {supportRequest?.budget?.min || supportRequest?.budget?.max
                                                    ? `${supportRequest?.budget?.min ?? '—'} - ${supportRequest?.budget?.max ?? '—'}`
                                                    : 'Not specified'}
                                            </dd>
                                        </dl>
                                    </div>
                                </div>

                                <div className="mt-4">
                                    <h6 className="text-sm fw-semibold text-neutral-900 text-uppercase mb-2">Attachments</h6>
                                    {files.length === 0 ? (
                                        <p className="text-sm text-secondary-light mb-0">No files attached.</p>
                                    ) : (
                                        <ul className="list-group list-group-flush">
                                            {files.map((file) => (
                                                <li key={file.id} className="list-group-item d-flex justify-content-between align-items-center px-0">
                                                    <div>
                                                        <p className="mb-0 fw-medium text-sm text-neutral-900">{file.name}</p>
                                                        <p className="mb-0 text-xs text-secondary-light">{file.mime_type}</p>
                                                    </div>
                                                    <a href={file.download_url} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-neutral-200 radius-8">
                                                        Download
                                                    </a>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="card radius-12 mt-4">
                            <div className="card-header bg-base border-bottom py-16 px-24">
                                <h6 className="text-sm fw-semibold text-neutral-900 mb-0">Timeline</h6>
                            </div>
                            <div className="card-body px-24 py-20">
                                {messages.length === 0 ? (
                                    <p className="text-sm text-secondary-light mb-0">No internal or customer replies yet.</p>
                                ) : (
                                    <div className="timeline">
                                        {messages.map((message) => (
                                            <div key={message.id} className="position-relative ps-4 mb-4">
                                                <span className="position-absolute start-0 top-1 translate-middle-y bg-primary-500 rounded-circle" style={{ width: '10px', height: '10px' }} />
                                                <div className="d-flex justify-content-between">
                                                    <p className="fw-semibold text-sm text-neutral-900 mb-1">
                                                        {message.sender_type === 'admin' ? message.sender_name || 'Printair Admin' : 'Customer'}
                                                    </p>
                                                    <span className="text-xs text-secondary-light">{formatDateTime(message.created_at)}</span>
                                                </div>
                                                <p className="text-sm text-neutral-800 mb-0 whitespace-pre-line">{message.body}</p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="col-12 col-lg-4">
                        <div className="card radius-12">
                            <div className="card-header bg-base border-bottom py-16 px-24">
                                <h6 className="text-sm fw-semibold text-neutral-900 mb-0">Reply to customer</h6>
                            </div>
                            <form onSubmit={submitReply} className="card-body px-24 py-20">
                                <div className="mb-3">
                                    <label className="form-label text-sm text-neutral-700 fw-semibold">Status</label>
                                    <select
                                        className="form-select form-select-sm radius-8"
                                        value={form.data.status}
                                        onChange={(event) => form.setData('status', event.target.value)}
                                    >
                                        {statuses.map((value) => (
                                            <option key={value} value={value}>
                                                {statusLabel(value)}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="mb-3">
                                    <label className="form-label text-sm text-neutral-700 fw-semibold">Message *</label>
                                    <textarea
                                        rows="5"
                                        className="form-control radius-8"
                                        placeholder="Let the customer know what happens next..."
                                        value={form.data.message}
                                        onChange={(event) => form.setData('message', event.target.value)}
                                    />
                                    {form.errors.message && <p className="text-danger text-xs mt-1">{form.errors.message}</p>}
                                </div>

                                <div className="form-check form-switch mb-4">
                                    <input
                                        className="form-check-input"
                                        type="checkbox"
                                        id="notifyCustomer"
                                        checked={form.data.notify_customer}
                                        onChange={(event) => form.setData('notify_customer', event.target.checked)}
                                    />
                                    <label className="form-check-label text-sm text-neutral-700" htmlFor="notifyCustomer">
                                        Email update to {contact.email || 'customer'}
                                    </label>
                                </div>

                                <button type="submit" className="btn btn-primary-600 w-100" disabled={form.processing || !supportRequest.id}>
                                    {form.processing ? 'Sending...' : 'Send reply'}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </AdminDashboard>
        </>
    );
}

