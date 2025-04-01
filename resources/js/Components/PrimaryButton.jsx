export default function PrimaryButton({
    className = '',
    disabled,
    children,
    ...props
}) {
    return (
        <button
            {...props}
            className={
                `tw-inline-flex tw-items-center tw-rounded-md tw-border tw-border-transparent tw-bg-gray-800 tw-px-4 tw-py-2 tw-text-xs tw-font-semibold tw-uppercase tw-tracking-widest tw-text-white tw-transition tw-duration-150 tw-ease-in-out hover:tw-bg-gray-700 focus:tw-bg-gray-700 focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-indigo-500 focus:tw-ring-offset-2 active:tw-bg-gray-900 dark:tw-bg-gray-200 dark:tw-text-gray-800 dark:hover:tw-bg-white dark:focus:tw-bg-white dark:focus:tw-ring-offset-gray-800 dark:active:tw-bg-gray-300 ${
                    disabled && 'tw-opacity-25'
                } ` + className
            }
            disabled={disabled}
        >
            {children}
        </button>
    );
}
