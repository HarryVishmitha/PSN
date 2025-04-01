import InputError from '@/Components/InputError';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, useForm } from '@inertiajs/react';
import InputLabel from '@/Components/InputLabel';

export default function ForgotPassword({ status }) {
    const { data, setData, post, processing, errors } = useForm({
        email: '',
    });

    const submit = (e) => {
        e.preventDefault();

        post(route('password.email'));
    };

    return (
        <>
            <Head title="Forgot Password" />
            <div className="tw-flex tw-items-center tw-justify-center tw-bg-gray-100 tw-w-full tw-h-screen">
                <main id="content" role="main" className="tw-w-full tw-max-w-md tw-p-6">
                    <div className="tw-bg-white tw-rounded-xl tw-shadow-lg tw-border-indigo-300">
                        <div className="tw-p-4 sm:tw-p-7">
                            <div className="tw-text-center">
                                <a href={route('home')} className="tw-flex tw-w-full tw-justify-center tw-mb-3">
                                    <img src="/images/favicon.png" alt="Logo" width="20%" />
                                </a>
                                <h1 className="tw-block tw-text-2xl tw-font-bold tw-text-gray-800">Forgot password?</h1>
                                <p className="tw-mt-2 tw-text-sm tw-text-gray-600">
                                    Remember your password?
                                    <a href={route('login')} className="tw-text-blue-600 tw-decoration-2 hover:tw-underline tw-font-medium">
                                        <span> Login here</span>
                                    </a>
                                </p>
                                <div className="tw-mb-4 tw-text-sm tw-text-gray-600">
                                    OR
                                </div>
                                <div className="tw-mb-4 tw-text-sm tw-text-gray-600">
                                    Forgot your password? No problem. Just let us know your email address and we will email you a password reset link that will allow you to choose a new one.
                                </div>
                            </div>

                            <div className="tw-mt-5">
                                {status && (
                                    <div className="tw-mb-4 text-sm font-medium text-green-600">
                                        {status}
                                    </div>
                                )}

                                <form onSubmit={submit}>
                                    <div className="tw-flex tw-flex-col tw-pt-4">
                                        <InputLabel htmlFor="email" value="Email Address" />
                                        <TextInput
                                            id="email"
                                            type="email"
                                            name="email"
                                            value={data.email}
                                            className="tw-mt-1 tw-block tw-w-full tw-px-4 tw-py-2 tw-border tw-border-gray-300 tw-rounded-md tw-shadow-sm focus:tw-ring-indigo-500 focus:tw-border-indigo-500"
                                            autoComplete="email"
                                            isFocused={true}
                                            onChange={(e) => setData('email', e.target.value)}
                                        />
                                        <InputError message={errors.email} className="tw-mt-2" />
                                    </div>

                                    <div className="tw-flex tw-items-center tw-justify-end tw-mt-4">
                                        <button className='tw-w-full tw-bg-black tw-text-white tw-py-2 tw-rounded-md tw-shadow-md hover:tw-bg-white hover:tw-text-black focus:tw-outline-none focus:tw-ring-2 tw-border-[3px] tw-border-black' disabled={processing}>
                                            Send Password reset link
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </>
    );
}
