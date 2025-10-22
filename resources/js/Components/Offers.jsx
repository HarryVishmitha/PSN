import React, { useEffect, useState, useRef } from 'react';
import { Icon } from '@iconify/react';
import { Link } from '@inertiajs/react';
import AOS from 'aos';

const getTimeRemaining = (endTime) => {
    const total = Date.parse(endTime) - Date.now();
    const seconds = Math.floor((total / 1000) % 60);
    const minutes = Math.floor((total / 1000 / 60) % 60);
    const hours = Math.floor((total / (1000 * 60 * 60)) % 24);
    const days = Math.floor(total / (1000 * 60 * 60 * 24));
    return { total, days, hours, minutes, seconds };
};

const LimitedOffers = ({ offers = [] }) => {
    useEffect(() => {
        AOS.init({ duration: 1000 });
    }, []);

    // If no offers, show empty state
    if (!offers || offers.length === 0) {
        return (
            <section className="tw-bg-[#f9f9f9] tw-py-20 tw-px-4">
                <div className="tw-max-w-4xl tw-mx-auto tw-text-center" data-aos="fade-up">
                    <div className="tw-bg-white tw-rounded-2xl tw-shadow-lg tw-p-12">
                        <div className="tw-mb-6">
                            <Icon 
                                icon="mdi:tag-off-outline" 
                                className="tw-text-8xl tw-text-gray-300 tw-mx-auto tw-mb-4" 
                            />
                        </div>
                        <h3 className="tw-text-2xl tw-font-bold tw-text-gray-800 tw-mb-3">
                            No Active Offers Right Now
                        </h3>
                        <p className="tw-text-gray-600 tw-mb-6">
                            Stay tuned! Amazing deals and exclusive offers are coming soon.
                        </p>
                        <div className="tw-flex tw-justify-center tw-gap-4 tw-flex-wrap">
                            <Link
                                href="/products"
                                className="tw-bg-[#f44032] tw-text-white tw-px-6 tw-py-3 tw-rounded-lg hover:tw-bg-red-600 tw-transition tw-inline-flex tw-items-center tw-gap-2"
                            >
                                <Icon icon="mdi:shopping-outline" className="tw-text-xl" />
                                Browse Products
                            </Link>
                        </div>
                    </div>
                </div>
            </section>
        );
    }

    const [timers, setTimers] = useState(
        offers.map((offer) => getTimeRemaining(offer.end_date))
    );

    const scrollRef = useRef(null);
    const containerRef = useRef(null);

    useEffect(() => {
        AOS.init({ duration: 1000 });
        const interval = setInterval(() => {
            setTimers(offers.map((offer) => getTimeRemaining(offer.end_date)));
        }, 1000);
        return () => clearInterval(interval);
    }, [offers]);

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
            <div className="tw-mx-auto">
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
                        
                        // Format discount badge based on offer type
                        const getDiscountBadge = () => {
                            if (offer.offer_type === 'percentage') {
                                return `${offer.discount_value}% OFF`;
                            } else if (offer.offer_type === 'fixed') {
                                return `LKR ${offer.discount_value} OFF`;
                            } else if (offer.offer_type === 'buy_x_get_y') {
                                return 'BUY X GET Y';
                            } else if (offer.offer_type === 'free_shipping') {
                                return 'FREE SHIPPING';
                            }
                            return 'SPECIAL OFFER';
                        };

                        // Generate offer URL with slug
                        const offerSlug = offer.name.toLowerCase().replace(/\s+/g, '-');
                        const offerUrl = `/offers/${offer.id}/${offerSlug}`;

                        return (
                            <div
                                key={offer.id}
                                className="tw-bg-white tw-min-w-[280px] tw-max-w-[300px] tw-rounded-xl tw-shadow-md hover:tw-shadow-xl tw-transition tw-duration-300 tw-overflow-hidden tw-flex tw-flex-col tw-snap-center"
                                data-aos="fade-up"
                                data-aos-delay={i * 100}
                            >
                                <div className="tw-relative tw-overflow-hidden">
                                    {offer.image ? (
                                        <img
                                            src={`/storage/${offer.image}`}
                                            alt={offer.name}
                                            className="tw-w-full tw-h-40 tw-object-cover tw-transition-transform tw-duration-300 hover:tw-scale-105"
                                        />
                                    ) : (
                                        <div className="tw-w-full tw-h-40 tw-bg-gradient-to-br tw-from-[#667eea] tw-to-[#764ba2] tw-flex tw-items-center tw-justify-center">
                                            <div className="tw-text-white tw-text-center">
                                                <Icon icon="mdi:tag-multiple-outline" className="tw-text-6xl tw-mb-2" />
                                                <p className="tw-text-sm tw-font-semibold">Special Offer</p>
                                            </div>
                                        </div>
                                    )}
                                    <span className="tw-absolute tw-top-2 tw-left-2 tw-bg-[#f44032] tw-text-white tw-text-xs tw-font-bold tw-px-3 tw-py-1 tw-rounded">
                                        {getDiscountBadge()}
                                    </span>
                                </div>

                                <div className="tw-p-4 tw-flex tw-flex-col tw-flex-grow">
                                    <h5 className="tw-font-semibold tw-leading-tight tw-mb-1 tw-line-clamp-1">
                                        {offer.name}
                                    </h5>

                                    <p className="tw-text-sm tw-text-gray-600 tw-line-clamp-2 tw-mb-2">
                                        {offer.description || 'Limited time offer - Don\'t miss out!'}
                                    </p>

                                    <div className="tw-text-sm tw-text-gray-800 tw-font-semibold tw-mb-2">
                                        <span className="tw-text-[#f44032] tw-text-base">
                                            Use Code: <span className="tw-font-bold">{offer.code}</span>
                                        </span>
                                    </div>

                                    {offer.min_purchase_amt > 0 && (
                                        <p className="tw-text-xs tw-text-gray-500 tw-mb-2">
                                            Min. purchase: LKR {offer.min_purchase_amt}
                                        </p>
                                    )}

                                    <div className="tw-text-xs tw-text-white tw-bg-gray-800 tw-inline-block tw-px-3 tw-py-1 tw-rounded-full tw-mb-4 tw-self-start">
                                        {t.total > 0 ? (
                                            <span>
                                                Ends in: {t.days}d {t.hours}h {t.minutes}m {t.seconds}s
                                            </span>
                                        ) : (
                                            <span className="tw-text-red-500">Offer expired</span>
                                        )}
                                    </div>

                                    <Link
                                        href={offerUrl}
                                        className="tw-mt-auto tw-bg-[#f44032] tw-text-white tw-w-full tw-py-2 tw-rounded tw-text-sm hover:tw-bg-red-600 tw-transition tw-text-center tw-block"
                                    >
                                        View Offer
                                    </Link>
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
