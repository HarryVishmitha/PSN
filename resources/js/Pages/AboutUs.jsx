// resources/js/Pages/AboutUs.jsx
import ContactUs from '@/Components/ContactUs';
import CookieConsent from '@/Components/CookieConsent';
import Footer from '@/Components/Footer';
import Header from '@/Components/Header';
import Meta from '@/Components/Metaheads';
import { Head, Link } from '@inertiajs/react';
import { useEffect } from 'react';

// Animations
import AOS from 'aos';
import 'aos/dist/aos.css';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
gsap.registerPlugin(ScrollTrigger);

// Fallback images
const IMG_ABOUT = '/images/about/printair-team.jpg'; // replace with real photos
const IMG_WORK = '/images/about/printair-work.jpg';
const IMG_PRESS = '/images/about/printair-press.jpg';
const LOGO_FALLBACK = '/images/default.png';

const popularProducts = [
    { name: 'X-Banners', slug: 'x-banners' },
    { name: 'Pull-Up Banners', slug: 'pull-up-banners' },
    { name: 'Custom T-Shirts', slug: 'custom-t-shirts' },
    { name: 'Business Cards', slug: 'business-cards' },
    { name: 'Poster Printing', slug: 'poster-printing' },
];

const stats = [
    { k: '9K+', v: 'Orders Delivered' },
    { k: '1.2K+', v: 'Business Clients' },
    { k: '4.9/5', v: 'Average Rating' },
    { k: '48h', v: 'Typical Turnaround' },
];

const capabilities = [
    {
        title: 'Large-format Banners',
        desc: 'Frontlit, backlit, mesh & fabric — indoor & outdoor.',
        icon: 'mdi:billboard',
    },
    {
        title: 'Signage & Displays',
        desc: 'Pull-ups, X-banners, light boxes, board mounting.',
        icon: 'mdi:storefront-outline',
    },
    {
        title: 'Offset & Digital Prints',
        desc: 'Flyers, brochures, booklets, NCR forms.',
        icon: 'mdi:printer',
    },
    {
        title: 'Photo & Gift Items',
        desc: 'Photo frames, mugs, T-shirts, sublimation prints.',
        icon: 'mdi:image-multiple-outline',
    },
    {
        title: 'CAD / Plan Printing',
        desc: 'High-precision blueprints & technical drawings.',
        icon: 'mdi:vector-square',
    },
    {
        title: 'Installation Services',
        desc: 'On-site mounting, city permits guidance.',
        icon: 'mdi:hammer-wrench',
    },
];

const steps = [
    {
        t: 'Request',
        d: 'Send your specs or pick a template. We help finalize details.',
    },
    {
        t: 'Review',
        d: 'Our team checks sizes, materials, and practicality for your use.',
    },
    { t: 'Proof', d: 'You’ll receive a proof/quote. Approve to proceed.' },
    { t: 'Print', d: 'We produce with calibrated color and quality checks.' },
    {
        t: 'Deliver',
        d: 'Pickup or courier delivery. Installation available on request.',
    },
];

export default function AboutUs() {
    useEffect(() => {
        AOS.init({ duration: 700, once: true });

        // Subtle GSAP parallax on hero image (optional)
        const img = document.querySelector('[data-hero-art]');
        if (img) {
            gsap.to(img, {
                yPercent: 10,
                ease: 'none',
                scrollTrigger: {
                    trigger: img,
                    start: 'top bottom',
                    end: 'bottom top',
                    scrub: true,
                },
            });
        }
    }, []);

    return (
        <>
            <Head title="About Us - Printair" />
            <Meta
                title="About Printair Advertising"
                description="We deliver fast, reliable, high-quality printing—from banners and signage to brochures, photo gifts, and more."
                url="https://printair.lk/about"
                keywords="Printair advertising, digital printing Sri Lanka, signage, banners, brochures, print shop"
                canonical="https://printair.lk/about"
                author="Printair Team"
                robots="index, follow"
            />
            <Header />

            {/* HERO */}
            <section className="tw-relative tw-bg-gradient-to-b tw-from-white tw-to-gray-50">
                <div className="tw-container tw-mx-auto tw-px-4 tw-pt-8">
                    <nav
                        className="tw-mb-3 tw-text-xs tw-text-gray-500"
                        aria-label="Breadcrumb"
                    >
                        <Link href="/" className="hover:tw-underline">
                            Home
                        </Link>
                        <span className="tw-mx-2">/</span>
                        <span className="tw-text-gray-700">About</span>
                    </nav>

                    <div className="tw-grid tw-grid-cols-1 tw-items-center tw-gap-8 lg:tw-grid-cols-2">
                        <div data-aos="fade-right">
                            <div className="tw-text-2xl tw-font-bold tw-text-[#f44032]">
                                About Printair
                            </div>
                            <p className="tw-mt-3 tw-leading-relaxed tw-text-gray-700">
                                We’re a Sri Lankan print studio focused on
                                speed, precision, and service. From **custom
                                banners** to **corporate signage**, from
                                **brochures** to **photo gifts**, our team
                                delivers work that looks good and works hard.
                            </p>
                            <div className="tw-mt-5 tw-flex tw-gap-3">
                                <Link
                                    href="/products/all"
                                    className="tw-inline-flex tw-items-center tw-gap-2 tw-rounded-xl tw-bg-[#f44032] tw-px-4 tw-py-2 tw-text-white hover:tw-opacity-90"
                                >
                                    Browse Products
                                </Link>
                                <Link
                                    href="/contact"
                                    className="tw-inline-flex tw-items-center tw-gap-2 tw-rounded-xl tw-border tw-border-black tw-px-4 tw-py-2 hover:tw-bg-black hover:tw-text-white"
                                >
                                    Ask for a Quote
                                </Link>
                            </div>
                        </div>

                        <div className="tw-relative" data-aos="fade-left">
                            <div
                                className="tw-aspect-[16/10] tw-overflow-hidden tw-rounded-2xl tw-border tw-border-gray-200 tw-shadow-lg"
                                data-hero-art
                            >
                                <img
                                    src={IMG_ABOUT}
                                    alt="Printair team at work"
                                    className="tw-h-full tw-w-full tw-object-cover"
                                    loading="lazy"
                                />
                            </div>
                        </div>
                    </div>

                    {/* STATS */}
                    <div
                        className="tw-mt-8 tw-grid tw-grid-cols-2 tw-gap-4 sm:tw-grid-cols-4"
                        data-aos="fade-up"
                    >
                        {stats.map((s, i) => (
                            <div
                                key={i}
                                className="tw-rounded-2xl tw-border tw-border-gray-200 tw-bg-white tw-p-4 tw-text-center tw-shadow-sm"
                            >
                                <div className="tw-text-xl tw-font-extrabold tw-text-gray-900">
                                    {s.k}
                                </div>
                                <div className="tw-text-[12px] tw-text-gray-500">
                                    {s.v}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* STORY */}
            <section className="tw-container tw-mx-auto tw-grid tw-grid-cols-1 tw-gap-8 tw-px-4 tw-py-10 lg:tw-grid-cols-2">
                <div data-aos="fade-up" className="tw-space-y-3">
                    <div className="tw-text-xl tw-font-semibold">Our Story</div>
                    <p className="tw-leading-relaxed tw-text-gray-700">
                        Printair started with a simple promise: **make printing
                        effortless** for businesses and creators. Today, we
                        combine modern presses with a careful human eye—so
                        colors match, text is crisp, and installations are safe
                        and tidy.
                    </p>
                    <p className="tw-leading-relaxed tw-text-gray-700">
                        Whether you’re launching a campaign or celebrating a
                        moment, we help you pick the right substrate, size, and
                        finish. If it needs to be quick, we’re quick. If it
                        needs to be perfect, we’re meticulous. Usually, it needs
                        to be both—so we built our workflow for exactly that.
                    </p>
                    <ul className="tw-ml-5 tw-list-disc tw-space-y-1 tw-text-sm tw-text-gray-700">
                        <li>Color-managed workflow with calibrated devices</li>
                        <li>Material guidance for indoor/outdoor durability</li>
                        <li>Proofing & quality checks at each stage</li>
                    </ul>
                </div>
                <div className="tw-grid tw-grid-cols-2 tw-gap-4">
                    <div
                        className="tw-aspect-[4/3] tw-overflow-hidden tw-rounded-2xl tw-border tw-border-gray-200 tw-shadow-sm"
                        data-aos="zoom-in"
                    >
                        <img
                            src={IMG_WORK}
                            alt="Production floor"
                            className="tw-h-full tw-w-full tw-object-cover"
                            loading="lazy"
                        />
                    </div>
                    <div
                        className="tw-aspect-[4/3] tw-overflow-hidden tw-rounded-2xl tw-border tw-border-gray-200 tw-shadow-sm"
                        data-aos="zoom-in"
                        data-aos-delay="80"
                    >
                        <img
                            src={IMG_PRESS}
                            alt="Large format printer"
                            className="tw-h-full tw-w-full tw-object-cover"
                            loading="lazy"
                        />
                    </div>
                </div>
            </section>

            {/* CAPABILITIES */}
            <section className="tw-bg-gray-50">
                <div className="tw-container tw-mx-auto tw-px-4 tw-py-10">
                    <div
                        className="tw-mb-4 tw-text-xl tw-font-semibold"
                        data-aos="fade-up"
                    >
                        What we do
                    </div>
                    <div className="tw-grid tw-grid-cols-1 tw-gap-4 sm:tw-grid-cols-2 lg:tw-grid-cols-3">
                        {capabilities.map((c, i) => (
                            <div
                                key={i}
                                className="tw-rounded-2xl tw-border tw-border-gray-200 tw-bg-white tw-p-4 tw-shadow-sm"
                                data-aos="fade-up"
                                data-aos-delay={i * 60}
                            >
                                <div className="tw-mb-1 tw-flex tw-items-center tw-gap-2">
                                    <span className="tw-inline-flex tw-h-8 tw-w-8 tw-items-center tw-justify-center tw-rounded-xl tw-bg-[#f44032]/10 tw-text-[#f44032]">
                                        <i
                                            className={`iconify tw-text-lg`}
                                            data-icon={c.icon}
                                        ></i>
                                    </span>
                                    <div className="tw-font-medium">
                                        {c.title}
                                    </div>
                                </div>
                                <p className="tw-text-sm tw-text-gray-600">
                                    {c.desc}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* PROCESS */}
            <section className="tw-container tw-mx-auto tw-px-4 tw-py-10">
                <div
                    className="tw-mb-4 tw-text-xl tw-font-semibold"
                    data-aos="fade-up"
                >
                    How it works
                </div>
                <ol className="tw-relative tw-border-l tw-border-gray-200 tw-pl-5">
                    {steps.map((s, i) => (
                        <li
                            key={i}
                            className="tw-mb-6"
                            data-aos="fade-up"
                            data-aos-delay={i * 70}
                        >
                            <span className="tw-absolute -tw-left-2 tw-h-4 tw-w-4 tw-rounded-full tw-bg-[#f44032]" />
                            <div className="tw-font-semibold">
                                {i + 1}. {s.t}
                            </div>
                            <p className="tw-mt-0.5 tw-text-sm tw-text-gray-600">
                                {s.d}
                            </p>
                        </li>
                    ))}
                </ol>
                <div className="tw-mt-6">
                    <Link
                        href="/ask-for-quote"
                        className="tw-inline-flex tw-items-center tw-gap-2 tw-rounded-xl tw-bg-[#f44032] tw-px-4 tw-py-2 tw-text-white hover:tw-opacity-90"
                    >
                        Start a Project
                    </Link>
                </div>
            </section>

            {/* DIFFERENTIATORS */}
            <section className="tw-bg-white">
                <div className="tw-container tw-mx-auto tw-grid tw-grid-cols-1 tw-gap-6 tw-px-4 tw-py-10 lg:tw-grid-cols-3">
                    <div
                        className="tw-rounded-2xl tw-border tw-border-gray-200 tw-bg-gray-50 tw-p-5"
                        data-aos="fade-up"
                    >
                        <div className="tw-mb-2 tw-text-lg tw-font-semibold">
                            Why choose Printair
                        </div>
                        <ul className="tw-space-y-2 tw-text-sm tw-text-gray-700">
                            <li>Fast turnarounds with real-time updates</li>
                            <li>Color-managed, consistent output</li>
                            <li>Durable materials for Sri Lankan weather</li>
                            <li>In-house installation team</li>
                            <li>Friendly support on email & WhatsApp</li>
                        </ul>
                    </div>
                    <div
                        className="tw-rounded-2xl tw-border tw-border-gray-200 tw-bg-gray-50 tw-p-5"
                        data-aos="fade-up"
                        data-aos-delay="70"
                    >
                        <div className="tw-mb-2 tw-text-lg tw-font-semibold">
                            Quality assurance
                        </div>
                        <p className="tw-text-sm tw-text-gray-700">
                            Each print job goes through alignment, color, and
                            material checks. We proof critical projects and sign
                            off together—no surprises on delivery.
                        </p>
                    </div>
                    <div
                        className="tw-rounded-2xl tw-border tw-border-gray-200 tw-bg-gray-50 tw-p-5"
                        data-aos="fade-up"
                        data-aos-delay="140"
                    >
                        <div className="tw-mb-2 tw-text-lg tw-font-semibold">
                            Sustainability
                        </div>
                        <p className="tw-text-sm tw-text-gray-700">
                            We optimize media usage, recycle offcuts where
                            possible, and recommend eco-friendlier stock on
                            request.
                        </p>
                    </div>
                </div>
            </section>

            {/* CLIENT LOGOS (placeholders) */}
            <section className="tw-bg-gray-50">
                <div className="tw-container tw-mx-auto tw-px-4 tw-py-10">
                    <div
                        className="tw-mb-4 tw-text-xl tw-font-semibold"
                        data-aos="fade-up"
                    >
                        Brands we’ve supported
                    </div>
                    <div
                        className="tw-grid tw-grid-cols-2 tw-gap-4 sm:tw-grid-cols-4 lg:tw-grid-cols-6"
                        data-aos="fade-up"
                        data-aos-delay="60"
                    >
                        {Array.from({ length: 6 }).map((_, i) => (
                            <div
                                key={i}
                                className="tw-grid tw-h-16 tw-place-content-center tw-rounded-xl tw-border tw-border-gray-200 tw-bg-white tw-text-gray-400"
                            >
                                <img
                                    src={LOGO_FALLBACK}
                                    alt="Partner logo"
                                    className="tw-h-10 tw-w-10 tw-opacity-60"
                                />
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="tw-container tw-mx-auto tw-px-4 tw-py-10">
                <div
                    className="tw-grid tw-grid-cols-1 tw-gap-4 tw-rounded-2xl tw-border tw-border-gray-200 tw-bg-white tw-p-6 tw-shadow-sm md:tw-grid-cols-2"
                    data-aos="zoom-in"
                >
                    <div>
                        <div className="tw-text-lg tw-font-semibold">
                            Have a deadline?
                        </div>
                        <p className="tw-text-sm tw-text-gray-600">
                            Tell us what you need and when. We’ll map the
                            fastest route and keep you posted.
                        </p>
                    </div>
                    <div className="tw-flex tw-items-center tw-gap-3 md:tw-justify-end">
                        <Link
                            href="/ask-for-quote"
                            className="tw-rounded-xl tw-bg-[#f44032] tw-px-4 tw-py-2 tw-text-white hover:tw-opacity-90"
                        >
                            Ask for a Quote
                        </Link>
                        <Link
                            href="/products/all"
                            className="tw-rounded-xl tw-border tw-border-black tw-px-4 tw-py-2 hover:tw-bg-black hover:tw-text-white"
                        >
                            Browse Products
                        </Link>
                    </div>
                </div>
            </section>

            {/* CONTACT SHORT + FULL COMPONENT */}
            <section className="tw-border-t tw-border-gray-100 tw-bg-gray-50">
                <div className="tw-container tw-mx-auto tw-px-4 tw-py-10">
                    <div
                        className="tw-mb-4 tw-text-xl tw-font-semibold"
                        data-aos="fade-up"
                    >
                        Talk to our team
                    </div>
                    <div className="">
                        <ContactUs />
                    </div>
                </div>
            </section>

            <CookieConsent />
            <Footer popularProducts={popularProducts} />
        </>
    );
}
