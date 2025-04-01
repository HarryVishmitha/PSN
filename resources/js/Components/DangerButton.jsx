export default function DangerButton({
    className = '',
    disabled,
    children,
    ...props
}) {
    return (
        <button
            {...props}
            className={
                `tw-inline-flex tw-items-center tw-rounded-md tw-border tw-border-transparent tw-bg-red-600 tw-px-4 tw-py-2 tw-text-xs tw-font-semibold tw-uppercase tw-tracking-widest tw-text-white tw-transition tw-duration-150 tw-ease-in-out hover:tw-bg-red-500 focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-red-500 focus:tw-ring-offset-2 active:tw-bg-red-700 dark:focus:tw-ring-offset-gray-800 ${
                    disabled && 'tw-opacity-25'
                } ` + className
            }
            disabled={disabled}
        >
            {children}
        </button>
    );
}
