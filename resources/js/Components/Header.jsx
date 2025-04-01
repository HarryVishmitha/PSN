import React from 'react';
import { Head, Link, usePage } from '@inertiajs/react';

const Header = () => {
    const { auth } = usePage().props;  // Destructure the auth data from the page props

    return (
        <header className="tw-bg-white tw-shadow-md tw-py-4 tw-sticky tw-top-0">
            <div className="tw-container tw-mx-auto tw-flex tw-justify-between tw-items-center tw-px-3 tw-pb-4">
                {/* Right Side */}
                <Link href="/">
                    <div className="tw-flex tw-items-center tw-space-x-2">
                        <img src="/images/favicon.png" alt="Logo" className="tw-w-10 tw-h-10" />
                        <span className="tw-font-bold tw-text-[27px]">Printair</span>
                    </div>
                </Link>

                {/* Left Side */}
                <div className="tw-flex tw-items-center tw-space-x-5">
                    <Link href="#" className="tw-text-gray-400 hover:tw-text-[#f44032] tw-text-[17px]">
                        <i className="fa-solid fa-file-pen"></i> Ask For Quote
                    </Link>
                    <Link href="#" className="tw-text-gray-400 hover:tw-text-[#f44032] tw-text-[17px] tw-relative tw-text-md">
                        <span className="tw-absolute tw-w-5 tw-h-5 tw-text-center tw-align-middle tw-p-1 tw-text-xs tw-bg-red-500 tw-rounded-full tw--right-3 tw--top-3.5 tw-text-white tw-leading">5</span>
                        <i className="fa-solid fa-cart-shopping"></i> Cart
                    </Link>
                    {/* Conditionally show login or dashboard link */}
                    {!auth.user ? (
                        <Link href={route('login')} className="tw-text-gray-400 hover:tw-text-[#f44032] tw-text-[17px]">
                            <i className="fas fa-user"></i> Login
                        </Link>
                    ) : (
                        <Link href={route('dashboard')} className="tw-text-gray-400 hover:tw-text-[#f44032] tw-text-[17px]">
                            <i className="fas fa-tachometer-alt"></i> Dashboard
                        </Link>
                    )}
                </div>
            </div>
            <hr />
            <div className="tw-container tw-mx-auto tw-flex tw-justify-center tw-items-center tw-px-6 tw-pt-3">
                {/* Navigation Links */}
                <div className="tw-hidden md:tw-flex tw-space-x-6 tw-text-sm">
                    <Link href="#" className="tw-text-gray-400 hover:tw-text-[#f44032]">All Products</Link>
                    <Link href="#" className="tw-text-gray-400 hover:tw-text-[#f44032]">Business Stationery</Link>
                    <Link href="#" className="tw-text-gray-400 hover:tw-text-[#f44032]">Marketing Materials</Link>
                    <Link href="#" className="tw-text-gray-400 hover:tw-text-[#f44032]">Large Format</Link>
                    <Link href="#" className="tw-text-gray-400 hover:tw-text-[#f44032]">Promotional</Link>
                    <Link href="#" className="tw-text-gray-400 hover:tw-text-[#f44032]">Photo Products</Link>
                    <Link href="#" className="tw-text-gray-400 hover:tw-text-[#f44032]">Labels & Stickers</Link>
                    <Link href="#" className="tw-text-gray-400 hover:tw-text-[#f44032]">Booklet & Copies</Link>
                </div>
            </div>
        </header>
    );
};

export default Header;
