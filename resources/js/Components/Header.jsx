import React, { useState, useEffect, useRef } from 'react';
import { Link, usePage } from '@inertiajs/react';

const Header = () => {
    const { auth } = usePage().props;
    const [mobileNavOpen, setMobileNavOpen] = useState(false);
    const overlayRef = useRef();

    const navLinks = [
        'Business Stationery',
        'Marketing Materials',
        'Large Format',
        'Promotional',
        'Photo Products',
        'Labels & Stickers',
        'Booklet & Copies',
    ];

    // Close when clicking outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (mobileNavOpen && overlayRef.current && !overlayRef.current.contains(e.target)) {
                setMobileNavOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [mobileNavOpen]);

    const [navCategories, setNavCategories] = useState([]);
    const [navLoading, setNavLoading] = useState(false);
    const [navError, setNavError] = useState(null);

    const fetchNavCategories = async () => {
        try {
            const response = await axios.get('/api/nav-categories');
            const data = response.data;

            if (data.success) {
                setNavCategories(data.data); // nav categories data
                console.log('Navigation categories loaded:', data.data);
            } else {
                // Backend responded but with success: false
                setNavError(data.message || 'Failed to load navigation categories.');
            }
        } catch (err) {
            // Network or other axios error
            setNavError(err.message || 'Something went wrong.');
        } finally {
            setNavLoading(false);
        }
    };

    useEffect(() => {
        setNavLoading(true);
        const timer = setTimeout(() => {
            fetchNavCategories();
        }, 500);
        return () => clearTimeout(timer);
    }, []);

    return (
        <header className="tw-bg-white tw-shadow-md tw-sticky tw-top-0 tw-z-50">
            {/* Top Bar */}
            <div className="tw-container tw-mx-auto tw-flex tw-justify-between tw-items-center tw-px-3 tw-py-4">
                <Link href="/" className="tw-flex tw-items-center tw-space-x-2">
                    <img src="/assets/images/logo-full.png" alt="Printair Logo" className="tw-h-14" />
                    {/* <span className="tw-font-bold tw-text-[27px] tw-text-gray-800">Printair</span> */}
                </Link>

                <div className="tw-hidden md:tw-flex tw-items-center tw-space-x-6">
                    <Link href="#" className="tw-text-gray-500 hover:tw-text-[#f44032]">
                        <i className="fa-solid fa-file-pen tw-me-1"></i> Ask for Quote
                    </Link>
                    <Link href={route('cart')} className="tw-relative tw-text-gray-500 hover:tw-text-[#f44032]">
                        <span className="tw-absolute tw-text-xs tw-bg-red-500 tw-text-white tw-rounded-full tw-px-1.5 tw--top-2 tw--right-2">5</span>
                        <i className="fa-solid fa-cart-shopping tw-me-1"></i> Cart
                    </Link>
                    {!auth.user ? (
                        <Link href={route('login')} className="tw-text-gray-500 hover:tw-text-[#f44032]">
                            <i className="fas fa-user tw-me-1"></i> Login
                        </Link>
                    ) : (
                        <Link href={route('dashboard')} className="tw-text-gray-500 hover:tw-text-[#f44032]">
                            <i className="fas fa-tachometer-alt tw-me-1"></i> Dashboard
                        </Link>
                    )}
                </div>

                {/* Mobile Nav Toggle */}
                <button
                    onClick={() => setMobileNavOpen(true)}
                    className="tw-block md:tw-hidden tw-text-gray-600 tw-text-xl"
                >
                    <i className="fas fa-bars"></i>
                </button>
            </div>

            <hr className="tw-border-gray-500" />

            {/* Desktop Navigation */}
            <div className="tw-w-full tw-hidden md:tw-flex tw-justify-center tw-py-3 tw-text-sm">
                <nav className="tw-flex tw-gap-6">
                    <Link key={'all'} href={route('products.all')} className='tw-group tw-relative tw-pb-1 tw-text-gray-500 hover:tw-text-[#f44032] tw-transition tw-duration-300'>
                        All Products
                        <span className="tw-absolute tw-w-full tw-h-[2px] tw-rounded tw-bg-[#f44032] tw-transform tw-scale-x-0 tw-origin-center tw-transition-transform tw-duration-300 tw-bottom-0 group-hover:tw-scale-x-100 tw-left-0"></span>
                    </Link>

                    {navLoading ? (
                        [...Array(7)].map((_, idx) => (
                            <div
                                key={idx}
                                className="tw-w-[100px] tw-h-[15px] tw-rounded-xl tw-bg-gray-300 tw-animate-pulse tw-flex-shrink-0"
                            />
                        ))
                    ) : (

                        navCategories.map((category, idx) => (
                            <div className="tw-relative tw-group" key={idx}>
                                <Link
                                    key={idx}
                                    href="#"
                                    className="tw-group tw-relative tw-pb-1 tw-text-gray-500 hover:tw-text-[#f44032] tw-transition tw-duration-300"
                                >
                                    {category.category.name}

                                    <span className="tw-absolute tw-w-full tw-h-[2px] tw-rounded tw-bg-[#f44032] tw-transform tw-scale-x-0 tw-origin-center tw-transition-transform tw-duration-300 tw-bottom-0 group-hover:tw-scale-x-100 tw-left-0"></span>

                                </Link>
                                {/* Dropdown */}
                                <div className="tw-absolute tw-left-0 tw-z-50 tw-mt-5 tw-text-gray-500 tw-bg-white tw-shadow-lg tw-rounded-md tw-opacity-0 tw-invisible group-hover:tw-visible group-hover:tw-opacity-100 tw-transition-all tw-duration-300">
                                    {Array.isArray(category.category.products) && category.category.products.length > 0 ? (
                                        <ul className="tw-p-4 tw-w-[500px]">
                                            {Array.isArray(category.category.products) && category.category.products.slice(0, 6).map((product, index) => (
                                                <>
                                                    <li key={index} className="tw-py-2 tw-text-sm hover:tw-text-[#f44032] tw-transition">
                                                        <Link href={`/products/${product.slug}`}>{product.name}</Link>
                                                    </li>
                                                </>
                                            ))}
                                        </ul>
                                    ) : (
                                        <div className="tw-p-4 tw-w-64">
                                            <p className="tw-py-2 tw-text-sm">No products found.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))

                    )}
                </nav>
            </div>



            {mobileNavOpen && (
                <div className="tw-fixed tw-inset-0 tw-bg-black/50 tw-z-50 tw-flex tw-justify-end">
                    <div
                        ref={overlayRef}
                        className="tw-bg-white tw-w-[85%] tw-max-w-xs tw-h-full tw-p-6 tw-relative tw-animate-slide-in-right"
                    >
                        {/* Close Button */}
                        <button
                            onClick={() => setMobileNavOpen(false)}
                            className="tw-absolute tw-top-4 tw-right-4 tw-text-gray-600 hover:tw-text-[#f44032]"
                            aria-label="Close menu"
                        >
                            <i className="fas fa-times tw-text-xl"></i>
                        </button>

                        {/* Main Nav Links */}
                        <nav className="tw-mt-12 tw-grid tw-gap-4">
                            {navLoading ? (
                                [...Array(10)].map((_, idx) => (
                                    <div
                                        key={idx}
                                        className="tw-w-[100%] tw-h-[15px] tw-rounded-xl tw-bg-gray-300 tw-animate-pulse tw-flex-shrink-0"
                                    />
                                ))
                            ) : navCategories.length === 0 ? (
                                <div className="tw-text-gray-500 tw-py-2 tw-text-center">
                                    There are no categories to show.
                                </div>
                            ) : (
                                navCategories.map((category, idx) => (
                                    <Link
                                        key={idx}
                                        href="#"
                                        className="tw-group tw-relative tw-pb-1 tw-text-gray-500 hover:tw-text-[#f44032] tw-transition tw-duration-300"
                                    >
                                        {category.category.name}
                                        <span className="tw-absolute tw-w-full tw-h-[2px] tw-rounded tw-bg-[#f44032] tw-transform tw-scale-x-0 tw-origin-center tw-transition-transform tw-duration-300 tw-bottom-0 group-hover:tw-scale-x-100 tw-left-0"></span>
                                    </Link>
                                ))
                            )}
                        </nav>
                        {/* Divider + CTA Links */}
                        <div className="tw-border-t tw-my-6 tw-pt-4 tw-grid tw-gap-4">
                            <Link
                                href="#"
                                className="tw-text-gray-600 hover:tw-text-[#f44032] tw-flex tw-items-center tw-gap-2"
                                onClick={() => setMobileNavOpen(false)}
                            >
                                <i className="fa-solid fa-file-pen"></i> Ask For Quote
                            </Link>
                            <Link
                                href={route('cart')}
                                className="tw-text-gray-600 hover:tw-text-[#f44032] tw-flex tw-items-center tw-gap-2"
                                onClick={() => setMobileNavOpen(false)}
                            >
                                <i className="fa-solid fa-cart-shopping"></i> Cart
                            </Link>
                            {!auth.user ? (
                                <Link
                                    href={route('login')}
                                    className="tw-text-gray-600 hover:tw-text-[#f44032] tw-flex tw-items-center tw-gap-2"
                                    onClick={() => setMobileNavOpen(false)}
                                >
                                    <i className="fas fa-user"></i> Login
                                </Link>
                            ) : (
                                <Link
                                    href={route('dashboard')}
                                    className="tw-text-gray-600 hover:tw-text-[#f44032] tw-flex tw-items-center tw-gap-2"
                                    onClick={() => setMobileNavOpen(false)}
                                >
                                    <i className="fas fa-tachometer-alt"></i> Dashboard
                                </Link>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </header>
    );
};

export default Header;
