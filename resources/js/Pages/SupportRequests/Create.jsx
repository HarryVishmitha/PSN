import React, { useEffect, useMemo, useState } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';

const STORAGE_KEY = 'support-request-draft';
const SIZE_UNITS = ['mm', 'cm', 'in', 'ft', 'm'];

const steps = [
    { key: 'contact', title: 'Contact', description: 'How can we reach you?' },
    { key: 'project', title: 'Project', description: 'Tell us what you need.' },
    { key: 'specs', title: 'Specs', description: 'Share the technical details.' },
    { key: 'timeline', title: 'Timeline & Budget', description: 'When and how much?' },
    { key: 'files', title: 'Files & Consent', description: 'Upload artwork and confirm.' },
];

const defaultForm = {
    name: '',
    company: '',
    email: '',
    phone_whatsapp: '',
    category: '',
    other_category: '',
    title: '',
    description: '',
    specs: {
        size: { width: '', height: '', unit: 'mm' },
        quantity: '',
        sides: '1',
        color: 'CMYK',
        material: '',
        finishing: '',
        delivery_type: 'pickup',
    },
    desired_date: '',
    flexibility: 'plusminus',
    budget_min: '',
    budget_max: '',
    consent: false,
    files: [],
};

function getCategoryLabel(categories, value) {
    const match = categories.find((cat) => cat.value === value);
    return match ? match.label : value;
}

function formatFileSize(bytes) {
    if (!bytes) {
        return '0 MB';
    }
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function Stepper({ currentStep }) {
    return (
        <ol className="tw-flex tw-w-full tw-justify-between tw-gap-2 tw-text-sm md:tw-text-base tw-font-medium">
            {steps.map((step, index) => {
                const isActive = index === currentStep;
                const isComplete = index < currentStep;
                return (
                    <li
                        key={step.key}
                        className={`tw-flex tw-flex-1 tw-items-center tw-gap-3 tw-rounded-lg tw-py-3 tw-px-4 tw-transition ${
                            isActive ? 'tw-bg-gray-900 tw-text-white' : isComplete ? 'tw-bg-green-100 tw-text-green-700' : 'tw-bg-gray-100 tw-text-gray-600'
                        }`}
                    >
                        <span className="tw-flex tw-h-6 tw-w-6 tw-items-center tw-justify-center tw-rounded-full tw-border tw-border-current tw-text-xs">
                            {index + 1}
                        </span>
                        <div>
                            <p className="tw-font-semibold">{step.title}</p>
                            <p className="tw-text-xs md:tw-text-sm tw-opacity-80">{step.description}</p>
                        </div>
                    </li>
                );
            })}
        </ol>
    );
}

export default function Create({ categories = [], maxFiles = 5, maxFileSizeMb = 50, notifyEmail }) {
    const initialCategory = categories.length > 0 ? categories[0].value : 'other';
    const { data, setData, post, processing, progress, errors, clearErrors } = useForm({
        ...defaultForm,
        category: initialCategory,
    });

    const [step, setStep] = useState(0);
    const [localError, setLocalError] = useState('');

    useEffect(() => {
        if (typeof window === 'undefined') return;

        try {
            const draft = window.localStorage.getItem(STORAGE_KEY);
            if (!draft) return;

            const parsed = JSON.parse(draft);
            setData((current) => ({
                ...current,
                ...parsed,
                specs: {
                    ...defaultForm.specs,
                    ...(parsed.specs || {}),
                    size: {
                        ...defaultForm.specs.size,
                        ...(parsed.specs?.size || {}),
                    },
                },
            }));
        } catch (error) {
            console.warn('Failed to load support request draft', error);
        }
    }, [setData]);

    useEffect(() => {
        if (typeof window === 'undefined') return;

        const serializable = {
            ...data,
            files: undefined,
        };

        try {
            window.localStorage.setItem(STORAGE_KEY, JSON.stringify(serializable));
        } catch (error) {
            console.warn('Failed to persist support request draft', error);
        }
    }, [data]);

    useEffect(() => {
        if (data.category !== 'other' && data.other_category) {
            setData('other_category', '');
        }
    }, [data.category, data.other_category, setData]);

    const specs = data.specs || defaultForm.specs;
    const remainingFiles = useMemo(() => maxFiles - (data.files?.length || 0), [data.files, maxFiles]);

    const handleFileSelection = (files) => {
        if (!files || files.length === 0) return;

        const incoming = Array.from(files);
        const current = data.files || [];

        if (current.length + incoming.length > maxFiles) {
            setLocalError(`Maximum ${maxFiles} files allowed. Remove some files before adding more.`);
            return;
        }

        const oversized = incoming.find((file) => file.size > maxFileSizeMb * 1024 * 1024);
        if (oversized) {
            setLocalError(`"${oversized.name}" exceeds the ${maxFileSizeMb} MB limit.`);
            return;
        }

        setLocalError('');
        setData('files', [...current, ...incoming]);
    };

    const removeFileAt = (index) => {
        setData('files', (data.files || []).filter((_, i) => i !== index));
    };

    const handleNext = () => {
        clearErrors();
        setLocalError('');

        if (step === 0) {
            if (!data.name || !data.email || !data.phone_whatsapp) {
                setLocalError('Please complete your contact details before continuing.');
                return;
            }
        }

        if (step === 1) {
            if (!data.title || !data.category) {
                setLocalError('Add a project title and category to continue.');
                return;
            }
            if (data.category === 'other' && !data.other_category) {
                setLocalError('Please tell us what category best describes your request.');
                return;
            }
        }

        setStep((current) => Math.min(current + 1, steps.length - 1));
    };

    const handleBack = () => {
        clearErrors();
        setLocalError('');
        setStep((current) => Math.max(current - 1, 0));
    };

    const handleSubmit = (event) => {
        event.preventDefault();
        clearErrors();
        setLocalError('');

        post(route('requests.store'), {
            forceFormData: true,
            onSuccess: () => {
                if (typeof window !== 'undefined') {
                    window.localStorage.removeItem(STORAGE_KEY);
                }
            },
            onError: () => {
                setStep(0);
                window.scrollTo({ top: 0, behavior: 'smooth' });
            },
        });
    };

    const renderContactStep = () => (
        <div className="tw-space-y-6">
            <div className="tw-grid tw-gap-4 md:tw-grid-cols-2">
                <div>
                    <label className="tw-text-sm tw-font-medium tw-text-gray-700">Name *</label>
                    <input
                        type="text"
                        value={data.name}
                        onChange={(e) => setData('name', e.target.value)}
                        className="tw-mt-1 tw-w-full tw-rounded tw-border tw-border-gray-300 tw-px-3 tw-py-2 focus:tw-border-gray-900 focus:tw-outline-none"
                    />
                    {errors.name && <p className="tw-mt-1 tw-text-sm tw-text-red-600">{errors.name}</p>}
                </div>
                <div>
                    <label className="tw-text-sm tw-font-medium tw-text-gray-700">Company</label>
                    <input
                        type="text"
                        value={data.company}
                        onChange={(e) => setData('company', e.target.value)}
                        className="tw-mt-1 tw-w-full tw-rounded tw-border tw-border-gray-300 tw-px-3 tw-py-2 focus:tw-border-gray-900 focus:tw-outline-none"
                        placeholder="Optional"
                    />
                    {errors.company && <p className="tw-mt-1 tw-text-sm tw-text-red-600">{errors.company}</p>}
                </div>
            </div>

            <div className="tw-grid tw-gap-4 md:tw-grid-cols-2">
                <div>
                    <label className="tw-text-sm tw-font-medium tw-text-gray-700">Email *</label>
                    <input
                        type="email"
                        value={data.email}
                        onChange={(e) => setData('email', e.target.value)}
                        className="tw-mt-1 tw-w-full tw-rounded tw-border tw-border-gray-300 tw-px-3 tw-py-2 focus:tw-border-gray-900 focus:tw-outline-none"
                        placeholder="name@example.com"
                    />
                    {errors.email && <p className="tw-mt-1 tw-text-sm tw-text-red-600">{errors.email}</p>}
                </div>
                <div>
                    <label className="tw-text-sm tw-font-medium tw-text-gray-700">WhatsApp Number *</label>
                    <input
                        type="tel"
                        value={data.phone_whatsapp}
                        onChange={(e) => setData('phone_whatsapp', e.target.value)}
                        className="tw-mt-1 tw-w-full tw-rounded tw-border tw-border-gray-300 tw-px-3 tw-py-2 focus:tw-border-gray-900 focus:tw-outline-none"
                        placeholder="+94 76 886 0175"
                    />
                    {errors.phone_whatsapp && <p className="tw-mt-1 tw-text-sm tw-text-red-600">{errors.phone_whatsapp}</p>}
                </div>
            </div>
        </div>
    );

    const renderProjectStep = () => (
        <div className="tw-space-y-6">
            <div className="tw-grid tw-gap-4 md:tw-grid-cols-2">
                <div>
                    <label className="tw-text-sm tw-font-medium tw-text-gray-700">Category *</label>
                    <select
                        value={data.category}
                        onChange={(e) => setData('category', e.target.value)}
                        className="tw-mt-1 tw-w-full tw-rounded tw-border tw-border-gray-300 tw-px-3 tw-py-2 focus:tw-border-gray-900 focus:tw-outline-none"
                    >
                        {categories.map((category) => (
                            <option key={category.value} value={category.value}>
                                {category.label}
                            </option>
                        ))}
                    </select>
                    {errors.category && <p className="tw-mt-1 tw-text-sm tw-text-red-600">{errors.category}</p>}
                </div>
                {data.category === 'other' && (
                    <div>
                        <label className="tw-text-sm tw-font-medium tw-text-gray-700">Tell us more *</label>
                        <input
                            type="text"
                            value={data.other_category}
                            onChange={(e) => setData('other_category', e.target.value)}
                            className="tw-mt-1 tw-w-full tw-rounded tw-border tw-border-gray-300 tw-px-3 tw-py-2 focus:tw-border-gray-900 focus:tw-outline-none"
                            placeholder="e.g. Vehicle branding"
                        />
                        {errors.other_category && <p className="tw-mt-1 tw-text-sm tw-text-red-600">{errors.other_category}</p>}
                    </div>
                )}
            </div>

            <div>
                <label className="tw-text-sm tw-font-medium tw-text-gray-700">Project title *</label>
                <input
                    type="text"
                    value={data.title}
                    onChange={(e) => setData('title', e.target.value)}
                    className="tw-mt-1 tw-w-full tw-rounded tw-border tw-border-gray-300 tw-px-3 tw-py-2 focus:tw-border-gray-900 focus:tw-outline-none"
                    placeholder="Short name for this request"
                />
                {errors.title && <p className="tw-mt-1 tw-text-sm tw-text-red-600">{errors.title}</p>}
            </div>

            <div>
                <label className="tw-text-sm tw-font-medium tw-text-gray-700">Description / Notes</label>
                <textarea
                    rows="5"
                    value={data.description}
                    onChange={(e) => setData('description', e.target.value)}
                    className="tw-mt-1 tw-w-full tw-rounded tw-border tw-border-gray-300 tw-px-3 tw-py-2 focus:tw-border-gray-900 focus:tw-outline-none"
                    placeholder="Share objectives, reference links, brand notes..."
                />
                {errors.description && <p className="tw-mt-1 tw-text-sm tw-text-red-600">{errors.description}</p>}
            </div>
        </div>
    );

    const renderSpecsStep = () => (
        <div className="tw-space-y-6">
            <div className="tw-grid tw-gap-4 md:tw-grid-cols-2">
                <div>
                    <label className="tw-text-sm tw-font-medium tw-text-gray-700">Dimensions</label>
                    <div className="tw-mt-1 tw-flex tw-gap-2">
                        <input
                            type="number"
                            min="0"
                            step="0.1"
                            value={specs.size.width}
                            onChange={(e) =>
                                setData('specs', {
                                    ...specs,
                                    size: { ...specs.size, width: e.target.value },
                                })
                            }
                            className="tw-w-full tw-rounded tw-border tw-border-gray-300 tw-px-3 tw-py-2 focus:tw-border-gray-900 focus:tw-outline-none"
                            placeholder="Width"
                        />
                        <input
                            type="number"
                            min="0"
                            step="0.1"
                            value={specs.size.height}
                            onChange={(e) =>
                                setData('specs', {
                                    ...specs,
                                    size: { ...specs.size, height: e.target.value },
                                })
                            }
                            className="tw-w-full tw-rounded tw-border tw-border-gray-300 tw-px-3 tw-py-2 focus:tw-border-gray-900 focus:tw-outline-none"
                            placeholder="Height"
                        />
                        <select
                            value={specs.size.unit}
                            onChange={(e) =>
                                setData('specs', {
                                    ...specs,
                                    size: { ...specs.size, unit: e.target.value },
                                })
                            }
                            className="tw-w-24 tw-rounded tw-border tw-border-gray-300 tw-px-2 tw-py-2 focus:tw-border-gray-900 focus:tw-outline-none"
                        >
                            {SIZE_UNITS.map((unit) => (
                                <option key={unit} value={unit}>
                                    {unit.toUpperCase()}
                                </option>
                            ))}
                        </select>
                    </div>
                    {(errors['specs.size.width'] || errors['specs.size.height']) && (
                        <p className="tw-mt-1 tw-text-sm tw-text-red-600">
                            {errors['specs.size.width'] || errors['specs.size.height']}
                        </p>
                    )}
                </div>
                <div>
                    <label className="tw-text-sm tw-font-medium tw-text-gray-700">Quantity</label>
                    <input
                        type="number"
                        min="1"
                        value={specs.quantity}
                        onChange={(e) => setData('specs', { ...specs, quantity: e.target.value })}
                        className="tw-mt-1 tw-w-full tw-rounded tw-border tw-border-gray-300 tw-px-3 tw-py-2 focus:tw-border-gray-900 focus:tw-outline-none"
                        placeholder="How many pieces?"
                    />
                    {errors['specs.quantity'] && <p className="tw-mt-1 tw-text-sm tw-text-red-600">{errors['specs.quantity']}</p>}
                </div>
            </div>

            <div className="tw-grid tw-gap-4 md:tw-grid-cols-2">
                <div>
                    <label className="tw-text-sm tw-font-medium tw-text-gray-700">Sides</label>
                    <select
                        value={specs.sides}
                        onChange={(e) => setData('specs', { ...specs, sides: e.target.value })}
                        className="tw-mt-1 tw-w-full tw-rounded tw-border tw-border-gray-300 tw-px-3 tw-py-2 focus:tw-border-gray-900 focus:tw-outline-none"
                    >
                        <option value="1">Single-sided</option>
                        <option value="2">Double-sided</option>
                    </select>
                </div>
                <div>
                    <label className="tw-text-sm tw-font-medium tw-text-gray-700">Colour profile</label>
                    <select
                        value={specs.color}
                        onChange={(e) => setData('specs', { ...specs, color: e.target.value })}
                        className="tw-mt-1 tw-w-full tw-rounded tw-border tw-border-gray-300 tw-px-3 tw-py-2 focus:tw-border-gray-900 focus:tw-outline-none"
                    >
                        <option value="CMYK">CMYK</option>
                        <option value="RGB">RGB</option>
                        <option value="Pantone">Pantone</option>
                        <option value="Other">Other</option>
                    </select>
                </div>
            </div>

            <div className="tw-grid tw-gap-4 md:tw-grid-cols-2">
                <div>
                    <label className="tw-text-sm tw-font-medium tw-text-gray-700">Material</label>
                    <input
                        type="text"
                        value={specs.material}
                        onChange={(e) => setData('specs', { ...specs, material: e.target.value })}
                        className="tw-mt-1 tw-w-full tw-rounded tw-border tw-border-gray-300 tw-px-3 tw-py-2 focus:tw-border-gray-900 focus:tw-outline-none"
                        placeholder="PVC, vinyl, art board..."
                    />
                </div>
                <div>
                    <label className="tw-text-sm tw-font-medium tw-text-gray-700">Finishing</label>
                    <input
                        type="text"
                        value={specs.finishing}
                        onChange={(e) => setData('specs', { ...specs, finishing: e.target.value })}
                        className="tw-mt-1 tw-w-full tw-rounded tw-border tw-border-gray-300 tw-px-3 tw-py-2 focus:tw-border-gray-900 focus:tw-outline-none"
                        placeholder="Lamination, eyelets, cutting..."
                    />
                </div>
            </div>

            <div>
                <label className="tw-text-sm tw-font-medium tw-text-gray-700">Delivery preference</label>
                <select
                    value={specs.delivery_type}
                    onChange={(e) => setData('specs', { ...specs, delivery_type: e.target.value })}
                    className="tw-mt-1 tw-w-full tw-rounded tw-border tw-border-gray-300 tw-px-3 tw-py-2 focus:tw-border-gray-900 focus:tw-outline-none"
                >
                    <option value="pickup">Pickup</option>
                    <option value="courier">Courier</option>
                    <option value="install">Installation required</option>
                </select>
            </div>
        </div>
    );

    const renderTimelineStep = () => (
        <div className="tw-space-y-6">
            <div className="tw-grid tw-gap-4 md:tw-grid-cols-2">
                <div>
                    <label className="tw-text-sm tw-font-medium tw-text-gray-700">Desired date</label>
                    <input
                        type="date"
                        value={data.desired_date}
                        onChange={(e) => setData('desired_date', e.target.value)}
                        className="tw-mt-1 tw-w-full tw-rounded tw-border tw-border-gray-300 tw-px-3 tw-py-2 focus:tw-border-gray-900 focus:tw-outline-none"
                    />
                    {errors.desired_date && <p className="tw-mt-1 tw-text-sm tw-text-red-600">{errors.desired_date}</p>}
                </div>
                <div>
                    <label className="tw-text-sm tw-font-medium tw-text-gray-700">Flexibility</label>
                    <select
                        value={data.flexibility}
                        onChange={(e) => setData('flexibility', e.target.value)}
                        className="tw-mt-1 tw-w-full tw-rounded tw-border tw-border-gray-300 tw-px-3 tw-py-2 focus:tw-border-gray-900 focus:tw-outline-none"
                    >
                        <option value="exact">Exact date</option>
                        <option value="plusminus">Flexible by 1-2 days</option>
                    </select>
                    {errors.flexibility && <p className="tw-mt-1 tw-text-sm tw-text-red-600">{errors.flexibility}</p>}
                </div>
            </div>

            <div className="tw-grid tw-gap-4 md:tw-grid-cols-2">
                <div>
                    <label className="tw-text-sm tw-font-medium tw-text-gray-700">Budget min (optional)</label>
                    <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={data.budget_min}
                        onChange={(e) => setData('budget_min', e.target.value)}
                        className="tw-mt-1 tw-w-full tw-rounded tw-border tw-border-gray-300 tw-px-3 tw-py-2 focus:tw-border-gray-900 focus:tw-outline-none"
                        placeholder="LKR"
                    />
                    {errors.budget_min && <p className="tw-mt-1 tw-text-sm tw-text-red-600">{errors.budget_min}</p>}
                </div>
                <div>
                    <label className="tw-text-sm tw-font-medium tw-text-gray-700">Budget max (optional)</label>
                    <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={data.budget_max}
                        onChange={(e) => setData('budget_max', e.target.value)}
                        className="tw-mt-1 tw-w-full tw-rounded tw-border tw-border-gray-300 tw-px-3 tw-py-2 focus:tw-border-gray-900 focus:tw-outline-none"
                        placeholder="LKR"
                    />
                    {errors.budget_max && <p className="tw-mt-1 tw-text-sm tw-text-red-600">{errors.budget_max}</p>}
                </div>
            </div>
        </div>
    );

    const renderFilesStep = () => (
        <div className="tw-space-y-6">
            <div>
                <label className="tw-text-sm tw-font-medium tw-text-gray-700">
                    Artwork & references ({remainingFiles} slots left, {maxFileSizeMb} MB max per file)
                </label>
                <div
                    className="tw-mt-2 tw-flex tw-flex-col tw-items-center tw-justify-center tw-rounded tw-border-2 tw-border-dashed tw-border-gray-300 tw-bg-gray-50 tw-p-6 tw-text-center tw-text-sm tw-text-gray-600"
                    onDragOver={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                    }}
                    onDrop={(event) => {
                        event.preventDefault();
                        handleFileSelection(event.dataTransfer.files);
                    }}
                >
                    <p className="tw-font-medium">Drag & drop your files here</p>
                    <p className="tw-mt-1 tw-text-xs tw-text-gray-500">Accepted: PNG, JPG, PDF, AI, PSD</p>
                    <label className="tw-mt-4 tw-inline-flex tw-cursor-pointer tw-items-center tw-gap-2 tw-rounded tw-bg-gray-900 tw-px-4 tw-py-2 tw-text-sm tw-font-semibold tw-text-white hover:tw-bg-black">
                        Browse files
                        <input
                            type="file"
                            multiple
                            className="tw-hidden"
                            accept=".png,.jpg,.jpeg,.pdf,.ai,.psd"
                            onChange={(event) => {
                                handleFileSelection(event.target.files);
                                event.target.value = '';
                            }}
                        />
                    </label>
                </div>
                {errors.files && <p className="tw-mt-1 tw-text-sm tw-text-red-600">{errors.files}</p>}
                {errors['files.0'] && <p className="tw-mt-1 tw-text-sm tw-text-red-600">{errors['files.0']}</p>}

                {(data.files || []).length > 0 && (
                    <ul className="tw-mt-4 tw-space-y-2">
                        {data.files.map((file, index) => (
                            <li
                                key={`${file.name}-${index}`}
                                className="tw-flex tw-items-center tw-justify-between tw-rounded tw-border tw-border-gray-200 tw-bg-white tw-px-3 tw-py-2"
                            >
                                <div>
                                    <p className="tw-text-sm tw-font-medium tw-text-gray-800">{file.name}</p>
                                    <p className="tw-text-xs tw-text-gray-500">{formatFileSize(file.size)}</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => removeFileAt(index)}
                                    className="tw-text-sm tw-font-medium tw-text-red-600 hover:tw-underline"
                                >
                                    Remove
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            <div className="tw-flex tw-items-start tw-gap-3">
                <input
                    type="checkbox"
                    id="consent"
                    checked={Boolean(data.consent)}
                    onChange={(event) => setData('consent', event.target.checked)}
                    className="tw-mt-1 tw-h-5 tw-w-5 tw-rounded tw-border tw-border-gray-300"
                />
                <label htmlFor="consent" className="tw-text-sm tw-text-gray-700">
                    I agree to be contacted about this request via email or WhatsApp. We usually respond from{' '}
                    <a href={`mailto:${notifyEmail}`} className="tw-font-semibold tw-text-gray-900">
                        {notifyEmail}
                    </a>
                    .
                </label>
            </div>
            {errors.consent && <p className="tw-text-sm tw-text-red-600">{errors.consent}</p>}
        </div>
    );

    const summary = useMemo(() => {
        return [
            { label: 'Contact', value: `${data.name || '—'} • ${data.email || '—'} • ${data.phone_whatsapp || '—'}` },
            { label: 'Company', value: data.company || '—' },
            { label: 'Category', value: getCategoryLabel(categories, data.category) },
            { label: 'Title', value: data.title || '—' },
            {
                label: 'Timeline',
                value: data.desired_date ? `${data.desired_date} (${data.flexibility === 'exact' ? 'Exact' : '±1-2 days'})` : 'Not set',
            },
            {
                label: 'Budget',
                value: data.budget_min || data.budget_max ? `${data.budget_min || '—'} - ${data.budget_max || '—'}` : 'Not specified',
            },
            {
                label: 'Specs',
                value: [
                    specs.size.width && specs.size.height ? `${specs.size.width} × ${specs.size.height} ${specs.size.unit}` : null,
                    specs.quantity ? `${specs.quantity} pcs` : null,
                    specs.material || null,
                    specs.finishing || null,
                    specs.delivery_type ? `Delivery: ${specs.delivery_type}` : null,
                ]
                    .filter(Boolean)
                    .join(' • ') || 'No specs yet',
            },
        ];
    }, [categories, data, specs]);

    const renderStep = () => {
        switch (step) {
            case 0:
                return renderContactStep();
            case 1:
                return renderProjectStep();
            case 2:
                return renderSpecsStep();
            case 3:
                return renderTimelineStep();
            case 4:
                return renderFilesStep();
            default:
                return null;
        }
    };

    return (
        <>
            <Head title="New Request" />
            <div className="tw-bg-gray-50">
                <header className="tw-bg-white tw-shadow-sm">
                    <div className="tw-mx-auto tw-flex tw-max-w-6xl tw-items-center tw-justify-between tw-px-4 tw-py-4">
                        <Link href="/" className="tw-text-lg tw-font-semibold tw-text-gray-900">
                            Printair
                        </Link>
                        <Link href="/contact" className="tw-text-sm tw-font-medium tw-text-gray-600 hover:tw-text-gray-900">
                            Need urgent help?
                        </Link>
                    </div>
                </header>

                <main className="tw-mx-auto tw-grid tw-max-w-6xl tw-gap-8 tw-px-4 tw-py-10 lg:tw-grid-cols-[2fr,1fr]">
                    <div className="tw-space-y-8">
                        <div className="tw-bg-white tw-rounded-2xl tw-px-6 tw-py-6 tw-shadow-sm">
                            <div className="tw-mb-6">
                                <h1 className="tw-text-2xl tw-font-bold tw-text-gray-900">Request a project brief</h1>
                                <p className="tw-mt-2 tw-text-sm tw-text-gray-600">
                                    Fill this short intake form and our team will coordinate the next steps with you.
                                </p>
                            </div>
                            <Stepper currentStep={step} />
                        </div>

                        <form onSubmit={handleSubmit} className="tw-bg-white tw-rounded-2xl tw-px-6 tw-py-6 tw-shadow-sm tw-space-y-8">
                            <div className="tw-space-y-6">{renderStep()}</div>

                            {(localError || Object.keys(errors).length > 0) && (
                                <div className="tw-rounded tw-border tw-border-red-200 tw-bg-red-50 tw-px-4 tw-py-3 tw-text-sm tw-text-red-700">
                                    {localError && <p>{localError}</p>}
                                    {Object.keys(errors).length > 0 && (
                                        <ul className="tw-mt-2 tw-list-disc tw-pl-4">
                                            {Object.entries(errors).map(([field, message]) => (
                                                <li key={field}>{message}</li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                            )}

                            <div className="tw-flex tw-flex-wrap tw-items-center tw-justify-between tw-gap-3">
                                <div className="tw-text-xs tw-text-gray-500">
                                    Step {step + 1} of {steps.length}
                                </div>
                                <div className="tw-flex tw-gap-3">
                                    {step > 0 && (
                                        <button
                                            type="button"
                                            onClick={handleBack}
                                            className="tw-rounded tw-border tw-border-gray-300 tw-bg-white tw-px-4 tw-py-2 tw-text-sm tw-font-semibold tw-text-gray-700 hover:tw-border-gray-400"
                                        >
                                            Back
                                        </button>
                                    )}
                                    {step < steps.length - 1 && (
                                        <button
                                            type="button"
                                            onClick={handleNext}
                                            className="tw-rounded tw-bg-gray-900 tw-px-5 tw-py-2.5 tw-text-sm tw-font-semibold tw-text-white hover:tw-bg-black"
                                        >
                                            Next
                                        </button>
                                    )}
                                    {step === steps.length - 1 && (
                                        <button
                                            type="submit"
                                            disabled={processing}
                                            className="tw-rounded tw-bg-gray-900 tw-px-5 tw-py-2.5 tw-text-sm tw-font-semibold tw-text-white hover:tw-bg-black disabled:tw-cursor-not-allowed disabled:tw-opacity-60"
                                        >
                                            {processing ? 'Submitting...' : 'Submit request'}
                                        </button>
                                    )}
                                </div>
                            </div>

                            {progress && (
                                <div className="tw-w-full tw-rounded tw-bg-gray-200 tw-p-1">
                                    <div
                                        className="tw-h-2 tw-rounded tw-bg-gray-900 tw-transition-all"
                                        style={{ width: `${progress.percentage}%` }}
                                    />
                                </div>
                            )}
                        </form>
                    </div>

                    <aside className="tw-space-y-6">
                        <div className="tw-rounded-2xl tw-bg-white tw-px-6 tw-py-6 tw-shadow-sm">
                            <h2 className="tw-text-lg tw-font-semibold tw-text-gray-900">Live summary</h2>
                            <p className="tw-mt-1 tw-text-sm tw-text-gray-500">
                                We will send confirmation and updates to <span className="tw-font-medium">{data.email || 'your email'}</span>.
                            </p>
                            <dl className="tw-mt-4 tw-space-y-3">
                                {summary.map((item) => (
                                    <div key={item.label} className="tw-border-b tw-border-gray-100 tw-pb-3">
                                        <dt className="tw-text-xs tw-uppercase tw-text-gray-400">{item.label}</dt>
                                        <dd className="tw-text-sm tw-font-medium tw-text-gray-800">{item.value}</dd>
                                    </div>
                                ))}
                            </dl>
                        </div>

                        <div className="tw-rounded-2xl tw-bg-white tw-px-6 tw-py-6 tw-shadow-sm tw-text-sm tw-text-gray-600">
                            <h3 className="tw-text-base tw-font-semibold tw-text-gray-900">Need help filling this in?</h3>
                            <p className="tw-mt-2">
                                Call or WhatsApp us on{' '}
                                <a className="tw-font-semibold tw-text-gray-900" href="tel:+94768860175">
                                    +94 76 886 0175
                                </a>{' '}
                                or drop a note to{' '}
                                <a className="tw-font-semibold tw-text-gray-900" href={`mailto:${notifyEmail}`}>
                                    {notifyEmail}
                                </a>
                                .
                            </p>
                            <p className="tw-mt-2">
                                You can leave and return later. We auto-save your answers on this device until you submit.
                            </p>
                        </div>
                    </aside>
                </main>
            </div>
        </>
    );
}
