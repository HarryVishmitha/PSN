import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, useForm } from '@inertiajs/react';

export default function ResetPassword({ token, email }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        token: token,
        email: email,
        password: '',
        password_confirmation: '',
    });

    const submit = (e) => {
        e.preventDefault();

        post(route('password.store'), {
            onFinish: () => reset('password', 'password_confirmation'),
        });
    };

    return (
        <GuestLayout>
            <Head title="Reset Password" />

            <form onSubmit={submit} className="tw-bg-white tw-shadow-md tw-rounded tw-px-8 tw-pt-6 tw-pb-8 tw-mb-4">
                <div className="tw-mb-4">
                    <InputLabel htmlFor="email" value="Email" className="tw-block tw-text-gray-700 tw-text-sm tw-font-bold tw-mb-2" />

                    <TextInput
                        id="email"
                        type="email"
                        name="email"
                        value={data.email}
                        className="tw-shadow tw-appearance-none tw-border tw-rounded tw-w-full tw-py-2 tw-px-3 tw-text-gray-700 tw-leading-tight tw-focus:outline-none tw-focus:shadow-outline"
                        autoComplete="username"
                        onChange={(e) => setData('email', e.target.value)}
                    />

                    <InputError message={errors.email} className="tw-text-red-500 tw-text-xs tw-mt-2" />
                </div>

                <div className="tw-mb-4">
                    <InputLabel htmlFor="password" value="Password" className="tw-block tw-text-gray-700 tw-text-sm tw-font-bold tw-mb-2" />

                    <TextInput
                        id="password"
                        type="password"
                        name="password"
                        value={data.password}
                        className="tw-shadow tw-appearance-none tw-border tw-rounded tw-w-full tw-py-2 tw-px-3 tw-text-gray-700 tw-leading-tight tw-focus:outline-none tw-focus:shadow-outline"
                        autoComplete="new-password"
                        isFocused={true}
                        onChange={(e) => setData('password', e.target.value)}
                    />

                    <InputError message={errors.password} className="tw-text-red-500 tw-text-xs tw-mt-2" />
                </div>

                <div className="tw-mb-4">
                    <InputLabel
                        htmlFor="password_confirmation"
                        value="Confirm Password"
                        className="tw-block tw-text-gray-700 tw-text-sm tw-font-bold tw-mb-2"
                    />

                    <TextInput
                        type="password"
                        id="password_confirmation"
                        name="password_confirmation"
                        value={data.password_confirmation}
                        className="tw-shadow tw-appearance-none tw-border tw-rounded tw-w-full tw-py-2 tw-px-3 tw-text-gray-700 tw-leading-tight tw-focus:outline-none tw-focus:shadow-outline"
                        autoComplete="new-password"
                        onChange={(e) =>
                            setData('password_confirmation', e.target.value)
                        }
                    />

                    <InputError
                        message={errors.password_confirmation}
                        className="tw-text-red-500 tw-text-xs tw-mt-2"
                    />
                </div>

                <div className="tw-flex tw-items-center tw-justify-between">
                    <PrimaryButton className="tw-bg-blue-500 tw-hover:bg-blue-700 tw-text-white tw-font-bold tw-py-2 tw-px-4 tw-rounded tw-focus:outline-none tw-focus:shadow-outline" disabled={processing}>
                        Reset Password
                    </PrimaryButton>
                </div>
            </form>
        </GuestLayout>
    );
}
