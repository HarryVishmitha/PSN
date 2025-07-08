import React from 'react';
import { Head, Link } from '@inertiajs/react';
import Header from '@/components/Header';
import CookieConsent from '@/Components/CookieConsent';
import { useLayoutEffect, useState, useEffect, useRef } from 'react';
import { Icon } from "@iconify/react";
import AOS from 'aos';
import 'aos/dist/aos.css';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Typewriter } from 'react-simple-typewriter';
import Offers from '@/Components/Offers';
import FAQs from '@/Components/Faqs';
import ContactUs from '@/Components/ContactUs';
import Footer from '@/Components/Footer';
import Meta from '@/Components/Metaheads';
import Breadcrumb from '@/Components/BreadcrumbHome';
import CartItem from '@/Components/CartItem';
gsap.registerPlugin(ScrollTrigger);


const cart = () => {

    useEffect(() => {
        AOS.init({
            duration: 1000,
            once: true,
        });
        return () => {
            AOS.refreshHard(); // Or simply remove AOS class manually
        };
    }, []);

    const popularProducts = [
        { name: 'X-Banners', slug: 'x-banners' },
        { name: 'Pull-Up Banners', slug: 'pull-up-banners' },
        { name: 'Custom T-Shirts', slug: 'custom-t-shirts' },
        { name: 'Business Cards', slug: 'business-cards' },
        { name: 'Poster Printing', slug: 'poster-printing' },
    ];

    const [cartItems, setCartItems] = useState([
        {
            id: 1,
            name: 'X-Banner',
            variant: 'Standard',
            image: '/images/xbanner.jpg',
            price: 2500,
            quantity: 1,
            pricing_method: 'normal',
            designOption: 'own',
        },
        {
            id: 2,
            name: 'Flex Print',
            variant: 'Matte',
            image: '/images/flex.jpg',
            price: 50, // price per sq.ft
            quantity: 2,
            pricing_method: 'roll',
            width: 3,
            height: 2,
        },
    ]);

    const handleDesignChange = (id, option) => {
        setCartItems(prev =>
            prev.map(item =>
                item.id === id ? { ...item, designOption: option } : item
            )
        );
    };


    const handleQtyChange = (id, qty) => {
        setCartItems(prev =>
            prev.map(item =>
                item.id === id ? { ...item, quantity: Math.max(1, qty || 1) } : item
            )
        );
    };

    const handleSizeChange = (id, field, value) => {
        setCartItems(prev =>
            prev.map(item =>
                item.id === id ? { ...item, [field]: Math.max(0, value || 0) } : item
            )
        );
    };

    const handleRemove = (id) => {
        setCartItems(prev => prev.filter(item => item.id !== id));
    };

    const calculateSubtotal = (item) => {
        if (item.pricing_method === 'roll') {
            const area = (item.width || 0) * (item.height || 0);
            return item.price * area * item.quantity;
        } else {
            return item.price * item.quantity;
        }
    };

    const totalAmount = cartItems.reduce((sum, item) => sum + calculateSubtotal(item), 0);



    return (
        <>
            <Head title='Cart' />
            <Meta
                title="Your Cart - Printair"
                description="Review the items you've selected and proceed to checkout with Printair."
            />
            <Header />
            <Breadcrumb />

            <section className="tw-container tw-mx-auto tw-px-4 tw-py-6 tw-bg-gray-200/50 tw-rounded-lg tw-mb-5">
                <h5 className="tw-text-2xl tw-font-bold tw-mb-4 tw-text-[#f44032] tw-bg-white tw-ps-3 tw-py-3 tw-rounded-lg">Shopping Cart</h5>

                <div className="tw-grid tw-grid-cols-1 lg:tw-grid-cols-3 tw-gap-6">
                    {/* Left: Cart Items */}
                    <div className="lg:tw-col-span-2 tw-space-y-4">
                        {cartItems.length > 0 ? (
                            cartItems.map(item => (
                                <CartItem
                                    key={item.id}
                                    item={item}
                                    onQtyChange={handleQtyChange}
                                    onSizeChange={handleSizeChange}
                                    onRemove={handleRemove}
                                    onDesignChange={handleDesignChange}
                                />
                            ))
                        ) : (
                            <div className="tw-flex tw-flex-col tw-items-center tw-justify-center tw-text-center tw-py-16 tw-bg-gray-50 dark:tw-bg-gray-800 tw-rounded-xl">
                                <Icon
                                    icon="tabler:shopping-cart-off"
                                    className="tw-text-gray-400 dark:tw-text-gray-500 tw-text-7xl tw-mb-4 tw-animate-pulse"
                                />
                                <h5 className="tw-text-xl tw-font-semibold tw-text-gray-700 dark:tw-text-gray-200">
                                    Your cart is empty!
                                </h5>
                                <p className="tw-text-gray-500 dark:tw-text-gray-400 tw-mt-2 tw-mb-4">
                                    Looks like you haven't added anything yet.
                                </p>
                                <a
                                    href="/products"
                                    className="tw-inline-block tw-bg-[#f44032] tw-text-white tw-py-2 tw-px-6 tw-rounded-lg tw-shadow hover:tw-text-white hover:tw-bg-[#f44032]/90 transition"
                                >
                                    Browse Products
                                </a>
                            </div>

                        )}
                    </div>

                    {/* Right: Cart Summary */}
                    <div className="tw-bg-white tw-rounded-xl tw-shadow-md tw-p-4 tw-h-fit">
                        <h5 className="tw-text-lg tw-font-semibold tw-mb-4">Order Summary</h5>
                        {cartItems.length === 0 ? (
                            <div
                                className="tw-bg-white tw-rounded-xl tw-shadow-sm tw-p-6 tw-flex tw-flex-col tw-items-center tw-justify-center tw-text-center tw-h-full"
                                data-aos="fade-up"
                                data-aos-delay="100"
                            >
                                <Icon icon="mdi:cart-outline" className="tw-text-4xl tw-text-gray-300 dark:tw-text-gray-600 tw-mb-2" />

                                <h6 className="tw-text-lg tw-font-semibold tw-text-gray-700 dark:tw-text-gray-200">
                                    No items yet
                                </h6>

                                <p className="tw-text-sm tw-text-gray-500 dark:tw-text-gray-400 tw-mt-1">
                                    Add something to see your total here.
                                </p>

                                <Link
                                    href="/products"
                                    className="tw-inline-block tw-mt-4 tw-bg-[black] tw-text-white tw-py-2 tw-px-5 tw-rounded-lg hover:tw-bg-[#f44032] hover:tw-text-white transition"
                                    data-aos="zoom-in"
                                    data-aos-delay="300"
                                >
                                    Continue Shopping
                                </Link>
                            </div>

                        ) : (
                            <div
                                className="tw-bg-white tw-rounded-xl tw-p-6 tw-h-fit"
                                data-aos="fade-left"
                                data-aos-delay="100"
                            >

                                {/* Item Count */}
                                <div className="tw-flex tw-justify-between tw-text-sm tw-mb-2">
                                    <span className="tw-text-gray-600 dark:tw-text-gray-400">Items</span>
                                    <span className="tw-font-medium tw-text-gray-800 dark:tw-text-gray-200">
                                        {cartItems.length} {cartItems.length === 1 ? 'item' : 'items'}
                                    </span>
                                </div>

                                {/* Promo Code */}
                                <div className="tw-mt-4 tw-mb-4" data-aos="fade-up" data-aos-delay="200">
                                    <label htmlFor="promo" className="tw-text-sm tw-text-gray-600 dark:tw-text-gray-400 tw-block tw-mb-1">
                                        Promo Code
                                    </label>
                                    <div className="tw-flex tw-gap-2">
                                        <input
                                            type="text"
                                            id="promo"
                                            placeholder="Enter code"
                                            className="tw-flex-1 tw-border tw-border-gray-300 dark:tw-border-gray-700 tw-rounded-md tw-px-3 tw-py-1.5 tw-text-sm focus:tw-ring-primary focus:tw-outline-none"
                                        />
                                        <button className="tw-bg-gray-200 dark:tw-bg-gray-700 hover:tw-bg-gray-300 dark:hover:tw-bg-gray-600 tw-text-sm tw-px-3 tw-rounded-md tw-text-gray-800 dark:tw-text-white">
                                            Apply
                                        </button>
                                    </div>
                                </div>

                                {/* Price Breakdown */}
                                <div className="tw-space-y-2 tw-text-sm tw-mb-4" data-aos="fade-up" data-aos-delay="300">
                                    <div className="tw-flex tw-justify-between">
                                        <span className="tw-text-gray-500 dark:tw-text-gray-400">Subtotal</span>
                                        <span className="tw-text-gray-800 dark:tw-text-gray-200">Rs. {(totalAmount * 0.9).toFixed(2)}</span>
                                    </div>
                                    <div className="tw-flex tw-justify-between">
                                        <span className="tw-text-gray-500 dark:tw-text-gray-400">VAT (10%)</span>
                                        <span className="tw-text-gray-800 dark:tw-text-gray-200">Rs. {(totalAmount * 0.1).toFixed(2)}</span>
                                    </div>
                                    <div className="tw-flex tw-justify-between tw-font-semibold">
                                        <span className="tw-text-gray-700 dark:tw-text-gray-100">Total</span>
                                        <span className="tw-text-primary tw-font-bold tw-text-base">Rs. {totalAmount.toFixed(2)}</span>
                                    </div>
                                </div>

                                {/* Checkout */}
                                <button
                                    onClick={() => router.visit('/checkout')}
                                    className="tw-w-full tw-text-center tw-bg-[#f44032] tw-text-white tw-py-2 tw-rounded-lg tw-font-medium hover:tw-bg-[#f44032]/90 hover:tw-text-white transition"
                                    data-aos="zoom-in"
                                    data-aos-delay="400"
                                >
                                    Proceed to Checkout
                                </button>

                                <p className='tw-text-xs tw-text-gray-400 dark:tw-text-gray-500 tw-mt-3 text-center'>OR</p>

                                {/* Continue Shopping */}
                                <Link
                                    href="/products"
                                    className="tw-block tw-text-sm tw-text-center tw-mt-2 tw-py-1 tw-text-black tw-rounded-md tw-border-4 tw-border-black hover:tw-bg-black hover:tw-text-white"
                                    data-aos="fade-up"
                                    data-aos-delay="500"
                                >
                                    Continue Shopping
                                </Link>

                                {/* Note */}
                                <p className="tw-text-xs tw-text-gray-400 dark:tw-text-gray-500 tw-mt-3 text-center">
                                    Shipping & taxes calculated at checkout
                                </p>
                            </div>

                        )}
                    </div>
                </div>
            </section>

            <CookieConsent />
            <Footer popularProducts={popularProducts} />
        </>
    );
}

export default cart;

