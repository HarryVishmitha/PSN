import { Head, Link } from '@inertiajs/react';
import { useEffect, useMemo } from 'react';
import Header from '@/Components/Header';
import Footer from '@/Components/Footer';
import Breadcrumb from '@/Components/BreadcrumbHome';
import CookieConsent from '@/Components/CookieConsent';
import Meta from '@/Components/Metaheads';
import { Icon } from '@iconify/react';
import AOS from 'aos';
import 'aos/dist/aos.css';

const currency = (n, code = 'LKR') =>
    new Intl.NumberFormat('en-LK', {
        style: 'currency',
        currency: code,
    }).format(n ?? 0);

const Badge = ({ children, tone = 'success' }) => {
    const map = {
        success:
            'tw-bg-green-100 tw-text-green-700 tw-border tw-border-green-300',
        warning:
            'tw-bg-yellow-100 tw-text-yellow-800 tw-border tw-border-yellow-300',
        info: 'tw-bg-blue-100 tw-text-blue-700 tw-border tw-border-blue-300',
        danger: 'tw-bg-red-100 tw-text-red-700 tw-border tw-border-red-300',
        neutral: 'tw-bg-gray-100 tw-text-gray-700 tw-border tw-border-gray-300',
    };
    return (
        <span
            className={`tw-inline-flex tw-items-center tw-rounded tw-px-2 tw-py-0.5 tw-text-xs ${map[tone]}`}
        >
            {children}
        </span>
    );
};

export default function OrderThankYou({ order, links }) {
    const title = `Thank you! Order ${order?.number ?? ''}`;

    console.log(order);

    const tone = useMemo(() => {
        if (!order?.status && !order?.payment_status) return 'neutral';
        if (order?.payment_status === 'paid') return 'success';
        if (order?.status === 'processing') return 'info';
        if (order?.status === 'cancelled') return 'danger';
        return 'warning';
    }, [order]);

    // Initialize AOS animations
    useEffect(() => {
        AOS.init({ duration: 700, once: true });
    }, []);

    // Optional: basic purchase event (adjust for your analytics)
    useEffect(() => {
        if (window?.dataLayer && order) {
            window.dataLayer.push({
                event: 'purchase',
                order_id: order.number,
                value: order.total,
                currency: order.currency || 'LKR',
            });
        }
    }, [order]);

    return (
        <>
            <Head title={title}>
                {/* JSON-LD Order structured data */}
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{
                        __html: JSON.stringify({
                            '@context': 'https://schema.org',
                            '@type': 'Order',
                            orderNumber: order?.number,
                            orderStatus: order?.status
                                ? `https://schema.org/${String(order.status).toLowerCase()}`
                                : undefined,
                            priceCurrency: order?.currency || 'LKR',
                            price: order?.total,
                            merchant: {
                                '@type': 'Organization',
                                name: 'Printair Advertising',
                            },
                            acceptedOffer: (order?.items || []).map((i) => ({
                                '@type': 'Offer',
                                itemOffered: {
                                    '@type': 'Product',
                                    name: i.name,
                                    sku: i.sku,
                                },
                                price: i.unit_price,
                                priceCurrency: order?.currency || 'LKR',
                                eligibleQuantity: {
                                    '@type': 'QuantitativeValue',
                                    value: i.qty,
                                },
                            })),
                        }),
                    }}
                />
            </Head>
            
            <Meta
                title={`Thank you! Order ${order?.number ?? ''} - Printair`}
                description="Your order has been successfully placed. We'll notify you by email when your order is on the way."
            />

            <Header />

            <div className="tw-container tw-mx-auto tw-px-5 tw-pt-4">
                <Breadcrumb />

                <main className="tw-mb-10 tw-pb-10">
                    <div className="tw-mx-auto tw-max-w-6xl">
                        {/* Page title */}
                        <div className="tw-mb-6 tw-px-1" data-aos="fade-down">
                            <h5 className="tw-text-2xl tw-font-bold tw-text-[#f44032]">
                                Order Confirmation
                            </h5>
                            <p className="tw-mt-1 tw-text-sm tw-text-gray-600">
                                Thank you for your order! Here's your order summary.
                            </p>
                        </div>

                        {/* Main Card */}
                        <div 
                            className="tw-overflow-hidden tw-rounded-2xl tw-border tw-border-gray-200 tw-bg-white tw-shadow-lg"
                            data-aos="fade-up"
                        >
                            {/* Success Header */}
                            <div className="tw-border-b tw-border-gray-100 tw-bg-gradient-to-br tw-from-green-50 tw-to-emerald-50 tw-px-6 tw-pb-8 tw-pt-10 tw-text-center">
                                {/* Success icon */}
                                <div className="tw-mx-auto tw-mb-4 tw-flex tw-h-16 tw-w-16 tw-items-center tw-justify-center tw-rounded-full tw-bg-green-100 tw-shadow-md">
                                    <Icon 
                                        icon="mdi:check-circle" 
                                        className="tw-h-10 tw-w-10 tw-text-green-600"
                                    />
                                </div>
                                <h2 className="tw-font-bold tw-text-gray-900 tw-text-2xl tw-leading-tight md:tw-text-3xl md:tw-leading-tight">
                                    Thank you for your order,{' '}
                                    {order?.email
                                        ? order.email.split('@')[0]
                                        : 'Customer'}
                                    !
                                </h2>
                                <p className="tw-mt-3 tw-text-base tw-text-gray-600">
                                    We've sent a confirmation to{' '}
                                    <span className="tw-font-semibold tw-text-gray-900">
                                        {order?.email ?? 'your email'}
                                    </span>
                                    .
                                </p>
                                <div className="tw-mt-5 tw-flex tw-flex-wrap tw-justify-center tw-gap-2">
                                    <Badge tone={tone}>
                                        {order?.payment_status
                                            ? `Payment: ${String(order.payment_status).replace('_', ' ')}`
                                            : 'Order Received'}
                                    </Badge>
                                    {order?.status && (
                                        <Badge tone="info">
                                            {String(order.status).replace('_', ' ')}
                                        </Badge>
                                    )}
                                    {order?.shipping_method && (
                                        <Badge tone="neutral">
                                            {order.shipping_method}
                                        </Badge>
                                    )}
                                    {order?.eta && (
                                        <Badge tone="neutral">
                                            ETA: {order.eta}
                                        </Badge>
                                    )}
                                </div>
                                <div className="tw-mt-4 tw-inline-flex tw-items-center tw-gap-2 tw-rounded-full tw-bg-white tw-px-4 tw-py-2 tw-shadow-sm">
                                    <Icon icon="mdi:receipt-text" className="tw-text-gray-600" />
                                    <span className="tw-text-sm tw-text-gray-600">Order No:</span>
                                    <span className="tw-font-mono tw-text-sm tw-font-semibold tw-text-gray-900">
                                        {order?.number}
                                    </span>
                                </div>
                            </div>

                            {/* Body grid */}
                            <div className="tw-grid tw-gap-6 tw-p-6 lg:tw-grid-cols-3">
                                {/* Left: Items */}
                                <section className="lg:tw-col-span-2" data-aos="fade-up" data-aos-delay="100">
                                    <div className="tw-mb-4 tw-flex tw-items-center tw-gap-2">
                                        <Icon icon="mdi:package-variant" className="tw-text-xl tw-text-[#f44032]" />
                                        <h4 className="tw-font-semibold tw-text-gray-900">
                                            Order Items
                                        </h4>
                                    </div>
                                    <ul className="tw-divide-y tw-divide-gray-100 tw-rounded-xl tw-border tw-border-gray-200 tw-bg-white tw-shadow-sm">
                                        {(order?.items ?? []).map((item) => (
                                            <li
                                                key={item.id}
                                                className="tw-flex tw-items-center tw-gap-4 tw-p-4 tw-transition hover:tw-bg-gray-50"
                                            >
                                                <div className="tw-h-16 tw-w-16 tw-shrink-0 tw-overflow-hidden tw-rounded-lg tw-border tw-border-gray-200 tw-bg-gray-100 tw-shadow-sm">
                                                    {item.image_url ? (
                                                        <img
                                                            src={item.image_url}
                                                            alt={item.name}
                                                            className="tw-h-full tw-w-full tw-object-cover"
                                                        />
                                                    ) : (
                                                        <div className="tw-flex tw-h-full tw-w-full tw-items-center tw-justify-center">
                                                            <Icon icon="mdi:image-off" className="tw-text-2xl tw-text-gray-400" />
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="tw-flex-1">
                                                    <div className="tw-font-semibold tw-text-gray-900">
                                                        {item.name}
                                                    </div>
                                                    <div className="tw-mt-1 tw-flex tw-flex-wrap tw-items-center tw-gap-2 tw-text-sm tw-text-gray-500">
                                                        {item.variant && (
                                                            <span className="tw-flex tw-items-center tw-gap-1">
                                                                <Icon icon="mdi:palette" className="tw-text-gray-400" />
                                                                {item.variant}
                                                            </span>
                                                        )}
                                                        {item.sku && (
                                                            <span className="tw-flex tw-items-center tw-gap-1">
                                                                <Icon icon="mdi:barcode" className="tw-text-gray-400" />
                                                                SKU: {item.sku}
                                                            </span>
                                                        )}
                                                        <span className="tw-flex tw-items-center tw-gap-1">
                                                            <Icon icon="mdi:counter" className="tw-text-gray-400" />
                                                            Qty: {item.qty}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="tw-text-right">
                                                    <div className="tw-text-xs tw-text-gray-500">
                                                        {currency(
                                                            item.unit_price,
                                                            order?.currency,
                                                        )}{' '}
                                                        each
                                                    </div>
                                                    <div className="tw-text-base tw-font-bold tw-text-gray-900">
                                                        {currency(
                                                            item.line_total,
                                                            order?.currency,
                                                        )}
                                                    </div>
                                                </div>
                                            </li>
                                        ))}
                                        {(!order?.items ||
                                            order.items.length === 0) && (
                                            <li className="tw-flex tw-flex-col tw-items-center tw-justify-center tw-gap-2 tw-p-8 tw-text-gray-500">
                                                <Icon icon="mdi:package-variant-closed" className="tw-text-4xl tw-text-gray-300" />
                                                <p>No items to display.</p>
                                            </li>
                                        )}
                                    </ul>
                                </section>

                                {/* Right: Summary + addresses */}
                                <aside className="lg:tw-col-span-1" data-aos="fade-up" data-aos-delay="200">
                                    <div className="tw-sticky tw-top-4 tw-space-y-4">
                                        {/* Order Summary Card */}
                                        <div className="tw-rounded-xl tw-border tw-border-gray-200 tw-bg-gradient-to-br tw-from-gray-50 tw-to-white tw-p-5 tw-shadow-sm">
                                            <div className="tw-mb-4 tw-flex tw-items-center tw-gap-2">
                                                <Icon icon="mdi:calculator" className="tw-text-xl tw-text-[#f44032]" />
                                                <h4 className="tw-text-base tw-font-semibold tw-text-gray-900">
                                                    Order Summary
                                                </h4>
                                            </div>
                                            <dl className="tw-space-y-3">
                                                <div className="tw-flex tw-justify-between tw-text-sm">
                                                    <dt className="tw-text-gray-600">
                                                        Subtotal
                                                    </dt>
                                                    <dd className="tw-font-medium tw-text-gray-900">
                                                        {currency(
                                                            order?.subtotal,
                                                            order?.currency,
                                                        )}
                                                    </dd>
                                                </div>
                                                <div className="tw-flex tw-justify-between tw-text-sm">
                                                    <dt className="tw-text-gray-600">
                                                        Discount
                                                    </dt>
                                                    <dd className="tw-font-medium tw-text-emerald-600">
                                                        -{' '}
                                                        {currency(
                                                            order?.discount,
                                                            order?.currency,
                                                        )}
                                                    </dd>
                                                </div>
                                                <div className="tw-flex tw-justify-between tw-text-sm">
                                                    <dt className="tw-text-gray-600">
                                                        Shipping
                                                    </dt>
                                                    <dd className="tw-font-medium tw-text-gray-900">
                                                        {currency(
                                                            order?.shipping,
                                                            order?.currency,
                                                        )}
                                                    </dd>
                                                </div>
                                                <div className="tw-flex tw-justify-between tw-text-sm">
                                                    <dt className="tw-text-gray-600">
                                                        Tax
                                                    </dt>
                                                    <dd className="tw-font-medium tw-text-gray-900">
                                                        {currency(
                                                            order?.tax,
                                                            order?.currency,
                                                        )}
                                                    </dd>
                                                </div>
                                                <div className="tw-my-2 tw-h-px tw-bg-gray-200" />
                                                <div className="tw-flex tw-justify-between tw-text-base">
                                                    <dt className="tw-font-semibold tw-text-gray-900">
                                                        Total
                                                    </dt>
                                                    <dd className="tw-text-lg tw-font-bold tw-text-[#f44032]">
                                                        {currency(
                                                            order?.total,
                                                            order?.currency,
                                                        )}
                                                    </dd>
                                                </div>
                                            </dl>
                                        </div>

                                        {/* Shipping Address Card */}
                                        <div className="tw-rounded-xl tw-border tw-border-gray-200 tw-bg-white tw-p-5 tw-shadow-sm">
                                            <div className="tw-mb-3 tw-flex tw-items-center tw-gap-2">
                                                <Icon icon="mdi:map-marker" className="tw-text-xl tw-text-[#f44032]" />
                                                <h4 className="tw-font-semibold tw-text-gray-900">
                                                    Shipping Address
                                                </h4>
                                            </div>
                                            {order?.shipping_address ? (
                                                <address className="tw-text-sm tw-not-italic tw-leading-relaxed tw-text-gray-600">
                                                    <div className="tw-font-medium tw-text-gray-900">{order.shipping_address.name}</div>
                                                    <div className="tw-mt-1">{order.shipping_address.line1}</div>
                                                    {order.shipping_address.line2 && (
                                                        <div>{order.shipping_address.line2}</div>
                                                    )}
                                                    <div>
                                                        {order.shipping_address.city}
                                                        {order.shipping_address.state
                                                            ? `, ${order.shipping_address.state}`
                                                            : ''}{' '}
                                                        {order.shipping_address.zip}
                                                    </div>
                                                    <div>{order.shipping_address.country}</div>
                                                    {order.shipping_address.phone && (
                                                        <div className="tw-mt-2 tw-flex tw-items-center tw-gap-1 tw-text-gray-700">
                                                            <Icon icon="mdi:phone" className="tw-text-base" />
                                                            {order.shipping_address.phone}
                                                        </div>
                                                    )}
                                                </address>
                                            ) : (
                                                <p className="tw-text-sm tw-text-gray-500">
                                                    Not provided.
                                                </p>
                                            )}
                                        </div>

                                        {/* Action Buttons */}
                                        <div className="tw-space-y-2">
                                            {links?.download_invoice && (
                                                <Link
                                                    href={links.download_invoice}
                                                    className="tw-flex tw-w-full tw-items-center tw-justify-center tw-gap-2 tw-rounded-lg tw-border tw-border-gray-300 tw-bg-white tw-py-2.5 tw-text-sm tw-font-medium tw-text-gray-700 tw-transition hover:tw-bg-gray-50"
                                                >
                                                    <Icon icon="mdi:file-pdf-box" />
                                                    Download Invoice (PDF)
                                                </Link>
                                            )}
                                            {links?.view_order && (
                                                <Link
                                                    href={links.view_order}
                                                    className="tw-flex tw-w-full tw-items-center tw-justify-center tw-gap-2 tw-rounded-lg tw-bg-[#f44032] tw-py-2.5 tw-text-sm tw-font-medium tw-text-white tw-transition hover:tw-bg-[#d63527]"
                                                >
                                                    <Icon icon="mdi:eye" />
                                                    View Order
                                                </Link>
                                            )}
                                            {links?.track_order && (
                                                <Link
                                                    href={links.track_order}
                                                    className="tw-flex tw-w-full tw-items-center tw-justify-center tw-gap-2 tw-rounded-lg tw-border tw-border-gray-300 tw-bg-white tw-py-2.5 tw-text-sm tw-font-medium tw-text-gray-700 tw-transition hover:tw-bg-gray-50"
                                                >
                                                    <Icon icon="mdi:truck-delivery" />
                                                    Track Order
                                                </Link>
                                            )}
                                            {links?.continue_shopping && (
                                                <Link
                                                    href={links.continue_shopping}
                                                    className="tw-flex tw-w-full tw-items-center tw-justify-center tw-gap-2 tw-rounded-lg tw-border tw-border-gray-300 tw-bg-white tw-py-2.5 tw-text-sm tw-font-medium tw-text-gray-700 tw-transition hover:tw-bg-gray-50"
                                                >
                                                    <Icon icon="mdi:shopping" />
                                                    Continue Shopping
                                                </Link>
                                            )}
                                        </div>

                                        {/* Help Link */}
                                        <div className="tw-rounded-lg tw-border tw-border-blue-200 tw-bg-blue-50 tw-p-3">
                                            <div className="tw-flex tw-items-start tw-gap-2">
                                                <Icon icon="mdi:help-circle" className="tw-mt-0.5 tw-text-lg tw-text-blue-600" />
                                                <div className="tw-text-xs tw-text-blue-800">
                                                    Need help?{' '}
                                                    <Link
                                                        href={links?.contact ?? '/contact'}
                                                        className="tw-font-semibold tw-underline hover:tw-text-blue-900"
                                                    >
                                                        Contact support
                                                    </Link>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </aside>
                            </div>

                            {/* Footer note */}
                            <div className="tw-border-t tw-border-gray-100 tw-bg-gray-50 tw-px-6 tw-py-6">
                                <div className="tw-flex tw-flex-col tw-justify-between tw-gap-4 tw-text-sm tw-text-gray-600 md:tw-flex-row md:tw-items-center">
                                    <div className="tw-flex tw-items-start tw-gap-2">
                                        <Icon icon="mdi:information" className="tw-mt-0.5 tw-text-blue-500" />
                                        <p>
                                            We'll notify you by email when your order is
                                            on the way.
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => window.print()}
                                        className="tw-inline-flex tw-items-center tw-gap-2 tw-self-start tw-rounded-lg tw-border tw-border-gray-300 tw-bg-white tw-px-4 tw-py-2 tw-transition hover:tw-bg-gray-100 md:tw-self-auto"
                                    >
                                        <Icon icon="mdi:printer" />
                                        Print this page
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* CTA */}
                        {links?.continue_shopping && (
                            <div className="tw-mt-8 tw-text-center" data-aos="fade-up" data-aos-delay="300">
                                <Link
                                    href={links.continue_shopping}
                                    className="tw-inline-flex tw-items-center tw-gap-2 tw-rounded-xl tw-bg-[#f44032] tw-px-8 tw-py-3 tw-font-semibold tw-text-white tw-shadow-lg tw-transition hover:tw-bg-[#d63527] hover:tw-shadow-xl"
                                >
                                    <Icon icon="mdi:shopping" className="tw-text-xl" />
                                    Continue Shopping
                                </Link>
                            </div>
                        )}
                    </div>
                </main>
            </div>

            <CookieConsent />
            <Footer />
        </>
    );
}
