import React, { useEffect, useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import { Icon } from '@iconify/react';
import Meta from '@/Components/Metaheads';
import Header from '@/Components/Header';
import Footer from '@/Components/Footer';
import ProductCard from '@/Components/ProductCard';

export default function OfferView({ offer }) {
    const [timeRemaining, setTimeRemaining] = useState('');

    useEffect(() => {
        const calculateTimeRemaining = () => {
            const now = new Date();
            const end = new Date(offer.end_date);
            const diff = end - now;

            if (diff <= 0) {
                setTimeRemaining('Expired');
                return;
            }

            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((diff % (1000 * 60)) / 1000);

            if (days > 0) {
                setTimeRemaining(`${days}d ${hours}h ${minutes}m`);
            } else if (hours > 0) {
                setTimeRemaining(`${hours}h ${minutes}m ${seconds}s`);
            } else {
                setTimeRemaining(`${minutes}m ${seconds}s`);
            }
        };

        calculateTimeRemaining();
        const timer = setInterval(calculateTimeRemaining, 1000);
        return () => clearInterval(timer);
    }, [offer.end_date]);

    const getDiscountBadge = () => {
        if (offer.offer_type === 'percentage') {
            return (
                <div className="discount-badge">
                    <div className="discount-value">{offer.discount_value}%</div>
                    <div className="discount-label">OFF</div>
                </div>
            );
        }

        if (offer.offer_type === 'fixed') {
            return (
                <div className="discount-badge">
                    <div className="discount-value">LKR {offer.discount_value}</div>
                    <div className="discount-label">OFF</div>
                </div>
            );
        }

        if (offer.offer_type === 'free_shipping') {
            return (
                <div className="discount-badge shipping">
                    <Icon icon="mdi:truck-fast-outline" className="shipping-icon tw-text-center" />
                    <div className="discount-label">FREE SHIPPING</div>
                </div>
            );
        }

        return null;
    };

    return (
        <>
            <Head title={`${offer.name} - Special Offer`} />
            <Meta title={offer.name} description={offer.description || 'Limited time offer'} />
            <Header />

            <div className="offer-view-container">
                {/* Hero Section with Offer Image */}
                <div className="offer-hero-section">
                    <div className="container">
                        <div className="row align-items-center g-4">
                            {/* Left Side - Offer Details */}
                            <div className="col-lg-6">
                                <div className="offer-details-hero">
                                    <div className="offer-badge-top">
                                        <Icon icon="mdi:tag-star-outline" />
                                        <span>Special Offer</span>
                                    </div>
                                    <h1 className="offer-title">{offer.name}</h1>
                                    {offer.description && (
                                        <p className="offer-description">{offer.description}</p>
                                    )}
                                    {getDiscountBadge()}
                                    
                                    {/* Quick Info */}
                                    <div className="quick-info-grid">
                                        <div className="info-item">
                                            <Icon icon="mdi:clock-outline" className="info-icon" />
                                            <div className="info-content">
                                                <span className="info-label">Time Left</span>
                                                <span className="info-value">{timeRemaining}</span>
                                            </div>
                                        </div>
                                        <div className="info-item">
                                            <Icon icon="mdi:tag-outline" className="info-icon" />
                                            <div className="info-content">
                                                <span className="info-label">Offer Code</span>
                                                <span className="info-value">{offer.code}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Right Side - Offer Image (Square Poster) */}
                            <div className="col-lg-6">
                                {offer.image ? (
                                    <div className="offer-image-container">
                                        <img src={`/storage/${offer.image}`} alt={offer.name} className="offer-poster-image" />
                                    </div>
                                ) : (
                                    <div className="offer-image-placeholder">
                                        <Icon icon="mdi:image-off-outline" />
                                        <p>No Image Available</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Offer Details Cards */}
                <div className="offer-info-section">
                    <div className="container">
                        <div className="row g-4">
                            {/* Countdown Timer */}
                            <div className="col-lg-4">
                                <div className="offer-card countdown-card">
                                    <div className="card-icon tw-text-center tw-w-full tw-flex tw-justify-center">
                                        <Icon icon="mdi:clock-time-four-outline" />
                                    </div>
                                    <h6 className="card-title tw-text-center">Time Remaining</h6>
                                    <div className="countdown-timer">{timeRemaining}</div>
                                    <div className="offer-dates">
                                        <div className="date-item">
                                            <span className="label">Starts:</span>
                                            <span className="value">{new Date(offer.start_date).toLocaleDateString()}</span>
                                        </div>
                                        <div className="date-item">
                                            <span className="label">Ends:</span>
                                            <span className="value">{new Date(offer.end_date).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="col-lg-4">
                                <div className="offer-card code-card">
                                    <div className="card-icon tw-text-center tw-w-full tw-flex tw-justify-center">
                                        <Icon icon="mdi:tag-outline" />
                                    </div>
                                    <h6 className="card-title tw-text-center">Offer Code</h6>
                                    <div className="offer-code">
                                        <code>{offer.code}</code>
                                        <button
                                            className="copy-btn"
                                            onClick={() => {
                                                navigator.clipboard.writeText(offer.code);
                                                alert('Code copied to clipboard!');
                                            }}
                                        >
                                            <Icon icon="mdi:content-copy" />
                                        </button>
                                    </div>
                                    <p className="code-hint">Use this code at checkout</p>
                                </div>
                            </div>

                            <div className="col-lg-4">
                                <div className="offer-card terms-card">
                                    <div className="card-icon tw-text-center tw-w-full tw-flex tw-justify-center">
                                        <Icon icon="mdi:information-outline" />
                                    </div>
                                    <h6 className="card-title tw-text-center">Terms & Conditions</h6>
                                    <ul className="terms-list">
                                        {offer.min_purchase_amt && (
                                            <li>Minimum order: LKR {offer.min_purchase_amt}</li>
                                        )}
                                        {offer.usage_limit && (
                                            <li>Limited to {offer.usage_limit} uses</li>
                                        )}
                                        {offer.per_customer_limit && (
                                            <li>Max {offer.per_customer_limit} use(s) per customer</li>
                                        )}
                                        {!offer.min_purchase_amt && !offer.usage_limit && (
                                            <li>No minimum purchase required</li>
                                        )}
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Eligible Products */}
                {offer.products && offer.products.length > 0 && (
                    <div className="products-section">
                        <div className="container">
                            <div className="section-header">
                                <div className="card-icon tw-text-center tw-w-full tw-flex tw-justify-center">
                                    <Icon icon="mdi:tag-multiple-outline" />
                                </div>
                                <h2 className="section-title">Eligible Products</h2>
                                <p className="section-subtitle">These products are included in this special offer</p>
                            </div>
                            <div className="row g-4">
                                {offer.products.map(product => (
                                    <div key={product.id} className="col-md-6 col-lg-3">
                                        <ProductCard product={product} />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* CTA Section */}
                <div className="cta-section">
                    <div className="container">
                        <div className="cta-content">
                            <div className="card-icon tw-text-center tw-w-full tw-flex tw-justify-center">
                                <Icon icon="mdi:gift-outline" className="cta-icon tw-text-white tw-w-60" />
                            </div>
                            <h3 className="cta-title">Ready to Grab This Deal?</h3>
                            <p className="cta-description">
                                Use code <span className="cta-code">{offer.code}</span> at checkout to enjoy this exclusive offer
                            </p>
                            <div className="cta-buttons">
                                <Link href="/" className="btn btn-primary">
                                    <Icon icon="mdi:shopping-outline" />
                                    Start Shopping
                                </Link>
                                <button 
                                    className="btn btn-secondary"
                                    onClick={() => {
                                        navigator.clipboard.writeText(offer.code);
                                        alert('Code copied to clipboard!');
                                    }}
                                >
                                    <Icon icon="mdi:content-copy" />
                                    Copy Code
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <Footer />

            <style>{`
                .offer-view-container {
                    min-height: 100vh;
                    background: #ffffff;
                }

                /* Hero Section */
                .offer-hero-section {
                    padding: 4rem 0 3rem;
                    background: #f8f9fa;
                    border-bottom: 1px solid #e9ecef;
                }

                .offer-details-hero {
                    padding: 2rem 0;
                }

                .offer-badge-top {
                    display: inline-flex;
                    align-items: center;
                    gap: 0.5rem;
                    background: #f44032;
                    color: white;
                    padding: 0.5rem 1rem;
                    border-radius: 50px;
                    font-size: 0.9rem;
                    font-weight: 600;
                    margin-bottom: 1.5rem;
                }

                .offer-badge-top svg {
                    font-size: 1.2rem;
                }

                .offer-title {
                    font-size: 2.5rem;
                    font-weight: 800;
                    color: #000000;
                    margin-bottom: 1rem;
                    line-height: 1.2;
                }

                .offer-description {
                    font-size: 1.1rem;
                    color: #6c757d;
                    margin-bottom: 2rem;
                    line-height: 1.6;
                }

                /* Discount Badge */
                .discount-badge {
                    display: inline-block;
                    background: linear-gradient(135deg, #f44032 0%, #d32f2f 100%);
                    padding: 1.5rem 2.5rem;
                    border-radius: 15px;
                    text-align: center;
                    box-shadow: 0 4px 15px rgba(244, 64, 50, 0.3);
                    color: white;
                    margin-bottom: 2rem;
                }

                .discount-badge.shipping {
                    background: linear-gradient(135deg, #2196F3 0%, #1976D2 100%);
                    box-shadow: 0 4px 15px rgba(33, 150, 243, 0.3);
                }

                .discount-value {
                    font-size: 2.5rem;
                    font-weight: 900;
                    line-height: 1;
                    display: block;
                }

                .discount-label {
                    font-size: 1rem;
                    font-weight: 600;
                    margin-top: 0.5rem;
                    display: block;
                    opacity: 0.95;
                }

                .shipping-icon {
                    font-size: 2.5rem;
                    margin-bottom: 0.5rem;
                }

                /* Quick Info Grid */
                .quick-info-grid {
                    display: grid;
                    grid-template-columns: repeat(2, 1fr);
                    gap: 1rem;
                    margin-top: 2rem;
                }

                .info-item {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                    padding: 1rem;
                    background: white;
                    border: 1px solid #e9ecef;
                    border-radius: 10px;
                }

                .info-icon {
                    font-size: 2rem;
                    color: #f44032;
                }

                .info-content {
                    display: flex;
                    flex-direction: column;
                }

                .info-label {
                    font-size: 0.8rem;
                    color: #6c757d;
                    font-weight: 500;
                }

                .info-value {
                    font-size: 1rem;
                    color: #000000;
                    font-weight: 700;
                }

                /* Offer Image (Square Poster) */
                .offer-image-container {
                    position: relative;
                    width: 100%;
                    max-width: 600px;
                    margin: 0 auto;
                    border-radius: 20px;
                    overflow: hidden;
                    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
                    background: white;
                }

                .offer-poster-image {
                    width: 100%;
                    height: auto;
                    aspect-ratio: 1 / 1;
                    object-fit: cover;
                    display: block;
                }

                .offer-image-placeholder {
                    width: 100%;
                    aspect-ratio: 1 / 1;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    background: #f8f9fa;
                    border: 2px dashed #dee2e6;
                    border-radius: 20px;
                    color: #6c757d;
                }

                .offer-image-placeholder svg {
                    font-size: 4rem;
                    margin-bottom: 1rem;
                }

                /* Offer Info Section */
                .offer-info-section {
                    padding: 4rem 0;
                    background: white;
                }

                .offer-card {
                    background: white;
                    padding: 2rem;
                    border-radius: 15px;
                    border: 1px solid #e9ecef;
                    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
                    height: 100%;
                    transition: all 0.3s ease;
                }

                .offer-card:hover {
                    transform: translateY(-5px);
                    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
                    border-color: #f44032;
                }

                .card-icon {
                    font-size: 3rem;
                    color: #f44032;
                    margin-bottom: 1rem;
                }

                .card-title {
                    font-weight: 700;
                    margin-bottom: 1.5rem;
                    color: #000000;
                    font-size: 1.1rem;
                }

                .countdown-timer {
                    font-size: 2.5rem;
                    font-weight: 800;
                    color: #f44032;
                    margin-bottom: 1.5rem;
                }

                .offer-dates {
                    display: flex;
                    flex-direction: column;
                    gap: 0.5rem;
                }

                .date-item {
                    display: flex;
                    justify-content: space-between;
                    padding: 0.75rem;
                    background: #f8f9fa;
                    border-radius: 8px;
                }

                .date-item .label {
                    font-weight: 600;
                    color: #6c757d;
                }

                .date-item .value {
                    font-weight: 600;
                    color: #000000;
                }

                /* Offer Code */
                .offer-code {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                    margin-bottom: 1rem;
                }

                .offer-code code {
                    flex: 1;
                    background: #000000;
                    color: white;
                    padding: 1rem 1.5rem;
                    border-radius: 10px;
                    font-size: 1.5rem;
                    font-weight: 700;
                    letter-spacing: 2px;
                    text-align: center;
                }

                .copy-btn {
                    background: #f44032;
                    color: white;
                    border: none;
                    padding: 1rem;
                    border-radius: 10px;
                    cursor: pointer;
                    font-size: 1.5rem;
                    transition: all 0.3s;
                }

                .copy-btn:hover {
                    background: #d32f2f;
                    transform: scale(1.05);
                }

                .code-hint {
                    color: #6c757d;
                    font-size: 0.9rem;
                    margin: 0;
                    text-align: center;
                }

                /* Terms */
                .terms-list {
                    list-style: none;
                    padding: 0;
                    margin: 0;
                }

                .terms-list li {
                    padding: 0.75rem 1rem;
                    border-left: 3px solid #f44032;
                    background: #f8f9fa;
                    margin-bottom: 0.5rem;
                    border-radius: 5px;
                    color: #000000;
                }

                /* Products Section */
                .products-section {
                    padding: 4rem 0;
                    background: #f8f9fa;
                }

                .section-header {
                    text-align: center;
                    margin-bottom: 3rem;
                }

                .section-header svg {
                    font-size: 3rem;
                    color: #f44032;
                    margin-bottom: 1rem;
                }

                .section-title {
                    color: #000000;
                    font-weight: 800;
                    font-size: 2rem;
                    margin-bottom: 0.5rem;
                }

                .section-subtitle {
                    color: #6c757d;
                    font-size: 1.1rem;
                }

                /* CTA Section */
                .cta-section {
                    padding: 4rem 0;
                    background: linear-gradient(135deg, #f44032 0%, #d32f2f 100%);
                    color: white;
                }

                .cta-content {
                    text-align: center;
                    max-width: 700px;
                    margin: 0 auto;
                }

                .cta-icon {
                    font-size: 4rem;
                    margin-bottom: 1.5rem;
                    opacity: 0.9;
                }

                .cta-title {
                    font-weight: 800;
                    font-size: 2.5rem;
                    margin-bottom: 1rem;
                }

                .cta-description {
                    font-size: 1.2rem;
                    margin-bottom: 2rem;
                    opacity: 0.95;
                }

                .cta-code {
                    background: rgba(0, 0, 0, 0.3);
                    padding: 0.3rem 1rem;
                    border-radius: 8px;
                    font-weight: 700;
                    letter-spacing: 1px;
                    border: 2px solid rgba(255, 255, 255, 0.5);
                }

                .cta-buttons {
                    display: flex;
                    gap: 1rem;
                    justify-content: center;
                    flex-wrap: wrap;
                }

                .btn {
                    display: inline-flex;
                    align-items: center;
                    gap: 0.5rem;
                    padding: 1rem 2rem;
                    border-radius: 50px;
                    font-weight: 700;
                    font-size: 1rem;
                    text-decoration: none;
                    border: none;
                    cursor: pointer;
                    transition: all 0.3s ease;
                }

                .btn svg {
                    font-size: 1.3rem;
                }

                .btn-primary {
                    background: #000000;
                    color: white;
                }

                .btn-primary:hover {
                    background: #1a1a1a;
                    transform: translateY(-3px);
                    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
                }

                .btn-secondary {
                    background: white;
                    color: #f44032;
                }

                .btn-secondary:hover {
                    background: #f8f9fa;
                    transform: translateY(-3px);
                    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.2);
                }

                /* Responsive */
                @media (max-width: 991px) {
                    .offer-title {
                        font-size: 2rem;
                    }
                    
                    .discount-badge {
                        margin-top: 2rem;
                    }

                    .quick-info-grid {
                        grid-template-columns: 1fr;
                    }

                    .offer-image-container {
                        margin-top: 2rem;
                    }

                    .cta-buttons {
                        flex-direction: column;
                    }

                    .btn {
                        width: 100%;
                        justify-content: center;
                    }
                }
            `}</style>
        </>
    );
}
