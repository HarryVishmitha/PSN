export default function InputLabel({
    value,
    className = '',
    children,
    ...props
}) {
    return (
        <label
            {...props}
            className={
                `tw-block tw-text-sm tw-font-medium tw-text-black dark:tw-text-gray-300 ` +
                className
            }
        >
            {value ? value : children}
        </label>
    );
}
