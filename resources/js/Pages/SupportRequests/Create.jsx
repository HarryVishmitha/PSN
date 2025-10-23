import Footer from '@/Components/Footer';
import Header from '@/Components/Header';
import Meta from '@/Components/Metaheads';
import { Icon } from '@iconify/react';
import { Head, useForm } from '@inertiajs/react';
import AOS from 'aos';
import 'aos/dist/aos.css';
import { useEffect, useMemo, useState } from 'react';

const STORAGE_KEY = 'support-request-draft';
const SIZE_UNITS = ['mm', 'cm', 'in', 'ft', 'm'];

const steps = [
    { key: 'contact', title: 'Contact', description: 'How can we reach you?' },
    { key: 'project', title: 'Project', description: 'Tell us what you need.' },
    {
        key: 'specs',
        title: 'Specs',
        description: 'Share the technical details.',
    },
    {
        key: 'timeline',
        title: 'Timeline & Budget',
        description: 'When and how much?',
    },
    {
        key: 'files',
        title: 'Files & Consent',
        description: 'Upload artwork and confirm.',
    },
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
        <ol className="tw-no-scrollbar tw-flex tw-w-full tw-justify-between tw-gap-2 tw-overflow-x-auto tw-pb-2 tw-text-xs tw-font-medium md:tw-text-sm">
            {steps.map((step, index) => {
                const isActive = index === currentStep;
                const isComplete = index < currentStep;
                return (
                    <li
                        key={step.key}
                        className={`tw-flex tw-min-w-[130px] tw-flex-1 tw-flex-shrink-0 tw-items-center tw-gap-2 tw-rounded-lg tw-px-2 tw-py-2 tw-transition-all tw-duration-300 md:tw-min-w-0 md:tw-flex-shrink md:tw-gap-3 md:tw-px-4 md:tw-py-3 ${
                            isActive
                                ? 'tw-scale-[1.02] tw-bg-gradient-to-r tw-from-[#f44032] tw-to-[#ff6b5e] tw-text-white tw-shadow-lg md:tw-scale-105'
                                : isComplete
                                  ? 'tw-border tw-border-green-200 tw-bg-green-50 tw-text-green-700'
                                  : 'tw-border tw-border-gray-200 tw-bg-gray-50 tw-text-gray-600'
                        }`}
                    >
                        <span
                            className={`tw-flex tw-h-6 tw-w-6 tw-flex-shrink-0 tw-items-center tw-justify-center tw-rounded-full tw-text-xs tw-font-bold md:tw-h-8 md:tw-w-8 md:tw-text-sm ${
                                isActive
                                    ? 'tw-bg-white tw-text-[#f44032]'
                                    : isComplete
                                      ? 'tw-bg-green-500 tw-text-white'
                                      : 'tw-bg-gray-200 tw-text-gray-600'
                            }`}
                        >
                            {isComplete ? (
                                <Icon
                                    icon="mdi:check"
                                    className="tw-text-base"
                                />
                            ) : (
                                index + 1
                            )}
                        </span>
                        <div className="tw-hidden tw-min-w-0 tw-flex-1 md:tw-block">
                            <p className="tw-line-clamp-1 tw-text-xs tw-font-semibold md:tw-text-sm">
                                {step.title}
                            </p>
                            <p className="tw-line-clamp-1 tw-text-[10px] tw-opacity-80 md:tw-text-xs">
                                {step.description}
                            </p>
                        </div>
                        <p className="tw-line-clamp-1 tw-min-w-0 tw-flex-1 tw-text-xs tw-font-semibold md:tw-hidden">
                            {step.title}
                        </p>
                    </li>
                );
            })}
        </ol>
    );
}

export default function Create({
    categories = [],
    maxFiles = 5,
    maxFileSizeMb = 50,
    notifyEmail,
}) {
    const initialCategory =
        categories.length > 0 ? categories[0].value : 'other';
    const { data, setData, post, processing, progress, errors, clearErrors } =
        useForm({
            ...defaultForm,
            category: initialCategory,
        });

    const [step, setStep] = useState(0);
    const [localError, setLocalError] = useState('');

    // Initialize AOS animations
    useEffect(() => {
        AOS.init({
            duration: 800,
            once: true,
            easing: 'ease-in-out',
        });
    }, []);

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
            window.localStorage.setItem(
                STORAGE_KEY,
                JSON.stringify(serializable),
            );
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
    const remainingFiles = useMemo(
        () => maxFiles - (data.files?.length || 0),
        [data.files, maxFiles],
    );

    const handleFileSelection = (files) => {
        if (!files || files.length === 0) return;

        const incoming = Array.from(files);
        const current = data.files || [];

        if (current.length + incoming.length > maxFiles) {
            setLocalError(
                `Maximum ${maxFiles} files allowed. Remove some files before adding more.`,
            );
            return;
        }

        const oversized = incoming.find(
            (file) => file.size > maxFileSizeMb * 1024 * 1024,
        );
        if (oversized) {
            setLocalError(
                `"${oversized.name}" exceeds the ${maxFileSizeMb} MB limit.`,
            );
            return;
        }

        setLocalError('');
        setData('files', [...current, ...incoming]);
    };

    const removeFileAt = (index) => {
        setData(
            'files',
            (data.files || []).filter((_, i) => i !== index),
        );
    };

    const handleNext = () => {
        clearErrors();
        setLocalError('');

        if (step === 0) {
            if (!data.name || !data.email || !data.phone_whatsapp) {
                setLocalError(
                    'Please complete your contact details before continuing.',
                );
                return;
            }
        }

        if (step === 1) {
            if (!data.title || !data.category) {
                setLocalError('Add a project title and category to continue.');
                return;
            }
            if (data.category === 'other' && !data.other_category) {
                setLocalError(
                    'Please tell us what category best describes your request.',
                );
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
            <div className="tw-mb-6">
                <h3 className="tw-flex tw-items-center tw-gap-2 tw-text-lg tw-font-semibold tw-text-gray-900">
                    <Icon
                        icon="mdi:account-circle"
                        className="tw-text-xl tw-text-[#f44032]"
                    />
                    Contact Information
                </h3>
                <p className="tw-mt-3 tw-text-sm tw-text-gray-500">
                    Let us know how to reach you
                </p>
            </div>
            <div className="tw-grid tw-gap-4 md:tw-grid-cols-2">
                <div>
                    <label className="tw-flex tw-items-center tw-gap-2 tw-text-sm tw-font-semibold tw-text-gray-700">
                        <Icon
                            icon="mdi:account"
                            className="tw-text-[#f44032]"
                        />
                        Name *
                    </label>
                    <input
                        type="text"
                        value={data.name}
                        onChange={(e) => setData('name', e.target.value)}
                        className="tw-mt-2 tw-w-full tw-rounded-lg tw-border tw-border-gray-300 tw-px-4 tw-py-3 tw-transition-all focus:tw-border-[#f44032] focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-[#f44032]/20"
                        placeholder="John Doe"
                    />
                    {errors.name && (
                        <p className="tw-mt-1 tw-flex tw-items-center tw-gap-1 tw-text-sm tw-text-red-600">
                            <Icon icon="mdi:alert-circle" />
                            {errors.name}
                        </p>
                    )}
                </div>
                <div>
                    <label className="tw-flex tw-items-center tw-gap-2 tw-text-sm tw-font-semibold tw-text-gray-700">
                        <Icon
                            icon="mdi:office-building"
                            className="tw-text-gray-400"
                        />
                        Company
                    </label>
                    <input
                        type="text"
                        value={data.company}
                        onChange={(e) => setData('company', e.target.value)}
                        className="tw-mt-2 tw-w-full tw-rounded-lg tw-border tw-border-gray-300 tw-px-4 tw-py-3 tw-transition-all focus:tw-border-[#f44032] focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-[#f44032]/20"
                        placeholder="Your Company Name (Optional)"
                    />
                    {errors.company && (
                        <p className="tw-mt-1 tw-flex tw-items-center tw-gap-1 tw-text-sm tw-text-red-600">
                            <Icon icon="mdi:alert-circle" />
                            {errors.company}
                        </p>
                    )}
                </div>
            </div>

            <div className="tw-grid tw-gap-4 md:tw-grid-cols-2">
                <div>
                    <label className="tw-flex tw-items-center tw-gap-2 tw-text-sm tw-font-semibold tw-text-gray-700">
                        <Icon icon="mdi:email" className="tw-text-[#f44032]" />
                        Email *
                    </label>
                    <input
                        type="email"
                        value={data.email}
                        onChange={(e) => setData('email', e.target.value)}
                        className="tw-mt-2 tw-w-full tw-rounded-lg tw-border tw-border-gray-300 tw-px-4 tw-py-3 tw-transition-all focus:tw-border-[#f44032] focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-[#f44032]/20"
                        placeholder="john@example.com"
                    />
                    {errors.email && (
                        <p className="tw-mt-1 tw-flex tw-items-center tw-gap-1 tw-text-sm tw-text-red-600">
                            <Icon icon="mdi:alert-circle" />
                            {errors.email}
                        </p>
                    )}
                </div>
                <div>
                    <label className="tw-flex tw-items-center tw-gap-2 tw-text-sm tw-font-semibold tw-text-gray-700">
                        <Icon
                            icon="mdi:whatsapp"
                            className="tw-text-[#f44032]"
                        />
                        WhatsApp Number *
                    </label>
                    <input
                        type="tel"
                        value={data.phone_whatsapp}
                        onChange={(e) =>
                            setData('phone_whatsapp', e.target.value)
                        }
                        className="tw-mt-2 tw-w-full tw-rounded-lg tw-border tw-border-gray-300 tw-px-4 tw-py-3 tw-transition-all focus:tw-border-[#f44032] focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-[#f44032]/20"
                        placeholder="+94 76 886 0175"
                    />
                    {errors.phone_whatsapp && (
                        <p className="tw-mt-1 tw-flex tw-items-center tw-gap-1 tw-text-sm tw-text-red-600">
                            <Icon icon="mdi:alert-circle" />
                            {errors.phone_whatsapp}
                        </p>
                    )}
                </div>
            </div>
        </div>
    );

    const renderProjectStep = () => (
        <div className="tw-space-y-6">
            <div className="tw-mb-6">
                <h3 className="tw-flex tw-items-center tw-gap-2 tw-text-lg tw-font-semibold tw-text-gray-900">
                    <Icon
                        icon="mdi:briefcase"
                        className="tw-text-xl tw-text-[#f44032]"
                    />
                    Project Details
                </h3>
                <p className="tw-mt-3 tw-text-sm tw-text-gray-500">
                    Tell us what you need
                </p>
            </div>
            <div className="tw-grid tw-gap-4 md:tw-grid-cols-2">
                <div>
                    <label className="tw-flex tw-items-center tw-gap-2 tw-text-sm tw-font-semibold tw-text-gray-700">
                        <Icon icon="mdi:tag" className="tw-text-[#f44032]" />
                        Category *
                    </label>
                    <select
                        value={data.category}
                        onChange={(e) => setData('category', e.target.value)}
                        className="tw-mt-2 tw-w-full tw-rounded-lg tw-border tw-border-gray-300 tw-bg-white tw-px-4 tw-py-3 tw-transition-all focus:tw-border-[#f44032] focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-[#f44032]/20"
                    >
                        {categories.map((category) => (
                            <option key={category.value} value={category.value}>
                                {category.label}
                            </option>
                        ))}
                    </select>
                    {errors.category && (
                        <p className="tw-mt-1 tw-flex tw-items-center tw-gap-1 tw-text-sm tw-text-red-600">
                            <Icon icon="mdi:alert-circle" />
                            {errors.category}
                        </p>
                    )}
                </div>
                {data.category === 'other' && (
                    <div>
                        <label className="tw-flex tw-items-center tw-gap-2 tw-text-sm tw-font-semibold tw-text-gray-700">
                            <Icon
                                icon="mdi:information"
                                className="tw-text-[#f44032]"
                            />
                            Tell us more *
                        </label>
                        <input
                            type="text"
                            value={data.other_category}
                            onChange={(e) =>
                                setData('other_category', e.target.value)
                            }
                            className="tw-mt-2 tw-w-full tw-rounded-lg tw-border tw-border-gray-300 tw-px-4 tw-py-3 tw-transition-all focus:tw-border-[#f44032] focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-[#f44032]/20"
                            placeholder="e.g. Vehicle branding"
                        />
                        {errors.other_category && (
                            <p className="tw-mt-1 tw-flex tw-items-center tw-gap-1 tw-text-sm tw-text-red-600">
                                <Icon icon="mdi:alert-circle" />
                                {errors.other_category}
                            </p>
                        )}
                    </div>
                )}
            </div>

            <div>
                <label className="tw-flex tw-items-center tw-gap-2 tw-text-sm tw-font-semibold tw-text-gray-700">
                    <Icon
                        icon="mdi:file-document"
                        className="tw-text-[#f44032]"
                    />
                    Project Title *
                </label>
                <input
                    type="text"
                    value={data.title}
                    onChange={(e) => setData('title', e.target.value)}
                    className="tw-mt-2 tw-w-full tw-rounded-lg tw-border tw-border-gray-300 tw-px-4 tw-py-3 tw-transition-all focus:tw-border-[#f44032] focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-[#f44032]/20"
                    placeholder="E.g., Corporate Brochure Design"
                />
                {errors.title && (
                    <p className="tw-mt-1 tw-flex tw-items-center tw-gap-1 tw-text-sm tw-text-red-600">
                        <Icon icon="mdi:alert-circle" />
                        {errors.title}
                    </p>
                )}
            </div>

            <div>
                <label className="tw-flex tw-items-center tw-gap-2 tw-text-sm tw-font-semibold tw-text-gray-700">
                    <Icon icon="mdi:text" className="tw-text-gray-400" />
                    Description / Notes
                </label>
                <textarea
                    rows="5"
                    value={data.description}
                    onChange={(e) => setData('description', e.target.value)}
                    className="tw-mt-2 tw-w-full tw-rounded-lg tw-border tw-border-gray-300 tw-px-4 tw-py-3 tw-transition-all focus:tw-border-[#f44032] focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-[#f44032]/20"
                    placeholder="Share objectives, reference links, brand notes, or any specific requirements..."
                />
                {errors.description && (
                    <p className="tw-mt-1 tw-flex tw-items-center tw-gap-1 tw-text-sm tw-text-red-600">
                        <Icon icon="mdi:alert-circle" />
                        {errors.description}
                    </p>
                )}
            </div>
        </div>
    );

    const renderSpecsStep = () => (
        <div className="tw-space-y-6">
            <div className="tw-mb-6">
                <h3 className="tw-flex tw-items-center tw-gap-2 tw-text-lg tw-font-semibold tw-text-gray-900">
                    <Icon
                        icon="mdi:ruler-square"
                        className="tw-text-xl tw-text-[#f44032]"
                    />
                    Technical Specifications
                </h3>
                <p className="tw-mt-3 tw-text-sm tw-text-gray-500">
                    Share the technical details of your project
                </p>
            </div>
            <div className="tw-grid tw-gap-4 md:tw-grid-cols-2">
                <div>
                    <label className="tw-flex tw-items-center tw-gap-2 tw-text-sm tw-font-semibold tw-text-gray-700">
                        <Icon icon="mdi:resize" className="tw-text-gray-400" />
                        Dimensions
                    </label>
                    <div className="tw-mt-2 tw-flex tw-gap-2">
                        <input
                            type="number"
                            min="0"
                            step="0.1"
                            value={specs.size.width}
                            onChange={(e) =>
                                setData('specs', {
                                    ...specs,
                                    size: {
                                        ...specs.size,
                                        width: e.target.value,
                                    },
                                })
                            }
                            className="tw-w-full tw-rounded-lg tw-border tw-border-gray-300 tw-px-3 tw-py-3 tw-transition-all focus:tw-border-[#f44032] focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-[#f44032]/20"
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
                                    size: {
                                        ...specs.size,
                                        height: e.target.value,
                                    },
                                })
                            }
                            className="tw-w-full tw-rounded-lg tw-border tw-border-gray-300 tw-px-3 tw-py-3 tw-transition-all focus:tw-border-[#f44032] focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-[#f44032]/20"
                            placeholder="Height"
                        />
                        <select
                            value={specs.size.unit}
                            onChange={(e) =>
                                setData('specs', {
                                    ...specs,
                                    size: {
                                        ...specs.size,
                                        unit: e.target.value,
                                    },
                                })
                            }
                            className="tw-w-24 tw-rounded-lg tw-border tw-border-gray-300 tw-bg-white tw-px-2 tw-py-3 tw-transition-all focus:tw-border-[#f44032] focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-[#f44032]/20"
                        >
                            {SIZE_UNITS.map((unit) => (
                                <option key={unit} value={unit}>
                                    {unit.toUpperCase()}
                                </option>
                            ))}
                        </select>
                    </div>
                    {(errors['specs.size.width'] ||
                        errors['specs.size.height']) && (
                        <p className="tw-mt-1 tw-flex tw-items-center tw-gap-1 tw-text-sm tw-text-red-600">
                            <Icon icon="mdi:alert-circle" />
                            {errors['specs.size.width'] ||
                                errors['specs.size.height']}
                        </p>
                    )}
                </div>
                <div>
                    <label className="tw-flex tw-items-center tw-gap-2 tw-text-sm tw-font-semibold tw-text-gray-700">
                        <Icon icon="mdi:counter" className="tw-text-gray-400" />
                        Quantity
                    </label>
                    <input
                        type="number"
                        min="1"
                        value={specs.quantity}
                        onChange={(e) =>
                            setData('specs', {
                                ...specs,
                                quantity: e.target.value,
                            })
                        }
                        className="tw-mt-2 tw-w-full tw-rounded-lg tw-border tw-border-gray-300 tw-px-4 tw-py-3 tw-transition-all focus:tw-border-[#f44032] focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-[#f44032]/20"
                        placeholder="How many pieces?"
                    />
                    {errors['specs.quantity'] && (
                        <p className="tw-mt-1 tw-flex tw-items-center tw-gap-1 tw-text-sm tw-text-red-600">
                            <Icon icon="mdi:alert-circle" />
                            {errors['specs.quantity']}
                        </p>
                    )}
                </div>
            </div>

            <div className="tw-grid tw-gap-4 md:tw-grid-cols-2">
                <div>
                    <label className="tw-flex tw-items-center tw-gap-2 tw-text-sm tw-font-semibold tw-text-gray-700">
                        <Icon
                            icon="mdi:file-multiple"
                            className="tw-text-gray-400"
                        />
                        Sides
                    </label>
                    <select
                        value={specs.sides}
                        onChange={(e) =>
                            setData('specs', {
                                ...specs,
                                sides: e.target.value,
                            })
                        }
                        className="tw-mt-2 tw-w-full tw-rounded-lg tw-border tw-border-gray-300 tw-bg-white tw-px-4 tw-py-3 tw-transition-all focus:tw-border-[#f44032] focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-[#f44032]/20"
                    >
                        <option value="1">Single-sided</option>
                        <option value="2">Double-sided</option>
                    </select>
                </div>
                <div>
                    <label className="tw-flex tw-items-center tw-gap-2 tw-text-sm tw-font-semibold tw-text-gray-700">
                        <Icon icon="mdi:palette" className="tw-text-gray-400" />
                        Colour Profile
                    </label>
                    <select
                        value={specs.color}
                        onChange={(e) =>
                            setData('specs', {
                                ...specs,
                                color: e.target.value,
                            })
                        }
                        className="tw-mt-2 tw-w-full tw-rounded-lg tw-border tw-border-gray-300 tw-bg-white tw-px-4 tw-py-3 tw-transition-all focus:tw-border-[#f44032] focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-[#f44032]/20"
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
                    <label className="tw-flex tw-items-center tw-gap-2 tw-text-sm tw-font-semibold tw-text-gray-700">
                        <Icon icon="mdi:texture" className="tw-text-gray-400" />
                        Material
                    </label>
                    <input
                        type="text"
                        value={specs.material}
                        onChange={(e) =>
                            setData('specs', {
                                ...specs,
                                material: e.target.value,
                            })
                        }
                        className="tw-mt-2 tw-w-full tw-rounded-lg tw-border tw-border-gray-300 tw-px-4 tw-py-3 tw-transition-all focus:tw-border-[#f44032] focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-[#f44032]/20"
                        placeholder="PVC, vinyl, art board..."
                    />
                </div>
                <div>
                    <label className="tw-flex tw-items-center tw-gap-2 tw-text-sm tw-font-semibold tw-text-gray-700">
                        <Icon icon="mdi:shimmer" className="tw-text-gray-400" />
                        Finishing
                    </label>
                    <input
                        type="text"
                        value={specs.finishing}
                        onChange={(e) =>
                            setData('specs', {
                                ...specs,
                                finishing: e.target.value,
                            })
                        }
                        className="tw-mt-2 tw-w-full tw-rounded-lg tw-border tw-border-gray-300 tw-px-4 tw-py-3 tw-transition-all focus:tw-border-[#f44032] focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-[#f44032]/20"
                        placeholder="Lamination, eyelets, cutting..."
                    />
                </div>
            </div>

            <div>
                <label className="tw-flex tw-items-center tw-gap-2 tw-text-sm tw-font-semibold tw-text-gray-700">
                    <Icon
                        icon="mdi:truck-delivery"
                        className="tw-text-gray-400"
                    />
                    Delivery Preference
                </label>
                <select
                    value={specs.delivery_type}
                    onChange={(e) =>
                        setData('specs', {
                            ...specs,
                            delivery_type: e.target.value,
                        })
                    }
                    className="tw-mt-2 tw-w-full tw-rounded-lg tw-border tw-border-gray-300 tw-bg-white tw-px-4 tw-py-3 tw-transition-all focus:tw-border-[#f44032] focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-[#f44032]/20"
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
            <div className="tw-mb-6">
                <h3 className="tw-flex tw-items-center tw-gap-2 tw-text-lg tw-font-semibold tw-text-gray-900">
                    <Icon
                        icon="mdi:calendar-clock"
                        className="tw-text-xl tw-text-[#f44032]"
                    />
                    Timeline & Budget
                </h3>
                <p className="tw-mt-3 tw-text-sm tw-text-gray-500">
                    When do you need it and what's your budget?
                </p>
            </div>
            <div className="tw-grid tw-gap-4 md:tw-grid-cols-2">
                <div>
                    <label className="tw-flex tw-items-center tw-gap-2 tw-text-sm tw-font-semibold tw-text-gray-700">
                        <Icon
                            icon="mdi:calendar"
                            className="tw-text-gray-400"
                        />
                        Desired Date
                    </label>
                    <input
                        type="date"
                        value={data.desired_date}
                        onChange={(e) =>
                            setData('desired_date', e.target.value)
                        }
                        className="tw-mt-2 tw-w-full tw-rounded-lg tw-border tw-border-gray-300 tw-px-4 tw-py-3 tw-transition-all focus:tw-border-[#f44032] focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-[#f44032]/20"
                    />
                    {errors.desired_date && (
                        <p className="tw-mt-1 tw-flex tw-items-center tw-gap-1 tw-text-sm tw-text-red-600">
                            <Icon icon="mdi:alert-circle" />
                            {errors.desired_date}
                        </p>
                    )}
                </div>
                <div>
                    <label className="tw-flex tw-items-center tw-gap-2 tw-text-sm tw-font-semibold tw-text-gray-700">
                        <Icon
                            icon="mdi:clock-outline"
                            className="tw-text-gray-400"
                        />
                        Flexibility
                    </label>
                    <select
                        value={data.flexibility}
                        onChange={(e) => setData('flexibility', e.target.value)}
                        className="tw-mt-2 tw-w-full tw-rounded-lg tw-border tw-border-gray-300 tw-bg-white tw-px-4 tw-py-3 tw-transition-all focus:tw-border-[#f44032] focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-[#f44032]/20"
                    >
                        <option value="exact">Exact date</option>
                        <option value="plusminus">Flexible by 1-2 days</option>
                    </select>
                    {errors.flexibility && (
                        <p className="tw-mt-1 tw-flex tw-items-center tw-gap-1 tw-text-sm tw-text-red-600">
                            <Icon icon="mdi:alert-circle" />
                            {errors.flexibility}
                        </p>
                    )}
                </div>
            </div>

            <div className="tw-rounded-lg tw-border tw-border-gray-200 tw-bg-gray-50 tw-p-4">
                <h4 className="tw-mb-4 tw-flex tw-items-center tw-gap-2 tw-text-sm tw-font-semibold tw-text-gray-700">
                    <Icon
                        icon="mdi:currency-usd"
                        className="tw-text-[#f44032]"
                    />
                    Budget Range (Optional)
                </h4>
                <div className="tw-grid tw-gap-4 md:tw-grid-cols-2">
                    <div>
                        <label className="tw-text-sm tw-font-medium tw-text-gray-600">
                            Minimum Budget
                        </label>
                        <div className="tw-relative tw-mt-2">
                            <span className="tw-absolute tw-left-3 tw-top-3 tw-font-semibold tw-text-gray-500">
                                LKR
                            </span>
                            <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={data.budget_min}
                                onChange={(e) =>
                                    setData('budget_min', e.target.value)
                                }
                                className="tw-w-full tw-rounded-lg tw-border tw-border-gray-300 tw-py-3 tw-pl-14 tw-pr-4 tw-transition-all focus:tw-border-[#f44032] focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-[#f44032]/20"
                                placeholder="5,000"
                            />
                        </div>
                        {errors.budget_min && (
                            <p className="tw-mt-1 tw-flex tw-items-center tw-gap-1 tw-text-sm tw-text-red-600">
                                <Icon icon="mdi:alert-circle" />
                                {errors.budget_min}
                            </p>
                        )}
                    </div>
                    <div>
                        <label className="tw-text-sm tw-font-medium tw-text-gray-600">
                            Maximum Budget
                        </label>
                        <div className="tw-relative tw-mt-2">
                            <span className="tw-absolute tw-left-3 tw-top-3 tw-font-semibold tw-text-gray-500">
                                LKR
                            </span>
                            <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={data.budget_max}
                                onChange={(e) =>
                                    setData('budget_max', e.target.value)
                                }
                                className="tw-w-full tw-rounded-lg tw-border tw-border-gray-300 tw-py-3 tw-pl-14 tw-pr-4 tw-transition-all focus:tw-border-[#f44032] focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-[#f44032]/20"
                                placeholder="10,000"
                            />
                        </div>
                        {errors.budget_max && (
                            <p className="tw-mt-1 tw-flex tw-items-center tw-gap-1 tw-text-sm tw-text-red-600">
                                <Icon icon="mdi:alert-circle" />
                                {errors.budget_max}
                            </p>
                        )}
                    </div>
                </div>
                <p className="tw-mt-3 tw-flex tw-items-center tw-gap-1 tw-text-xs tw-text-gray-500">
                    <Icon icon="mdi:information-outline" />
                    Providing a budget helps us tailor our recommendations to
                    your needs
                </p>
            </div>
        </div>
    );

    const renderFilesStep = () => (
        <div className="tw-space-y-6">
            <div className="tw-mb-6">
                <h3 className="tw-flex tw-items-center tw-gap-2 tw-text-lg tw-font-semibold tw-text-gray-900">
                    <Icon
                        icon="mdi:cloud-upload"
                        className="tw-text-xl tw-text-[#f44032]"
                    />
                    Files & Agreement
                </h3>
                <p className="tw-mt-3 tw-text-sm tw-text-gray-500">
                    Upload your artwork and confirm consent
                </p>
            </div>
            <div>
                <label className="tw-mb-3 tw-flex tw-items-center tw-gap-2 tw-text-sm tw-font-semibold tw-text-gray-700">
                    <Icon
                        icon="mdi:file-upload"
                        className="tw-text-[#f44032]"
                    />
                    Artwork & References
                    <span className="tw-rounded-full tw-bg-blue-100 tw-px-2 tw-py-1 tw-text-xs tw-text-blue-700">
                        {remainingFiles} slots left · {maxFileSizeMb} MB max
                    </span>
                </label>
                <div
                    className="tw-mt-2 tw-flex tw-flex-col tw-items-center tw-justify-center tw-rounded-xl tw-border-2 tw-border-dashed tw-border-[#f44032]/40 tw-bg-gradient-to-br tw-from-red-50 tw-to-orange-50 tw-p-8 tw-text-center tw-transition-all hover:tw-border-[#f44032] hover:tw-shadow-lg"
                    onDragOver={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                    }}
                    onDrop={(event) => {
                        event.preventDefault();
                        handleFileSelection(event.dataTransfer.files);
                    }}
                >
                    <Icon
                        icon="mdi:cloud-upload"
                        className="tw-mb-3 tw-text-6xl tw-text-[#f44032]"
                    />
                    <p className="tw-text-base tw-font-semibold tw-text-gray-700">
                        Drag & drop your files here
                    </p>
                    <p className="tw-mt-1 tw-text-sm tw-text-gray-500">
                        or click to browse from your device
                    </p>
                    <p className="tw-mt-2 tw-flex tw-items-center tw-justify-center tw-gap-2 tw-text-xs tw-text-gray-400">
                        <Icon icon="mdi:file-check" />
                        Accepted: PNG, JPG, PDF, AI, PSD
                    </p>
                    <label className="tw-mt-5 tw-inline-flex tw-cursor-pointer tw-items-center tw-gap-2 tw-rounded-lg tw-bg-gradient-to-r tw-from-[#f44032] tw-to-[#ff6b5e] tw-px-6 tw-py-3 tw-text-sm tw-font-semibold tw-text-white tw-transition-all hover:tw-scale-105 hover:tw-shadow-lg">
                        <Icon icon="mdi:folder-open" className="tw-text-lg" />
                        Browse Files
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
                {errors.files && (
                    <p className="tw-mt-2 tw-flex tw-items-center tw-gap-1 tw-text-sm tw-text-red-600">
                        <Icon icon="mdi:alert-circle" />
                        {errors.files}
                    </p>
                )}
                {errors['files.0'] && (
                    <p className="tw-mt-2 tw-flex tw-items-center tw-gap-1 tw-text-sm tw-text-red-600">
                        <Icon icon="mdi:alert-circle" />
                        {errors['files.0']}
                    </p>
                )}

                {(data.files || []).length > 0 && (
                    <ul className="tw-mt-4 tw-space-y-3">
                        {data.files.map((file, index) => (
                            <li
                                key={`${file.name}-${index}`}
                                className="tw-flex tw-items-center tw-justify-between tw-rounded-lg tw-border tw-border-gray-200 tw-bg-white tw-px-4 tw-py-3 tw-shadow-sm tw-transition-all hover:tw-shadow-md"
                            >
                                <div className="tw-flex tw-items-center tw-gap-3">
                                    <Icon
                                        icon="mdi:file-document"
                                        className="tw-text-2xl tw-text-[#f44032]"
                                    />
                                    <div>
                                        <p className="tw-text-sm tw-font-semibold tw-text-gray-800">
                                            {file.name}
                                        </p>
                                        <p className="tw-flex tw-items-center tw-gap-1 tw-text-xs tw-text-gray-500">
                                            <Icon icon="mdi:weight" />
                                            {formatFileSize(file.size)}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => removeFileAt(index)}
                                    className="tw-flex tw-items-center tw-gap-1 tw-rounded tw-px-3 tw-py-1 tw-text-sm tw-font-semibold tw-text-red-600 tw-transition-all hover:tw-bg-red-50 hover:tw-text-red-700"
                                >
                                    <Icon icon="mdi:delete" />
                                    Remove
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            <div className="tw-rounded-r-lg tw-border-l-4 tw-border-blue-400 tw-bg-blue-50 tw-p-4">
                <div className="tw-flex tw-items-start tw-gap-3">
                    <input
                        type="checkbox"
                        id="consent"
                        checked={Boolean(data.consent)}
                        onChange={(event) =>
                            setData('consent', event.target.checked)
                        }
                        className="tw-mt-1 tw-h-5 tw-w-5 tw-cursor-pointer tw-rounded tw-border-2 tw-border-gray-300 tw-text-[#f44032] focus:tw-ring-[#f44032]"
                    />
                    <label
                        htmlFor="consent"
                        className="tw-cursor-pointer tw-text-sm tw-text-gray-700"
                    >
                        <span className="tw-font-semibold tw-text-gray-900">
                            I agree
                        </span>{' '}
                        to be contacted about this request via email or
                        WhatsApp. We usually respond from{' '}
                        <a
                            href={`mailto:${notifyEmail}`}
                            className="tw-font-bold tw-text-[#f44032] hover:tw-underline"
                        >
                            {notifyEmail}
                        </a>
                        .
                    </label>
                </div>
                {errors.consent && (
                    <p className="tw-ml-8 tw-mt-2 tw-flex tw-items-center tw-gap-1 tw-text-sm tw-text-red-600">
                        <Icon icon="mdi:alert-circle" />
                        {errors.consent}
                    </p>
                )}
            </div>
        </div>
    );

    const summary = useMemo(() => {
        return [
            {
                label: 'Contact',
                value: `${data.name || '—'} • ${data.email || '—'} • ${data.phone_whatsapp || '—'}`,
            },
            { label: 'Company', value: data.company || '—' },
            {
                label: 'Category',
                value: getCategoryLabel(categories, data.category),
            },
            { label: 'Title', value: data.title || '—' },
            {
                label: 'Timeline',
                value: data.desired_date
                    ? `${data.desired_date} (${data.flexibility === 'exact' ? 'Exact' : '±1-2 days'})`
                    : 'Not set',
            },
            {
                label: 'Budget',
                value:
                    data.budget_min || data.budget_max
                        ? `${data.budget_min || '—'} - ${data.budget_max || '—'}`
                        : 'Not specified',
            },
            {
                label: 'Specs',
                value:
                    [
                        specs.size.width && specs.size.height
                            ? `${specs.size.width} × ${specs.size.height} ${specs.size.unit}`
                            : null,
                        specs.quantity ? `${specs.quantity} pcs` : null,
                        specs.material || null,
                        specs.finishing || null,
                        specs.delivery_type
                            ? `Delivery: ${specs.delivery_type}`
                            : null,
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
            <Head title="New Request - Printair" />
            <Meta
                title="Request a Quote - Printair Advertising"
                description="Submit your custom printing project request. Get a personalized quote for banners, business cards, branding materials, and more."
                keywords="quote request, custom printing, printing services Sri Lanka, Printair quote"
            />
            <Header />

            {/* Hero Section */}
            <section className="tw-relative tw-overflow-hidden tw-bg-gradient-to-r tw-from-[#f44032] tw-to-[#ff6b5e] tw-py-12 md:tw-py-16">
                <div className="tw-absolute tw-inset-0 tw-opacity-10">
                    <div className="tw-absolute tw-left-10 tw-top-10 tw-h-32 tw-w-32 tw-rounded-full tw-bg-white tw-blur-3xl"></div>
                    <div className="tw-absolute tw-bottom-10 tw-right-10 tw-h-48 tw-w-48 tw-rounded-full tw-bg-white tw-blur-3xl"></div>
                </div>
                <div className="tw-container tw-relative tw-z-10 tw-mx-auto tw-px-4 tw-text-center">
                    <h3
                        className="tw-mb-4 tw-text-3xl tw-font-extrabold tw-text-white md:tw-text-5xl"
                        data-aos="fade-up"
                    >
                        Request Your Custom Quote
                    </h3>
                    <p
                        className="tw-mx-auto tw-max-w-2xl tw-text-lg tw-text-white/90 md:tw-text-xl"
                        data-aos="fade-up"
                        data-aos-delay="100"
                    >
                        Tell us about your project and we'll provide a
                        personalized quote within 24 hours
                    </p>
                    <div
                        className="tw-mt-8 tw-flex tw-items-center tw-justify-center tw-gap-6 tw-text-white"
                        data-aos="fade-up"
                        data-aos-delay="200"
                    >
                        <div className="tw-flex tw-items-center tw-gap-2">
                            <Icon
                                icon="mdi:clock-fast"
                                className="tw-text-2xl"
                            />
                            <span className="tw-text-sm">Fast Response</span>
                        </div>
                        <div className="tw-flex tw-items-center tw-gap-2">
                            <Icon
                                icon="mdi:shield-check"
                                className="tw-text-2xl"
                            />
                            <span className="tw-text-sm">Quality Assured</span>
                        </div>
                        <div className="tw-flex tw-items-center tw-gap-2">
                            <Icon
                                icon="mdi:tag-check"
                                className="tw-text-2xl"
                            />
                            <span className="tw-text-sm">Best Prices</span>
                        </div>
                    </div>
                </div>
            </section>

            <div className="tw-min-h-screen tw-overflow-x-hidden tw-bg-gray-50">
                <main className="tw-mx-auto tw-max-w-7xl tw-gap-8 tw-overflow-hidden tw-px-4 tw-py-10 lg:tw-grid lg:tw-grid-cols-[2fr,1fr]">
                    <div className="tw-space-y-8">
                        <div
                            className="tw-rounded-2xl tw-border tw-border-gray-100 tw-bg-white tw-px-6 tw-py-6 tw-shadow-lg"
                            data-aos="fade-up"
                        >
                            <div className="tw-mb-6">
                                <h2 className="tw-flex tw-items-center tw-gap-3 tw-text-2xl tw-font-bold tw-text-gray-900 md:tw-text-3xl">
                                    <Icon
                                        icon="mdi:clipboard-text"
                                        className="tw-text-[#f44032]"
                                    />
                                    Your Project Details
                                </h2>
                                <p className="tw-mt-2 tw-text-sm tw-text-gray-600 md:tw-text-base">
                                    Complete the form below and our expert team
                                    will get back to you shortly
                                </p>
                            </div>
                            <Stepper currentStep={step} />
                        </div>

                        <form
                            onSubmit={handleSubmit}
                            className="tw-space-y-8 tw-rounded-2xl tw-border tw-border-gray-100 tw-bg-white tw-px-6 tw-py-8 tw-shadow-lg"
                            data-aos="fade-up"
                            data-aos-delay="100"
                        >
                            <div className="tw-space-y-6">{renderStep()}</div>

                            {(localError || Object.keys(errors).length > 0) && (
                                <div className="tw-rounded-lg tw-border-2 tw-border-red-300 tw-bg-red-50 tw-px-5 tw-py-4 tw-text-sm tw-text-red-700 tw-shadow-sm">
                                    <div className="tw-flex tw-items-start tw-gap-3">
                                        <Icon
                                            icon="mdi:alert-circle"
                                            className="tw-flex-shrink-0 tw-text-2xl tw-text-red-500"
                                        />
                                        <div className="tw-flex-1">
                                            <h4 className="tw-mb-2 tw-font-bold tw-text-red-800">
                                                Please fix the following errors:
                                            </h4>
                                            {localError && (
                                                <p className="tw-mb-2">
                                                    {localError}
                                                </p>
                                            )}
                                            {Object.keys(errors).length > 0 && (
                                                <ul className="tw-list-disc tw-space-y-1 tw-pl-4">
                                                    {Object.entries(errors).map(
                                                        ([field, message]) => (
                                                            <li
                                                                key={field}
                                                                className="tw-text-red-600"
                                                            >
                                                                {message}
                                                            </li>
                                                        ),
                                                    )}
                                                </ul>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="tw-flex tw-flex-wrap tw-items-center tw-justify-between tw-gap-3 tw-border-t tw-border-gray-200 tw-pt-6">
                                <div className="tw-text-xs tw-font-medium tw-text-gray-500">
                                    Step {step + 1} of {steps.length}
                                </div>
                                <div className="tw-flex tw-gap-3">
                                    {step > 0 && (
                                        <button
                                            type="button"
                                            onClick={handleBack}
                                            className="tw-flex tw-items-center tw-gap-2 tw-rounded-lg tw-border-2 tw-border-gray-300 tw-bg-white tw-px-6 tw-py-2.5 tw-text-sm tw-font-semibold tw-text-gray-700 tw-transition-all hover:tw-border-[#f44032] hover:tw-text-[#f44032]"
                                        >
                                            <Icon icon="mdi:arrow-left" />
                                            Back
                                        </button>
                                    )}
                                    {step < steps.length - 1 && (
                                        <button
                                            type="button"
                                            onClick={handleNext}
                                            className="tw-flex tw-items-center tw-gap-2 tw-rounded-lg tw-bg-gradient-to-r tw-from-[#f44032] tw-to-[#ff6b5e] tw-px-6 tw-py-2.5 tw-text-sm tw-font-semibold tw-text-white tw-transition-all hover:tw-scale-105 hover:tw-shadow-lg"
                                        >
                                            Next
                                            <Icon icon="mdi:arrow-right" />
                                        </button>
                                    )}
                                    {step === steps.length - 1 && (
                                        <button
                                            type="submit"
                                            disabled={processing}
                                            className="disabled:tw-hover:tw-scale-100 tw-flex tw-items-center tw-gap-2 tw-rounded-lg tw-bg-gradient-to-r tw-from-[#f44032] tw-to-[#ff6b5e] tw-px-6 tw-py-2.5 tw-text-sm tw-font-semibold tw-text-white tw-transition-all hover:tw-scale-105 hover:tw-shadow-lg disabled:tw-cursor-not-allowed disabled:tw-opacity-60"
                                        >
                                            {processing ? (
                                                <>
                                                    <Icon
                                                        icon="mdi:loading"
                                                        className="tw-animate-spin"
                                                    />
                                                    Submitting...
                                                </>
                                            ) : (
                                                <>
                                                    <Icon icon="mdi:send" />
                                                    Submit Request
                                                </>
                                            )}
                                        </button>
                                    )}
                                </div>
                            </div>

                            {progress && (
                                <div className="tw-w-full tw-rounded-lg tw-bg-gray-200 tw-p-1 tw-shadow-inner">
                                    <div className="tw-relative tw-h-3 tw-overflow-hidden tw-rounded-lg">
                                        <div
                                            className="tw-h-full tw-bg-gradient-to-r tw-from-[#f44032] tw-to-[#ff6b5e] tw-transition-all tw-duration-300 tw-ease-out"
                                            style={{
                                                width: `${progress.percentage}%`,
                                            }}
                                        />
                                        <span className="tw-absolute tw-inset-0 tw-flex tw-items-center tw-justify-center tw-text-xs tw-font-bold tw-text-gray-700">
                                            {progress.percentage}%
                                        </span>
                                    </div>
                                </div>
                            )}
                        </form>
                    </div>

                    <aside className="tw-max-w-full tw-space-y-6 lg:tw-max-w-none">
                        <div
                            className="tw-mt-5 tw-rounded-2xl tw-border tw-border-gray-200 tw-shadow-lg"
                            data-aos="fade-left"
                            data-aos-delay="100"
                        >
                            {/* Header Section */}
                            <div className="tw-bg-gradient-to-r tw-from-[#6a11cb] tw-to-[#2575fc] tw-px-6 tw-py-4 tw-text-white">
                                <div className="tw-flex tw-items-center tw-gap-3">
                                    <Icon
                                        icon="mdi:clipboard-check"
                                        className="tw-flex-shrink-0 tw-text-2xl"
                                    />
                                    <h3 className="tw-text-lg tw-font-bold tw-text-white tw-leading-none">
                                        Live Summary
                                    </h3>
                                </div>
                            </div>

                            {/* Content Section */}
                            <div className="tw-space-y-4 tw-bg-white tw-px-6 tw-py-6">
                                <p className="tw-break-words tw-rounded tw-border-l-4 tw-border-blue-400 tw-bg-blue-50 tw-p-3 tw-text-sm tw-text-gray-600">
                                    <Icon
                                        icon="mdi:information"
                                        className="tw-mr-1 tw-inline tw-flex-shrink-0"
                                    />
                                    Updates will be sent to{' '}
                                    <span className="tw-break-all tw-font-semibold tw-text-blue-700">
                                        {data.email || 'your email'}
                                    </span>
                                </p>
                                <dl className="tw-space-y-4">
                                    {summary.map((item) => (
                                        <div
                                            key={item.label}
                                            className="tw-flex tw-items-start tw-gap-4 tw-rounded-lg tw-bg-gray-50 tw-p-4 tw-shadow-sm"
                                        >
                                            <dt className="tw-w-1/3 tw-text-xs tw-font-bold tw-uppercase tw-tracking-wide tw-text-gray-500">
                                                {item.label}
                                            </dt>
                                            <dd className="tw-w-2/3 tw-break-words tw-text-sm tw-font-medium tw-text-gray-800">
                                                {item.value}
                                            </dd>
                                        </div>
                                    ))}
                                </dl>
                            </div>
                        </div>

                        <div
                            className="tw-z-10 tw-break-words tw-rounded-2xl tw-bg-gradient-to-br tw-from-[#f44032] tw-to-[#ff6b5e] tw-px-6 tw-py-6 tw-text-white tw-shadow-lg lg:tw-sticky lg:tw-top-24"
                            data-aos="fade-left"
                        >
                            <div className="tw-mb-4 tw-flex tw-flex-wrap tw-items-center tw-gap-3">
                                <Icon
                                    icon="mdi:help-circle"
                                    className="tw-flex-shrink-0 tw-text-3xl"
                                />
                                <h3 className="tw-whitespace-nowrap tw-text-lg tw-font-bold">
                                    Need Help?
                                </h3>
                            </div>
                            <div className="tw-space-y-3 tw-text-sm">
                                <div className="tw-flex tw-items-start tw-gap-3">
                                    <Icon
                                        icon="mdi:phone"
                                        className="tw-mt-1 tw-flex-shrink-0 tw-text-xl"
                                    />
                                    <div className="tw-min-w-0 tw-flex-1">
                                        <p className="tw-mb-1 tw-font-semibold">
                                            Call or WhatsApp
                                        </p>
                                        <a
                                            className="tw-block tw-font-bold tw-text-white hover:tw-underline"
                                            href="tel:+94768860175"
                                        >
                                            +94 76 886 0175
                                        </a>
                                    </div>
                                </div>
                                <div className="tw-flex tw-items-start tw-gap-3">
                                    <Icon
                                        icon="mdi:email"
                                        className="tw-mt-1 tw-flex-shrink-0 tw-text-xl"
                                    />
                                    <div className="tw-min-w-0 tw-flex-1">
                                        <p className="tw-mb-1 tw-font-semibold">
                                            Email Us
                                        </p>
                                        <a
                                            className="tw-block tw-break-all tw-font-bold tw-text-white hover:tw-underline"
                                            href={`mailto:${notifyEmail}`}
                                        >
                                            {notifyEmail}
                                        </a>
                                    </div>
                                </div>
                            </div>
                            <div className="tw-mt-4 tw-border-t tw-border-white/20 tw-pt-4">
                                <p className="tw-flex tw-flex-wrap tw-items-center tw-gap-2 tw-text-xs">
                                    <Icon
                                        icon="mdi:content-save"
                                        className="tw-flex-shrink-0 tw-text-lg"
                                    />
                                    <span>
                                        Auto-save enabled. Continue anytime!
                                    </span>
                                </p>
                            </div>
                        </div>
                    </aside>
                </main>
            </div>
            <Footer />
        </>
    );
}
