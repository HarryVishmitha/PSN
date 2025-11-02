import { Link } from '@inertiajs/react';

export default function GuestLayout({ children }) {
    return (
        <div className="tw-relative tw-flex tw-min-h-screen tw-flex-col tw-items-center tw-bg-gradient-to-br tw-from-gray-50 tw-to-gray-100 tw-px-4 tw-py-8 sm:tw-justify-center sm:tw-py-12">
            {/* Decorative Background Elements */}
            <div className="tw-pointer-events-none tw-absolute tw-inset-0 tw-overflow-hidden tw-opacity-30">
                <div className="tw-absolute tw--left-20 tw--top-20 tw-h-64 tw-w-64 tw-rounded-full tw-bg-[#f44032]/10 tw-blur-3xl"></div>
                <div className="tw-absolute tw--bottom-20 tw--right-20 tw-h-80 tw-w-80 tw-rounded-full tw-bg-[#f44032]/10 tw-blur-3xl"></div>
            </div>

            {/* Logo Section */}
            <div className="tw-relative tw-z-10 tw-mb-8">
                <Link
                    href="/"
                    className="tw-group tw-flex tw-flex-col tw-items-center tw-gap-3 tw-transition-transform hover:tw-scale-105"
                >
                    <img
                        src="/images/printairlogo.png"
                        alt="Printair Advertising"
                        className="tw-h-16 tw-drop-shadow-lg sm:tw-h-20"
                    />
                    <div className="tw-text-center">
                        <h1 className="tw-text-2xl tw-font-bold tw-text-gray-900 sm:tw-text-3xl">
                            Printair{' '}
                            <span className="tw-text-[#f44032]">
                                Advertising
                            </span>
                        </h1>
                        <p className="tw-mt-1 tw-text-sm tw-text-gray-600">
                            You think it, We ink it.
                        </p>
                    </div>
                </Link>
            </div>

            {/* Main Content Card */}
            <div className="tw-relative tw-z-10 tw-w-full tw-overflow-hidden tw-rounded-2xl tw-border-2 tw-border-gray-200 tw-bg-white tw-px-8 tw-py-8 tw-shadow-2xl sm:tw-max-w-md sm:tw-px-10 sm:tw-py-10">
                {/* Decorative Top Border */}
                <div className="tw-absolute tw-left-0 tw-top-0 tw-h-1.5 tw-w-full tw-bg-gradient-to-r tw-from-[#f44032] tw-to-[#ff6b5e]"></div>

                {children}
            </div>

            {/* Footer */}
            <div className="tw-relative tw-z-10 tw-mt-8 tw-text-center">
                <p className="tw-text-xs tw-text-gray-500">
                    &copy; {new Date().getFullYear()} Printair Advertising. All
                    rights reserved.
                </p>
                <p className="tw-mt-1 tw-text-xs tw-text-gray-400">
                    Walpola, Ragama, Sri Lanka
                </p>
            </div>
        </div>
    );
}
