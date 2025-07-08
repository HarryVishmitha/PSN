import React from 'react';
import { Icon } from '@iconify/react';

const CartItem = ({ item, onRemove, onQtyChange, onSizeChange, onUnitChange, onDesignChange }) => {
    const isRoll = item.pricing_method === 'roll';
    const width = item.width || 0;
    const height = item.height || 0;
    const area = isRoll ? width * height : 1;
    const subtotal = isRoll
        ? item.price * area * item.quantity
        : item.price * item.quantity;

    return (
        <div className="tw-flex tw-flex-col md:tw-flex-row tw-gap-4 tw-bg-white tw-p-4 tw-rounded-xl tw-shadow-sm tw-items-center">
            {/* Image */}
            <div className="tw-w-full md:tw-w-24 tw-h-24 tw-bg-gray-100 tw-rounded-md tw-overflow-hidden tw-flex-shrink-0">
                <img
                    src={item.image || '/images/default.png'}
                    alt={item.name}
                    className="tw-w-full tw-h-full tw-object-cover"
                />
            </div>

            {/* Info */}
            <div className="tw-flex-1 tw-w-full">
                <h6 className="tw-font-semibold tw-text-gray-800">{item.name}</h6>
                <p className="tw-text-sm tw-text-gray-500">{item.variant || 'Standard'}</p>
                <p className="tw-mt-1 tw-text-gray-800">Unit Price: Rs. {item.price.toFixed(2)}</p>

                {/* Roll-based Input */}
                {isRoll && (
                    <div className="tw-mt-2 tw-flex tw-gap-4 tw-flex-wrap tw-items-end">
                        <div className="tw-flex tw-flex-col">
                            <label className="tw-text-xs tw-text-gray-500 tw-mb-1">Width (ft)</label>
                            <input
                                type="number"
                                min={0}
                                step={0.1}
                                value={width}
                                onChange={(e) => onSizeChange?.(item.id, 'width', parseFloat(e.target.value))}
                                className="tw-w-24 tw-border tw-border-gray-300 tw-rounded tw-px-2 tw-py-1 focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-primary/40"
                            />
                        </div>
                        <div className="tw-flex tw-flex-col">
                            <label className="tw-text-xs tw-text-gray-500 tw-mb-1">Height (ft)</label>
                            <input
                                type="number"
                                min={0}
                                step={0.1}
                                value={height}
                                onChange={(e) => onSizeChange?.(item.id, 'height', parseFloat(e.target.value))}
                                className="tw-w-24 tw-border tw-border-gray-300 tw-rounded tw-px-2 tw-py-1 focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-primary/40"
                            />
                        </div>
                        <div className="tw-text-xs tw-text-gray-500 tw-self-end">
                            Area: {area.toFixed(2)} sq.ft
                        </div>
                    </div>
                )}
                <div className="tw-mt-4">
                    <label className="tw-text-sm tw-font-medium tw-text-gray-600 dark:tw-text-gray-300 tw-mb-2 tw-block">
                        Design Option
                    </label>
                    <div className="tw-flex tw-gap-2 tw-flex-wrap">
                        {/* Option: I have a design */}
                        <button
                            onClick={() => onDesignChange?.(item.id, 'own')}
                            className={`tw-px-4 tw-py-2 tw-rounded-md tw-border tw-text-sm tw-transition-colors tw-duration-150 focus:tw-ring-2 focus:tw-ring-primary/50 ${item.designOption === 'own'
                                ? 'tw-bg-gray-400 tw-text-white'
                                : 'tw-border-gray-400 tw-border-2 tw-bg-gray-200 hover:tw-bg-gray-300'
                                }`}
                        >
                            I have a design
                        </button>

                        {/* Option: Hire a designer */}
                        <button
                            onClick={() => onDesignChange?.(item.id, 'hire')}
                            className={`tw-px-4 tw-py-2 tw-rounded-md tw-border tw-text-sm tw-transition-colors tw-duration-150 focus:tw-ring-2 focus:tw-ring-primary/50 ${item.designOption === 'hire'
                                ? 'tw-bg-gray-400 tw-text-white'
                                : 'tw-border-gray-400 tw-border-2 tw-bg-gray-200 hover:tw-bg-gray-300'
                                }`}
                        >
                            Hire a designer
                        </button>

                        {/* Disabled: Design with tool */}
                        <button
                            disabled
                            className="tw-px-4 tw-py-2 tw-rounded-md tw-border tw-text-sm tw-border-gray-200 tw-text-gray-400 tw-bg-gray-100 tw-cursor-not-allowed"
                            title="Coming Soon"
                        >
                            Design with our tool (Coming Soon)
                        </button>
                    </div>

                </div>
            </div>


            {/* Quantity */}
            <div className="tw-flex tw-items-center tw-gap-2">
                <label className="tw-sr-only">Quantity</label>
                <div className="tw-flex tw-items-center tw-gap-1">
                    <button
                        onClick={() => onQtyChange?.(item.id, item.quantity - 1)}
                        disabled={item.quantity <= 1}
                        className={`tw-w-8 tw-h-8 tw-bg-gray-200 hover:tw-bg-gray-300 tw-rounded tw-text-lg tw-font-bold tw-text-center ${item.quantity <= 1 ? 'tw-opacity-50 tw-cursor-not-allowed' : ''
                            }`}
                    >–</button>

                    <span className="tw-w-10 tw-text-center tw-text-sm">{item.quantity}</span>

                    <button
                        onClick={() => onQtyChange?.(item.id, item.quantity + 1)}
                        className="tw-w-8 tw-h-8 tw-bg-gray-200 hover:tw-bg-gray-300 tw-rounded tw-text-lg tw-font-bold tw-text-center"
                    >+</button>
                </div>
            </div>

            {/* Subtotal */}
            <div className="tw-hidden md:tw-block tw-font-semibold tw-text-gray-700">
                Rs. {subtotal.toFixed(2)}
            </div>

            {/* Remove */}
            <button
                onClick={() => onRemove?.(item.id)}
                className="tw-text-red-500 hover:tw-text-red-700 tw-ml-auto md:tw-ml-4"
                title="Remove item"
            >
                <Icon icon="mdi:trash-can-outline" className="tw-text-xl" />
            </button>
        </div>
    );
};

export default CartItem;
