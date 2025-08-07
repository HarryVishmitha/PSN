import React from "react";
import { Icon } from "@iconify/react";
import { Link } from "@inertiajs/react";

export default function ProductCard({ product, idx = 0 }) {
    return (
        <div
            className="tw-bg-white tw-rounded-xl tw-shadow-md hover:tw-shadow-xl tw-transition-all tw-flex tw-flex-col tw-h-full tw-border"
            data-aos="fade-up"
            data-aos-delay={idx * 150}
        >
            {/* Image Section */}
            <Link href={`/products/${product.id}`} className="tw-block">
                <div className="tw-relative tw-overflow-hidden tw-rounded-t-xl tw-h-64">
                    <img
                        src={product.image || "/images/default.png"}
                        alt={product.name}
                        className="tw-w-full tw-h-full tw-object-cover tw-transition-transform tw-duration-300 hover:tw-scale-105"
                    />

                    {/* Badges */}
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
            </Link>

            {/* Content Section */}
            <div className="tw-p-5 tw-flex tw-flex-col tw-flex-1">
                <h3 className="tw-text-lg tw-font-semibold tw-leading-tight tw-mb-1 tw-line-clamp-1">
                    <Link href={`/products/${product.id}`}>{product.name}</Link>
                </h3>

                {/* Rating */}
                <div className="tw-flex tw-items-center tw-mb-1">
                    {[...Array(5)].map((_, i) => (
                        <svg
                            key={i}
                            className={`tw-w-4 tw-h-4 tw-fill-current ${i < Math.floor(product.rating || 0) ? 'tw-text-yellow-400' : 'tw-text-gray-300'}`}
                            viewBox="0 0 20 20"
                        >
                            <path d="M10 15l-5.878 3.09 1.123-6.545L.49 6.91l6.564-.955L10 0l2.946 5.955 6.564.955-4.755 4.635 1.123 6.545z" />
                        </svg>
                    ))}
                    <span className="tw-text-sm tw-text-gray-500 tw-ml-2">({product.views?.toLocaleString() || 0} views)</span>
                </div>

                {/* Description */}
                <p className="tw-text-gray-600 tw-text-sm tw-mb-2 tw-line-clamp-2">
                    {product.short_description}
                </p>

                {/* Price + Stock */}
                <div className="tw-flex tw-items-center tw-justify-between">
                    <div>
                        <span className="tw-font-bold tw-text-[#f44032] tw-text-sm">
                            LKR {Number(product.starting_price).toLocaleString()}
                        </span>
                        <span className="tw-text-xs tw-text-gray-400 tw-ml-2">
                            {product.stock <= 5 ? `Only ${product.stock} left!` : 'In Stock'}
                        </span>
                    </div>
                </div>

                {/* Buttons */}
                <div className="tw-flex tw-gap-2 tw-mt-3">
                    {/* Add to Cart */}
                    <div className="tw-flex-1 tw-bg-[#f44032] tw-text-white tw-flex tw-items-center tw-justify-center tw-gap-2 tw-py-2 tw-rounded tw-font-semibold hover:tw-bg-red-600 tw-transition">
                        <Icon icon="mdi:cart-outline" className="tw-text-lg" />
                        Add to Cart
                    </div>

                    {/* Ask a Quote */}
                    <div className="tw-flex-1 tw-border tw-border-[#f44032] tw-text-[#f44032] tw-flex tw-items-center tw-justify-center tw-gap-2 tw-py-2 tw-rounded tw-font-semibold hover:tw-bg-[#f44032]/10 tw-transition">
                        <Icon icon="mdi:email-edit-outline" className="tw-text-lg" />
                        Ask a Quote
                    </div>
                </div>


                {/* Tags */}
                {product.tags?.length > 0 && (
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
                )}
            </div>
        </div>
    );
}
