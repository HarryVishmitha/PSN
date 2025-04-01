import ApplicationLogo from '@/Components/ApplicationLogo';
import Dropdown from '@/Components/Dropdown';
import NavLink from '@/Components/NavLink';
import ResponsiveNavLink from '@/Components/ResponsiveNavLink';
import { Link, usePage } from '@inertiajs/react';
import { useState } from 'react';

export default function AuthenticatedLayout({ header, children }) {
    const user = usePage().props.auth.user;

    const [showingNavigationDropdown, setShowingNavigationDropdown] =
        useState(false);

    return (
        <div className="tw-min-h-screen tw-bg-gray-100 dark:tw-bg-gray-900">
            <nav className="tw-border-b tw-border-gray-100 tw-bg-white dark:tw-border-gray-700 dark:tw-bg-gray-800">
                <div className="tw-mx-auto tw-max-w-7xl tw-px-4 sm:tw-px-6 lg:tw-px-8">
                    <div className="tw-flex tw-h-16 tw-justify-between">
                        <div className="tw-flex">
                            <div className="tw-flex tw-shrink-0 tw-items-center">
                                <Link href="/">
                                    <img src="/favicon.ico" alt="sitelogo" width={30}/>
                                </Link>
                            </div>

                            <div className="tw-hidden tw-space-x-8 sm:tw--my-px sm:tw-ms-10 sm:tw-flex">
                                <NavLink
                                    href={route('dashboard')}
                                    active={route().current('dashboard')}
                                >
                                    Dashboard
                                </NavLink>
                            </div>
                        </div>

                        <div className="tw-hidden sm:tw-ms-6 sm:tw-flex sm:tw-items-center">
                            <div className="tw-relative tw-ms-3">
                                <Dropdown>
                                    <Dropdown.Trigger>
                                        <span className="tw-inline-flex tw-rounded-md">
                                            <button
                                                type="button"
                                                className="tw-inline-flex tw-items-center tw-rounded-md tw-border tw-border-transparent tw-bg-white tw-px-3 tw-py-2 tw-text-sm tw-font-medium tw-leading-4 tw-text-gray-500 tw-transition tw-duration-150 tw-ease-in-out hover:tw-text-gray-700 focus:tw-outline-none dark:tw-bg-gray-800 dark:tw-text-gray-400 dark:hover:tw-text-gray-300"
                                            >
                                                {user.name}

                                                <svg
                                                    className="tw--me-0.5 tw-ms-2 tw-h-4 tw-w-4"
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    viewBox="0 0 20 20"
                                                    fill="currentColor"
                                                >
                                                    <path
                                                        fillRule="evenodd"
                                                        d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                                                        clipRule="evenodd"
                                                    />
                                                </svg>
                                            </button>
                                        </span>
                                    </Dropdown.Trigger>

                                    <Dropdown.Content>
                                        <Dropdown.Link
                                            href={route('profile.edit')}
                                        >
                                            Profile
                                        </Dropdown.Link>
                                        <Dropdown.Link
                                            href={route('logout')}
                                            method="post"
                                            as="button"
                                        >
                                            Log Out
                                        </Dropdown.Link>
                                    </Dropdown.Content>
                                </Dropdown>
                            </div>
                        </div>

                        <div className="tw--me-2 tw-flex tw-items-center sm:tw-hidden">
                            <button
                                onClick={() =>
                                    setShowingNavigationDropdown(
                                        (previousState) => !previousState,
                                    )
                                }
                                className="tw-inline-flex tw-items-center tw-justify-center tw-rounded-md tw-p-2 tw-text-gray-400 tw-transition tw-duration-150 tw-ease-in-out hover:tw-bg-gray-100 hover:tw-text-gray-500 focus:tw-bg-gray-100 focus:tw-text-gray-500 focus:tw-outline-none dark:tw-text-gray-500 dark:hover:tw-bg-gray-900 dark:hover:tw-text-gray-400 dark:focus:tw-bg-gray-900 dark:focus:tw-text-gray-400"
                            >
                                <svg
                                    className="tw-h-6 tw-w-6"
                                    stroke="currentColor"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        className={
                                            !showingNavigationDropdown
                                                ? 'tw-inline-flex'
                                                : 'tw-hidden'
                                        }
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M4 6h16M4 12h16M4 18h16"
                                    />
                                    <path
                                        className={
                                            showingNavigationDropdown
                                                ? 'tw-inline-flex'
                                                : 'tw-hidden'
                                        }
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M6 18L18 6M6 6l12 12"
                                    />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>

                <div
                    className={
                        (showingNavigationDropdown ? 'tw-block' : 'tw-hidden') +
                        ' sm:tw-hidden'
                    }
                >
                    <div className="tw-space-y-1 tw-pb-3 tw-pt-2">
                        <ResponsiveNavLink
                            href={route('dashboard')}
                            active={route().current('dashboard')}
                        >
                            Dashboard
                        </ResponsiveNavLink>
                    </div>

                    <div className="tw-border-t tw-border-gray-200 tw-pb-1 tw-pt-4 dark:tw-border-gray-600">
                        <div className="tw-px-4">
                            <div className="tw-text-base tw-font-medium tw-text-gray-800 dark:tw-text-gray-200">
                                {user.name}
                            </div>
                            <div className="tw-text-sm tw-font-medium tw-text-gray-500">
                                {user.email}
                            </div>
                        </div>

                        <div className="tw-mt-3 tw-space-y-1">
                            <ResponsiveNavLink href={route('profile.edit')}>
                                Profile
                            </ResponsiveNavLink>
                            <ResponsiveNavLink
                                method="post"
                                href={route('logout')}
                                as="button"
                            >
                                Log Out
                            </ResponsiveNavLink>
                        </div>
                    </div>
                </div>
            </nav>

            {header && (
                <header className="tw-bg-white tw-shadow dark:tw-bg-gray-800">
                    <div className="tw-mx-auto tw-max-w-7xl tw-px-4 tw-py-6 sm:tw-px-6 lg:tw-px-8">
                        {header}
                    </div>
                </header>
            )}

            <main>{children}</main>
        </div>
    );
}
