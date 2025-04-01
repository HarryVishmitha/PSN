import { Link } from '@inertiajs/react';

export default function NavLink({
    active = false,
    className = '',
    children,
    ...props
}) {
    return (
        <Link
            {...props}
            className={
                'tw-inline-flex tw-items-center tw-border-b-2 tw-px-1 tw-pt-1 tw-text-sm tw-font-medium tw-leading-5 tw-transition tw-duration-150 tw-ease-in-out tw-focus:outline-none ' +
                (active
                    ? 'tw-border-indigo-400 tw-text-gray-900 tw-focus:border-indigo-700 dark:tw-border-indigo-600 dark:tw-text-gray-100'
                    : 'tw-border-transparent tw-text-gray-500 hover:tw-border-gray-300 hover:tw-text-gray-700 tw-focus:border-gray-300 tw-focus:text-gray-700 dark:tw-text-gray-400 dark:hover:tw-border-gray-700 dark:hover:tw-text-gray-300 dark:tw-focus:border-gray-700 dark:tw-focus:text-gray-300') +
                className
            }
        >
            {children}
        </Link>
    );
}
