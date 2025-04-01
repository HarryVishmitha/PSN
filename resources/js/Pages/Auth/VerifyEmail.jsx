import PrimaryButton from '@/Components/PrimaryButton';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, Link, useForm } from '@inertiajs/react';

export default function VerifyEmail({ status }) {
    const { post, processing } = useForm({});

    const submit = (e) => {
        e.preventDefault();

        post(route('verification.send'));
    };

    return (
        <>
            <Head title="Verify Email" />
            <div className="tw-flex tw-items-center tw-justify-center tw-bg-gray-100 tw-w-full tw-h-screen">
                <main id="content" role="main" className="tw-w-full tw-max-w-md tw-p-6">
                    <div className="tw-bg-white tw-rounded-xl tw-shadow-lg tw-border-indigo-300">
                        <div className="tw-p-4 sm:tw-p-7">
                            <div className="tw-text-center">
                                <Link href={route('home')} className="tw-flex tw-w-full tw-justify-center tw-mb-3">
                                    <img src="/images/favicon.png" alt="Logo" width="20%" />
                                </Link>
                                <h4 className="tw-block tw-text tw-font-bold tw-text-gray-800">Verify Your Email Address</h4>
                                <p className="tw-mt-2 tw-text-sm tw-text-gray-600 dark:tw-text-gray-400">
                                    Thanks for signing up! Before getting started, could you verify your email address by clicking on the link we just emailed to you? If you didn't receive the email, we will gladly send you another.
                                </p>
                                {status === 'verification-link-sent' && (
                                    <div className="tw-mt-4 tw-font-medium tw-text-sm tw-text-green-600">
                                        A new verification link has been sent to the email address you provided during registration.
                                    </div>
                                )}
                                <div className="tw-mt-4 tw-flex tw-items-center tw-justify-between">
                                    <form onSubmit={submit}>
                                        <button className='btn btn-outline-dark' disabled={processing}>
                                            Resend Verification Email
                                        </button>
                                    </form>
                                    <form method="post" action={route('logout')}>
                                        <button type="submit" className="btn btn-outline-danger">
                                            Log Out
                                        </button>
                                    </form>
                                </div>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </>
    );
}
