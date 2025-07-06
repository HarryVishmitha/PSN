import React, { useEffect, useState, useRef } from 'react';
import { Icon } from '@iconify/react';
import AOS from 'aos';

const getTimeRemaining = (endTime) => {
    const total = Date.parse(endTime) - Date.now();
    const seconds = Math.floor((total / 1000) % 60);
    const minutes = Math.floor((total / 1000 / 60) % 60);
    const hours = Math.floor((total / (1000 * 60 * 60)) % 24);
    const days = Math.floor(total / (1000 * 60 * 60 * 24));
    return { total, days, hours, minutes, seconds };
};

const LimitedOffers = () => {
    const offers = [
        {
            id: 1,
            title: 'Custom Mug Offer',
            desc: 'Get 10% off on all custom mugs!',
            image: 'https://picsum.photos/300/200?random=1',
            discount: '10% OFF',
            oldPrice: 1500,
            newPrice: 1350,
            expiresAt: new Date(Date.now() + 2 * 86400000),
        },
        {
            id: 2,
            title: 'Flyer Bundle Deal',
            desc: 'Buy 2 Get 1 Free on all flyers.',
            image: 'https://picsum.photos/300/200?random=2',
            discount: 'B2G1 FREE',
            oldPrice: 3000,
            newPrice: 2000,
            expiresAt: new Date(Date.now() + 1 * 86400000 + 3600000),
        },
        {
            id: 3,
            title: 'T-Shirt Flash Sale',
            desc: 'Flat 20% off on printed t-shirts.',
            image: 'https://picsum.photos/300/200?random=3',
            discount: '20% OFF',
            oldPrice: 2500,
            newPrice: 2000,
            expiresAt: new Date(Date.now() + 6 * 3600000),
        },
        {
            id: 4,
            title: 'Poster Weekend Deal',
            desc: 'Save big on A2 poster prints.',
            image: 'https://picsum.photos/300/200?random=4',
            discount: '15% OFF',
            oldPrice: 1000,
            newPrice: 850,
            expiresAt: new Date(Date.now() + 3 * 86400000),
        },
        {
            id: 5,
            title: 'Sticker Pack Discount',
            desc: '30% off when you order over 100 stickers.',
            image: 'https://picsum.photos/300/200?random=5',
            discount: '30% OFF',
            oldPrice: 500,
            newPrice: 350,
            expiresAt: new Date(Date.now() + 5 * 86400000),
        },
    ];

    const [timers, setTimers] = useState(
        offers.map((offer) => getTimeRemaining(offer.expiresAt))
    );

    const scrollRef = useRef(null);
    const containerRef = useRef(null);

    useEffect(() => {
        AOS.init({ duration: 1000 });
        const interval = setInterval(() => {
            setTimers(offers.map((offer) => getTimeRemaining(offer.expiresAt)));
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    // Auto scroll
    useEffect(() => {
        const autoScroll = setInterval(() => {
            if (scrollRef.current) {
                scrollRef.current.scrollBy({ left: 300, behavior: 'smooth' });
                const maxScroll =
                    scrollRef.current.scrollWidth - scrollRef.current.clientWidth;
                if (
                    scrollRef.current.scrollLeft >= maxScroll ||
                    scrollRef.current.scrollLeft === 0
                ) {
                    scrollRef.current.scrollTo({ left: 0, behavior: 'smooth' });
                }
            }
        }, 4000);
        return () => clearInterval(autoScroll);
    }, []);

    // Swipe support for mobile
    useEffect(() => {
        const slider = scrollRef.current;
        let startX;

        const touchStart = (e) => (startX = e.touches[0].clientX);
        const touchMove = (e) => {
            const moveX = e.touches[0].clientX;
            const diff = startX - moveX;
            slider.scrollLeft += diff;
        };

        if (slider) {
            slider.addEventListener('touchstart', touchStart);
            slider.addEventListener('touchmove', touchMove);
        }
        return () => {
            if (slider) {
                slider.removeEventListener('touchstart', touchStart);
                slider.removeEventListener('touchmove', touchMove);
            }
        };
    }, []);

    return (
        <section className="tw-bg-[#f9f9f9] tw-py-20 tw-px-4 tw-relative">
            <div className="tw-max-w-7xl tw-mx-auto">
                <h2 className="tw-text-3xl md:tw-text-4xl tw-font-bold tw-text-center tw-mb-12" data-aos="fade-up">
                    Limited-Time Offers
                </h2>

                {/* Scroll Buttons */}
                <button
                    onClick={() => scrollRef.current?.scrollBy({ left: -300, behavior: 'smooth' })}
                    className="tw-absolute tw-left-4 tw-top-[55%] tw-z-10 tw-bg-white tw-rounded-full tw-shadow-md tw-p-2 hover:tw-scale-110 tw-transition"
                >
                    <Icon icon="ic:round-chevron-left" className="tw-text-2xl" />
                </button>
                <button
                    onClick={() => scrollRef.current?.scrollBy({ left: 300, behavior: 'smooth' })}
                    className="tw-absolute tw-right-4 tw-top-[55%] tw-z-10 tw-bg-white tw-rounded-full tw-shadow-md tw-p-2 hover:tw-scale-110 tw-transition"
                >
                    <Icon icon="ic:round-chevron-right" className="tw-text-2xl" />
                </button>

                {/* Fade Indicators */}
                <div className="tw-absolute tw-left-0 tw-top-0 tw-w-10 tw-h-full tw-bg-gradient-to-r tw-from-[#f9f9f9] tw-to-transparent tw-z-10" />
                <div className="tw-absolute tw-right-0 tw-top-0 tw-w-10 tw-h-full tw-bg-gradient-to-l tw-from-[#f9f9f9] tw-to-transparent tw-z-10" />

                <div
                    ref={scrollRef}
                    className="tw-flex tw-gap-6 tw-overflow-x-auto tw-scroll-smooth tw-pb-2 tw-snap-x tw-snap-mandatory tw-px-8 md:tw-px-12"
                >

                    {offers.map((offer, i) => {
                        const t = timers[i];
                        return (
                            <div
                                key={offer.id}
                                className="tw-bg-white tw-min-w-[280px] tw-max-w-[300px] tw-rounded-xl tw-shadow-md hover:tw-shadow-xl tw-transition tw-duration-300 tw-overflow-hidden tw-flex tw-flex-col tw-snap-center"
                                data-aos="fade-up"
                                data-aos-delay={i * 100}
                            >
                                <div className="tw-relative tw-overflow-hidden">
                                    <img
                                        src={offer.image}
                                        alt={offer.title}
                                        className="tw-w-full tw-h-40 tw-object-cover tw-transition-transform tw-duration-300 hover:tw-scale-105"
                                    />
                                    <span className="tw-absolute tw-top-2 tw-left-2 tw-bg-[#f44032] tw-text-white tw-text-xs tw-font-bold tw-px-3 tw-py-1 tw-rounded">
                                        {offer.discount}
                                    </span>
                                </div>

                                <div className="tw-p-4 tw-flex tw-flex-col tw-flex-grow">
                                    <h5 className="tw-font-semibold tw-leading-tight tw-mb-1 tw-line-clamp-1">
                                        {offer.title}
                                    </h5>

                                    <p className="tw-text-sm tw-text-gray-600 tw-line-clamp-2 tw-mb-2">
                                        {offer.desc}
                                    </p>

                                    <div className="tw-text-sm tw-text-gray-800 tw-font-semibold tw-mb-2">
                                        <span className="tw-text-gray-400 tw-line-through tw-mr-2">LKR {offer.oldPrice}</span>
                                        <span className="tw-text-[#f44032]">LKR {offer.newPrice}</span>
                                    </div>

                                    <div className="tw-text-xs tw-text-white tw-bg-gray-800 tw-inline-block tw-px-3 tw-py-1 tw-rounded-full tw-mb-4 self-start">
                                        {t.total > 0 ? (
                                            <span>
                                                Ends in: {t.days}d {t.hours}h {t.minutes}m {t.seconds}s
                                            </span>
                                        ) : (
                                            <span className="tw-text-red-500">Offer expired</span>
                                        )}
                                    </div>

                                    <button className="tw-mt-auto tw-bg-[#f44032] tw-text-white tw-w-full tw-py-2 tw-rounded tw-text-sm hover:tw-bg-red-600 tw-transition tw-text-center">
                                        Shop Now
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
};

export default LimitedOffers;
