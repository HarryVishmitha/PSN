import { Link } from '@inertiajs/react';

export default function ResponsiveNavLink({
    active = false,
    className = '',
    children,
    ...props
}) {
    return (
        <Link
            {...props}
            className={`tw-flex tw-w-full tw-items-start tw-border-l-4 tw-py-2 tw-pe-4 tw-ps-3 ${
                active
                    ? 'tw-border-indigo-400 tw-bg-indigo-50 tw-text-indigo-700 tw-focus:tw-border-indigo-700 tw-focus:tw-bg-indigo-100 tw-focus:tw-text-indigo-800 dark:tw-border-indigo-600 dark:tw-bg-indigo-900/50 dark:tw-text-indigo-300 dark:tw-focus:tw-border-indigo-300 dark:tw-focus:tw-bg-indigo-900 dark:tw-focus:tw-text-indigo-200'
                    : 'tw-border-transparent tw-text-gray-600 hover:tw-border-gray-300 hover:tw-bg-gray-50 hover:tw-text-gray-800 tw-focus:tw-border-gray-300 tw-focus:tw-bg-gray-50 tw-focus:tw-text-gray-800 dark:tw-text-gray-400 dark:hover:tw-border-gray-600 dark:hover:tw-bg-gray-700 dark:hover:tw-text-gray-200 dark:tw-focus:tw-border-gray-600 dark:tw-focus:tw-bg-gray-700 dark:tw-focus:tw-text-gray-200'
            } tw-text-base tw-font-medium tw-transition tw-duration-150 tw-ease-in-out tw-focus:tw-outline-none ${className}`}
        >
            {children}
        </Link>
    );
}
