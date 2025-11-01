import Breadcrumb from '@/Components/Breadcrumb';
import AdminDashboard from '@/Layouts/AdminDashboard';
import { Icon } from '@iconify/react';
import { Head, router } from '@inertiajs/react';
import { useState } from 'react';

export default function TemplatesIndex({
    templates,
    filters,
    availableVariables,
    userDetails,
}) {
    const [search, setSearch] = useState(filters.search || '');
    const [selectedType, setSelectedType] = useState(filters.type || 'all');
    const [selectedCategory, setSelectedCategory] = useState(
        filters.category || 'all',
    );
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showPreviewModal, setShowPreviewModal] = useState(false);
    const [selectedTemplate, setSelectedTemplate] = useState(null);
    const [previewData, setPreviewData] = useState(null);

    const [formData, setFormData] = useState({
        type: 'email',
        name: '',
        subject: '',
        body: '',
        description: '',
        trigger_event: '',
        category: 'general',
        is_active: true,
    });

    const [errors, setErrors] = useState({});
    const [saving, setSaving] = useState(false);

    const typeColors = {
        email: 'tw-bg-blue-100 tw-text-blue-700 tw-border-blue-300',
        whatsapp: 'tw-bg-green-100 tw-text-green-700 tw-border-green-300',
    };

    const categoryColors = {
        general: 'tw-bg-gray-100 tw-text-gray-700',
        order: 'tw-bg-purple-100 tw-text-purple-700',
        payment: 'tw-bg-emerald-100 tw-text-emerald-700',
        notification: 'tw-bg-amber-100 tw-text-amber-700',
    };

    const applyFilters = (newFilters = {}) => {
        router.get(
            route('admin.templates.index'),
            {
                search,
                type: selectedType !== 'all' ? selectedType : undefined,
                category:
                    selectedCategory !== 'all' ? selectedCategory : undefined,
                ...newFilters,
            },
            {
                preserveState: true,
                preserveScroll: true,
            },
        );
    };

    const handleSearch = (e) => {
        e.preventDefault();
        applyFilters();
    };

    const openCreateModal = () => {
        setFormData({
            type: 'email',
            name: '',
            subject: '',
            body: '',
            description: '',
            trigger_event: '',
            category: 'general',
            is_active: true,
        });
        setErrors({});
        setShowCreateModal(true);
    };

    const openEditModal = async (template) => {
        try {
            const response = await fetch(`/admin/api/templates/${template.id}`);
            const data = await response.json();
            setSelectedTemplate(data.template);
            setFormData({
                type: data.template.type,
                name: data.template.name,
                subject: data.template.subject || '',
                body: data.template.body,
                description: data.template.description || '',
                trigger_event: data.template.trigger_event || '',
                category: data.template.category,
                is_active: data.template.is_active,
            });
            setErrors({});
            setShowEditModal(true);
        } catch (error) {
            alert('Failed to load template');
        }
    };

    const handleCreate = async () => {
        setSaving(true);
        try {
            const response = await fetch('/admin/api/templates', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector(
                        'meta[name="csrf-token"]',
                    ).content,
                },
                body: JSON.stringify(formData),
            });

            if (!response.ok) {
                const error = await response.json();
                setErrors(error.errors || {});
                alert(error.message || 'Failed to create template');
                return;
            }

            setShowCreateModal(false);
            router.reload();
        } catch (error) {
            alert('Failed to create template');
        } finally {
            setSaving(false);
        }
    };

    const handleUpdate = async () => {
        setSaving(true);
        try {
            const response = await fetch(
                `/admin/api/templates/${selectedTemplate.id}`,
                {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-TOKEN': document.querySelector(
                            'meta[name="csrf-token"]',
                        ).content,
                    },
                    body: JSON.stringify(formData),
                },
            );

            if (!response.ok) {
                const error = await response.json();
                setErrors(error.errors || {});
                alert(error.message || 'Failed to update template');
                return;
            }

            setShowEditModal(false);
            router.reload();
        } catch (error) {
            alert('Failed to update template');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (template) => {
        if (template.is_system) {
            alert('System templates cannot be deleted');
            return;
        }

        if (!confirm(`Are you sure you want to delete "${template.name}"?`))
            return;

        try {
            const response = await fetch(
                `/admin/api/templates/${template.id}`,
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
                alert(error.message || 'Failed to delete template');
                return;
            }

            router.reload();
        } catch (error) {
            alert('Failed to delete template');
        }
    };

    const handleDuplicate = async (template) => {
        const newName = prompt(
            'Enter name for duplicated template:',
            `${template.name} (Copy)`,
        );
        if (!newName) return;

        try {
            const response = await fetch(
                `/admin/api/templates/${template.id}/duplicate`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-TOKEN': document.querySelector(
                            'meta[name="csrf-token"]',
                        ).content,
                    },
                    body: JSON.stringify({ name: newName }),
                },
            );

            if (!response.ok) {
                const error = await response.json();
                alert(error.message || 'Failed to duplicate template');
                return;
            }

            router.reload();
        } catch (error) {
            alert('Failed to duplicate template');
        }
    };

    const handleToggleActive = async (template) => {
        try {
            const response = await fetch(
                `/admin/api/templates/${template.id}/toggle`,
                {
                    method: 'PATCH',
                    headers: {
                        'X-CSRF-TOKEN': document.querySelector(
                            'meta[name="csrf-token"]',
                        ).content,
                    },
                },
            );

            if (!response.ok) {
                alert('Failed to toggle template status');
                return;
            }

            router.reload();
        } catch (error) {
            alert('Failed to toggle template status');
        }
    };

    const handlePreview = async (template) => {
        try {
            const response = await fetch(
                `/admin/api/templates/${template.id}/preview`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-TOKEN': document.querySelector(
                            'meta[name="csrf-token"]',
                        ).content,
                    },
                },
            );

            const data = await response.json();
            setPreviewData(data);
            setSelectedTemplate(template);
            setShowPreviewModal(true);
        } catch (error) {
            alert('Failed to preview template');
        }
    };

    const insertVariable = (variable) => {
        const textarea = document.getElementById('template-body');
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const text = formData.body;
        const before = text.substring(0, start);
        const after = text.substring(end);

        setFormData({
            ...formData,
            body: before + `{{${variable}}}` + after,
        });

        setTimeout(() => {
            textarea.focus();
            const newPosition = start + variable.length + 4;
            textarea.setSelectionRange(newPosition, newPosition);
        }, 0);
    };

    return (
        <AdminDashboard userDetails={userDetails}>
            <Head title="Message Templates" />

            <div className="tw-mb-6">
                <Breadcrumb
                    title="Message Templates"
                    items={[
                        { label: 'Dashboard', href: route('admin.dashboard') },
                        { label: 'Templates' },
                    ]}
                />
            </div>

            {/* Header */}
            <div className="tw-mb-6 tw-flex tw-items-center tw-justify-between">
                <div>
                    <h1 className="tw-text-2xl tw-font-bold tw-text-gray-900">
                        Message Templates
                    </h1>
                    <p className="tw-mt-1 tw-text-sm tw-text-gray-600">
                        Manage email and WhatsApp message templates
                    </p>
                </div>
                <button
                    onClick={openCreateModal}
                    className="tw-inline-flex tw-items-center tw-gap-2 tw-rounded-lg tw-bg-indigo-600 tw-px-4 tw-py-2 tw-text-sm tw-font-semibold tw-text-white hover:tw-bg-indigo-500"
                >
                    <Icon icon="solar:add-circle-bold" className="tw-text-xl" />
                    New Template
                </button>
            </div>

            {/* Filters */}
            <div className="tw-mb-6 tw-rounded-lg tw-bg-white tw-p-4 tw-shadow">
                <form
                    onSubmit={handleSearch}
                    className="tw-flex tw-flex-wrap tw-gap-4"
                >
                    <div className="tw-min-w-[200px] tw-flex-1">
                        <input
                            type="text"
                            placeholder="Search templates..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="tw-w-full tw-rounded-md tw-border-gray-300 tw-shadow-sm focus:tw-border-indigo-500 focus:tw-ring-indigo-500"
                        />
                    </div>
                    <select
                        value={selectedType}
                        onChange={(e) => {
                            setSelectedType(e.target.value);
                            applyFilters({
                                type:
                                    e.target.value !== 'all'
                                        ? e.target.value
                                        : undefined,
                            });
                        }}
                        className="tw-rounded-md tw-border-gray-300 tw-shadow-sm focus:tw-border-indigo-500 focus:tw-ring-indigo-500"
                    >
                        <option value="all">All Types</option>
                        <option value="email">Email</option>
                        <option value="whatsapp">WhatsApp</option>
                    </select>
                    <select
                        value={selectedCategory}
                        onChange={(e) => {
                            setSelectedCategory(e.target.value);
                            applyFilters({
                                category:
                                    e.target.value !== 'all'
                                        ? e.target.value
                                        : undefined,
                            });
                        }}
                        className="tw-rounded-md tw-border-gray-300 tw-shadow-sm focus:tw-border-indigo-500 focus:tw-ring-indigo-500"
                    >
                        <option value="all">All Categories</option>
                        <option value="general">General</option>
                        <option value="order">Order</option>
                        <option value="payment">Payment</option>
                        <option value="notification">Notification</option>
                    </select>
                    <button
                        type="submit"
                        className="tw-rounded-md tw-bg-gray-100 tw-px-4 tw-py-2 tw-text-sm tw-font-medium tw-text-gray-700 hover:tw-bg-gray-200"
                    >
                        <Icon
                            icon="solar:magnifer-bold"
                            className="tw-inline tw-text-lg"
                        />
                    </button>
                </form>
            </div>

            {/* Templates Grid */}
            <div className="tw-grid tw-gap-6 md:tw-grid-cols-2 lg:tw-grid-cols-3">
                {templates.data.map((template) => (
                    <div
                        key={template.id}
                        className="tw-relative tw-rounded-lg tw-border-2 tw-border-gray-200 tw-bg-white tw-p-5 tw-shadow-sm hover:tw-shadow-md"
                    >
                        {/* Status Badge */}
                        <div className="tw-absolute tw-right-3 tw-top-3">
                            <button
                                onClick={() => handleToggleActive(template)}
                                className={`tw-rounded-full tw-px-2 tw-py-1 tw-text-xs tw-font-semibold ${
                                    template.is_active
                                        ? 'tw-bg-green-100 tw-text-green-700'
                                        : 'tw-bg-gray-100 tw-text-gray-500'
                                }`}
                            >
                                {template.is_active ? 'Active' : 'Inactive'}
                            </button>
                        </div>

                        {/* Template Info */}
                        <div className="tw-mb-4">
                            <div className="tw-mb-2 tw-flex tw-items-start tw-gap-2">
                                <span
                                    className={`tw-inline-flex tw-items-center tw-gap-1 tw-rounded-md tw-border tw-px-2 tw-py-1 tw-text-xs tw-font-semibold ${
                                        typeColors[template.type]
                                    }`}
                                >
                                    <Icon
                                        icon={
                                            template.type === 'email'
                                                ? 'solar:letter-bold'
                                                : 'solar:chat-round-dots-bold'
                                        }
                                    />
                                    {template.type}
                                </span>
                                <span
                                    className={`tw-rounded-md tw-px-2 tw-py-1 tw-text-xs tw-font-medium ${
                                        categoryColors[template.category]
                                    }`}
                                >
                                    {template.category}
                                </span>
                            </div>
                            <h3 className="tw-text-lg tw-font-semibold tw-text-gray-900">
                                {template.name}
                            </h3>
                            {template.description && (
                                <p className="tw-mt-1 tw-text-sm tw-text-gray-600">
                                    {template.description}
                                </p>
                            )}
                            {template.trigger_event && (
                                <p className="tw-mt-2 tw-text-xs tw-text-gray-500">
                                    Trigger: {template.trigger_event}
                                </p>
                            )}
                            {template.is_system && (
                                <div className="tw-mt-2 tw-inline-flex tw-items-center tw-gap-1 tw-rounded tw-bg-amber-100 tw-px-2 tw-py-1 tw-text-xs tw-font-medium tw-text-amber-700">
                                    <Icon icon="solar:lock-bold" />
                                    System Template
                                </div>
                            )}
                        </div>

                        {/* Actions */}
                        <div className="tw-flex tw-flex-wrap tw-gap-2">
                            <button
                                onClick={() => handlePreview(template)}
                                className="tw-text-sm tw-font-medium tw-text-blue-600 hover:tw-text-blue-900"
                            >
                                Preview
                            </button>
                            <button
                                onClick={() => openEditModal(template)}
                                className="tw-text-sm tw-font-medium tw-text-indigo-600 hover:tw-text-indigo-900"
                            >
                                Edit
                            </button>
                            <button
                                onClick={() => handleDuplicate(template)}
                                className="tw-text-sm tw-font-medium tw-text-green-600 hover:tw-text-green-900"
                            >
                                Duplicate
                            </button>
                            {!template.is_system && (
                                <button
                                    onClick={() => handleDelete(template)}
                                    className="tw-text-sm tw-font-medium tw-text-red-600 hover:tw-text-red-900"
                                >
                                    Delete
                                </button>
                            )}
                        </div>

                        {/* Meta */}
                        <div className="tw-mt-3 tw-border-t tw-pt-3 tw-text-xs tw-text-gray-500">
                            Created by {template.creator?.name || 'System'} •{' '}
                            {template.created_at}
                        </div>
                    </div>
                ))}
            </div>

            {/* Pagination */}
            {templates.last_page > 1 && (
                <div className="tw-mt-6 tw-flex tw-justify-center tw-gap-2">
                    {templates.links.map((link, index) => (
                        <button
                            key={index}
                            onClick={() => link.url && router.visit(link.url)}
                            disabled={!link.url}
                            className={`tw-rounded tw-px-3 tw-py-1 ${
                                link.active
                                    ? 'tw-bg-indigo-600 tw-text-white'
                                    : 'tw-bg-gray-100 tw-text-gray-700 hover:tw-bg-gray-200'
                            } ${!link.url && 'tw-cursor-not-allowed tw-opacity-50'}`}
                            dangerouslySetInnerHTML={{ __html: link.label }}
                        />
                    ))}
                </div>
            )}

            {/* Create/Edit Modal */}
            {(showCreateModal || showEditModal) && (
                <div className="tw-fixed tw-inset-0 tw-z-50 tw-flex tw-items-center tw-justify-center tw-bg-black tw-bg-opacity-50">
                    <div className="tw-max-h-[90vh] tw-w-full tw-max-w-4xl tw-overflow-y-auto tw-rounded-lg tw-bg-white tw-p-6">
                        <div className="tw-mb-4 tw-flex tw-items-center tw-justify-between">
                            <h2 className="tw-text-xl tw-font-bold">
                                {showCreateModal
                                    ? 'Create Template'
                                    : 'Edit Template'}
                            </h2>
                            <button
                                onClick={() => {
                                    setShowCreateModal(false);
                                    setShowEditModal(false);
                                }}
                                className="tw-text-gray-500 hover:tw-text-gray-700"
                            >
                                <Icon
                                    icon="solar:close-circle-bold"
                                    className="tw-text-2xl"
                                />
                            </button>
                        </div>

                        <div className="tw-grid tw-gap-4 md:tw-grid-cols-2">
                            {/* Left Column - Form Fields */}
                            <div className="tw-space-y-4">
                                <div>
                                    <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700">
                                        Type *
                                    </label>
                                    <select
                                        value={formData.type}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                type: e.target.value,
                                            })
                                        }
                                        className="tw-mt-1 tw-block tw-w-full tw-rounded-md tw-border-gray-300"
                                    >
                                        <option value="email">Email</option>
                                        <option value="whatsapp">
                                            WhatsApp
                                        </option>
                                    </select>
                                </div>

                                <div>
                                    <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700">
                                        Name *
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                name: e.target.value,
                                            })
                                        }
                                        className="tw-mt-1 tw-block tw-w-full tw-rounded-md tw-border-gray-300"
                                    />
                                    {errors.name && (
                                        <p className="tw-mt-1 tw-text-xs tw-text-red-600">
                                            {errors.name[0]}
                                        </p>
                                    )}
                                </div>

                                {formData.type === 'email' && (
                                    <div>
                                        <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700">
                                            Subject
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.subject}
                                            onChange={(e) =>
                                                setFormData({
                                                    ...formData,
                                                    subject: e.target.value,
                                                })
                                            }
                                            className="tw-mt-1 tw-block tw-w-full tw-rounded-md tw-border-gray-300"
                                        />
                                    </div>
                                )}

                                <div>
                                    <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700">
                                        Category *
                                    </label>
                                    <select
                                        value={formData.category}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                category: e.target.value,
                                            })
                                        }
                                        className="tw-mt-1 tw-block tw-w-full tw-rounded-md tw-border-gray-300"
                                    >
                                        <option value="general">General</option>
                                        <option value="order">Order</option>
                                        <option value="payment">Payment</option>
                                        <option value="notification">
                                            Notification
                                        </option>
                                    </select>
                                </div>

                                <div>
                                    <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700">
                                        Trigger Event
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.trigger_event}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                trigger_event: e.target.value,
                                            })
                                        }
                                        placeholder="e.g., order_placed"
                                        className="tw-mt-1 tw-block tw-w-full tw-rounded-md tw-border-gray-300"
                                    />
                                </div>

                                <div>
                                    <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700">
                                        Description
                                    </label>
                                    <textarea
                                        value={formData.description}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                description: e.target.value,
                                            })
                                        }
                                        rows={2}
                                        className="tw-mt-1 tw-block tw-w-full tw-rounded-md tw-border-gray-300"
                                    />
                                </div>

                                <div className="tw-flex tw-items-center">
                                    <input
                                        type="checkbox"
                                        id="is_active"
                                        checked={formData.is_active}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                is_active: e.target.checked,
                                            })
                                        }
                                        className="tw-h-4 tw-w-4 tw-rounded tw-border-gray-300 tw-text-indigo-600"
                                    />
                                    <label
                                        htmlFor="is_active"
                                        className="tw-ml-2 tw-text-sm tw-text-gray-700"
                                    >
                                        Active
                                    </label>
                                </div>
                            </div>

                            {/* Right Column - Body & Variables */}
                            <div className="tw-space-y-4">
                                <div>
                                    <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700">
                                        Template Body *
                                    </label>
                                    <textarea
                                        id="template-body"
                                        value={formData.body}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                body: e.target.value,
                                            })
                                        }
                                        rows={12}
                                        className="tw-mt-1 tw-block tw-w-full tw-rounded-md tw-border-gray-300 tw-font-mono tw-text-sm"
                                        placeholder="Use {{variable}} syntax for dynamic content"
                                    />
                                    {errors.body && (
                                        <p className="tw-mt-1 tw-text-xs tw-text-red-600">
                                            {errors.body[0]}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <label className="tw-mb-2 tw-block tw-text-sm tw-font-medium tw-text-gray-700">
                                        Available Variables
                                    </label>
                                    <div className="tw-max-h-48 tw-overflow-y-auto tw-rounded-md tw-border tw-border-gray-200 tw-p-2">
                                        <div className="tw-grid tw-grid-cols-2 tw-gap-1">
                                            {Object.entries(
                                                availableVariables,
                                            ).map(([key, label]) => (
                                                <button
                                                    key={key}
                                                    type="button"
                                                    onClick={() =>
                                                        insertVariable(key)
                                                    }
                                                    className="tw-rounded tw-bg-gray-100 tw-px-2 tw-py-1 tw-text-left tw-text-xs tw-text-gray-700 hover:tw-bg-indigo-100"
                                                    title={label}
                                                >
                                                    {key}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="tw-mt-6 tw-flex tw-justify-end tw-gap-2">
                            <button
                                onClick={() => {
                                    setShowCreateModal(false);
                                    setShowEditModal(false);
                                }}
                                className="tw-rounded-md tw-bg-gray-100 tw-px-4 tw-py-2 tw-text-sm tw-font-medium tw-text-gray-700 hover:tw-bg-gray-200"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={
                                    showCreateModal
                                        ? handleCreate
                                        : handleUpdate
                                }
                                disabled={saving}
                                className="tw-rounded-md tw-bg-indigo-600 tw-px-4 tw-py-2 tw-text-sm tw-font-medium tw-text-white hover:tw-bg-indigo-500 disabled:tw-opacity-50"
                            >
                                {saving
                                    ? 'Saving...'
                                    : showCreateModal
                                      ? 'Create'
                                      : 'Update'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Preview Modal */}
            {showPreviewModal && previewData && (
                <div className="tw-fixed tw-inset-0 tw-z-50 tw-flex tw-items-center tw-justify-center tw-bg-black tw-bg-opacity-50">
                    <div className="tw-max-h-[90vh] tw-w-full tw-max-w-3xl tw-overflow-y-auto tw-rounded-lg tw-bg-white tw-p-6">
                        <div className="tw-mb-4 tw-flex tw-items-center tw-justify-between">
                            <h2 className="tw-text-xl tw-font-bold">
                                Preview: {selectedTemplate.name}
                            </h2>
                            <button
                                onClick={() => setShowPreviewModal(false)}
                                className="tw-text-gray-500 hover:tw-text-gray-700"
                            >
                                <Icon
                                    icon="solar:close-circle-bold"
                                    className="tw-text-2xl"
                                />
                            </button>
                        </div>

                        <div className="tw-space-y-4">
                            {previewData.subject && (
                                <div>
                                    <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700">
                                        Subject:
                                    </label>
                                    <div className="tw-mt-1 tw-rounded-md tw-bg-gray-50 tw-p-3 tw-font-semibold">
                                        {previewData.subject}
                                    </div>
                                </div>
                            )}

                            <div>
                                <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700">
                                    Body:
                                </label>
                                <div className="tw-mt-1 tw-whitespace-pre-wrap tw-rounded-md tw-border tw-border-gray-200 tw-bg-white tw-p-4">
                                    {previewData.body}
                                </div>
                            </div>

                            <div>
                                <label className="tw-mb-2 tw-block tw-text-sm tw-font-medium tw-text-gray-700">
                                    Variables Used:
                                </label>
                                <div className="tw-flex tw-flex-wrap tw-gap-2">
                                    {previewData.variables?.map((variable) => (
                                        <span
                                            key={variable}
                                            className="tw-rounded-full tw-bg-blue-100 tw-px-3 tw-py-1 tw-text-xs tw-font-medium tw-text-blue-700"
                                        >
                                            {variable}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="tw-mt-6 tw-flex tw-justify-end">
                            <button
                                onClick={() => setShowPreviewModal(false)}
                                className="tw-rounded-md tw-bg-gray-100 tw-px-4 tw-py-2 tw-text-sm tw-font-medium tw-text-gray-700 hover:tw-bg-gray-200"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AdminDashboard>
    );
}
