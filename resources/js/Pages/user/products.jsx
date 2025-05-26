import React, { useState, useEffect, useRef } from 'react'
import { Head, Link, router } from '@inertiajs/react'
import axios from 'axios'
import UserDashboard from '@/Layouts/UserDashboard'
import Breadcrumb from '@/components/Breadcrumb'
import { Icon } from '@iconify/react'
import CookiesV from '@/Components/CookieConsent'
import Alert from '@/Components/Alert'
import Meta from '@/Components/Metaheads'

const Products = ({ userDetails, WG, wginactivating }) => {
    const [loading, setLoading] = useState(true)
    const [alert, setAlert] = useState(null)    // { type, message }
    const [products, setProducts] = useState([])

    const [search, setSearch] = useState('')
    const [sortBy, setSortBy] = useState('name')
    const [sortOrder, setSortOrder] = useState('asc')

    const firstRun = useRef(true)

    // WG inactivation warning
    useEffect(() => {
        if (wginactivating) {
            setAlert({ type: 'warning', message: 'Your account is being inactivated. Please wait.' })
        }
    }, [wginactivating])

    // Fetch helper
    const fetchProducts = () => {
        setLoading(true)
        setAlert(null)
        axios
            .get(route('user.getProducts'), {
                params: { search, sort_by: sortBy, sort_order: sortOrder },
            })
            .then(res => {
                // normalize any shape: array, {products:[]}, or paginated {data:[]}
                const payload = Array.isArray(res.data)
                    ? res.data
                    : Array.isArray(res.data.products)
                        ? res.data.products
                        : Array.isArray(res.data.data)
                            ? res.data.data
                            : []
                setProducts(payload)
                console.log('Products fetched:', payload)
            })
            .catch(err => {
                console.error(err)
                setAlert({ type: 'danger', message: 'Failed to load products.' })
            })
            .finally(() => setLoading(false))
    }

    // Initial fetch (with 1.5s delay)
    useEffect(() => {
        const timer = setTimeout(fetchProducts, 1500)
        return () => clearTimeout(timer)
    }, [])

    // Re-fetch on search/sort changes (skip first run)
    useEffect(() => {
        if (firstRun.current) {
            firstRun.current = false
            return
        }
        fetchProducts()
    }, [search, sortBy, sortOrder])

    return (
        <>
            <Head title="Products" />
            <Meta title="Products" description={`Products for ${WG}`} />
            <UserDashboard userDetails={userDetails} WG={WG}>
                <Breadcrumb title="Products" />

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
                    {/* search + sort controls */}
                    <div className="card-header d-flex flex-col sm:flex-row justify-content-between align-items-center gap-3">
                        <input
                            type="text"
                            placeholder="Search products…"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="
                tw-w-full sm:tw-w-1/2 tw-px-3 tw-py-2 tw-border tw-rounded
                tw-bg-gray-50 dark:tw-bg-gray-700 dark:tw-border-gray-600
                tw-text-sm tw-outline-none focus:tw-ring-2 focus:tw-ring-primary-light
              "
                        />

                        <div className="d-flex align-items-center gap-2">
                            <select
                                value={sortBy}
                                onChange={e => setSortBy(e.target.value)}
                                className="
                  tw-px-3 tw-py-2 tw-border tw-rounded
                  tw-bg-white dark:tw-bg-gray-800 dark:tw-border-gray-600
                  tw-text-sm tw-outline-none focus:tw-ring-2 focus:tw-ring-primary-light
                "
                            >
                                <option value="name">Name</option>
                                <option value="price">Price</option>
                                <option value="created_at">Newest</option>
                            </select>

                            <select
                                value={sortOrder}
                                onChange={e => setSortOrder(e.target.value)}
                                className="
                  tw-px-3 tw-py-2 tw-border tw-rounded
                  tw-bg-white dark:tw-bg-gray-800 dark:tw-border-gray-600
                  tw-text-sm tw-outline-none focus:tw-ring-2 focus:tw-ring-primary-light
                "
                            >
                                <option value="asc">Asc</option>
                                <option value="desc">Desc</option>
                            </select>
                        </div>
                    </div>

                    <div className="card-body">
                        <div className="row gy-2 gx-3 liagn-tems-center tw-gap-x-4 tw-gap-2 tw-mb-4">
                            {loading
                                ? Array.from({ length: 8 }).map((_, i) => (
                                    <div
                                        key={i}
                                        role="status"
                                        className="
                        tw-max-w-sm tw-animate-pulse col-sm-6 col-md-4 col-lg-3
                        card border rounded tw-shadow-sm hover:tw-shadow-xl
                      "
                                    >
                                        <div className="tw-h-72 tw-bg-gray-300 dark:tw-bg-gray-600 tw-w-full tw-mb-4" />
                                        <div className="tw-h-12 tw-bg-gray-300 dark:tw-bg-gray-600 tw-w-full tw-mb-2.5" />
                                        <div className="tw-h-2 tw-bg-gray-300 dark:tw-bg-gray-600 tw-rounded-full tw-mb-1.5" />
                                        <div className="tw-h-2 tw-bg-gray-300 dark:tw-bg-gray-600 tw-rounded-full tw-w-full tw-mb-1.5" />
                                        <div className="tw-h-2 tw-bg-gray-300 dark:tw-bg-gray-600 tw-rounded-full tw-w-1/2 tw-mb-2.5" />
                                        <div className="d-flex justify-content-between align-items-center tw-mt-4 tw-mb-4">
                                            <div className="tw-h-7 tw-bg-gray-300 dark:tw-bg-gray-600 tw-rounded tw-w-20" />
                                            <div className="tw-h-7 tw-bg-gray-300 dark:tw-bg-gray-600 tw-rounded-full tw-w-24" />
                                        </div>
                                        <span className="tw-sr-only">Loading...</span>
                                    </div>
                                ))
                                : products.length === 0
                                    ? (
                                        <div className="col-12 tw-justify-center d-flex tw-flex-col align-items-center tw-h-96">
                                            <Icon
                                                icon="pajamas:information-o"
                                                width="50"
                                                height="50"
                                                className="tw-text-red-500 tw-mb-4"
                                            />
                                            <div>
                                                <div className="tw-text-5xl tw-font-extrabold tw-text-red-600 tw-text-center">
                                                    Ooops!
                                                </div>
                                                <div className="tw-mt-4 tw-text-center tw-font-semibold">
                                                    No Products available right now.
                                                </div>
                                            </div>
                                        </div>
                                    )
                                    : products.map(product => (
                                        <div
                                            key={product.id}
                                            className="col-sm-6 col-md-4 col-lg-3 card border rounded tw-shadow-sm hover:tw-shadow-xl"
                                        >
                                            <img
                                                src={product.images[0].image_url || '/assets/images/asset/productImg.jpg'}
                                                className="card-img-top tw-w-full"
                                                alt={product.name}
                                            />
                                            <div className="card-body">
                                                <Link
                                                    className="tw-text-xl tw-font-bold tw-tracking-tight text-primary-light tw-mt-3 tw-cursor-pointer"
                                                    href={`/user/${product.id}/product/${product.name.replace(/\s+/g, '-')}`}
                                                >
                                                    {product.name}
                                                </Link>
                                                <div
                                                    className="text-secondary-light tw-text-sm tw-line-clamp-3"
                                                    dangerouslySetInnerHTML={{ __html: product.meta_description }}
                                                />
                                                <div className="d-flex justify-content-between align-items-center tw-mt-4">
                                                    <div className="tw-text-lg tw-font-bold text-primary-light">
                                                        LKR {product.price}
                                                    </div>
                                                    <button
                                                        className="
                              tw-cursor-pointer d-flex align-items-center gap-2
                              tw-text-blue-400 hover:tw-text-blue-600
                            "
                                                        onClick={() => router.get(`/user/${product.id}/product/${product.name.replace(/\s+/g, '-')}`)}
                                                    >
                                                        More Info <Icon icon="pajamas:long-arrow" width="16" height="16" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                        </div>
                    </div>
                </div>
            </UserDashboard>
            <CookiesV />
        </>
    )
}

export default Products
