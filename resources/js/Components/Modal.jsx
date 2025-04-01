import {
    Dialog,
    DialogPanel,
    Transition,
    TransitionChild,
} from '@headlessui/react';

export default function Modal({
    children,
    show = false,
    maxWidth = '2xl',
    closeable = true,
    onClose = () => {},
}) {
    const close = () => {
        if (closeable) {
            onClose();
        }
    };

    const maxWidthClass = {
        sm: 'tw-sm:tw-max-w-sm',
        md: 'tw-sm:tw-max-w-md',
        lg: 'tw-sm:tw-max-w-lg',
        xl: 'tw-sm:tw-max-w-xl',
        '2xl': 'tw-sm:tw-max-w-2xl',
    }[maxWidth];

    return (
        <Transition show={show} leave="tw-duration-200">
            <Dialog
                as="div"
                id="modal"
                className="tw-fixed tw-inset-0 tw-z-50 tw-flex tw-transform tw-items-center tw-overflow-y-auto tw-px-4 tw-py-6 tw-transition-all tw-sm:tw-px-0"
                onClose={close}
            >
                <TransitionChild
                    enter="tw-ease-out tw-duration-300"
                    enterFrom="tw-opacity-0"
                    enterTo="tw-opacity-100"
                    leave="tw-ease-in tw-duration-200"
                    leaveFrom="tw-opacity-100"
                    leaveTo="tw-opacity-0"
                >
                    <div className="tw-absolute tw-inset-0 tw-bg-gray-500/75 tw-dark:tw-bg-gray-900/75" />
                </TransitionChild>

                <TransitionChild
                    enter="tw-ease-out tw-duration-300"
                    enterFrom="tw-opacity-0 tw-translate-y-4 tw-sm:tw-translate-y-0 tw-sm:tw-scale-95"
                    enterTo="tw-opacity-100 tw-translate-y-0 tw-sm:tw-scale-100"
                    leave="tw-ease-in tw-duration-200"
                    leaveFrom="tw-opacity-100 tw-translate-y-0 tw-sm:tw-scale-100"
                    leaveTo="tw-opacity-0 tw-translate-y-4 tw-sm:tw-translate-y-0 tw-sm:tw-scale-95"
                >
                    <DialogPanel
                        className={`tw-mb-6 tw-transform tw-overflow-hidden tw-rounded-lg tw-bg-white tw-shadow-xl tw-transition-all tw-sm:tw-mx-auto tw-sm:tw-w-full tw-dark:tw-bg-gray-800 ${maxWidthClass}`}
                    >
                        {children}
                    </DialogPanel>
                </TransitionChild>
            </Dialog>
        </Transition>
    );
}
