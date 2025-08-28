// resources/js/Pages/Admin/AddE.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { Head, router } from '@inertiajs/react';
import AdminDashboard from '@/Layouts/AdminDashboard';
import Breadcrumb from '@/Components/Breadcrumb';
import { Icon } from '@iconify/react';
import CookiesV from '@/Components/CookieConsent';
import Meta from '@/Components/Metaheads';
import Alert from '@/Components/Alert';
import axios from 'axios';

/* ------------------------------------------------------------
   Helpers
------------------------------------------------------------ */
const pad = (n, len = 2) => String(n).padStart(len, '0');
const todayISO = () => new Date().toISOString().split('T')[0];
const plusDaysISO = (d = 14) => {
    const t = new Date(todayISO());
    t.setDate(t.getDate() + d);
    return t.toISOString().split('T')[0];
};

// Always return EST-YYYYMMDD-XXXX (no double EST)
const normalizeEstimateNumber = (raw) => {
    if (!raw) return `EST-${todayISO().replace(/-/g, '')}-0001`;
    const s = String(raw).replace(/^EST-?/i, '').trim();
    const only = s.replace(/[^\d-]/g, '');
    const bits = only.split('-').filter(Boolean);

    let ymd = '', suffix = '';
    if (bits.length >= 2) {
        ymd = (bits[0] || '').replace(/[^\d]/g, '');
        suffix = (bits.slice(1).join('') || '').replace(/[^\d]/g, '');
    } else {
        const digits = only.replace(/[^\d]/g, '');
        ymd = digits.slice(0, 8);
        suffix = digits.slice(8);
    }

    if (ymd.length !== 8) {
        // fallback to today
        ymd = todayISO().replace(/-/g, '');
    }
    if (!suffix) suffix = '0001';

    return `EST-${ymd}-${suffix}`;
};

// Money format (no currency math issues here, just display)
const money = (n) => `LKR ${Number(n || 0).toFixed(2)}`;

const AddE = ({ userDetails, workingGroups, estimate = null, newEstimateNumber }) => {
    /* ------------------------------------------------------------
       Core State
    ------------------------------------------------------------ */
    const [alert, setAlert] = useState(null);
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [wgLoading, setWgLoading] = useState(false);

    // Number fix done here:
    const bootstrapNumber = normalizeEstimateNumber(estimate?.estimate_number || newEstimateNumber);

    const defaultItems = (estimate?.items || []).map(it => ({
        tempId: crypto.randomUUID?.() || Math.random().toString(36).slice(2, 8),
        product_id: it.product_id ?? null,
        variant_id: it.variant_id ?? null,
        subvariant_id: it.subvariant_id ?? null,
        description: it.description ?? '',
        qty: Number(it.qty) || 1,
        unit: it.unit ?? '',
        unit_price: Number(it.unit_price) || 0,
        product_name: it.product_name || it.product?.name || '',
        base_price: Number(it.base_price ?? it.unit_price) || 0,
        variants: it.variants || [],
        is_roll: !!it.is_roll,
        size: it.size || '',
    }));

    const [form, setForm] = useState({
        id: estimate?.id || null,
        estimate_number: bootstrapNumber,
        working_group_id: estimate?.working_group_id || '',
        // client
        client_name: estimate?.client_name || '',
        client_id: estimate?.customer_id || null,
        client_address: estimate?.client_address || '',
        client_phone: estimate?.client_phone || '',
        client_type: estimate?.client_type || '',
        client_email: estimate?.client_email || '',
        // dates
        issue_date: estimate?.issue_date || todayISO(),
        due_date: estimate?.due_date || plusDaysISO(14),
        notes: estimate?.notes || '',
        po_number: estimate?.po_number || '',
        shipment_id: estimate?.shipment_id || '',
        // items
        items: defaultItems.length ? defaultItems : [],
    });

    // WG scoped data
    const [wgUsers, setWgUsers] = useState([]);
    const [wgProducts, setWgProducts] = useState([]);
    const [wgDailyCustomers, setWgDailyCustomers] = useState([]);
    const [rolls, setRolls] = useState([]);

    // UI state
    const [clientQuery, setClientQuery] = useState('');
    const [editingField, setEditingField] = useState(null);

    // Product drawer
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [productSearch, setProductSearch] = useState('');
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [selectedRollId, setSelectedRollId] = useState(null);

    // Product modal local form
    const [modalForm, setModalForm] = useState({
        unitPrice: 0,
        quantity: 1,
        description: '',
        selectedVariants: {},
        rollSizeInches: '',
        pricePerOffcutSqFt: '',
        fixedWidthIn: '',
        heightIn: '',
    });

    const isBlocked = !form.working_group_id;

    /* ------------------------------------------------------------
       Effects: WG fetch, local draft, shortcuts
    ------------------------------------------------------------ */
    const LS_KEY = 'addE.v3.draft';

    // load draft if creating new
    useEffect(() => {
        if (!estimate) {
            const draft = localStorage.getItem(LS_KEY);
            if (draft) {
                try {
                    const parsed = JSON.parse(draft);
                    // do NOT restore estimate number blindly—normalize it:
                    parsed.estimate_number = normalizeEstimateNumber(parsed.estimate_number || bootstrapNumber);
                    setForm(prev => ({ ...prev, ...parsed }));
                } catch { }
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        localStorage.setItem(LS_KEY, JSON.stringify(form));
    }, [form]);

    const fetchWorkingGroupDetails = async (wgId) => {
        if (!wgId) {
            setWgUsers([]); setWgProducts([]); setWgDailyCustomers([]); setRolls([]);
            return;
        }
        setWgLoading(true);
        setErrors(prev => {
            const { fetch_wg, ...rest } = prev;
            return rest;
        });
        try {
            const { data } = await axios.get(route('admin.getdataEst', wgId));
            setWgUsers(data.users || []);
            setWgProducts(data.products || []);
            setWgDailyCustomers(data.dailyCustomers || []);
            setRolls(data.rolls || []);
            if ((data.rolls || []).length === 1) setSelectedRollId(String(data.rolls[0].id));
        } catch (e) {
            const msg = e.response?.data?.message || e.message || 'Unknown error';
            setAlert({ type: 'danger', message: 'Failed to fetch working group details.' });
            setErrors(prev => ({ ...prev, fetch_wg: 'Error while fetching WG data: ' + msg }));
        } finally {
            setWgLoading(false);
        }
    };

    useEffect(() => { fetchWorkingGroupDetails(form.working_group_id); }, [form.working_group_id]);

    // shortcuts
    useEffect(() => {
        const onKey = (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
                e.preventDefault(); handleSubmit('draft');
            }
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                e.preventDefault(); handleSubmit('publish');
            }
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'd') {
                e.preventDefault(); handleSubmit('download');
            }
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'p') {
                e.preventDefault(); handleSubmit('print');
            }
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [form]);

    /* ------------------------------------------------------------
       Derived data & helpers
    ------------------------------------------------------------ */
    const filteredClients = useMemo(() => {
        const q = clientQuery.toLowerCase().trim();
        const pool = [
            ...wgUsers.map(u => ({ ...u, type: 'system' })),
            ...wgDailyCustomers.map(c => ({ ...c, type: 'daily' })),
        ];
        if (!q) return pool.slice(0, 12);
        return pool.filter(u => {
            const name = (u.name || u.full_name || '').toLowerCase();
            const email = (u.email || '').toLowerCase();
            const phone = (u.phone_number || u.phone || '').toLowerCase();
            return name.includes(q) || email.includes(q) || phone.includes(q);
        });
    }, [clientQuery, wgUsers, wgDailyCustomers]);

    const subtotal = useMemo(
        () => form.items.reduce((sum, it) => sum + (Number(it.qty) * Number(it.unit_price)), 0),
        [form.items]
    );
    const discount = 0, tax = 0, total = subtotal - discount + tax;

    const formatDateForDisplay = (iso) => {
        if (!iso) return '';
        const [y, m, d] = iso.split('-');
        return `${d}/${m}/${y}`;
    };

    const handleTopLevelChange = (e) => {
        const { name, value } = e.target;
        setForm(prev => {
            if (name === 'estimate_number') {
                return { ...prev, estimate_number: normalizeEstimateNumber(value) };
            }
            return { ...prev, [name]: value };
        });
    };

    const startEditing = (key) => setEditingField(key);
    const stopEditing = () => setEditingField(null);

    const handleItemChange = (idx, field, value) => {
        setForm(prev => {
            const items = [...prev.items];
            const next = { ...items[idx] };
            if (field === 'qty' || field === 'unit_price') {
                next[field] = Number(value) || 0;
            } else {
                next[field] = value;
            }
            items[idx] = next;
            return { ...prev, items };
        });
    };

    const removeItem = (idx) => {
        setForm(prev => ({ ...prev, items: prev.items.filter((_, i) => i !== idx) }));
        setEditingField(null);
    };

    const selectClient = (client) => {
        setForm(prev => ({
            ...prev,
            client_id: client.id ?? client.customer_id ?? null,
            client_name: client.full_name || client.name || '',
            client_phone: client.phone || client.phone_number || '',
            client_address: client.address || client.billing_address || '',
            client_email: client.email || '',
            client_type: client.type || client.client_type || 'daily',
        }));
    };

    // Product picker helpers
    const groupedVariants = useMemo(() => {
        if (!selectedProduct?.variants) return [];
        return selectedProduct.variants.reduce((acc, v) => {
            let group = acc.find(g => g.name === v.variant_name);
            if (!group) {
                group = { name: v.variant_name, label: v.variant_name, options: [] };
                acc.push(group);
            }
            const subs = (v.subvariants || []).map(sv => ({
                value: sv.subvariant_value,
                priceAdjustment: Number(sv.price_adjustment) || 0,
            }));
            group.options.push({
                value: v.variant_value,
                priceAdjustment: Number(v.price_adjustment) || 0,
                subvariants: subs,
                subLabel: subs.length ? v.subvariants[0].subvariant_name : '',
            });
            return acc;
        }, []);
    }, [selectedProduct]);

    const baseProductPrice = useMemo(() => {
        if (!selectedProduct) return 0;
        return Number(
            selectedProduct.pricing_method === 'roll'
                ? selectedProduct.price_per_sqft
                : selectedProduct.price
        ) || 0;
    }, [selectedProduct]);

    const computedPrice = useMemo(() => {
        if (!selectedProduct) return 0;
        return groupedVariants.reduce((sum, group) => {
            const sel = modalForm.selectedVariants[group.name];
            if (!sel) return sum;
            const opt = group.options.find(o => o.value === sel);
            let total = sum + (opt?.priceAdjustment || 0);
            const subSel = modalForm.selectedVariants[`${group.name}-sub`];
            if (subSel && opt) {
                const subOpt = opt.subvariants.find(s => s.value === subSel);
                total += (subOpt?.priceAdjustment || 0);
            }
            return total;
        }, baseProductPrice);
    }, [groupedVariants, modalForm.selectedVariants, baseProductPrice, selectedProduct]);

    // reset modalForm when product changes or price recomputes
    useEffect(() => {
        if (!selectedProduct) return;
        setModalForm(f => ({
            ...f,
            unitPrice: computedPrice,
            quantity: 1,
            description: selectedProduct?.meta_description || '',
        }));
    }, [selectedProduct, computedPrice]);

    // roll preview calc
    const rollPreview = useMemo(() => {
        if (!selectedProduct || selectedProduct.pricing_method !== 'roll') return null;
        const rollW = Number(modalForm.rollSizeInches) || 0;        // inches
        const fixedW = Number(modalForm.fixedWidthIn) || 0;         // inches
        const hIn = Number(modalForm.heightIn) || 0;                // inches
        if (rollW <= 0 || fixedW <= 0 || hIn <= 0) return null;

        const w_ft = fixedW / 12;
        const h_ft = hIn / 12;
        const fixedAreaFt2 = w_ft * h_ft;

        const rollWidthIn = rollW * 12;
        const offcutWidthIn = Math.max(0, rollWidthIn - fixedW);
        const offcutAreaFt2 = (offcutWidthIn / 12) * h_ft;

        const pRoll = Number(selectedProduct.price_per_sqft) || 0;
        const pOff = Number(modalForm.pricePerOffcutSqFt) || 0;

        const areaPrice = fixedAreaFt2 * pRoll;
        const offcutPrice = offcutAreaFt2 * pOff;
        const printPrice = areaPrice + offcutPrice;
        const unitXQty = printPrice * (Number(modalForm.quantity) || 1);

        return { fixedAreaFt2, offcutAreaFt2, areaPrice, offcutPrice, printPrice, unitXQty };
    }, [selectedProduct, modalForm.rollSizeInches, modalForm.fixedWidthIn, modalForm.heightIn, modalForm.pricePerOffcutSqFt, modalForm.quantity]);

    const addProductToItems = () => {
        if (!selectedProduct) return;
        const isRoll = selectedProduct.pricing_method === 'roll';

        // validation: fixed width cannot exceed roll width (in inches)
        if (isRoll && Number(modalForm.fixedWidthIn) > (Number(modalForm.rollSizeInches || 0) * 12)) {
            setAlert({
                type: 'danger',
                message: `Fixed width (${modalForm.fixedWidthIn}") cannot exceed roll width (${(Number(modalForm.rollSizeInches || 0) * 12)}").`,
            });
            return;
        }

        // build variants record for standard
        const variants = isRoll
            ? []
            : groupedVariants.flatMap(group => {
                const value = modalForm.selectedVariants[group.name];
                if (!value) return [];
                const option = group.options.find(o => o.value === value);
                const subKey = `${group.name}-sub`;
                const subValue = modalForm.selectedVariants[subKey];
                const subList = (option?.subvariants || [])
                    .filter(sv => sv.value === subValue)
                    .map(sv => ({
                        subvariant_name: group.subLabel,
                        subvariant_value: sv.value,
                        priceAdjustment: sv.priceAdjustment,
                    }));
                return [{
                    variant_name: group.name,
                    variant_value: value,
                    priceAdjustment: option?.priceAdjustment || 0,
                    subvariants: subList,
                }];
            });

        let calculatedUnitPrice = modalForm.unitPrice;
        let sizeLabel = '';

        if (isRoll) {
            const w_ft = (Number(modalForm.fixedWidthIn) || 0) / 12;
            const h_ft = (Number(modalForm.heightIn) || 0) / 12;
            const fixedArea = w_ft * h_ft;
            const offWIn = (Number(modalForm.rollSizeInches) || 0) * 12 - (Number(modalForm.fixedWidthIn) || 0);
            const offArea = (Math.max(0, offWIn) / 12) * h_ft;
            const areaPrice = fixedArea * (Number(selectedProduct.price_per_sqft) || 0);
            const offPrice = offArea * (Number(modalForm.pricePerOffcutSqFt) || 0);
            const printPrice = areaPrice + offPrice;
            calculatedUnitPrice = printPrice;
            sizeLabel = `${modalForm.fixedWidthIn}" × ${modalForm.heightIn}"`;
        }

        const newItem = {
            tempId: crypto.randomUUID?.() || Math.random().toString(36).slice(2, 8),
            product_id: selectedProduct.id,
            variant_id: null,
            subvariant_id: null,
            description: modalForm.description,
            qty: modalForm.quantity,
            unit: selectedProduct.unit_of_measure,
            unit_price: calculatedUnitPrice,
            product_name: selectedProduct.name,
            base_price: selectedProduct.pricing_method === 'standard'
                ? selectedProduct.price
                : selectedProduct.price_per_sqft,
            variants,
            is_roll: isRoll,
            ...(isRoll && { size: sizeLabel }),
            roll_id: isRoll ? (selectedRollId || null) : null,
            cut_width_in: isRoll ? modalForm.fixedWidthIn : null,
            cut_height_in: isRoll ? modalForm.heightIn : null,
            offcut_price_per_sqft: isRoll ? modalForm.pricePerOffcutSqFt : null,
            line_total: calculatedUnitPrice * (modalForm.quantity || 1),
        };

        setForm(f => ({ ...f, items: [...f.items, newItem] }));
        // reset drawer state
        setSelectedProduct(null);
        setSelectedRollId(null);
        setProductSearch('');
        setDrawerOpen(false);
    };

    /* ------------------------------------------------------------
       Submit
    ------------------------------------------------------------ */
    const handleSubmit = async (action /* draft|publish|download|print */) => {
        if (!form.working_group_id) { setAlert({ type: 'danger', message: 'Please select a working group first.' }); return; }
        if (!form.client_name) { setAlert({ type: 'danger', message: 'Please assign a client before saving.' }); return; }
        if (form.items.length < 1) { setAlert({ type: 'danger', message: 'You must add at least one line item.' }); return; }

        const payload = {
            ...form,
            estimate_number: normalizeEstimateNumber(form.estimate_number),
            action,
            items: form.items.map(({ tempId, ...keep }) => keep),
        };

        setLoading(true); setErrors({});
        try {
            const isUpdate = Boolean(form.id);
            const url = isUpdate
                ? route('admin.estimates.update', form.id)
                : route('admin.estimates.store');

            const resp = isUpdate ? await axios.put(url, payload) : await axios.post(url, payload);
            const data = resp.data || {};

            setAlert({ type: data.msgtype || 'success', message: data.message || 'Saved.' });

            // open download/print if provided
            if ((action === 'download' || action === 'print') && data.download_url) {
                window.open(data.download_url, '_blank');
            }

            if (data.redirect_to) {
                router.visit(data.redirect_to);
            } else {
                const nextNum = normalizeEstimateNumber(data.nextEstimateNumber || form.estimate_number);
                // keep WG so you can continue adding more
                setForm(prev => ({
                    ...prev,
                    id: data.id || null,
                    estimate_number: nextNum,
                    items: prev.items, // keep if you want, or clear: []
                }));
            }
        } catch (err) {
            if (err.response?.data?.errors) {
                setErrors(err.response.data.errors);
                setAlert({ type: 'danger', message: 'Please fix the errors below.' });
            } else {
                setAlert({ type: 'danger', message: err.message || 'Unknown error' });
            }
        } finally {
            setLoading(false);
        }
    };

    /* ------------------------------------------------------------
       NEW UI (clean 3‑step layout + sticky actions)
    ------------------------------------------------------------ */
    return (
        <>
            <Head title={form.id ? 'Edit Estimate' : 'Add New Estimate'} />
            <Meta
                title={form.id ? 'Edit Estimate - Admin Dashboard' : 'Add Estimate - Admin Dashboard'}
                description="Create and publish estimates quickly"
            />

            <AdminDashboard userDetails={userDetails}>
                <Breadcrumb title={form.id ? 'Edit Estimate' : 'Add New Estimate'} />

                {/* Sticky action bar */}
                <div className="tw-sticky tw-top-0 tw-z-30 tw-bg-white/80 dark:tw-bg-gray-900/80 tw-backdrop-blur tw-border-b tw-border-gray-200 dark:tw-border-gray-800 tw-py-2 tw-mb-4">
                    <div className="tw-container tw-mx-auto tw-flex tw-items-center tw-justify-between tw-gap-2 tw-px-2">
                        <div className="tw-flex tw-items-center tw-gap-3">
                            <select
                                name="working_group_id"
                                className="form-select tw-min-w-[180px]"
                                value={form.working_group_id}
                                onChange={handleTopLevelChange}
                            >
                                <option value="">— Working Group —</option>
                                {workingGroups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                            </select>

                            <div className="tw-hidden sm:tw-flex tw-items-center tw-gap-2 tw-text-xs tw-opacity-70">
                                <span>Ctrl+S Draft</span>
                                <span>•</span>
                                <span>Ctrl+Enter Publish</span>
                                <span>•</span>
                                <span>Ctrl+D Download</span>
                                <span>•</span>
                                <span>Ctrl+P Print</span>
                            </div>
                        </div>

                        <div className="tw-flex tw-gap-2">
                            <button className="btn btn-sm btn-secondary" onClick={() => handleSubmit('draft')} disabled={loading}>
                                <Icon icon="mdi:content-save-outline" /> Save Draft
                            </button>
                            <button className="btn btn-sm btn-primary" onClick={() => handleSubmit('publish')} disabled={loading}>
                                <Icon icon="mdi:cloud-upload-outline" /> Save & Publish
                            </button>
                            <button className="btn btn-sm btn-info" onClick={() => handleSubmit('download')} disabled={loading}>
                                <Icon icon="mdi:download-outline" /> Save & Download
                            </button>
                            <button className="btn btn-sm btn-warning" onClick={() => handleSubmit('print')} disabled={loading}>
                                <Icon icon="solar:printer-outline" /> Save & Print
                            </button>
                        </div>
                    </div>
                </div>

                {alert && <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} />}

                <div className="tw-grid lg:tw-grid-cols-2 tw-gap-4">
                    {/* LEFT: Step 1 — Header + Client */}
                    <div className="tw-space-y-4">
                        {/* Estimate header card */}
                        <div className="card">
                            <div className="card-body tw-space-y-3">
                                <div className="tw-flex tw-items-center tw-justify-between">
                                    <h4 className="tw-font-bold">Estimate</h4>
                                    <img src="/images/printairlogo.png" style={{ height: 42 }} alt="Printair" />
                                </div>

                                <div className="tw-grid tw-grid-cols-2 tw-gap-2">
                                    <div>
                                        <label className="form-label tw-text-xs">Estimate No.</label>
                                        <input
                                            name="estimate_number"
                                            className="form-control form-control-sm"
                                            value={form.estimate_number}
                                            onChange={handleTopLevelChange}
                                        />
                                    </div>
                                    <div>
                                        <label className="form-label tw-text-xs">P.O. Number</label>
                                        <input
                                            name="po_number"
                                            className="form-control form-control-sm"
                                            value={form.po_number || ''}
                                            onChange={handleTopLevelChange}
                                        />
                                    </div>
                                    <div>
                                        <label className="form-label tw-text-xs">Issued</label>
                                        <input
                                            type="date"
                                            name="issue_date"
                                            className="form-control form-control-sm"
                                            value={form.issue_date}
                                            onChange={handleTopLevelChange}
                                        />
                                    </div>
                                    <div>
                                        <label className="form-label tw-text-xs">Due</label>
                                        <input
                                            type="date"
                                            name="due_date"
                                            className="form-control form-control-sm"
                                            value={form.due_date}
                                            onChange={handleTopLevelChange}
                                        />
                                    </div>
                                </div>

                                <div className="tw-text-xs tw-opacity-70">
                                    Order ID: <span className="tw-font-semibold">{form.estimate_number}</span>
                                </div>
                            </div>
                        </div>

                        {/* Client Card */}
                        <div className="card">
                            <div className="card-header tw-flex tw-items-center tw-justify-between">
                                <h6 className="tw-m-0 tw-font-semibold">Client</h6>
                                <button
                                    className="btn btn-sm btn-outline-primary"
                                    onClick={() => document.getElementById('client-search')?.focus()}
                                >
                                    <Icon icon="mdi:account-search" /> Find
                                </button>
                            </div>
                            <div className="card-body tw-space-y-3">
                                <input
                                    id="client-search"
                                    type="text"
                                    className="form-control form-control-sm"
                                    placeholder="Search name, email or phone…"
                                    value={clientQuery}
                                    onChange={(e) => setClientQuery(e.target.value)}
                                />
                                <div className="tw-max-h-52 tw-overflow-auto tw-divide-y tw-divide-gray-200">
                                    {filteredClients.map(u => (
                                        <button
                                            key={`${u.type}-${u.id}`}
                                            type="button"
                                            className="tw-w-full tw-text-left tw-py-2 hover:tw-bg-gray-50"
                                            onClick={() => selectClient(u)}
                                        >
                                            <div className="tw-flex tw-items-center tw-justify-between">
                                                <div>
                                                    <div className="tw-font-medium">{u.name || u.full_name}</div>
                                                    <div className="tw-text-xs tw-opacity-70">
                                                        {(u.email || '—')} • {(u.phone_number || u.phone || '—')}
                                                    </div>
                                                </div>
                                                <span className={`tw-text-[10px] tw-px-2 tw-py-0.5 tw-rounded ${u.type === 'daily' ? 'tw-bg-blue-100 tw-text-blue-800' : 'tw-bg-green-100 tw-text-green-800'
                                                    }`}>
                                                    {u.type === 'daily' ? 'Daily' : 'System'}
                                                </span>
                                            </div>
                                        </button>
                                    ))}
                                </div>

                                <div className="tw-grid tw-grid-cols-2 tw-gap-2 tw-pt-2 tw-border-t">
                                    <div className="tw-text-xs tw-opacity-70">Name</div>
                                    <div className="tw-text-right tw-font-medium">{form.client_name || '—'}</div>
                                    <div className="tw-text-xs tw-opacity-70">Phone</div>
                                    <div className="tw-text-right">{form.client_phone || '—'}</div>
                                    <div className="tw-text-xs tw-opacity-70">Email</div>
                                    <div className="tw-text-right">{form.client_email || '—'}</div>
                                    <div className="tw-text-xs tw-opacity-70">Address</div>
                                    <div className="tw-text-right">{form.client_address || '—'}</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* MIDDLE: Step 2 — Items */}
                    <div className="tw-space-y-4">
                        <div className="card">
                            <div className="card-header tw-flex tw-items-center tw-justify-between">
                                <h6 className="tw-m-0 tw-font-semibold">Line Items</h6>
                                <button
                                    className="btn btn-sm btn-primary"
                                    onClick={() => { setDrawerOpen(true); }}
                                    disabled={isBlocked}
                                >
                                    <Icon icon="simple-line-icons:plus" /> Add Product
                                </button>
                            </div>

                            <div className="card-body tw-p-0">
                                <div className="table-responsive">
                                    <table className="table table-sm mb-0">
                                        <thead>
                                            <tr>
                                                <th>#</th>
                                                <th>Item</th>
                                                <th style={{ width: 90 }}>Qty</th>
                                                <th style={{ width: 110 }}>Unit</th>
                                                <th style={{ width: 130 }}>Unit Price</th>
                                                <th style={{ width: 140 }}>Total</th>
                                                <th className="text-center" style={{ width: 60 }}>—</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {form.items.length === 0 && (
                                                <tr>
                                                    <td colSpan={7} className="text-center tw-text-gray-500 tw-italic py-4">
                                                        No items yet. Click “Add Product”.
                                                    </td>
                                                </tr>
                                            )}
                                            {form.items.map((item, idx) => (
                                                <tr key={item.tempId}>
                                                    <td>{idx + 1}</td>
                                                    <td>
                                                        <div className="tw-font-medium">{item.product_name}</div>
                                                        <div className="tw-text-xs tw-text-gray-500">
                                                            {item.is_roll ? <>Size: {item.size || '—'}</> : <>Base: {Number(item.base_price || 0).toFixed(2)}</>}
                                                        </div>
                                                        <div className="tw-text-xs tw-text-gray-500">{item.description || '—'}</div>
                                                    </td>

                                                    <td>
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            onWheel={(e) => e.currentTarget.blur()}
                                                            className="form-control form-control-sm"
                                                            value={item.qty}
                                                            onChange={(e) => handleItemChange(idx, 'qty', e.target.value)}
                                                        />
                                                    </td>

                                                    <td>
                                                        <input
                                                            type="text"
                                                            className="form-control form-control-sm"
                                                            value={item.unit || ''}
                                                            onChange={(e) => handleItemChange(idx, 'unit', e.target.value)}
                                                        />
                                                    </td>

                                                    <td>
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            onWheel={(e) => e.currentTarget.blur()}
                                                            className="form-control form-control-sm"
                                                            value={item.unit_price}
                                                            onChange={(e) => handleItemChange(idx, 'unit_price', e.target.value)}
                                                        />
                                                    </td>

                                                    <td className="tw-font-semibold">{money(Number(item.qty) * Number(item.unit_price))}</td>

                                                    <td className="text-center">
                                                        <button className="btn btn-link text-danger p-0" onClick={() => removeItem(idx)}>
                                                            <Icon icon="ic:twotone-close" className="tw-text-xl" />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>

                        {/* Review & totals */}
                        <div className="card">
                            <div className="card-body tw-grid md:tw-grid-cols-2 tw-gap-4">
                                <div className="tw-space-y-2">
                                    <div className="tw-text-sm tw-opacity-70">Sales By</div>
                                    <div className="tw-font-medium">{userDetails?.name || '—'}</div>
                                    <div className="tw-text-xs tw-opacity-50">Thank you!</div>
                                </div>

                                <div className="tw-justify-self-end tw-w-full md:tw-w-80">
                                    <table className="table table-sm mb-0">
                                        <tbody>
                                            <tr>
                                                <td>Subtotal</td>
                                                <td className="text-end">{money(subtotal)}</td>
                                            </tr>
                                            <tr>
                                                <td>Discount</td>
                                                <td className="text-end">{money(discount)}</td>
                                            </tr>
                                            <tr>
                                                <td>Tax</td>
                                                <td className="text-end">{money(tax)}</td>
                                            </tr>
                                            <tr>
                                                <td className="tw-font-semibold">Total</td>
                                                <td className="text-end tw-font-semibold">{money(total)}</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>

                        {Object.keys(errors).length > 0 && (
                            <div className="alert alert-danger">
                                <ul className="mb-0">
                                    {Object.values(errors).flat().map((m, i) => <li key={i}>{String(m)}</li>)}
                                </ul>
                            </div>
                        )}
                    </div>
                </div>

                {/* PRODUCT DRAWER (right) */}
                <div className={`tw-fixed tw-inset-y-0 tw-right-0 tw-w-full sm:tw-w-[480px] tw-bg-white dark:tw-bg-gray-900 tw-shadow-2xl tw-z-50 tw-transition-transform ${drawerOpen ? 'tw-translate-x-0' : 'tw-translate-x-full'}`}>
                    <div className="tw-flex tw-items-center tw-justify-between tw-border-b tw-p-3">
                        <h6 className="tw-m-0 tw-font-semibold">Add Product</h6>
                        <button className="btn btn-sm btn-outline-secondary" onClick={() => setDrawerOpen(false)}>
                            Close
                        </button>
                    </div>

                    {/* Search */}
                    <div className="tw-p-3">
                        <input
                            className="form-control"
                            placeholder="Search products…"
                            value={productSearch}
                            onChange={(e) => setProductSearch(e.target.value)}
                        />
                    </div>

                    {/* Product list or detail */}
                    {!selectedProduct ? (
                        <div className="tw-p-3 tw-space-y-2 tw-overflow-auto tw-max-h-[70vh]">
                            {wgProducts
                                .filter(p => (p.name || '').toLowerCase().includes(productSearch.toLowerCase()))
                                .map(p => (
                                    <button
                                        key={p.id}
                                        type="button"
                                        className="tw-w-full tw-text-left tw-border tw-rounded tw-p-3 hover:tw-bg-gray-50"
                                        onClick={() => setSelectedProduct(p)}
                                    >
                                        <div className="tw-font-medium">{p.name}</div>
                                        <div className="tw-text-xs tw-opacity-70">
                                            {(p.categories || []).map(c => c.name).join(', ')} • {p.unit_of_measure}
                                        </div>
                                    </button>
                                ))}
                        </div>
                    ) : (
                        <>
                            <div className="tw-p-3 tw-space-y-3 tw-overflow-auto tw-max-h-[70vh]">
                                <div className="tw-flex tw-items-start tw-justify-between">
                                    <div>
                                        <div className="tw-font-semibold tw-text-lg">{selectedProduct.name}</div>
                                        <div className="tw-text-xs tw-opacity-70" dangerouslySetInnerHTML={{ __html: selectedProduct.meta_description || '' }} />
                                    </div>
                                    <button className="btn btn-sm btn-link" onClick={() => setSelectedProduct(null)}>Change</button>
                                </div>

                                {/* Pricing method switch (read-only by product) */}
                                {selectedProduct.pricing_method === 'standard' && (
                                    <>
                                        <div>
                                            <label className="form-label">Unit Price</label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                onWheel={(e) => e.currentTarget.blur()}
                                                className="form-control"
                                                value={modalForm.unitPrice}
                                                onChange={e => setModalForm(f => ({ ...f, unitPrice: parseFloat(e.target.value) || 0 }))}
                                            />
                                        </div>

                                        {/* Variants */}
                                        {groupedVariants.map(group => {
                                            const sel = modalForm.selectedVariants[group.name];
                                            const opt = group.options.find(o => o.value === sel);
                                            return (
                                                <div key={group.name}>
                                                    <div className="tw-font-medium tw-mb-1">{group.label}</div>
                                                    <div className="tw-flex tw-flex-wrap tw-gap-2">
                                                        {group.options.map(o => {
                                                            const isSelected = sel === o.value;
                                                            return (
                                                                <button
                                                                    key={o.value}
                                                                    type="button"
                                                                    className={`tw-px-3 tw-py-1 tw-rounded tw-border ${isSelected ? 'tw-bg-blue-600 tw-text-white' : 'tw-border-gray-300'}`}
                                                                    onClick={() => {
                                                                        setModalForm(f => {
                                                                            const currently = f.selectedVariants[group.name] === o.value;
                                                                            const next = currently ? null : o.value;
                                                                            const delta = currently ? -o.priceAdjustment : o.priceAdjustment;
                                                                            return {
                                                                                ...f,
                                                                                selectedVariants: { ...f.selectedVariants, [group.name]: next },
                                                                                unitPrice: Math.max(0, f.unitPrice + delta),
                                                                            };
                                                                        });
                                                                    }}
                                                                >
                                                                    {o.value}{o.priceAdjustment > 0 && ` (+${o.priceAdjustment})`}
                                                                </button>
                                                            );
                                                        })}
                                                    </div>

                                                    {opt?.subvariants?.length > 0 && (
                                                        <div className="tw-mt-2 tw-flex tw-flex-wrap tw-gap-2">
                                                            <div className="tw-text-xs tw-opacity-70">{opt.subLabel}</div>
                                                            {opt.subvariants.map(sv => {
                                                                const key = `${group.name}-sub`;
                                                                const isSub = modalForm.selectedVariants[key] === sv.value;
                                                                return (
                                                                    <button
                                                                        key={sv.value}
                                                                        type="button"
                                                                        className={`tw-px-3 tw-py-1 tw-rounded tw-border ${isSub ? 'tw-bg-blue-600 tw-text-white' : 'tw-border-gray-300'}`}
                                                                        onClick={() => {
                                                                            setModalForm(f => {
                                                                                const currently = f.selectedVariants[key] === sv.value;
                                                                                const next = currently ? null : sv.value;
                                                                                const delta = currently ? -sv.priceAdjustment : sv.priceAdjustment;
                                                                                return {
                                                                                    ...f,
                                                                                    selectedVariants: { ...f.selectedVariants, [key]: next },
                                                                                    unitPrice: Math.max(0, f.unitPrice + delta),
                                                                                };
                                                                            });
                                                                        }}
                                                                    >
                                                                        {sv.value}{sv.priceAdjustment > 0 && ` (+${sv.priceAdjustment})`}
                                                                    </button>
                                                                );
                                                            })}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}

                                        <div className="tw-grid tw-grid-cols-2 tw-gap-2">
                                            <div>
                                                <label className="form-label">Quantity</label>
                                                <input
                                                    type="number"
                                                    className="form-control"
                                                    value={modalForm.quantity}
                                                    onChange={e => setModalForm(f => ({ ...f, quantity: parseInt(e.target.value, 10) || 1 }))}
                                                />
                                            </div>
                                            <div>
                                                <label className="form-label">Unit</label>
                                                <input
                                                    className="form-control"
                                                    value={selectedProduct.unit_of_measure || ''}
                                                    readOnly
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="form-label">Description</label>
                                            <textarea
                                                className="form-control"
                                                rows={3}
                                                value={modalForm.description}
                                                onChange={e => setModalForm(f => ({ ...f, description: e.target.value }))}
                                            />
                                        </div>
                                    </>
                                )}

                                {selectedProduct.pricing_method === 'roll' && (
                                    <>
                                        <div className="tw-grid tw-grid-cols-2 tw-gap-2">
                                            <div>
                                                <label className="form-label">Price per Sq.Ft</label>
                                                <input className="form-control" value={selectedProduct.price_per_sqft} readOnly />
                                            </div>
                                            <div>
                                                <label className="form-label">Offcut / Sq.Ft</label>
                                                <input
                                                    type="number"
                                                    className="form-control"
                                                    value={modalForm.pricePerOffcutSqFt}
                                                    onChange={e => setModalForm(m => ({ ...m, pricePerOffcutSqFt: parseFloat(e.target.value) || 0 }))}
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="form-label">Choose Roll</label>
                                            <select
                                                className="form-select"
                                                value={selectedRollId || ''}
                                                onChange={(e) => {
                                                    const roll = rolls.find(r => String(r.id) === String(e.target.value));
                                                    setSelectedRollId(roll?.id ?? null);
                                                    setModalForm(m => ({
                                                        ...m,
                                                        rollSizeInches: roll?.roll_width || roll?.roll_size || 0,
                                                        pricePerOffcutSqFt: roll?.offcut_price || m.pricePerOffcutSqFt || 0,
                                                    }));
                                                }}
                                            >
                                                <option value="">— Select —</option>
                                                {rolls.map(r => (
                                                    <option key={r.id} value={r.id}>
                                                        {`${r.roll_type} (${r.roll_size}" ) — LKR${Number(r.price_rate_per_sqft).toFixed(2)}/ft²`}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className="tw-grid tw-grid-cols-2 tw-gap-2">
                                            <div>
                                                <label className="form-label">Fixed Width (in)</label>
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    className="form-control"
                                                    value={modalForm.fixedWidthIn}
                                                    onChange={e => setModalForm(m => ({ ...m, fixedWidthIn: parseFloat(e.target.value) || 0 }))}
                                                />
                                            </div>
                                            <div>
                                                <label className="form-label">Height (in)</label>
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    className="form-control"
                                                    value={modalForm.heightIn}
                                                    onChange={e => setModalForm(m => ({ ...m, heightIn: parseFloat(e.target.value) || 0 }))}
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="form-label">Quantity</label>
                                            <input
                                                type="number"
                                                className="form-control"
                                                value={modalForm.quantity}
                                                onChange={e => setModalForm(m => ({ ...m, quantity: parseInt(e.target.value, 10) || 1 }))}
                                            />
                                        </div>

                                        <div>
                                            <label className="form-label">Description</label>
                                            <textarea
                                                className="form-control"
                                                rows={3}
                                                value={modalForm.description}
                                                onChange={e => setModalForm(m => ({ ...m, description: e.target.value }))}
                                            />
                                        </div>

                                        {rollPreview && (
                                            <div className="tw-bg-gray-50 tw-rounded tw-p-3 tw-text-sm">
                                                <div className="tw-flex tw-justify-between"><span>Fixed Area</span><span>{rollPreview.fixedAreaFt2.toFixed(2)} ft²</span></div>
                                                <div className="tw-flex tw-justify-between"><span>Offcut Area</span><span>{rollPreview.offcutAreaFt2.toFixed(2)} ft²</span></div>
                                                <div className="tw-flex tw-justify-between"><span>Area Price</span><span>{money(rollPreview.areaPrice)}</span></div>
                                                <div className="tw-flex tw-justify-between"><span>Offcut Price</span><span>{money(rollPreview.offcutPrice)}</span></div>
                                                <div className="tw-flex tw-justify-between"><span>Unit Price</span><span>{money(rollPreview.printPrice)}</span></div>
                                                <div className="tw-flex tw-justify-between tw-font-semibold"><span>Unit × Qty</span><span>{money(rollPreview.unitXQty)}</span></div>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>

                            <div className="tw-border-t tw-p-3 tw-flex tw-justify-between">
                                <button className="btn btn-outline-secondary" onClick={() => setDrawerOpen(false)}>Cancel</button>
                                <button className="btn btn-primary" onClick={addProductToItems} disabled={!selectedProduct}>
                                    Add to Quote
                                </button>
                            </div>
                        </>
                    )}
                </div>

                {/* // /* WG overlay loader */}
                {wgLoading && (
                    <div className="tw-fixed tw-inset-0 tw-bg-black/30 tw-backdrop-blur-sm tw-z-40 tw-flex tw-items-center tw-justify-center">
                        <div className="tw-bg-white dark:tw-bg-gray-900 tw-rounded tw-p-4 tw-shadow-lg tw-flex tw-items-center tw-gap-2">
                            <Icon icon="ic:baseline-autorenew" className="tw-text-2xl tw-animate-spin" />
                            <span>Fetching working group data…</span>
                        </div>
                    </div>
                )}
            </AdminDashboard >

            <CookiesV />
        </>
    );
};

export default AddE;
