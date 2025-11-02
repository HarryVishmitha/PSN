import GuestLayout from '@/Layouts/GuestLayout';
import { Icon } from '@iconify/react';
import { Head } from '@inertiajs/react';
import axios from 'axios';
import { useCallback, useMemo, useState } from 'react';

const INITIAL_STEP = 'request';

const errorFor = (errors, field) => errors[field] ?? null;

export default function TrackOrder({ prefill = {} }) {
    const [step, setStep] = useState(INITIAL_STEP);
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState(null);
    const [errors, setErrors] = useState({});

    const [lookup, setLookup] = useState({
        order_reference: prefill.order ?? '',
        email: prefill.email ?? '',
    });

    const [verification, setVerification] = useState({
        code: '',
    });

    const disableVerify = useMemo(
        () => verification.code.trim().length !== 6,
        [verification.code],
    );

    const handleLookupChange = useCallback((event) => {
        const { name, value } = event.target;
        setLookup((prev) => ({ ...prev, [name]: value }));
    }, []);

    const handleVerificationChange = useCallback((event) => {
        const { name, value } = event.target;
        const digitsOnly = value.replace(/\D/g, '').slice(0, 6);
        setVerification((prev) => ({ ...prev, [name]: digitsOnly }));
    }, []);

    const requestCode = useCallback(async () => {
        if (loading) return;

        setLoading(true);
        setErrors({});
        setStatus(null);

        try {
            const response = await axios.post(
                route('order-tracking.request-code'),
                lookup,
            );

            setStatus(response.data?.message ?? 'Code sent. Check your inbox.');
            setStep('verify');
        } catch (error) {
            const { response } = error;
            if (response?.status === 422) {
                setErrors(response.data?.errors ?? {});
            } else {
                setStatus(
                    response?.data?.message ??
                        'We could not send a code right now. Please try again.',
                );
            }
        } finally {
            setLoading(false);
        }
    }, [loading, lookup]);

    const verifyCode = useCallback(async () => {
        if (loading || disableVerify) return;

        setLoading(true);
        setErrors({});
        setStatus(null);

        try {
            const response = await axios.post(
                route('order-tracking.verify-code'),
                {
                    ...lookup,
                    ...verification,
                },
            );

            const redirectUrl = response.data?.redirect;
            if (redirectUrl) {
                window.location.href = redirectUrl;
                return;
            }

            setStatus(
                'Verification succeeded, but we could not open the order.',
            );
        } catch (error) {
            const { response } = error;
            if (response?.status === 422) {
                setErrors(response.data?.errors ?? {});
            } else {
                setStatus(
                    response?.data?.message ??
                        'Verification failed. Please request a new code.',
                );
            }
        } finally {
            setLoading(false);
        }
    }, [disableVerify, loading, lookup, verification]);

    const showResend = step === 'verify';

    return (
        <GuestLayout>
            <Head title="Track Your Order - Printair Advertising" />

            {/* Header Section with Icon */}
            <div className="tw-mb-6 tw-text-center">
                <div className="tw-mx-auto tw-mb-4 tw-flex tw-h-16 tw-w-16 tw-items-center tw-justify-center tw-rounded-full tw-bg-gradient-to-br tw-from-[#f44032] tw-to-[#ff6b5e] tw-shadow-lg">
                    <Icon
                        icon="mdi:package-variant-closed"
                        className="tw-text-3xl tw-text-white"
                    />
                </div>
                <h1 className="tw-text-2xl tw-font-bold tw-text-gray-900">
                    Track Your Order
                </h1>
                <p className="tw-mt-2 tw-text-sm tw-leading-relaxed tw-text-gray-600">
                    {step === 'request'
                        ? 'Enter your order reference and email to receive a secure verification code.'
                        : 'Enter the 6-digit code we sent to your email to view your order.'}
                </p>
            </div>

            {/* Status Messages */}
            {status && (
                <div className="tw-mb-6 tw-flex tw-items-start tw-gap-3 tw-rounded-xl tw-border-2 tw-border-[#f44032]/20 tw-bg-gradient-to-r tw-from-orange-50 tw-to-red-50 tw-px-4 tw-py-3 tw-shadow-sm">
                    <Icon
                        icon="mdi:information"
                        className="tw-mt-0.5 tw-flex-shrink-0 tw-text-xl tw-text-[#f44032]"
                    />
                    <p className="tw-text-sm tw-leading-relaxed tw-text-gray-700">
                        {status}
                    </p>
                </div>
            )}

            <form
                className="tw-space-y-5"
                onSubmit={(event) => {
                    event.preventDefault();
                    if (step === 'verify') {
                        verifyCode();
                    } else {
                        requestCode();
                    }
                }}
            >
                {/* Order Reference Field */}
                <div>
                    <label
                        htmlFor="order_reference"
                        className="tw-mb-2 tw-flex tw-items-center tw-gap-2 tw-text-sm tw-font-semibold tw-text-gray-700"
                    >
                        <Icon
                            icon="mdi:file-document-outline"
                            className="tw-text-[#f44032]"
                        />
                        Order Reference
                    </label>
                    <input
                        id="order_reference"
                        name="order_reference"
                        type="text"
                        value={lookup.order_reference}
                        onChange={handleLookupChange}
                        className="tw-w-full tw-rounded-xl tw-border-2 tw-border-gray-200 tw-bg-gray-50 tw-px-4 tw-py-3 tw-text-sm tw-text-gray-900 tw-transition-all focus:tw-border-[#f44032] focus:tw-bg-white focus:tw-ring-4 focus:tw-ring-[#f44032]/10"
                        placeholder="e.g. ORD-01234"
                        autoComplete="off"
                        required
                    />
                    {errorFor(errors, 'order_reference') && (
                        <p className="tw-mt-2 tw-flex tw-items-center tw-gap-1.5 tw-text-sm tw-text-red-600">
                            <Icon
                                icon="mdi:alert-circle"
                                className="tw-text-base"
                            />
                            {errorFor(errors, 'order_reference')}
                        </p>
                    )}
                </div>

                {/* Email Field */}
                <div>
                    <label
                        htmlFor="email"
                        className="tw-mb-2 tw-flex tw-items-center tw-gap-2 tw-text-sm tw-font-semibold tw-text-gray-700"
                    >
                        <Icon
                            icon="mdi:email-outline"
                            className="tw-text-[#f44032]"
                        />
                        Email Address
                    </label>
                    <input
                        id="email"
                        name="email"
                        type="email"
                        value={lookup.email}
                        onChange={handleLookupChange}
                        className="tw-w-full tw-rounded-xl tw-border-2 tw-border-gray-200 tw-bg-gray-50 tw-px-4 tw-py-3 tw-text-sm tw-text-gray-900 tw-transition-all focus:tw-border-[#f44032] focus:tw-bg-white focus:tw-ring-4 focus:tw-ring-[#f44032]/10"
                        placeholder="you@example.com"
                        autoComplete="off"
                        required
                    />
                    {errorFor(errors, 'email') && (
                        <p className="tw-mt-2 tw-flex tw-items-center tw-gap-1.5 tw-text-sm tw-text-red-600">
                            <Icon
                                icon="mdi:alert-circle"
                                className="tw-text-base"
                            />
                            {errorFor(errors, 'email')}
                        </p>
                    )}
                </div>

                {/* Verification Code Field (only shown in verify step) */}
                {step === 'verify' && (
                    <div className="tw-rounded-2xl tw-border-2 tw-border-[#f44032]/20 tw-bg-gradient-to-br tw-from-orange-50 tw-to-red-50 tw-p-5">
                        <label
                            htmlFor="code"
                            className="tw-mb-3 tw-flex tw-items-center tw-justify-center tw-gap-2 tw-text-sm tw-font-semibold tw-text-gray-700"
                        >
                            <Icon
                                icon="mdi:shield-lock-outline"
                                className="tw-text-xl tw-text-[#f44032]"
                            />
                            Verification Code
                        </label>
                        <input
                            id="code"
                            name="code"
                            type="text"
                            value={verification.code}
                            onChange={handleVerificationChange}
                            className="tw-w-full tw-rounded-xl tw-border-2 tw-border-[#f44032]/30 tw-bg-white tw-px-4 tw-py-4 tw-text-center tw-text-2xl tw-font-bold tw-tracking-[0.75rem] tw-text-gray-900 tw-shadow-sm tw-transition-all focus:tw-border-[#f44032] focus:tw-ring-4 focus:tw-ring-[#f44032]/20"
                            placeholder="000000"
                            inputMode="numeric"
                            pattern="\d*"
                            maxLength={6}
                            required
                        />
                        <p className="tw-mt-2 tw-text-center tw-text-xs tw-text-gray-600">
                            Enter the 6-digit code from your email
                        </p>
                        {errorFor(errors, 'code') && (
                            <p className="tw-mt-2 tw-flex tw-items-center tw-justify-center tw-gap-1.5 tw-text-sm tw-text-red-600">
                                <Icon
                                    icon="mdi:alert-circle"
                                    className="tw-text-base"
                                />
                                {errorFor(errors, 'code')}
                            </p>
                        )}
                    </div>
                )}

                {/* Submit Button */}
                <button
                    type="submit"
                    disabled={loading || (step === 'verify' && disableVerify)}
                    className={`tw-group tw-relative tw-flex tw-w-full tw-items-center tw-justify-center tw-gap-3 tw-overflow-hidden tw-rounded-xl tw-bg-gradient-to-r tw-from-[#f44032] tw-to-[#ff6b5e] tw-px-6 tw-py-4 tw-text-sm tw-font-bold tw-text-white tw-shadow-lg tw-transition-all ${
                        loading || (step === 'verify' && disableVerify)
                            ? 'tw-cursor-not-allowed tw-opacity-60'
                            : 'hover:tw--translate-y-0.5 hover:tw-shadow-xl'
                    }`}
                >
                    {loading ? (
                        <>
                            <Icon
                                icon="mdi:loading"
                                className="tw-animate-spin tw-text-xl"
                            />
                            {step === 'verify' ? 'Verifying…' : 'Sending…'}
                        </>
                    ) : (
                        <>
                            <Icon
                                icon={
                                    step === 'verify'
                                        ? 'mdi:shield-check'
                                        : 'mdi:email-fast'
                                }
                                className="tw-text-xl"
                            />
                            {step === 'verify'
                                ? 'Verify & View Order'
                                : 'Send Verification Code'}
                        </>
                    )}
                </button>
            </form>

            {/* Resend Code Button */}
            {showResend && (
                <button
                    type="button"
                    onClick={requestCode}
                    disabled={loading}
                    className="tw-mt-4 tw-flex tw-w-full tw-items-center tw-justify-center tw-gap-2 tw-rounded-xl tw-border-2 tw-border-gray-200 tw-bg-white tw-px-4 tw-py-3 tw-text-sm tw-font-semibold tw-text-gray-700 tw-transition-all hover:tw-border-[#f44032] hover:tw-text-[#f44032] disabled:tw-cursor-not-allowed disabled:tw-opacity-60"
                >
                    <Icon
                        icon="mdi:refresh"
                        className={loading ? 'tw-animate-spin' : ''}
                    />
                    {loading ? 'Resending…' : 'Resend Code'}
                </button>
            )}
        </GuestLayout>
    );
}
