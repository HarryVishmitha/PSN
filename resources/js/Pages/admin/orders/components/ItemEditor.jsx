import { Icon } from '@iconify/react';

const ItemEditor = ({
    order,
    items,
    updateItem,
    removeItem,
    duplicateItem,
    subtotal,
    previewLoading,
    onPreview,
    openDrawer,
    drawerOpen,
    closeDrawer,
    productQuery,
    setProductQuery,
    productResults,
    productLoading,
    addProduct,
    ensureRollOptions,
    rollCache,
    itemErrors = {},
    unlockOrder,
    showUnlockModal,
    setShowUnlockModal,
    unlockReason,
    setUnlockReason,
    unlocking,
}) => {
    const isItemsLocked = order?.is_items_locked;
    const isLocked = order?.is_locked;
    const renderRollSection = (item, index) => {
        const errors = itemErrors[index] || [];
        const rollOptions = rollCache[item.product_id] || [];
        const hasRollId = !!item.roll_id;
        const missingConfig =
            !hasRollId || !item.cut_width_in || !item.cut_height_in;

        return (
            <div className="tw-space-y-3 tw-rounded-xl tw-border-2 tw-border-purple-200 tw-bg-gradient-to-br tw-from-purple-50 tw-to-blue-50 tw-p-3 tw-shadow-sm">
                {missingConfig && (
                    <div className="tw-flex tw-items-start tw-gap-2 tw-rounded-lg tw-border-2 tw-border-amber-300 tw-bg-amber-50 tw-p-2">
                        <Icon
                            icon="solar:danger-triangle-bold"
                            className="tw-mt-0.5 tw-text-base tw-text-amber-600"
                        />
                        <div className="tw-flex-1">
                            <p className="tw-text-[10px] tw-font-bold tw-uppercase tw-text-amber-800">
                                Configuration Required
                            </p>
                            <p className="tw-text-[11px] tw-font-medium tw-text-amber-700">
                                {!hasRollId
                                    ? 'Select a roll type'
                                    : 'Enter cut dimensions'}
                            </p>
                        </div>
                    </div>
                )}

                <div className="tw-grid tw-grid-cols-2 tw-gap-2">
                    <div>
                        <label className="tw-mb-1 tw-flex tw-items-center tw-gap-1 tw-text-[11px] tw-font-bold tw-uppercase tw-tracking-wide tw-text-purple-700">
                            <Icon
                                icon="solar:roll-bold-duotone"
                                className="tw-text-sm"
                            />
                            Roll Type
                            <span className="tw-text-rose-600">*</span>
                        </label>
                        <select
                            value={item.roll_id || ''}
                            onChange={(e) => {
                                const rollId = Number(e.target.value || 0);
                                const selectedRoll = rollOptions.find(
                                    (r) => r.id === rollId,
                                );

                                updateItem(item.tempId, {
                                    roll_id: rollId,
                                    // Update offcut_price_per_sqft if roll has an offcut_price
                                    // Only update if current offcut_price_per_sqft is empty or matches the old roll's price
                                    offcut_price_per_sqft:
                                        rollId && selectedRoll?.offcut_price
                                            ? selectedRoll.offcut_price
                                            : rollId
                                              ? item.offcut_price_per_sqft
                                              : '',
                                });
                            }}
                            onFocus={() => ensureRollOptions(item.product_id)}
                            disabled={isItemsLocked}
                            className={`tw-w-full tw-rounded-lg tw-border-2 tw-bg-white tw-px-2.5 tw-py-2 tw-text-xs tw-font-semibold tw-transition-all focus:tw-ring-2 disabled:tw-cursor-not-allowed disabled:tw-bg-gray-100 disabled:tw-opacity-60 ${
                                !hasRollId
                                    ? 'tw-border-amber-300 focus:tw-border-amber-400 focus:tw-ring-amber-500/20'
                                    : 'tw-border-purple-200 focus:tw-border-purple-400 focus:tw-ring-purple-500/20'
                            }`}
                        >
                            <option value="">Select roll type...</option>
                            {rollOptions.map((roll) => (
                                <option key={roll.id} value={roll.id}>
                                    {roll.roll_type} • {roll.roll_width}ft{' '}
                                    {roll.roll_size
                                        ? `(${roll.roll_size})`
                                        : ''}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="tw-mb-1 tw-flex tw-items-center tw-gap-1 tw-text-[11px] tw-font-bold tw-uppercase tw-tracking-wide tw-text-purple-700">
                            <Icon
                                icon="solar:tag-price-bold-duotone"
                                className="tw-text-sm"
                            />
                            Offcut Rate
                        </label>
                        <div className="tw-relative">
                            <span className="tw-absolute tw-left-2.5 tw-top-1/2 tw--translate-y-1/2 tw-text-[10px] tw-font-bold tw-text-slate-500">
                                LKR
                            </span>
                            <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={item.offcut_price_per_sqft ?? ''}
                                onChange={(e) =>
                                    updateItem(item.tempId, {
                                        offcut_price_per_sqft: e.target.value,
                                    })
                                }
                                disabled={isItemsLocked}
                                className="tw-w-full tw-rounded-lg tw-border-2 tw-border-purple-200 tw-bg-white tw-py-2 tw-pl-10 tw-pr-2.5 tw-text-xs tw-font-semibold tw-transition-all focus:tw-border-purple-400 focus:tw-ring-2 focus:tw-ring-purple-500/20 disabled:tw-cursor-not-allowed disabled:tw-bg-gray-100 disabled:tw-opacity-60"
                            />
                        </div>
                    </div>
                </div>
                <div className="tw-grid tw-grid-cols-2 tw-gap-2">
                    <div>
                        <label className="tw-mb-1 tw-flex tw-items-center tw-gap-1 tw-text-[11px] tw-font-bold tw-uppercase tw-tracking-wide tw-text-blue-700">
                            <Icon
                                icon="solar:ruler-angular-bold-duotone"
                                className="tw-text-sm"
                            />
                            Cut Width
                        </label>
                        <div className="tw-relative">
                            <input
                                type="number"
                                min="0"
                                step="0.1"
                                value={item.cut_width_in ?? ''}
                                onChange={(e) =>
                                    updateItem(item.tempId, {
                                        cut_width_in: e.target.value,
                                    })
                                }
                                disabled={isItemsLocked}
                                className="tw-w-full tw-rounded-lg tw-border-2 tw-border-blue-200 tw-bg-white tw-px-2.5 tw-py-2 tw-pr-8 tw-text-xs tw-font-semibold tw-transition-all focus:tw-border-blue-400 focus:tw-ring-2 focus:tw-ring-blue-500/20 disabled:tw-cursor-not-allowed disabled:tw-bg-gray-100 disabled:tw-opacity-60"
                            />
                            <span className="tw-absolute tw-right-2.5 tw-top-1/2 tw--translate-y-1/2 tw-text-[10px] tw-font-bold tw-text-slate-500">
                                in
                            </span>
                        </div>
                    </div>
                    <div>
                        <label className="tw-mb-1 tw-flex tw-items-center tw-gap-1 tw-text-[11px] tw-font-bold tw-uppercase tw-tracking-wide tw-text-blue-700">
                            <Icon
                                icon="solar:ruler-bold-duotone"
                                className="tw-text-sm"
                            />
                            Cut Height
                        </label>
                        <div className="tw-relative">
                            <input
                                type="number"
                                min="0"
                                step="0.1"
                                value={item.cut_height_in ?? ''}
                                onChange={(e) =>
                                    updateItem(item.tempId, {
                                        cut_height_in: e.target.value,
                                    })
                                }
                                disabled={isItemsLocked}
                                className="tw-w-full tw-rounded-lg tw-border-2 tw-border-blue-200 tw-bg-white tw-px-2.5 tw-py-2 tw-pr-8 tw-text-xs tw-font-semibold tw-transition-all focus:tw-border-blue-400 focus:tw-ring-2 focus:tw-ring-blue-500/20 disabled:tw-cursor-not-allowed disabled:tw-bg-gray-100 disabled:tw-opacity-60"
                            />
                            <span className="tw-absolute tw-right-2.5 tw-top-1/2 tw--translate-y-1/2 tw-text-[10px] tw-font-bold tw-text-slate-500">
                                in
                            </span>
                        </div>
                    </div>
                </div>
                <div className="tw-space-y-1.5 tw-rounded-lg tw-border-2 tw-border-slate-200 tw-bg-white tw-p-2.5 tw-shadow-sm">
                    <div className="tw-mb-1.5 tw-flex tw-items-center tw-gap-1.5 tw-text-[10px] tw-font-bold tw-uppercase tw-tracking-wider tw-text-slate-600">
                        <Icon
                            icon="solar:calculator-minimalistic-bold-duotone"
                            className="tw-text-sm tw-text-purple-600"
                        />
                        Calculated Metrics
                    </div>
                    <div className="tw-flex tw-items-center tw-justify-between tw-rounded tw-bg-emerald-50 tw-px-2 tw-py-1">
                        <span className="tw-flex tw-items-center tw-gap-1 tw-text-[11px] tw-font-semibold tw-text-emerald-700">
                            <Icon
                                icon="solar:layers-minimalistic-bold-duotone"
                                className="tw-text-sm"
                            />
                            Fixed Area
                        </span>
                        <span className="tw-font-bold tw-text-emerald-900">
                            {item.roll_meta?.fixedAreaFt2 || 0} ft²
                        </span>
                    </div>
                    <div className="tw-flex tw-items-center tw-justify-between tw-rounded tw-bg-amber-50 tw-px-2 tw-py-1">
                        <span className="tw-flex tw-items-center tw-gap-1 tw-text-[11px] tw-font-semibold tw-text-amber-700">
                            <Icon
                                icon="solar:document-text-bold-duotone"
                                className="tw-text-sm"
                            />
                            Offcut Area
                        </span>
                        <span className="tw-font-bold tw-text-amber-900">
                            {item.roll_meta?.offcutAreaFt2 || 0} ft²
                        </span>
                    </div>
                    <div className="tw-flex tw-items-center tw-justify-between tw-rounded tw-bg-blue-50 tw-px-2 tw-py-1">
                        <span className="tw-flex tw-items-center tw-gap-1 tw-text-[11px] tw-font-semibold tw-text-blue-700">
                            <Icon
                                icon="solar:ruler-cross-pen-bold-duotone"
                                className="tw-text-sm"
                            />
                            Offcut Width
                        </span>
                        <span className="tw-font-bold tw-text-blue-900">
                            {item.roll_meta?.offcutWidthIn || 0}"
                        </span>
                    </div>
                </div>
                {errors.length > 0 && (
                    <div className="tw-rounded-lg tw-border-2 tw-border-rose-300 tw-bg-rose-50 tw-p-2 tw-text-[11px] tw-font-semibold tw-text-rose-700">
                        {errors.map((err, idx) => (
                            // eslint-disable-next-line react/no-array-index-key
                            <div
                                key={idx}
                                className="tw-flex tw-items-center tw-gap-1"
                            >
                                <Icon
                                    icon="solar:danger-circle-bold"
                                    className="tw-text-sm"
                                />
                                {Array.isArray(err) ? err[0] : err}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="tw-group tw-space-y-6 tw-rounded-2xl tw-border-2 tw-border-slate-200 tw-bg-gradient-to-br tw-from-white tw-to-slate-50 tw-p-6 tw-shadow-xl tw-transition-all hover:tw-shadow-2xl">
            {isItemsLocked && (
                <div className="tw-rounded-xl tw-border-2 tw-border-red-300 tw-bg-gradient-to-r tw-from-red-50 tw-to-orange-50 tw-p-4 tw-shadow-md">
                    <div className="tw-flex tw-items-start tw-justify-between tw-gap-4">
                        <div className="tw-flex tw-flex-1 tw-items-start tw-gap-3">
                            <div className="tw-flex tw-h-10 tw-w-10 tw-shrink-0 tw-items-center tw-justify-center tw-rounded-xl tw-bg-gradient-to-br tw-from-red-500 tw-to-orange-600 tw-shadow-lg">
                                <Icon
                                    icon="solar:lock-bold"
                                    className="tw-text-xl tw-text-white"
                                />
                            </div>
                            <div className="tw-flex-1">
                                <h4 className="tw-flex tw-items-center tw-gap-2 tw-text-base tw-font-bold tw-text-red-800">
                                    <Icon
                                        icon="solar:shield-warning-bold"
                                        className="tw-text-lg"
                                    />
                                    Items Locked
                                </h4>
                                <p className="tw-mt-1 tw-text-sm tw-text-red-700">
                                    This order's items are locked and cannot be
                                    modified. Items were locked on{' '}
                                    <span className="tw-font-bold">
                                        {order?.locked_at
                                            ? new Date(
                                                  order.locked_at,
                                              ).toLocaleDateString()
                                            : 'unknown date'}
                                    </span>
                                    {order?.locked_total && (
                                        <>
                                            {' '}
                                            at a total of{' '}
                                            <span className="tw-font-bold">
                                                {money(order.locked_total)}
                                            </span>
                                        </>
                                    )}
                                    . You cannot add, remove, or modify items
                                    while locked.
                                </p>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={() => setShowUnlockModal(true)}
                            className="tw-flex tw-shrink-0 tw-items-center tw-gap-2 tw-rounded-lg tw-border-2 tw-border-red-600 tw-bg-red-600 tw-px-4 tw-py-2 tw-text-sm tw-font-bold tw-text-white tw-shadow-lg tw-transition-all hover:tw-bg-red-700"
                        >
                            <Icon
                                icon="solar:lock-unlocked-bold"
                                className="tw-text-base"
                            />
                            Unlock Order
                        </button>
                    </div>
                </div>
            )}
            <div className="tw-flex tw-flex-wrap tw-items-center tw-justify-between tw-gap-4">
                <div className="tw-flex tw-items-center tw-gap-3">
                    <div className="tw-flex tw-h-12 tw-w-12 tw-items-center tw-justify-center tw-rounded-xl tw-bg-gradient-to-br tw-from-blue-500 tw-to-purple-600 tw-shadow-lg">
                        <Icon
                            icon="solar:box-bold-duotone"
                            className="tw-text-2xl tw-text-white"
                        />
                    </div>
                    <div>
                        <h3 className="tw-text-xl tw-font-bold tw-text-slate-900">
                            Items &amp; Pricing
                        </h3>
                        <p className="tw-mt-3 tw-text-xs tw-text-slate-600">
                            <Icon
                                icon="solar:calculator-minimalistic-bold-duotone"
                                className="tw-mr-1 tw-inline tw-text-sm"
                            />
                            Advanced roll calculations with real-time pricing
                        </p>
                    </div>
                </div>
                <button
                    type="button"
                    onClick={openDrawer}
                    disabled={isItemsLocked}
                    className="tw-group/btn tw-inline-flex tw-items-center tw-gap-2.5 tw-rounded-xl tw-border-2 tw-border-blue-600 tw-bg-gradient-to-r tw-from-blue-600 tw-to-purple-600 tw-px-5 tw-py-2.5 tw-text-sm tw-font-bold tw-text-white tw-shadow-lg tw-transition-all hover:tw-scale-105 hover:tw-from-blue-700 hover:tw-to-purple-700 hover:tw-shadow-xl disabled:tw-cursor-not-allowed disabled:tw-opacity-50 disabled:hover:tw-scale-100"
                >
                    <Icon
                        icon="solar:add-circle-bold-duotone"
                        className="tw-text-xl tw-transition-transform group-hover/btn:tw-rotate-90"
                    />
                    Add Product
                </button>
            </div>

            <div className="tw-overflow-x-auto tw-rounded-xl tw-border tw-border-slate-200">
                <table className="tw-min-w-full tw-text-sm">
                    <thead className="tw-bg-gradient-to-r tw-from-slate-100 tw-via-blue-50 tw-to-slate-100">
                        <tr className="tw-text-xs tw-font-bold tw-uppercase tw-tracking-wider tw-text-slate-700">
                            <th className="tw-border-b-2 tw-border-slate-200 tw-px-4 tw-py-4 tw-text-left">
                                <div className="tw-flex tw-items-center tw-gap-2">
                                    <Icon
                                        icon="solar:box-minimalistic-bold-duotone"
                                        className="tw-text-blue-600"
                                    />
                                    Product
                                </div>
                            </th>
                            <th className="tw-w-24 tw-border-b-2 tw-border-slate-200 tw-px-4 tw-py-4 tw-text-left">
                                <div className="tw-flex tw-items-center tw-gap-1">
                                    <Icon
                                        icon="solar:hashtag-bold-duotone"
                                        className="tw-text-purple-600"
                                    />
                                    Qty
                                </div>
                            </th>
                            <th className="tw-w-24 tw-border-b-2 tw-border-slate-200 tw-px-4 tw-py-4 tw-text-left">
                                <div className="tw-flex tw-items-center tw-gap-1">
                                    <Icon
                                        icon="solar:ruler-bold-duotone"
                                        className="tw-text-emerald-600"
                                    />
                                    Unit
                                </div>
                            </th>
                            <th className="tw-w-28 tw-border-b-2 tw-border-slate-200 tw-px-4 tw-py-4 tw-text-left">
                                <div className="tw-flex tw-items-center tw-gap-1">
                                    <Icon
                                        icon="solar:tag-price-bold-duotone"
                                        className="tw-text-amber-600"
                                    />
                                    Unit Price
                                </div>
                            </th>
                            <th className="tw-w-32 tw-border-b-2 tw-border-slate-200 tw-px-4 tw-py-4 tw-text-left">
                                <div className="tw-flex tw-items-center tw-gap-1">
                                    <Icon
                                        icon="solar:calculator-bold-duotone"
                                        className="tw-text-blue-600"
                                    />
                                    Line Total
                                </div>
                            </th>
                            <th className="tw-w-[280px] tw-border-b-2 tw-border-slate-200 tw-px-4 tw-py-4 tw-text-left">
                                <div className="tw-flex tw-items-center tw-gap-1">
                                    <Icon
                                        icon="solar:settings-bold-duotone"
                                        className="tw-text-slate-600"
                                    />
                                    Roll Configuration
                                </div>
                            </th>
                            <th className="tw-w-20 tw-border-b-2 tw-border-slate-200 tw-px-2 tw-py-4 tw-text-center">
                                <Icon
                                    icon="solar:menu-dots-bold-duotone"
                                    className="tw-mx-auto tw-text-slate-500"
                                />
                            </th>
                        </tr>
                    </thead>
                    <tbody className="tw-divide-y tw-divide-slate-100">
                        {items.map((item, index) => (
                            <tr
                                key={item.tempId}
                                className="tw-group/row tw-bg-white tw-transition-all hover:tw-bg-gradient-to-r hover:tw-from-blue-50/50 hover:tw-to-purple-50/50"
                            >
                                <td className="tw-space-y-2.5 tw-px-4 tw-py-4 tw-align-top">
                                    <div className="tw-flex tw-items-center tw-gap-2">
                                        {item.is_roll && (
                                            <span className="tw-rounded-md tw-bg-purple-600 tw-px-2 tw-py-0.5 tw-text-[10px] tw-font-bold tw-uppercase tw-text-white tw-shadow-sm">
                                                Roll
                                            </span>
                                        )}
                                        <div className="tw-flex-1 tw-font-bold tw-text-slate-900">
                                            {item.product?.name ||
                                                `Product #${item.product_id}`}
                                        </div>
                                    </div>
                                    <textarea
                                        rows={2}
                                        value={item.description}
                                        placeholder="Add internal notes or special instructions..."
                                        onChange={(e) =>
                                            updateItem(item.tempId, {
                                                description: e.target.value,
                                            })
                                        }
                                        className="tw-w-full tw-rounded-lg tw-border-2 tw-border-slate-200 tw-bg-slate-50 tw-px-3 tw-py-2 tw-text-xs tw-transition-all focus:tw-border-blue-400 focus:tw-bg-white focus:tw-ring-2 focus:tw-ring-blue-500/20"
                                    />
                                </td>
                                <td className="tw-px-4 tw-py-4 tw-align-top">
                                    <div className="tw-relative">
                                        <input
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            value={item.quantity}
                                            onChange={(e) =>
                                                updateItem(item.tempId, {
                                                    quantity: e.target.value,
                                                })
                                            }
                                            disabled={isItemsLocked}
                                            className="tw-w-full tw-rounded-lg tw-border-2 tw-border-slate-200 tw-bg-white tw-px-3 tw-py-2.5 tw-text-sm tw-font-semibold tw-transition-all focus:tw-border-purple-400 focus:tw-ring-2 focus:tw-ring-purple-500/20 disabled:tw-cursor-not-allowed disabled:tw-bg-gray-100 disabled:tw-opacity-60"
                                        />
                                    </div>
                                </td>
                                <td className="tw-px-4 tw-py-4 tw-align-top">
                                    <input
                                        type="text"
                                        value={item.unit || ''}
                                        onChange={(e) =>
                                            updateItem(item.tempId, {
                                                unit: e.target.value,
                                            })
                                        }
                                        disabled={isItemsLocked}
                                        className="tw-w-full tw-rounded-lg tw-border-2 tw-border-slate-200 tw-bg-white tw-px-3 tw-py-2.5 tw-text-sm tw-font-medium tw-transition-all focus:tw-border-emerald-400 focus:tw-ring-2 focus:tw-ring-emerald-500/20 disabled:tw-cursor-not-allowed disabled:tw-bg-gray-100 disabled:tw-opacity-60"
                                    />
                                </td>
                                <td className="tw-px-4 tw-py-4 tw-align-top">
                                    <div className="tw-relative">
                                        <input
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            disabled={
                                                item.is_roll || isItemsLocked
                                            }
                                            value={item.unit_price}
                                            onChange={(e) =>
                                                updateItem(item.tempId, {
                                                    unit_price: e.target.value,
                                                })
                                            }
                                            className={`tw-w-full tw-rounded-lg tw-border-2 tw-px-3 tw-py-2.5 tw-text-sm tw-font-semibold tw-transition-all ${
                                                item.is_roll || isItemsLocked
                                                    ? 'tw-cursor-not-allowed tw-border-slate-200 tw-bg-gradient-to-br tw-from-slate-100 tw-to-slate-200 tw-text-slate-500'
                                                    : 'tw-border-slate-200 tw-bg-white focus:tw-border-amber-400 focus:tw-ring-2 focus:tw-ring-amber-500/20'
                                            }`}
                                        />
                                        {item.is_roll && (
                                            <div className="tw-absolute tw-right-2 tw-top-1/2 tw--translate-y-1/2">
                                                <Icon
                                                    icon="solar:lock-keyhole-bold-duotone"
                                                    className="tw-text-slate-400"
                                                />
                                            </div>
                                        )}
                                    </div>
                                    <div className="tw-mt-1 tw-flex tw-items-center tw-gap-1 tw-text-[10px] tw-font-semibold tw-uppercase tw-tracking-wide">
                                        {item.is_roll ? (
                                            <>
                                                <Icon
                                                    icon="solar:calculator-minimalistic-bold-duotone"
                                                    className="tw-text-purple-500"
                                                />
                                                <span className="tw-text-purple-600">
                                                    Auto-calc
                                                </span>
                                            </>
                                        ) : (
                                            <>
                                                <Icon
                                                    icon="solar:pen-bold-duotone"
                                                    className="tw-text-blue-500"
                                                />
                                                <span className="tw-text-blue-600">
                                                    Manual
                                                </span>
                                            </>
                                        )}
                                    </div>
                                </td>
                                <td className="tw-px-4 tw-py-4 tw-align-top">
                                    <div className="tw-rounded-xl tw-bg-gradient-to-br tw-from-blue-50 tw-to-purple-50 tw-p-3 tw-shadow-sm">
                                        <div className="tw-mb-1 tw-text-xl tw-font-extrabold tw-text-slate-900">
                                            {money(
                                                Number(item.line_total || 0),
                                            )}
                                        </div>
                                        <div className="tw-flex tw-items-center tw-gap-1 tw-text-xs tw-font-medium tw-text-slate-600">
                                            <Icon
                                                icon="solar:tag-bold-duotone"
                                                className="tw-text-blue-500"
                                            />
                                            {money(
                                                Number(item.unit_price || 0),
                                            )}{' '}
                                            / {item.unit}
                                        </div>
                                    </div>
                                </td>
                                <td className="tw-px-4 tw-py-4 tw-align-top tw-text-xs tw-text-slate-500">
                                    {item.is_roll ? (
                                        renderRollSection(item, index)
                                    ) : itemErrors[index]?.length ? (
                                        <div className="tw-rounded-lg tw-border-2 tw-border-rose-200 tw-bg-rose-50 tw-p-3">
                                            <div className="tw-mb-1 tw-flex tw-items-center tw-gap-1.5 tw-text-xs tw-font-bold tw-text-rose-700">
                                                <Icon icon="solar:danger-circle-bold" />
                                                Validation Errors
                                            </div>
                                            {itemErrors[index].map(
                                                (err, idx) => (
                                                    // eslint-disable-next-line react/no-array-index-key
                                                    <div
                                                        key={idx}
                                                        className="tw-text-[11px] tw-font-medium tw-text-rose-600"
                                                    >
                                                        •{' '}
                                                        {Array.isArray(err)
                                                            ? err[0]
                                                            : err}
                                                    </div>
                                                ),
                                            )}
                                        </div>
                                    ) : (
                                        <div className="tw-flex tw-flex-col tw-items-center tw-gap-2 tw-rounded-lg tw-border-2 tw-border-dashed tw-border-slate-200 tw-bg-slate-50 tw-p-4 tw-text-center">
                                            <Icon
                                                icon="solar:box-bold-duotone"
                                                className="tw-text-2xl tw-text-slate-300"
                                            />
                                            <span className="tw-text-xs tw-font-medium tw-text-slate-400">
                                                Standard Product
                                            </span>
                                        </div>
                                    )}
                                </td>
                                <td className="tw-px-2 tw-py-4 tw-align-top">
                                    <div className="tw-flex tw-flex-col tw-items-center tw-gap-2">
                                        <button
                                            type="button"
                                            onClick={() =>
                                                duplicateItem(item.tempId)
                                            }
                                            disabled={isItemsLocked}
                                            title={
                                                isItemsLocked
                                                    ? 'Items locked - cannot duplicate'
                                                    : 'Duplicate item'
                                            }
                                            className="tw-group/btn tw-inline-flex tw-items-center tw-justify-center tw-rounded-lg tw-border-2 tw-border-blue-200 tw-bg-blue-50 tw-p-2 tw-text-blue-600 tw-shadow-sm tw-transition-all hover:tw-scale-110 hover:tw-border-blue-400 hover:tw-bg-blue-100 hover:tw-shadow-md disabled:tw-cursor-not-allowed disabled:tw-opacity-40 disabled:hover:tw-scale-100"
                                        >
                                            <Icon
                                                icon="solar:copy-bold-duotone"
                                                className="tw-text-lg"
                                            />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() =>
                                                removeItem(item.tempId)
                                            }
                                            disabled={isItemsLocked}
                                            title={
                                                isItemsLocked
                                                    ? 'Items locked - cannot remove'
                                                    : 'Remove item'
                                            }
                                            className="tw-group/btn tw-inline-flex tw-items-center tw-justify-center tw-rounded-lg tw-border-2 tw-border-rose-200 tw-bg-rose-50 tw-p-2 tw-text-rose-600 tw-shadow-sm tw-transition-all hover:tw-scale-110 hover:tw-border-rose-400 hover:tw-bg-rose-100 hover:tw-shadow-md disabled:tw-cursor-not-allowed disabled:tw-opacity-40 disabled:hover:tw-scale-100"
                                        >
                                            <Icon
                                                icon="solar:trash-bin-minimalistic-bold-duotone"
                                                className="tw-text-lg"
                                            />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {items.length === 0 && (
                            <tr>
                                <td colSpan={7} className="tw-px-4 tw-py-20">
                                    <div className="tw-flex tw-flex-col tw-items-center tw-gap-4">
                                        <div className="tw-flex tw-h-20 tw-w-20 tw-items-center tw-justify-center tw-rounded-2xl tw-bg-gradient-to-br tw-from-slate-100 tw-to-slate-200 tw-shadow-lg">
                                            <Icon
                                                icon="solar:box-bold-duotone"
                                                className="tw-text-4xl tw-text-slate-400"
                                            />
                                        </div>
                                        <div className="tw-text-center">
                                            <h5 className="tw-text-lg tw-font-bold tw-text-slate-700">
                                                No Items Yet
                                            </h5>
                                            <p className="tw-mt-1 tw-text-sm tw-text-slate-500">
                                                Get started by adding products
                                                to this order
                                            </p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={openDrawer}
                                            className="tw-group/btn tw-inline-flex tw-items-center tw-gap-2 tw-rounded-xl tw-border-2 tw-border-blue-600 tw-bg-blue-600 tw-px-6 tw-py-3 tw-text-sm tw-font-bold tw-text-white tw-shadow-lg tw-transition-all hover:tw-scale-105 hover:tw-shadow-xl"
                                        >
                                            <Icon
                                                icon="solar:add-circle-bold-duotone"
                                                className="tw-text-xl"
                                            />
                                            Add Your First Product
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            <div className="tw-mt-2 tw-flex tw-flex-wrap tw-items-center tw-justify-between tw-gap-4 tw-border-t-2 tw-border-slate-200 tw-pt-5">
                <button
                    type="button"
                    onClick={onPreview}
                    disabled={previewLoading}
                    className="tw-group/sync tw-inline-flex tw-items-center tw-gap-2.5 tw-rounded-xl tw-border-2 tw-border-purple-600 tw-bg-gradient-to-r tw-from-purple-50 tw-to-blue-50 tw-px-5 tw-py-2.5 tw-text-sm tw-font-bold tw-text-purple-700 tw-shadow-md tw-transition-all hover:tw-scale-105 hover:tw-border-purple-700 hover:tw-shadow-lg disabled:tw-opacity-60 disabled:hover:tw-scale-100"
                >
                    <Icon
                        icon={
                            previewLoading
                                ? 'svg-spinners:ring-resize'
                                : 'solar:refresh-circle-bold-duotone'
                        }
                        className="tw-text-xl tw-text-purple-600 tw-transition-transform group-hover/sync:tw-rotate-180"
                    />
                    {previewLoading
                        ? 'Syncing with server...'
                        : 'Sync Pricing Engine'}
                </button>
                <div className="tw-flex tw-items-center tw-gap-3 tw-rounded-xl tw-border-2 tw-border-blue-200 tw-bg-gradient-to-r tw-from-blue-50 tw-to-purple-50 tw-px-6 tw-py-3 tw-shadow-md">
                    <Icon
                        icon="solar:calculator-bold-duotone"
                        className="tw-text-2xl tw-text-blue-600"
                    />
                    <div className="tw-flex tw-flex-col">
                        <span className="tw-text-xs tw-font-semibold tw-uppercase tw-tracking-wide tw-text-slate-600">
                            Subtotal
                        </span>
                        <span className="tw-text-xl tw-font-extrabold tw-text-slate-900">
                            {money(subtotal)}
                        </span>
                    </div>
                </div>
            </div>

            {drawerOpen && (
                <div className="tw-fixed tw-inset-0 tw-z-50 tw-flex tw-items-end tw-justify-end tw-backdrop-blur-sm sm:tw-items-center">
                    <div
                        className="tw-absolute tw-inset-0 tw-bg-gradient-to-br tw-from-slate-900/60 tw-via-blue-900/40 tw-to-purple-900/60 tw-transition-opacity"
                        onClick={closeDrawer}
                        aria-hidden="true"
                    />
                    <aside className="tw-relative tw-flex tw-h-full tw-w-full tw-animate-[slideInRight_0.3s_ease-out] tw-flex-col tw-bg-white tw-shadow-2xl sm:tw-m-4 sm:tw-h-[90vh] sm:tw-w-[600px] sm:tw-rounded-2xl">
                        {/* Header */}
                        <div className="tw-flex tw-items-center tw-justify-between tw-border-b-2 tw-border-slate-200 tw-bg-gradient-to-r tw-from-blue-50 tw-via-purple-50 tw-to-blue-50 tw-p-6">
                            <div className="tw-flex tw-items-center tw-gap-3">
                                <div className="tw-flex tw-h-12 tw-w-12 tw-items-center tw-justify-center tw-rounded-xl tw-bg-gradient-to-br tw-from-blue-500 tw-to-purple-600 tw-shadow-lg">
                                    <Icon
                                        icon="solar:magnifer-bold-duotone"
                                        className="tw-text-2xl tw-text-white"
                                    />
                                </div>
                                <div>
                                    <h5 className="tw-text-lg tw-font-bold tw-text-slate-900">
                                        Add Product
                                    </h5>
                                    <p className="tw-text-xs tw-text-slate-600">
                                        Search and select from product catalog
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={closeDrawer}
                                className="tw-group tw-flex tw-h-10 tw-w-10 tw-items-center tw-justify-center tw-rounded-xl tw-border-2 tw-border-slate-200 tw-bg-white tw-transition-all hover:tw-scale-110 hover:tw-border-rose-300 hover:tw-bg-rose-50"
                            >
                                <Icon
                                    icon="solar:close-circle-bold-duotone"
                                    className="tw-text-2xl tw-text-slate-600 group-hover:tw-text-rose-600"
                                />
                            </button>
                        </div>

                        {/* Search Box */}
                        <div className="tw-border-b tw-border-slate-200 tw-bg-slate-50 tw-p-5">
                            <div className="tw-relative">
                                <Icon
                                    icon="solar:magnifer-bold-duotone"
                                    className="tw-absolute tw-left-4 tw-top-1/2 tw--translate-y-1/2 tw-text-xl tw-text-slate-400"
                                />
                                <input
                                    type="text"
                                    value={productQuery}
                                    onChange={(e) =>
                                        setProductQuery(e.target.value)
                                    }
                                    placeholder="Search by product name, SKU, or category..."
                                    autoFocus
                                    className="tw-placeholder:text-slate-400 tw-w-full tw-rounded-xl tw-border-2 tw-border-slate-200 tw-bg-white tw-py-3 tw-pl-12 tw-pr-4 tw-text-sm tw-font-medium tw-transition-all focus:tw-border-blue-400 focus:tw-ring-4 focus:tw-ring-blue-500/20"
                                />
                                {productQuery && (
                                    <button
                                        onClick={() => setProductQuery('')}
                                        className="tw-absolute tw-right-3 tw-top-1/2 tw--translate-y-1/2 tw-rounded-lg tw-p-1 tw-transition-colors hover:tw-bg-slate-100"
                                    >
                                        <Icon
                                            icon="solar:close-circle-bold"
                                            className="tw-text-lg tw-text-slate-400"
                                        />
                                    </button>
                                )}
                            </div>
                            {productQuery && (
                                <p className="tw-mt-2 tw-text-xs tw-text-slate-600">
                                    {productLoading
                                        ? 'Searching...'
                                        : `Found ${productResults.length} results`}
                                </p>
                            )}
                        </div>

                        {/* Results */}
                        <div className="tw-flex-1 tw-overflow-y-auto tw-p-5">
                            {productLoading && (
                                <div className="tw-flex tw-flex-col tw-items-center tw-gap-4 tw-py-12">
                                    <Icon
                                        icon="svg-spinners:ring-resize"
                                        className="tw-text-5xl tw-text-blue-600"
                                    />
                                    <p className="tw-text-sm tw-font-medium tw-text-slate-600">
                                        Searching products...
                                    </p>
                                </div>
                            )}

                            {!productLoading && productQuery.length < 2 && (
                                <div className="tw-flex tw-flex-col tw-items-center tw-gap-4 tw-py-16">
                                    <div className="tw-flex tw-h-20 tw-w-20 tw-items-center tw-justify-center tw-rounded-2xl tw-bg-gradient-to-br tw-from-blue-100 tw-to-purple-100 tw-shadow-lg">
                                        <Icon
                                            icon="solar:magnifer-zoom-in-bold-duotone"
                                            className="tw-text-4xl tw-text-blue-600"
                                        />
                                    </div>
                                    <div className="tw-text-center">
                                        <h4 className="tw-text-base tw-font-bold tw-text-slate-700">
                                            Start Searching
                                        </h4>
                                        <p className="tw-mt-1 tw-text-sm tw-text-slate-500">
                                            Type at least 2 characters to search
                                            products
                                        </p>
                                    </div>
                                </div>
                            )}

                            {!productLoading &&
                                productQuery.length >= 2 &&
                                productResults.length === 0 && (
                                    <div className="tw-flex tw-flex-col tw-items-center tw-gap-4 tw-py-16">
                                        <div className="tw-flex tw-h-20 tw-w-20 tw-items-center tw-justify-center tw-rounded-2xl tw-bg-gradient-to-br tw-from-slate-100 tw-to-slate-200 tw-shadow-lg">
                                            <Icon
                                                icon="solar:box-bold-duotone"
                                                className="tw-text-4xl tw-text-slate-400"
                                            />
                                        </div>
                                        <div className="tw-text-center">
                                            <h4 className="tw-text-base tw-font-bold tw-text-slate-700">
                                                No Products Found
                                            </h4>
                                            <p className="tw-mt-1 tw-text-sm tw-text-slate-500">
                                                Try adjusting your search terms
                                            </p>
                                        </div>
                                    </div>
                                )}

                            <div className="tw-space-y-3">
                                {productResults.map((product) => (
                                    <button
                                        key={product.id}
                                        type="button"
                                        onClick={() => addProduct(product)}
                                        className="tw-group tw-w-full tw-rounded-xl tw-border-2 tw-border-slate-200 tw-bg-gradient-to-br tw-from-white tw-to-slate-50 tw-p-4 tw-text-left tw-shadow-sm tw-transition-all hover:tw-scale-[1.02] hover:tw-border-blue-300 hover:tw-from-blue-50 hover:tw-to-purple-50 hover:tw-shadow-lg"
                                    >
                                        <div className="tw-mb-2 tw-flex tw-items-start tw-justify-between tw-gap-3">
                                            <div className="tw-flex-1">
                                                <div className="tw-mb-1 tw-flex tw-items-center tw-gap-2">
                                                    <h4 className="tw-text-sm tw-font-bold tw-text-slate-900 group-hover:tw-text-blue-700">
                                                        {product.name}
                                                    </h4>
                                                    {product.pricing_method ===
                                                        'roll' && (
                                                        <span className="tw-rounded-lg tw-bg-purple-600 tw-px-2 tw-py-0.5 tw-text-[10px] tw-font-bold tw-uppercase tw-text-white tw-shadow-sm">
                                                            Roll
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="tw-flex tw-items-center tw-gap-1.5 tw-text-xs tw-text-slate-600">
                                                    <Icon
                                                        icon="solar:buildings-2-bold-duotone"
                                                        className="tw-text-sm tw-text-blue-500"
                                                    />
                                                    {product.working_group
                                                        ?.name || 'Unassigned'}
                                                </p>
                                            </div>
                                            <div className="tw-flex tw-flex-col tw-items-end">
                                                <span className="tw-text-base tw-font-extrabold tw-text-slate-900">
                                                    {product.pricing_method ===
                                                    'roll'
                                                        ? `${money(product.price_per_sqft)}`
                                                        : money(product.price)}
                                                </span>
                                                <span className="tw-text-[10px] tw-font-semibold tw-uppercase tw-tracking-wide tw-text-slate-500">
                                                    {product.pricing_method ===
                                                    'roll'
                                                        ? '/ ft²'
                                                        : '/ unit'}
                                                </span>
                                            </div>
                                        </div>
                                        {product.description && (
                                            <p className="tw-mt-2 tw-line-clamp-2 tw-text-xs tw-text-slate-500">
                                                {product.description}
                                            </p>
                                        )}
                                        <div className="tw-mt-3 tw-flex tw-items-center tw-gap-2 tw-text-xs tw-font-semibold tw-text-blue-600 group-hover:tw-text-purple-600">
                                            <Icon
                                                icon="solar:add-circle-bold-duotone"
                                                className="tw-text-base"
                                            />
                                            Click to add
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </aside>
                </div>
            )}
        </div>
    );
};

const money = (value) => {
    const amount = Number(value || 0);
    return `LKR ${amount.toLocaleString('en-LK', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })}`;
};

export default ItemEditor;
