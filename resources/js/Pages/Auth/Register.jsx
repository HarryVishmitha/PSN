import InputError from '@/Components/InputError';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import { Head, Link, useForm } from '@inertiajs/react';
import React, { useEffect, useState } from 'react';
import InputLabel from '@/Components/InputLabel';

export default function Register() {
    const [imageUrl, setImageUrl] = useState(null);
    const [isLoading, setIsLoading] = useState(true); // Track loading state
    const [showPassword, setShowPassword] = useState(false); // State to toggle password visibility

    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
    });

    const submit = (e) => {
        e.preventDefault();

        post(route('register'), {
            onFinish: () => reset('password', 'password_confirmation'),
        });
    };

    // Fetch random image from the Laravel backend
    const fetchRandomImage = async () => {
        try {
            console.log("Fetching from URL:", (route('api.random-image')));  // Debug log
            // Fetching image from the server-side route
            const response = await fetch(route('api.random-image'));
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
            <Head title="Register" />
            <div className="tw-flex tw-flex-wrap tw-w-full">
                <div className="tw-flex lg:tw-w-1/2 tw-flex-col tw-w-full tw-h-screen min-vh-100">
                    <div className="tw-flex tw-flex-col tw-justify-center tw-px-5 tw-pt-4 tw-my-auto md:tw-justify-center md:tw-pt-0 md:tw-px-24 lg:tw-px-32">
                        <p className="tw-text-3xl tw-text-center tw-justify-center">
                            <a href={route('home')} className="tw-flex tw-w-full tw-justify-center tw-mb-2 tw-mt-1">
                                <img src="/images/favicon.png" alt="Logo" width="20%" />
                            </a>
                            <span className="tw-font-extrabold">Let's work together!</span>
                        </p>
                        <form onSubmit={submit} className="tw-flex tw-flex-col md:tw-pt-7">
                            <div className="tw-flex tw-flex-col mt-3">
                                <InputLabel htmlFor="name" value="Name" />
                                <TextInput
                                    id="name"
                                    name="name"
                                    value={data.name}
                                    className="tw-mt-1 tw-block tw-w-full tw-px-4 tw-py-2 tw-border tw-border-gray-300 tw-rounded-md tw-shadow-sm focus:tw-ring-indigo-500 focus:tw-border-indigo-500"
                                    autoComplete="name"
                                    isFocused={true}
                                    onChange={(e) => setData('name', e.target.value)}
                                    required
                                />
                                <InputError message={errors.name} className="tw-mt-2" />
                            </div>

                            <div className="tw-flex tw-flex-col mt-3">
                                <InputLabel htmlFor="email" value="Email Address" />
                                <TextInput
                                    id="email"
                                    type="email"
                                    name="email"
                                    value={data.email}
                                    className="tw-mt-1 tw-block tw-w-full tw-px-4 tw-py-2 tw-border tw-border-gray-300 tw-rounded-md tw-shadow-sm focus:tw-ring-indigo-500 focus:tw-border-indigo-500"
                                    autoComplete="username"
                                    onChange={(e) => setData('email', e.target.value)}
                                    required
                                />
                                <InputError message={errors.email} className="tw-mt-2" />
                            </div>

                            <div className="tw-flex tw-flex-col mt-4">
                                <InputLabel htmlFor="password" value="Password" />
                                <TextInput
                                    id="password"
                                    type={showPassword ? 'text' : 'password'} // Toggle password visibility
                                    name="password"
                                    value={data.password}
                                    className="tw-mt-1 tw-block tw-w-full tw-px-4 tw-py-2 tw-border tw-border-gray-300 tw-rounded-md tw-shadow-sm focus:tw-ring-indigo-500 focus:tw-border-indigo-500"
                                    autoComplete="new-password"
                                    onChange={(e) => setData('password', e.target.value)}
                                    required
                                />
                                <InputError message={errors.password} className="tw-mt-2" />
                            </div>

                            <div className="tw-flex tw-flex-col tw-pt-4 tw-mb-5">
                                <InputLabel htmlFor="password_confirmation" value="Confirm Password" />
                                <TextInput
                                    id="password_confirmation"
                                    type={showPassword ? 'text' : 'password'} // Toggle password visibility
                                    name="password_confirmation"
                                    value={data.password_confirmation}
                                    className="tw-mt-1 tw-block tw-w-full tw-px-4 tw-py-2 tw-border tw-border-gray-300 tw-rounded-md tw-shadow-sm focus:tw-ring-indigo-500 focus:tw-border-indigo-500"
                                    autoComplete="new-password"
                                    onChange={(e) => setData('password_confirmation', e.target.value)}
                                    required
                                />
                                <InputError message={errors.password_confirmation} className="tw-mt-2" />
                            </div>

                            {/* Show Password Checkbox */}
                            <div className="tw-flex tw-items-center tw-mb-3">
                                <input
                                    type="checkbox"
                                    id="show_password"
                                    className="tw-mr-2"
                                    checked={showPassword}
                                    onChange={() => setShowPassword(!showPassword)} // Toggle the state when clicked
                                />
                                <label htmlFor="show_password" className="tw-text-sm tw-text-gray-600">Show Passwords</label>
                            </div>

                            <div className="tw-flex tw-items-center tw-justify-between tw-mb-1">
                                <button className="btn btn-outline-dark radius-8 px-20 py-11 d-flex align-items-center justify-content-center gap-2 tw-w-full tw-text-center" disabled={processing}>
                                    Register
                                </button>
                            </div>
                        </form>

                        {/* Register Link */}
                        <div className="tw-pt-6 tw-pb-12 tw-text-center">
                            <p>Already our customer? <a href={ route('login') } className='text-primary'>Log-in</a></p>
                        </div>
                    </div>
                </div>

                <div className="tw-w-full lg:tw-w-1/2 tw-shadow-2xl tw-bg-cover tw-bg-center" style={{ backgroundImage: `url(${imageUrl})` }}>
                    {isLoading && (
                        <div className="tw-flex tw-justify-center tw-items-center tw-w-full tw-h-screen">
                            <div className="spinner-border text-primary" role="status">
                                <span className="visually-hidden">Loading...</span>
                            </div>
                            <div className="p tw-p-3">Loading something amazing!</div>
                        </div>
                    )}
                    <div className="tw-absolute tw-bottom-0 tw-right-0 tw-p-4 tw-text-gray-200 tw-bg-opacity-50 tw-text-shadow-glow">
                        Images from <a href="https://unsplash.com/" className="tw-underline">unsplash.com</a>
                        <span>Thank you photographers</span>
                    </div>
                </div>
            </div>
        </>
    );
}
