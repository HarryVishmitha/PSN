// resources/js/Pages/Checkout.jsx
import React, { useState } from 'react';
import { Head, useForm } from '@inertiajs/react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function Checkout({ cartItems, user }) {
    const { data, setData, post, processing, errors } = useForm({
        name: user?.name || '',
        email: user?.email || '',
        phone: '',
        address: '',
        city: '',
        payment_method: 'cod',
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        // post(route('checkout.process'));
    };

    const total = cartItems.reduce((sum, item) => {
        const width = item.width || 1;
        const height = item.height || 1;
        const area = item.pricing_method === 'roll' ? width * height : 1;
        return sum + item.price * item.quantity * area;
    }, 0);

    return (
        <>
            <Head title="Checkout - Printair" />
            <Header />

            <div className="tw-container tw-mx-auto tw-my-10 tw-grid md:tw-grid-cols-3 tw-gap-8">
                {/* Billing Form */}
                <form onSubmit={handleSubmit} className="md:tw-col-span-2 tw-space-y-6">
                    <div>
                        <h2 className="tw-text-xl tw-font-semibold">Billing & Shipping Info</h2>
                        <div className="tw-grid tw-gap-4 md:tw-grid-cols-2">
                            <input
                                type="text"
                                className="tw-input"
                                placeholder="Full Name"
                                value={data.name}
                                onChange={e => setData('name', e.target.value)}
                            />
                            <input
                                type="email"
                                className="tw-input"
                                placeholder="Email"
                                value={data.email}
                                onChange={e => setData('email', e.target.value)}
                            />
                            <input
                                type="text"
                                className="tw-input"
                                placeholder="Phone"
                                value={data.phone}
                                onChange={e => setData('phone', e.target.value)}
                            />
                            <input
                                type="text"
                                className="tw-input"
                                placeholder="City"
                                value={data.city}
                                onChange={e => setData('city', e.target.value)}
                            />
                            <textarea
                                className="tw-input md:tw-col-span-2"
                                placeholder="Shipping Address"
                                value={data.address}
                                onChange={e => setData('address', e.target.value)}
                            ></textarea>
                        </div>
                    </div>

                    {/* Payment Options */}
                    <div>
                        <h2 className="tw-text-xl tw-font-semibold">Payment Method</h2>
                        <label className="tw-flex tw-items-center tw-gap-2">
                            <input
                                type="radio"
                                name="payment"
                                value="cod"
                                checked={data.payment_method === 'cod'}
                                onChange={() => setData('payment_method', 'cod')}
                            />
                            Cash on Delivery (COD)
                        </label>
                        {/* Add more methods later like Stripe/Bank Transfer */}
                    </div>

                    <button
                        type="submit"
                        disabled={processing}
                        className="tw-bg-primary tw-text-white tw-py-2 tw-px-6 tw-rounded-md"
                    >
                        Place Order
                    </button>
                </form>

                {/* Order Summary */}
                <div className="tw-bg-gray-50 tw-p-6 tw-rounded-xl tw-shadow-sm">
                    <h2 className="tw-text-xl tw-font-semibold tw-mb-4">Order Summary</h2>
                    <ul className="tw-divide-y">
                        {cartItems.map(item => (
                            <li key={item.id} className="tw-py-3 tw-flex tw-justify-between">
                                <div>
                                    <p className="tw-font-medium">{item.name}</p>
                                    <p className="tw-text-sm tw-text-gray-500">x{item.quantity}</p>
                                </div>
                                <p className="tw-font-semibold">
                                    Rs. {(item.price * item.quantity).toFixed(2)}
                                </p>
                            </li>
                        ))}
                    </ul>
                    <div className="tw-border-t tw-pt-4 tw-mt-4 tw-text-lg tw-font-bold tw-flex tw-justify-between">
                        <span>Total</span>
                        <span>Rs. {total.toFixed(2)}</span>
                    </div>
                </div>
            </div>

            <Footer />
        </>
    );
}
