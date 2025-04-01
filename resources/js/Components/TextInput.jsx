import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';

export default forwardRef(function TextInput(
    { type = 'text', className = '', isFocused = false, ...props },
    ref,
) {
    const localRef = useRef(null);

    useImperativeHandle(ref, () => ({
        focus: () => localRef.current?.focus(),
    }));

    useEffect(() => {
        if (isFocused) {
            localRef.current?.focus();
        }
    }, [isFocused]);

    return (
        <input
            {...props}
            type={type}
            className={
                'tw-rounded-md tw-border-gray-300 tw-shadow-sm tw-focus:border-indigo-500 tw-focus:ring-indigo-500 tw-dark:border-gray-700 tw-dark:bg-gray-900 tw-dark:text-gray-300 tw-dark:focus:border-indigo-600 tw-dark:focus:ring-indigo-600 ' +
                className
            }
            ref={localRef}
        />
    );
});
