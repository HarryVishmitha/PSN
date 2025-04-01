import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';

export default function Dashboard() {
    return (
        <AuthenticatedLayout
            header={
                <h2 className="tw-text-xl tw-font-semibold tw-leading-tight tw-text-gray-800 dark:tw-text-gray-200">
                    Dashboard
                </h2>
            }
        >
            <Head title="Dashboard" />

            <div className="tw-py-12">
                <div className="tw-mx-auto tw-max-w-7xl sm:tw-px-6 lg:tw-px-8">
                    <div className="tw-overflow-hidden tw-bg-white tw-shadow-sm sm:tw-rounded-lg dark:tw-bg-gray-800">
                        <div className="tw-p-6 tw-text-gray-900 dark:tw-text-gray-100">
                            You're logged in!
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
