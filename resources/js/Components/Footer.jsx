import React from 'react';
import { Icon } from '@iconify/react';

const Footer = ({ popularProducts = [] }) => {
    return (
        <footer className="tw-bg-black tw-text-white tw-pt-20 tw-pb-8 tw-px-4 tw-relative z-10">
            <div className="tw-px-16 tw-mx-auto tw-grid md:tw-grid-cols-4 tw-gap-10 tw-border-b tw-border-gray-700 tw-pb-10">

                {/* LOGO + ABOUT */}
                <div>
                    <h3 className="tw-text-2xl tw-font-bold tw-mb-4 tw-text-white">Printair <span className='tw-text-[#f44032] tw-mt-5'>Advertising</span></h3>
                    <p className="tw-text-gray-400 tw-text-sm">
                        We deliver creative, high-quality printing and advertising solutions to businesses and individuals across Sri Lanka.
                    </p>
                    <div className="tw-mt-6">
                        <p className="tw-flex tw-items-center tw-gap-2 tw-text-gray-400 tw-text-sm">
                            <Icon icon="mdi:map-marker" className="tw-text-lg tw-text-[#f44032]" />
                            No. 67/D/1, Uggashena, Walpola, Ragama, Sri Lanka
                        </p>
                        <p className="tw-flex tw-items-center tw-gap-2 tw-text-gray-400 tw-text-sm tw-mt-2">
                            <Icon icon="mdi:phone" className="tw-text-lg tw-text-[#f44032]" />
                            +94 76 886 0175 | (011) 224 1858
                        </p>
                        <p className="tw-flex tw-items-center tw-gap-2 tw-text-gray-400 tw-text-sm tw-mt-2">
                            <Icon icon="mdi:email" className="tw-text-lg tw-text-[#f44032]" />
                            contact@printair.lk
                        </p>
                    </div>
                </div>

                {/* QUICK LINKS */}
                <div>
                    <h4 className="tw-text-lg tw-font-semibold tw-mb-3 tw-text-white">Quick Links</h4>
                    <ul className="tw-space-y-2 tw-text-sm tw-text-gray-500">
                        <li><a href="/" className="hover:tw-text-white">Home</a></li>
                        <li><a href="/products" className="hover:tw-text-white">Products</a></li>
                        <li><a href="/about" className="hover:tw-text-white">About Us</a></li>
                        <li><a href="/contact" className="hover:tw-text-white">Contact</a></li>
                    </ul>
                </div>

                {/* POPULAR PRODUCTS */}
                <div>
                    <h4 className="tw-text-lg tw-font-semibold tw-mb-3 tw-text-white">Popular Products</h4>
                    <ul className="tw-space-y-2 tw-text-sm tw-text-gray-500">
                        {popularProducts.map((product, index) => (
                            <li key={index}>
                                <a href={`/products/${product.slug}`} className="hover:tw-text-white">
                                    {product.name}
                                </a>
                            </li>
                        ))}
                    </ul>
                </div>


                {/* SERVICES */}
                <div>
                    <h4 className="tw-text-lg tw-font-semibold tw-mb-3 tw-text-white">Design Services</h4>
                    <ul className="tw-space-y-2 tw-text-sm tw-text-gray-500">
                        <li>Logo Design</li>
                        <li>Branding</li>
                        <li>Packaging Design</li>
                        <li>3D Visualization</li>
                        <li>Social Media Designs</li>
                    </ul>
                </div>

                {/* SOCIAL + NEWSLETTER */}
                <div className="tw-flex tw-flex-col tw-gap-4">
                    <h4 className="tw-text-lg tw-font-semibold tw-text-white">Stay Connected</h4>

                    {/* Social Icons */}
                    <div className="tw-flex tw-space-x-3">
                        <a href="#" className="tw-bg-white/10 hover:tw-bg-white/20 tw-p-2 tw-rounded-full">
                            <Icon icon="mdi:facebook" className="tw-text-xl" />
                        </a>
                        <a href="#" className="tw-bg-white/10 hover:tw-bg-white/20 tw-p-2 tw-rounded-full">
                            <Icon icon="mdi:instagram" className="tw-text-xl" />
                        </a>
                        <a href="#" className="tw-bg-white/10 hover:tw-bg-white/20 tw-p-2 tw-rounded-full">
                            <Icon icon="mdi:twitter" className="tw-text-xl" />
                        </a>
                        <a href="#" className="tw-bg-white/10 hover:tw-bg-white/20 tw-p-2 tw-rounded-full">
                            <Icon icon="mdi:linkedin" className="tw-text-xl" />
                        </a>
                    </div>

                    {/* Newsletter Input Group */}
                    <form className="tw-flex tw-border tw-border-gray-600 tw-rounded overflow-hidden">
                        <input
                            type="email"
                            placeholder="Email address"
                            className="tw-bg-transparent tw-px-3 tw-py-2 tw-flex-1 tw-text-sm tw-text-white placeholder:tw-text-gray-400 focus:tw-outline-none"
                        />
                        <button
                            type="submit"
                            className="tw-bg-[#f44032] tw-text-white tw-px-4 tw-text-sm hover:tw-bg-red-600 tw-transition"
                        >
                            Subscribe
                        </button>
                    </form>
                </div>

            </div>

            {/* COPYRIGHT & SIGNATURE */}
            <div className="tw-text-center tw-text-xs tw-text-gray-500 tw-mt-8">
                <p>&copy; {new Date().getFullYear()} Printair Advertising. All rights reserved.</p>
                <p className="tw-mt-1">Designed and Developed by <span className="tw-text-white">Thejan Vishmitha</span></p>
            </div>
        </footer>
    );
};

export default Footer;
