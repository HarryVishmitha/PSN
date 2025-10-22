import React from 'react';
import { Head, Link } from '@inertiajs/react';

function formatDateTime(value) {
    if (!value) return 'Pending';
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
}

function StatusBadge({ status }) {
    const map = {
        approved: 'tw-bg-green-100 tw-text-green-700',
        in_review: 'tw-bg-blue-100 tw-text-blue-700',
        awaiting_customer: 'tw-bg-yellow-100 tw-text-yellow-700',
        completed: 'tw-bg-teal-100 tw-text-teal-700',
        closed: 'tw-bg-gray-200 tw-text-gray-700',
    };

    const label = status ? status.replace(/_/g, ' ') : 'unknown';
    return <span className={`tw-rounded-full tw-px-3 tw-py-1 tw-text-xs tw-font-semibold ${map[status] || 'tw-bg-gray-200 tw-text-gray-700'}`}>{label}</span>;
}

export default function Track({ request }) {
    const supportRequest = request?.data ?? request ?? {};
    const contact = supportRequest?.contact || {};
    const files = supportRequest?.files || [];
    const messages = supportRequest?.messages || [];
    const specs = supportRequest?.specs || {};

    return (
        <>
            <Head title={`Request ${supportRequest?.reference || 'Request'}`} />
            <div className="tw-min-h-screen tw-bg-gray-50">
                <header className="tw-bg-white tw-shadow-sm">
                    <div className="tw-mx-auto tw-flex tw-max-w-5xl tw-items-center tw-justify-between tw-px-4 tw-py-4">
                        <Link href="/" className="tw-text-lg tw-font-semibold tw-text-gray-900">
                            Printair
                        </Link>
                        <Link href={route('requests.create')} className="tw-text-sm tw-font-medium tw-text-gray-600 hover:tw-text-gray-900">
                            Start another request
                        </Link>
                    </div>
                </header>

                <main className="tw-mx-auto tw-max-w-5xl tw-px-4 tw-pb-12 tw-pt-10 tw-space-y-8">
                    <div className="tw-rounded-2xl tw-bg-white tw-px-8 tw-py-8 tw-shadow-sm">
                        <div className="tw-flex tw-flex-col md:tw-flex-row md:tw-items-center md:tw-justify-between">
                            <div>
                                <p className="tw-text-xs tw-font-semibold tw-uppercase tw-text-gray-500">Request reference</p>
                                <h1 className="tw-text-3xl tw-font-bold tw-text-gray-900">{supportRequest?.reference}</h1>
                                <div className="tw-mt-3 tw-flex tw-items-center tw-gap-3">
                                    <StatusBadge status={supportRequest?.status} />
                                    <p className="tw-text-sm tw-text-gray-600">
                                        Submitted on {formatDateTime(supportRequest?.created_at)} • Confirmation sent to {contact.email || '—'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="tw-mt-8 tw-grid tw-gap-6 md:tw-grid-cols-2">
                            <div className="tw-rounded-xl tw-border tw-border-gray-100 tw-p-5">
                                <h2 className="tw-text-sm tw-font-semibold tw-uppercase tw-text-gray-500">Contact</h2>
                                <dl className="tw-mt-4 tw-space-y-2">
                                    <div>
                                        <dt className="tw-text-xs tw-uppercase tw-text-gray-400">Name</dt>
                                        <dd className="tw-text-sm tw-font-medium tw-text-gray-800">{contact.name || '—'}</dd>
                                    </div>
                                    <div>
                                        <dt className="tw-text-xs tw-uppercase tw-text-gray-400">Email</dt>
                                        <dd className="tw-text-sm tw-font-medium tw-text-gray-800">{contact.email || '—'}</dd>
                                    </div>
                                    <div>
                                        <dt className="tw-text-xs tw-uppercase tw-text-gray-400">WhatsApp</dt>
                                        <dd className="tw-text-sm tw-font-medium tw-text-gray-800">{contact.phone_whatsapp || '—'}</dd>
                                    </div>
                                    {contact.company && (
                                        <div>
                                            <dt className="tw-text-xs tw-uppercase tw-text-gray-400">Company</dt>
                                            <dd className="tw-text-sm tw-font-medium tw-text-gray-800">{contact.company}</dd>
                                        </div>
                                    )}
                                </dl>
                            </div>
                            <div className="tw-rounded-xl tw-border tw-border-gray-100 tw-p-5">
                                <h2 className="tw-text-sm tw-font-semibold tw-uppercase tw-text-gray-500">Job info</h2>
                                <dl className="tw-mt-4 tw-space-y-2">
                                    <div>
                                        <dt className="tw-text-xs tw-uppercase tw-text-gray-400">Title</dt>
                                        <dd className="tw-text-sm tw-font-medium tw-text-gray-800">{supportRequest?.title || '—'}</dd>
                                    </div>
                                    <div>
                                        <dt className="tw-text-xs tw-uppercase tw-text-gray-400">Category</dt>
                                        <dd className="tw-text-sm tw-font-medium tw-text-gray-800">{supportRequest?.category?.label}</dd>
                                    </div>
                                    <div>
                                        <dt className="tw-text-xs tw-uppercase tw-text-gray-400">Desired date</dt>
                                        <dd className="tw-text-sm tw-font-medium tw-text-gray-800">
                                            {supportRequest?.desired_date ? `${formatDateTime(supportRequest.desired_date)} (${supportRequest?.flexibility})` : 'Not set'}
                                        </dd>
                                    </div>
                                    <div>
                                        <dt className="tw-text-xs tw-uppercase tw-text-gray-400">Budget</dt>
                                        <dd className="tw-text-sm tw-font-medium tw-text-gray-800">
                                            {supportRequest?.budget?.min || supportRequest?.budget?.max
                                                ? `${supportRequest?.budget?.min ?? '—'} - ${supportRequest?.budget?.max ?? '—'}`
                                                : 'Not specified'}
                                        </dd>
                                    </div>
                                </dl>
                            </div>
                        </div>

                        <div className="tw-mt-8 tw-rounded-xl tw-border tw-border-gray-100 tw-p-5">
                            <h2 className="tw-text-sm tw-font-semibold tw-uppercase tw-text-gray-500">Artwork & attachments</h2>
                            {files.length === 0 ? (
                                <p className="tw-mt-4 tw-text-sm tw-text-gray-600">No files were uploaded with this request.</p>
                            ) : (
                                <ul className="tw-mt-4 tw-space-y-2">
                                    {files.map((file) => (
                                        <li key={file.id} className="tw-flex tw-items-center tw-justify-between tw-rounded tw-border tw-border-gray-200 tw-bg-white tw-px-3 tw-py-2">
                                            <div>
                                                <p className="tw-text-sm tw-font-medium tw-text-gray-800">{file.name}</p>
                                                <p className="tw-text-xs tw-text-gray-500">{file.mime_type}</p>
                                            </div>
                                            <a
                                                href={file.download_url}
                                                className="tw-text-sm tw-font-semibold tw-text-gray-900 hover:tw-underline"
                                                target="_blank"
                                                rel="noopener noreferrer"
                                            >
                                                Download
                                            </a>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>

                        <div className="tw-mt-8 tw-rounded-xl tw-border tw-border-gray-100 tw-p-5">
                            <h2 className="tw-text-sm tw-font-semibold tw-uppercase tw-text-gray-500">Timeline</h2>
                            {messages.length === 0 ? (
                                <p className="tw-mt-4 tw-text-sm tw-text-gray-600">No messages yet. We will email you as soon as the team responds.</p>
                            ) : (
                                <ol className="tw-mt-4 tw-space-y-4">
                                    {messages.map((message) => (
                                        <li key={message.id} className="tw-rounded tw-border tw-border-gray-200 tw-bg-gray-50 tw-p-4">
                                            <div className="tw-flex tw-items-center tw-justify-between">
                                                <p className="tw-text-sm tw-font-semibold tw-text-gray-800">
                                                    {message.sender_type === 'admin' ? 'Printair team' : 'You'}
                                                </p>
                                                <p className="tw-text-xs tw-text-gray-500">{formatDateTime(message.created_at)}</p>
                                            </div>
                                            <p className="tw-mt-3 tw-whitespace-pre-line tw-text-sm tw-text-gray-700">{message.body}</p>
                                        </li>
                                    ))}
                                </ol>
                            )}
                        </div>

                        {request?.description && (
                            <div className="tw-mt-8 tw-rounded-xl tw-border tw-border-gray-100 tw-p-5">
                                <h2 className="tw-text-sm tw-font-semibold tw-uppercase tw-text-gray-500">Original brief</h2>
                                <p className="tw-mt-3 tw-whitespace-pre-line tw-text-sm tw-text-gray-700">{request.description}</p>
                            </div>
                        )}
                    </div>
                </main>
            </div>
        </>
    );
}
