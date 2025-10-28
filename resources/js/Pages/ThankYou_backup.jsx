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

            <main className="tw-min-h-[70vh] tw-bg-gray-50 tw-px-4 tw-py-10">
                <div className="tw-mx-auto tw-max-w-5xl">
                    {/* Card */}
                    <div className="tw-overflow-hidden tw-rounded-2xl tw-bg-white tw-shadow-lg">
                        <div className="tw-border-b tw-border-gray-100 tw-px-6 tw-pb-6 tw-pt-8 tw-text-center">
                            {/* Success icon */}
                            <div className="tw-mx-auto tw-mb-4 tw-flex tw-h-14 tw-w-14 tw-items-center tw-justify-center tw-rounded-full tw-bg-green-100">
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="tw-h-8 tw-w-8"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeWidth="2"
                                        d="M22 11.08V12a10 10 0 11-5.93-9.14"
                                    />
                                    <path
                                        strokeWidth="2"
                                        d="M22 4L12 14.01l-3-3"
                                    />
                                </svg>
                            </div>
                            <h1 className="tw-text-2xl tw-font-semibold tw-text-gray-900">
                                Thank you for your order,{' '}
                                {order?.email
                                    ? order.email.split('@')[0]
                                    : 'Customer'}
                                !
                            </h1>
                            <p className="tw-mt-2 tw-text-gray-600">
                                We’ve sent a confirmation to{' '}
                                <span className="tw-font-medium">
                                    {order?.email ?? 'your email'}
                                </span>
                                .
                            </p>
                            <div className="tw-mt-3 tw-flex tw-flex-wrap tw-justify-center tw-gap-2">
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
                            <div className="tw-mt-3 tw-text-sm tw-text-gray-500">
                                Order No:{' '}
                                <span className="tw-font-mono tw-text-gray-700">
                                    {order?.number}
                                </span>
                            </div>
                        </div>

                        {/* Body grid */}
                        <div className="tw-grid tw-gap-6 tw-p-6 md:tw-grid-cols-3">
                            {/* Left: Items */}
                            <section className="md:tw-col-span-2">
                                <h2 className="tw-text-lg tw-font-semibold tw-text-gray-900">
                                    Items
                                </h2>
                                <ul className="tw-mt-3 tw-divide-y tw-divide-gray-100 tw-rounded-xl tw-border tw-border-gray-100 tw-bg-white">
                                    {(order?.items ?? []).map((item) => (
                                        <li
                                            key={item.id}
                                            className="tw-flex tw-items-center tw-gap-4 tw-p-4"
                                        >
                                            <div className="tw-h-14 tw-w-14 tw-shrink-0 tw-overflow-hidden tw-rounded-lg tw-bg-gray-100">
                                                {item.image_url ? (
                                                    <img
                                                        src={item.image_url}
                                                        alt={item.name}
                                                        className="tw-h-full tw-w-full tw-object-cover"
                                                    />
                                                ) : null}
                                            </div>
                                            <div className="tw-flex-1">
                                                <div className="tw-font-medium tw-text-gray-900">
                                                    {item.name}
                                                </div>
                                                <div className="tw-text-sm tw-text-gray-500">
                                                    {item.variant ? (
                                                        <span>
                                                            {item.variant}{' '}
                                                            ·{' '}
                                                        </span>
                                                    ) : null}
                                                    {item.sku ? (
                                                        <span>
                                                            SKU: {item.sku}{' '}
                                                            ·{' '}
                                                        </span>
                                                    ) : null}
                                                    Qty: {item.qty}
                                                </div>
                                            </div>
                                            <div className="tw-text-right">
                                                <div className="tw-text-sm tw-text-gray-500">
                                                    {currency(
                                                        item.unit_price,
                                                        order?.currency,
                                                    )}
                                                </div>
                                                <div className="tw-font-semibold">
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
                                        <li className="tw-p-6 tw-text-gray-500">
                                            No items to display.
                                        </li>
                                    )}
                                </ul>
                            </section>

                            {/* Right: Summary + addresses */}
                            <aside className="md:tw-col-span-1">
                                <div className="tw-rounded-xl tw-border tw-border-gray-200 tw-bg-gray-50 tw-p-4">
                                    <h3 className="tw-text-base tw-font-semibold tw-text-gray-900">
                                        Order Summary
                                    </h3>
                                    <dl className="tw-mt-3 tw-space-y-2">
                                        <div className="tw-flex tw-justify-between tw-text-sm">
                                            <dt className="tw-text-gray-600">
                                                Subtotal
                                            </dt>
                                            <dd className="tw-text-gray-900">
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
                                            <dd className="tw-text-gray-900">
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
                                            <dd className="tw-text-gray-900">
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
                                            <dd className="tw-text-gray-900">
                                                {currency(
                                                    order?.tax,
                                                    order?.currency,
                                                )}
                                            </dd>
                                        </div>
                                        <div className="tw-my-2 tw-h-px tw-bg-gray-200" />
                                        <div className="tw-flex tw-justify-between tw-text-base tw-font-semibold">
                                            <dt className="tw-text-gray-900">
                                                Total
                                            </dt>
                                            <dd className="tw-text-gray-900">
                                                {currency(
                                                    order?.total,
                                                    order?.currency,
                                                )}
                                            </dd>
                                        </div>
                                    </dl>

                                    <div className="tw-mt-5">
                                        <h4 className="tw-text-sm tw-font-semibold tw-text-gray-900">
                                            Shipping Address
                                        </h4>
                                        {order?.shipping_address ? (
                                            <address className="tw-mt-1 tw-text-sm tw-not-italic tw-text-gray-600">
                                                {order.shipping_address.name}
                                                <br />
                                                {order.shipping_address.line1}
                                                {order.shipping_address.line2
                                                    ? `, ${order.shipping_address.line2}`
                                                    : ''}
                                                <br />
                                                {order.shipping_address.city}
                                                {order.shipping_address.state
                                                    ? `, ${order.shipping_address.state}`
                                                    : ''}{' '}
                                                {order.shipping_address.zip}
                                                <br />
                                                {order.shipping_address.country}
                                                <br />
                                                {order.shipping_address
                                                    .phone && (
                                                    <span>
                                                        ☎{' '}
                                                        {
                                                            order
                                                                .shipping_address
                                                                .phone
                                                        }
                                                    </span>
                                                )}
                                            </address>
                                        ) : (
                                            <p className="tw-mt-1 tw-text-sm tw-text-gray-500">
                                                Not provided.
                                            </p>
                                        )}
                                    </div>

                                    <div className="tw-mt-5 tw-grid tw-gap-2">
                                        {links?.download_invoice && (
                                            <Link
                                                href={links.download_invoice}
                                                className="tw-w-full tw-rounded-lg tw-border tw-border-gray-300 tw-py-2 tw-text-center tw-font-medium hover:tw-bg-gray-100"
                                            >
                                                Download Invoice (PDF)
                                            </Link>
                                        )}
                                        {links?.view_order && (
                                            <Link
                                                href={links.view_order}
                                                className="tw-w-full tw-rounded-lg tw-bg-gray-900 tw-py-2 tw-text-center tw-font-medium tw-text-white hover:tw-opacity-90"
                                            >
                                                View Order
                                            </Link>
                                        )}
                                        {links?.track_order && (
                                            <Link
                                                href={links.track_order}
                                                className="tw-w-full tw-rounded-lg tw-border tw-border-gray-300 tw-py-2 tw-text-center tw-font-medium hover:tw-bg-gray-100"
                                            >
                                                Track Order
                                            </Link>
                                        )}
                                        {links?.continue_shopping && (
                                            <Link
                                                href={links.continue_shopping}
                                                className="tw-w-full tw-rounded-lg tw-border tw-border-gray-300 tw-bg-white tw-py-2 tw-text-center tw-font-medium hover:tw-bg-gray-100"
                                            >
                                                Continue Shopping
                                            </Link>
                                        )}
                                    </div>

                                    <div className="tw-mt-4 tw-text-xs tw-text-gray-500">
                                        Need help?{' '}
                                        <Link
                                            href={links?.contact ?? '#'}
                                            className="tw-underline"
                                        >
                                            Contact support
                                        </Link>
                                    </div>
                                </div>
                            </aside>
                        </div>

                        {/* Footer note */}
                        <div className="tw-px-6 tw-pb-8">
                            <div className="tw-flex tw-flex-col tw-justify-between tw-gap-3 tw-text-sm tw-text-gray-600 md:tw-flex-row">
                                <p>
                                    We’ll notify you by email when your order is
                                    on the way.
                                </p>
                                <button
                                    onClick={() => window.print()}
                                    className="tw-inline-flex tw-items-center tw-gap-2 tw-self-start tw-rounded-lg tw-border tw-border-gray-300 tw-px-3 tw-py-1.5 hover:tw-bg-gray-100 md:tw-self-auto"
                                >
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        className="tw-h-4 tw-w-4"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                    >
                                        <path
                                            strokeWidth="2"
                                            d="M6 9V2h12v7M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"
                                        />
                                        <path
                                            strokeWidth="2"
                                            d="M6 14h12v8H6z"
                                        />
                                    </svg>
                                    Print this page
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* CTA */}
                    {links?.continue_shopping && (
                        <div className="tw-mt-8 tw-text-center">
                            <Link
                                href={links.continue_shopping}
                                className="tw-inline-flex tw-items-center tw-gap-2 tw-rounded-xl tw-bg-red-600 tw-px-6 tw-py-3 tw-font-medium tw-text-white hover:tw-bg-red-700"
                            >
                                Continue Shopping
                            </Link>
                        </div>
                    )}
                </div>
            </main>
        </>
    );
}
