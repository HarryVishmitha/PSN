import ApplicationLogo from '@/Components/ApplicationLogo';
import { Link } from '@inertiajs/react';

export default function GuestLayout({ children }) {
    return (
        <div className="tw-flex tw-min-h-screen tw-flex-col tw-items-center tw-bg-gray-100 tw-pt-6 sm:tw-justify-center sm:tw-pt-0 dark:tw-bg-gray-900">
            <div>
                <Link href="/">
                    <ApplicationLogo className="tw-h-20 tw-w-20 tw-fill-current tw-text-gray-500" />
                </Link>
            </div>

            <div className="tw-mt-6 tw-w-full tw-overflow-hidden tw-bg-white tw-px-6 tw-py-4 tw-shadow-md sm:tw-max-w-md sm:tw-rounded-lg dark:tw-bg-gray-800">
                {children}
            </div>
        </div>
    );
}
