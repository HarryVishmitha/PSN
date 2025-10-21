import React, { useEffect, useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import { Icon } from '@iconify/react';
import Meta from '@/Components/Metaheads';
import axios from 'axios';

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
                    <Icon icon="mdi:truck-fast-outline" className="shipping-icon" />
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

            <div className="offer-view-container">
                {/* Hero Image Section */}
                {offer.image && (
                    <div className="offer-hero-image">
                        <img src={`/storage/${offer.image}`} alt={offer.name} />
                        <div className="hero-overlay"></div>
                    </div>
                )}

                {/* Header */}
                <div className="offer-header">
                    <div className="container">
                        <div className="row align-items-center">
                            <div className="col-lg-8">
                                <div className="offer-title-section">
                                    <h1 className="offer-title">{offer.name}</h1>
                                    {offer.description && (
                                        <p className="offer-description">{offer.description}</p>
                                    )}
                                </div>
                            </div>
                            <div className="col-lg-4 text-lg-end">
                                {getDiscountBadge()}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Offer Details */}
                <div className="offer-details-section">
                    <div className="container">
                        <div className="row g-4">
                            {/* Countdown Timer */}
                            <div className="col-lg-4">
                                <div className="offer-card countdown-card">
                                    <div className="card-icon">
                                        <Icon icon="mdi:clock-outline" />
                                    </div>
                                    <h6 className="card-title">Time Remaining</h6>
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

                            {/* Offer Code */}
                            <div className="col-lg-4">
                                <div className="offer-card code-card">
                                    <div className="card-icon">
                                        <Icon icon="mdi:tag-outline" />
                                    </div>
                                    <h6 className="card-title">Offer Code</h6>
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

                            {/* Terms */}
                            <div className="col-lg-4">
                                <div className="offer-card terms-card">
                                    <div className="card-icon">
                                        <Icon icon="mdi:information-outline" />
                                    </div>
                                    <h6 className="card-title">Terms & Conditions</h6>
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

                {/* Products */}
                {offer.products && offer.products.length > 0 && (
                    <div className="products-section">
                        <div className="container">
                            <h2 className="section-title">
                                <Icon icon="mdi:tag-multiple-outline" className="me-2" />
                                Eligible Products
                            </h2>
                            <div className="row g-4">
                                {offer.products.map(product => (
                                    <div key={product.id} className="col-md-4 col-lg-3">
                                        <div className="product-card">
                                            {product.image && (
                                                <div className="product-image">
                                                    <img src={product.image} alt={product.name} />
                                                </div>
                                            )}
                                            <div className="product-info">
                                                <h6 className="product-name">{product.name}</h6>
                                                {product.description && (
                                                    <p className="product-description">
                                                        {product.description.substring(0, 80)}...
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* CTA Section */}
                <div className="cta-section">
                    <div className="container text-center">
                        <h3 className="cta-title">Ready to Save?</h3>
                        <p className="cta-description">Apply code <strong>{offer.code}</strong> at checkout</p>
                        <Link href="/" className="btn btn-primary btn-lg">
                            <Icon icon="mdi:shopping-outline" className="me-2" />
                            Start Shopping
                        </Link>
                    </div>
                </div>
            </div>

            <style jsx>{`
                .offer-view-container {
                    min-height: 100vh;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                }

                .offer-hero-image {
                    position: relative;
                    width: 100%;
                    height: 400px;
                    overflow: hidden;
                }

                .offer-hero-image img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                }

                .hero-overlay {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: linear-gradient(180deg, rgba(102, 126, 234, 0.3) 0%, rgba(118, 75, 162, 0.6) 100%);
                }

                .offer-header {
                    background: rgba(255, 255, 255, 0.1);
                    backdrop-filter: blur(10px);
                    padding: 4rem 0 3rem;
                    color: white;
                }

                .offer-title {
                    font-size: 3rem;
                    font-weight: 800;
                    margin-bottom: 1rem;
                    text-shadow: 2px 2px 4px rgba(0,0,0,0.2);
                }

                .offer-description {
                    font-size: 1.2rem;
                    opacity: 0.95;
                    max-width: 600px;
                }

                .discount-badge {
                    background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
                    padding: 2rem;
                    border-radius: 20px;
                    text-align: center;
                    box-shadow: 0 10px 30px rgba(0,0,0,0.3);
                    color: white;
                }

                .discount-badge.shipping {
                    background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
                }

                .discount-value {
                    font-size: 3rem;
                    font-weight: 900;
                    line-height: 1;
                }

                .discount-label {
                    font-size: 1.2rem;
                    font-weight: 700;
                    margin-top: 0.5rem;
                }

                .shipping-icon {
                    font-size: 3rem;
                }

                .offer-details-section {
                    padding: 3rem 0;
                }

                .offer-card {
                    background: white;
                    padding: 2rem;
                    border-radius: 15px;
                    box-shadow: 0 5px 20px rgba(0,0,0,0.1);
                    height: 100%;
                    transition: transform 0.3s;
                }

                .offer-card:hover {
                    transform: translateY(-5px);
                }

                .card-icon {
                    font-size: 3rem;
                    color: #667eea;
                    margin-bottom: 1rem;
                }

                .card-title {
                    font-weight: 700;
                    margin-bottom: 1.5rem;
                    color: #333;
                }

                .countdown-timer {
                    font-size: 2.5rem;
                    font-weight: 800;
                    color: #f5576c;
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
                    padding: 0.5rem;
                    background: #f8f9fa;
                    border-radius: 8px;
                }

                .date-item .label {
                    font-weight: 600;
                    color: #666;
                }

                .offer-code {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                    margin-bottom: 1rem;
                }

                .offer-code code {
                    flex: 1;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    padding: 1rem 1.5rem;
                    border-radius: 10px;
                    font-size: 1.5rem;
                    font-weight: 700;
                    letter-spacing: 2px;
                }

                .copy-btn {
                    background: #667eea;
                    color: white;
                    border: none;
                    padding: 1rem;
                    border-radius: 10px;
                    cursor: pointer;
                    font-size: 1.5rem;
                    transition: background 0.3s;
                }

                .copy-btn:hover {
                    background: #764ba2;
                }

                .code-hint {
                    color: #666;
                    font-size: 0.9rem;
                    margin: 0;
                }

                .terms-list {
                    list-style: none;
                    padding: 0;
                    margin: 0;
                }

                .terms-list li {
                    padding: 0.75rem;
                    border-left: 3px solid #667eea;
                    background: #f8f9fa;
                    margin-bottom: 0.5rem;
                    border-radius: 5px;
                }

                .products-section {
                    padding: 3rem 0;
                    background: rgba(255, 255, 255, 0.05);
                }

                .section-title {
                    color: white;
                    font-weight: 700;
                    margin-bottom: 2rem;
                    display: flex;
                    align-items: center;
                }

                .product-card {
                    background: white;
                    border-radius: 15px;
                    overflow: hidden;
                    box-shadow: 0 5px 20px rgba(0,0,0,0.1);
                    transition: transform 0.3s;
                }

                .product-card:hover {
                    transform: translateY(-5px);
                }

                .product-image {
                    width: 100%;
                    height: 200px;
                    overflow: hidden;
                }

                .product-image img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                }

                .product-info {
                    padding: 1.5rem;
                }

                .product-name {
                    font-weight: 700;
                    margin-bottom: 0.5rem;
                    color: #333;
                }

                .product-description {
                    color: #666;
                    font-size: 0.9rem;
                    margin: 0;
                }

                .cta-section {
                    padding: 4rem 0;
                    background: rgba(255, 255, 255, 0.1);
                    backdrop-filter: blur(10px);
                }

                .cta-title {
                    color: white;
                    font-weight: 800;
                    margin-bottom: 1rem;
                }

                .cta-description {
                    color: white;
                    font-size: 1.2rem;
                    margin-bottom: 2rem;
                }

                .btn-primary {
                    background: white;
                    color: #667eea;
                    border: none;
                    padding: 1rem 3rem;
                    font-weight: 700;
                    border-radius: 50px;
                    box-shadow: 0 5px 20px rgba(0,0,0,0.2);
                    transition: all 0.3s;
                }

                .btn-primary:hover {
                    transform: translateY(-3px);
                    box-shadow: 0 8px 30px rgba(0,0,0,0.3);
                    background: #f8f9fa;
                }

                @media (max-width: 991px) {
                    .offer-title {
                        font-size: 2rem;
                    }
                    
                    .discount-badge {
                        margin-top: 2rem;
                    }
                }
            `}</style>
        </>
    );
}
