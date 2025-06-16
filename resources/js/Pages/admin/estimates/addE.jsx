// resources/js/Pages/Admin/AddE.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { Head, router } from '@inertiajs/react';
import AdminDashboard from '@/Layouts/AdminDashboard';
import Breadcrumb from '@/components/Breadcrumb';
import { Icon } from '@iconify/react';
import CookiesV from '@/Components/CookieConsent';
import Meta from '@/Components/Metaheads';
import Alert from '@/Components/Alert';
import axios from 'axios';

const AddE = ({ userDetails, workingGroups, estimate = null, newEstimateNumber }) => {
  const [alert, setAlert] = useState(null);
  // If `estimate` is passed in via Inertia props when editing an existing estimate,
  // we prefill; otherwise we start with blank/new.
  const raw = estimate?.estimate_number || newEstimateNumber || '00000000';
  const datePart = raw.slice(0, 8);
  const suffix = raw.slice(8);
  const todayISO = new Date().toISOString().split('T')[0];
  const dueDate = new Date(new Date(todayISO).getTime() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const defaultForm = {
    id: estimate?.id || null,
    estimate_number: `EST-${datePart}-${suffix}` || '',
    working_group_id: estimate?.working_group_id || '',
    // --- Client + dates + notes ---
    client_name: estimate?.client_name || '',
    client_address: estimate?.client_address || '',
    client_phone: estimate?.client_phone || '',
    issue_date: estimate?.issue_date || todayISO,
    due_date: estimate?.due_date || dueDate,
    notes: estimate?.notes || '',
    po_number: estimate?.po_number || '',
    shipment_id: estimate?.shipment_id || '',
    // --- Line items (array of { description, qty, unit, unit_price }) ---
    items: estimate?.items.map(it => ({
      description: it.description,
      qty: it.qty,
      unit: it.unit,
      unit_price: it.unit_price,
      product_name: it.product_name || it.product?.name || '',
      base_price: it.base_price || it.unit_price,
      variants: it.variants || [],
      tempId: Math.random().toString(36).slice(2, 8),
    })) || [ /* your empty row */],
  };

  const [form, setForm] = useState(defaultForm);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [wgLoading, setWgLoading] = useState(false);
  const [wgUsers, setWgUsers] = useState([]);
  const [wgProducts, setWgProducts] = useState([]);
  const [wgDailyCustomers, setWgDailyCustomers] = useState([]);
  const [rolls, setRolls] = useState([]);
  const isBlocked = !form.working_group_id;
  const [searchTermwgUser, setSearchTermwgUser] = useState('');
  const [productTab, setProductTab] = useState('standard')
  const [productSearch, setProductSearch] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [pricingTab, setPricingTab] = useState('standard'); // or 'roll'
  const [selectedRollId, setSelectedRollId] = useState(null);
  const selectedRoll = rolls.find(r => r.id == selectedRollId) || {};


  const [editingField, setEditingField] = useState(null);

  const fetchWorkingGroupDetails = async (wgId) => {
    if (!wgId) {
      setWgUsers([]);
      setWgProducts([]);
      setWgDailyCustomers([]);
      setRolls([]);
      return;
    }
    setErrors((prev) => {
      const { fetch_wg, ...rest } = prev;
      return rest; // Remove fetch_wg error if it exists
    });
    setWgLoading(true);
    try {
      const { data } = await axios.get(route('admin.getdataEst', wgId));
      setWgUsers(data.users || []);
      setWgProducts(data.products || []);
      setWgDailyCustomers(data.dailyCustomers || []);
      setRolls(data.rolls || []);
      console.log('WG data fetched successfully:', data);
    } catch (e) {
      const msg = e.response?.data?.message || e.message || 'Unknown error';
      console.error('WG fetch error', e);
      setAlert({ type: 'danger', message: 'Failed to fetch working group details.' });
      setErrors(prev => ({
        ...prev,
        fetch_wg: 'Error happen while fetching WG data. Backend says :' + msg,
      }));
    } finally {
      setWgLoading(false);
    }
  };

  // When the select changes, fetch details
  useEffect(() => {
    fetchWorkingGroupDetails(form.working_group_id);
  }, [form.working_group_id]);

  // Helpers: Format an ISO date string ("YYYY-MM-DD") → "DD/MM/YYYY"
  const formatDateForDisplay = (iso) => {
    if (!iso) return '';
    const [year, month, day] = iso.split('-');
    return `${day}/${month}/${year}`;
  };

  // When editing, we want to write back into `form`; e.g. change form.issue_date, etc.
  const startEditing = (fieldKey) => {
    setEditingField(fieldKey);
  };

  const stopEditing = () => {
    setEditingField(null);
  };

  // Top‐level field change (client_name, dates, etc.)
  const handleTopLevelChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  // Line‐item cell change: idx = index in form.items, field = 'description' | 'qty' | 'unit' | 'unit_price'
  const handleItemChange = (idx, field, value) => {
    setForm((prev) => {
      const items = [...prev.items];
      items[idx] = {
        ...items[idx],
        [field]: field === 'qty' || field === 'unit_price' ? parseFloat(value) || 0 : value,
      };
      return { ...prev, items };
    });
  };

  // Add a new empty line‐item
  const addItem = () => {
    setForm((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        { description: '', qty: 1, unit: '', unit_price: 0, tempId: Math.random().toString(36).substring(2, 8) },
      ],
    }));
  };

  // Remove line‐item at index `idx`
  const removeItem = (idx) => {
    setForm((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== idx),
    }));
    // If we were editing something in that row, turn it off:
    setEditingField(null);
  };

  // Compute subtotal, discount=0, tax=0, total
  const subtotal = form.items.reduce(
    (sum, item) => sum + item.qty * item.unit_price,
    0
  );
  const discount = 0;
  const tax = 0;
  const total = subtotal - discount + tax;

  // When Save is clicked
  const submit = (e) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    // Decide whether to POST (create) or PUT (update)
    if (form.id) {
      // Update existing
      router.put(
        route('admin.estimates.update', form.id),
        {
          ...form,
          items: form.items.map(({ tempId, ...keep }) => keep),
        },
        {
          preserveScroll: true,
          onSuccess: (page) => {
            setLoading(false);
            // Optionally show a flash or reset editing
            setEditingField(null);
          },
          onError: (errs) => {
            setLoading(false);
            setErrors(errs);
          },
        }
      );
    } else {
      // Create new
      router.post(
        route('admin.estimates.store'),
        {
          ...form,
          items: form.items.map(({ tempId, ...keep }) => keep),
        },
        {
          preserveScroll: true,
          onSuccess: (page) => {
            setLoading(false);
            // Clear the form for a fresh new estimate:
            setForm(defaultForm);
            setEditingField(null);
          },
          onError: (errs) => {
            setLoading(false);
            setErrors(errs);
          },
        }
      );
    }
  };

  useEffect(() => {
    if (isBlocked) {
      setAlert({ type: 'danger', message: 'Please select a working group first.' });
      setErrors({ working_group_id: 'Working group is required.' });
    } else {
      setAlert(null);
      setErrors((prev) => {
        const { working_group_id, ...rest } = prev;
        return rest; // Remove working_group_id error if it exists
      });
    }
  }, [form.working_group_id]);

  // new helper inside your component
  const selectClient = (client) => {
    setForm(prev => ({
      ...prev,
      client_name: client.full_name,
      client_phone: client.phone_number || '',
      client_address: client.address || '',
      // if you added client_email to defaultForm:
      client_email: client.email || '',
    }));
  };



  // — “Add Daily Customer” form state —
  const emptyAddForm = {
    full_name: '',
    phone_number: '',
    email: '',
    address: '',
    notes: '',
    visit_date: new Date().toISOString().split('T')[0],
    working_group_id: form.working_group_id || '',  // default to selected WG
  };
  const [addForm, setAddForm] = useState(emptyAddForm);
  const [addErrors, setAddErrors] = useState({});
  const [addLoading, setAddLoading] = useState(false);

  // Reset addForm & errors whenever WG select changes or modal opens
  useEffect(() => {
    setAddForm(prev => ({ ...emptyAddForm, working_group_id: form.working_group_id }));
    setAddErrors({});
  }, [form.working_group_id]);

  // Track input changes
  const handleAddChange = e => {
    setAddForm(f => ({ ...f, [e.target.name]: e.target.value }));
  };

  // Submit “Add Daily Customer”
  const submitAdd = async e => {
    e.preventDefault();
    setAddLoading(true);
    setAddErrors({});
    try {
      const resp = await axios.post(route('admin.jsonDailyCustomers'), addForm);
      // 1️⃣ unwrap your customer
      //    - if you returned { customer: {...} }
      //    - or a Resource { data: {...} }
      //    - or bare {...}
      let payload = resp.data.customer ?? resp.data.data ?? resp.data;
      const customer = payload.customer ?? payload;

      console.log(resp + ' mo ' + customer);

      // 2️⃣ refresh your WG lists & append
      await fetchWorkingGroupDetails(form.working_group_id);
      // setWgDailyCustomers(dc => [...dc, customer]);

      // 3️⃣ select them in the quote form
      selectClient({ ...customer, type: 'daily' });
      // make sure your selectClient reads client.full_name

      document.querySelector('#addCustomerModal .btn-close').click();

      // 5️⃣ flash their actual name
      const name = customer.full_name || customer.name;
      setAlert({ type: 'success', message: `${name} added & selected.` });
    } catch (err) {
      // Handle validation errors
      if (err.response?.data?.errors) {
        setAddErrors(err.response.data.errors);
        setAlert({ type: 'danger', message: 'Please fix the errors below.' });
        console.log('Add Daily Customer errors:', err.response.data.errors);
      } else {
        setAlert({ type: 'danger', message: err.message || 'Unknown error' });
        console.error('Add Daily Customer error:', err);
      }
    } finally {
      setAddLoading(false);
    }
  };

  // --- Variants logic from ProductView ---
  const groupedVariants = useMemo(() => {
    if (!selectedProduct?.variants) return [];
    return selectedProduct.variants.reduce((acc, v) => {
      let group = acc.find(g => g.name === v.variant_name);
      if (!group) {
        group = { name: v.variant_name, label: v.variant_name, options: [] };
        acc.push(group);
      }
      // map subvariants
      const subs = (v.subvariants || []).map(sv => ({
        value: sv.subvariant_value,
        priceAdjustment: parseFloat(sv.price_adjustment) || 0,
      }));
      group.options.push({
        value: v.variant_value,
        priceAdjustment: parseFloat(v.price_adjustment) || 0,
        subvariants: subs,
        subLabel: subs.length ? v.subvariants[0].subvariant_name : '',
      });
      return acc;
    }, []);
  }, [selectedProduct]);

  // track which variant/subvariant is chosen
  const [selectedVariants, setSelectedVariants] = useState({});

  // recompute price = base + adjustments
  const computedPrice = useMemo(() => {
    if (!selectedProduct) return 0;
    const base = parseFloat(
      selectedProduct.pricing_method === 'roll'
        ? selectedProduct.price_per_sqft
        : selectedProduct.price
    ) || 0;
    return groupedVariants.reduce((sum, group) => {
      const sel = selectedVariants[group.name];
      if (!sel) return sum;
      const opt = group.options.find(o => o.value === sel);
      let total = sum + (opt?.priceAdjustment || 0);
      const subSel = selectedVariants[`${group.name}-sub`];
      if (subSel && opt) {
        const subOpt = opt.subvariants.find(s => s.value === subSel);
        total += (subOpt?.priceAdjustment || 0);
      }
      return total;
    }, base);
  }, [groupedVariants, selectedVariants, selectedProduct]);

  const [modalForm, setModalForm] = useState({
    // → standard fields
    unitPrice: computedPrice,
    quantity: 1,
    description: selectedProduct?.meta_description || '',
    selectedVariants: {},

    // → roll-pricing fields
    rollSizeInches: 0,
    pricePerOffcutSqFt: 0,
    fixedWidthIn: 0,
    heightIn: 0,
  });
  useEffect(() => {
    setModalForm({
      unitPrice: computedPrice,
      quantity: '1',
      description: selectedProduct?.meta_description || '',
      selectedVariants: {},
      rollSizeInches: 0,
      pricePerOffcutSqFt: '',
      fixedWidthIn: '',
      heightIn: '',
    });
  }, [selectedProduct, computedPrice]);





  return (
    <>
      <Head title={form.id ? 'Edit Estimate' : 'Add New Estimate'} />
      <Meta
        title={form.id ? 'Edit Estimate - Admin Dashboard' : 'Add Estimate - Admin Dashboard'}
        description="Inline‐edit Estimate"
      />

      <AdminDashboard userDetails={userDetails}>
        <Breadcrumb title={form.id ? 'Edit Estimate' : 'Add New Estimate'} />
        {alert && <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} />}

        <div className="card position-relative tw-rounded">
          <div className="card-header">
            <div className="d-flex flex-wrap align-items-center justify-content-between gap-2">
              {/* Working Group Selector */}
              <div className="mb-3 mt-2">
                {/* <label htmlFor="working_group_id" className="form-label fw-semibold">
                                    Working Group
                                </label> */}
                <select
                  name="working_group_id"
                  id="working_group_id"
                  className="form-select"
                  value={form.working_group_id}
                  onChange={handleTopLevelChange}
                >
                  <option value="">-- Select Working Group --</option>
                  {workingGroups.map(group => (
                    <option key={group.id} value={group.id}>
                      {group.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <button
                  type="button"
                  className="btn btn-sm btn-outline-secondary radius-8 d-inline-flex align-items-center gap-1 me-3"
                  onClick={submit}
                  disabled={loading || isBlocked}
                  title="Save without publishing"
                  data-bs-toggle="tooltip"
                  data-bs-placement="top"
                  data-bs-custom-class="tooltip-custom"
                  data-bs-title="Save without publishing"
                  data-bs-trigger="hover"
                  data-bs-delay='{"show": 500, "hide": 100}'
                  data-bs-animation="true"
                  data-bs-container="body"
                  data-bs-boundary="window"
                  data-bs-offset="0, 10"
                  data-bs-html="true"
                  data-bs-dismiss="tooltip"
                  data-bs-target="#tooltip-save"
                >
                  <Icon icon="simple-line-icons:check" className="text-xl" />
                  {loading ? 'Saving...' : 'Save'}
                </button>
                <button
                  type="button"
                  className="btn btn-sm btn-outline-primary-600 radius-8 d-inline-flex align-items-center gap-1 me-3"
                  onClick={submit}
                  disabled={loading || isBlocked}
                  title="Save and publishing"
                  data-bs-toggle="tooltip"
                  data-bs-placement="top"
                  data-bs-custom-class="tooltip-custom"
                  data-bs-title="Save and publishing"
                  data-bs-trigger="hover"
                  data-bs-delay='{"show": 500, "hide": 100}'
                  data-bs-animation="true"
                  data-bs-container="body"
                  data-bs-boundary="window"
                  data-bs-offset="0, 10"
                  data-bs-html="true"
                  data-bs-dismiss="tooltip"
                  data-bs-target="#tooltip-save"
                >
                  <Icon icon="simple-line-icons:check" className="text-xl" />
                  {loading ? 'Saving...' : 'Save & Publish'}
                </button>
                <button
                  type="button"
                  className="btn btn-sm btn-outline-primary-600 radius-8 d-inline-flex align-items-center gap-1 me-3"
                  onClick={submit}
                  disabled={loading || isBlocked}
                  title="Print this estimate"
                  data-bs-toggle="tooltip"
                  data-bs-placement="top"
                  data-bs-custom-class="tooltip-custom"
                  data-bs-title="Print this estimate"
                  data-bs-trigger="hover"
                  data-bs-delay='{"show": 500, "hide": 100}'
                  data-bs-animation="true"
                  data-bs-container="body"
                  data-bs-boundary="window"
                  data-bs-offset="0, 10"
                  data-bs-html="true"
                  data-bs-dismiss="tooltip"
                  data-bs-target="#tooltip-save"
                >
                  <Icon icon="simple-line-icons:check" className="text-xl" />
                  {loading ? 'Printing...' : 'Print'}
                </button>
              </div>

            </div>
          </div>

          <div className="card-body py-40">
            {wgLoading && (
              <div className="position-absolute top-0 start-0 w-100 h-100 d-flex flex-column align-items-center justify-content-center tw-bg-gray-800 tw-bg-opacity-75">
                <Icon icon="ic:baseline-autorenew" className="tw-text-3xl tw-animate-spin tw-mb-3 tw-text-gray-200" />
                <span className='tw-text-white'>Getting details of working group…</span>
              </div>
            )}
            {/* Errors Banner */}
            {Object.keys(errors).length > 0 && (
              <div className="alert alert-danger bg-danger-100 text-danger-600 border-danger-600 border-start-width-4-px border-top-0 border-end-0 border-bottom-0 px-24 py-13 mb-0 fw-semibold text-lg radius-4 d-flex align-items-center justify-content-between">
                <ul className="mb-0">
                  {Object.values(errors).map((errMsg, idx) => (
                    <li key={idx}>{errMsg}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="row justify-content-center tw-mt-4" id="invoice">
              <div className="col tw-max-w-[8.3in]">
                <div className="shadow-4 border radius-8">
                  {/* Header (Estimate #, Dates, Company Info) */}
                  <div className="p-20 border-bottom">
                    <div className="row justify-content-between g-3">
                      {/* Left: Estimate #, Issue & Due */}
                      <div className="col-sm-6">
                        <h3 className="text-xl">
                          {form.estimate_number
                            ? (
                              <>

                                <h4 className='tw-font-bold'>Estimate</h4>
                                <div className='tw-font-semibold tw-text-md'>#{form.estimate_number}</div>
                              </>
                            )
                            : 'Estimate #—'}
                        </h3>

                        {/* Issue Date */}
                        <p className="mb-1 text-sm d-flex align-items-center tw-mt-3">
                          Date Issued:&nbsp;
                          {editingField === 'issue_date' ? (
                            <input
                              name="issue_date"
                              type="date"
                              className="form-control form-control-sm w-auto"
                              value={form.issue_date}
                              onChange={handleTopLevelChange}
                              onBlur={stopEditing}
                              autoFocus
                            />
                          ) : (
                            <>
                              <span className="editable text-decoration-underline">
                                {formatDateForDisplay(form.issue_date)}
                              </span>
                              <span
                                className="text-success-main ms-1"
                                style={{ cursor: 'pointer' }}
                                onClick={() => startEditing('issue_date')}
                              >
                                <Icon icon="mage:edit" />
                              </span>
                            </>
                          )}
                        </p>

                        {/* Due Date */}
                        <p className="mb-0 text-sm d-flex align-items-center">
                          Date Due:&nbsp;
                          {editingField === 'due_date' ? (
                            <input
                              name="due_date"
                              type="date"
                              className="form-control form-control-sm w-auto"
                              value={form.due_date}
                              onChange={handleTopLevelChange}
                              onBlur={stopEditing}
                              autoFocus
                            />
                          ) : (
                            <>
                              <span className="editable text-decoration-underline">
                                {formatDateForDisplay(form.due_date)}
                              </span>
                              <span
                                className="text-success-main ms-1"
                                style={{ cursor: 'pointer' }}
                                onClick={() => startEditing('due_date')}
                              >
                                <Icon icon="mage:edit" />
                              </span>
                            </>
                          )}
                        </p>
                      </div>

                      {/* Right: Company Logo & Contact */}
                      <div className="col-sm-6 d-flex flex-column align-items-end justify-content-end text-end">
                        <div>
                          <img
                            src="/images/printairlogo.png"
                            alt="Printair Logo"
                            className="tw-mb-3"
                            style={{ maxHeight: '95px' }}
                          />
                        </div>
                        <p className="tw-mb-1 tw-text-sm">
                          No. 67/D/1, Uggashena Road,
                          <br />Walpola, Ragama, Sri Lanka
                        </p>
                        <p className="tw-mb-0 tw-text-sm">
                          contact@printair.lk
                          <br />
                          &nbsp;+94 76 886 0175
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Body: “Issues For” + “Order Info” + Line Items + Totals */}
                  <div className="py-28 px-20">
                    <div className="d-flex flex-wrap justify-content-between align-items-end gap-3">
                      <div>
                        <h6 className="text-md">Issues For:
                          <span
                            className="text-success-main ms-1"
                            style={{ cursor: 'pointer' }}
                            data-bs-toggle="modal" data-bs-target="#ClientModal"
                          >
                            <Icon icon="mage:edit" />
                          </span>
                        </h6>
                        <table className="text-sm text-secondary-light">
                          <tbody>
                            {/* Client Name */}
                            <tr>
                              <td>Name</td>
                              <td className="ps-8 d-flex align-items-center">
                                : {form.client_name || '—'}
                              </td>
                            </tr>

                            {/* Client Address */}
                            <tr>
                              <td>Address</td>
                              <td className="ps-8 d-flex align-items-center tw-max-w-[300px]">
                                : {form.client_address || '—'}
                              </td>
                            </tr>

                            {/* Client Phone */}
                            <tr>
                              <td>Phone number</td>
                              <td className="ps-8 d-flex align-items-center">
                                : {form.client_phone || '—'}
                              </td>
                            </tr>

                            <tr>
                              <td>Email</td>
                              <td className="ps-8 d-flex align-items-center">
                                : {form.client_email || '—'}
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>

                      {/* Right side “Order Info” (Issus Date, Order ID, Shipment ID) */}
                      <div>
                        <table className="text-sm text-secondary-light">
                          <tbody>
                            <tr>
                              <td className='tw-text-end'>Issus Date :</td>
                              <td className="ps-8">
                                {formatDateForDisplay(form.issue_date)}
                              </td>
                            </tr>
                            <tr>
                              <td className='tw-text-end'>Order ID :</td>
                              <td className="ps-8">
                                {form.estimate_number || '—'}
                              </td>
                            </tr>
                            <tr>
                              <td className='tw-text-end'>P.O. Number :</td>
                              <td className="ps-8">
                                {editingField === 'po_number' ? (
                                  <input
                                    name="po_number"
                                    type="text"
                                    className="form-control form-control-sm w-auto"
                                    value={form.po_number || ''}
                                    onChange={handleTopLevelChange}
                                    onBlur={stopEditing}
                                    autoFocus
                                  />
                                ) : (
                                  <>
                                    <span className="editable text-decoration-underline">
                                      {form.po_number || '—'}
                                    </span>
                                    <span
                                      className='text-success-main ms-1'
                                      style={{ cursor: 'pointer' }}
                                      onClick={() => startEditing('po_number')}
                                    >
                                      <Icon icon="mage:edit" />
                                    </span>
                                  </>
                                )}
                              </td>
                            </tr>
                            <tr>
                              <td className='tw-text-end'>Shipment ID :</td>
                              <td className="ps-8">
                                {editingField === 'shipment_id' ? (
                                  <input
                                    name="shipment_id"
                                    type="text"
                                    className="form-control form-control-sm w-auto"
                                    value={form.shipment_id || ''}
                                    onChange={handleTopLevelChange}
                                    onBlur={stopEditing}
                                    autoFocus
                                  />
                                ) : (
                                  <>
                                    <span className="editable text-decoration-underline">
                                      {form.shipment_id || '—'}
                                    </span>
                                    <span
                                      className='text-success-main ms-1'
                                      style={{ cursor: 'pointer' }}
                                      onClick={() => startEditing('shipment_id')}
                                    >
                                      <Icon icon="mage:edit" />
                                    </span>
                                  </>
                                )}
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Line Items Table */}
                    <div className="mt-24">
                      <div className="table-responsive scroll-sm">
                        <table
                          className="table bordered-table text-sm"
                          id="invoice-table"
                        >
                          <thead>
                            <tr>
                              <th scope="col" className="text-sm">
                                SL.
                              </th>
                              <th scope="col" className="text-sm">
                                Items
                              </th>
                              <th scope="col" className="text-sm">
                                Qty
                              </th>
                              <th scope="col" className="text-sm">
                                Units
                              </th>
                              <th scope="col" className="text-sm">
                                Unit Price
                              </th>
                              <th scope="col" className="text-sm">
                                Price
                              </th>
                              <th scope="col" className="text-center text-sm">
                                Action
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {form.items.map((item, idx) => (
                              <tr key={item.tempId}>
                                {/* SL # */}
                                <td>{idx + 1}</td>

                                {/* Description (inline editable) */}
                                <td>
                                  <div className="tw-font-semibold">{item.product_name}</div>
                                  {editingField === `item-${idx}-description` ? (
                                    <input
                                      type="text"
                                      className="form-control form-control-sm"
                                      value={item.description}
                                      onChange={(e) =>
                                        handleItemChange(idx, 'description', e.target.value)
                                      }
                                      onBlur={stopEditing}
                                      autoFocus
                                    />
                                  ) : (
                                    <div className="d-flex align-items-center">
                                      <span className="editable text-decoration-underline tw-text-sm tw-text-gray-500">
                                        {item.description || '—'}
                                      </span>
                                      <span
                                        className="text-success-main ms-1"
                                        style={{ cursor: 'pointer' }}
                                        onClick={() =>
                                          startEditing(`item-${idx}-description`)
                                        }
                                      >
                                        <Icon icon="mage:edit" />
                                      </span>
                                    </div>
                                  )}
                                  {item.isRoll ? (
                                    <div>
                                      <div className='tw-text-xs'>
                                        <span className="tw-font-semibold tw-text-gray-500">
                                          Size:
                                        </span>
                                        {item.size}
                                      </div>
                                    </div>
                                  ) : (
                                    <div>
                                      <div className='tw-text-xs'>
                                        <span className="tw-font-semibold tw-text-gray-500">
                                          Base Price:
                                        </span>
                                        {parseFloat(item.base_price).toFixed(2)}
                                      </div>

                                      <div className='tw-text-xs'>
                                        <span className="tw-font-semibold tw-text-gray-500">
                                          Variants
                                        </span>
                                        {item.variants && item.variants.length > 0 ? (
                                          <ul className='tw-list-disc tw-ml-4'>
                                            {item.variants.map((v, i) => (
                                              <li key={i}>
                                                {v.variant_name}: {v.variant_value}
                                                {v.priceAdjustment > 0 && ` (+${v.priceAdjustment.toFixed(2)})`}
                                                {v.subvariants.length > 0 && (
                                                  <ul>
                                                    {v.subvariants.map((sv, j) => (
                                                      <li key={j}>
                                                        {sv.subvariant_name}: {sv.subvariant_value}
                                                        {sv.priceAdjustment > 0 && ` (+${sv.priceAdjustment.toFixed(2)})`}
                                                      </li>
                                                    ))}
                                                  </ul>
                                                )}
                                              </li>
                                            ))}
                                          </ul>
                                        ) : (
                                          '—'
                                        )}
                                      </div>
                                    </div>
                                  )}
                                </td>

                                {/* Qty */}
                                <td>
                                  {editingField === `item-${idx}-qty` ? (
                                    <input
                                      type="number"
                                      min="0"
                                      onWheel={e => e.currentTarget.blur()}
                                      className="form-control form-control-sm"
                                      value={item.qty}
                                      onChange={(e) =>
                                        handleItemChange(idx, 'qty', e.target.value)
                                      }
                                      onBlur={stopEditing}
                                      autoFocus
                                    />
                                  ) : (
                                    <div className="d-flex align-items-center">
                                      <span className="editable text-decoration-underline">
                                        {item.qty}
                                      </span>
                                      <span
                                        className="text-success-main ms-1"
                                        style={{ cursor: 'pointer' }}
                                        onClick={() => startEditing(`item-${idx}-qty`)}
                                      >
                                        <Icon icon="mage:edit" />
                                      </span>
                                    </div>
                                  )}
                                </td>

                                {/* Unit */}
                                <td>
                                  {editingField === `item-${idx}-unit` ? (
                                    <input
                                      type="text"
                                      className="form-control form-control-sm"
                                      value={item.unit}
                                      onChange={(e) =>
                                        handleItemChange(idx, 'unit', e.target.value)
                                      }
                                      onBlur={stopEditing}
                                      autoFocus
                                    />
                                  ) : (
                                    <div className="d-flex align-items-center">
                                      <span className="editable text-decoration-underline">
                                        {item.unit || '—'}
                                      </span>
                                      <span
                                        className="text-success-main ms-1"
                                        style={{ cursor: 'pointer' }}
                                        onClick={() => startEditing(`item-${idx}-unit`)}
                                      >
                                        <Icon icon="mage:edit" />
                                      </span>
                                    </div>
                                  )}
                                </td>

                                {/* Unit Price */}
                                <td>
                                  {editingField === `item-${idx}-unit_price` ? (
                                    <input
                                      type="number"
                                      min="0"
                                      onWheel={e => e.currentTarget.blur()}
                                      className="form-control form-control-sm"
                                      value={item.unit_price}
                                      onChange={e => handleItemChange(idx, 'unit_price', e.target.value)}
                                      onBlur={stopEditing}
                                      autoFocus
                                    />
                                  ) : (
                                    <div className="d-flex align-items-center">
                                      <span className="editable text-decoration-underline">
                                        {item.unit_price.toFixed(2)}
                                      </span>
                                      <span
                                        className="text-success-main ms-1"
                                        style={{ cursor: 'pointer' }}
                                        onClick={() => startEditing(`item-${idx}-unit_price`)}
                                      >
                                        <Icon icon="mage:edit" />
                                      </span>
                                    </div>
                                  )}
                                </td>


                                {/* Price = qty × unit_price (read‐only) */}
                                <td>LKR {(item.qty * item.unit_price).toFixed(2)}</td>

                                {/* Remove‐row button */}
                                <td className="text-center">
                                  <button
                                    type="button"
                                    className="remove-row btn p-0"
                                    onClick={() => removeItem(idx)}
                                  >
                                    <Icon
                                      icon="ic:twotone-close"
                                      className="text-danger-main text-xl"
                                    />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* “Add New” line */}
                      <div className="mt-2">
                        <button
                          type="button"
                          className="btn btn-sm btn-primary-600 radius-8 d-inline-flex align-items-center gap-1"
                          data-bs-toggle="modal"
                          data-bs-target="#ProductModal"
                        >
                          <Icon
                            icon="simple-line-icons:plus"
                            className="text-xl"
                          />
                          Add New
                        </button>
                      </div>

                      {/* Totals */}
                      <div className="d-flex flex-wrap justify-content-between gap-3 mt-24">
                        <div>
                          <p className="text-sm mb-0">
                            <span className="text-primary-light fw-semibold">
                              Sales By:
                            </span>{' '}
                            {userDetails.name || '—'}
                          </p>
                          <p className="text-sm mb-0">Thanks for your business</p>
                        </div>

                        <div>
                          <table className="text-sm">
                            <tbody>
                              <tr>
                                <td className="pe-64 text-start">Subtotal:</td>
                                <td className="pe-16 text-end">
                                  <span className="text-primary-light fw-semibold">
                                    LKR {subtotal.toFixed(2)}
                                  </span>
                                </td>
                              </tr>
                              <tr>
                                <td className="pe-64 text-start">Discount:</td>
                                <td className="pe-16 text-end">
                                  <span className="text-primary-light fw-semibold">
                                    LKR {discount.toFixed(2)}
                                  </span>
                                </td>
                              </tr>
                              <tr>
                                <td className="pe-64 border-bottom pb-4 text-start">Tax:</td>
                                <td className="pe-16 border-bottom pb-4 text-end">
                                  <span className="text-primary-light fw-semibold">
                                    LKR {tax.toFixed(2)}
                                  </span>
                                </td>
                              </tr>
                              <tr>
                                <td className="pe-64 pt-4 text-start">
                                  <span className="text-primary-light fw-semibold">Total:</span>
                                </td>
                                <td className="pe-16 pt-4 text-end">
                                  <span className="text-primary-light fw-semibold">
                                    LKR {total.toFixed(2)}
                                  </span>
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* Footer (Signatures) */}
                      <div className="mt-64">
                        <p className="text-center text-secondary-light text-sm fw-semibold">
                          Thank you for your purchase!
                        </p>
                      </div>
                      <div className="d-flex flex-wrap justify-content-between align-items-end mt-64">
                        <div className="text-sm border-top d-inline-block px-12">
                          Signature of Customer
                        </div>
                        <div className="text-sm border-top d-inline-block px-12">
                          Signature of Authorized
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div
          className="modal fade"
          id="ClientModal"
          tabIndex={-1}
          aria-labelledby="ClientModalLabel"
          aria-hidden="true"
        >
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content radius-16 bg-base">
              <div className="modal-header py-16 px-24 border-0">
                <h6
                  className="modal-title tw-font-semibold tw-text-gray-700 dark:tw-text-gray-400"
                  id="ClientModalLabel"
                >
                  Assign a Client for the Estimate
                </h6>
                <button
                  type="button"
                  className="btn-close"
                  data-bs-dismiss="modal"
                  aria-label="Close"
                />
              </div>
              <div className="modal-body p-4 overflow-auto tw-min-h-80" style={{ maxHeight: '60vh' }}>
                <hr className='tw-mb-3' />

                {/* — Search input — */}
                <div className="tw-mb-8 tw-px-12">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Search users"
                    value={searchTermwgUser}
                    onChange={(e) => setSearchTermwgUser(e.target.value)}
                  />
                </div>

                {/* — Before typing: prompt — */}
                {searchTermwgUser.trim() === '' ? (
                  <div className=''>
                    <div className="tw-text-center tw-text-gray-500 tw-italic tw-mt-12">Search users by Name, Email or Phone Number <span className='tw-font-semibold'>OR</span> <br /> Add new daily customer</div>
                  </div>
                ) : (
                  /* — After typing: filtered results — */
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      ...wgUsers.map(u => ({ ...u, type: 'system' })),
                      ...wgDailyCustomers.map(c => ({ ...c, type: 'daily' })),
                    ]
                      .filter(user => {
                        const term = searchTermwgUser.toLowerCase();
                        // Safely grab name & email (fallback to empty string)
                        const name = (user.name || user.full_name || '').toLowerCase();
                        const [localPart = '', domainPart = ''] = (user.email || '').toLowerCase().split('@');
                        if (term.includes('@')) {
                          return (user.email || '').toLowerCase().includes(term);
                        }
                        const phoneNumber = (user.phone_number || '').toLowerCase();
                        return name.includes(term) || localPart.includes(term) || phoneNumber.includes(term);
                      })
                      .map(user => (
                        <div
                          key={`${user.type}-${user.id}`}
                          className="flex items-center tw-mx-12 tw-p-3 tw-border tw-rounded-lg hover:tw-bg-blue-200 hover:dark:tw-bg-gray-800 tw-cursor-pointer tw-mb-3"
                          onClick={() => selectClient(user)}
                          data-bs-dismiss="modal"
                        >
                          <div className="tw-ml-3 tw-flex-1">
                            <p className="tw-font-semibold tw-text-black dark:tw-text-white">{user.name || user.full_name || NaN}</p>
                            <p className="tw-text-sm tw-text-gray-500">{user.email}</p>
                            <p className="tw-text-sm tw-text-gray-500">{user.phone_number}</p>
                          </div>
                          <span
                            className={`tw-text-xs tw-font-medium tw-px-2 tw-py-1 tw-ml-3 tw-rounded ${user.type === 'daily'
                              ? 'tw-bg-blue-100 tw-text-blue-800'
                              : 'tw-bg-green-100 tw-text-green-800'
                              }`}
                          >
                            {user.type === 'daily' ? 'Daily Customer' : 'System User'}
                          </span>
                        </div>
                      ))}
                  </div>
                )}
              </div>
              <div className='model-footer p-8 border-top'>
                <button
                  type="button"
                  className="btn btn-primary float-end d-flex align-items-center"
                  data-bs-toggle="modal"
                  data-bs-target="#addCustomerModal"
                >
                  <Icon icon="ic:baseline-add-circle" className='tw-me-2' /> Add New Daily Customer & Use
                </button>

              </div>
            </div>
          </div>
        </div>


        {/* — Add Daily Customer Modal — */}
        <div
          className="modal fade"
          id="addCustomerModal"
          tabIndex={-1}
          aria-labelledby="addCustomerModalLabel"
          aria-hidden="true"
        >
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content radius-16 bg-base">
              <div className="modal-header tw-py-3 tw-px-4">
                <h5 className="modal-title" id="addCustomerModalLabel">
                  Add New Daily Customer
                </h5>
                <button type="button" className="btn-close" data-bs-dismiss="modal" />
              </div>
              <form onSubmit={submitAdd}>
                <div className="modal-body tw-p-4">
                  {Object.keys(addErrors).length > 0 && (
                    <div className="alert alert-danger mb-3">
                      <ul className="mb-0">
                        {Object.values(addErrors).map((err, i) => (
                          <li key={i}>{err}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Full Name */}
                  <div className="mb-3">
                    <label className="form-label">Full Name</label>
                    <input
                      name="full_name"
                      type="text"
                      className="form-control"
                      value={addForm.full_name}
                      onChange={handleAddChange}
                    />
                  </div>

                  {/* Phone */}
                  <div className="mb-3">
                    <label className="form-label">Phone Number</label>
                    <input
                      name="phone_number"
                      type="text"
                      className="form-control"
                      value={addForm.phone_number}
                      onChange={handleAddChange}
                    />
                  </div>

                  {/* Email */}
                  <div className="mb-3">
                    <label className="form-label">Email (optional)</label>
                    <input
                      name="email"
                      type="email"
                      className="form-control"
                      value={addForm.email}
                      onChange={handleAddChange}
                    />
                  </div>

                  {/* Address */}
                  <div className="mb-3">
                    <label className="form-label">Address (optional)</label>
                    <textarea
                      name="address"
                      className="form-control"
                      rows="2"
                      value={addForm.address}
                      onChange={handleAddChange}
                    />
                  </div>

                  {/* Notes */}
                  <div className="mb-3">
                    <label className="form-label">Notes (optional)</label>
                    <textarea
                      name="notes"
                      className="form-control"
                      rows="2"
                      value={addForm.notes}
                      onChange={handleAddChange}
                    />
                  </div>

                  {/* Visit Date */}
                  <div className="mb-3">
                    <label className="form-label">Visit Date</label>
                    <input
                      name="visit_date"
                      type="date"
                      className="form-control"
                      value={addForm.visit_date}
                      onChange={handleAddChange}
                    />
                  </div>

                  {/* Working Group (pre-selected) */}
                  <div className="mb-3">
                    <label className="form-label">Working Group</label>
                    <select
                      name="working_group_id"
                      className="form-select"
                      value={addForm.working_group_id}
                      onChange={handleAddChange}
                    >
                      <option value="">— Select WG —</option>
                      {workingGroups.map(wg => (
                        <option key={wg.id} value={wg.id}>
                          {wg.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="modal-footer">
                  {addLoading ? (
                    <div className="spinner-border text-primary" role="status" />
                  ) : (
                    <>
                      <button
                        type="button"
                        className="btn btn-secondary"
                        data-bs-dismiss="modal"
                      >
                        Cancel
                      </button>
                      <button type="submit" className="btn btn-primary">
                        Save Customer
                      </button>
                    </>
                  )}
                </div>
              </form>
            </div>
          </div>
        </div>

        {/* — Product Selection Modal — */}
        <div className="modal fade" id="ProductModal" tabIndex={-1} aria-hidden="true">
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content radius-16 bg-base">

              {/* Header */}
              <div className="modal-header tw-py-3 tw-px-4 tw-border-0">
                <h5 className="modal-title">Select a Product</h5>
                <button type="button" className="btn-close" data-bs-dismiss="modal" />
              </div>

              {/* Search bar */}
              <div className="tw-px-4 tw-pb-2">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search products…"
                  value={productSearch}
                  onChange={e => {
                    setProductSearch(e.target.value);
                    // if user starts typing, show grid again
                  }}
                />
              </div>

              {/* Products grid */}
              {(
                !selectedProduct ||                // no product chosen yet
                productSearch.trim() !== ''        // OR user is searching
              ) && (
                  <div className="modal-body tw-px-4 tw-pt-0" style={{ maxHeight: '40vh', overflowY: 'auto' }}>
                    {wgProducts.filter(p =>
                      p.name.toLowerCase().includes(productSearch.toLowerCase())
                    ).length === 0 ? (
                      <p className="text-center text-gray-500 py-8">
                        No products match “{productSearch}.”
                      </p>
                    ) : (
                      <div className="tw-grid tw-grid-cols-1 sm:tw-grid-cols-2 lg:tw-grid-cols-3 tw-gap-4">
                        {wgProducts
                          .filter(p =>
                            p.name.toLowerCase().includes(productSearch.toLowerCase())
                          )
                          .map(p => (
                            <div
                              key={p.id}
                              className={`tw-p-3 tw-border tw-rounded tw-cursor-pointer ${selectedProduct?.id === p.id
                                ? 'tw-border-blue-500 tw-bg-blue-50'
                                : 'hover:tw-shadow'
                                }`}
                              onClick={() => {
                                setSelectedProduct(p);
                                setProductSearch('');
                              }}
                            >
                              {p.images[0] && (
                                <img
                                  src={p.images[0].image_url}
                                  alt={p.name}
                                  className="tw-mb-2 tw-w-full tw-h-24 tw-object-cover tw-rounded"
                                />
                              )}
                              <h6 className="tw-font-semibold">{p.name}</h6>
                              <p className="tw-text-sm tw-text-gray-600">
                                {p.categories.map(c => c.name).join(', ')}
                              </p>
                              <p className="tw-mt-1">{p.unit_of_measure}</p>
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                )}

              {/* Pricing pane (only when a product is chosen AND search is empty) */}
              {selectedProduct && productSearch.trim() === '' && (
                <>
                  <div className="tw-border-t" />
                  <div className="tw-px-4 tw-pt-4">
                    <nav className="tw-flex tw-border-b">
                      <ul
                        className="nav bordered-tab border border-top-0 border-start-0 border-end-0 d-inline-flex nav-pills mb-16"
                        id="pills-tab"
                        role="tablist"
                      >
                        <li className="nav-item" role="presentation">
                          <button
                            className={`nav-link px-16 py-10 ${selectedProduct.pricing_method === 'standard' ? 'active' : ''}`}
                            id="pills-home-tab"
                            data-bs-toggle="pill"
                            data-bs-target="#pills-standard"
                            type="button"
                            role="tab"
                            aria-controls="pills-home"
                            aria-selected="true"
                          >
                            Standard Pricing
                          </button>
                        </li>
                        <li className="nav-item" role="presentation">
                          <button
                            className={`nav-link px-16 py-10 ${selectedProduct.pricing_method === 'roll' ? 'active' : ''}`}
                            id="pills-profile-tab"
                            data-bs-toggle="pill"
                            data-bs-target="#pills-roll"
                            type="button"
                            role="tab"
                            aria-controls="pills-profile"
                            aria-selected="false"
                          >
                            Roll-Based Pricing
                          </button>
                        </li>
                      </ul>
                    </nav>
                    <div className="tab-content" id="pills-tabContent">

                      <div
                        className={`tab-pane fade show ${selectedProduct.pricing_method === 'standard' ? 'active' : ''}`}
                        id="pills-standard"
                        role="tabpanel"
                        aria-labelledby="pills-standard-tab"
                        tabIndex={0}
                      >
                        {/* Product title & description */}
                        <div className="tw-font-semibold tw-text-xl mb-4">{selectedProduct.name}</div>
                        <div
                          className="tw-text-sm tw-text-gray-500 mb-6"
                          dangerouslySetInnerHTML={{ __html: selectedProduct.meta_description || 'No description.' }}
                        />

                        {/* Editable Unit Price */}
                        <div className="mb-4">
                          <label className="form-label">Unit Price</label>
                          <input
                            type="number"
                            step="0.01"
                            onWheel={e => e.currentTarget.blur()}
                            className="form-control"
                            value={modalForm.unitPrice}
                            onChange={e =>
                              setModalForm(f => ({
                                ...f,
                                unitPrice: parseFloat(e.target.value) || 0,
                              }))
                            }
                          />
                        </div>

                        {/* Variants */}
                        {groupedVariants.map(group => {
                          const sel = modalForm.selectedVariants[group.name];
                          const opt = group.options.find(o => o.value === sel);
                          return (
                            <div key={group.name} className="mb-4">
                              <div className="tw-font-semibold mb-2">{group.label}</div>
                              <div className="tw-flex tw-flex-wrap tw-gap-2">
                                {group.options.map(o => {
                                  const isSelected = sel === o.value;
                                  return (
                                    <button
                                      key={o.value}
                                      type="button"
                                      className={`tw-px-4 tw-py-1 tw-rounded tw-border ${isSelected
                                        ? 'tw-bg-blue-600 tw-text-white'
                                        : 'tw-border-gray-400 tw-text-gray-800'
                                        }`}
                                      onClick={() => {
                                        // toggle variant
                                        setModalForm(f => {
                                          const currently = f.selectedVariants[group.name] === o.value;
                                          const next = currently ? null : o.value;
                                          const delta = currently ? -o.priceAdjustment : o.priceAdjustment;
                                          return {
                                            ...f,
                                            selectedVariants: {
                                              ...f.selectedVariants,
                                              [group.name]: next,
                                            },
                                            unitPrice: Math.max(0, f.unitPrice + delta),
                                          };
                                        });
                                      }}
                                    >
                                      {o.value}
                                      {o.priceAdjustment > 0 && ` (+${o.priceAdjustment})`}
                                    </button>
                                  );
                                })}
                              </div>

                              {/* Subvariants */}
                              {opt?.subvariants.length > 0 && (
                                <div className="tw-mt-2 tw-flex tw-flex-wrap tw-gap-2">
                                  <div className="tw-font-medium tw-mr-2">{opt.subLabel}</div>
                                  {opt.subvariants.map(sv => {
                                    const key = `${group.name}-sub`;
                                    const isSub = modalForm.selectedVariants[key] === sv.value;
                                    return (
                                      <button
                                        key={sv.value}
                                        type="button"
                                        className={`tw-px-4 tw-py-1 tw-rounded tw-border ${isSub
                                          ? 'tw-bg-blue-600 tw-text-white'
                                          : 'tw-border-gray-400 tw-text-gray-800'
                                          }`}
                                        onClick={() => {
                                          setModalForm(f => {
                                            const currently = f.selectedVariants[key] === sv.value;
                                            const next = currently ? null : sv.value;
                                            const delta = currently ? -sv.priceAdjustment : sv.priceAdjustment;
                                            return {
                                              ...f,
                                              selectedVariants: {
                                                ...f.selectedVariants,
                                                [key]: next,
                                              },
                                              unitPrice: Math.max(0, f.unitPrice + delta),
                                            };
                                          });
                                        }}
                                      >
                                        {sv.value}
                                        {sv.priceAdjustment > 0 && ` (+${sv.priceAdjustment})`}
                                      </button>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          );
                        })}

                        {/* Quantity */}
                        <div className="mb-4">
                          <label className="form-label">Quantity</label>
                          <input
                            type="number"
                            onWheel={e => e.currentTarget.blur()}
                            className="form-control"
                            value={modalForm.quantity}
                            onChange={e =>
                              setModalForm(f => ({
                                ...f,
                                quantity: parseInt(e.target.value, 10) || 1,
                              }))
                            }
                          />
                        </div>

                        {/* Description */}
                        <div className="mb-4">
                          <label className="form-label">Description</label>
                          <textarea
                            className="form-control"
                            rows="3"
                            value={modalForm.description}
                            onChange={e =>
                              setModalForm(f => ({ ...f, description: e.target.value }))
                            }
                          />
                        </div>
                      </div>

                      {/* — Roll-Based Pricing Pane — */}
                      <div
                        className={`tab-pane fade show ${selectedProduct.pricing_method === 'roll' ? 'active' : ''}`}
                        id="pills-roll"
                        role="tabpanel"
                        aria-labelledby="pills-roll-tab"
                        tabIndex={0}
                      >
                        {/* Product Title & Description */}
                        <div className="tw-font-semibold tw-text-xl mb-4">{selectedProduct.name}</div>
                        <div
                          className="tw-text-sm tw-text-gray-500 mb-6"
                          dangerouslySetInnerHTML={{
                            __html: selectedProduct.meta_description || 'No description available.',
                          }}
                        />

                        {/* Price per Sq.Ft */}
                        <div className="mb-3">
                          <label className="form-label">Price per Sq.Ft</label>
                          <input
                            type="number"
                            onWheel={e => e.currentTarget.blur()}
                            className="form-control"
                            value={selectedProduct.price_per_sqft}
                            readOnly
                          />
                        </div>

                        {/* Choose Roll */}
                        <div className="mb-3">
                          <label className="form-label">Choose Roll</label>
                          <select
                            className="form-select"
                            value={selectedRollId || ''}
                            onChange={e => {
                              const roll = rolls.find(r => r.id == e.target.value)
                              setSelectedRollId(roll?.id)
                              setModalForm(m => ({
                                ...m,
                                rollSizeInches: roll?.roll_width || 0,
                                pricePerOffcutSqFt: roll?.offcut_price || 0,
                              }))
                            }}
                          >
                            <option value="" disabled>— Select a Roll —</option>
                            {rolls.map(r => (
                              <option key={r.id} value={r.id}>
                                {`${r.roll_type} (${r.roll_size}" ) — LKR${parseFloat(r.price_rate_per_sqft).toFixed(2)}/ft²`}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Price per Offcut Sq.Ft */}
                        <div className="mb-3">
                          <label className="form-label">Price per Offcut Sq.Ft</label>
                          <input
                            type="number"
                            onWheel={e => e.currentTarget.blur()}
                            className="form-control"
                            value={modalForm.pricePerOffcutSqFt}
                            onChange={e =>
                              setModalForm(m => ({
                                ...m,
                                pricePerOffcutSqFt: parseFloat(e.target.value) || 0
                              }))
                            }
                          />
                        </div>

                        {/* Fixed Width (inches) */}
                        <div className="mb-3">
                          <label className="form-label">Fixed Width (in)</label>
                          <input
                            type="number" step="0.01"
                            onWheel={e => e.currentTarget.blur()}
                            className="form-control"
                            value={modalForm.fixedWidthIn}
                            onChange={e =>
                              setModalForm(m => ({
                                ...m,
                                fixedWidthIn: parseFloat(e.target.value) || 0
                              }))
                            }
                          />
                        </div>

                        {/* Height (inches) */}
                        <div className="mb-3">
                          <label className="form-label">Height (in)</label>
                          <input
                            type="number" step="0.01"
                            onWheel={e => e.currentTarget.blur()}
                            className="form-control"
                            value={modalForm.heightIn}
                            onChange={e =>
                              setModalForm(m => ({
                                ...m,
                                heightIn: parseFloat(e.target.value) || 0
                              }))
                            }
                          />
                        </div>

                        {/* Description */}
                        <div className="mb-3">
                          <label className="form-label">Description</label>
                          <textarea
                            className="form-control"
                            rows={3}
                            value={modalForm.description}
                            onChange={e =>
                              setModalForm(m => ({ ...m, description: e.target.value }))
                            }
                          />
                        </div>

                        {/* Quantity */}
                        <div className="mb-3">
                          <label className="form-label">Quantity</label>
                          <input
                            type="number"
                            onWheel={e => e.currentTarget.blur()}
                            className="form-control"
                            value={modalForm.quantity}
                            onChange={e =>
                              setModalForm(m => ({
                                ...m,
                                quantity: parseInt(e.target.value, 10) || 1
                              }))
                            }
                          />
                        </div>

                        {/* Live Calculation Preview */}
                        {(modalForm.fixedWidthIn > 0 && modalForm.heightIn > 0) && (() => {
                          // convert to feet
                          const w_ft = modalForm.fixedWidthIn / 12
                          const h_ft = modalForm.heightIn / 12

                          const fixedAreaFt2 = w_ft * h_ft
                          const rollWidthIn = modalForm.rollSizeInches * 12
                          const offcutWidthIn = rollWidthIn - modalForm.fixedWidthIn
                          const offcutWidthFt = offcutWidthIn / 12
                          const offcutAreaFt2 = offcutWidthFt * h_ft

                          const pRoll = selectedProduct.price_per_sqft
                          const pOffcut = modalForm.pricePerOffcutSqFt

                          const areaPrice = fixedAreaFt2 * pRoll
                          const offcutPrice = offcutAreaFt2 * pOffcut
                          const printPrice = areaPrice + offcutPrice
                          const unitPrice = printPrice * modalForm.quantity

                          return (

                            <div className="p-3 bg-gray-100 rounded mb-4">
                              <table className="table table-sm mb-0">
                                <tbody>
                                  <tr><td>Fixed Area:</td>           <td>{fixedAreaFt2.toFixed(2)} ft²</td></tr>
                                  <tr><td>Offcut Area:</td>          <td>{offcutAreaFt2.toFixed(2)} ft²</td></tr>
                                  <tr><td>Area Price:</td>           <td>LKR {areaPrice.toFixed(2)}</td></tr>
                                  <tr><td>Offcut Price:</td>         <td>LKR {offcutPrice.toFixed(2)}</td></tr>
                                  <tr><td>Print Price:</td>          <td>LKR {printPrice.toFixed(2)}</td></tr>
                                  <tr><td>Unit × Qty:</td>            <td>LKR {unitPrice.toFixed(2)}</td></tr>
                                </tbody>
                              </table>
                            </div>
                          )
                        })()}

                        {/* — end roll pane — */}
                      </div>



                    </div>

                  </div>
                </>
              )}

              {/* Footer */}
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" data-bs-dismiss="modal"
                  onClick={() => {// close modal
                    document.querySelector('#ProductModal .btn-close').click();

                    // clear selection for next time
                    setSelectedProduct(null);
                    setProductSearch('');
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  disabled={!selectedProduct}
                  onClick={() => {
                    const isRoll = selectedProduct.pricing_method === 'roll';

                    if (isRoll && modalForm.fixedWidthIn > modalForm.rollSizeInches * 12) {
                      setAlert({
                        type: 'danger',
                        message: `Fixed width (${modalForm.fixedWidthIn}") cannot exceed roll width (${modalForm.rollSizeInches * 12}").`
                      });
                      return; // bail out before doing any calculation
                    }

                    // 1) if standard, build variants as before
                    const variants = isRoll
                      ? []
                      : groupedVariants.flatMap(group => {
                        const value = modalForm.selectedVariants[group.name];
                        if (!value) return [];
                        const option = group.options.find(o => o.value === value);
                        const subKey = `${group.name}-sub`;
                        const subValue = modalForm.selectedVariants[subKey];
                        const subList = option.subvariants
                          .filter(sv => sv.value === subValue)
                          .map(sv => ({
                            subvariant_name: group.subLabel,
                            subvariant_value: sv.value,
                            priceAdjustment: sv.priceAdjustment,
                          }));
                        return [{
                          variant_name: group.name,
                          variant_value: value,
                          priceAdjustment: option.priceAdjustment,
                          subvariants: subList,
                        }];
                      });

                    // 2) if roll-based, recalc the unit price and size
                    let calculatedUnitPrice = modalForm.unitPrice;
                    let sizeLabel = '';
                    if (isRoll) {
                      const w_ft = modalForm.fixedWidthIn / 12;
                      const h_ft = modalForm.heightIn / 12;
                      const fixedArea = w_ft * h_ft;
                      const offWIn = modalForm.rollSizeInches * 12 - modalForm.fixedWidthIn;
                      const offArea = (offWIn / 12) * h_ft;
                      const areaPrice = fixedArea * selectedProduct.price_per_sqft;
                      const offPrice = offArea * modalForm.pricePerOffcutSqFt;
                      const printPrice = areaPrice + offPrice;
                      calculatedUnitPrice = printPrice
                      sizeLabel = `${modalForm.fixedWidthIn}" × ${modalForm.heightIn}"`;
                    }

                    // 3) assemble the new item
                    const newItem = {
                      description: modalForm.description,
                      qty: modalForm.quantity,
                      unit: selectedProduct.unit_of_measure,
                      unit_price: calculatedUnitPrice,
                      product_name: selectedProduct.name,
                      base_price: isRoll
                        ? undefined
                        : selectedProduct.pricing_method === 'standard'
                          ? selectedProduct.price
                          : selectedProduct.price_per_sqft,
                      variants: variants,
                      // only for roll:
                      isRoll,
                      ...(isRoll && { size: sizeLabel }),
                      tempId: Math.random().toString(36).substr(2, 8),
                    };

                    // 4) push into your form
                    setForm(f => ({
                      ...f,
                      items: [...f.items, newItem],
                    }));

                    // 5) close/reset
                    document.querySelector('#ProductModal .btn-close').click();
                    setSelectedProduct(null);
                    setProductSearch('');
                  }}
                >
                  Add to Quote
                </button>
              </div>
            </div>
          </div>
        </div>


      </AdminDashboard >

      <CookiesV />
    </>
  );
};

export default AddE;
