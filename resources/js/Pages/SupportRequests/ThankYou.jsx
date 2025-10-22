import React, { useMemo } from 'react';
import { Head, Link } from '@inertiajs/react';

function formatDate(value) {
    if (!value) return 'Pending';
    try {
        return new Intl.DateTimeFormat('en-GB', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        }).format(new Date(value));
    } catch (error) {
        return value;
    }
}

export default function ThankYou({ request, trackingUrl }) {
    const supportRequest = useMemo(() => request?.data ?? request ?? {}, [request]);
    const contact = supportRequest?.contact || {};
    const specs = supportRequest?.specs || {};

    const handleCopy = () => {
        if (typeof navigator !== 'undefined' && navigator.clipboard) {
            navigator.clipboard.writeText(trackingUrl);
        }
    };

    return (
        <>
            <Head title="Request Submitted" />
            <div className="tw-min-h-screen tw-bg-gray-50">
                <header className="tw-bg-white tw-shadow-sm">
                    <div className="tw-mx-auto tw-flex tw-max-w-4xl tw-items-center tw-justify-between tw-px-4 tw-py-4">
                        <Link href="/" className="tw-text-lg tw-font-semibold tw-text-gray-900">
                            Printair
                        </Link>
                        <Link href={trackingUrl} className="tw-text-sm tw-font-medium tw-text-gray-600 hover:tw-text-gray-900">
                            View status
                        </Link>
                    </div>
                </header>

                <main className="tw-mx-auto tw-max-w-4xl tw-px-4 tw-pb-12 tw-pt-10">
                    <div className="tw-rounded-2xl tw-bg-white tw-px-8 tw-py-10 tw-shadow-sm">
                        <div className="tw-flex tw-flex-col md:tw-flex-row md:tw-items-start md:tw-justify-between">
                            <div>
                                <p className="tw-text-sm tw-font-semibold tw-uppercase tw-text-green-600">Request submitted</p>
                                <h1 className="tw-mt-2 tw-text-3xl tw-font-bold tw-text-gray-900">
                                    Thanks, {contact.name || 'friend'}!
                                </h1>
                                <p className="tw-mt-3 tw-text-sm tw-text-gray-600">
                                    We have queued your request <span className="tw-font-semibold">{supportRequest?.reference}</span>. A confirmation has been emailed to{' '}
                                    <span className="tw-font-medium">{contact.email}</span>.
                                </p>
                            </div>
                            <div className="tw-mt-6 md:tw-mt-0">
                                <button
                                    type="button"
                                    onClick={handleCopy}
                                    className="tw-rounded tw-bg-gray-900 tw-px-4 tw-py-2 tw-text-sm tw-font-semibold tw-text-white hover:tw-bg-black"
                                >
                                    Copy tracking link
                                </button>
                            </div>
                        </div>

                        <div className="tw-mt-8 tw-grid tw-gap-6 md:tw-grid-cols-2">
                            <div className="tw-rounded-xl tw-border tw-border-gray-100 tw-p-5">
                                <h2 className="tw-text-sm tw-font-semibold tw-uppercase tw-text-gray-500">Summary</h2>
                                <dl className="tw-mt-4 tw-space-y-2">
                                    <div>
                                        <dt className="tw-text-xs tw-uppercase tw-text-gray-400">Reference</dt>
                                        <dd className="tw-text-sm tw-font-medium tw-text-gray-800">{supportRequest?.reference}</dd>
                                    </div>
                                    <div>
                                        <dt className="tw-text-xs tw-uppercase tw-text-gray-400">Category</dt>
                                        <dd className="tw-text-sm tw-font-medium tw-text-gray-800">{supportRequest?.category?.label}</dd>
                                    </div>
                                    <div>
                                        <dt className="tw-text-xs tw-uppercase tw-text-gray-400">Desired date</dt>
                                        <dd className="tw-text-sm tw-font-medium tw-text-gray-800">{formatDate(supportRequest?.desired_date)}</dd>
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
                        </div>

                        <div className="tw-mt-8 tw-rounded-xl tw-border tw-border-gray-100 tw-p-5">
                            <h2 className="tw-text-sm tw-font-semibold tw-uppercase tw-text-gray-500">Specs recap</h2>
                            <div className="tw-mt-4 tw-grid tw-gap-4 md:tw-grid-cols-2">
                                <div className="tw-text-sm">
                                    <p className="tw-font-semibold tw-text-gray-800">Size</p>
                                    <p className="tw-text-gray-600">
                                        {specs?.size?.width && specs?.size?.height
                                            ? `${specs.size.width} × ${specs.size.height} ${specs.size.unit}`
                                            : 'Not provided'}
                                    </p>
                                </div>
                                <div className="tw-text-sm">
                                    <p className="tw-font-semibold tw-text-gray-800">Quantity</p>
                                    <p className="tw-text-gray-600">{specs?.quantity || 'Not provided'}</p>
                                </div>
                                <div className="tw-text-sm">
                                    <p className="tw-font-semibold tw-text-gray-800">Material</p>
                                    <p className="tw-text-gray-600">{specs?.material || 'Not provided'}</p>
                                </div>
                                <div className="tw-text-sm">
                                    <p className="tw-font-semibold tw-text-gray-800">Finishing</p>
                                    <p className="tw-text-gray-600">{specs?.finishing || 'Not provided'}</p>
                                </div>
                            </div>
                        </div>

                        <div className="tw-mt-8 tw-flex tw-flex-wrap tw-items-center tw-gap-4">
                            <Link
                                href={trackingUrl}
                                className="tw-inline-flex tw-items-center tw-justify-center tw-rounded tw-border tw-border-gray-300 tw-px-4 tw-py-2 tw-text-sm tw-font-semibold tw-text-gray-700 hover:tw-border-gray-400"
                            >
                                View status page
                            </Link>
                            <Link
                                href={route('requests.create')}
                                className="tw-inline-flex tw-items-center tw-justify-center tw-rounded tw-bg-gray-100 tw-px-4 tw-py-2 tw-text-sm tw-font-semibold tw-text-gray-800 hover:tw-bg-gray-200"
                            >
                                Start another request
                            </Link>
                        </div>
                    </div>
                </main>
            </div>
        </>
    );
}
