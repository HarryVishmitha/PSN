import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import DeleteUserForm from './Partials/DeleteUserForm';
import UpdatePasswordForm from './Partials/UpdatePasswordForm';
import UpdateProfileInformationForm from './Partials/UpdateProfileInformationForm';

export default function Edit({ mustVerifyEmail, status }) {
    return (
        <AuthenticatedLayout
            header={
                <h4 className="tw-text-xl tw-font-semibold tw-leading-tight tw-text-gray-800 dark:tw-text-gray-200">
                    Profile
                </h4>
            }
        >
            <Head title="Profile" />

            <div className="tw-py-12">
                <div className="tw-mx-auto tw-max-w-7xl tw-space-y-6 sm:tw-px-6 lg:tw-px-8">
                    <div className="tw-bg-white tw-p-4 tw-shadow sm:tw-rounded-lg sm:tw-p-8 dark:tw-bg-gray-800">
                        <UpdateProfileInformationForm
                            mustVerifyEmail={mustVerifyEmail}
                            status={status}
                            className="tw-max-w-xl"
                        />
                    </div>

                    <div className="tw-bg-white tw-p-4 tw-shadow sm:tw-rounded-lg sm:tw-p-8 dark:tw-bg-gray-800">
                        <UpdatePasswordForm className="tw-max-w-xl" />
                    </div>

                    <div className="tw-bg-white tw-p-4 tw-shadow sm:tw-rounded-lg sm:tw-p-8 dark:tw-bg-gray-800">
                        <DeleteUserForm className="tw-max-w-xl" />
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
