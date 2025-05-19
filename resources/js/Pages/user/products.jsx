import React, { useState, useEffect, useRef } from 'react'
import { Head, Link, usePage, router } from '@inertiajs/react';
import axios from 'axios'
import UserDashboard from '@/Layouts/UserDashboard'
import Breadcrumb from "@/components/Breadcrumb"
import { Icon } from "@iconify/react"
import CookiesV from '@/Components/CookieConsent'
import Alert from "@/Components/Alert"
import Meta from "@/Components/Metaheads"

const Products = ({ userDetails, WG, wginactivating }) => {
    const [loading, setLoading] = useState(false);
    const [alert, setAlert] = useState(null)    // { type, message }
    const [products, setProducts] = useState([]);

    useEffect(() => {
        if (wginactivating) {
            setAlert({ type: 'warning', message: 'Your account is being inactivated. Please wait.' });
        }
    }, [wginactivating]);

    useEffect(() => {
        setLoading(true);
        setAlert(null);

        axios.get(route('user.getProducts'))
            .then(res => {
                setProducts(res.data);            // assume your API returns an array
            })
            .catch(err => {
                console.error(err);
                setAlert({ type: 'danger', message: 'Failed to load products.' });
            })
            .finally(() => setLoading(false));
    }, []);

    return (
        <>
            <Head title='Products' />
            <Meta title="Products" description={`Products for ${WG}`} />
            <UserDashboard userDetails={userDetails} WG={WG}>
                <Breadcrumb title="Products" />
                {alert && <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} />}
                {wginactivating && (
                    <div className="alert alert-warning d-flex align-items-center" role="alert">
                        <Icon icon="ri:information-line" className="tw-text-2xl tw-mr-2" />
                        <div>
                            Your account is being inactivated. Please contact admins for more information.
                        </div>
                    </div>
                )}
                <div className="card">
                    <div className="card-body">
                        <div className="row gy-2 gx-3 liagn-tems-center tw-gap-x-4 tw-gap-2">

                            <div role="status" class="tw-max-w-sm tw-animate-pulse col-sm-6 col-md-4 col-lg-2 card border rounded tw-shadow-sm hover:tw-shadow-xl">
                                <div className='tw-h'></div>
                                <div class="tw-h-72 tw-bg-gray-300 tw-dark:bg-gray-700 tw-w-full tw-mb-4"></div>
                                <div class="tw-h-2 tw-bg-gray-200 tw-rounded-full dark:bg-gray-700 max-w-[360px] mb-2.5"></div>
                                <div class="tw-h-2 tw-bg-gray-200 tw-rounded-full dark:bg-gray-700 mb-2.5"></div>
                                <div class="tw-h-2 tw-bg-gray-200 tw-rounded-full dark:bg-gray-700 max-w-[330px] mb-2.5"></div>
                                <div class="tw-h-2 tw-bg-gray-200 tw-rounded-full dark:bg-gray-700 max-w-[300px] mb-2.5"></div>
                                <div class="tw-h-2 tw-bg-gray-200 tw-rounded-full dark:bg-gray-700 max-w-[360px]"></div>
                                <span class="tw-sr-only">Loading...</span>
                            </div>


                            {loading
                                ? // Skeleton placeholders (e.g. show 6)
                                Array.from({ length: 6 }).map((_, i) => (

                                    <div role="status" class="max-w-sm animate-pulse">
                                        <div class="h-2.5 bg-gray-200 rounded-full dark:bg-gray-700 w-48 mb-4"></div>
                                        <div class="h-2 bg-gray-200 rounded-full dark:bg-gray-700 max-w-[360px] mb-2.5"></div>
                                        <div class="h-2 bg-gray-200 rounded-full dark:bg-gray-700 mb-2.5"></div>
                                        <div class="h-2 bg-gray-200 rounded-full dark:bg-gray-700 max-w-[330px] mb-2.5"></div>
                                        <div class="h-2 bg-gray-200 rounded-full dark:bg-gray-700 max-w-[300px] mb-2.5"></div>
                                        <div class="h-2 bg-gray-200 rounded-full dark:bg-gray-700 max-w-[360px]"></div>
                                        <span class="sr-only">Loading...</span>
                                    </div>


                                ))
                                : // Real products
                                products.map(product => (
                                    <div
                                        key={product.id}
                                        className="col-sm-6 col-md-4 col-lg-2 card border rounded tw-shadow-sm hover:tw-shadow-xl"
                                    >
                                        <img
                                            src={product.image_url}
                                            className="card-img-top"
                                            alt={product.name}
                                        />
                                        <div className="card-body">
                                            <Link
                                                className="tw-text-xl tw-font-bold tw-tracking-tight text-primary-light tw-mt-3 tw-cursor-pointer"
                                                href={`/products/${product.id}`}
                                            >
                                                {product.name}
                                            </Link>
                                            <p className="text-secondary-light tw-text-sm tw-line-clamp-3">
                                                {product.description}
                                            </p>
                                            <div className="d-flex justify-content-between align-items-center tw-mt-4">
                                                <div className="tw-text-lg tw-font-bold text-primary-light">
                                                    ${product.price}
                                                </div>
                                                <button
                                                    className="tw-cursor-pointer d-flex align-items-center gap-2 tw-text-blue-400 hover:tw-text-blue-600"
                                                    onClick={() => router.get(`/products/${product.id}`)}
                                                >
                                                    More Info <Icon icon="pajamas:long-arrow" width="16" height="16" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            }

                            {/* Product Tile */}
                            <div className="col-sm-6 col-md-4 col-lg-2 card border rounded tw-shadow-sm hover:tw-shadow-xl col-auto">
                                <div className="board12342">
                                    <img src="/assets/images/asset/productImg.jpg" className="card-img-top" alt="Product Image" />
                                    <div className="card-body">
                                        <Link class="tw-text-xl tw-font-bold tw-tracking-tight text-primary-light tw-mt-3 tw-cursor-pointer">Apple Watch Series 7 GPS, Aluminium Case, Starlight Sport</Link>
                                        <p className="text-secondary-light tw-text-sm tw-line-clamp-3">
                                            Lorem ipsum dolor sit amet consectetur adipisicing elit.
                                        </p>
                                        <div className="d-flex justify-content-between align-items-center tw-mt-4">
                                            <div className="tw-text-lg tw-font-bold text-primary-light">$399.00</div>
                                            <button className="tw-cursor-pointer d-flex align-items-center gap-2 tw-text-blue-400 hover:tw-text-blue-600" onClick={() => router.get('/products/1')}>More Info <Icon icon="pajamas:long-arrow" width="16" height="16" /></button>
                                        </div>

                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </UserDashboard>
            <CookiesV />
        </>
    );
}

export default Products;