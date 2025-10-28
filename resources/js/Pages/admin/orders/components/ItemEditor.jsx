import React from 'react';
import { Icon } from '@iconify/react';

const ItemEditor = ({
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
}) => {
    const renderRollSection = (item, index) => {
        const errors = itemErrors[index] || [];
        const rollOptions = rollCache[item.product_id] || [];
        return (
            <div className="tw-space-y-2">
                <div className="tw-grid tw-grid-cols-2 tw-gap-2">
                    <div>
                        <label className="tw-text-[11px] tw-font-medium tw-text-slate-500">Roll</label>
                        <select
                            value={item.roll_id || ''}
                            onChange={(e) => updateItem(item.tempId, { roll_id: Number(e.target.value || 0) })}
                            onFocus={() => ensureRollOptions(item.product_id)}
                            className="tw-w-full tw-rounded-lg tw-border tw-border-slate-200 tw-bg-white tw-px-2 tw-py-1.5 tw-text-xs focus:tw-ring-2 focus:tw-ring-slate-500/30 focus:tw-border-slate-400"
                        >
                            <option value="">Select roll</option>
                            {rollOptions.map((roll) => (
                                <option key={roll.id} value={roll.id}>
                                    {roll.roll_type} • {roll.roll_width}ft {roll.roll_size ? `(${roll.roll_size})` : ''}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="tw-text-[11px] tw-font-medium tw-text-slate-500">Offcut rate (LKR)</label>
                        <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.offcut_price_per_sqft ?? ''}
                            onChange={(e) => updateItem(item.tempId, { offcut_price_per_sqft: e.target.value })}
                            className="tw-w-full tw-rounded-lg tw-border tw-border-slate-200 tw-bg-white tw-px-2 tw-py-1.5 tw-text-xs focus:tw-ring-2 focus:tw-ring-slate-500/30 focus:tw-border-slate-400"
                        />
                    </div>
                </div>
                <div className="tw-grid tw-grid-cols-2 tw-gap-2">
                    <div>
                        <label className="tw-text-[11px] tw-font-medium tw-text-slate-500">Cut width (in)</label>
                        <input
                            type="number"
                            min="0"
                            step="0.1"
                            value={item.cut_width_in ?? ''}
                            onChange={(e) => updateItem(item.tempId, { cut_width_in: e.target.value })}
                            className="tw-w-full tw-rounded-lg tw-border tw-border-slate-200 tw-bg-white tw-px-2 tw-py-1.5 tw-text-xs focus:tw-ring-2 focus:tw-ring-slate-500/30 focus:tw-border-slate-400"
                        />
                    </div>
                    <div>
                        <label className="tw-text-[11px] tw-font-medium tw-text-slate-500">Cut height (in)</label>
                        <input
                            type="number"
                            min="0"
                            step="0.1"
                            value={item.cut_height_in ?? ''}
                            onChange={(e) => updateItem(item.tempId, { cut_height_in: e.target.value })}
                            className="tw-w-full tw-rounded-lg tw-border tw-border-slate-200 tw-bg-white tw-px-2 tw-py-1.5 tw-text-xs focus:tw-ring-2 focus:tw-ring-slate-500/30 focus:tw-border-slate-400"
                        />
                    </div>
                </div>
                <div className="tw-rounded-lg tw-bg-slate-100 tw-p-2 tw-text-[11px] tw-text-slate-500 tw-space-y-1">
                    <div className="tw-flex tw-justify-between">
                        <span>Fixed area</span>
                        <span>{item.roll_meta?.fixedAreaFt2 || 0} ft²</span>
                    </div>
                    <div className="tw-flex tw-justify-between">
                        <span>Offcut area</span>
                        <span>{item.roll_meta?.offcutAreaFt2 || 0} ft²</span>
                    </div>
                    <div className="tw-flex tw-justify-between">
                        <span>Offcut width</span>
                        <span>{item.roll_meta?.offcutWidthIn || 0}"</span>
                    </div>
                </div>
                {errors.length > 0 && (
                    <div className="tw-text-[11px] tw-text-rose-500">
                        {errors.map((err, idx) => (
                            // eslint-disable-next-line react/no-array-index-key
                            <div key={idx}>{Array.isArray(err) ? err[0] : err}</div>
                        ))}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="tw-rounded-xl tw-border tw-border-slate-200 tw-bg-white tw-shadow-sm tw-p-5 tw-space-y-5">
            <div className="tw-flex tw-flex-wrap tw-items-center tw-justify-between tw-gap-3">
                <div>
                    <h2 className="tw-text-lg tw-font-semibold tw-text-slate-900">Items &amp; pricing</h2>
                    <p className="tw-text-xs tw-text-slate-500">Roll calculations mirror the estimation engine.</p>
                </div>
                <button
                    type="button"
                    onClick={openDrawer}
                    className="tw-inline-flex tw-items-center tw-gap-2 tw-rounded-full tw-border tw-border-slate-300 tw-bg-white tw-px-4 tw-py-2 tw-text-xs tw-font-semibold tw-text-slate-600 hover:tw-border-slate-400"
                >
                    <Icon icon="solar:add-circle-line-duotone" className="tw-text-lg" />
                    Add product
                </button>
            </div>

            <div className="tw-overflow-x-auto">
                <table className="tw-min-w-full tw-text-sm tw-border-separate tw-border-spacing-y-3">
                    <thead>
                        <tr className="tw-text-xs tw-uppercase tw-tracking-wide tw-text-slate-500">
                            <th className="tw-text-left tw-px-3">Product</th>
                            <th className="tw-text-left tw-px-3 tw-w-24">Qty</th>
                            <th className="tw-text-left tw-px-3 tw-w-24">Unit</th>
                            <th className="tw-text-left tw-px-3 tw-w-28">Unit price</th>
                            <th className="tw-text-left tw-px-3 tw-w-32">Line total</th>
                            <th className="tw-text-left tw-px-3 tw-w-[260px]">Roll settings</th>
                            <th className="tw-w-16" />
                        </tr>
                    </thead>
                    <tbody>
                        {items.map((item, index) => (
                            <tr key={item.tempId} className="tw-bg-slate-50/70 tw-rounded-xl">
                                <td className="tw-align-top tw-p-3 tw-space-y-2">
                                    <div className="tw-font-semibold tw-text-slate-900">
                                        {item.product?.name || `Product #${item.product_id}`}
                                    </div>
                                    <textarea
                                        rows={2}
                                        value={item.description}
                                        placeholder="Internal description / notes"
                                        onChange={(e) => updateItem(item.tempId, { description: e.target.value })}
                                        className="tw-w-full tw-rounded-lg tw-border tw-border-slate-200 tw-bg-white tw-px-3 tw-py-2 tw-text-xs focus:tw-ring-2 focus:tw-ring-slate-500/30 focus:tw-border-slate-400"
                                    />
                                </td>
                                <td className="tw-align-top tw-p-3">
                                    <input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={item.quantity}
                                        onChange={(e) => updateItem(item.tempId, { quantity: e.target.value })}
                                        className="tw-w-full tw-rounded-lg tw-border tw-border-slate-200 tw-bg-white tw-px-3 tw-py-2 tw-text-sm focus:tw-ring-2 focus:tw-ring-slate-500/30 focus:tw-border-slate-400"
                                    />
                                </td>
                                <td className="tw-align-top tw-p-3">
                                    <input
                                        type="text"
                                        value={item.unit || ''}
                                        onChange={(e) => updateItem(item.tempId, { unit: e.target.value })}
                                        className="tw-w-full tw-rounded-lg tw-border tw-border-slate-200 tw-bg-white tw-px-3 tw-py-2 tw-text-sm focus:tw-ring-2 focus:tw-ring-slate-500/30 focus:tw-border-slate-400"
                                    />
                                </td>
                                <td className="tw-align-top tw-p-3">
                                    <input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        disabled={item.is_roll}
                                        value={item.unit_price}
                                        onChange={(e) => updateItem(item.tempId, { unit_price: e.target.value })}
                                        className={`tw-w-full tw-rounded-lg tw-border tw-border-slate-200 tw-bg-white tw-px-3 tw-py-2 tw-text-sm focus:tw-ring-2 focus:tw-ring-slate-500/30 focus:tw-border-slate-400 ${
                                            item.is_roll ? 'tw-bg-slate-100 tw-text-slate-400 tw-cursor-not-allowed' : ''
                                        }`}
                                    />
                                    <div className="tw-text-[11px] tw-text-slate-400 tw-pt-1">
                                        {item.is_roll ? 'Auto-calculated' : 'Manual override'}
                                    </div>
                                </td>
                                <td className="tw-align-top tw-p-3">
                                    <div className="tw-font-semibold tw-text-slate-900">
                                        {money(Number(item.line_total || 0))}
                                    </div>
                                    <div className="tw-text-xs tw-text-slate-400">
                                        {money(Number(item.unit_price || 0))} / {item.unit}
                                    </div>
                                </td>
                                <td className="tw-align-top tw-p-3 tw-text-xs tw-text-slate-500">
                                    {item.is_roll ? renderRollSection(item, index) : (
                                        itemErrors[index]?.length ? (
                                            <div className="tw-text-[11px] tw-text-rose-500">
                                                {itemErrors[index].map((err, idx) => (
                                                    // eslint-disable-next-line react/no-array-index-key
                                                    <div key={idx}>{Array.isArray(err) ? err[0] : err}</div>
                                                ))}
                                            </div>
                                        ) : (
                                            <span className="tw-text-slate-300">Not a roll item</span>
                                        )
                                    )}
                                </td>
                                <td className="tw-align-top tw-p-3 tw-flex tw-flex-col tw-gap-2 tw-items-end">
                                    <button
                                        type="button"
                                        onClick={() => duplicateItem(item.tempId)}
                                        className="tw-inline-flex tw-items-center tw-justify-center tw-rounded-full tw-border tw-border-slate-200 tw-bg-white tw-px-2.5 tw-py-1.5 tw-text-xs tw-font-medium tw-text-slate-600 hover:tw-border-slate-400"
                                    >
                                        <Icon icon="solar:copy-bold-duotone" />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => removeItem(item.tempId)}
                                        className="tw-inline-flex tw-items-center tw-justify-center tw-rounded-full tw-border tw-border-rose-200 tw-bg-rose-50 tw-px-2.5 tw-py-1.5 tw-text-xs tw-font-medium tw-text-rose-600 hover:tw-border-rose-300"
                                    >
                                        <Icon icon="solar:trash-bin-minimalistic-bold-duotone" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {items.length === 0 && (
                            <tr>
                                <td colSpan={7} className="tw-text-center tw-text-sm tw-text-slate-500 tw-py-12">
                                    No items yet. Use &ldquo;Add product&rdquo; to build this order.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            <div className="tw-flex tw-flex-wrap tw-gap-3 tw-items-center tw-justify-between tw-border-t tw-border-slate-200 tw-pt-4">
                <button
                    type="button"
                    onClick={onPreview}
                    disabled={previewLoading}
                    className="tw-inline-flex tw-items-center tw-gap-2 tw-rounded-full tw-border tw-border-slate-300 tw-bg-white tw-px-4 tw-py-2 tw-text-xs tw-font-semibold tw-text-slate-600 hover:tw-border-slate-400 disabled:tw-opacity-60"
                >
                    <Icon icon="solar:chip-outline" className="tw-text-lg" />
                    {previewLoading ? 'Syncing…' : 'Sync with pricing engine'}
                </button>
                <div className="tw-text-sm tw-text-slate-500">
                    Subtotal&nbsp;
                    <span className="tw-font-semibold tw-text-slate-900">{money(subtotal)}</span>
                </div>
            </div>

            {drawerOpen && (
                <div className="tw-fixed tw-inset-0 tw-z-40">
                    <div className="tw-absolute tw-inset-0 tw-bg-slate-900/40" onClick={closeDrawer} aria-hidden="true" />
                    <aside className="tw-absolute tw-inset-y-0 tw-right-0 tw-w-full md:tw-w-[460px] tw-bg-white tw-shadow-2xl tw-flex tw-flex-col">
                        <div className="tw-p-5 tw-border-b tw-border-slate-200 tw-flex tw-items-center tw-justify-between">
                            <div>
                                <h3 className="tw-text-sm tw-font-semibold tw-text-slate-900">Add product</h3>
                                <p className="tw-text-xs tw-text-slate-500">Search catalogue to insert a new line item.</p>
                            </div>
                            <button
                                type="button"
                                onClick={closeDrawer}
                                className="tw-inline-flex tw-items-center tw-justify-center tw-rounded-full tw-border tw-border-slate-200 tw-bg-white tw-p-2"
                            >
                                <Icon icon="solar:close-circle-bold-duotone" className="tw-text-lg tw-text-slate-500" />
                            </button>
                        </div>
                        <div className="tw-p-5 tw-border-b tw-border-slate-200">
                            <input
                                type="text"
                                value={productQuery}
                                onChange={(e) => setProductQuery(e.target.value)}
                                placeholder="Search by product name"
                                className="tw-w-full tw-rounded-lg tw-border tw-border-slate-200 tw-bg-white tw-px-3 tw-py-2 tw-text-sm focus:tw-ring-2 focus:tw-ring-slate-500/30 focus:tw-border-slate-400"
                            />
                        </div>
                        <div className="tw-flex-1 tw-overflow-y-auto tw-p-5 tw-space-y-3">
                            {productLoading && (
                                <div className="tw-text-sm tw-text-slate-500">Searching…</div>
                            )}
                            {!productLoading && productResults.length === 0 && (
                                <div className="tw-text-sm tw-text-slate-500">
                                    Type at least two characters to search.
                                </div>
                            )}
                            {productResults.map((product) => (
                                <button
                                    key={product.id}
                                    type="button"
                                    onClick={() => addProduct(product)}
                                    className="tw-w-full tw-text-left tw-rounded-xl tw-border tw-border-slate-200 tw-bg-slate-50 hover:tw-border-slate-300 tw-px-4 tw-py-3 tw-space-y-1"
                                >
                                    <div className="tw-flex tw-items-center tw-gap-2">
                                        <span className="tw-text-sm tw-font-semibold tw-text-slate-900">{product.name}</span>
                                        <span className="tw-rounded-full tw-bg-slate-900/10 tw-text-slate-700 tw-text-[11px] tw-font-semibold tw-px-2 tw-py-0.5 tw-uppercase">
                                            {product.pricing_method}
                                        </span>
                                    </div>
                                    <div className="tw-flex tw-items-center tw-justify-between tw-text-xs tw-text-slate-500">
                                        <span>{product.working_group?.name || 'Unassigned group'}</span>
                                        <span>
                                            {product.pricing_method === 'roll'
                                                ? `${money(product.price_per_sqft)} / ft²`
                                                : money(product.price)}
                                        </span>
                                    </div>
                                </button>
                            ))}
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
