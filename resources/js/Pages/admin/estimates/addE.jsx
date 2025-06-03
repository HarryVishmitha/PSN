// resources/js/Pages/Admin/AddE.jsx
import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import AdminDashboard from '@/Layouts/AdminDashboard';
import Breadcrumb from '@/components/Breadcrumb';
import { Icon } from '@iconify/react';
import CookiesV from '@/Components/CookieConsent';
import Meta from '@/Components/Metaheads';

const AddE = ({ userDetails, workingGroups, estimate = null }) => {
  // If `estimate` is passed in via Inertia props when editing an existing estimate,
  // we prefill; otherwise we start with blank/new.
  const todayISO = new Date().toISOString().split('T')[0]; // "2025-06-03"
  const defaultForm = {
    id: estimate?.id || null,
    estimate_number: estimate?.estimate_number || '',
    working_group_id: estimate?.working_group_id || '',
    // --- Client + dates + notes ---
    client_name: estimate?.client_name || '',
    client_address: estimate?.client_address || '',
    client_phone: estimate?.client_phone || '',
    issue_date: estimate?.issue_date || todayISO,
    due_date: estimate?.due_date || todayISO,
    notes: estimate?.notes || '',
    // --- Line items (array of { description, qty, unit, unit_price }) ---
    items:
      estimate?.items.map((it) => ({
        description: it.description,
        qty: it.qty,
        unit: it.unit,
        unit_price: it.unit_price,
        tempId: Math.random().toString(36).substring(2, 8), // for React key
      })) || [
        {
          description: '',
          qty: 1,
          unit: '',
          unit_price: 0,
          tempId: Math.random().toString(36).substring(2, 8),
        },
      ],
  };

  const [form, setForm] = useState(defaultForm);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  // Track which field is “currently in edit mode.”
  // editingField can be one of:
  // 'issue_date', 'due_date', 'client_name', 'client_address', 'client_phone',
  // or `item-<index>-description`, `item-<index>-qty`, `item-<index>-unit`, `item-<index>-unit_price`.
  const [editingField, setEditingField] = useState(null);

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

  return (
    <>
      <Head title={form.id ? 'Edit Estimate' : 'Add New Estimate'} />
      <Meta
        title={form.id ? 'Edit Estimate - Admin Dashboard' : 'Add Estimate - Admin Dashboard'}
        description="Inline‐edit Estimate"
      />

      <AdminDashboard userDetails={userDetails}>
        <Breadcrumb title={form.id ? 'Edit Estimate' : 'Add New Estimate'} />

        <div className="card">
          <div className="card-header">
            <div className="d-flex flex-wrap align-items-center justify-content-end gap-2">
              <button
                type="button"
                className="btn btn-sm btn-primary-600 radius-8 d-inline-flex align-items-center gap-1"
                onClick={submit}
                disabled={loading}
              >
                <Icon icon="simple-line-icons:check" className="text-xl" />
                {loading ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>

          <div className="card-body py-40">
            {/* Errors Banner */}
            {Object.keys(errors).length > 0 && (
              <div className="alert alert-danger mb-4">
                <ul className="mb-0">
                  {Object.values(errors).map((errMsg, idx) => (
                    <li key={idx}>{errMsg}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="row justify-content-center" id="invoice">
              <div className="col-lg-8">
                <div className="shadow-4 border radius-8">
                  {/* Header (Estimate #, Dates, Company Info) */}
                  <div className="p-20 border-bottom">
                    <div className="row justify-content-between g-3">
                      {/* Left: Estimate #, Issue & Due */}
                      <div className="col-sm-4">
                        <h3 className="text-xl">
                          {form.estimate_number
                            ? `Estimate #${form.estimate_number}`
                            : 'Estimate #—'}
                        </h3>

                        {/* Issue Date */}
                        <p className="mb-1 text-sm d-flex align-items-center">
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
                      <div className="col-sm-4 text-end">
                        <img
                          src="/images/printairlogo.png"
                          alt="Printair Logo"
                          className="mb-8"
                          style={{ maxHeight: '60px' }}
                        />
                        <p className="mb-1 text-sm">
                          No. 67/D/1, Uggashena Road, Walpola, Ragama, Sri Lanka
                        </p>
                        <p className="mb-0 text-sm">
                          contact@printair.lk, &nbsp;+94 76 886 0175
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Body: “Issues For” + “Order Info” + Line Items + Totals */}
                  <div className="py-28 px-20">
                    <div className="d-flex flex-wrap justify-content-between align-items-end gap-3">
                      <div>
                        <h6 className="text-md">Issues For:</h6>
                        <table className="text-sm text-secondary-light">
                          <tbody>
                            {/* Client Name */}
                            <tr>
                              <td>Name</td>
                              <td className="ps-8 d-flex align-items-center">
                                {editingField === 'client_name' ? (
                                  <input
                                    name="client_name"
                                    type="text"
                                    className="form-control form-control-sm"
                                    value={form.client_name}
                                    onChange={handleTopLevelChange}
                                    onBlur={stopEditing}
                                    autoFocus
                                  />
                                ) : (
                                  <>
                                    <span className="editable text-decoration-underline">
                                      {form.client_name || '—'}
                                    </span>
                                    <span
                                      className="text-success-main ms-1"
                                      style={{ cursor: 'pointer' }}
                                      onClick={() => startEditing('client_name')}
                                    >
                                      <Icon icon="mage:edit" />
                                    </span>
                                  </>
                                )}
                              </td>
                            </tr>

                            {/* Client Address */}
                            <tr>
                              <td>Address</td>
                              <td className="ps-8 d-flex align-items-center">
                                {editingField === 'client_address' ? (
                                  <textarea
                                    name="client_address"
                                    className="form-control form-control-sm"
                                    rows={2}
                                    value={form.client_address}
                                    onChange={handleTopLevelChange}
                                    onBlur={stopEditing}
                                    autoFocus
                                  />
                                ) : (
                                  <>
                                    <span className="editable text-decoration-underline">
                                      {form.client_address || '—'}
                                    </span>
                                    <span
                                      className="text-success-main ms-1"
                                      style={{ cursor: 'pointer' }}
                                      onClick={() => startEditing('client_address')}
                                    >
                                      <Icon icon="mage:edit" />
                                    </span>
                                  </>
                                )}
                              </td>
                            </tr>

                            {/* Client Phone */}
                            <tr>
                              <td>Phone number</td>
                              <td className="ps-8 d-flex align-items-center">
                                {editingField === 'client_phone' ? (
                                  <input
                                    name="client_phone"
                                    type="tel"
                                    className="form-control form-control-sm"
                                    value={form.client_phone}
                                    onChange={handleTopLevelChange}
                                    onBlur={stopEditing}
                                    autoFocus
                                  />
                                ) : (
                                  <>
                                    <span className="editable text-decoration-underline">
                                      {form.client_phone || '—'}
                                    </span>
                                    <span
                                      className="text-success-main ms-1"
                                      style={{ cursor: 'pointer' }}
                                      onClick={() => startEditing('client_phone')}
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

                      {/* Right side “Order Info” (Issus Date, Order ID, Shipment ID) */}
                      <div>
                        <table className="text-sm text-secondary-light">
                          <tbody>
                            <tr>
                              <td>Issus Date</td>
                              <td className="ps-8">
                                {formatDateForDisplay(form.issue_date)}
                              </td>
                            </tr>
                            <tr>
                              <td>Order ID</td>
                              <td className="ps-8">
                                #{form.estimate_number || '—'}
                              </td>
                            </tr>
                            <tr>
                              <td>Shipment ID</td>
                              <td className="ps-8">
                                {estimate?.shipment_id
                                  ? `#${estimate.shipment_id}`
                                  : '—'}
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
                                      <span className="editable text-decoration-underline">
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
                                </td>

                                {/* Qty */}
                                <td>
                                  {editingField === `item-${idx}-qty` ? (
                                    <input
                                      type="number"
                                      min="0"
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
                                      className="form-control form-control-sm"
                                      value={item.unit_price}
                                      onChange={(e) =>
                                        handleItemChange(idx, 'unit_price', e.target.value)
                                      }
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
                                        onClick={() =>
                                          startEditing(`item-${idx}-unit_price`)
                                        }
                                      >
                                        <Icon icon="mage:edit" />
                                      </span>
                                    </div>
                                  )}
                                </td>

                                {/* Price = qty × unit_price (read‐only) */}
                                <td>${(item.qty * item.unit_price).toFixed(2)}</td>

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
                          onClick={addItem}
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
                                <td className="pe-64">Subtotal:</td>
                                <td className="pe-16">
                                  <span className="text-primary-light fw-semibold">
                                    ${subtotal.toFixed(2)}
                                  </span>
                                </td>
                              </tr>
                              <tr>
                                <td className="pe-64">Discount:</td>
                                <td className="pe-16">
                                  <span className="text-primary-light fw-semibold">
                                    ${discount.toFixed(2)}
                                  </span>
                                </td>
                              </tr>
                              <tr>
                                <td className="pe-64 border-bottom pb-4">Tax:</td>
                                <td className="pe-16 border-bottom pb-4">
                                  <span className="text-primary-light fw-semibold">
                                    {tax.toFixed(2)}
                                  </span>
                                </td>
                              </tr>
                              <tr>
                                <td className="pe-64 pt-4">
                                  <span className="text-primary-light fw-semibold">
                                    Total:
                                  </span>
                                </td>
                                <td className="pe-16 pt-4">
                                  <span className="text-primary-light fw-semibold">
                                    ${total.toFixed(2)}
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
      </AdminDashboard>

      <CookiesV />
    </>
  );
};

export default AddE;
