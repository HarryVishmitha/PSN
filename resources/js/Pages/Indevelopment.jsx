import React from 'react';
import { Head, Link } from '@inertiajs/react';
import Header from '@/Components/Header';
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

const Indevelopment = () => {

    const popularProducts = [
        { name: 'X-Banners', slug: 'x-banners' },
        { name: 'Pull-Up Banners', slug: 'pull-up-banners' },
        { name: 'Custom T-Shirts', slug: 'custom-t-shirts' },
        { name: 'Business Cards', slug: 'business-cards' },
        { name: 'Poster Printing', slug: 'poster-printing' },
    ];

    useEffect(() => {
        AOS.init({
            duration: 1000,
            once: true,
        });
        return () => {
            AOS.refreshHard(); // Or simply remove AOS class manually
        };
    }, []);

    return (
        <>
            <Head title='Development Area' />
            <Meta
                title="Development Area - Printair"
                description="Currently under development. Stay tuned for updates!"
            />
            <Header />
            <Breadcrumb items={[
                { label: 'Cart', href: '/cart' },
            ]} />

            <section className="tw-py-10 tw-bg-white">
                <div className="tw-container tw-mx-auto tw-px-4">
                    
                    <div className="tw-text-center tw-mt-10">
                        <h1 className="tw-text-3xl tw-font-bold tw-text-gray-800">This Page is Under Development</h1>
                        <p className="tw-text-gray-600 tw-mt-4">We are working hard to bring you new features. Stay tuned!</p>
                    </div>
                </div>
            </section>

            <CookieConsent />
            <Footer popularProducts={popularProducts} />
        </>
    );
}

export default Indevelopment;
