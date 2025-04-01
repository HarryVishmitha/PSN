export default function SecondaryButton({
    type = 'button',
    className = '',
    disabled,
    children,
    ...props
}) {
    return (
        <button
            {...props}
            type={type}
            className={
                `tw-inline-flex tw-items-center tw-rounded-md tw-border tw-border-gray-300 tw-bg-white tw-px-4 tw-py-2 tw-text-xs tw-font-semibold tw-uppercase tw-tracking-widest tw-text-gray-700 tw-shadow-sm tw-transition tw-duration-150 tw-ease-in-out hover:tw-bg-gray-50 focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-indigo-500 focus:tw-ring-offset-2 disabled:tw-opacity-25 dark:tw-border-gray-500 dark:tw-bg-gray-800 dark:tw-text-gray-300 dark:hover:tw-bg-gray-700 dark:focus:tw-ring-offset-gray-800 ${
                    disabled && 'tw-opacity-25'
                } ` + className
            }
            disabled={disabled}
        >
            {children}
        </button>
    );
}
