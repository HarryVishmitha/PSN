import React, { useEffect, useState } from 'react';
import { usePage } from '@inertiajs/react';
import axios from 'axios';
import { Head, Link } from '@inertiajs/react';
import Header from '../Components/Header';
import CookieConsent from '@/Components/CookieConsent';
import Meta from '@/Components/Metaheads';
import Breadcrumb from '@/Components/BreadcrumbHome';
import Footer from '@/Components/Footer';
import { Icon } from "@iconify/react";
import { useMemo } from 'react';


const SharedDesigns = () => {
    const { token } = usePage().props; // Passed via Inertia route
    const [loading, setLoading] = useState(true);
    const [requiresPassword, setRequiresPassword] = useState(false);
    const [password, setPassword] = useState('');
    const [data, setData] = useState(null);
    const [error, setError] = useState(null);
    const [showPassword, setShowPassword] = useState(false);
    const [imageUrl, setImageUrl] = useState(null);
    const [isImageLoading, setIsImageLoading] = useState(true);


    // Fetch token data on mount
    useEffect(() => {
        const tokenFromURL = window.location.pathname.split('/').pop();
        axios.get(`/api/share/${tokenFromURL}`)
            .then(res => {
                if (res.data.requires_password) {
                    setRequiresPassword(true);
                } else {
                    setData(res.data);
                }
            })
            .catch(err => {
                setError(err.response?.data?.message || 'Link error');
            })
            .finally(() => setLoading(false));
    }, []);

    // Handle password submission
    const handlePasswordSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        const tokenFromURL = window.location.pathname.split('/').pop();

        try {
            const res = await axios.post(`/api/share/${tokenFromURL}/verify`, { password });
            setData(res.data);
            setRequiresPassword(false);
        } catch (err) {
            setError(err.response?.data?.message || 'Wrong password');
        } finally {
            setLoading(false);
        }
    };

    const fetchRandomImage = async () => {
        try {
            const response = await fetch(route('api.random-image'));
            const data = await response.json();
            setImageUrl(data.imageUrl);
        } catch (error) {
            console.error("Image fetch failed", error);
        } finally {
            setIsImageLoading(false);
        }
    };

    useEffect(() => {
        fetchRandomImage();

        const tokenFromURL = window.location.pathname.split('/').pop();
        axios.get(`/api/share/${tokenFromURL}`)
            .then(res => {
                if (res.data.requires_password) {
                    setRequiresPassword(true);
                } else {
                    setData(res.data);
                }
            })
            .catch(err => {
                setError(err.response?.data?.message || 'Link error');
            })
            .finally(() => setLoading(false));
    }, []);


    let groupedDesigns = {};

    if (data?.designs && Array.isArray(data.designs)) {
        groupedDesigns = data.designs.reduce((acc, design) => {
            const key = `${design.width}x${design.height}`;
            if (!acc[key]) {
                acc[key] = [];
            }
            acc[key].push(design);
            return acc;
        }, {});
    }



    useEffect(() => {
        const blockShortcuts = (e) => {
            const key = e.key.toLowerCase();
            if (
                (e.ctrlKey && ['s', 'u', 'p'].includes(key)) || // Save, View Source, Print
                key === 'f12' || // Dev Tools
                (e.metaKey && ['s', 'u', 'p'].includes(key)) // macOS command key
            ) {
                e.preventDefault();
                alert('🔒 Download or inspection is disabled.');
            }
        };

        const disablePrintScreen = (e) => {
            if (e.key === 'PrintScreen') {
                navigator.clipboard.writeText('');
                alert('🛡️ Screenshots are disabled!');
            }
        };

        document.addEventListener('keydown', blockShortcuts);
        document.addEventListener('keyup', disablePrintScreen);

        return () => {
            document.removeEventListener('keydown', blockShortcuts);
            document.removeEventListener('keyup', disablePrintScreen);
        };
    }, []);



    if (loading) return (
        <>
            <Head title={`Loading...`} />
            <div className="tw-fixed tw-inset-0 tw-z-50 tw-flex tw-flex-col tw-items-center tw-justify-center tw-bg-white tw-bg-opacity-90">
                <div className="tw-relative tw-w-16 tw-h-16 tw-mb-4">
                    <div className="tw-absolute tw-inset-0 tw-rounded-full tw-border-4 tw-border-[#f44032] tw-border-t-transparent tw-animate-spin"></div>
                </div>
                <p className="tw-text-gray-600 tw-font-medium tw-text-sm tw-text-center">Loading Shared Designs...</p>
            </div>
        </>
    );

    if (error && !requiresPassword) {
        return (
            <>
                <Head title="Link Error" />
                <div className="tw-min-h-screen tw-flex tw-flex-col tw-items-center tw-justify-center tw-bg-gray-50 tw-px-4">
                    <Link href="/">
                        <div className="tw-flex tw-justify-center tw-mb-4">
                            <img
                                src="/assets/images/logo-full.png" // Update to your actual logo path
                                alt="Printair Logo"
                                className="tw-w-[25%] tw-object-contain"
                            />
                        </div>
                    </Link>
                    <Icon icon="mdi:alert-circle-outline" width="60" className="tw-text-red-500 tw-mb-2" />
                    <h4 className="tw-text-2xl tw-font-bold tw-mb-2">Oops! Something went wrong.</h4>
                    <p className="tw-text-gray-600 tw-text-center tw-max-w-md tw-mb-6">{error}</p>

                    <div className="tw-flex tw-gap-3">
                        <button
                            onClick={() => window.location.reload()}
                            className="tw-bg-red-500 tw-text-white tw-px-4 tw-py-2 tw-rounded hover:tw-bg-red-600 tw-transition"
                        >
                            Retry
                        </button>
                        <Link
                            href="/"
                            className="tw-border tw-border-gray-300 tw-text-gray-700 tw-px-4 tw-py-2 tw-rounded hover:tw-bg-gray-100 tw-transition"
                        >
                            Go to Home
                        </Link>
                    </div>
                </div>
            </>
        );
    }


    if (requiresPassword) {
        return (
            <>
                <Head title="Protected Link | Designs" />
                <div
                    className="tw-min-h-screen tw-flex tw-items-center tw-justify-center tw-bg-cover tw-bg-center tw-relative"
                    style={{
                        backgroundImage: imageUrl ? `url(${imageUrl})` : undefined,
                    }}
                >
                    <div className="tw-absolute tw-inset-0 tw-bg-black/40"></div> {/* dark overlay */}
                    <div className="tw-z-10 tw-bg-white tw-shadow-lg tw-rounded-xl tw-p-8 tw-max-w-md tw-w-full tw-text-center">
                        <div>
                            <Link href="/">
                                <div className="tw-flex tw-justify-center tw-mb-4">
                                    <img
                                        src="/assets/images/logo-full.png" // Update to your actual logo path
                                        alt="Printair Logo"
                                        className="tw-w-[50%] tw-object-contain"
                                    />
                                </div>
                            </Link>
                            <div className="tw-flex tw-flex-col tw-items-center tw-mb-4">
                                <div className="tw-text-4xl">🔒</div>
                                <h4 className="tw-font-bold tw-mt-2 ">Password Required</h4>
                            </div>
                            <p className="tw-text-sm tw-text-gray-500 tw-mb-6">This shared link is protected. Please enter the password to view designs.</p>

                            {error && <div className="alert alert-danger tw-text-sm tw-mb-3">{error}</div>}

                            <form onSubmit={handlePasswordSubmit} className="tw-space-y-4">
                                <div className="tw-relative">
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        className="form-control tw-w-full"
                                        placeholder="Enter password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(prev => !prev)}
                                        className="tw-absolute tw-inset-y-0 tw-right-0 tw-pr-3 tw-flex tw-items-center tw-text-gray-500"
                                        tabIndex={-1}
                                    >
                                        <Icon icon={showPassword ? 'mdi:eye-off' : 'mdi:eye'} width="20" />
                                    </button>
                                </div>
                                <button type="submit" className="btn btn-danger w-100">Unlock Designs</button>
                            </form>
                        </div>
                    </div>
                </div>
            </>
        );
    }


    return (

        <div

            onContextMenu={(e) => e.preventDefault()}
            onDragStart={(e) => e.preventDefault()}
        >
            <Head title={`Shared Designs for ${data.product.name}`} />
            <Meta
                title={`Designs shared by ${data.shared_by.name} for ${data.product.name} | Printair`}
                description={`View ${data.designs.length} exclusive design${data.designs.length > 1 ? 's' : ''} shared for ${data.product.name}. Secure access powered by Printair.`}
                url={`https://printair.lk/share/${token}`}
                keywords={`Printair, shared designs, ${data.product.name}, secure link, design showcase, digital printing, ${data.shared_by.name}`}
                canonical={`https://printair.lk/share/${token}`}
                author={data.shared_by.name}
                robots="noindex, nofollow"
            />

            <Header />
            <Breadcrumb items={[{ label: 'Share', href: '#' }, { label: 'Designs', href: '#' }]} />
            <div className="tw-max-w-6xl tw-mx-auto tw-my-12">
                <div className="tw-max-w-6xl tw-mx-auto tw-my-12 tw-text-center">
                    <div className="tw-mb-2">🎨 {data.shared_by.name} invites you to view designs of:</div>
                    <h4 className="tw-text-2xl tw-text-[#f44032] tw-font-extrabold tw-mb-3">{data.product.name}</h4>

                    {data.product.description && (
                        <p className="tw-text-base tw-text-gray-600 tw-mb-3">{data.product.description}</p>
                    )}

                    <p className="tw-text-sm tw-text-gray-500 tw-mb-3">
                        Shared by {data.shared_by.name} • Views: {data.views}
                    </p>

                    <div className="tw-bg-red-100 tw-border tw-border-red-400 tw-text-red-700 tw-px-4 tw-py-3 tw-rounded tw-text-sm tw-mb-6" role="alert">
                        <strong className="tw-font-bold">⚠️ Please Note:</strong>
                        <span className="tw-block tw-sm:inline"> These designs are protected by copyright. Unauthorized use, duplication, or distribution is strictly prohibited. All rights reserved by Printair and the original designer.</span>
                    </div>

                </div>

                <div className="tw-mt-10">
                    {Object.entries(groupedDesigns).length === 0 ? (
                        <div className="tw-text-center tw-text-gray-500 tw-py-16">
                            <h4 className="tw-text-lg tw-font-semibold">No designs available</h4>
                            <p className="tw-text-sm tw-mt-1">This shared link does not include any accessible designs.</p>
                        </div>
                    ) : (
                        <div className="tw-space-y-12">
                            {Object.entries(groupedDesigns).map(([sizeKey, designs]) => (
                                <div key={sizeKey}>
                                    <h5 className="tw-text-xl tw-font-bold tw-mb-4 tw-text-[#f44032]">{sizeKey} Designs</h5>

                                    <div className="tw-overflow-x-auto tw-scrollbar-hide">
                                        <div className="tw-flex tw-gap-6 tw-min-w-full">
                                            {designs.map((design) => (
                                                <div
                                                    key={design.id}
                                                    className="tw-w-56 tw-bg-white tw-border tw-rounded-xl tw-overflow-hidden tw-shadow-sm hover:tw-shadow-lg tw-transition-all tw-flex-shrink-0"
                                                    onContextMenu={(e) => e.preventDefault()}
                                                    onDragStart={(e) => e.preventDefault()}
                                                >
                                                    <div className="tw-w-full tw-max-h-[280px] tw-bg-gray-100 tw-flex tw-items-center tw-justify-center tw-overflow-hidden">
                                                        <img
                                                            src={design.image_url}
                                                            alt={design.name}
                                                            draggable={false}
                                                            referrerPolicy="no-referrer"
                                                            onError={(e) => { e.target.src = '/assets/images/placeholder.jpg'; }}
                                                            className="tw-max-w-full tw-max-h-[280px] tw-object-contain tw-transition-transform group-hover:tw-scale-105"
                                                        />
                                                    </div>

                                                    <div className="tw-p-3 tw-space-y-1">
                                                        <h5 className="tw-text-sm tw-font-semibold">{design.name}</h5>
                                                        <p className="tw-text-xs tw-text-gray-500">Uploaded: {design.created_at ? new Date(design.created_at).toLocaleDateString() : 'N/A'}</p>
                                                        {design.resolution && (
                                                            <p className="tw-text-xs tw-text-gray-500">Resolution: {design.resolution}</p>
                                                        )}
                                                        <p className="tw-text-xs tw-text-gray-500">Size: {design.width} x {design.height}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>



            </div>

            <CookieConsent />
            <Footer />
        </div>

    );
};

export default SharedDesigns;
