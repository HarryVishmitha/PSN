// resources/js/Components/ProductCard.jsx
import React from 'react';
import { Link } from '@inertiajs/react';
import { Icon } from '@iconify/react';

const slugify = (s = '') =>
    s.toString().toLowerCase().trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');

const ProductCard = ({ product }) => {
    if (!product) return null;

    const {
        id,
        name,
        image,
        short_description,
        pricing_method,
        effective_price,
        price_unit,
        display_price,          // optional (preferred if backend sends)
        rating,
        views,
        stock,
        badge,
        discount,
        link,                   // optional (preferred)
    } = product;

    const href = link || `/public/${id}/product/${slugify(name)}`;
    const img = image || '/images/default.png';
    const priceText = display_price
        ? display_price
        : effective_price != null
            ? `Rs ${Number(effective_price).toFixed(2)} ${price_unit ? price_unit : ''}`.trim()
            : 'Contact for price';

    return (
        <div className="tw-bg-white tw-rounded-2xl tw-shadow-sm tw-overflow-hidden tw-border tw-border-gray-100 hover:tw-shadow-md tw-transition">
            <Link href={href} className="tw-block tw-relative">
                {/* Badges */}
                {(badge || discount) && (
                    <div className="tw-absolute tw-top-3 tw-left-3 tw-flex tw-gap-2 tw-z-10">
                        {badge && (
                            <span className="tw-text-xs tw-font-semibold tw-bg-black tw-text-white tw-rounded-full tw-px-2 tw-py-1">
                                {badge}
                            </span>
                        )}
                        {discount && (
                            <span className="tw-text-xs tw-font-semibold tw-bg-red-100 tw-text-red-700 tw-rounded-full tw-px-2 tw-py-1">
                                {discount}
                            </span>
                        )}
                    </div>
                )}

                <img
                    src={img}
                    alt={name}
                    className="tw-w-full tw-aspect-[4/3] tw-object-cover"
                    loading="lazy"
                />
            </Link>

            <div className="tw-p-4">
                <Link href={href} className="tw-no-underline">
                    <h4 className="tw-text-xl tw-font-extrabold tw-leading-tight tw-mb-1 tw-text-gray-900">
                        {name}
                    </h4>
                </Link>

                {short_description && (
                    <p className="tw-text-sm tw-text-gray-500 tw-mb-3" dangerouslySetInnerHTML={{ __html: short_description }} />
                )}

                {/* Meta */}
                <div className="tw-flex tw-items-center tw-justify-between tw-mb-3">
                    <div className="tw-flex tw-items-center tw-gap-1 tw-text-amber-400">
                        {/* simple static stars until real ratings */}
                        {[...Array(5)].map((_, i) => (
                            <Icon key={i} icon="mdi:star" className={`tw-text-base ${i < (rating || 0) ? '' : 'tw-text-amber-400'}`} />
                        ))}
                    </div>
                    <div className="tw-text-xs tw-text-gray-500">
                        ({views ?? 0} views)
                    </div>
                </div>

                {/* Price & stock */}
                <div className="tw-flex tw-items-center tw-justify-between tw-mb-4">
                    <div className="tw-text-[13px]">
                        <span className="tw-text-gray-400 tw-uppercase">Price</span>
                        <div className="tw-text-[#f44032] tw-font-bold tw-text-lg">{priceText}</div>
                    </div>
                    {typeof stock !== 'undefined' && stock !== null && (
                        <div className="tw-text-xs tw-text-gray-500">
                            {stock > 0 ? `Only ${stock} left!` : 'Out of stock'}
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div className="tw-flex tw-items-center tw-gap-2">
                    <Link
                        href={href}
                        className="tw-flex tw-items-center tw-gap-2 tw-text-sm tw-font-semibold tw-px-4 tw-py-2 tw-rounded-xl tw-bg-[#f44032] tw-text-white hover:tw-bg-[#e13124] hover:tw-text-white tw-no-underline"
                    >
                        <Icon icon="mdi:cart-plus" className="tw-text-lg" />
                        Add to Cart
                    </Link>
                    <Link
                        href="/quote"
                        className="tw-flex tw-items-center tw-gap-2 tw-text-sm tw-font-semibold tw-px-4 tw-py-2 tw-rounded-xl tw-border tw-border-gray-200 hover:tw-bg-gray-300 hover:tw-border-gray-300 tw-text-gray-700 tw-no-underline"
                    >
                        <Icon icon="mdi:email-fast-outline" className="tw-text-lg" />
                        Ask a Quote
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default ProductCard;
