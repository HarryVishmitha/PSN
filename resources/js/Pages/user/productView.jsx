import React, { useState, useEffect, useMemo } from 'react';
import { Head } from '@inertiajs/react';
import axios from 'axios';
import UserDashboard from '@/Layouts/UserDashboard';
import Breadcrumb from '@/Components/Breadcrumb';
import { Icon } from '@iconify/react';
import Alert from '@/Components/Alert';
import Meta from '@/Components/Metaheads';

const ProductView = ({ userDetails, WG, product, wginactivating }) => {
    const [alert, setAlert] = useState(null);
    const [loadingDesigns, setLoadingDesigns] = useState(true);
    const [showShareModal, setShowShareModal] = useState(false);
    const [shareForm, setShareForm] = useState({
        password: '',
        expires_at: '',
        view_limit: '',
    });
    const [shareResult, setShareResult] = useState(null);
    const [shareLinks, setShareLinks] = useState([]); // For existing links
    const [isLoadingShareLinks, setIsLoadingShareLinks] = useState(true);



    // Memoized grouping of variants and subvariants
    const groupedVariants = useMemo(() => {
        return product.variants.reduce((acc, v) => {
            let group = acc.find(g => g.name === v.variant_name);
            if (!group) {
                group = { name: v.variant_name, label: v.variant_name, options: [] };
                acc.push(group);
            }
            const subs = (v.subvariants || []).map(sv => ({
                value: sv.subvariant_value,
                priceAdjustment: parseFloat(sv.price_adjustment) || 0,
            }));
            group.options.push({
                value: v.variant_value,
                priceAdjustment: parseFloat(v.price_adjustment) || 0,
                subvariants: subs,
                subLabel: subs.length ? v.subvariants[0].subvariant_name : '',
            });
            return acc;
        }, []);
    }, [product.variants]);

    // Initialize selectedVariants (empty to allow deselect)
    const [selectedVariants, setSelectedVariants] = useState({});

    // Compute the total price (base + variant adjustments + subvariant adjustments)
    const computedPrice = useMemo(() => {
        const base = parseFloat(
            product.pricing_method === 'roll' ? product.price_per_sqft : product.price
        ) || 0;
        return groupedVariants.reduce((sum, group) => {
            const sel = selectedVariants[group.name];
            if (!sel) return sum;
            const opt = group.options.find(o => o.value === sel);
            let total = sum + (opt?.priceAdjustment || 0);
            const subSel = selectedVariants[`${group.name}-sub`];
            if (subSel && opt) {
                const subOpt = opt.subvariants.find(s => s.value === subSel);
                total += (subOpt?.priceAdjustment || 0);
            }
            return total;
        }, base);
    }, [groupedVariants, selectedVariants, product.pricing_method, product.price, product.price_per_sqft]);

    // Prepare images array (fallback to a default if empty)
    const images = product.images && product.images.length > 0
        ? product.images.map(img => img.image_url)
        : ['/images/default-product.png'];
    const [selectedIndex, setSelectedIndex] = useState(0);

    // Track which design-size groups are open
    const [openGroups, setOpenGroups] = useState({});
    const handleToggle = (sizeLabel, isNowOpen) => {
        setOpenGroups(prev => ({ ...prev, [sizeLabel]: isNowOpen }));
    };

    // Fetch designs and group them by “width x height”
    const [designs, setDesigns] = useState([]);
    const [groupedDesigns, setGroupedDesigns] = useState({});

    useEffect(() => {
        setLoadingDesigns(true);
        axios
            .get(`/user/api/${product.id}/designs`)
            .then(res => {
                const data = res.data || [];
                setDesigns(data);
                const grouped = data.reduce((acc, d) => {
                    const key = `${d.width} x ${d.height}`;
                    if (!acc[key]) acc[key] = [];
                    acc[key].push(d);
                    return acc;
                }, {});
                setGroupedDesigns(grouped);
            })
            .catch(err => {
                console.error('Failed to load designs:', err);
                setAlert({ type: 'error', message: 'Unable to load designs. Try again later.' });
                setDesigns([]);
                setGroupedDesigns({});
            })
            .finally(() => {
                setLoadingDesigns(false);
            });
    }, [product.id]);

    // Fallback thumbnail if image is missing
    const thumbnailPlaceholder = 'https://flowbite.com/docs/images/examples/image-3@2x.jpg';
    const handleImageError = e => {
        e.currentTarget.src = thumbnailPlaceholder;
    };

    const handleShareSubmit = async () => {
        try {
            const response = await axios.post(`/user/api/product/${product.id}/share`, shareForm);

            setShareResult(response.data.link);
            setAlert({
                type: 'success',
                message: 'Designs shared successfully!',
            });

            // Refresh share links (if displaying list)
            setShareLinks(prev => [...prev, response.data]);

            // Reset modal state
            setShowShareModal(false);
            setShareForm({ password: '', expires_at: '', view_limit: '' });
        } catch (error) {
            console.error('Failed to create share link:', error);
            setAlert({
                type: 'danger',
                message: error.response?.data?.message || 'Failed to create share link.',
            });
        }
    };

    useEffect(() => {
        setIsLoadingShareLinks(true);
        axios.get(`/user/api/product/${product.id}/shared-links`)
            .then(res => {
                setShareLinks(res.data?.links || []);
            })
            .catch(err => {
                console.error("Failed to fetch shared links:", err);
            })
            .finally(() => {
                setIsLoadingShareLinks(false);
            });
    }, [product.id]);



    return (
        <>
            <Head title={product.name} />
            <Meta title={product.name} description={product.meta_description} />
            <UserDashboard userDetails={userDetails} WG={WG}>
                <Breadcrumb title="Product View" />

                {alert && (
                    <Alert
                        type={alert.type}
                        message={alert.message}
                        onClose={() => setAlert(null)}
                    />
                )}

                {wginactivating && (
                    <div className="alert alert-warning d-flex align-items-center" role="alert">
                        <Icon icon="ri:information-line" className="tw-text-2xl tw-mr-2" />
                        <div>
                            Your account is being inactivated. Please contact admins for more
                            information.
                        </div>
                    </div>
                )}

                <div className="card">
                    <div className="card-body">
                        <div className="lg:tw-grid lg:tw-grid-cols-2 lg:tw-gap-8 xl:tw-gap-16 tw-mt-4">
                            {/* Image Section */}
                            <div className="image-section tw-w-full">
                                <div className="tw-shrink-0 tw-max-w-md lg:tw-max-w-lg tw-mx-auto">
                                    <img
                                        className="tw-w-full tw-object-contain"
                                        src={images[selectedIndex]}
                                        alt={`${product.name} photo ${selectedIndex + 1}`}
                                        loading="lazy"
                                        onError={handleImageError}
                                    />
                                </div>

                                {/* Thumbnails */}
                                <div className="tw-flex tw-justify-center tw-mt-6">
                                    <div className="tw-flex tw-gap-5">
                                        {images.map((imgUrl, idx) => (
                                            <img
                                                key={idx}
                                                className={`
                          tw-w-16 tw-h-16 tw-object-cover tw-rounded-lg tw-cursor-pointer
                          ${selectedIndex === idx ? 'tw-ring-2 tw-ring-blue-600' : ''}
                        `}
                                                src={imgUrl}
                                                alt={`${product.name} thumbnail ${idx + 1}`}
                                                loading="lazy"
                                                onError={handleImageError}
                                                onClick={() => setSelectedIndex(idx)}
                                            />
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Details Section */}
                            <div className="details-section">
                                <div className="tw-text-2xl tw-text-black dark:tw-text-white tw-font-semibold">
                                    {product.name}
                                </div>
                                <div className="tw-text-green-500 d-flex align-items-center tw-text-sm">
                                    <span className="tw-me-1">
                                        <Icon icon="jam:store" />
                                    </span>
                                    In Stock
                                </div>

                                {/* Price Section */}
                                <div className="tw-text-black dark:tw-text-white tw-text-xl tw-mt-4">
                                    <span className="tw-text-semibold tw-text-gray-700 dark:tw-text-gray-400 tw-text-sm tw-me-1">
                                        LKR.
                                    </span>
                                    <span className="tw-font-semibold">
                                        {computedPrice.toLocaleString('en-US', {
                                            minimumFractionDigits: 2,
                                            maximumFractionDigits: 2,
                                        })}
                                    </span>
                                    <span className="tw-text-sm tw-font-normal tw-text-gray-500 dark:tw-text-gray-400 tw-ms-2">
                                        per {product.pricing_method === 'roll' ? 'Sq.Ft' : 'unit'}
                                    </span>
                                </div>

                                {/* Variants Section (buttons allow deselect) */}
                                <div className="variants lg:tw-grid lg:tw-grid-cols-2 lg:tw-gap-4 xl:tw-gap-8 tw-mt-4">
                                    {groupedVariants.map(group => {
                                        const selected = selectedVariants[group.name];
                                        const parentOpt = group.options.find(o => o.value === selected);
                                        return (
                                            <div key={group.name} className="tw-text-gray-700 dark:tw-text-gray-300 tw-text-sm">
                                                <div className="tw-font-semibold tw-mb-2">{group.label}</div>
                                                <div className="tw-flex tw-flex-wrap">
                                                    {group.options.map((opt, idx) => {
                                                        const isSelected = selected === opt.value;
                                                        return (
                                                            <button
                                                                key={`${group.name}-${opt.value}-${idx}`}
                                                                type="button"
                                                                onClick={() => {
                                                                    if (isSelected) {
                                                                        // Deselect if already selected
                                                                        setSelectedVariants(prev => {
                                                                            const copy = { ...prev };
                                                                            delete copy[group.name];
                                                                            delete copy[`${group.name}-sub`];
                                                                            return copy;
                                                                        });
                                                                    } else {
                                                                        setSelectedVariants(prev => ({
                                                                            ...prev,
                                                                            [group.name]: opt.value,
                                                                            // Clear any previous subvariant when selecting a new variant
                                                                            [`${group.name}-sub`]: undefined,
                                                                        }));
                                                                    }
                                                                }}
                                                                className={`
                                  tw-cursor-pointer tw-px-4 tw-py-1 tw-rounded-md tw-border tw-text-sm tw-mr-2 tw-mb-2
                                  ${isSelected
                                                                        ? 'tw-bg-blue-600 tw-text-white tw-border-blue-600'
                                                                        : 'tw-border-gray-500 tw-text-gray-800'}
                                `}
                                                            >
                                                                {opt.value}
                                                            </button>
                                                        );
                                                    })}
                                                </div>

                                                {/* Subvariants (buttons) */}
                                                {parentOpt && parentOpt.subvariants.length > 0 && (
                                                    <div className="tw-mt-3">
                                                        <div className="tw-font-semibold tw-mb-2">{parentOpt.subLabel}</div>
                                                        <div className="tw-flex tw-flex-wrap">
                                                            {parentOpt.subvariants.map((sub, si) => {
                                                                const isSubSelected = selectedVariants[`${group.name}-sub`] === sub.value;
                                                                return (
                                                                    <button
                                                                        key={`${group.name}-sub-${sub.value}-${si}`}
                                                                        type="button"
                                                                        onClick={() => {
                                                                            if (isSubSelected) {
                                                                                // Deselect subvariant
                                                                                setSelectedVariants(prev => {
                                                                                    const copy = { ...prev };
                                                                                    delete copy[`${group.name}-sub`];
                                                                                    return copy;
                                                                                });
                                                                            } else {
                                                                                setSelectedVariants(prev => ({
                                                                                    ...prev,
                                                                                    [`${group.name}-sub`]: sub.value,
                                                                                }));
                                                                            }
                                                                        }}
                                                                        className={`
                                      tw-cursor-pointer tw-px-4 tw-py-1 tw-rounded-md tw-border tw-text-sm tw-mr-2 tw-mb-2
                                      ${isSubSelected
                                                                                ? 'tw-bg-blue-600 tw-text-white tw-border-blue-600'
                                                                                : 'tw-border-gray-500 tw-text-gray-800'}
                                    `}
                                                                    >
                                                                        {sub.value}
                                                                    </button>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Buttons Section */}
                                <div className="lg:tw-grid lg:tw-grid-cols-2 lg:tw-gap-4 xl:tw-gap-8 tw-mt-4 lg:tw-w-3/4 tw-w-full tw-mb-3">
                                    <button
                                        className="btn tw-w-full tw-bg-gray-50 dark:tw-bg-gray-700 hover:tw-bg-gray-200 hover:dark:tw-bg-gray-500 tw-text-gray-600 hover:tw-text-blue-600 dark:tw-text-gray-300 hover:dark:tw-text-white tw-border-gray-400 dark:tw-border-gray-500 hover:dark:tw-border-gray-300 hover:tw-border-gray-400 tw-border tw-rounded-lg tw-py-2 tw-px-4 d-flex align-items-center tw-text-center justify-content-center"
                                    >
                                        <Icon icon="mdi:heart-outline" className="tw-text-xl tw-mr-2" />
                                        Add to favorites
                                    </button>
                                    <button
                                        className="btn btn-outline-primary tw-min-w-48 tw-w-full d-flex align-items-center justify-content-center tw-text-center tw-mt-3 lg:tw-mt-0"
                                    >
                                        <Icon icon="mdi:cart-plus" className="tw-text-xl tw-mr-2" />
                                        Add to cart
                                    </button>
                                </div>

                                <hr className="my-6 md:my-8 border-gray-200 dark:border-gray-800" />

                                {/* Description Section */}
                                <div
                                    className="tw-text-gray-500 tw-text-sm dark:tw-text-gray-400 tw-leading-relaxed tw-mt-3"
                                    dangerouslySetInnerHTML={{
                                        __html:
                                            product.description ||
                                            'No description available for this product. Contact the shop for more details. Call us - 076 886 0175 or email us - contact@printair.lk',
                                    }}
                                />

                                <hr className="my-6 md:my-8 border-gray-200 dark:border-gray-800" />

                                {/* Additional Information Section */}
                                <div className="additional-info tw-text-sm tw-text-gray-600 dark:tw-text-gray-400 tw-mt-3 tw-mb-3">
                                    <div className="categories">
                                        <span className="tw-font-semibold tw-text-xs tw-text-gray-700 dark:tw-text-gray-300 tw-me-2">
                                            Categories:
                                        </span>
                                        {product.categories && product.categories.length > 0 ? (
                                            product.categories.map((category, index) => (
                                                <span key={index} className="tw-text-blue-500 tw-me-2 tw-text-xs">
                                                    {category.name}
                                                </span>
                                            ))
                                        ) : (
                                            <span className="tw-text-gray-400 dark:tw-text-gray-600 tw-me-2 tw-text-xs">
                                                Uncategorized
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <hr className="my-6 md:my-8 border-gray-200 dark:border-gray-800" />


                        <div className="tw-flex tw-items-center tw-justify-between tw-mb-3">
                            <div className="tw-flex tw-items-center tw-gap-2">
                                <div className="tw-text-xl tw-text-black dark:tw-text-white tw-font-semibold">
                                    Designs
                                    <p className="tw-text-gray-500 dark:tw-text-gray-400 tw-text-sm tw-mb-4 tw-font-normal">
                                        Here are some designs related to this product.
                                    </p>
                                </div>


                                {isLoadingShareLinks ? (
                                    <span className="badge bg-secondary tw-text-white tw-text-xs tw-rounded-lg tw-px-2 tw-py-1 tw-flex tw-items-center">
                                        <Icon icon="mdi:loading" className="tw-animate-spin tw-mr-1" />
                                        Checking shares...
                                    </span>
                                ) : (
                                    shareLinks.length > 0 && (
                                        <span className="badge bg-primary tw-text-white tw-text-xs tw-rounded-lg tw-px-2 tw-py-1">
                                            🔐 Shared with {shareLinks.length} link{shareLinks.length > 1 ? 's' : ''}
                                        </span>
                                    )
                                )}
                            </div>
                            <button
                                onClick={() => setShowShareModal(true)}
                                className="btn btn-sm btn-outline-primary tw-flex tw-items-center tw-gap-1"
                            >
                                <Icon icon="mdi:link-variant" />
                                Share Designs
                            </button>
                        </div>

                        {/* Sharable Links Section */}
                        {shareResult && (
                            <div className="alert alert-success tw-flex tw-flex-col lg:tw-flex-row tw-gap-4 tw-justify-between tw-items-start lg:tw-items-center tw-mt-4 tw-rounded-lg tw-border tw-border-green-300 tw-bg-green-50 tw-p-4">
                                <div className="tw-space-y-1 tw-w-full lg:tw-w-auto">
                                    <div className="tw-font-medium tw-text-green-800">
                                        🔗 Share Link Created Successfully!
                                    </div>
                                    <div className="tw-flex tw-items-center tw-gap-2 tw-flex-wrap">
                                        <code className="tw-text-xs tw-bg-green-100 tw-px-2 tw-py-1 tw-rounded tw-text-green-800 tw-break-all">
                                            {shareResult}
                                        </code>
                                        <button
                                            className="btn btn-sm btn-outline-success"
                                            onClick={() => {
                                                navigator.clipboard.writeText(shareResult);
                                                setAlert({
                                                    type: 'success',
                                                    message: 'Link copied to clipboard!',
                                                });
                                                setTimeout(() => setAlert(null), 3000);
                                            }}
                                        >
                                            Copy
                                        </button>
                                    </div>

                                    {/* Optional Details */}
                                    <div className="tw-text-xs tw-text-gray-700">
                                        <span className="tw-font-semibold">Note:</span> This link is {shareForm.password ? "🔒 password protected" : "🔓 public"}{shareForm.expires_at && `, expires on ${new Date(shareForm.expires_at).toLocaleString()}`}.
                                    </div>
                                </div>
                            </div>
                        )}

                        {!isLoadingShareLinks && shareLinks.length > 0 && (
                            <div className="tw-mt-4 tw-mb-4">
                                <h6 className="tw-text-sm tw-font-semibold tw-text-gray-700 mb-3">
                                    🔐 Previously Shared Links
                                </h6>

                                <ul className="tw-space-y-3">
                                    {shareLinks.map((link, idx) => (
                                        <li
                                            key={idx}
                                            className="tw-bg-gray-50 dark:tw-bg-gray-800 tw-p-4 tw-rounded-lg tw-border tw-border-gray-200 dark:tw-border-gray-600"
                                        >
                                            <div className="tw-flex tw-items-center tw-justify-between tw-gap-4 tw-flex-wrap">
                                                <div className="tw-flex-1">
                                                    <code className="tw-text-xs tw-break-all tw-block tw-text-blue-600 dark:tw-text-blue-400">
                                                        {link.url}
                                                    </code>
                                                    <div className="tw-text-xs tw-text-gray-600 dark:tw-text-gray-400 tw-mt-1">
                                                        Created by: <strong>{link.created_by}</strong> • Views: <strong>{link.views}</strong> •
                                                        {link.expires_at ? (
                                                            <> Expires: <strong>{new Date(link.expires_at).toLocaleString()}</strong> • </>
                                                        ) : ' '}
                                                        {link.has_password ? '🔒 Password Protected' : '🔓 Public'}
                                                    </div>
                                                    <div className="tw-text-xs tw-text-gray-400">
                                                        Created: {new Date(link.created_at).toLocaleString()}
                                                    </div>
                                                </div>
                                                <button
                                                    className="btn btn-sm btn-outline-secondary"
                                                    onClick={() => {
                                                        navigator.clipboard.writeText(link.url);
                                                        setAlert({
                                                            type: 'success',
                                                            message: 'Link copied to clipboard!',
                                                        });
                                                        setTimeout(() => setAlert(null), 3000);
                                                    }}
                                                >
                                                    Copy
                                                </button>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}





                        {/* Design Section */}

                        {loadingDesigns ? (
                            <div className="tw-flex tw-justify-center tw-items-center tw-py-6">
                                <Icon icon="mdi:loading" className="tw-animate-spin tw-text-2xl tw-text-gray-500" />
                                <span className="tw-text-gray-500">Loading Designs...</span>
                            </div>
                        ) : designs.length === 0 ? (
                            <div className="tw-text-center tw-text-gray-500 tw-py-6">
                                No designs added to this product.
                            </div>
                        ) : (
                            Object.entries(groupedDesigns).map(([sizeLabel, items]) => (
                                <details
                                    key={sizeLabel}
                                    className="dark:tw-border-gray-600 tw-rounded-lg tw-mb-4"
                                    onToggle={e => handleToggle(sizeLabel, e.currentTarget.open)}
                                >
                                    <summary className="tw-flex tw-justify-between tw-items-center tw-p-4 tw-cursor-pointer tw-text-gray-800 dark:tw-text-gray-200 tw-font-medium tw-bg-emerald-200 dark:tw-bg-emerald-900 tw-rounded-lg">
                                        {sizeLabel}
                                        <Icon
                                            icon={openGroups[sizeLabel] ? 'mdi:minus' : 'mdi:plus'}
                                            className="tw-w-5 tw-h-5"
                                        />
                                    </summary>

                                    <div className="tw-mt-5 lg:tw-grid lg:tw-grid-cols-5 lg:tw-gap-6 xl:tw-gap-6 tw-border tw-border-gray-300 tw-p-3 tw-rounded-lg tw-overflow-hidden tw-transition-all tw-duration-300 tw-ease-in-out">
                                        {items.map(design => (
                                            <div
                                                key={design.id}
                                                className="tw-bg-gray-100 dark:tw-bg-gray-800 tw-rounded-lg tw-p-4 tw-flex tw-flex-col tw-items-center"
                                            >
                                                <img
                                                    src={design.image_url}
                                                    alt={design.name}
                                                    className="tw-w-full tw-rounded-md"
                                                    loading="lazy"
                                                    onError={handleImageError}
                                                />
                                                <div className="tw-mt-2 tw-text-xs tw-text-gray-700 dark:tw-text-gray-300 tw-text-center">
                                                    {design.name}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </details>
                            ))
                        )}
                    </div>
                </div>


                {showShareModal && (
                    <div className="tw-fixed tw-inset-0 tw-bg-black/50 tw-z-50 tw-flex tw-items-center tw-justify-center">
                        <div className="modal-dialog tw-max-w-md tw-w-full">
                            <div className="modal-content tw-bg-white tw-rounded-lg tw-shadow-xl tw-relative tw-p-5">
                                <button
                                    type="button"
                                    className="btn-close tw-absolute tw-top-3 tw-end-3"
                                    onClick={() => setShowShareModal(false)}
                                ></button>

                                <h5 className="modal-title tw-text-lg tw-font-semibold mb-4">
                                    Create Share Link
                                </h5>

                                <div className="tw-space-y-4">
                                    <div>
                                        <label className="form-label tw-text-sm">Password (optional)</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            value={shareForm.password}
                                            onChange={(e) =>
                                                setShareForm({ ...shareForm, password: e.target.value })
                                            }
                                        />
                                        <div className="form-text tw-text-sm">
                                            Leave blank for no password
                                        </div>
                                    </div>

                                    <div>
                                        <label className="form-label tw-text-sm">Expires At (optional)</label>
                                        <input
                                            type="datetime-local"
                                            className="form-control"
                                            value={shareForm.expires_at}
                                            onChange={(e) =>
                                                setShareForm({ ...shareForm, expires_at: e.target.value })
                                            }
                                        />
                                        <div className="form-text tw-text-sm">
                                            Leave blank for no expiration
                                        </div>
                                    </div>

                                    <div>
                                        <label className="form-label tw-text-sm">View Limit (optional)</label>
                                        <input
                                            type="number"
                                            min={1}
                                            className="form-control"
                                            value={shareForm.view_limit}
                                            onChange={(e) =>
                                                setShareForm({ ...shareForm, view_limit: e.target.value })
                                            }
                                        />
                                        <div className="form-text tw-text-sm">
                                            Leave blank for unlimited views
                                        </div>
                                    </div>

                                    <div className="tw-flex tw-justify-end tw-gap-2 mt-4">
                                        <button
                                            onClick={() => setShowShareModal(false)}
                                            className="btn btn-secondary"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            className="btn btn-primary"
                                            onClick={handleShareSubmit}
                                        >
                                            Create Link
                                        </button>

                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}




            </UserDashboard>
        </>
    );
};

export default ProductView;
