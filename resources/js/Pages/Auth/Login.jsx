import Checkbox from '@/Components/Checkbox';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import React, { useEffect, useState } from 'react';
import { Icon } from '@iconify/react';

export default function Login({ status, canResetPassword }) {
    const [imageUrl, setImageUrl] = useState(null);
    const [isLoading, setIsLoading] = useState(true); // Track loading state
    const { data, setData, post, processing, errors, reset } = useForm({
        email: '',
        password: '',
        remember: false,
    });

    const submit = (e) => {
        e.preventDefault();

        post(route('login'), {
            onFinish: () => reset('password'),
        });
    };

    // Fetch random image from the Laravel backend
    const fetchRandomImage = async () => {
        try {
            console.log("Image credits to unsplash");  // Debug log
            const response = await fetch(route('api.random-image'));  // Call the server-side route
            const data = await response.json();
            setImageUrl(data.imageUrl);  // Update state with the fetched image URL
        } catch (error) {
            console.error("Error fetching image:", error);
        } finally {
            setIsLoading(false);  // Set loading state to false after image is fetched
        }
    };

    // Trigger fetching the image after the page has loaded
    useEffect(() => {
        fetchRandomImage();  // Fetch image when the component mounts
    }, []);

    return (
        <>
            <Head title="Login" />
            <div className="tw-flex tw-flex-wrap tw-w-full tw-h-screen">
                <div className="tw-flex tw-flex-col tw-w-full lg:tw-w-1/2 tw-h-screen min-vh-100">
                    <div className="tw-flex tw-flex-col tw-justify-center tw-px-8 tw-pt-8 tw-my-auto md:tw-justify-center md:tw-pt-0 md:tw-px-24 lg:tw-px-32">
                        <p className="tw-text-3xl tw-text-center tw-justify-center">
                            <Link href={route('home')} className="tw-flex tw-w-full tw-justify-center tw-mb-3">
                                <img src="/images/favicon.png" alt="Logo" width="20%" />
                            </Link>
                            <span className="tw-font-extrabold">Welcome Back!</span>
                        </p>
                        <form onSubmit={submit} className="tw-flex tw-flex-col tw-pt-3 md:tw-pt-8">
                            <div className="tw-flex tw-flex-col tw-pt-4">
                                <InputLabel htmlFor="email" value="Email Address"/>
                                <TextInput
                                    id="email"
                                    type="email"
                                    name="email"
                                    value={data.email}
                                    className="tw-mt-1 tw-block tw-w-full tw-px-4 tw-py-2 tw-border tw-border-gray-300 tw-rounded-md tw-shadow-sm focus:tw-ring-indigo-500 focus:tw-border-indigo-500"
                                    autoComplete="username"
                                    isFocused={true}
                                    onChange={(e) => setData('email', e.target.value)}
                                />
                                <InputError message={errors.email} className="tw-mt-2" />
                            </div>

                            <div className="tw-flex tw-flex-col tw-pt-4 mb-3">
                                <InputLabel htmlFor="password" value="Password" />
                                <TextInput
                                    id="password"
                                    type="password"
                                    name="password"
                                    value={data.password}
                                    className="tw-mt-1 dark:tw-text-white  tw-block tw-w-full tw-px-4 tw-py-2 tw-border tw-border-gray-300 tw-rounded-md tw-shadow-sm focus:tw-ring-indigo-500 focus:tw-border-indigo-500"
                                    autoComplete="current-password"
                                    onChange={(e) => setData('password', e.target.value)}
                                />
                                <InputError message={errors.password} className="tw-mt-2" />
                            </div>

                            <div className="tw-flex tw-items-center mb-3">
                                <Checkbox
                                    id="remember_me"
                                    name="remember"
                                    checked={data.remember}
                                    onChange={(e) => setData('remember', e.target.checked)}
                                    className="tw-mr-2 dark:tw-text-white"
                                />
                                <label htmlFor="remember_me" className="tw-text-sm tw-text-gray-600 dark:tw-text-white">Remember me</label>
                            </div>

                            <div className="tw-flex tw-items-center tw-justify-between tw-mb-4">
                                <button className="btn btn-outline-dark radius-8 px-20 py-11 d-flex align-items-center justify-content-center gap-2 tw-w-full tw-text-center" disabled={processing}>
                                    Log-in
                                </button>
                            </div>

                            {canResetPassword && (
                                <div className="tw-text-center">
                                    <Link href={route('password.request')} className="tw-text-sm tw-text-blue-600 hover:tw-text-blue-500 dark:tw-text-lime-100">
                                        Forgot your password?
                                    </Link>
                                </div>
                            )}
                        </form>

                        <div className="mt-1 tw-pb-12 tw-text-center">
                            <p>Not a user? <span className='tw-text-blue-500'><Link href={route('register')}>Register</Link></span></p>
                        </div>
                    </div>
                </div>

                <div className="tw-w-full lg:tw-w-1/2 tw-shadow-2xl tw-hidden lg:tw-block tw-bg-cover tw-bg-center" style={{ backgroundImage: `url(${imageUrl})` }}>
                    {isLoading && (
                        <div className="tw-flex tw-justify-center tw-items-center tw-w-full tw-h-screen">
                            <div className="spinner-border text-primary" role="status">
                                <span className="visually-hidden">Loading...</span>
                            </div>
                            <div className="p tw-p-3">Loading something amazing!</div>
                        </div>
                    )}
                    <div className="tw-absolute tw-bottom-0 tw-right-0 tw-p-4 tw-text-gray-200 tw-bg-opacity-50 tw-text-shadow-glow">
                        Images from <Link href="https://unsplash.com/" className="tw-underline">unsplash.com</Link>
                        <span>. Thank you photographers</span>
                    </div>
                </div>
            </div>
        </>
    );
}
