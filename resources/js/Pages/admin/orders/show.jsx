import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AdminDashboard from '@/Layouts/AdminDashboard';
import Breadcrumb from '@/Components/Breadcrumb';
import { Icon } from '@iconify/react';
import axios from 'axios';
import ItemEditor from './components/ItemEditor';
import SummarySidebar from './components/SummarySidebar';
import TimelinePanel from './components/TimelinePanel';

const money = (value) => {
    const amount = Number(value || 0);
    return `LKR ${amount.toLocaleString('en-LK', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })}`;
};

const statusPalette = {
    pending: 'tw-bg-amber-100 tw-text-amber-700',
    estimating: 'tw-bg-slate-100 tw-text-slate-700',
    quoted: 'tw-bg-sky-100 tw-text-sky-700',
    awaiting_approval: 'tw-bg-emerald-100 tw-text-emerald-700',
    confirmed: 'tw-bg-blue-100 tw-text-blue-700',
    production: 'tw-bg-purple-100 tw-text-purple-700',
    ready_for_dispatch: 'tw-bg-indigo-100 tw-text-indigo-700',
    shipped: 'tw-bg-cyan-100 tw-text-cyan-700',
    completed: 'tw-bg-emerald-200 tw-text-emerald-900',
    on_hold: 'tw-bg-orange-100 tw-text-orange-700',
    cancelled: 'tw-bg-rose-100 tw-text-rose-700',
};

const statusChip = (value) => statusPalette[value] || 'tw-bg-gray-100 tw-text-gray-700';
const makeTempId = () => crypto.randomUUID?.() || Math.random().toString(36).slice(2, 9);

const OrderShow = ({ order, timeline, statusOptions, workingGroups, shippingMethods, userDetails }) => {
    const [items, setItems] = useState([]);
    const [status, setStatus] = useState(order.status);
    const [statusNote, setStatusNote] = useState('');
    const [statusVisibility, setStatusVisibility] = useState('admin');
    const [workingGroupId, setWorkingGroupId] = useState(order.working_group_id || '');
    const [shippingMethodId, setShippingMethodId] = useState(order.shipping_method?.id || '');

    const [discountMode, setDiscountMode] = useState(order.discount_mode || 'none');
    const [discountValue, setDiscountValue] = useState(order.discount_value || 0);
    const [taxMode, setTaxMode] = useState(order.tax_mode || 'none');
    const [taxValue, setTaxValue] = useState(order.tax_value || 0);
    const [shippingAmount, setShippingAmount] = useState(order.shipping_amount || 0);

    const [notes, setNotes] = useState(order.notes || '');
    const [contact, setContact] = useState({
        first_name: order.contact_first_name || '',
        last_name: order.contact_last_name || '',
        email: order.contact_email || '',
        phone: order.contact_phone || '',
        whatsapp: order.contact_whatsapp || '',
        phone_alt_1: order.phone_alt_1 || '',
        phone_alt_2: order.phone_alt_2 || '',
    });
    const [companyName, setCompanyName] = useState(order.company_name || '');
    const [isCompany, setIsCompany] = useState(order.is_company || false);

    const [productDrawerOpen, setProductDrawerOpen] = useState(false);
    const [productQuery, setProductQuery] = useState('');
    const [productResults, setProductResults] = useState([]);
    const [productLoading, setProductLoading] = useState(false);

    const [rollCache, setRollCache] = useState({});
    const [errors, setErrors] = useState({});
    const [toast, setToast] = useState(null);
    const [saving, setSaving] = useState(false);
    const [previewLoading, setPreviewLoading] = useState(false);

    const [eventForm, setEventForm] = useState({
        event_type: 'note',
        title: '',
        message: '',
        visibility: 'admin',
    });
    const [eventSaving, setEventSaving] = useState(false);

    const initItemsFromOrder = useCallback((records) => (
        (records || []).map((item) => ({
            tempId: makeTempId(),
            product_id: item.product?.id || null,
            product: item.product || null,
            variant_id: item.variant?.id || null,
            subvariant_id: item.subvariant?.id || null,
            description: item.description || '',
            quantity: Number(item.quantity || 0),
            unit: item.unit || item.product?.unit_of_measure || 'unit',
            unit_price: Number(item.unit_price || 0),
            line_total: Number(item.line_total || 0),
            is_roll: !!item.is_roll,
            roll_id: item.roll_details?.roll?.id || item.roll_id || null,
            cut_width_in: item.roll_details?.cut_width_in ?? null,
            cut_height_in: item.roll_details?.cut_height_in ?? null,
            offcut_price_per_sqft: item.roll_details?.offcut_rate ?? item.offcut_price ?? null,
            options: item.options || null,
            roll_meta: item.roll_details
                ? {
                    fixedAreaFt2: item.roll_details.cut_width_ft && item.roll_details.cut_height_ft
                        ? Number((item.roll_details.cut_width_ft * item.roll_details.cut_height_ft).toFixed(3))
                        : 0,
                    offcutAreaFt2: item.roll_details.offcut_area_ft2 || 0,
                    offcutWidthIn: item.roll_details.offcut_width_in || 0,
                }
                : { fixedAreaFt2: 0, offcutAreaFt2: 0, offcutWidthIn: 0 },
        }))
    ), []);

    useEffect(() => {
        setItems(initItemsFromOrder(order.items || []));
        setStatus(order.status);
        setDiscountMode(order.discount_mode || 'none');
        setDiscountValue(order.discount_value || 0);
        setTaxMode(order.tax_mode || 'none');
        setTaxValue(order.tax_value || 0);
        setShippingAmount(order.shipping_amount || 0);
        setWorkingGroupId(order.working_group_id || '');
        setShippingMethodId(order.shipping_method?.id || '');
        setNotes(order.notes || '');
        setContact({
            first_name: order.contact_first_name || '',
            last_name: order.contact_last_name || '',
            email: order.contact_email || '',
            phone: order.contact_phone || '',
            whatsapp: order.contact_whatsapp || '',
            phone_alt_1: order.phone_alt_1 || '',
            phone_alt_2: order.phone_alt_2 || '',
        });
        setCompanyName(order.company_name || '');
        setIsCompany(order.is_company || false);
    }, [order, initItemsFromOrder]);

    const subtotal = useMemo(() => items.reduce((sum, item) => sum + Number(item.line_total || 0), 0), [items]);

    const discountAmount = useMemo(() => {
        if (discountMode === 'fixed') return Math.max(0, Number(discountValue || 0));
        if (discountMode === 'percent') {
            const pct = Math.max(0, Math.min(100, Number(discountValue || 0)));
            return Math.round((subtotal * pct) / 100 * 100) / 100;
        }
        return 0;
    }, [discountMode, discountValue, subtotal]);

    const taxAmount = useMemo(() => {
        if (taxMode === 'fixed') return Math.max(0, Number(taxValue || 0));
        if (taxMode === 'percent') {
            const pct = Math.max(0, Math.min(100, Number(taxValue || 0)));
            const base = Math.max(0, subtotal - discountAmount);
            return Math.round((base * pct) / 100 * 100) / 100;
        }
        return 0;
    }, [taxMode, taxValue, subtotal, discountAmount]);

    const grandTotal = useMemo(() => {
        const shipping = Math.max(0, Number(shippingAmount || 0));
        return Math.round((subtotal - discountAmount + taxAmount + shipping) * 100) / 100;
    }, [subtotal, discountAmount, taxAmount, shippingAmount]);

    const ensureRollOptions = useCallback(async (productId) => {
        if (rollCache[productId]) return rollCache[productId];
        try {
            const { data } = await axios.get(route('admin.product.rolls.get', productId));
            const rolls = data?.rolls || [];
            setRollCache((prev) => ({ ...prev, [productId]: rolls }));
            return rolls;
        } catch (error) {
            console.error('Failed to fetch roll options', error);
            return [];
        }
    }, [rollCache]);

    const recalcItem = useCallback((raw) => {
        const item = { ...raw };
        const quantity = Math.max(0, Number(item.quantity || 0));
        item.quantity = quantity;

        if (item.is_roll) {
            const rollList = rollCache[item.product_id] || [];
            const matchedRoll = rollList.find((roll) => roll.id === item.roll_id) || null;
            const rollWidthFt = matchedRoll?.roll_width ? Number(matchedRoll.roll_width) : null;
            const widthIn = Number(item.cut_width_in || 0);
            const heightIn = Number(item.cut_height_in || 0);
            const pricePerSqFt = Number(item.product?.price_per_sqft || 0);
            const offcutRate = Number(item.offcut_price_per_sqft ?? matchedRoll?.offcut_price ?? 0);

            if (widthIn > 0 && heightIn > 0 && rollWidthFt) {
                const widthFt = widthIn / 12;
                const heightFt = heightIn / 12;
                const fixedAreaFt2 = widthFt * heightFt;
                const rollWidthIn = rollWidthFt * 12;
                const offcutWidthIn = Math.max(rollWidthIn - widthIn, 0);
                const offcutAreaFt2 = (offcutWidthIn / 12) * heightFt;

                const unitPrice = (fixedAreaFt2 * pricePerSqFt) + (offcutAreaFt2 * offcutRate);
                item.unit_price = Math.round(unitPrice * 100) / 100;
                item.line_total = Math.round(item.unit_price * quantity * 100) / 100;
                item.roll_meta = {
                    fixedAreaFt2: Math.round(fixedAreaFt2 * 1000) / 1000,
                    offcutAreaFt2: Math.round(offcutAreaFt2 * 1000) / 1000,
                    offcutWidthIn: Math.round(offcutWidthIn * 1000) / 1000,
                };
            } else {
                item.unit_price = 0;
                item.line_total = 0;
                item.roll_meta = { fixedAreaFt2: 0, offcutAreaFt2: 0, offcutWidthIn: 0 };
            }
        } else {
            const unitPrice = Number(item.unit_price ?? item.product?.price ?? 0);
            item.unit_price = Math.round(unitPrice * 100) / 100;
            item.line_total = Math.round(item.unit_price * quantity * 100) / 100;
            item.roll_meta = { fixedAreaFt2: 0, offcutAreaFt2: 0, offcutWidthIn: 0 };
        }

        return item;
    }, [rollCache]);

    const updateItem = useCallback((tempId, changes) => {
        setItems((prev) => prev.map((item) => {
            if (item.tempId !== tempId) return item;
            return recalcItem({ ...item, ...changes });
        }));
    }, [recalcItem]);

    const removeItem = useCallback((tempId) => {
        setItems((prev) => prev.filter((item) => item.tempId !== tempId));
    }, []);

    const duplicateItem = useCallback((tempId) => {
        setItems((prev) => {
            const idx = prev.findIndex((item) => item.tempId === tempId);
            if (idx === -1) return prev;
            const clone = { ...prev[idx], tempId: makeTempId() };
            return [...prev.slice(0, idx + 1), clone, ...prev.slice(idx + 1)];
        });
    }, []);

    const addProduct = useCallback(async (product) => {
        const base = {
            tempId: makeTempId(),
            product_id: product.id,
            product,
            variant_id: null,
            subvariant_id: null,
            description: '',
            quantity: 1,
            unit: product.unit_of_measure || (product.pricing_method === 'roll' ? 'sq.ft' : 'unit'),
            unit_price: product.pricing_method === 'roll' ? 0 : Number(product.price || 0),
            line_total: 0,
            is_roll: product.pricing_method === 'roll',
            roll_id: null,
            cut_width_in: '',
            cut_height_in: '',
            offcut_price_per_sqft: product.pricing_method === 'roll' ? 0 : null,
            options: null,
            roll_meta: { fixedAreaFt2: 0, offcutAreaFt2: 0, offcutWidthIn: 0 },
        };

        let hydrated = base;
        if (product.pricing_method === 'roll') {
            const rolls = await ensureRollOptions(product.id);
            const defaultRoll = rolls.find((roll) => roll.pivot?.is_default) || rolls[0] || null;
            hydrated = {
                ...base,
                roll_id: defaultRoll?.id || null,
                offcut_price_per_sqft: defaultRoll?.offcut_price ?? base.offcut_price_per_sqft ?? 0,
            };
        }

        const computed = recalcItem(hydrated);
        setItems((prev) => [...prev, computed]);
        setProductDrawerOpen(false);
        setProductQuery('');
    }, [ensureRollOptions, recalcItem]);

    useEffect(() => {
        if (!productDrawerOpen) return;
        if (!productQuery || productQuery.trim().length < 2) {
            setProductResults([]);
            return;
        }

        const handle = setTimeout(async () => {
            try {
                setProductLoading(true);
                const { data } = await axios.get(route('admin.orders.products'), {
                    params: {
                        search: productQuery,
                        working_group_id: workingGroupId || undefined,
                    },
                });
                setProductResults(data.items || []);
            } catch (error) {
                console.error('Product search failed', error);
            } finally {
                setProductLoading(false);
            }
        }, 300);

        return () => clearTimeout(handle);
    }, [productDrawerOpen, productQuery, workingGroupId]);

    const previewWithServer = useCallback(async () => {
        try {
            setPreviewLoading(true);
            const payload = {
                discount_mode: discountMode,
                discount_value: discountValue,
                tax_mode: taxMode,
                tax_value: taxValue,
                shipping_amount: shippingAmount,
                items: items.map((item) => ({
                    product_id: item.product_id,
                    quantity: Number(item.quantity || 0),
                    unit: item.unit,
                    unit_price: item.is_roll ? null : Number(item.unit_price || 0),
                    is_roll: item.is_roll,
                    roll_id: item.is_roll ? item.roll_id : null,
                    cut_width_in: item.is_roll ? Number(item.cut_width_in || 0) : null,
                    cut_height_in: item.is_roll ? Number(item.cut_height_in || 0) : null,
                    offcut_price_per_sqft: item.is_roll ? Number(item.offcut_price_per_sqft || 0) : null,
                })),
            };

            const { data } = await axios.post(route('admin.orders.preview'), payload);
            setItems((prev) => prev.map((item, idx) => {
                const serverItem = data.items?.[idx];
                if (!serverItem) return item;
                return {
                    ...item,
                    unit_price: serverItem.unit_price,
                    line_total: serverItem.line_total,
                    roll_meta: serverItem.meta?.roll
                        ? {
                            fixedAreaFt2: serverItem.meta.roll.fixed_area_ft2 || 0,
                            offcutAreaFt2: serverItem.meta.roll.offcut_area_ft2 || 0,
                            offcutWidthIn: serverItem.meta.roll.offcut_width_in || 0,
                        }
                        : item.roll_meta,
                };
            }));
            setToast({ type: 'success', message: 'Pricing preview synced with server.' });
        } catch (error) {
            console.error('Preview failed', error);
            setToast({ type: 'error', message: 'Unable to preview pricing. Check inputs and retry.' });
        } finally {
            setPreviewLoading(false);
        }
    }, [items, discountMode, discountValue, taxMode, taxValue, shippingAmount]);

    const saveOrder = useCallback(async () => {
        setSaving(true);
        setErrors({});
        try {
            const payload = {
                status,
                status_note: statusNote || null,
                status_visibility: statusVisibility,
                working_group_id: workingGroupId || null,
                shipping_method_id: shippingMethodId || null,
                discount_mode: discountMode,
                discount_value: discountValue,
                tax_mode: taxMode,
                tax_value: taxValue,
                shipping_amount: shippingAmount,
                notes: notes || null,
                contact_first_name: contact.first_name,
                contact_last_name: contact.last_name,
                contact_email: contact.email,
                contact_phone: contact.phone,
                contact_whatsapp: contact.whatsapp,
                phone_alt_1: contact.phone_alt_1,
                phone_alt_2: contact.phone_alt_2,
                company_name: companyName,
                is_company: isCompany,
                items: items.map((item) => ({
                    product_id: item.product_id,
                    variant_id: item.variant_id,
                    subvariant_id: item.subvariant_id,
                    description: item.description,
                    quantity: Number(item.quantity || 0),
                    unit: item.unit,
                    unit_price: item.is_roll ? null : Number(item.unit_price || 0),
                    options: item.options,
                    is_roll: item.is_roll,
                    roll_id: item.is_roll ? item.roll_id : null,
                    cut_width_in: item.is_roll ? Number(item.cut_width_in || 0) : null,
                    cut_height_in: item.is_roll ? Number(item.cut_height_in || 0) : null,
                    offcut_price_per_sqft: item.is_roll ? Number(item.offcut_price_per_sqft || 0) : null,
                })),
            };

            await axios.put(route('admin.orders.update', order.id), payload);
            setToast({ type: 'success', message: 'Order saved successfully.' });
            router.reload({ only: ['order', 'timeline'] });
        } catch (error) {
            if (error.response?.status === 422) {
                setErrors(error.response.data.errors || {});
                setToast({ type: 'error', message: 'Validation failed. Please review highlighted fields.' });
            } else {
                setToast({ type: 'error', message: 'Failed to save order. Please try again.' });
            }
        } finally {
            setSaving(false);
        }
    }, [
        contact, companyName, discountMode, discountValue, isCompany, items, notes,
        order.id, shippingAmount, shippingMethodId, status, statusNote, statusVisibility,
        taxMode, taxValue, workingGroupId,
    ]);

    const submitEvent = useCallback(async () => {
        if (!eventForm.message?.trim()) {
            setToast({ type: 'error', message: 'Event message cannot be empty.' });
            return;
        }
        setEventSaving(true);
        try {
            await axios.post(route('admin.orders.events.store', order.id), eventForm);
            setEventForm({ event_type: 'note', title: '', message: '', visibility: 'admin' });
            setToast({ type: 'success', message: 'Event added to timeline.' });
            router.reload({ only: ['timeline'] });
        } catch (error) {
            if (error.response?.status === 422) {
                setToast({ type: 'error', message: 'Could not add event. Check the form.' });
            } else {
                setToast({ type: 'error', message: 'Failed to add event.' });
            }
        } finally {
            setEventSaving(false);
        }
    }, [eventForm, order.id]);

    useEffect(() => {
        if (!toast) return;
        const timer = setTimeout(() => setToast(null), 4000);
        return () => clearTimeout(timer);
    }, [toast]);

    const itemErrors = useMemo(() => {
        const map = {};
        Object.entries(errors).forEach(([key, value]) => {
            const match = key.match(/^items\.(\d+)\.(.+)$/);
            if (!match) return;
            const idx = Number(match[1]);
            map[idx] = map[idx] || [];
            map[idx].push(value);
        });
        return map;
    }, [errors]);

    const statusLabel = statusOptions.find((opt) => opt.value === order.status)?.label || order.status;

    return (
        <AdminDashboard userDetails={userDetails}>
            <Head title={`Order ${order.number}`} />
            <div className="tw-flex tw-flex-col lg:tw-flex-row tw-items-start lg:tw-items-center tw-justify-between tw-gap-4 tw-mb-6">
                <div className="tw-flex-1">
                    <Breadcrumb items={[
                        { label: 'Dashboard', href: route('admin.dashboard') },
                        { label: 'Orders', href: route('admin.orders.index') },
                        { label: order.number },
                    ]}/>
                    <div className="tw-flex tw-flex-col sm:tw-flex-row tw-items-start sm:tw-items-center tw-gap-3 tw-mt-3">
                        <div className="tw-flex tw-items-center tw-gap-3">
                            <div className="tw-w-12 tw-h-12 tw-rounded-xl tw-bg-gradient-to-br tw-from-blue-500 tw-to-blue-700 tw-flex tw-items-center tw-justify-center tw-shadow-lg">
                                <Icon icon="solar:document-text-bold" className="tw-text-white tw-text-2xl" />
                            </div>
                            <div>
                                <h1 className="tw-text-2xl tw-font-bold tw-text-slate-900">{order.number}</h1>
                                <p className="tw-text-xs tw-text-slate-500">Order ID: #{order.id}</p>
                            </div>
                        </div>
                        <span className={`tw-inline-flex tw-items-center tw-gap-1.5 tw-rounded-full tw-px-3 tw-py-1.5 tw-text-xs tw-font-bold tw-uppercase tw-tracking-wide ${statusChip(order.status)}`}>
                            <span className="tw-w-2 tw-h-2 tw-rounded-full tw-bg-current tw-animate-pulse"></span>
                            {statusLabel}
                        </span>
                        <span className="tw-text-xs tw-text-slate-500 tw-flex tw-items-center tw-gap-1.5 tw-bg-slate-50 tw-px-3 tw-py-1.5 tw-rounded-lg tw-border tw-border-slate-200">
                            <Icon icon="solar:calendar-bold-duotone" className="tw-text-sm tw-text-blue-500" />
                            Created {order.created_at ? new Date(order.created_at).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}
                        </span>
                    </div>
                </div>
                <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-3">
                    {order.estimate?.id && (
                        <Link
                            href={route('admin.estimates.edit', order.estimate.id)}
                            className="tw-inline-flex tw-items-center tw-gap-2 tw-rounded-lg tw-border-2 tw-border-purple-600 tw-bg-purple-50 tw-px-4 tw-py-2.5 tw-text-sm tw-font-bold tw-text-purple-700 hover:tw-bg-purple-100 tw-transition-all tw-shadow-md hover:tw-shadow-lg"
                        >
                            <Icon icon="solar:document-bold-duotone" className="tw-text-lg" />
                            Estimate {order.estimate.estimate_number}
                        </Link>
                    )}
                    <button
                        type="button"
                        onClick={saveOrder}
                        disabled={saving}
                        className="tw-inline-flex tw-items-center tw-gap-2 tw-rounded-lg tw-bg-gradient-to-r tw-from-blue-600 tw-to-blue-700 tw-text-white tw-px-6 tw-py-2.5 tw-text-sm tw-font-bold hover:tw-from-blue-700 hover:tw-to-blue-800 focus:tw-ring-2 focus:tw-ring-offset-2 focus:tw-ring-blue-500 disabled:tw-opacity-60 disabled:tw-cursor-not-allowed tw-transition-all tw-shadow-lg hover:tw-shadow-xl"
                    >
                        {saving ? (
                            <>
                                <Icon icon="svg-spinners:ring-resize" className="tw-text-xl" />
                                Saving...
                            </>
                        ) : (
                            <>
                                <Icon icon="solar:floppy-disk-bold-duotone" className="tw-text-xl" />
                                Save Order
                            </>
                        )}
                    </button>
                </div>
            </div>

            {toast && (
                <div
                    className={`tw-mb-6 tw-rounded-xl tw-border-2 tw-px-5 tw-py-4 tw-text-sm tw-font-semibold tw-flex tw-items-center tw-gap-3 tw-shadow-lg tw-animate-[slideDown_0.3s_ease-out] ${
                        toast.type === 'success'
                            ? 'tw-border-emerald-300 tw-bg-gradient-to-r tw-from-emerald-50 tw-to-emerald-100 tw-text-emerald-800'
                            : 'tw-border-rose-300 tw-bg-gradient-to-r tw-from-rose-50 tw-to-rose-100 tw-text-rose-800'
                    }`}
                >
                    <Icon 
                        icon={toast.type === 'success' ? 'solar:check-circle-bold' : 'solar:danger-circle-bold'} 
                        className={`tw-text-2xl ${toast.type === 'success' ? 'tw-text-emerald-600' : 'tw-text-rose-600'}`}
                    />
                    <span className="tw-flex-1">{toast.message}</span>
                    <button
                        onClick={() => setToast(null)}
                        className="tw-text-current hover:tw-opacity-70 tw-transition-opacity"
                    >
                        <Icon icon="solar:close-circle-bold" className="tw-text-xl" />
                    </button>
                </div>
            )}

            <div className="tw-grid tw-gap-6 xl:tw-grid-cols-3 tw-mb-10">
                <div className="xl:tw-col-span-2">
                    <ItemEditor
                        items={items}
                        updateItem={updateItem}
                        removeItem={removeItem}
                        duplicateItem={duplicateItem}
                        subtotal={subtotal}
                        previewLoading={previewLoading}
                        onPreview={previewWithServer}
                        openDrawer={() => setProductDrawerOpen(true)}
                        drawerOpen={productDrawerOpen}
                        closeDrawer={() => setProductDrawerOpen(false)}
                        productQuery={productQuery}
                        setProductQuery={setProductQuery}
                        productResults={productResults}
                        productLoading={productLoading}
                        addProduct={addProduct}
                        ensureRollOptions={ensureRollOptions}
                        rollCache={rollCache}
                        itemErrors={itemErrors}
                    />
                </div>
                <SummarySidebar
                    status={status}
                    setStatus={setStatus}
                    statusNote={statusNote}
                    setStatusNote={setStatusNote}
                    statusVisibility={statusVisibility}
                    setStatusVisibility={setStatusVisibility}
                    statusOptions={statusOptions}
                    workingGroupId={workingGroupId}
                    setWorkingGroupId={setWorkingGroupId}
                    workingGroups={workingGroups}
                    shippingMethodId={shippingMethodId}
                    setShippingMethodId={setShippingMethodId}
                    shippingMethods={shippingMethods}
                    discountMode={discountMode}
                    setDiscountMode={setDiscountMode}
                    discountValue={discountValue}
                    setDiscountValue={setDiscountValue}
                    discountAmount={discountAmount}
                    taxMode={taxMode}
                    setTaxMode={setTaxMode}
                    taxValue={taxValue}
                    setTaxValue={setTaxValue}
                    taxAmount={taxAmount}
                    shippingAmount={shippingAmount}
                    setShippingAmount={setShippingAmount}
                    subtotal={subtotal}
                    grandTotal={grandTotal}
                    notes={notes}
                    setNotes={setNotes}
                    contact={contact}
                    setContact={setContact}
                    companyName={companyName}
                    setCompanyName={setCompanyName}
                    isCompany={isCompany}
                    setIsCompany={setIsCompany}
                />
            </div>

            <TimelinePanel
                timeline={timeline}
                eventForm={eventForm}
                setEventForm={setEventForm}
                submitEvent={submitEvent}
                eventSaving={eventSaving}
            />
        </AdminDashboard>
    );
};

export default OrderShow;
