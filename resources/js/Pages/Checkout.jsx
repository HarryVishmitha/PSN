// resources/js/Pages/Checkout.jsx
import { Head, Link, useForm } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';

// Layout (same vibe as cart.jsx)
import Breadcrumb from '@/Components/BreadcrumbHome';
import CookieConsent from '@/Components/CookieConsent';
import Footer from '@/Components/Footer';
import Header from '@/Components/Header';
import Meta from '@/Components/Metaheads';

// UI
import {
    Card,
    Checkbox,
    Field,
    Input,
    SectionTitle,
    Select,
    Textarea,
} from '@/Components/FormControls';
import { Icon } from '@iconify/react';
import AOS from 'aos';
import 'aos/dist/aos.css';

/* ======================================================================
   Small helpers (kept consistent with cart.jsx)
========================================================================*/
const toNumber = (v) => (Number.isFinite(Number(v)) ? Number(v) : 0);
const money = (n) =>
    toNumber(n).toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });

const splitName = (full = '') => {
    const parts = String(full || '')
        .trim()
        .split(/\s+/);
    if (!parts.length) return { first: '', last: '' };
    if (parts.length === 1) return { first: parts[0], last: '' };
    return {
        first: parts.slice(0, -1).join(' '),
        last: parts.slice(-1).join(' '),
    };
};

const SL_PHONE_HINT = 'Use 0XXXXXXXXX or +94XXXXXXXXX';

/* ======================================================================
   Toasts (same component style as cart)
========================================================================*/
function Toasts({ toasts, dismiss }) {
    return (
        <div className="tw-fixed tw-bottom-4 tw-right-4 tw-z-50 tw-flex tw-flex-col tw-gap-2">
            {toasts.map((t) => (
                <div
                    key={t.id}
                    className={`tw-flex tw-min-w-[260px] tw-max-w-[340px] tw-items-start tw-gap-2 tw-rounded-xl tw-p-3 tw-text-sm tw-shadow-lg ${
                        t.type === 'error'
                            ? 'tw-border tw-border-rose-200 tw-bg-rose-50 tw-text-rose-900'
                            : 'tw-border tw-border-emerald-200 tw-bg-emerald-50 tw-text-emerald-900'
                    }`}
                >
                    <Icon
                        icon={
                            t.type === 'error'
                                ? 'mdi:alert-circle'
                                : 'mdi:check-circle'
                        }
                        className="tw-text-xl"
                    />
                    <div className="tw-flex-1">
                        <div className="tw-font-semibold">{t.title}</div>
                        {t.message && (
                            <div className="tw-mt-0.5">{t.message}</div>
                        )}
                    </div>
                    <button
                        className="tw-opacity-70 hover:tw-opacity-100"
                        onClick={() => dismiss(t.id)}
                    >
                        <Icon icon="mdi:close" className="tw-text-lg" />
                    </button>
                </div>
            ))}
        </div>
    );
}

/* ======================================================================
   Page
========================================================================*/
export default function Checkout(props) {
    console.log('Checkout props:', props);
    const {
        cart = {},
        user = null,
        shippingMethods = [],
        isAuthenticated = false,
        requiresGuestDetails = false,
        guestRequiredFields = [],
        previousAddresses = { billing: [], shipping: [] },
        suggestedBillingAddress = null,
        suggestedShippingAddress = null,
        previousPhones = [],
        suggestedPhone = null,
        previousWhatsApp = [],
        suggestedWhatsApp = null,
    } = props;

    const items = cart.items ?? [];
    const totals = cart.totals ?? {};
    const addresses = cart.addresses ?? {};
    const billing = addresses.billing ?? {};

    const { first: firstName, last: lastName } = splitName(user?.name);

    // UI toggles
    const [useCompany, setUseCompany] = useState(false);
    const [sameShip, setSameShip] = useState(true);
    const [showBillingAddressList, setShowBillingAddressList] = useState(false);
    const [showShippingAddressList, setShowShippingAddressList] = useState(false);
    const [showPhoneList, setShowPhoneList] = useState(false);
    const [showWhatsAppList, setShowWhatsAppList] = useState(false);

    // local toasts
    const [toasts, setToasts] = useState([]);
    const pushToast = (t) => {
        const id = crypto?.randomUUID?.() || String(Math.random());
        setToasts((prev) => [...prev, { id, ...t }]);
        setTimeout(
            () => setToasts((prev) => prev.filter((x) => x.id !== id)),
            4500,
        );
    };
    const dismissToast = (id) =>
        setToasts((prev) => prev.filter((x) => x.id !== id));

    useEffect(() => {
        AOS.init({ duration: 700, once: true });
    }, []);

    const { data, setData, errors, processing, transform, post } = useForm({
        // Contact
        first_name: firstName || '',
        last_name: lastName || '',
        email: user?.email || '',
        phone_primary: suggestedPhone || user?.phone || '',
        phone_alt_1: '',
        phone_alt_2: '',
        whatsapp: suggestedWhatsApp || '',

        // Company
        is_company: false,
        company_name: '',

        // Billing - Use suggested address if available
        billing_address_line1: suggestedBillingAddress?.line1 || billing.line1 || '',
        billing_address_line2: suggestedBillingAddress?.line2 || billing.line2 || '',
        billing_city: suggestedBillingAddress?.city || billing.city || '',
        billing_province: suggestedBillingAddress?.region || billing.province || '',
        billing_postal: suggestedBillingAddress?.postal_code || billing.postal || '',
        billing_country: 'LK',

        // Shipping - Use suggested address if available
        shipping_same_as_billing: true,
        shipping_address_line1: suggestedShippingAddress?.line1 || '',
        shipping_address_line2: suggestedShippingAddress?.line2 || '',
        shipping_city: suggestedShippingAddress?.city || '',
        shipping_province: suggestedShippingAddress?.region || '',
        shipping_postal: suggestedShippingAddress?.postal_code || '',
        shipping_country: 'LK',

        // Shipping method (gracefully handle empty)
        shipping_method_id:
            cart.selected_shipping_method_id ?? shippingMethods[0]?.id ?? '',

        // Misc
        notes: '',
        accept_policy: false,
    });

    // Helper function to apply address
    const applyBillingAddress = (address) => {
        setData({
            ...data,
            billing_address_line1: address.line1 || '',
            billing_address_line2: address.line2 || '',
            billing_city: address.city || '',
            billing_province: address.region || '',
            billing_postal: address.postal_code || '',
        });
        setShowBillingAddressList(false);
    };

    const applyShippingAddress = (address) => {
        setData({
            ...data,
            shipping_address_line1: address.line1 || '',
            shipping_address_line2: address.line2 || '',
            shipping_city: address.city || '',
            shipping_province: address.region || '',
            shipping_postal: address.postal_code || '',
        });
        setShowShippingAddressList(false);
    };

    const applyPhone = (phone) => {
        setData('phone_primary', phone);
        setShowPhoneList(false);
    };

    const applyWhatsApp = (whatsapp) => {
        setData('whatsapp', whatsapp);
        setShowWhatsAppList(false);
    };

    // mirror toggles into form
    useEffect(() => {
        setData('is_company', useCompany);
    }, [useCompany]);

    useEffect(() => {
        setData('shipping_same_as_billing', sameShip);
        if (sameShip) {
            setData('shipping_address_line1', data.billing_address_line1);
            setData('shipping_address_line2', data.billing_address_line2);
            setData('shipping_city', data.billing_city);
            setData('shipping_province', data.billing_province);
            setData('shipping_postal', data.billing_postal);
            setData('shipping_country', data.billing_country);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [sameShip]);

    // keep shipping in sync when "same as" is on
    useEffect(() => {
        if (!sameShip) return;
        setData((prev) => ({
            ...prev,
            shipping_address_line1: prev.billing_address_line1,
            shipping_address_line2: prev.billing_address_line2,
            shipping_city: prev.billing_city,
            shipping_province: prev.billing_province,
            shipping_postal: prev.billing_postal,
            shipping_country: prev.billing_country,
        }));
    }, [
        data.billing_address_line1,
        data.billing_address_line2,
        data.billing_city,
        data.billing_province,
        data.billing_postal,
        data.billing_country,
        sameShip,
        setData,
    ]);

    // Summary totals
    const computedItemTotal = useMemo(() => {
        return (items || []).reduce((sum, item) => {
            const q = toNumber(item.quantity ?? 1);
            const fallback = toNumber(item.unit_price ?? item.price) * q;
            return sum + (toNumber(item.total_price) || fallback);
        }, 0);
    }, [items]);

    const subtotal = toNumber(totals.subtotal) || computedItemTotal;
    const discount = toNumber(totals.discount);
    const shippingTotal = toNumber(totals.shipping);
    const tax = toNumber(totals.tax);
    const grandTotal =
        toNumber(totals.grand) || subtotal - discount + shippingTotal + tax;

    // Client-side soft validation to guide UX; backend will re-validate strictly
    const clientErrors = useMemo(() => {
        const e = {};
        const phoneRe = /^(?:\+94|0)\d{9}$/;
        const req = (v) => String(v || '').trim().length > 0;

        if (!req(data.first_name)) e.first_name = 'First name is required';
        if (!req(data.last_name)) e.last_name = 'Last name is required';
        if (!req(data.email)) e.email = 'Email is required';
        if (!req(data.phone_primary)) e.phone_primary = 'Phone is required';
        if (data.phone_primary && !phoneRe.test(data.phone_primary))
            e.phone_primary = 'Invalid Sri Lankan phone format';
        if (!req(data.whatsapp)) e.whatsapp = 'WhatsApp number is required';
        if (data.whatsapp && !phoneRe.test(data.whatsapp))
            e.whatsapp = 'Invalid Sri Lankan phone format';

        if (!req(data.billing_address_line1))
            e.billing_address_line1 = 'Billing address is required';
        if (!req(data.billing_city))
            e.billing_city = 'Billing city is required';

        if (!data.shipping_same_as_billing) {
            if (!req(data.shipping_address_line1))
                e.shipping_address_line1 = 'Shipping address is required';
            if (!req(data.shipping_city))
                e.shipping_city = 'Shipping city is required';
        }

        if (!data.accept_policy)
            e.accept_policy = 'You must accept the order policy';
        return e;
    }, [data]);

    const hasClientErrors = Object.keys(clientErrors).length > 0;

    // Normalize payload if/when posting
    transform((payload) => ({
        ...payload,
        shipping_method_id: payload.shipping_method_id || null,
        is_company: !!payload.is_company,
        shipping_same_as_billing: !!payload.shipping_same_as_billing,
        accept_policy: !!payload.accept_policy,
    }));

    const handleSubmit = (e) => {
        e.preventDefault();
        if (hasClientErrors) {
            pushToast({
                type: 'error',
                title: 'Please review the highlighted fields',
            });
            return;
        }

        // 👉 Flip this ON once your backend review route is ready:
        post(route('checkout.review'), data, { preserveScroll: true });

        // For now, show a toast and keep UX smooth
        pushToast({
            type: 'ok',
            title: 'Looks good!',
            message: 'System is reviewing your order, wait a sec.',
        });
    };

    const showMobileBar = items.length > 0;

    return (
        <>
            <Head title="Checkout" />
            <Meta
                title="Checkout - Printair"
                description="Enter your details and delivery information to complete your custom print order at Printair."
            />
            <Header />

            <div className="tw-container tw-mx-auto tw-px-5 tw-pt-4">
                <Breadcrumb />

                <section className="tw-mb-6 tw-rounded-lg tw-py-6">
                    <div className="tw-mb-3 tw-flex tw-items-center tw-justify-between tw-px-1">
                        <h5 className="tw-text-2xl tw-font-bold tw-text-[#f44032]">
                            Checkout
                        </h5>
                        {isAuthenticated && (
                            <div className="tw-text-xs tw-text-gray-500">
                                Signed in as{' '}
                                <span className="tw-font-medium tw-text-gray-700">
                                    {user?.email}
                                </span>
                            </div>
                        )}
                    </div>

                    <div className="tw-grid tw-grid-cols-1 tw-gap-6 lg:tw-grid-cols-3">
                        {/* Left: form */}
                        <form
                            onSubmit={handleSubmit}
                            className="tw-space-y-8 lg:tw-col-span-2"
                            data-aos="fade-up"
                        >
                            {/* Guest nudge */}
                            {(requiresGuestDetails || !isAuthenticated) && (
                                <div className="tw-rounded tw-border tw-border-yellow-200 tw-bg-yellow-50 tw-p-3 tw-text-sm tw-text-yellow-800">
                                    Please provide all required contact details
                                    to continue.
                                </div>
                            )}

                            {/* Contact */}
                            <Card className="tw-space-y-4">
                                <SectionTitle>Contact</SectionTitle>
                                <div className="tw-grid tw-gap-4 md:tw-grid-cols-2">
                                    <Field
                                        label="First name"
                                        required
                                        error={
                                            errors.first_name ||
                                            clientErrors.first_name
                                        }
                                    >
                                        <Input
                                            value={data.first_name}
                                            onChange={(e) =>
                                                setData(
                                                    'first_name',
                                                    e.target.value,
                                                )
                                            }
                                        />
                                    </Field>
                                    <Field
                                        label="Last name"
                                        required
                                        error={
                                            errors.last_name ||
                                            clientErrors.last_name
                                        }
                                    >
                                        <Input
                                            value={data.last_name}
                                            onChange={(e) =>
                                                setData(
                                                    'last_name',
                                                    e.target.value,
                                                )
                                            }
                                        />
                                    </Field>
                                    <Field
                                        label="Email"
                                        required
                                        error={
                                            errors.email || clientErrors.email
                                        }
                                    >
                                        <Input
                                            type="email"
                                            value={data.email}
                                            onChange={(e) =>
                                                setData('email', e.target.value)
                                            }
                                        />
                                    </Field>
                                    <Field
                                        label="Primary phone"
                                        required
                                        hint="Use 0XXXXXXXXX or +94XXXXXXXXX"
                                        error={
                                            errors.phone_primary ||
                                            clientErrors.phone_primary
                                        }
                                    >
                                        <div className="tw-relative">
                                            <Input
                                                value={data.phone_primary}
                                                onChange={(e) =>
                                                    setData(
                                                        'phone_primary',
                                                        e.target.value,
                                                    )
                                                }
                                            />
                                            {isAuthenticated && previousPhones.length > 0 && (
                                                <button
                                                    type="button"
                                                    onClick={() => setShowPhoneList(!showPhoneList)}
                                                    className="tw-absolute tw-right-2 tw-top-1/2 tw--translate-y-1/2 tw-text-[#f44032] hover:tw-text-[#d63528] tw-transition"
                                                    title="Use previous phone"
                                                >
                                                    <Icon icon="mdi:phone-clock" className="tw-text-xl" />
                                                </button>
                                            )}
                                        </div>
                                        {/* Previous Phone Numbers */}
                                        {showPhoneList && previousPhones.length > 0 && (
                                            <div className="tw-mt-2 tw-rounded-lg tw-border tw-border-blue-200 tw-bg-blue-50 tw-p-2">
                                                <div className="tw-mb-1 tw-text-xs tw-font-semibold tw-text-blue-900">
                                                    Select a previous number:
                                                </div>
                                                <div className="tw-space-y-1">
                                                    {previousPhones.map((phone, idx) => (
                                                        <button
                                                            key={idx}
                                                            type="button"
                                                            onClick={() => applyPhone(phone)}
                                                            className="tw-w-full tw-rounded-md tw-border tw-border-blue-300 tw-bg-white tw-px-3 tw-py-1.5 tw-text-left tw-text-sm hover:tw-bg-blue-100 tw-transition tw-flex tw-items-center tw-gap-2"
                                                        >
                                                            <Icon icon="mdi:phone" className="tw-text-blue-600" />
                                                            {phone}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                        {/* Suggested Phone Notification */}
                                        {suggestedPhone && !showPhoneList && (
                                            <div className="tw-mt-2 tw-rounded-lg tw-border tw-border-green-200 tw-bg-green-50 tw-px-2 tw-py-1.5 tw-flex tw-items-start tw-gap-2">
                                                <Icon icon="mdi:check-circle" className="tw-text-green-600 tw-text-base tw-flex-shrink-0 tw-mt-0.5" />
                                                <div className="tw-text-xs tw-text-green-800">
                                                    Your most used phone number has been pre-filled.
                                                </div>
                                            </div>
                                        )}
                                    </Field>
                                    <Field
                                        label="Alternative phone 1"
                                        error={errors.phone_alt_1}
                                    >
                                        <Input
                                            value={data.phone_alt_1}
                                            onChange={(e) =>
                                                setData(
                                                    'phone_alt_1',
                                                    e.target.value,
                                                )
                                            }
                                        />
                                    </Field>
                                    <Field
                                        label="Alternative phone 2"
                                        error={errors.phone_alt_2}
                                    >
                                        <Input
                                            value={data.phone_alt_2}
                                            onChange={(e) =>
                                                setData(
                                                    'phone_alt_2',
                                                    e.target.value,
                                                )
                                            }
                                        />
                                    </Field>
                                    <Field
                                        className="md:tw-col-span-2"
                                        label="Active WhatsApp number"
                                        required
                                        error={
                                            errors.whatsapp ||
                                            clientErrors.whatsapp
                                        }
                                    >
                                        <div className="tw-relative">
                                            <Input
                                                value={data.whatsapp}
                                                onChange={(e) =>
                                                    setData(
                                                        'whatsapp',
                                                        e.target.value,
                                                    )
                                                }
                                            />
                                            {isAuthenticated && previousWhatsApp.length > 0 && (
                                                <button
                                                    type="button"
                                                    onClick={() => setShowWhatsAppList(!showWhatsAppList)}
                                                    className="tw-absolute tw-right-2 tw-top-1/2 tw--translate-y-1/2 tw-text-[#f44032] hover:tw-text-[#d63528] tw-transition"
                                                    title="Use previous WhatsApp"
                                                >
                                                    <Icon icon="mdi:whatsapp" className="tw-text-xl" />
                                                </button>
                                            )}
                                        </div>
                                        {/* Previous WhatsApp Numbers */}
                                        {showWhatsAppList && previousWhatsApp.length > 0 && (
                                            <div className="tw-mt-2 tw-rounded-lg tw-border tw-border-blue-200 tw-bg-blue-50 tw-p-2">
                                                <div className="tw-mb-1 tw-text-xs tw-font-semibold tw-text-blue-900">
                                                    Select a previous number:
                                                </div>
                                                <div className="tw-space-y-1">
                                                    {previousWhatsApp.map((whatsapp, idx) => (
                                                        <button
                                                            key={idx}
                                                            type="button"
                                                            onClick={() => applyWhatsApp(whatsapp)}
                                                            className="tw-w-full tw-rounded-md tw-border tw-border-blue-300 tw-bg-white tw-px-3 tw-py-1.5 tw-text-left tw-text-sm hover:tw-bg-blue-100 tw-transition tw-flex tw-items-center tw-gap-2"
                                                        >
                                                            <Icon icon="mdi:whatsapp" className="tw-text-green-600" />
                                                            {whatsapp}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                        {/* Suggested WhatsApp Notification */}
                                        {suggestedWhatsApp && !showWhatsAppList && (
                                            <div className="tw-mt-2 tw-rounded-lg tw-border tw-border-green-200 tw-bg-green-50 tw-px-2 tw-py-1.5 tw-flex tw-items-start tw-gap-2">
                                                <Icon icon="mdi:check-circle" className="tw-text-green-600 tw-text-base tw-flex-shrink-0 tw-mt-0.5" />
                                                <div className="tw-text-xs tw-text-green-800">
                                                    Your most used WhatsApp number has been pre-filled.
                                                </div>
                                            </div>
                                        )}
                                    </Field>
                                </div>
                            </Card>

                            {/* Company */}
                            <Card className="tw-space-y-4">
                                <SectionTitle>Company (optional)</SectionTitle>
                                <Checkbox
                                    label="This is a company order"
                                    checked={useCompany}
                                    onChange={(e) =>
                                        setUseCompany(e.target.checked)
                                    }
                                />
                                {useCompany && (
                                    <Field
                                        label="Company name"
                                        error={errors.company_name}
                                    >
                                        <Input
                                            value={data.company_name}
                                            onChange={(e) =>
                                                setData(
                                                    'company_name',
                                                    e.target.value,
                                                )
                                            }
                                        />
                                    </Field>
                                )}
                            </Card>

                            {/* Billing */}
                            <Card className="tw-space-y-4">
                                <div className="tw-flex tw-items-center tw-justify-between">
                                    <SectionTitle>Billing Address</SectionTitle>
                                    {isAuthenticated && previousAddresses.billing.length > 0 && (
                                        <button
                                            type="button"
                                            onClick={() => setShowBillingAddressList(!showBillingAddressList)}
                                            className="tw-text-sm tw-text-[#f44032] hover:tw-underline tw-flex tw-items-center tw-gap-1"
                                        >
                                            <Icon icon="mdi:map-marker-multiple" />
                                            {showBillingAddressList ? 'Hide' : 'Use previous address'}
                                        </button>
                                    )}
                                </div>

                                {/* Previous Addresses List */}
                                {showBillingAddressList && previousAddresses.billing.length > 0 && (
                                    <div className="tw-rounded-lg tw-border tw-border-blue-200 tw-bg-blue-50 tw-p-3">
                                        <div className="tw-mb-2 tw-text-xs tw-font-semibold tw-text-blue-900">
                                            Select a previous address:
                                        </div>
                                        <div className="tw-space-y-2">
                                            {previousAddresses.billing.map((addr, idx) => (
                                                <button
                                                    key={idx}
                                                    type="button"
                                                    onClick={() => applyBillingAddress(addr)}
                                                    className="tw-w-full tw-rounded-md tw-border tw-border-blue-300 tw-bg-white tw-p-2 tw-text-left tw-text-xs hover:tw-bg-blue-100 tw-transition"
                                                >
                                                    <div className="tw-font-medium tw-text-gray-900">{addr.line1}</div>
                                                    {addr.line2 && <div className="tw-text-gray-600">{addr.line2}</div>}
                                                    <div className="tw-text-gray-600">
                                                        {addr.city}, {addr.region} {addr.postal_code}
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Suggested Address Notification */}
                                {suggestedBillingAddress && !showBillingAddressList && (
                                    <div className="tw-rounded-lg tw-border tw-border-green-200 tw-bg-green-50 tw-p-3 tw-flex tw-items-start tw-gap-2">
                                        <Icon icon="mdi:check-circle" className="tw-text-green-600 tw-text-lg tw-flex-shrink-0 tw-mt-0.5" />
                                        <div className="tw-text-xs tw-text-green-800">
                                            <strong>Your most used address has been pre-filled.</strong> You can edit it below or select a different one.
                                        </div>
                                    </div>
                                )}

                                <div className="tw-grid tw-gap-4">
                                    <Field
                                        label="Address line 1"
                                        required
                                        error={
                                            errors.billing_address_line1 ||
                                            clientErrors.billing_address_line1
                                        }
                                    >
                                        <Input
                                            value={data.billing_address_line1}
                                            onChange={(e) =>
                                                setData(
                                                    'billing_address_line1',
                                                    e.target.value,
                                                )
                                            }
                                        />
                                    </Field>
                                    <Field label="Address line 2">
                                        <Input
                                            value={data.billing_address_line2}
                                            onChange={(e) =>
                                                setData(
                                                    'billing_address_line2',
                                                    e.target.value,
                                                )
                                            }
                                        />
                                    </Field>
                                    <div className="tw-grid tw-gap-4 md:tw-grid-cols-3">
                                        <Field
                                            label="City"
                                            required
                                            error={
                                                errors.billing_city ||
                                                clientErrors.billing_city
                                            }
                                        >
                                            <Input
                                                value={data.billing_city}
                                                onChange={(e) =>
                                                    setData(
                                                        'billing_city',
                                                        e.target.value,
                                                    )
                                                }
                                            />
                                        </Field>
                                        <Field label="Province">
                                            <Select
                                                value={data.billing_province}
                                                onChange={(e) =>
                                                    setData(
                                                        'billing_province',
                                                        e.target.value,
                                                    )
                                                }
                                            >
                                                <option value="">
                                                    Select Province
                                                </option>
                                                <option value="Western">
                                                    Western
                                                </option>
                                                <option value="Central">
                                                    Central
                                                </option>
                                                <option value="Southern">
                                                    Southern
                                                </option>
                                                <option value="Northern">
                                                    Northern
                                                </option>
                                                <option value="Eastern">
                                                    Eastern
                                                </option>
                                                <option value="North Western">
                                                    North Western
                                                </option>
                                                <option value="North Central">
                                                    North Central
                                                </option>
                                                <option value="Uva">Uva</option>
                                                <option value="Sabaragamuwa">
                                                    Sabaragamuwa
                                                </option>
                                            </Select>
                                        </Field>
                                        <Field label="Postal code">
                                            <Input
                                                value={data.billing_postal}
                                                onChange={(e) =>
                                                    setData(
                                                        'billing_postal',
                                                        e.target.value,
                                                    )
                                                }
                                            />
                                        </Field>
                                    </div>
                                    <Input
                                        value="Sri Lanka"
                                        readOnly
                                        disabled
                                        className="tw-opacity-70"
                                    />
                                </div>
                            </Card>

                            {/* Shipping */}
                            <Card className="tw-space-y-4">
                                <div className="tw-flex tw-items-center tw-justify-between">
                                    <SectionTitle>Shipping Address</SectionTitle>
                                    {isAuthenticated && previousAddresses.shipping.length > 0 && !sameShip && (
                                        <button
                                            type="button"
                                            onClick={() => setShowShippingAddressList(!showShippingAddressList)}
                                            className="tw-text-sm tw-text-[#f44032] hover:tw-underline tw-flex tw-items-center tw-gap-1"
                                        >
                                            <Icon icon="mdi:map-marker-multiple" />
                                            {showShippingAddressList ? 'Hide' : 'Use previous address'}
                                        </button>
                                    )}
                                </div>
                                <Checkbox
                                    label="Use billing address as shipping address"
                                    checked={sameShip}
                                    onChange={(e) =>
                                        setSameShip(e.target.checked)
                                    }
                                />
                                {!sameShip && (
                                    <div className="tw-grid tw-gap-4">
                                        {/* Previous Shipping Addresses List */}
                                        {showShippingAddressList && previousAddresses.shipping.length > 0 && (
                                            <div className="tw-rounded-lg tw-border tw-border-blue-200 tw-bg-blue-50 tw-p-3">
                                                <div className="tw-mb-2 tw-text-xs tw-font-semibold tw-text-blue-900">
                                                    Select a previous address:
                                                </div>
                                                <div className="tw-space-y-2">
                                                    {previousAddresses.shipping.map((addr, idx) => (
                                                        <button
                                                            key={idx}
                                                            type="button"
                                                            onClick={() => applyShippingAddress(addr)}
                                                            className="tw-w-full tw-rounded-md tw-border tw-border-blue-300 tw-bg-white tw-p-2 tw-text-left tw-text-xs hover:tw-bg-blue-100 tw-transition"
                                                        >
                                                            <div className="tw-font-medium tw-text-gray-900">{addr.line1}</div>
                                                            {addr.line2 && <div className="tw-text-gray-600">{addr.line2}</div>}
                                                            <div className="tw-text-gray-600">
                                                                {addr.city}, {addr.region} {addr.postal_code}
                                                            </div>
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Suggested Shipping Address Notification */}
                                        {suggestedShippingAddress && !showShippingAddressList && !sameShip && (
                                            <div className="tw-rounded-lg tw-border tw-border-green-200 tw-bg-green-50 tw-p-3 tw-flex tw-items-start tw-gap-2">
                                                <Icon icon="mdi:check-circle" className="tw-text-green-600 tw-text-lg tw-flex-shrink-0 tw-mt-0.5" />
                                                <div className="tw-text-xs tw-text-green-800">
                                                    <strong>Your most used shipping address has been pre-filled.</strong> You can edit it below or select a different one.
                                                </div>
                                            </div>
                                        )}
                                        <Field
                                            label="Address line 1"
                                            required
                                            error={
                                                errors.shipping_address_line1 ||
                                                clientErrors.shipping_address_line1
                                            }
                                        >
                                            <Input
                                                value={
                                                    data.shipping_address_line1
                                                }
                                                onChange={(e) =>
                                                    setData(
                                                        'shipping_address_line1',
                                                        e.target.value,
                                                    )
                                                }
                                            />
                                        </Field>
                                        <Field label="Address line 2">
                                            <Input
                                                value={
                                                    data.shipping_address_line2
                                                }
                                                onChange={(e) =>
                                                    setData(
                                                        'shipping_address_line2',
                                                        e.target.value,
                                                    )
                                                }
                                            />
                                        </Field>
                                        <div className="tw-grid tw-gap-4 md:tw-grid-cols-3">
                                            <Field
                                                label="City"
                                                required
                                                error={
                                                    errors.shipping_city ||
                                                    clientErrors.shipping_city
                                                }
                                            >
                                                <Input
                                                    value={data.shipping_city}
                                                    onChange={(e) =>
                                                        setData(
                                                            'shipping_city',
                                                            e.target.value,
                                                        )
                                                    }
                                                />
                                            </Field>
                                            <Field label="Province">
                                                <Select
                                                    value={
                                                        data.shipping_province
                                                    }
                                                    onChange={(e) =>
                                                        setData(
                                                            'shipping_province',
                                                            e.target.value,
                                                        )
                                                    }
                                                >
                                                    <option value="">
                                                        Select Province
                                                    </option>
                                                    <option value="Western">
                                                        Western
                                                    </option>
                                                    <option value="Central">
                                                        Central
                                                    </option>
                                                    <option value="Southern">
                                                        Southern
                                                    </option>
                                                    <option value="Northern">
                                                        Northern
                                                    </option>
                                                    <option value="Eastern">
                                                        Eastern
                                                    </option>
                                                    <option value="North Western">
                                                        North Western
                                                    </option>
                                                    <option value="North Central">
                                                        North Central
                                                    </option>
                                                    <option value="Uva">
                                                        Uva
                                                    </option>
                                                    <option value="Sabaragamuwa">
                                                        Sabaragamuwa
                                                    </option>
                                                </Select>
                                            </Field>
                                            <Field label="Postal code">
                                                <Input
                                                    value={data.shipping_postal}
                                                    onChange={(e) =>
                                                        setData(
                                                            'shipping_postal',
                                                            e.target.value,
                                                        )
                                                    }
                                                />
                                            </Field>
                                        </div>
                                        <Input
                                            value="Sri Lanka"
                                            readOnly
                                            disabled
                                            className="tw-opacity-70"
                                        />
                                    </div>
                                )}
                            </Card>

                            {/* Shipping method */}
                            <Card className="tw-space-y-3">
                                <SectionTitle>Shipping Method</SectionTitle>
                                {shippingMethods.length === 0 ? (
                                    <div className="tw-rounded-xl tw-border tw-border-gray-200 tw-bg-gray-50 tw-p-3 tw-text-sm">
                                        Shipping method will be confirmed by our
                                        team after reviewing your order.
                                    </div>
                                ) : (
                                    <Field>
                                        <Select
                                            value={
                                                data.shipping_method_id ?? ''
                                            }
                                            onChange={(e) =>
                                                setData(
                                                    'shipping_method_id',
                                                    e.target.value
                                                        ? Number(e.target.value)
                                                        : '',
                                                )
                                            }
                                            error={errors.shipping_method_id}
                                        >
                                            {shippingMethods.map((m) => (
                                                <option key={m.id} value={m.id}>
                                                    {m.name} (Rs.{' '}
                                                    {Number(m.cost).toFixed(2)})
                                                </option>
                                            ))}
                                        </Select>
                                    </Field>
                                )}
                            </Card>

                            {/* Notes & Terms */}
                            <Card className="tw-space-y-4">
                                <Field label="Special delivery instructions / notes">
                                    <Textarea
                                        rows={3}
                                        value={data.notes}
                                        onChange={(e) =>
                                            setData('notes', e.target.value)
                                        }
                                    />
                                    <div className="tw-text-xs tw-text-yellow-500">
                                        If you can, please add your google map
                                        location here as a link. (Eg.: https://maps.app.goo.gl/3p8RKyK9SgDy6L6B8)
                                    </div>
                                </Field>
                                <Checkbox
                                    label="I agree to the order policy and terms."
                                    checked={data.accept_policy}
                                    onChange={(e) =>
                                        setData(
                                            'accept_policy',
                                            e.target.checked,
                                        )
                                    }
                                />
                                {(errors.accept_policy ||
                                    clientErrors.accept_policy) && (
                                    <p className="tw-text-[12px] tw-text-rose-600">
                                        {errors.accept_policy ||
                                            clientErrors.accept_policy}
                                    </p>
                                )}

                                <button
                                    type="submit"
                                    disabled={processing || hasClientErrors}
                                    className={`tw-w-full tw-rounded-xl tw-px-6 tw-py-3 tw-font-medium tw-transition md:tw-w-auto ${
                                        processing || hasClientErrors
                                            ? 'tw-cursor-not-allowed tw-bg-[#f44032]/60 tw-text-white'
                                            : 'tw-bg-[#f44032] tw-text-white hover:tw-opacity-90'
                                    }`}
                                >
                                    Review &amp; Place Order
                                </button>

                                <div className="tw-text-xs tw-text-gray-500">
                                    We don’t support Cash on Delivery. Your
                                    order will be reviewed and we’ll email the
                                    payment link.
                                </div>
                            </Card>
                        </form>

                        {/* Right: summary (sticky) */}
                        <aside
                            className="tw-sticky tw-top-40 tw-self-start"
                            data-aos="fade-left"
                            data-aos-delay="60"
                        >
                            {/* Order Summary (enhanced) */}
                            <div className="tw-h-fit tw-rounded-2xl tw-border tw-border-gray-200 tw-bg-white tw-p-4 tw-shadow">
                                {/* Header */}
                                <div className="tw-mb-3 tw-flex tw-items-center tw-justify-between">
                                    <div className="tw-text-sm tw-font-semibold tw-text-gray-900">
                                        Order Summary
                                    </div>
                                    <span className="tw-text-xs tw-text-gray-500">
                                        {items.length} item
                                        {items.length !== 1 ? 's' : ''}
                                    </span>
                                </div>

                                {/* Items */}
                                <ul className="tw-divide-y tw-divide-gray-100">
                                    {items.map((item) => {
                                        const q = toNumber(item.quantity ?? 1);
                                        const line =
                                            toNumber(item.total_price) ||
                                            toNumber(
                                                item.unit_price ?? item.price,
                                            ) * q;

                                        const img =
                                            item.thumbnail_url ||
                                            item.design?.image_url ||
                                            '/images/default.png';

                                        return (
                                            <li
                                                key={item.id}
                                                className="tw-flex tw-gap-3 tw-py-3"
                                            >
                                                {/* thumb */}
                                                <div className="tw-h-14 tw-w-14 tw-flex-shrink-0 tw-overflow-hidden tw-rounded-lg tw-border tw-border-gray-200 tw-bg-gray-100">
                                                    <img
                                                        src={img}
                                                        alt={item.name}
                                                        className="tw-h-full tw-w-full tw-object-cover"
                                                        loading="lazy"
                                                    />
                                                </div>

                                                {/* meta */}
                                                <div className="tw-min-w-0 tw-flex-1">
                                                    <div className="tw-flex tw-items-start tw-justify-between tw-gap-3">
                                                        <div className="tw-min-w-0">
                                                            <div
                                                                className="tw-truncate tw-font-medium tw-text-gray-900"
                                                                title={
                                                                    item.name
                                                                }
                                                            >
                                                                {item.name}
                                                            </div>
                                                            <div className="tw-mt-0.5 tw-text-[11px] tw-text-gray-500">
                                                                x{q}
                                                            </div>

                                                            {/* roll size */}
                                                            {item.pricing_method ===
                                                                'roll' &&
                                                                item.width &&
                                                                item.height && (
                                                                    <div className="tw-mt-1 tw-inline-flex tw-items-center tw-gap-1 tw-text-[11px] tw-text-gray-600">
                                                                        <span className="tw-inline-flex tw-items-center tw-gap-1 tw-rounded-full tw-bg-gray-100 tw-px-2 tw-py-0.5">
                                                                            <svg
                                                                                width="12"
                                                                                height="12"
                                                                                viewBox="0 0 24 24"
                                                                                className="tw-opacity-70"
                                                                            >
                                                                                <path
                                                                                    fill="currentColor"
                                                                                    d="M21 16V8h-2v8h-2l3 3l3-3h-2ZM9 21q-.825 0-1.412-.587T7 19V5q0-.825.588-1.412T9 3h6q.825 0 1.413.588T17 5v14q0 .825-.587 1.413T15 21H9Zm0-2h6V5H9v14Z"
                                                                                />
                                                                            </svg>
                                                                            {
                                                                                item.width
                                                                            }{' '}
                                                                            ×{' '}
                                                                            {
                                                                                item.height
                                                                            }{' '}
                                                                            {item.size_unit ||
                                                                                ''}
                                                                        </span>
                                                                    </div>
                                                                )}

                                                            {/* options (truncate but keep full in title) */}
                                                            {item.options && (
                                                                <div
                                                                    className="tw-mt-1 tw-line-clamp-2 tw-text-[11px] tw-text-gray-500"
                                                                    title={Object.entries(
                                                                        item.options,
                                                                    )
                                                                        .map(
                                                                            ([
                                                                                k,
                                                                                v,
                                                                            ]) =>
                                                                                `${k}: ${v?.label || v}`,
                                                                        )
                                                                        .join(
                                                                            ', ',
                                                                        )}
                                                                >
                                                                    {Object.entries(
                                                                        item.options,
                                                                    )
                                                                        .map(
                                                                            ([
                                                                                k,
                                                                                v,
                                                                            ]) =>
                                                                                `${k}: ${v?.label || v}`,
                                                                        )
                                                                        .join(
                                                                            ', ',
                                                                        )}
                                                                </div>
                                                            )}
                                                        </div>

                                                        {/* line total */}
                                                        <div className="tw-ml-auto tw-text-right">
                                                            <div className="tw-text-[12px] tw-text-gray-500">
                                                                Line total
                                                            </div>
                                                            <div className="tw-font-semibold tw-text-gray-900">
                                                                Rs.{' '}
                                                                {money(line)}
                                                            </div>
                                                            {toNumber(
                                                                item.unit_price ??
                                                                    item.price,
                                                            ) > 0 &&
                                                                q > 1 && (
                                                                    <div className="tw-text-[11px] tw-text-gray-500">
                                                                        @ Rs.{' '}
                                                                        {money(
                                                                            item.unit_price ??
                                                                                item.price,
                                                                        )}
                                                                    </div>
                                                                )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </li>
                                        );
                                    })}
                                </ul>

                                {/* Totals */}
                                <div className="tw-mt-4 tw-space-y-2">
                                    <div className="tw-flex tw-justify-between tw-text-sm">
                                        <span className="tw-text-gray-500">
                                            Subtotal
                                        </span>
                                        <span className="tw-text-gray-800">
                                            Rs. {money(subtotal)}
                                        </span>
                                    </div>

                                    {/* show savings row when discount > 0 */}
                                    {toNumber(discount) > 0 && (
                                        <>
                                            <div className="tw-flex tw-justify-between tw-text-sm">
                                                <span className="tw-text-gray-500">
                                                    Discount
                                                </span>
                                                <span className="tw-text-emerald-700">
                                                    - Rs. {money(discount)}
                                                </span>
                                            </div>
                                            <div className="tw-flex tw-justify-between tw-text-[12px] tw-text-emerald-700">
                                                <span>You saved</span>
                                                <span>
                                                    Rs. {money(discount)}
                                                </span>
                                            </div>
                                        </>
                                    )}

                                    <div className="tw-flex tw-justify-between tw-text-sm">
                                        <span className="tw-text-gray-500">
                                            Shipping
                                        </span>
                                        <span className="tw-text-gray-800">
                                            Rs. {money(shippingTotal)}
                                        </span>
                                    </div>

                                    <div className="tw-flex tw-justify-between tw-text-sm">
                                        <span className="tw-text-gray-500">
                                            Tax
                                        </span>
                                        <span className="tw-text-gray-800">
                                            Rs. {money(tax)}
                                        </span>
                                    </div>

                                    <div className="tw-my-1 tw-h-px tw-bg-gray-200" />

                                    <div className="tw-flex tw-items-baseline tw-justify-between">
                                        <span className="tw-text-sm tw-font-semibold tw-text-gray-800">
                                            Total
                                        </span>
                                        <span className="tw-text-base tw-font-extrabold tw-text-[#f44032]">
                                            Rs. {money(grandTotal)}
                                        </span>
                                    </div>
                                    <div className="tw-flex tw-items-baseline tw-justify-between">
                                        <span className="tw-text-sm tw-text-red-500">
                                            (Note that this is not the final
                                            total price for your order, once our
                                            team review your order, they will
                                            confirm the final totatl price!{' '}
                                            <br />
                                            <br />
                                            මෙම මුදල අවසාන මුළු මුදල නොවන බව
                                            කරුණාවෙන් සලකන්න. අවසාන මුළු මුදල
                                            ඔබගේ ඇණවුම පරීක්ෂා කිරීමෙන් අනතුරුව
                                            අපගේ නියෝජිතයෙකු විසින් ඔබට දැනුම්
                                            දෙනු ලැබේ.)
                                        </span>
                                    </div>
                                </div>

                                {/* Review note */}
                                <div className="tw-mt-4 tw-rounded-xl tw-border tw-border-blue-200 tw-bg-blue-50 tw-p-3">
                                    <div className="tw-flex tw-items-start tw-gap-2">
                                        <Icon
                                            icon="mdi:information-outline"
                                            className="tw-mt-0.5 tw-flex-shrink-0 tw-text-lg tw-text-blue-600"
                                        />
                                        <p className="tw-text-xs tw-leading-relaxed tw-text-blue-800">
                                            Our team will review your order and
                                            email & WhatsApp you a payment link
                                            after confirmation.
                                        </p>
                                    </div>
                                </div>

                                <div className="tw-mt-4 tw-rounded-xl tw-border tw-border-red-200 tw-bg-red-50 tw-p-3">
                                    <div className="tw-flex tw-items-start tw-gap-2">
                                        <Icon
                                            icon="mdi:information-outline"
                                            className="tw-mt-0.5 tw-flex-shrink-0 tw-text-lg tw-text-red-600"
                                        />
                                        <p className="tw-text-xs tw-leading-relaxed tw-text-red-800">
                                            Note that this is not the final
                                            total price for your order, once our
                                            team review your order, they will
                                            confirm the final totatl price!
                                            <br />
                                            <br />
                                            මෙම මුදල අවසාන මුළු මුදල නොවන බව
                                            කරුණාවෙන් සලකන්න. අවසාන මුළු මුදල
                                            ඔබගේ ඇණවුම පරීක්ෂා කිරීමෙන් අනතුරුව
                                            අපගේ නියෝජිතයෙකු විසින් ඔබට දැනුම්
                                            දෙනු ලැබේ.
                                        </p>
                                    </div>
                                </div>

                                <p className="tw-mt-3 tw-text-center tw-text-[11px] tw-text-gray-500">
                                    Shipping & taxes may be adjusted upon review
                                </p>
                            </div>
                            <Link
                                href="/products/all"
                                className="tw-mt-3 tw-block tw-rounded-lg tw-border tw-border-black tw-py-2 tw-text-center tw-text-sm tw-text-black hover:tw-bg-black hover:tw-text-white"
                            >
                                Continue Shopping
                            </Link>
                        </aside>
                    </div>
                </section>
            </div>

            {/* Mobile sticky submit bar */}
            {showMobileBar && (
                <div className="tw-fixed tw-bottom-0 tw-left-0 tw-right-0 tw-z-40 tw-border-t tw-bg-white tw-px-4 tw-py-3 tw-shadow-lg lg:tw-hidden">
                    <div className="tw-flex tw-items-center tw-justify-between">
                        <div className="tw-text-sm">
                            <div className="tw-text-gray-500">Total</div>
                            <div className="tw-text-lg tw-font-semibold">
                                Rs. {money(grandTotal)}
                            </div>
                        </div>
                        <button
                            onClick={(e) => handleSubmit(e)}
                            className="tw-inline-flex tw-items-center tw-gap-2 tw-rounded-xl tw-bg-[#f44032] tw-px-4 tw-py-2 tw-text-white"
                            disabled={hasClientErrors || processing}
                            title={
                                hasClientErrors
                                    ? 'Please fix the highlighted fields'
                                    : 'Review & Place Order'
                            }
                        >
                            <Icon icon="mdi:cart-check" />
                            Place Order
                        </button>
                    </div>
                </div>
            )}

            <CookieConsent />
            <Footer />

            <Toasts toasts={toasts} dismiss={dismissToast} />
        </>
    );
}
