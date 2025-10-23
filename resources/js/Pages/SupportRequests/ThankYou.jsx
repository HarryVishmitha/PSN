import React, { useEffect, useMemo } from 'react';
import { Head, Link } from '@inertiajs/react';
import Header from '@/Components/Header';
import Footer from '@/Components/Footer';
import Meta from '@/Components/Metaheads';
import { Icon } from '@iconify/react';
import AOS from 'aos';
import 'aos/dist/aos.css';

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

    // Initialize AOS animations
    useEffect(() => {
        AOS.init({
            duration: 800,
            once: true,
            easing: 'ease-in-out',
        });
    }, []);

    const handleCopy = () => {
        if (typeof navigator !== 'undefined' && navigator.clipboard) {
            navigator.clipboard.writeText(trackingUrl);
        }
    };

    return (
        <>
            <Head title="Request Submitted - Printair" />
            <Meta
                title="Request Submitted Successfully - Printair Advertising"
                description="Your custom printing request has been submitted successfully. We'll get back to you shortly with a personalized quote."
                keywords="request submitted, quote confirmation, printing request, Printair"
            />
            <Header />

            <div className="tw-min-h-screen tw-bg-gradient-to-br tw-from-gray-50 tw-to-gray-100">
                <main className="tw-mx-auto tw-max-w-6xl tw-px-4 tw-pb-12 tw-pt-10">
                    {/* Success Banner */}
                    <div className="tw-rounded-2xl tw-bg-gradient-to-r tw-from-green-500 tw-to-emerald-600 tw-px-8 tw-py-10 tw-shadow-xl tw-text-white tw-relative tw-overflow-hidden" data-aos="fade-up">
                        <div className="tw-absolute tw-inset-0 tw-opacity-10">
                            <div className="tw-absolute tw-top-10 tw-right-10 tw-w-40 tw-h-40 tw-bg-white tw-rounded-full tw-blur-3xl"></div>
                            <div className="tw-absolute tw-bottom-10 tw-left-10 tw-w-32 tw-h-32 tw-bg-white tw-rounded-full tw-blur-3xl"></div>
                        </div>
                        <div className="tw-relative tw-z-10">
                            <div className="tw-flex tw-items-center tw-gap-3 tw-mb-4">
                                <div className="tw-bg-white/20 tw-backdrop-blur-sm tw-p-3 tw-rounded-full">
                                    <Icon icon="mdi:check-circle" className="tw-text-4xl" />
                                </div>
                                <div>
                                    <p className="tw-text-sm tw-font-semibold tw-uppercase tw-tracking-wide tw-leading-none">Request Submitted Successfully</p>
                                    <h3 className="tw-text-3xl md:tw-text-4xl tw-font-bold tw-leading-relaxed tw-mt-3 tw-mb-3">
                                        Thank you, {contact.name || 'friend'}!
                                    </h3>
                                </div>
                            </div>
                            <p className="tw-mt-4 tw-text-base tw-text-white/90 tw-max-w-2xl tw-leading-relaxed">
                                We've received your request <span className="tw-font-bold tw-bg-white/20 tw-px-2 tw-py-1 tw-rounded">{supportRequest?.reference}</span>. 
                                A confirmation email has been sent to <span className="tw-font-semibold">{contact.email}</span>.
                            </p>
                            <div className="tw-mt-6 tw-flex tw-flex-wrap tw-gap-3">
                                <button
                                    type="button"
                                    onClick={handleCopy}
                                    className="tw-flex tw-items-center tw-gap-2 tw-rounded-lg tw-bg-white tw-px-5 tw-py-3 tw-text-sm tw-font-semibold tw-text-green-600 hover:tw-bg-white/90 tw-transition-all hover:tw-shadow-lg tw-leading-none"
                                >
                                    <Icon icon="mdi:content-copy" className="tw-text-lg" />
                                    Copy tracking link
                                </button>
                                <Link
                                    href={trackingUrl}
                                    className="tw-flex tw-items-center tw-gap-2 tw-rounded-lg tw-border-2 tw-border-white tw-px-5 tw-py-3 tw-text-sm tw-font-semibold tw-text-white hover:tw-bg-white/10 tw-transition-all tw-leading-none"
                                >
                                    <Icon icon="mdi:eye" className="tw-text-lg" />
                                    View Status
                                </Link>
                            </div>
                        </div>
                    </div>

                    {/* Summary Cards */}
                    <div className="tw-mt-8 tw-grid tw-gap-6 md:tw-grid-cols-2">
                        {/* Summary Card */}
                        <div className="tw-rounded-2xl tw-shadow-lg tw-border tw-border-gray-200 tw-overflow-hidden" data-aos="fade-up" data-aos-delay="100">
                            <div className="tw-bg-gradient-to-r tw-from-[#f44032] tw-to-[#ff6b5e] tw-px-6 tw-py-4 tw-text-white">
                                <div className="tw-flex tw-items-center tw-gap-3">
                                    <Icon icon="mdi:clipboard-text" className="tw-text-2xl tw-flex-shrink-0" />
                                    <h3 className="tw-text-lg tw-font-bold tw-leading-none">Request Summary</h3>
                                </div>
                            </div>
                            <div className="tw-px-6 tw-py-6 tw-bg-white tw-space-y-4">
                                <div className="tw-flex tw-items-start tw-gap-4 tw-p-4 tw-bg-gray-50 tw-rounded-lg tw-shadow-sm">
                                    <dt className="tw-text-xs tw-uppercase tw-font-bold tw-text-gray-500 tw-tracking-wide tw-w-1/3 tw-flex tw-items-center tw-gap-2 tw-leading-none">
                                        <Icon icon="mdi:identifier" className="tw-text-[#f44032]" />
                                        Reference
                                    </dt>
                                    <dd className="tw-text-sm tw-font-medium tw-text-gray-800 tw-w-2/3 tw-break-words tw-leading-relaxed">{supportRequest?.reference}</dd>
                                </div>
                                <div className="tw-flex tw-items-start tw-gap-4 tw-p-4 tw-bg-gray-50 tw-rounded-lg tw-shadow-sm">
                                    <dt className="tw-text-xs tw-uppercase tw-font-bold tw-text-gray-500 tw-tracking-wide tw-w-1/3 tw-flex tw-items-center tw-gap-2 tw-leading-none">
                                        <Icon icon="mdi:tag" className="tw-text-[#f44032]" />
                                        Category
                                    </dt>
                                    <dd className="tw-text-sm tw-font-medium tw-text-gray-800 tw-w-2/3 tw-break-words tw-leading-relaxed">{supportRequest?.category?.label}</dd>
                                </div>
                                <div className="tw-flex tw-items-start tw-gap-4 tw-p-4 tw-bg-gray-50 tw-rounded-lg tw-shadow-sm">
                                    <dt className="tw-text-xs tw-uppercase tw-font-bold tw-text-gray-500 tw-tracking-wide tw-w-1/3 tw-flex tw-items-center tw-gap-2 tw-leading-none">
                                        <Icon icon="mdi:calendar" className="tw-text-[#f44032]" />
                                        Desired Date
                                    </dt>
                                    <dd className="tw-text-sm tw-font-medium tw-text-gray-800 tw-w-2/3 tw-break-words tw-leading-relaxed">{formatDate(supportRequest?.desired_date)}</dd>
                                </div>
                                <div className="tw-flex tw-items-start tw-gap-4 tw-p-4 tw-bg-gray-50 tw-rounded-lg tw-shadow-sm">
                                    <dt className="tw-text-xs tw-uppercase tw-font-bold tw-text-gray-500 tw-tracking-wide tw-w-1/3 tw-flex tw-items-center tw-gap-2 tw-leading-none">
                                        <Icon icon="mdi:currency-usd" className="tw-text-[#f44032]" />
                                        Budget
                                    </dt>
                                    <dd className="tw-text-sm tw-font-medium tw-text-gray-800 tw-w-2/3 tw-break-words tw-leading-relaxed">
                                        {supportRequest?.budget?.min || supportRequest?.budget?.max
                                            ? `${supportRequest?.budget?.min ?? '—'} - ${supportRequest?.budget?.max ?? '—'}`
                                            : 'Not specified'}
                                    </dd>
                                </div>
                            </div>
                        </div>

                        {/* Contact Card */}
                        <div className="tw-rounded-2xl tw-shadow-lg tw-border tw-border-gray-200 tw-overflow-hidden" data-aos="fade-up" data-aos-delay="200">
                            <div className="tw-bg-gradient-to-r tw-from-[#6a11cb] tw-to-[#2575fc] tw-px-6 tw-py-4 tw-text-white">
                                <div className="tw-flex tw-items-center tw-gap-3">
                                    <Icon icon="mdi:account-circle" className="tw-text-2xl tw-flex-shrink-0" />
                                    <h3 className="tw-text-lg tw-font-bold tw-leading-none">Contact Details</h3>
                                </div>
                            </div>
                            <div className="tw-px-6 tw-py-6 tw-bg-white tw-space-y-4">
                                <div className="tw-flex tw-items-start tw-gap-4 tw-p-4 tw-bg-gray-50 tw-rounded-lg tw-shadow-sm">
                                    <dt className="tw-text-xs tw-uppercase tw-font-bold tw-text-gray-500 tw-tracking-wide tw-w-1/3 tw-flex tw-items-center tw-gap-2 tw-leading-none">
                                        <Icon icon="mdi:account" className="tw-text-[#6a11cb]" />
                                        Name
                                    </dt>
                                    <dd className="tw-text-sm tw-font-medium tw-text-gray-800 tw-w-2/3 tw-break-words tw-leading-relaxed">{contact.name || '—'}</dd>
                                </div>
                                <div className="tw-flex tw-items-start tw-gap-4 tw-p-4 tw-bg-gray-50 tw-rounded-lg tw-shadow-sm">
                                    <dt className="tw-text-xs tw-uppercase tw-font-bold tw-text-gray-500 tw-tracking-wide tw-w-1/3 tw-flex tw-items-center tw-gap-2 tw-leading-none">
                                        <Icon icon="mdi:email" className="tw-text-[#6a11cb]" />
                                        Email
                                    </dt>
                                    <dd className="tw-text-sm tw-font-medium tw-text-gray-800 tw-w-2/3 tw-break-words tw-leading-relaxed">{contact.email || '—'}</dd>
                                </div>
                                <div className="tw-flex tw-items-start tw-gap-4 tw-p-4 tw-bg-gray-50 tw-rounded-lg tw-shadow-sm">
                                    <dt className="tw-text-xs tw-uppercase tw-font-bold tw-text-gray-500 tw-tracking-wide tw-w-1/3 tw-flex tw-items-center tw-gap-2 tw-leading-none">
                                        <Icon icon="mdi:whatsapp" className="tw-text-[#6a11cb]" />
                                        WhatsApp
                                    </dt>
                                    <dd className="tw-text-sm tw-font-medium tw-text-gray-800 tw-w-2/3 tw-break-words tw-leading-relaxed">{contact.phone_whatsapp || '—'}</dd>
                                </div>
                                {contact.company && (
                                    <div className="tw-flex tw-items-start tw-gap-4 tw-p-4 tw-bg-gray-50 tw-rounded-lg tw-shadow-sm">
                                        <dt className="tw-text-xs tw-uppercase tw-font-bold tw-text-gray-500 tw-tracking-wide tw-w-1/3 tw-flex tw-items-center tw-gap-2 tw-leading-none">
                                            <Icon icon="mdi:office-building" className="tw-text-[#6a11cb]" />
                                            Company
                                        </dt>
                                        <dd className="tw-text-sm tw-font-medium tw-text-gray-800 tw-w-2/3 tw-break-words tw-leading-relaxed">{contact.company}</dd>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Specs Card */}
                    <div className="tw-mt-8 tw-rounded-2xl tw-shadow-lg tw-border tw-border-gray-200 tw-overflow-hidden" data-aos="fade-up" data-aos-delay="300">
                        <div className="tw-bg-gradient-to-r tw-from-[#f44032] tw-to-[#ff6b5e] tw-px-6 tw-py-4 tw-text-white">
                            <div className="tw-flex tw-items-center tw-gap-3">
                                <Icon icon="mdi:ruler-square" className="tw-text-2xl tw-flex-shrink-0" />
                                <h3 className="tw-text-lg tw-font-bold tw-leading-none">Technical Specifications</h3>
                            </div>
                        </div>
                        <div className="tw-px-6 tw-py-6 tw-bg-white">
                            <div className="tw-grid tw-gap-4 md:tw-grid-cols-2">
                                <div className="tw-flex tw-items-start tw-gap-4 tw-p-4 tw-bg-gray-50 tw-rounded-lg tw-shadow-sm">
                                    <div>
                                        <p className="tw-flex tw-items-center tw-gap-2 tw-text-xs tw-uppercase tw-font-bold tw-text-gray-500 tw-tracking-wide tw-mb-2 tw-leading-none">
                                            <Icon icon="mdi:resize" className="tw-text-[#f44032]" />
                                            Size
                                        </p>
                                        <p className="tw-text-sm tw-font-medium tw-text-gray-800 tw-leading-relaxed">
                                            {specs?.size?.width && specs?.size?.height
                                                ? `${specs.size.width} × ${specs.size.height} ${specs.size.unit}`
                                                : 'Not provided'}
                                        </p>
                                    </div>
                                </div>
                                <div className="tw-flex tw-items-start tw-gap-4 tw-p-4 tw-bg-gray-50 tw-rounded-lg tw-shadow-sm">
                                    <div>
                                        <p className="tw-flex tw-items-center tw-gap-2 tw-text-xs tw-uppercase tw-font-bold tw-text-gray-500 tw-tracking-wide tw-mb-2 tw-leading-none">
                                            <Icon icon="mdi:counter" className="tw-text-[#f44032]" />
                                            Quantity
                                        </p>
                                        <p className="tw-text-sm tw-font-medium tw-text-gray-800 tw-leading-relaxed">{specs?.quantity || 'Not provided'}</p>
                                    </div>
                                </div>
                                <div className="tw-flex tw-items-start tw-gap-4 tw-p-4 tw-bg-gray-50 tw-rounded-lg tw-shadow-sm">
                                    <div>
                                        <p className="tw-flex tw-items-center tw-gap-2 tw-text-xs tw-uppercase tw-font-bold tw-text-gray-500 tw-tracking-wide tw-mb-2 tw-leading-none">
                                            <Icon icon="mdi:texture" className="tw-text-[#f44032]" />
                                            Material
                                        </p>
                                        <p className="tw-text-sm tw-font-medium tw-text-gray-800 tw-leading-relaxed">{specs?.material || 'Not provided'}</p>
                                    </div>
                                </div>
                                <div className="tw-flex tw-items-start tw-gap-4 tw-p-4 tw-bg-gray-50 tw-rounded-lg tw-shadow-sm">
                                    <div>
                                        <p className="tw-flex tw-items-center tw-gap-2 tw-text-xs tw-uppercase tw-font-bold tw-text-gray-500 tw-tracking-wide tw-mb-2 tw-leading-none">
                                            <Icon icon="mdi:shimmer" className="tw-text-[#f44032]" />
                                            Finishing
                                        </p>
                                        <p className="tw-text-sm tw-font-medium tw-text-gray-800 tw-leading-relaxed">{specs?.finishing || 'Not provided'}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="tw-mt-8 tw-flex tw-flex-wrap tw-items-center tw-gap-4 tw-justify-center" data-aos="fade-up" data-aos-delay="400">
                        <Link
                            href={trackingUrl}
                            className="tw-inline-flex tw-items-center tw-gap-2 tw-justify-center tw-rounded-lg tw-border-2 tw-border-[#f44032] tw-bg-white tw-px-6 tw-py-3 tw-text-sm tw-font-semibold tw-text-[#f44032] hover:tw-bg-[#f44032] hover:tw-text-white tw-transition-all hover:tw-shadow-lg tw-leading-none"
                        >
                            <Icon icon="mdi:magnify" className="tw-text-lg" />
                            View Full Status
                        </Link>
                        <Link
                            href={route('requests.create')}
                            className="tw-inline-flex tw-items-center tw-gap-2 tw-justify-center tw-rounded-lg tw-bg-gradient-to-r tw-from-[#f44032] tw-to-[#ff6b5e] tw-px-6 tw-py-3 tw-text-sm tw-font-semibold tw-text-white hover:tw-shadow-lg hover:tw-scale-105 tw-transition-all tw-leading-none"
                        >
                            <Icon icon="mdi:plus-circle" className="tw-text-lg" />
                            Submit Another Request
                        </Link>
                    </div>
                </main>
            </div>
            
            <Footer />
        </>
    );
}
