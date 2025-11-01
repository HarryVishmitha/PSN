import { router } from '@inertiajs/react';
import { useEffect, useState } from 'react';

const formatCurrency = (value) => {
    const amount = Number(value || 0);
    return `LKR ${amount.toLocaleString('en-LK', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })}`;
};

export default function PaymentRequestPanel({ order }) {
    const [paymentRequests, setPaymentRequests] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showMarkPaidModal, setShowMarkPaidModal] = useState(false);
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [totals, setTotals] = useState({
        total_requested: 0,
        total_paid: 0,
        pending_count: 0,
    });

    // Form states
    const [createForm, setCreateForm] = useState({
        amount_requested: '',
        due_date: '',
        notes: '',
        admin_notes: '',
    });
    const [markPaidForm, setMarkPaidForm] = useState({
        amount_paid: '',
        payment_method: '',
        reference_number: '',
        admin_notes: '',
    });
    const [cancelForm, setCancelForm] = useState({ reason: '' });

    // Fetch payment requests
    const fetchPaymentRequests = async () => {
        setLoading(true);
        try {
            const response = await fetch(
                `/admin/api/orders/${order.id}/payment-requests`,
            );
            const data = await response.json();
            setPaymentRequests(data.payment_requests);
            setTotals({
                total_requested: data.total_requested,
                total_paid: data.total_paid,
                pending_count: data.pending_count,
            });
        } catch (error) {
            console.error('Failed to fetch payment requests:', error);
        } finally {
            setLoading(false);
        }
    };

    // Create payment request
    const handleCreate = async () => {
        try {
            const response = await fetch(
                `/admin/api/orders/${order.id}/payment-requests`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-TOKEN': document.querySelector(
                            'meta[name="csrf-token"]',
                        ).content,
                    },
                    body: JSON.stringify(createForm),
                },
            );

            if (!response.ok) {
                const error = await response.json();
                alert(error.message || 'Failed to create payment request');
                return;
            }

            setShowCreateModal(false);
            setCreateForm({
                amount_requested: '',
                due_date: '',
                notes: '',
                admin_notes: '',
            });
            fetchPaymentRequests();
            router.reload({ only: ['order'] });
        } catch (error) {
            alert('Failed to create payment request');
        }
    };

    // Mark as paid
    const handleMarkPaid = async () => {
        try {
            const response = await fetch(
                `/admin/api/orders/${order.id}/payment-requests/${selectedRequest.id}/mark-paid`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-TOKEN': document.querySelector(
                            'meta[name="csrf-token"]',
                        ).content,
                    },
                    body: JSON.stringify(markPaidForm),
                },
            );

            if (!response.ok) {
                const error = await response.json();
                alert(error.message || 'Failed to record payment');
                return;
            }

            setShowMarkPaidModal(false);
            setMarkPaidForm({
                amount_paid: '',
                payment_method: '',
                reference_number: '',
                admin_notes: '',
            });
            setSelectedRequest(null);
            fetchPaymentRequests();
            router.reload({ only: ['order'] });
        } catch (error) {
            alert('Failed to record payment');
        }
    };

    // Cancel payment request
    const handleCancel = async () => {
        try {
            const response = await fetch(
                `/admin/api/orders/${order.id}/payment-requests/${selectedRequest.id}/cancel`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-TOKEN': document.querySelector(
                            'meta[name="csrf-token"]',
                        ).content,
                    },
                    body: JSON.stringify(cancelForm),
                },
            );

            if (!response.ok) {
                const error = await response.json();
                alert(error.message || 'Failed to cancel payment request');
                return;
            }

            setShowCancelModal(false);
            setCancelForm({ reason: '' });
            setSelectedRequest(null);
            fetchPaymentRequests();
            router.reload({ only: ['order'] });
        } catch (error) {
            alert('Failed to cancel payment request');
        }
    };

    // Delete payment request
    const handleDelete = async (request) => {
        if (!confirm('Are you sure you want to delete this payment request?'))
            return;

        try {
            const response = await fetch(
                `/admin/api/orders/${order.id}/payment-requests/${request.id}`,
                {
                    method: 'DELETE',
                    headers: {
                        'X-CSRF-TOKEN': document.querySelector(
                            'meta[name="csrf-token"]',
                        ).content,
                    },
                },
            );

            if (!response.ok) {
                const error = await response.json();
                alert(error.message || 'Failed to delete payment request');
                return;
            }

            fetchPaymentRequests();
            router.reload({ only: ['order'] });
        } catch (error) {
            alert('Failed to delete payment request');
        }
    };

    // Status badge color
    const getStatusBadge = (status, isOverdue) => {
        if (isOverdue)
            return (
                <span className="tw-inline-flex tw-items-center tw-rounded-full tw-bg-red-50 tw-px-2 tw-py-1 tw-text-xs tw-font-medium tw-text-red-700 tw-ring-1 tw-ring-inset tw-ring-red-600/20">
                    Overdue
                </span>
            );

        const colors = {
            pending: 'tw-bg-yellow-50 tw-text-yellow-700 tw-ring-yellow-600/20',
            paid: 'tw-bg-green-50 tw-text-green-700 tw-ring-green-600/20',
            partially_paid:
                'tw-bg-blue-50 tw-text-blue-700 tw-ring-blue-600/20',
            cancelled: 'tw-bg-gray-50 tw-text-gray-700 tw-ring-gray-600/20',
            overdue: 'tw-bg-red-50 tw-text-red-700 tw-ring-red-600/20',
        };

        return (
            <span
                className={`tw-inline-flex tw-items-center tw-rounded-full tw-px-2 tw-py-1 tw-text-xs tw-font-medium tw-ring-1 tw-ring-inset ${colors[status]}`}
            >
                {status.replace('_', ' ')}
            </span>
        );
    };

    // Load payment requests on mount
    useEffect(() => {
        fetchPaymentRequests();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <div className="tw-rounded-lg tw-bg-white tw-p-6 tw-shadow">
            <div className="tw-mb-6 tw-flex tw-items-center tw-justify-between">
                <h2 className="tw-text-lg tw-font-semibold tw-text-gray-900">
                    Payment Requests
                </h2>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="tw-inline-flex tw-items-center tw-rounded-md tw-bg-indigo-600 tw-px-3 tw-py-2 tw-text-sm tw-font-semibold tw-text-white hover:tw-bg-indigo-500"
                >
                    New Payment Request
                </button>
            </div>

            {/* Summary Cards */}
            <div className="tw-mb-6 tw-grid tw-grid-cols-3 tw-gap-4">
                <div className="tw-rounded-lg tw-bg-gray-50 tw-p-4">
                    <p className="tw-text-sm tw-text-gray-600">
                        Total Requested
                    </p>
                    <p className="tw-text-xl tw-font-semibold tw-text-gray-900">
                        {formatCurrency(totals.total_requested)}
                    </p>
                </div>
                <div className="tw-rounded-lg tw-bg-gray-50 tw-p-4">
                    <p className="tw-text-sm tw-text-gray-600">Total Paid</p>
                    <p className="tw-text-xl tw-font-semibold tw-text-green-600">
                        {formatCurrency(totals.total_paid)}
                    </p>
                </div>
                <div className="tw-rounded-lg tw-bg-gray-50 tw-p-4">
                    <p className="tw-text-sm tw-text-gray-600">Pending</p>
                    <p className="tw-text-xl tw-font-semibold tw-text-yellow-600">
                        {totals.pending_count}
                    </p>
                </div>
            </div>

            {/* Payment Requests List */}
            {loading ? (
                <div className="tw-py-8 tw-text-center tw-text-gray-500">
                    Loading...
                </div>
            ) : paymentRequests.length === 0 ? (
                <div className="tw-py-8 tw-text-center tw-text-gray-500">
                    No payment requests yet
                </div>
            ) : (
                <div className="tw-space-y-4">
                    {paymentRequests.map((request) => (
                        <div
                            key={request.id}
                            className="tw-rounded-lg tw-border tw-border-gray-200 tw-bg-gray-50 tw-p-4"
                        >
                            <div className="tw-mb-3 tw-flex tw-items-start tw-justify-between">
                                <div className="tw-flex-1">
                                    <div className="tw-mb-1 tw-flex tw-items-center tw-gap-2">
                                        <span className="tw-font-semibold tw-text-gray-900">
                                            {formatCurrency(
                                                request.amount_requested,
                                            )}
                                        </span>
                                        {getStatusBadge(
                                            request.status,
                                            request.is_overdue,
                                        )}
                                    </div>
                                    {request.due_date && (
                                        <p className="tw-text-sm tw-text-gray-600">
                                            Due: {request.due_date}
                                        </p>
                                    )}
                                </div>

                                <div className="tw-flex tw-gap-2">
                                    {request.status === 'pending' && (
                                        <>
                                            <button
                                                onClick={() => {
                                                    setSelectedRequest(request);
                                                    setMarkPaidForm({
                                                        amount_paid:
                                                            request.remaining_amount,
                                                        payment_method: '',
                                                        reference_number: '',
                                                        admin_notes: '',
                                                    });
                                                    setShowMarkPaidModal(true);
                                                }}
                                                className="tw-text-sm tw-font-medium tw-text-green-600 hover:tw-text-green-900"
                                            >
                                                Mark Paid
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setSelectedRequest(request);
                                                    setShowCancelModal(true);
                                                }}
                                                className="tw-text-sm tw-font-medium tw-text-red-600 hover:tw-text-red-900"
                                            >
                                                Cancel
                                            </button>
                                        </>
                                    )}
                                    {request.status === 'partially_paid' && (
                                        <button
                                            onClick={() => {
                                                setSelectedRequest(request);
                                                setMarkPaidForm({
                                                    amount_paid:
                                                        request.remaining_amount,
                                                    payment_method: '',
                                                    reference_number: '',
                                                    admin_notes: '',
                                                });
                                                setShowMarkPaidModal(true);
                                            }}
                                            className="tw-text-sm tw-font-medium tw-text-green-600 hover:tw-text-green-900"
                                        >
                                            Record Payment
                                        </button>
                                    )}
                                    {request.amount_paid === 0 && (
                                        <button
                                            onClick={() =>
                                                handleDelete(request)
                                            }
                                            className="tw-text-sm tw-font-medium tw-text-gray-600 hover:tw-text-gray-900"
                                        >
                                            Delete
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Progress Bar */}
                            {request.status !== 'cancelled' && (
                                <div className="tw-mb-3">
                                    <div className="tw-mb-1 tw-flex tw-justify-between tw-text-xs tw-text-gray-600">
                                        <span>
                                            Paid:{' '}
                                            {formatCurrency(
                                                request.amount_paid,
                                            )}
                                        </span>
                                        <span>
                                            Remaining:{' '}
                                            {formatCurrency(
                                                request.remaining_amount,
                                            )}
                                        </span>
                                    </div>
                                    <div className="tw-h-2 tw-w-full tw-rounded-full tw-bg-gray-200">
                                        <div
                                            className={`tw-h-2 tw-rounded-full ${
                                                request.status === 'paid'
                                                    ? 'tw-bg-green-600'
                                                    : 'tw-bg-blue-600'
                                            }`}
                                            style={{
                                                width: `${request.payment_progress}%`,
                                            }}
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Details */}
                            <div className="tw-space-y-1 tw-text-sm tw-text-gray-600">
                                {request.notes && <p>Notes: {request.notes}</p>}
                                {request.payment_method && (
                                    <p>
                                        Payment Method: {request.payment_method}
                                    </p>
                                )}
                                {request.reference_number && (
                                    <p>Reference: {request.reference_number}</p>
                                )}
                                {request.paid_at && (
                                    <p>Paid At: {request.paid_at}</p>
                                )}
                                <p className="tw-text-xs">
                                    Requested by {request.requested_by} on{' '}
                                    {request.created_at}
                                </p>
                                {request.paid_by && (
                                    <p className="tw-text-xs">
                                        Marked paid by {request.paid_by}
                                    </p>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Create Modal */}
            {showCreateModal && (
                <div className="tw-fixed tw-inset-0 tw-z-50 tw-flex tw-items-center tw-justify-center tw-bg-gray-500 tw-bg-opacity-75">
                    <div className="tw-w-full tw-max-w-md tw-rounded-lg tw-bg-white tw-p-6">
                        <h3 className="tw-mb-4 tw-text-lg tw-font-semibold">
                            Create Payment Request
                        </h3>
                        <div className="tw-space-y-4">
                            <div>
                                <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700">
                                    Amount *
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={createForm.amount_requested}
                                    onChange={(e) =>
                                        setCreateForm({
                                            ...createForm,
                                            amount_requested: e.target.value,
                                        })
                                    }
                                    className="tw-mt-1 tw-block tw-w-full tw-rounded-md tw-border-gray-300 tw-shadow-sm focus:tw-border-indigo-500 focus:tw-ring-indigo-500"
                                />
                            </div>
                            <div>
                                <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700">
                                    Due Date
                                </label>
                                <input
                                    type="date"
                                    value={createForm.due_date}
                                    onChange={(e) =>
                                        setCreateForm({
                                            ...createForm,
                                            due_date: e.target.value,
                                        })
                                    }
                                    className="tw-mt-1 tw-block tw-w-full tw-rounded-md tw-border-gray-300 tw-shadow-sm focus:tw-border-indigo-500 focus:tw-ring-indigo-500"
                                />
                            </div>
                            <div>
                                <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700">
                                    Notes
                                </label>
                                <textarea
                                    value={createForm.notes}
                                    onChange={(e) =>
                                        setCreateForm({
                                            ...createForm,
                                            notes: e.target.value,
                                        })
                                    }
                                    rows={3}
                                    className="tw-mt-1 tw-block tw-w-full tw-rounded-md tw-border-gray-300 tw-shadow-sm focus:tw-border-indigo-500 focus:tw-ring-indigo-500"
                                />
                            </div>
                            <div>
                                <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700">
                                    Admin Notes
                                </label>
                                <textarea
                                    value={createForm.admin_notes}
                                    onChange={(e) =>
                                        setCreateForm({
                                            ...createForm,
                                            admin_notes: e.target.value,
                                        })
                                    }
                                    rows={2}
                                    className="tw-mt-1 tw-block tw-w-full tw-rounded-md tw-border-gray-300 tw-shadow-sm focus:tw-border-indigo-500 focus:tw-ring-indigo-500"
                                />
                            </div>
                        </div>
                        <div className="tw-mt-6 tw-flex tw-justify-end tw-gap-2">
                            <button
                                onClick={() => setShowCreateModal(false)}
                                className="tw-rounded-md tw-px-4 tw-py-2 tw-text-sm tw-font-medium tw-text-gray-700 hover:tw-bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleCreate}
                                className="tw-rounded-md tw-bg-indigo-600 tw-px-4 tw-py-2 tw-text-sm tw-font-medium tw-text-white hover:tw-bg-indigo-500"
                            >
                                Create
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Mark Paid Modal */}
            {showMarkPaidModal && (
                <div className="tw-fixed tw-inset-0 tw-z-50 tw-flex tw-items-center tw-justify-center tw-bg-gray-500 tw-bg-opacity-75">
                    <div className="tw-w-full tw-max-w-md tw-rounded-lg tw-bg-white tw-p-6">
                        <h3 className="tw-mb-4 tw-text-lg tw-font-semibold">
                            Record Payment
                        </h3>
                        <div className="tw-space-y-4">
                            <div>
                                <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700">
                                    Amount Paid *
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={markPaidForm.amount_paid}
                                    onChange={(e) =>
                                        setMarkPaidForm({
                                            ...markPaidForm,
                                            amount_paid: e.target.value,
                                        })
                                    }
                                    className="tw-mt-1 tw-block tw-w-full tw-rounded-md tw-border-gray-300 tw-shadow-sm focus:tw-border-indigo-500 focus:tw-ring-indigo-500"
                                />
                                <p className="tw-mt-1 tw-text-xs tw-text-gray-500">
                                    Max:{' '}
                                    {formatCurrency(
                                        selectedRequest?.remaining_amount || 0,
                                    )}
                                </p>
                            </div>
                            <div>
                                <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700">
                                    Payment Method *
                                </label>
                                <select
                                    value={markPaidForm.payment_method}
                                    onChange={(e) =>
                                        setMarkPaidForm({
                                            ...markPaidForm,
                                            payment_method: e.target.value,
                                        })
                                    }
                                    className="tw-mt-1 tw-block tw-w-full tw-rounded-md tw-border-gray-300 tw-shadow-sm focus:tw-border-indigo-500 focus:tw-ring-indigo-500"
                                >
                                    <option value="">Select method</option>
                                    <option value="bank_transfer">
                                        Bank Transfer
                                    </option>
                                    <option value="cash">Cash</option>
                                    <option value="cheque">Cheque</option>
                                    <option value="card">Card</option>
                                    <option value="online">
                                        Online Payment
                                    </option>
                                </select>
                            </div>
                            <div>
                                <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700">
                                    Reference Number
                                </label>
                                <input
                                    type="text"
                                    value={markPaidForm.reference_number}
                                    onChange={(e) =>
                                        setMarkPaidForm({
                                            ...markPaidForm,
                                            reference_number: e.target.value,
                                        })
                                    }
                                    className="tw-mt-1 tw-block tw-w-full tw-rounded-md tw-border-gray-300 tw-shadow-sm focus:tw-border-indigo-500 focus:tw-ring-indigo-500"
                                />
                            </div>
                            <div>
                                <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700">
                                    Admin Notes
                                </label>
                                <textarea
                                    value={markPaidForm.admin_notes}
                                    onChange={(e) =>
                                        setMarkPaidForm({
                                            ...markPaidForm,
                                            admin_notes: e.target.value,
                                        })
                                    }
                                    rows={2}
                                    className="tw-mt-1 tw-block tw-w-full tw-rounded-md tw-border-gray-300 tw-shadow-sm focus:tw-border-indigo-500 focus:tw-ring-indigo-500"
                                />
                            </div>
                        </div>
                        <div className="tw-mt-6 tw-flex tw-justify-end tw-gap-2">
                            <button
                                onClick={() => setShowMarkPaidModal(false)}
                                className="tw-rounded-md tw-px-4 tw-py-2 tw-text-sm tw-font-medium tw-text-gray-700 hover:tw-bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleMarkPaid}
                                className="tw-rounded-md tw-bg-green-600 tw-px-4 tw-py-2 tw-text-sm tw-font-medium tw-text-white hover:tw-bg-green-500"
                            >
                                Record Payment
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Cancel Modal */}
            {showCancelModal && (
                <div className="tw-fixed tw-inset-0 tw-z-50 tw-flex tw-items-center tw-justify-center tw-bg-gray-500 tw-bg-opacity-75">
                    <div className="tw-w-full tw-max-w-md tw-rounded-lg tw-bg-white tw-p-6">
                        <h3 className="tw-mb-4 tw-text-lg tw-font-semibold">
                            Cancel Payment Request
                        </h3>
                        <div className="tw-space-y-4">
                            <div>
                                <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700">
                                    Reason (optional)
                                </label>
                                <textarea
                                    value={cancelForm.reason}
                                    onChange={(e) =>
                                        setCancelForm({
                                            reason: e.target.value,
                                        })
                                    }
                                    rows={3}
                                    className="tw-mt-1 tw-block tw-w-full tw-rounded-md tw-border-gray-300 tw-shadow-sm focus:tw-border-indigo-500 focus:tw-ring-indigo-500"
                                />
                            </div>
                        </div>
                        <div className="tw-mt-6 tw-flex tw-justify-end tw-gap-2">
                            <button
                                onClick={() => setShowCancelModal(false)}
                                className="tw-rounded-md tw-px-4 tw-py-2 tw-text-sm tw-font-medium tw-text-gray-700 hover:tw-bg-gray-50"
                            >
                                Back
                            </button>
                            <button
                                onClick={handleCancel}
                                className="tw-rounded-md tw-bg-red-600 tw-px-4 tw-py-2 tw-text-sm tw-font-medium tw-text-white hover:tw-bg-red-500"
                            >
                                Cancel Request
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
