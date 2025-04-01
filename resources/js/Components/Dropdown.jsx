import { Transition } from '@headlessui/react';
import { Link } from '@inertiajs/react';
import { createContext, useContext, useState } from 'react';

const DropDownContext = createContext();

const Dropdown = ({ children }) => {
    const [open, setOpen] = useState(false);

    const toggleOpen = () => {
        setOpen((previousState) => !previousState);
    };

    return (
        <DropDownContext.Provider value={{ open, setOpen, toggleOpen }}>
            <div className="tw-relative">{children}</div>
        </DropDownContext.Provider>
    );
};

const Trigger = ({ children }) => {
    const { open, setOpen, toggleOpen } = useContext(DropDownContext);

    return (
        <>
            <div onClick={toggleOpen}>{children}</div>

            {open && (
                <div
                    className="tw-fixed tw-inset-0 tw-z-40"
                    onClick={() => setOpen(false)}
                ></div>
            )}
        </>
    );
};

const Content = ({
    align = 'right',
    width = '48',
    contentClasses = 'tw-py-1 tw-bg-white dark:tw-bg-gray-700',
    children,
}) => {
    const { open, setOpen } = useContext(DropDownContext);

    let alignmentClasses = 'tw-origin-top';

    if (align === 'left') {
        alignmentClasses = 'ltr:tw-origin-top-left rtl:tw-origin-top-right tw-start-0';
    } else if (align === 'right') {
        alignmentClasses = 'ltr:tw-origin-top-right rtl:tw-origin-top-left tw-end-0';
    }

    let widthClasses = '';

    if (width === '48') {
        widthClasses = 'tw-w-48';
    }

    return (
        <>
            <Transition
                show={open}
                enter="tw-transition tw-ease-out tw-duration-200"
                enterFrom="tw-opacity-0 tw-scale-95"
                enterTo="tw-opacity-100 tw-scale-100"
                leave="tw-transition tw-ease-in tw-duration-75"
                leaveFrom="tw-opacity-100 tw-scale-100"
                leaveTo="tw-opacity-0 tw-scale-95"
            >
                <div
                    className={`tw-absolute tw-z-50 tw-mt-2 tw-rounded-md tw-shadow-lg ${alignmentClasses} ${widthClasses}`}
                    onClick={() => setOpen(false)}
                >
                    <div
                        className={
                            `tw-rounded-md tw-ring-1 tw-ring-black tw-ring-opacity-5 ` +
                            contentClasses
                        }
                    >
                        {children}
                    </div>
                </div>
            </Transition>
        </>
    );
};

const DropdownLink = ({ className = '', children, ...props }) => {
    return (
        <Link
            {...props}
            className={
                'tw-block tw-w-full tw-px-4 tw-py-2 tw-text-start tw-text-sm tw-leading-5 tw-text-gray-700 tw-transition tw-duration-150 tw-ease-in-out hover:tw-bg-gray-100 focus:tw-bg-gray-100 focus:tw-outline-none dark:tw-text-gray-300 dark:hover:tw-bg-gray-800 dark:focus:tw-bg-gray-800 ' +
                className
            }
        >
            {children}
        </Link>
    );
};

Dropdown.Trigger = Trigger;
Dropdown.Content = Content;
Dropdown.Link = DropdownLink;

export default Dropdown;
