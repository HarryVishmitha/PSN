import React from 'react';
import { Head, Link } from '@inertiajs/react';
import Header from '../components/Header';
import CookieConsent from '@/Components/CookieConsent';
import { useState, useEffect, useRef } from 'react';
import { Icon } from "@iconify/react";
import AOS from 'aos';
import 'aos/dist/aos.css';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Typewriter } from 'react-simple-typewriter';
import Offers from '@/Components/Offers';


const Home = () => {
    gsap.registerPlugin(ScrollTrigger);

    const [theme, setTheme] = useState('light');
    const containerRef = useRef(null);
    const scrollRef = useRef(null);
    const [isMobile, setIsMobile] = useState(false);
    const [count, setCount] = useState(0);
    const counterRef = useRef(null);
    const [hasAnimated, setHasAnimated] = useState(false);


    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting && !hasAnimated) {
                    let current = 0;
                    const target = 500;
                    const increment = 5;
                    const speed = 20;

                    const interval = setInterval(() => {
                        current += increment;
                        if (current >= target) {
                            current = target;
                            clearInterval(interval);
                        }
                        setCount(current);
                    }, speed);

                    setHasAnimated(true);
                }
            },
            { threshold: 0.6 }
        );

        if (counterRef.current) {
            observer.observe(counterRef.current);
        }

        return () => {
            if (counterRef.current) {
                observer.unobserve(counterRef.current);
            }
        };
    }, [hasAnimated]);

    useEffect(() => {
        const checkScreen = () => {
            setIsMobile(window.innerWidth < 768); // Tailwind's md breakpoint
        };
        checkScreen();
        window.addEventListener('resize', checkScreen);
        return () => window.removeEventListener('resize', checkScreen);
    }, []);
    useEffect(() => {
        if (!containerRef.current) return;

        const updateWidth = () => {
            const width = containerRef.current.offsetWidth;
            console.log('Container width:', width);
            // do something with `width`
        };

        updateWidth(); // call on mount
        window.addEventListener('resize', updateWidth);
        return () => window.removeEventListener('resize', updateWidth);
    }, []);




    // Various data that needs in this component please call them once designs complete
    const categories = [
        { name: 'Business Cards', image: 'https://placehold.co/160x180' },
        { name: 'Flyers', image: 'https://picsum.photos/160/180' },
        { name: 'Posters', image: 'https://picsum.photos/200/300' },
        { name: 'T-Shirts', image: 'https://picsum.photos/160/180' },
        { name: 'Labels', image: 'https://picsum.photos/160/180' },
        { name: 'Stickers', image: 'https://picsum.photos/160/180' },
        { name: 'Mugs', image: 'https://picsum.photos/160/180' },
        { name: 'Banners', image: 'https://picsum.photos/160/180' },
        { name: 'Booklets', image: 'https://picsum.photos/160/180' },
        { name: 'Envelopes', image: 'https://picsum.photos/160/180' },
        { name: 'Calendars', image: 'https://picsum.photos/160/180' },
        { name: 'Brochures', image: 'https://picsum.photos/160/180' },
    ];

    // Trending products data array
    const trendingProducts = [
        {
            name: 'Custom Mugs',
            desc: 'Your design, our quality. Your design, our quality. Your design, our quality. Your design, our quality.',
            image: 'https://picsum.photos/id/1011/400/300',
            badge: 'New',
            price: '12.99',
            rating: 4.5,
            stock: 12,
            tags: ['Customizable', 'Eco-friendly'],
            views: 1280,
            discount: '-10%',
            link: '/products/custom-mugs',
        },
        {
            name: 'Posters',
            desc: 'Make a bold statement. Make a bold statement. Make a bold statement. Make a bold statement.',
            image: 'https://picsum.photos/id/1018/400/300',
            price: '7.99',
            rating: 4.0,
            stock: 5,
            tags: ['Bold'],
            views: 800,
            discount: '',
            link: '/products/posters',
        },
        {
            name: 'Business Cards',
            desc: 'Professional first impression. Professional first impression. Professional first impression. Professional first impression.',
            image: 'https://picsum.photos/id/1025/400/300',
            badge: 'Hot',
            price: '19.99',
            rating: 4.9,
            stock: 2,
            tags: ['Premium', 'Fast Delivery'],
            views: 1895,
            discount: '-15%',
            link: '/products/business-cards',
        },
    ];

    useEffect(() => {
        AOS.init({
            duration: 1000,
            once: true,
        });
    }, []);

    const updateThemeOnHtmlEl = (theme) => {
        document.documentElement.setAttribute('data-theme', theme);
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    };

    useEffect(() => {
        updateThemeOnHtmlEl('light');
        localStorage.setItem('theme', 'light');
    }, []);

    // verticall scroll for horizontal scrolling section
    useEffect(() => {
        // Clean up all existing ScrollTriggers before setting up new ones
        ScrollTrigger.getAll().forEach(trigger => trigger.kill());

        // Only apply GSAP scroll effect on desktop
        if (!isMobile && scrollRef.current && containerRef.current) {
            const scrollWidth = scrollRef.current.scrollWidth;
            const containerWidth = containerRef.current.offsetWidth;
            const scrollDistance = scrollWidth - containerWidth;

            gsap.to(scrollRef.current, {
                x: () => `-${scrollDistance}px`,
                ease: 'none',
                scrollTrigger: {
                    trigger: containerRef.current,
                    start: 'center center',
                    end: () => `+=${scrollDistance}`,
                    scrub: true,
                    pin: true,
                    anticipatePin: 1,
                    invalidateOnRefresh: true, // responsive!
                },
            });
        }

        // Cleanup on unmount or when isMobile changes
        return () => {
            ScrollTrigger.getAll().forEach(trigger => trigger.kill());
        };
    }, [isMobile]);


    // Slogan section
    const sloganRef = useRef(null);

    useEffect(() => {
        const ctx = gsap.context(() => {
            gsap.fromTo(
                sloganRef.current,
                { opacity: 0, y: 10 },
                {
                    opacity: 1,
                    y: 0,
                    duration: 1.5,
                    repeat: -1,
                    yoyo: true,
                    ease: 'power2.inOut',
                }
            );
        });

        return () => ctx.revert();
    }, []);



    return (
        <>
            <Head title="Home" />
            <Header />

            {/* Hero section */}
            <section className="tw-bg-gradient-to-r tw-from-[#ffffff] tw-to-[#f0f4ff] tw-py-16 md:tw-py-24 tw-relative tw-overflow-hidden">
                <div className="tw-container tw-mx-auto tw-grid md:tw-grid-cols-2 tw-gap-12 tw-items-center tw-px-6">
                    {/* Left Text Content */}
                    <div data-aos="fade-right" data-aos-delay="100" data-aos-duration="800">
                        <h1 className="tw-text-4xl md:tw-text-5xl tw-font-extrabold tw-text-gray-800 tw-leading-tight tw-mb-6">
                            Bring Your <span className="tw-text-[#f44032]">Print Ideas</span> to Life
                        </h1>
                        <p className="tw-text-gray-600 tw-text-lg tw-mb-8 tw-leading-relaxed" data-aos="fade-up" data-aos-delay="300">
                            Explore high-quality custom printing solutions for all your business and personal needs — fast delivery, stunning results.
                        </p>
                        <div className="tw-flex tw-flex-wrap tw-gap-4">
                            <Link
                                href="#"
                                className="tw-bg-[#f44032] tw-text-white tw-px-6 tw-py-3 tw-rounded-lg tw-shadow hover:tw-bg-red-600 tw-transition"
                                data-aos="fade-up"
                                data-aos-delay="400"
                            >
                                Start Designing
                            </Link>
                            <Link
                                href="#"
                                className="tw-border tw-border-[#f44032] tw-text-[#f44032] tw-px-6 tw-py-3 tw-rounded-lg hover:tw-bg-[#f44032] hover:tw-text-white tw-transition"
                                data-aos="fade-up"
                                data-aos-delay="500"
                            >
                                Ask for Quote
                            </Link>
                        </div>
                    </div>

                    {/* Right Image Content */}
                    <div className="tw-relative tw-z-10" data-aos="zoom-in-left" data-aos-delay="200">
                        <div className="tw-absolute tw-bg-[#f44032]/10 tw-w-[300px] tw-h-[300px] tw-rounded-full tw-z-0 tw-top-[-60px] tw-left-[-60px] tw-blur-3xl"></div>
                        <img
                            src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTbPIQpemZv2uJF4Qm4S9Ke9HA-rqy-uCNjsg&s"
                            alt="Hero Preview"
                            className="tw-relative tw-z-10 tw-w-full tw-max-w-md tw-mx-auto tw-rounded-xl tw-shadow-lg"
                        />
                    </div>
                </div>
            </section>



            {/*  */}
            {/*  */}
            {/*  */}
            {/* Famous categories section */}
            {isMobile ? (
                // Mobile
                <section className="tw-bg-white tw-py-10 tw-mb-20">
                    <div className="tw-container tw-px-4">
                        <h2 className="tw-text-2xl tw-font-bold tw-mb-6">Popular Categories</h2>
                    </div>

                    <div className="tw-relative tw-overflow-hidden">
                        <div
                            ref={scrollRef}
                            className="tw-flex tw-gap-4 tw-px-4 tw-transition-all tw-duration-500 tw-scroll-smooth"
                            style={{ overflowX: 'auto', scrollBehavior: 'smooth' }}
                        >
                            {categories.map((cat, idx) => (
                                <div
                                    key={idx}
                                    className="category-card tw-w-[160px] tw-h-[200px] tw-rounded-xl tw-overflow-hidden tw-shadow-lg tw-relative tw-flex-shrink-0"
                                >
                                    <img
                                        src={cat.image}
                                        alt={cat.name}
                                        className="tw-w-full tw-h-full tw-object-cover"
                                    />
                                    <div className="tw-absolute tw-inset-0 tw-bg-black/30 tw-flex tw-items-center tw-justify-center">
                                        <span className="tw-text-white tw-font-semibold tw-text-center tw-text-lg">{cat.name}</span>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Arrows */}
                        <button
                            className="tw-absolute tw-left-2 tw-top-1/2 -tw-translate-y-1/2 tw-bg-white tw-shadow tw-rounded-full tw-p-2"
                            onClick={() => scrollRef.current.scrollBy({ left: -180, behavior: 'smooth' })}
                        >
                            <Icon icon="ic:round-chevron-left" className="tw-text-xl" />
                        </button>
                        <button
                            className="tw-absolute tw-right-2 tw-top-1/2 -tw-translate-y-1/2 tw-bg-white tw-shadow tw-rounded-full tw-p-2"
                            onClick={() => scrollRef.current.scrollBy({ left: 180, behavior: 'smooth' })}
                        >
                            <Icon icon="ic:round-chevron-right" className="tw-text-xl" />
                        </button>
                    </div>
                </section>
            ) : (
                // Desktop
                <section ref={containerRef} className="tw-relative tw-bg-white tw-overflow-hidden tw-py-10">
                    <div className="tw-container tw-px-4">
                        <h2 className="tw-text-xl tw-font-bold tw-mb-8">Popular Categories</h2>
                    </div>
                    <div ref={scrollRef} className="tw-flex tw-gap-4 tw-px-4">
                        {categories.map((cat, idx) => (
                            <div
                                key={idx}
                                className="category-card tw-w-[160px] tw-h-[200px] tw-rounded-xl tw-overflow-hidden tw-shadow-lg tw-relative tw-flex-shrink-0"
                            >
                                <img
                                    src={cat.image}
                                    alt={cat.name}
                                    className="tw-w-full tw-h-full tw-object-cover"
                                />
                                <div className="tw-absolute tw-inset-0 tw-bg-black/30 tw-flex tw-items-center tw-justify-center">
                                    <span className="tw-text-white tw-font-semibold tw-text-center tw-text-lg">{cat.name}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            )}


            {/*  */}
            {/*  */}
            {/*  */}
            {/* Trending products */}
            <section className="tw-bg-[#f9f9f9] tw-py-16">
                <div className="tw-mx-auto tw-px-4">
                    {/* Section Header */}
                    <h2
                        className="tw-text-3xl md:tw-text-4xl tw-font-bold tw-mb-12"
                        data-aos="fade-up"
                    >
                        Trending Products
                    </h2>

                    {/* Product Grid */}
                    <div className="tw-grid tw-gap-8 sm:tw-grid-cols-2 lg:tw-grid-cols-3">
                        {trendingProducts.map((product, idx) => (
                            <div
                                key={idx}
                                className="tw-bg-white tw-rounded-xl tw-shadow-md hover:tw-shadow-xl tw-transition-all tw-flex tw-flex-col tw-h-full tw-border"
                                data-aos="fade-up"
                                data-aos-delay={idx * 150}
                            >

                                <a href={product.link} className="tw-block">
                                    <div className="tw-relative tw-overflow-hidden">
                                        <img
                                            src={product.image}
                                            alt={product.name}
                                            className="tw-w-full tw-h-56 tw-object-cover tw-transition-transform tw-duration-300 hover:tw-scale-105"
                                        />
                                        {product.badge && (
                                            <span className="tw-absolute tw-top-2 tw-left-2 tw-bg-red-500 tw-text-white tw-text-xs tw-px-2 tw-py-1 tw-rounded">
                                                {product.badge}
                                            </span>
                                        )}
                                        {product.discount && (
                                            <span className="tw-absolute tw-top-2 tw-right-2 tw-bg-green-500 tw-text-white tw-text-xs tw-px-2 tw-py-1 tw-rounded">
                                                {product.discount}
                                            </span>
                                        )}
                                    </div>
                                </a>

                                <div className="tw-p-5 tw-flex tw-flex-col tw-flex-1 tw-h-full">
                                    <h3 className="tw-text-xl tw-font-semibold tw-leading-tight tw-mb-1 tw-line-clamp-1">
                                        <Link href={product.link}>{product.name}</Link>
                                    </h3>

                                    <div className="tw-flex tw-items-center tw-mb-1">
                                        {[...Array(5)].map((_, i) => (
                                            <svg
                                                key={i}
                                                className={`tw-w-4 tw-h-4 tw-fill-current ${i < Math.floor(product.rating) ? 'tw-text-yellow-400' : 'tw-text-gray-300'}`}
                                                viewBox="0 0 20 20"
                                            >
                                                <path d="M10 15l-5.878 3.09 1.123-6.545L.49 6.91l6.564-.955L10 0l2.946 5.955 6.564.955-4.755 4.635 1.123 6.545z" />
                                            </svg>
                                        ))}
                                        <span className="tw-text-sm tw-text-gray-500 tw-ml-2">({product.views.toLocaleString()} views)</span>
                                    </div>

                                    <p className="tw-text-gray-600 tw-text-sm tw-mb-2 tw-line-clamp-3">
                                        {product.desc}
                                    </p>
                                    <div className="tw-flex tw-items-center tw-justify-between tw-mt-auto">
                                        <div>
                                            <span className="tw-font-bold tw-text-[#f44032] tw-text-sm">LKR {product.price}</span>
                                            <span className="tw-text-xs tw-text-gray-400 tw-ml-2">{product.stock <= 5 ? `Only ${product.stock} left!` : 'In Stock'}</span>
                                        </div>
                                        <button className="tw-bg-[#f44032] tw-text-white tw-px-4 tw-py-2 tw-rounded hover:tw-bg-red-600 tw-text-sm tw-transition">
                                            Order Now
                                        </button>
                                    </div>

                                    <div className="tw-mt-3 tw-flex tw-flex-wrap tw-gap-1 tw-overflow-hidden tw-max-h-[50px]">
                                        {product.tags.map((tag, i) => (
                                            <span
                                                key={i}
                                                className="tw-bg-gray-100 tw-text-gray-600 tw-text-xs tw-px-2 tw-py-1 tw-rounded"
                                            >
                                                #{tag}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>



            {/*  */}
            {/*  */}
            {/*  */}
            {/* Why choose us */}
            <section
                className="tw-relative tw-w-full tw-py-24 tw-bg-cover tw-bg-center tw-bg-no-repeat"
                style={{ backgroundImage: "url('https://plus.unsplash.com/premium_photo-1667128695914-d97b26e1d013?q=80&w=870&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D')" }} // Replace with your actual image path
            >
                {/* Overlay for better text readability */}
                <div className="tw-absolute tw-inset-0 tw-bg-white/80 md:tw-bg-white/70 tw-backdrop-blur-sm"></div>

                {/* Main content */}
                <div className="tw-relative tw-mx-auto tw-max-w-7xl tw-px-4">
                    <h2
                        className="tw-text-4xl md:tw-text-5xl tw-font-bold tw-text-center tw-mb-14"
                        data-aos="fade-up"
                    >
                        Why Choose <span className="tw-text-[#f44032]">Printair Advertising?</span>
                    </h2>

                    <div className="tw-grid md:tw-grid-cols-3 tw-gap-10">
                        {[
                            {
                                icon: "mdi:truck-fast-outline",
                                title: "Fast Delivery",
                                desc: "Get your orders printed and delivered in record time.",
                            },
                            {
                                icon: "mdi:palette-outline",
                                title: "Premium Quality",
                                desc: "We use only the highest quality materials for your prints.",
                            },
                            {
                                icon: "mdi:account-multiple-outline",
                                title: "Happy Clients",
                                desc: "Loved and trusted by individuals and businesses alike.",
                                countUp: true
                            },
                        ].map((item, i) => (
                            <div
                                key={i}
                                className="tw-bg-white tw-shadow-md tw-rounded-xl tw-p-8 tw-text-center tw-flex tw-flex-col tw-items-center tw-justify-center tw-min-h-[300px] hover:tw-shadow-xl tw-transition tw-duration-300 tw-transform hover:tw--translate-y-1"
                                data-aos="fade-up"
                                data-aos-delay={i * 500}
                            >
                                <div className="tw-w-16 tw-h-16 tw-rounded-full tw-bg-[#f44032]/10 tw-flex tw-items-center tw-justify-center tw-mb-5">
                                    <Icon icon={item.icon} className="tw-text-[#f44032] tw-text-3xl" />
                                </div>
                                <h4 className="tw-text-xl tw-font-semibold tw-mb-2 tw-leading-tight">
                                    {item.countUp && (
                                        <span
                                            ref={counterRef}
                                            className="jkh tw-text-[#f44032]"
                                        >
                                            {count}+
                                        </span>
                                    )}
                                    {' ' + item.title}</h4>
                                <p className="tw-text-gray-600">{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>


            {/* slogan section */}
            <section className="tw-bg-[#f44032] tw-py-8 tw-text-center tw-text-white tw-mt-5">
                <h2
                    className="tw-text-lg md:tw-text-5xl tw-font-semibold md:tw-font-extrabold tw-text-white tw-min-h-[80px] md:tw-min-h-[100px] tw-flex tw-items-center tw-justify-center"
                >
                    <Typewriter
                        words={[
                            'You think it, We ink it.',
                            'Where creativity meets quality.',
                            'Your ideas. Our ink. Endless possibilities.',
                            'Prints that speak louder than words.',
                        ]}
                        loop={true}
                        cursor
                        cursorStyle="|"
                        typeSpeed={80}
                        deleteSpeed={50}
                        delaySpeed={1500}
                    />
                </h2>
            </section>


            {/*  */}
            {/*  */}
            {/*  */}
            {/* Offers / Promotions */}
            <Offers />



            <CookieConsent />
        </>
    );
};

export default Home;
