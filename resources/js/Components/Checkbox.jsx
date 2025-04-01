export default function Checkbox({ className = '', ...props }) {
    return (
        <input
            {...props}
            type="checkbox"
            className={
                'tw-rounded tw-border-gray-300 tw-text-indigo-600 tw-shadow-sm tw-focus:ring-indigo-500 tw-dark:border-gray-700 tw-dark:bg-gray-900 tw-dark:focus:ring-indigo-600 tw-dark:focus:ring-offset-gray-800 ' +
                className
            }
        />
    );
}
