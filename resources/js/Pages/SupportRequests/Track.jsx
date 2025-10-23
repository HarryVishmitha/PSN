import React, { useEffect } from 'react';
import { Head, Link } from '@inertiajs/react';
import Header from '@/Components/Header';
import Footer from '@/Components/Footer';
import Meta from '@/Components/Metaheads';
import { Icon } from '@iconify/react';
import AOS from 'aos';
import 'aos/dist/aos.css';

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
        approved: { bg: 'tw-bg-green-100', text: 'tw-text-green-700', icon: 'mdi:check-circle' },
        in_review: { bg: 'tw-bg-blue-100', text: 'tw-text-blue-700', icon: 'mdi:clock-outline' },
        awaiting_customer: { bg: 'tw-bg-yellow-100', text: 'tw-text-yellow-700', icon: 'mdi:account-clock' },
        completed: { bg: 'tw-bg-teal-100', text: 'tw-text-teal-700', icon: 'mdi:check-all' },
        closed: { bg: 'tw-bg-gray-200', text: 'tw-text-gray-700', icon: 'mdi:close-circle' },
    };

    const statusConfig = map[status] || { bg: 'tw-bg-gray-200', text: 'tw-text-gray-700', icon: 'mdi:help-circle' };
    const label = status ? status.replace(/_/g, ' ') : 'unknown';
    
    return (
        <span className={`tw-rounded-full tw-px-3 tw-py-1.5 tw-text-xs tw-font-semibold tw-flex tw-items-center tw-gap-1.5 tw-leading-none tw-w-fit ${statusConfig.bg} ${statusConfig.text}`}>
            <Icon icon={statusConfig.icon} className="tw-text-sm" />
            {label}
        </span>
    );
}

export default function Track({ request }) {
    const supportRequest = request?.data ?? request ?? {};
    const contact = supportRequest?.contact || {};
    const files = supportRequest?.files || [];
    const messages = supportRequest?.messages || [];
    const specs = supportRequest?.specs || {};

    // Initialize AOS animations
    useEffect(() => {
        AOS.init({
            duration: 800,
            once: true,
            easing: 'ease-in-out',
        });
    }, []);

    return (
        <>
            <Head title={`Track Request ${supportRequest?.reference || ''} - Printair`} />
            <Meta
                title={`Track Request ${supportRequest?.reference || ''} - Printair Advertising`}
                description="Track your custom printing request status and view updates from our team."
                keywords="track request, printing status, request tracking, Printair"
            />
            <Header />

            <div className="tw-min-h-screen tw-bg-gradient-to-br tw-from-gray-50 tw-to-gray-100">
                <main className="tw-mx-auto tw-max-w-6xl tw-px-4 tw-pb-12 tw-pt-10 tw-space-y-8">
                    {/* Header Card */}
                    <div className="tw-rounded-2xl tw-bg-gradient-to-r tw-from-[#f44032] tw-to-[#ff6b5e] tw-px-6 md:tw-px-8 tw-py-8 md:tw-py-10 tw-shadow-xl tw-text-white tw-relative tw-overflow-hidden" data-aos="fade-up">
                        <div className="tw-absolute tw-inset-0 tw-opacity-10">
                            <div className="tw-absolute tw-top-10 tw-right-10 tw-w-40 tw-h-40 tw-bg-white tw-rounded-full tw-blur-3xl"></div>
                            <div className="tw-absolute tw-bottom-10 tw-left-10 tw-w-32 tw-h-32 tw-bg-white tw-rounded-full tw-blur-3xl"></div>
                        </div>
                        <div className="tw-relative tw-z-10">
                            <div className="tw-flex tw-flex-col md:tw-flex-row md:tw-items-start md:tw-justify-between tw-gap-6">
                                <div className="tw-flex-1">
                                    <p className="tw-text-xs tw-font-semibold tw-uppercase tw-text-white/80 tw-tracking-wide tw-leading-none tw-mb-2">Request Reference</p>
                                    <h3 className="tw-text-2xl md:tw-text-4xl tw-font-bold tw-leading-tight tw-break-all">{supportRequest?.reference}</h3>
                                    <div className="tw-mt-4 tw-flex tw-flex-wrap tw-items-center tw-gap-3">
                                        <StatusBadge status={supportRequest?.status} />
                                    </div>
                                    <p className="tw-mt-3 tw-text-sm tw-text-white/90 tw-flex tw-items-center tw-gap-2 tw-leading-relaxed">
                                        <Icon icon="mdi:calendar" className="tw-text-base tw-flex-shrink-0" />
                                        <span>Submitted on {formatDateTime(supportRequest?.created_at)}</span>
                                    </p>
                                    <p className="tw-mt-2 tw-text-sm tw-text-white/90 tw-flex tw-items-center tw-gap-2 tw-leading-relaxed">
                                        <Icon icon="mdi:email" className="tw-text-base tw-flex-shrink-0" />
                                        <span>Confirmation sent to <span className="tw-font-semibold tw-break-all">{contact.email || '—'}</span></span>
                                    </p>
                                </div>
                                <Link
                                    href={route('requests.create')}
                                    className="tw-flex tw-items-center tw-gap-2 tw-rounded-lg tw-bg-white tw-px-5 tw-py-3 tw-text-sm tw-font-semibold tw-text-[#f44032] hover:tw-bg-white/90 tw-transition-all hover:tw-shadow-lg tw-leading-none tw-w-fit tw-whitespace-nowrap"
                                >
                                    <Icon icon="mdi:plus-circle" className="tw-text-lg tw-flex-shrink-0" />
                                    New Request
                                </Link>
                            </div>
                        </div>
                    </div>

                    {/* Contact & Job Info Cards */}
                    <div className="tw-grid tw-gap-6 md:tw-grid-cols-2">
                        {/* Contact Card */}
                        <div className="tw-rounded-2xl tw-shadow-lg tw-border tw-border-gray-200 tw-overflow-hidden" data-aos="fade-up" data-aos-delay="100">
                            <div className="tw-bg-gradient-to-r tw-from-[#6a11cb] tw-to-[#2575fc] tw-px-6 tw-py-4 tw-text-white">
                                <div className="tw-flex tw-items-center tw-gap-3">
                                    <Icon icon="mdi:account-circle" className="tw-text-xl tw-flex-shrink-0" />
                                    <h3 className="tw-text-base tw-font-bold tw-leading-none">Contact Details</h3>
                                </div>
                            </div>
                            <div className="tw-px-6 tw-py-6 tw-bg-white tw-space-y-3">
                                <div className="tw-flex tw-items-start tw-gap-3 tw-p-3 tw-bg-gray-50 tw-rounded-lg">
                                    <Icon icon="mdi:account" className="tw-text-lg tw-text-[#6a11cb] tw-flex-shrink-0 tw-mt-0.5" />
                                    <div className="tw-flex-1 tw-min-w-0">
                                        <dt className="tw-text-xs tw-uppercase tw-font-bold tw-text-gray-500 tw-tracking-wide tw-leading-none tw-mb-1.5">Name</dt>
                                        <dd className="tw-text-sm tw-font-medium tw-text-gray-800 tw-break-words tw-leading-relaxed">{contact.name || '—'}</dd>
                                    </div>
                                </div>
                                <div className="tw-flex tw-items-start tw-gap-3 tw-p-3 tw-bg-gray-50 tw-rounded-lg">
                                    <Icon icon="mdi:email" className="tw-text-lg tw-text-[#6a11cb] tw-flex-shrink-0 tw-mt-0.5" />
                                    <div className="tw-flex-1 tw-min-w-0">
                                        <dt className="tw-text-xs tw-uppercase tw-font-bold tw-text-gray-500 tw-tracking-wide tw-leading-none tw-mb-1.5">Email</dt>
                                        <dd className="tw-text-sm tw-font-medium tw-text-gray-800 tw-break-all tw-leading-relaxed">{contact.email || '—'}</dd>
                                    </div>
                                </div>
                                <div className="tw-flex tw-items-start tw-gap-3 tw-p-3 tw-bg-gray-50 tw-rounded-lg">
                                    <Icon icon="mdi:whatsapp" className="tw-text-lg tw-text-[#6a11cb] tw-flex-shrink-0 tw-mt-0.5" />
                                    <div className="tw-flex-1 tw-min-w-0">
                                        <dt className="tw-text-xs tw-uppercase tw-font-bold tw-text-gray-500 tw-tracking-wide tw-leading-none tw-mb-1.5">WhatsApp</dt>
                                        <dd className="tw-text-sm tw-font-medium tw-text-gray-800 tw-break-words tw-leading-relaxed">{contact.phone_whatsapp || '—'}</dd>
                                    </div>
                                </div>
                                {contact.company && (
                                    <div className="tw-flex tw-items-start tw-gap-3 tw-p-3 tw-bg-gray-50 tw-rounded-lg">
                                        <Icon icon="mdi:office-building" className="tw-text-lg tw-text-[#6a11cb] tw-flex-shrink-0 tw-mt-0.5" />
                                        <div className="tw-flex-1 tw-min-w-0">
                                            <dt className="tw-text-xs tw-uppercase tw-font-bold tw-text-gray-500 tw-tracking-wide tw-leading-none tw-mb-1.5">Company</dt>
                                            <dd className="tw-text-sm tw-font-medium tw-text-gray-800 tw-break-words tw-leading-relaxed">{contact.company}</dd>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Job Info Card */}
                        <div className="tw-rounded-2xl tw-shadow-lg tw-border tw-border-gray-200 tw-overflow-hidden" data-aos="fade-up" data-aos-delay="200">
                            <div className="tw-bg-gradient-to-r tw-from-[#f44032] tw-to-[#ff6b5e] tw-px-6 tw-py-4 tw-text-white">
                                <div className="tw-flex tw-items-center tw-gap-3">
                                    <Icon icon="mdi:briefcase" className="tw-text-xl tw-flex-shrink-0" />
                                    <h3 className="tw-text-base tw-font-bold tw-leading-none">Job Information</h3>
                                </div>
                            </div>
                            <div className="tw-px-6 tw-py-6 tw-bg-white tw-space-y-3">
                                <div className="tw-flex tw-items-start tw-gap-3 tw-p-3 tw-bg-gray-50 tw-rounded-lg">
                                    <Icon icon="mdi:file-document" className="tw-text-lg tw-text-[#f44032] tw-flex-shrink-0 tw-mt-0.5" />
                                    <div className="tw-flex-1 tw-min-w-0">
                                        <dt className="tw-text-xs tw-uppercase tw-font-bold tw-text-gray-500 tw-tracking-wide tw-leading-none tw-mb-1.5">Title</dt>
                                        <dd className="tw-text-sm tw-font-medium tw-text-gray-800 tw-break-words tw-leading-relaxed">{supportRequest?.title || '—'}</dd>
                                    </div>
                                </div>
                                <div className="tw-flex tw-items-start tw-gap-3 tw-p-3 tw-bg-gray-50 tw-rounded-lg">
                                    <Icon icon="mdi:tag" className="tw-text-lg tw-text-[#f44032] tw-flex-shrink-0 tw-mt-0.5" />
                                    <div className="tw-flex-1 tw-min-w-0">
                                        <dt className="tw-text-xs tw-uppercase tw-font-bold tw-text-gray-500 tw-tracking-wide tw-leading-none tw-mb-1.5">Category</dt>
                                        <dd className="tw-text-sm tw-font-medium tw-text-gray-800 tw-break-words tw-leading-relaxed">{supportRequest?.category?.label}</dd>
                                    </div>
                                </div>
                                <div className="tw-flex tw-items-start tw-gap-3 tw-p-3 tw-bg-gray-50 tw-rounded-lg">
                                    <Icon icon="mdi:calendar" className="tw-text-lg tw-text-[#f44032] tw-flex-shrink-0 tw-mt-0.5" />
                                    <div className="tw-flex-1 tw-min-w-0">
                                        <dt className="tw-text-xs tw-uppercase tw-font-bold tw-text-gray-500 tw-tracking-wide tw-leading-none tw-mb-1.5">Desired Date</dt>
                                        <dd className="tw-text-sm tw-font-medium tw-text-gray-800 tw-break-words tw-leading-relaxed">
                                            {supportRequest?.desired_date ? `${formatDateTime(supportRequest.desired_date)} (${supportRequest?.flexibility})` : 'Not set'}
                                        </dd>
                                    </div>
                                </div>
                                <div className="tw-flex tw-items-start tw-gap-3 tw-p-3 tw-bg-gray-50 tw-rounded-lg">
                                    <Icon icon="mdi:currency-usd" className="tw-text-lg tw-text-[#f44032] tw-flex-shrink-0 tw-mt-0.5" />
                                    <div className="tw-flex-1 tw-min-w-0">
                                        <dt className="tw-text-xs tw-uppercase tw-font-bold tw-text-gray-500 tw-tracking-wide tw-leading-none tw-mb-1.5">Budget</dt>
                                        <dd className="tw-text-sm tw-font-medium tw-text-gray-800 tw-break-words tw-leading-relaxed">
                                            {supportRequest?.budget?.min || supportRequest?.budget?.max
                                                ? `${supportRequest?.budget?.min ?? '—'} - ${supportRequest?.budget?.max ?? '—'}`
                                                : 'Not specified'}
                                        </dd>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Artwork & Attachments Card */}
                    <div className="tw-rounded-2xl tw-shadow-lg tw-border tw-border-gray-200 tw-overflow-hidden" data-aos="fade-up" data-aos-delay="300">
                        <div className="tw-bg-gradient-to-r tw-from-[#6a11cb] tw-to-[#2575fc] tw-px-6 tw-py-4 tw-text-white">
                            <div className="tw-flex tw-items-center tw-gap-3">
                                <Icon icon="mdi:paperclip" className="tw-text-xl tw-flex-shrink-0" />
                                <h3 className="tw-text-base tw-font-bold tw-leading-none">Artwork & Attachments</h3>
                            </div>
                        </div>
                        <div className="tw-px-6 tw-py-6 tw-bg-white">
                            {files.length === 0 ? (
                                <div className="tw-flex tw-flex-col tw-items-center tw-justify-center tw-py-8 tw-text-center">
                                    <Icon icon="mdi:file-outline" className="tw-text-5xl tw-text-gray-300 tw-mb-3" />
                                    <p className="tw-text-sm tw-text-gray-600 tw-leading-relaxed">No files were uploaded with this request.</p>
                                </div>
                            ) : (
                                <ul className="tw-space-y-3">
                                    {files.map((file) => (
                                        <li key={file.id} className="tw-flex tw-items-center tw-justify-between tw-rounded-lg tw-border tw-border-gray-200 tw-bg-gray-50 tw-px-4 tw-py-3 tw-shadow-sm hover:tw-shadow-md tw-transition-all">
                                            <div className="tw-flex tw-items-center tw-gap-3 tw-flex-1 tw-min-w-0">
                                                <Icon icon="mdi:file-document" className="tw-text-xl tw-text-[#6a11cb] tw-flex-shrink-0" />
                                                <div className="tw-min-w-0 tw-flex-1">
                                                    <p className="tw-text-sm tw-font-semibold tw-text-gray-800 tw-leading-none tw-truncate">{file.name}</p>
                                                    <p className="tw-text-xs tw-text-gray-500 tw-mt-1 tw-leading-none">{file.mime_type}</p>
                                                </div>
                                            </div>
                                            <a
                                                href={file.download_url}
                                                className="tw-flex tw-items-center tw-gap-1.5 tw-text-sm tw-font-semibold tw-text-[#6a11cb] hover:tw-text-[#2575fc] hover:tw-underline tw-leading-none tw-ml-3 tw-whitespace-nowrap"
                                                target="_blank"
                                                rel="noopener noreferrer"
                                            >
                                                <Icon icon="mdi:download" className="tw-text-base" />
                                                Download
                                            </a>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>

                    {/* Timeline Card */}
                    <div className="tw-rounded-2xl tw-shadow-lg tw-border tw-border-gray-200 tw-overflow-hidden" data-aos="fade-up" data-aos-delay="400">
                        <div className="tw-bg-gradient-to-r tw-from-[#f44032] tw-to-[#ff6b5e] tw-px-6 tw-py-4 tw-text-white">
                            <div className="tw-flex tw-items-center tw-gap-3">
                                <Icon icon="mdi:timeline-clock" className="tw-text-xl tw-flex-shrink-0" />
                                <h3 className="tw-text-base tw-font-bold tw-leading-none">Communication Timeline</h3>
                            </div>
                        </div>
                        <div className="tw-px-6 tw-py-6 tw-bg-white">
                            {messages.length === 0 ? (
                                <div className="tw-flex tw-flex-col tw-items-center tw-justify-center tw-py-8 tw-text-center">
                                    <Icon icon="mdi:message-outline" className="tw-text-5xl tw-text-gray-300 tw-mb-3" />
                                    <p className="tw-text-sm tw-text-gray-600 tw-leading-relaxed">No messages yet. We will email you as soon as the team responds.</p>
                                </div>
                            ) : (
                                <ol className="tw-space-y-3">
                                    {messages.map((message) => (
                                        <li key={message.id} className="tw-rounded-lg tw-border tw-border-gray-200 tw-bg-gray-50 tw-p-4 tw-shadow-sm">
                                            <div className="tw-flex tw-items-center tw-justify-between tw-mb-3">
                                                <p className="tw-text-sm tw-font-semibold tw-text-gray-800 tw-flex tw-items-center tw-gap-2 tw-leading-none">
                                                    <Icon icon={message.sender_type === 'admin' ? 'mdi:account-tie' : 'mdi:account'} className="tw-text-base tw-text-[#f44032] tw-flex-shrink-0" />
                                                    {message.sender_type === 'admin' ? 'Printair Team' : 'You'}
                                                </p>
                                                <p className="tw-text-xs tw-text-gray-500 tw-flex tw-items-center tw-gap-1 tw-leading-none tw-flex-shrink-0 tw-ml-2">
                                                    <Icon icon="mdi:clock-outline" className="tw-text-sm" />
                                                    {formatDateTime(message.created_at)}
                                                </p>
                                            </div>
                                            <p className="tw-whitespace-pre-line tw-text-sm tw-text-gray-700 tw-leading-relaxed">{message.body}</p>
                                        </li>
                                    ))}
                                </ol>
                            )}
                        </div>
                    </div>

                    {/* Original Brief Card */}
                    {request?.description && (
                        <div className="tw-rounded-2xl tw-shadow-lg tw-border tw-border-gray-200 tw-overflow-hidden" data-aos="fade-up" data-aos-delay="500">
                            <div className="tw-bg-gradient-to-r tw-from-[#6a11cb] tw-to-[#2575fc] tw-px-6 tw-py-4 tw-text-white">
                                <div className="tw-flex tw-items-center tw-gap-3">
                                    <Icon icon="mdi:text-box" className="tw-text-xl tw-flex-shrink-0" />
                                    <h3 className="tw-text-base tw-font-bold tw-leading-none">Original Brief</h3>
                                </div>
                            </div>
                            <div className="tw-px-6 tw-py-6 tw-bg-white">
                                <p className="tw-whitespace-pre-line tw-text-sm tw-text-gray-700 tw-leading-relaxed">{request.description}</p>
                            </div>
                        </div>
                    )}
                </main>
            </div>

            <Footer />
        </>
    );
}
