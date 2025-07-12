// resources/js/Pages/AllProducts.jsx
import React, { useEffect } from 'react';
import { Head, Link } from '@inertiajs/react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import AOS from 'aos';
import 'aos/dist/aos.css';
import ProductCard from '@/Components/ProductCard';

const AllProducts = () => {
    useEffect(() => {
        AOS.init({ once: true, duration: 600 });
    }, []);

    const sampleProducts = [
        {
  id: 1,
  name: "X-Banner",
  image: "/images/sample1.jpg",
  short_description: "Premium X-Banners for indoor & outdoor advertising.",
  starting_price: 1500.0,
  stock: 4,
  rating: 4,
  views: 1240,
  badge: "Hot",
  discount: "10% OFF",
  tags: ["indoor", "custom", "vinyl"]
},
{
  id: 1,
  name: "X-Banner",
  image: "/images/sample1.jpg",
  short_description: "Premium X-Banners for indoor & outdoor advertising.",
  starting_price: 1500.0,
  stock: 4,
  rating: 4,
  views: 1240,
  badge: "Hot",
  discount: "10% OFF",
  tags: ["indoor", "custom", "vinyl"]
},
{
  id: 1,
  name: "X-Banner",
  image: "/images/sample1.jpg",
  short_description: "Premium X-Banners for indoor & outdoor advertising.",
  starting_price: 1500.0,
  stock: 4,
  rating: 4,
  views: 1240,
  badge: "Hot",
  discount: "10% OFF",
  tags: ["indoor", "custom", "vinyl"]
},
{
  id: 1,
  name: "X-Banner",
  image: "/images/sample1.jpg",
  short_description: "Premium X-Banners for indoor & outdoor advertising.",
  starting_price: 1500.0,
  stock: 4,
  rating: 4,
  views: 1240,
  badge: "Hot",
  discount: "10% OFF",
  tags: ["indoor", "custom", "vinyl"]
},
{
  id: 1,
  name: "X-Banner",
  image: "/images/sample1.jpg",
  short_description: "Premium X-Banners for indoor & outdoor advertising.",
  starting_price: 1500.0,
  stock: 4,
  rating: 4,
  views: 1240,
  badge: "Hot",
  discount: "10% OFF",
  tags: ["indoor", "custom", "vinyl"]
},
{
  id: 1,
  name: "X-Banner",
  image: "/images/sample1.jpg",
  short_description: "Premium X-Banners for indoor & outdoor advertising.",
  starting_price: 1500.0,
  stock: 4,
  rating: 4,
  views: 1240,
  badge: "Hot",
  discount: "10% OFF",
  tags: ["indoor", "custom", "vinyl"]
},
{
  id: 1,
  name: "X-Banner",
  image: "/images/sample1.jpg",
  short_description: "Premium X-Banners for indoor & outdoor advertising.",
  starting_price: 1500.0,
  stock: 4,
  rating: 4,
  views: 1240,
  badge: "Hot",
  discount: "10% OFF",
  tags: ["indoor", "custom", "vinyl"]
},
{
  id: 1,
  name: "X-Banner",
  image: "/images/sample1.jpg",
  short_description: "Premium X-Banners for indoor & outdoor advertising.",
  starting_price: 1500.0,
  stock: 4,
  rating: 4,
  views: 1240,
  badge: "Hot",
  discount: "10% OFF",
  tags: ["indoor", "custom", "vinyl"]
},
{
  id: 1,
  name: "X-Banner",
  image: "/images/sample1.jpg",
  short_description: "Premium X-Banners for indoor & outdoor advertising.",
  starting_price: 1500.0,
  stock: 4,
  rating: 4,
  views: 1240,
  badge: "Hot",
  discount: "10% OFF",
  tags: ["indoor", "custom", "vinyl"]
},
{
  id: 1,
  name: "X-Banner",
  image: "/images/sample1.jpg",
  short_description: "Premium X-Banners for indoor & outdoor advertising.",
  starting_price: 1500.0,
  stock: 4,
  rating: 4,
  views: 1240,
  badge: "Hot",
  discount: "10% OFF",
  tags: ["indoor", "custom", "vinyl"]
},
{
  id: 1,
  name: "X-Banner",
  image: "/images/sample1.jpg",
  short_description: "Premium X-Banners for indoor & outdoor advertising.",
  starting_price: 1500.0,
  stock: 6,
  rating: 5,
  views: 1240,
  badge: "Hot",
  discount: "10% OFF",
  tags: ["indoor", "custom", "vinyl"]
},
{
  id: 1,
  name: "X-Banner",
  image: "/images/sample1.jpg",
  short_description: "Premium X-Banners for indoor & outdoor advertising.",
  starting_price: 1500.0,
  stock: 4,
  rating: 4,
  views: 1240,
  badge: "Hot",
  discount: "10% OFF",
  tags: ["indoor", "custom", "vinyl"]
}

    ];

    const sampleCategories = ['All', 'Business Stationery', 'Large Format', 'Marketing', 'Photo Products'];

    const sortOptions = ['Default', 'Price: Low to High', 'Price: High to Low', 'Name A-Z', 'Name Z-A'];

    return (
        <>
            <Head title="All Products - Printair" />
            <Header />

            <div className="tw-container tw-mx-auto tw-py-10">
                <div className="tw-flex tw-flex-col lg:tw-flex-row tw-gap-8">
                    {/* Sidebar */}
                    <aside className="tw-w-full lg:tw-w-1/4" data-aos="fade-right">
                        <div className="tw-bg-white tw-shadow-md tw-rounded-xl tw-p-5 tw-sticky tw-top-36">
                            <h5 className="tw-font-bold tw-text-xl tw-mb-4">Filter By Category</h5>
                            <ul className="tw-space-y-2">
                                {sampleCategories.map((cat, index) => (
                                    <li key={index}>
                                        <button className="tw-text-sm tw-w-full tw-text-left tw-p-2 tw-rounded tw-bg-gray-100 hover:tw-bg-gray-300 hover:tw-text-black tw-transition">
                                            {cat}
                                        </button>
                                    </li>
                                ))}
                            </ul>

                            <hr className="tw-my-6" />

                            <h5 className="tw-font-bold tw-text-xl tw-mb-4">Sort By</h5>
                            <select className="tw-w-full tw-border tw-rounded-md tw-py-2 tw-px-3 tw-bg-gray-50">
                                {sortOptions.map((option, index) => (
                                    <option key={index} value={option}>
                                        {option}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </aside>

                    {/* Product Content */}
                    <main className="tw-w-full lg:tw-w-3/4 tw-px-3 md:tw-px-0">
                        {/* Title */}
                        <div className="tw-mb-8" data-aos="fade-up">
                            <h3 className="tw-text-3xl tw-font-bold">All Products</h3>
                            <p className="tw-text-gray-500 tw-mt-3">Explore our best-selling print products!</p>
                        </div>

                        {/* Product Grid */}
                        <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-3 xl:tw-grid-cols-3 tw-gap-6">
                            {sampleProducts.map((product) => (
                                <ProductCard product={product} key={product.id} />
                            ))}
                        </div>

                        {/* Pagination (Static) */}
                        <div className="tw-mt-10 tw-flex tw-justify-center" data-aos="fade-up">
                            <button className="tw-mx-1 tw-px-3 tw-py-1 tw-rounded tw-bg-gray-200 hover:tw-bg-primary hover:tw-text-white">
                                &laquo;
                            </button>
                            {[1, 2, 3].map((page) => (
                                <button
                                    key={page}
                                    className="tw-mx-1 tw-px-3 tw-py-1 tw-rounded tw-bg-gray-100 hover:tw-bg-primary hover:tw-text-white"
                                >
                                    {page}
                                </button>
                            ))}
                            <button className="tw-mx-1 tw-px-3 tw-py-1 tw-rounded tw-bg-gray-200 hover:tw-bg-primary hover:tw-text-white">
                                &raquo;
                            </button>
                        </div>
                    </main>
                </div>
            </div>

            <Footer />
        </>
    );
};

export default AllProducts;
