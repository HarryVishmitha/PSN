import Breadcrumb from '@/Components/Breadcrumb';
import AdminDashboard from '@/Layouts/AdminDashboard';
import { Icon } from '@iconify/react';
import { Head, Link, router } from '@inertiajs/react';
import axios from 'axios';
import { useCallback, useEffect, useMemo, useState } from 'react';
import ItemEditor from './components/ItemEditor';
import SummarySidebar from './components/SummarySidebar';
import TimelinePanel from './components/TimelinePanel';
import PaymentRequestPanel from './PaymentRequestPanel';

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
    awaiting_customer_approval: 'tw-bg-emerald-100 tw-text-emerald-700',
    confirmed: 'tw-bg-blue-100 tw-text-blue-700',
    production: 'tw-bg-purple-100 tw-text-purple-700',
    ready_for_dispatch: 'tw-bg-indigo-100 tw-text-indigo-700',
    shipped: 'tw-bg-cyan-100 tw-text-cyan-700',
    completed: 'tw-bg-emerald-200 tw-text-emerald-900',
    on_hold: 'tw-bg-orange-100 tw-text-orange-700',
    cancelled: 'tw-bg-rose-100 tw-text-rose-700',
};

const statusChip = (value) =>
    statusPalette[value] || 'tw-bg-gray-100 tw-text-gray-700';
const makeTempId = () =>
    crypto.randomUUID?.() || Math.random().toString(36).slice(2, 9);

const OrderShow = ({
    order,
    timeline,
    statusOptions,
    availableStatuses = {},
    workingGroups,
    shippingMethods,
    userDetails,
}) => {
    const [items, setItems] = useState([]);
    const [status, setStatus] = useState(order.status);
    const [statusNote, setStatusNote] = useState('');
    const [statusVisibility, setStatusVisibility] = useState('admin');
    const [cancellationReason, setCancellationReason] = useState(
        order.cancellation_reason || '',
    );
    const [showUnlockModal, setShowUnlockModal] = useState(false);
    const [unlockReason, setUnlockReason] = useState('');
    const [unlocking, setUnlocking] = useState(false);
    const [workingGroupId, setWorkingGroupId] = useState(
        order.working_group_id || '',
    );
    const [shippingMethodId, setShippingMethodId] = useState(
        order.shipping_method?.id || '',
    );

    const [discountMode, setDiscountMode] = useState(
        order.discount_mode || 'none',
    );
    const [discountValue, setDiscountValue] = useState(
        order.discount_value || 0,
    );
    const [taxMode, setTaxMode] = useState(order.tax_mode || 'none');
    const [taxValue, setTaxValue] = useState(order.tax_value || 0);
    const [shippingAmount, setShippingAmount] = useState(
        order.shipping_amount || 0,
    );

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

    const initItemsFromOrder = useCallback(
        (records) =>
            (records || []).map((item) => {
                // Determine if this is a roll item from either the is_roll flag or product pricing method
                const isRollItem =
                    !!item.is_roll || item.product?.pricing_method === 'roll';

                return {
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
                    is_roll: isRollItem,
                    roll_id:
                        item.roll_details?.roll?.id || item.roll_id || null,
                    cut_width_in:
                        item.roll_details?.cut_width_in ??
                        item.cut_width_in ??
                        null,
                    cut_height_in:
                        item.roll_details?.cut_height_in ??
                        item.cut_height_in ??
                        null,
                    offcut_price_per_sqft:
                        item.roll_details?.offcut_rate ??
                        item.offcut_price_per_sqft ??
                        item.offcut_price ??
                        item.roll_details?.roll?.offcut_price ??
                        null,
                    options: item.options || null,
                    roll_meta: item.roll_details
                        ? {
                              fixedAreaFt2:
                                  item.roll_details.cut_width_ft &&
                                  item.roll_details.cut_height_ft
                                      ? Number(
                                            (
                                                item.roll_details.cut_width_ft *
                                                item.roll_details.cut_height_ft
                                            ).toFixed(3),
                                        )
                                      : 0,
                              offcutAreaFt2: Number(
                                  item.roll_details.offcut_area_ft2 || 0,
                              ),
                              offcutWidthIn: Number(
                                  item.roll_details.offcut_width_in || 0,
                              ),
                          }
                        : {
                              fixedAreaFt2: 0,
                              offcutAreaFt2: 0,
                              offcutWidthIn: 0,
                          },
                };
            }),
        [],
    );

    const ensureRollOptions = useCallback(
        async (productId) => {
            if (rollCache[productId]) return rollCache[productId];
            try {
                const { data } = await axios.get(
                    route('admin.product.rolls.get', productId),
                );
                const rolls = data?.rolls || [];
                setRollCache((prev) => ({ ...prev, [productId]: rolls }));
                return rolls;
            } catch (error) {
                console.error('Failed to fetch roll options', error);
                return [];
            }
        },
        [rollCache],
    );

    useEffect(() => {
        const loadedItems = initItemsFromOrder(order.items || []);
        setItems(loadedItems);

        setStatus(order.status);
        setStatusNote(''); // Reset status note on order reload
        setStatusVisibility('admin');
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

    // Separate effect to load roll options for roll items
    useEffect(() => {
        items.forEach((item) => {
            if (
                item.is_roll &&
                item.product_id &&
                !rollCache[item.product_id]
            ) {
                ensureRollOptions(item.product_id);
            }
        });
    }, [items, rollCache, ensureRollOptions]);

    const subtotal = useMemo(
        () =>
            items.reduce((sum, item) => sum + Number(item.line_total || 0), 0),
        [items],
    );

    const discountAmount = useMemo(() => {
        if (discountMode === 'fixed')
            return Math.max(0, Number(discountValue || 0));
        if (discountMode === 'percent') {
            const pct = Math.max(0, Math.min(100, Number(discountValue || 0)));
            return Math.round(((subtotal * pct) / 100) * 100) / 100;
        }
        return 0;
    }, [discountMode, discountValue, subtotal]);

    const taxAmount = useMemo(() => {
        if (taxMode === 'fixed') return Math.max(0, Number(taxValue || 0));
        if (taxMode === 'percent') {
            const pct = Math.max(0, Math.min(100, Number(taxValue || 0)));
            const base = Math.max(0, subtotal - discountAmount);
            return Math.round(((base * pct) / 100) * 100) / 100;
        }
        return 0;
    }, [taxMode, taxValue, subtotal, discountAmount]);

    const grandTotal = useMemo(() => {
        const shipping = Math.max(0, Number(shippingAmount || 0));
        return (
            Math.round(
                (subtotal - discountAmount + taxAmount + shipping) * 100,
            ) / 100
        );
    }, [subtotal, discountAmount, taxAmount, shippingAmount]);

    const recalcItem = useCallback(
        (raw) => {
            const item = { ...raw };
            const quantity = Math.max(0, Number(item.quantity || 0));
            item.quantity = quantity;

            if (item.is_roll) {
                const rollList = rollCache[item.product_id] || [];
                const matchedRoll =
                    rollList.find((roll) => roll.id === item.roll_id) || null;
                const rollWidthFt = matchedRoll?.roll_width
                    ? Number(matchedRoll.roll_width)
                    : null;
                const widthIn = Number(item.cut_width_in || 0);
                const heightIn = Number(item.cut_height_in || 0);
                const pricePerSqFt = Number(item.product?.price_per_sqft || 0);
                const offcutRate = Number(
                    item.offcut_price_per_sqft ??
                        matchedRoll?.offcut_price ??
                        0,
                );

                if (widthIn > 0 && heightIn > 0 && rollWidthFt) {
                    const widthFt = widthIn / 12;
                    const heightFt = heightIn / 12;
                    const fixedAreaFt2 = widthFt * heightFt;
                    const rollWidthIn = rollWidthFt * 12;
                    const offcutWidthIn = Math.max(rollWidthIn - widthIn, 0);
                    const offcutAreaFt2 = (offcutWidthIn / 12) * heightFt;

                    const unitPrice =
                        fixedAreaFt2 * pricePerSqFt +
                        offcutAreaFt2 * offcutRate;
                    item.unit_price = Math.round(unitPrice * 100) / 100;
                    item.line_total =
                        Math.round(item.unit_price * quantity * 100) / 100;
                    item.roll_meta = {
                        fixedAreaFt2: Math.round(fixedAreaFt2 * 1000) / 1000,
                        offcutAreaFt2: Math.round(offcutAreaFt2 * 1000) / 1000,
                        offcutWidthIn: Math.round(offcutWidthIn * 1000) / 1000,
                    };
                } else {
                    item.unit_price = 0;
                    item.line_total = 0;
                    item.roll_meta = {
                        fixedAreaFt2: 0,
                        offcutAreaFt2: 0,
                        offcutWidthIn: 0,
                    };
                }
            } else {
                const unitPrice = Number(
                    item.unit_price ?? item.product?.price ?? 0,
                );
                item.unit_price = Math.round(unitPrice * 100) / 100;
                item.line_total =
                    Math.round(item.unit_price * quantity * 100) / 100;
                item.roll_meta = {
                    fixedAreaFt2: 0,
                    offcutAreaFt2: 0,
                    offcutWidthIn: 0,
                };
            }

            return item;
        },
        [rollCache],
    );

    const updateItem = useCallback(
        (tempId, changes) => {
            setItems((prev) =>
                prev.map((item) => {
                    if (item.tempId !== tempId) return item;
                    return recalcItem({ ...item, ...changes });
                }),
            );
        },
        [recalcItem],
    );

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

    const addProduct = useCallback(
        async (product) => {
            const base = {
                tempId: makeTempId(),
                product_id: product.id,
                product,
                variant_id: null,
                subvariant_id: null,
                description: '',
                quantity: 1,
                unit:
                    product.unit_of_measure ||
                    (product.pricing_method === 'roll' ? 'sq.ft' : 'unit'),
                unit_price:
                    product.pricing_method === 'roll'
                        ? 0
                        : Number(product.price || 0),
                line_total: 0,
                is_roll: product.pricing_method === 'roll',
                roll_id: null,
                cut_width_in: '',
                cut_height_in: '',
                offcut_price_per_sqft:
                    product.pricing_method === 'roll' ? 0 : null,
                options: null,
                roll_meta: {
                    fixedAreaFt2: 0,
                    offcutAreaFt2: 0,
                    offcutWidthIn: 0,
                },
            };

            let hydrated = base;
            if (product.pricing_method === 'roll') {
                const rolls = await ensureRollOptions(product.id);
                const defaultRoll =
                    rolls.find((roll) => roll.pivot?.is_default) ||
                    rolls[0] ||
                    null;
                hydrated = {
                    ...base,
                    roll_id: defaultRoll?.id || null,
                    offcut_price_per_sqft:
                        defaultRoll?.offcut_price ??
                        base.offcut_price_per_sqft ??
                        0,
                };
            }

            const computed = recalcItem(hydrated);
            setItems((prev) => [...prev, computed]);
            setProductDrawerOpen(false);
            setProductQuery('');
        },
        [ensureRollOptions, recalcItem],
    );

    useEffect(() => {
        if (!productDrawerOpen) return;
        if (!productQuery || productQuery.trim().length < 2) {
            setProductResults([]);
            return;
        }

        const handle = setTimeout(async () => {
            try {
                setProductLoading(true);
                const { data } = await axios.get(
                    route('admin.orders.products'),
                    {
                        params: {
                            search: productQuery,
                            working_group_id: workingGroupId || undefined,
                        },
                    },
                );
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
        if (items.length === 0) {
            setToast({
                type: 'error',
                message: 'Please add at least one item before syncing pricing.',
            });
            return;
        }

        try {
            setPreviewLoading(true);
            setErrors({});

            const payload = {
                discount_mode: discountMode,
                discount_value: Number(discountValue || 0),
                tax_mode: taxMode,
                tax_value: Number(taxValue || 0),
                shipping_amount: Number(shippingAmount || 0),
                items: items.map((item) => ({
                    product_id: item.product_id,
                    quantity: Number(item.quantity || 0),
                    unit: item.unit || 'unit',
                    unit_price: item.is_roll
                        ? null
                        : Number(item.unit_price || 0),
                    is_roll: !!item.is_roll,
                    roll_id: item.is_roll ? item.roll_id || null : null,
                    cut_width_in: item.is_roll
                        ? Number(item.cut_width_in || 0)
                        : null,
                    cut_height_in: item.is_roll
                        ? Number(item.cut_height_in || 0)
                        : null,
                    offcut_price_per_sqft: item.is_roll
                        ? Number(item.offcut_price_per_sqft || 0)
                        : null,
                })),
            };

            const { data } = await axios.post(
                route('admin.orders.preview'),
                payload,
            );

            // Update items with server-calculated values
            setItems((prev) =>
                prev.map((item, idx) => {
                    const serverItem = data.items?.[idx];
                    if (!serverItem) return item;

                    return {
                        ...item,
                        unit_price: Number(serverItem.unit_price || 0),
                        line_total: Number(serverItem.line_total || 0),
                        roll_meta:
                            serverItem.is_roll && serverItem.roll_details
                                ? {
                                      fixedAreaFt2: Number(
                                          serverItem.roll_details.cut_width_ft *
                                              serverItem.roll_details
                                                  .cut_height_ft || 0,
                                      ).toFixed(3),
                                      offcutAreaFt2: Number(
                                          serverItem.roll_details
                                              .offcut_area_ft2 || 0,
                                      ).toFixed(3),
                                      offcutWidthIn: Number(
                                          serverItem.roll_details
                                              .offcut_width_in || 0,
                                      ).toFixed(3),
                                  }
                                : item.roll_meta,
                    };
                }),
            );

            setToast({
                type: 'success',
                message: 'Pricing successfully synced with server engine.',
            });
        } catch (error) {
            console.error('Preview failed', error);

            if (error.response?.status === 422) {
                setErrors(error.response.data.errors || {});
                setToast({
                    type: 'error',
                    message:
                        'Validation errors found. Please check item details.',
                });
            } else {
                setToast({
                    type: 'error',
                    message:
                        error.response?.data?.message ||
                        'Unable to sync pricing. Please check inputs and try again.',
                });
            }
        } finally {
            setPreviewLoading(false);
        }
    }, [items, discountMode, discountValue, taxMode, taxValue, shippingAmount]);

    const saveOrder = useCallback(async () => {
        if (items.length === 0) {
            setToast({
                type: 'error',
                message: 'Order must have at least one item.',
            });
            return;
        }

        setSaving(true);
        setErrors({});

        try {
            const payload = {
                status,
                status_note: statusNote?.trim() || null,
                status_visibility: statusVisibility || 'admin',
                cancellation_reason:
                    status === 'cancelled'
                        ? cancellationReason?.trim() || null
                        : null,
                working_group_id: workingGroupId || null,
                shipping_method_id: shippingMethodId || null,
                discount_mode: discountMode,
                discount_value: Number(discountValue || 0),
                tax_mode: taxMode,
                tax_value: Number(taxValue || 0),
                shipping_amount: Number(shippingAmount || 0),
                notes: notes?.trim() || null,
                contact_first_name: contact.first_name?.trim() || null,
                contact_last_name: contact.last_name?.trim() || null,
                contact_email: contact.email?.trim() || null,
                contact_phone: contact.phone?.trim() || null,
                contact_whatsapp: contact.whatsapp?.trim() || null,
                phone_alt_1: contact.phone_alt_1?.trim() || null,
                phone_alt_2: contact.phone_alt_2?.trim() || null,
                company_name: companyName?.trim() || null,
                is_company: !!isCompany,
                items: items.map((item) => ({
                    product_id: item.product_id,
                    variant_id: item.variant_id || null,
                    subvariant_id: item.subvariant_id || null,
                    description: item.description?.trim() || null,
                    quantity: Number(item.quantity || 0),
                    unit: item.unit || 'unit',
                    unit_price: item.is_roll
                        ? null
                        : Number(item.unit_price || 0),
                    options: item.options || null,
                    is_roll: !!item.is_roll,
                    roll_id: item.is_roll ? item.roll_id || null : null,
                    cut_width_in: item.is_roll
                        ? Number(item.cut_width_in || 0)
                        : null,
                    cut_height_in: item.is_roll
                        ? Number(item.cut_height_in || 0)
                        : null,
                    offcut_price_per_sqft: item.is_roll
                        ? Number(item.offcut_price_per_sqft || 0)
                        : null,
                })),
            };

            await axios.put(route('admin.orders.update', order.id), payload);

            // Clear status note after successful save
            setStatusNote('');

            setToast({
                type: 'success',
                message: 'Order saved successfully! Changes have been applied.',
            });

            // Reload only the order and timeline data
            router.reload({ only: ['order', 'timeline', 'availableStatuses'] });
        } catch (error) {
            console.error('Save order failed', error);

            if (error.response?.status === 422) {
                const validationErrors = error.response.data.errors || {};
                setErrors(validationErrors);

                // Show which fields have errors
                const errorFields = Object.keys(validationErrors).join(', ');
                setToast({
                    type: 'error',
                    message: `Validation failed: ${errorFields}. Please check the highlighted fields.`,
                });
            } else {
                setToast({
                    type: 'error',
                    message:
                        error.response?.data?.message ||
                        'Failed to save order. Please try again.',
                });
            }
        } finally {
            setSaving(false);
        }
    }, [
        cancellationReason,
        contact,
        companyName,
        discountMode,
        discountValue,
        isCompany,
        items,
        notes,
        order.id,
        shippingAmount,
        shippingMethodId,
        status,
        statusNote,
        statusVisibility,
        taxMode,
        taxValue,
        workingGroupId,
    ]);

    const unlockOrder = useCallback(async () => {
        if (!unlockReason.trim() || unlockReason.trim().length < 10) {
            setToast({
                type: 'error',
                message: 'Unlock reason must be at least 10 characters.',
            });
            return;
        }

        setUnlocking(true);
        try {
            await axios.post(route('admin.orders.unlock', order.id), {
                reason: unlockReason.trim(),
            });

            setToast({
                type: 'success',
                message: 'Order unlocked successfully!',
            });
            setShowUnlockModal(false);
            setUnlockReason('');

            // Reload order data
            router.reload({ only: ['order', 'timeline'] });
        } catch (error) {
            setToast({
                type: 'error',
                message:
                    error.response?.data?.message || 'Failed to unlock order.',
            });
        } finally {
            setUnlocking(false);
        }
    }, [unlockReason, order.id]);

    const submitEvent = useCallback(async () => {
        if (!eventForm.message?.trim()) {
            setToast({
                type: 'error',
                message: 'Event message cannot be empty.',
            });
            return;
        }
        setEventSaving(true);
        try {
            await axios.post(
                route('admin.orders.events.store', order.id),
                eventForm,
            );
            setEventForm({
                event_type: 'note',
                title: '',
                message: '',
                visibility: 'admin',
            });
            setToast({ type: 'success', message: 'Event added to timeline.' });
            router.reload({ only: ['timeline'] });
        } catch (error) {
            if (error.response?.status === 422) {
                setToast({
                    type: 'error',
                    message: 'Could not add event. Check the form.',
                });
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

    const statusLabel =
        statusOptions.find((opt) => opt.value === order.status)?.label ||
        order.status;

    return (
        <AdminDashboard userDetails={userDetails}>
            <Head title={`Order ${order.number}`} />
            {console.log('Rendering OrderShow for order:', order)}
            {/* Enhanced Header with Gradient Background */}
            <div className="tw-mb-8 tw-rounded-2xl tw-border tw-border-slate-200/50 tw-bg-gradient-to-br tw-from-slate-50 tw-via-blue-50 tw-to-purple-50 tw-p-6 tw-shadow-lg">
                <div className="tw-mb-4">
                    <Breadcrumb
                        title={`Order ${order.number}`}
                        items={[
                            {
                                label: 'Dashboard',
                                href: route('admin.dashboard'),
                            },
                            {
                                label: 'Orders',
                                href: route('admin.orders.index'),
                            },
                            { label: order.number },
                        ]}
                    />
                </div>

                <div className="tw-flex tw-flex-col tw-gap-6 lg:tw-flex-row lg:tw-items-start lg:tw-justify-between">
                    <div className="tw-flex tw-flex-1 tw-flex-col tw-gap-4">
                        <div className="tw-flex tw-items-center tw-gap-4">
                            <div className="tw-relative tw-flex tw-h-16 tw-w-16 tw-items-center tw-justify-center tw-rounded-2xl tw-bg-gradient-to-br tw-from-blue-500 tw-via-blue-600 tw-to-purple-600 tw-shadow-xl">
                                <Icon
                                    icon="solar:document-text-bold"
                                    className="tw-text-3xl tw-text-white"
                                />
                                <div className="tw-absolute -tw-right-1 -tw-top-1 tw-h-5 tw-w-5 tw-rounded-full tw-bg-emerald-400 tw-ring-4 tw-ring-white"></div>
                            </div>
                            <div>
                                <h3 className="tw-text-3xl tw-font-extrabold tw-tracking-tight tw-text-slate-900">
                                    {order.number}
                                </h3>
                                <p className="tw-mt-0.5 tw-text-sm tw-text-slate-600">
                                    Order ID:{' '}
                                    <span className="tw-font-semibold">
                                        #{order.id}
                                    </span>
                                </p>
                            </div>
                        </div>

                        <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-3">
                            <span
                                className={`tw-inline-flex tw-items-center tw-gap-2 tw-rounded-xl tw-px-4 tw-py-2 tw-text-sm tw-font-bold tw-uppercase tw-tracking-wide tw-shadow-md ${statusChip(order.status)}`}
                            >
                                <span className="tw-h-2.5 tw-w-2.5 tw-animate-pulse tw-rounded-full tw-bg-current tw-shadow-lg"></span>
                                {statusLabel}
                            </span>

                            <span className="tw-flex tw-items-center tw-gap-2 tw-rounded-xl tw-border-2 tw-border-slate-200 tw-bg-white tw-px-4 tw-py-2 tw-text-sm tw-text-slate-700 tw-shadow-sm">
                                <Icon
                                    icon="solar:calendar-bold-duotone"
                                    className="tw-text-lg tw-text-blue-500"
                                />
                                <span className="tw-font-semibold">
                                    {order.created_at
                                        ? new Date(
                                              order.created_at,
                                          ).toLocaleString('en-GB', {
                                              day: '2-digit',
                                              month: 'short',
                                              year: 'numeric',
                                              hour: '2-digit',
                                              minute: '2-digit',
                                          })
                                        : '—'}
                                </span>
                            </span>

                            {order.updated_at && (
                                <span className="tw-flex tw-items-center tw-gap-2 tw-rounded-xl tw-border-2 tw-border-slate-200 tw-bg-white tw-px-4 tw-py-2 tw-text-sm tw-text-slate-700 tw-shadow-sm">
                                    <Icon
                                        icon="solar:refresh-circle-bold-duotone"
                                        className="tw-text-lg tw-text-purple-500"
                                    />
                                    <span className="tw-text-xs tw-text-slate-500">
                                        Updated
                                    </span>
                                    <span className="tw-font-semibold">
                                        {new Date(
                                            order.updated_at,
                                        ).toLocaleString('en-GB', {
                                            day: '2-digit',
                                            month: 'short',
                                            hour: '2-digit',
                                            minute: '2-digit',
                                        })}
                                    </span>
                                </span>
                            )}
                        </div>
                    </div>

                    <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-3">
                        {order.estimate?.id && (
                            <Link
                                href={route(
                                    'admin.estimates.edit',
                                    order.estimate.id,
                                )}
                                className="tw-group tw-relative tw-inline-flex tw-items-center tw-gap-2.5 tw-overflow-hidden tw-rounded-xl tw-border-2 tw-border-purple-600 tw-bg-gradient-to-br tw-from-purple-50 tw-to-purple-100 tw-px-5 tw-py-3 tw-text-sm tw-font-bold tw-text-purple-700 tw-shadow-lg tw-transition-all hover:tw-scale-105 hover:tw-shadow-xl"
                            >
                                <Icon
                                    icon="solar:document-bold-duotone"
                                    className="tw-text-xl tw-transition-transform group-hover:tw-rotate-12"
                                />
                                <div className="tw-flex tw-flex-col tw-items-start">
                                    <span className="tw-text-xs tw-font-medium tw-text-purple-600">
                                        View Estimate
                                    </span>
                                    <span className="tw-text-sm tw-font-bold">
                                        {order.estimate.estimate_number}
                                    </span>
                                </div>
                            </Link>
                        )}

                        <button
                            type="button"
                            onClick={saveOrder}
                            disabled={saving}
                            className="tw-group tw-relative tw-inline-flex tw-items-center tw-gap-2.5 tw-overflow-hidden tw-rounded-xl tw-bg-gradient-to-r tw-from-blue-600 tw-via-blue-700 tw-to-purple-600 tw-px-6 tw-py-3 tw-text-sm tw-font-bold tw-text-white tw-shadow-xl tw-transition-all hover:tw-scale-105 hover:tw-shadow-2xl focus:tw-ring-4 focus:tw-ring-blue-500/50 focus:tw-ring-offset-2 disabled:tw-cursor-not-allowed disabled:tw-opacity-60 disabled:hover:tw-scale-100"
                        >
                            {saving ? (
                                <>
                                    <Icon
                                        icon="svg-spinners:ring-resize"
                                        className="tw-text-xl"
                                    />
                                    <span>Saving Changes...</span>
                                </>
                            ) : (
                                <>
                                    <Icon
                                        icon="solar:floppy-disk-bold-duotone"
                                        className="tw-text-xl tw-transition-transform group-hover:tw-scale-110"
                                    />
                                    <span>Save Order</span>
                                </>
                            )}
                            <div className="tw-absolute tw-inset-0 tw--z-10 tw-bg-gradient-to-r tw-from-blue-700 tw-via-purple-700 tw-to-blue-700 tw-opacity-0 tw-transition-opacity group-hover:tw-opacity-100"></div>
                        </button>

                        <button
                            type="button"
                            onClick={() => window.print()}
                            className="tw-group tw-inline-flex tw-items-center tw-gap-2 tw-rounded-xl tw-border-2 tw-border-slate-300 tw-bg-white tw-px-4 tw-py-3 tw-text-sm tw-font-semibold tw-text-slate-700 tw-shadow-md tw-transition-all hover:tw-scale-105 hover:tw-border-slate-400 hover:tw-shadow-lg"
                        >
                            <Icon
                                icon="solar:printer-bold-duotone"
                                className="tw-text-xl tw-text-slate-600 tw-transition-transform group-hover:tw-scale-110"
                            />
                            Print
                        </button>
                    </div>
                </div>
            </div>

            {/* Enhanced Toast Notification */}
            {toast && (
                <div
                    className={`tw-mb-6 tw-flex tw-animate-[slideDown_0.3s_ease-out] tw-items-start tw-gap-4 tw-rounded-2xl tw-border-2 tw-px-6 tw-py-5 tw-text-sm tw-font-semibold tw-shadow-2xl tw-backdrop-blur-sm ${
                        toast.type === 'success'
                            ? 'tw-border-emerald-400 tw-bg-gradient-to-br tw-from-emerald-50 tw-via-emerald-100 tw-to-teal-50 tw-text-emerald-900'
                            : 'tw-border-rose-400 tw-bg-gradient-to-br tw-from-rose-50 tw-via-rose-100 tw-to-orange-50 tw-text-rose-900'
                    }`}
                >
                    <div
                        className={`tw-flex tw-h-10 tw-w-10 tw-flex-shrink-0 tw-items-center tw-justify-center tw-rounded-xl ${
                            toast.type === 'success'
                                ? 'tw-bg-emerald-500 tw-shadow-lg tw-shadow-emerald-500/50'
                                : 'tw-bg-rose-500 tw-shadow-lg tw-shadow-rose-500/50'
                        }`}
                    >
                        <Icon
                            icon={
                                toast.type === 'success'
                                    ? 'solar:check-circle-bold'
                                    : 'solar:danger-circle-bold'
                            }
                            className="tw-text-2xl tw-text-white"
                        />
                    </div>
                    <div className="tw-flex-1 tw-pt-1">
                        <h4 className="tw-mb-1 tw-text-sm tw-font-bold">
                            {toast.type === 'success' ? 'Success!' : 'Error'}
                        </h4>
                        <p className="tw-text-sm tw-font-medium tw-opacity-90">
                            {toast.message}
                        </p>
                    </div>
                    <button
                        onClick={() => setToast(null)}
                        className="tw-flex-shrink-0 tw-rounded-lg tw-p-1.5 tw-text-current tw-transition-all hover:tw-bg-black/10"
                    >
                        <Icon
                            icon="solar:close-circle-bold"
                            className="tw-text-2xl"
                        />
                    </button>
                </div>
            )}

            {/* Helpful Reminder Banner */}
            {(status !== order.status || statusNote) && (
                <div className="tw-mb-6 tw-flex tw-animate-[slideDown_0.3s_ease-out] tw-items-start tw-gap-4 tw-rounded-2xl tw-border-2 tw-border-blue-400 tw-bg-gradient-to-br tw-from-blue-50 tw-via-blue-100 tw-to-purple-50 tw-px-6 tw-py-5 tw-shadow-xl">
                    <div className="tw-flex tw-h-10 tw-w-10 tw-flex-shrink-0 tw-items-center tw-justify-center tw-rounded-xl tw-bg-blue-500 tw-shadow-lg tw-shadow-blue-500/50">
                        <Icon
                            icon="solar:info-circle-bold"
                            className="tw-text-2xl tw-text-white"
                        />
                    </div>
                    <div className="tw-flex-1 tw-pt-1">
                        <h4 className="tw-mb-1 tw-text-sm tw-font-bold tw-text-blue-900">
                            Unsaved Changes
                        </h4>
                        <p className="tw-text-sm tw-font-medium tw-text-blue-800">
                            {status !== order.status
                                ? `Status changed to "${statusOptions.find((opt) => opt.value === status)?.label}". `
                                : ''}
                            Click the "Save Order" button to apply your changes.
                        </p>
                    </div>
                </div>
            )}

            {/* Quick Stats Bar */}
            <div className="tw-mb-8 tw-grid tw-grid-cols-1 tw-gap-4 sm:tw-grid-cols-2 lg:tw-grid-cols-4">
                <div className="tw-group tw-relative tw-overflow-hidden tw-rounded-xl tw-border tw-border-blue-200 tw-bg-gradient-to-br tw-from-blue-50 tw-to-blue-100 tw-p-5 tw-shadow-md tw-transition-all hover:tw-shadow-xl">
                    <div className="tw-absolute -tw-right-4 -tw-top-4 tw-h-24 tw-w-24 tw-rounded-full tw-bg-blue-200/40 tw-blur-2xl"></div>
                    <div className="tw-relative">
                        <div className="tw-mb-2 tw-flex tw-items-center tw-justify-between">
                            <Icon
                                icon="solar:wallet-money-bold-duotone"
                                className="tw-text-3xl tw-text-blue-600"
                            />
                            <span className="tw-rounded-full tw-bg-blue-600 tw-px-2 tw-py-0.5 tw-text-xs tw-font-bold tw-text-white">
                                Total
                            </span>
                        </div>
                        <h3 className="tw-text-2xl tw-font-extrabold tw-text-blue-900">
                            {money(grandTotal)}
                        </h3>
                        <p className="tw-mt-1 tw-text-xs tw-font-medium tw-text-blue-700">
                            Order Value
                        </p>
                    </div>
                </div>

                <div className="tw-group tw-relative tw-overflow-hidden tw-rounded-xl tw-border tw-border-purple-200 tw-bg-gradient-to-br tw-from-purple-50 tw-to-purple-100 tw-p-5 tw-shadow-md tw-transition-all hover:tw-shadow-xl">
                    <div className="tw-absolute -tw-right-4 -tw-top-4 tw-h-24 tw-w-24 tw-rounded-full tw-bg-purple-200/40 tw-blur-2xl"></div>
                    <div className="tw-relative">
                        <div className="tw-mb-2 tw-flex tw-items-center tw-justify-between">
                            <Icon
                                icon="solar:box-minimalistic-bold-duotone"
                                className="tw-text-3xl tw-text-purple-600"
                            />
                            <span className="tw-rounded-full tw-bg-purple-600 tw-px-2 tw-py-0.5 tw-text-xs tw-font-bold tw-text-white">
                                Items
                            </span>
                        </div>
                        <h3 className="tw-text-2xl tw-font-extrabold tw-text-purple-900">
                            {items.length}
                        </h3>
                        <p className="tw-mt-1 tw-text-xs tw-font-medium tw-text-purple-700">
                            Line Items
                        </p>
                    </div>
                </div>

                <div className="tw-group tw-relative tw-overflow-hidden tw-rounded-xl tw-border tw-border-emerald-200 tw-bg-gradient-to-br tw-from-emerald-50 tw-to-emerald-100 tw-p-5 tw-shadow-md tw-transition-all hover:tw-shadow-xl">
                    <div className="tw-absolute -tw-right-4 -tw-top-4 tw-h-24 tw-w-24 tw-rounded-full tw-bg-emerald-200/40 tw-blur-2xl"></div>
                    <div className="tw-relative">
                        <div className="tw-mb-2 tw-flex tw-items-center tw-justify-between">
                            <Icon
                                icon="solar:tag-price-bold-duotone"
                                className="tw-text-3xl tw-text-emerald-600"
                            />
                            <span className="tw-rounded-full tw-bg-emerald-600 tw-px-2 tw-py-0.5 tw-text-xs tw-font-bold tw-text-white">
                                Discount
                            </span>
                        </div>
                        <h3 className="tw-text-2xl tw-font-extrabold tw-text-emerald-900">
                            {money(discountAmount)}
                        </h3>
                        <p className="tw-mt-1 tw-text-xs tw-font-medium tw-text-emerald-700">
                            Savings Applied
                        </p>
                    </div>
                </div>

                <div className="tw-group tw-relative tw-overflow-hidden tw-rounded-xl tw-border tw-border-amber-200 tw-bg-gradient-to-br tw-from-amber-50 tw-to-amber-100 tw-p-5 tw-shadow-md tw-transition-all hover:tw-shadow-xl">
                    <div className="tw-absolute -tw-right-4 -tw-top-4 tw-h-24 tw-w-24 tw-rounded-full tw-bg-amber-200/40 tw-blur-2xl"></div>
                    <div className="tw-relative">
                        <div className="tw-mb-2 tw-flex tw-items-center tw-justify-between">
                            <Icon
                                icon="solar:clock-circle-bold-duotone"
                                className="tw-text-3xl tw-text-amber-600"
                            />
                            <span className="tw-rounded-full tw-bg-amber-600 tw-px-2 tw-py-0.5 tw-text-xs tw-font-bold tw-text-white">
                                Events
                            </span>
                        </div>
                        <h3 className="tw-text-2xl tw-font-extrabold tw-text-amber-900">
                            {timeline.length}
                        </h3>
                        <p className="tw-mt-1 tw-text-xs tw-font-medium tw-text-amber-700">
                            Timeline Entries
                        </p>
                    </div>
                </div>
            </div>

            <div className="tw-mb-10 tw-grid tw-gap-6 xl:tw-grid-cols-3">
                <div className="xl:tw-col-span-2">
                    <ItemEditor
                        order={order}
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
                        unlockOrder={unlockOrder}
                        showUnlockModal={showUnlockModal}
                        setShowUnlockModal={setShowUnlockModal}
                        unlockReason={unlockReason}
                        setUnlockReason={setUnlockReason}
                        unlocking={unlocking}
                    />
                </div>
                <SummarySidebar
                    order={order}
                    status={status}
                    setStatus={setStatus}
                    statusNote={statusNote}
                    setStatusNote={setStatusNote}
                    statusVisibility={statusVisibility}
                    setStatusVisibility={setStatusVisibility}
                    cancellationReason={cancellationReason}
                    setCancellationReason={setCancellationReason}
                    statusOptions={statusOptions}
                    availableStatuses={availableStatuses}
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
                    unlockOrder={unlockOrder}
                    showUnlockModal={showUnlockModal}
                    setShowUnlockModal={setShowUnlockModal}
                    unlockReason={unlockReason}
                    setUnlockReason={setUnlockReason}
                    unlocking={unlocking}
                />
            </div>

            <div className="tw-mb-6">
                <PaymentRequestPanel order={order} />
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
