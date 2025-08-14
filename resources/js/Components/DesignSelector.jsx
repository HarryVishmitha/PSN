import React, { useMemo, useRef, useState, useCallback } from "react";
import { Icon } from "@iconify/react";
import axios from "axios";

const bytesToMb = (b) => (b / (1024 * 1024)).toFixed(2);

const MODE_CARDS = [
    {
        key: "upload",
        icon: "mdi:cloud-upload-outline",
        title: "Upload your design",
        sub: (maxSizeMb) => `PDF / AI / EPS / PSD / PNG / JPG up to ${maxSizeMb}MB`,
    },
    {
        key: "gallery",
        icon: "mdi:image-multiple-outline",
        title: "Select from gallery",
        sub: (count) => (count > 0 ? `${count} templates available` : "Browse templates"),
    },
    {
        key: "hire",
        icon: "mdi:account-tie-outline",
        title: "Hire a designer",
        sub: () => "We’ll create a design for you",
    },
];

export default function DesignSelector({
    productId,
    designsCount = 0,
    onOpenGallery,   // () => void
    onHireDesigner,  // () => void
    onUploaded,      // (payload) => void (optional)
    maxSizeMb = 25,
}) {
    const [mode, setMode] = useState(null); // 'upload' | 'gallery' | 'hire'
    const [file, setFile] = useState(null);
    const [busy, setBusy] = useState(false);
    const [message, setMessage] = useState(null);
    const [error, setError] = useState(null);
    const [progress, setProgress] = useState(0);
    const [isDragging, setIsDragging] = useState(false);

    const inputRef = useRef(null);

    const accept = useMemo(
        () =>
            [
                ".pdf",
                ".ai",
                ".eps",
                ".tiff",
                ".tif",
                ".psd",
                ".svg",
                ".png",
                ".jpg",
                ".jpeg",
            ].join(", "),
        []
    );

    const isImage = (name = "") =>
        /\.(png|jpe?g|webp|gif)$/i.test(name.trim());

    const clearState = () => {
        setFile(null);
        setProgress(0);
        setMessage(null);
        setError(null);
        if (inputRef.current) inputRef.current.value = "";
    };

    const pickFile = useCallback(
        (f) => {
            setError(null);
            setMessage(null);
            if (!f) return;
            if (f.size > maxSizeMb * 1024 * 1024) {
                setError(`File too large. Max ${maxSizeMb}MB, got ${bytesToMb(f.size)}MB.`);
                if (inputRef.current) inputRef.current.value = "";
                return;
            }
            setFile(f);
        },
        [maxSizeMb]
    );

    const onPickFile = (e) => pickFile(e.target.files?.[0]);

    const onDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        const f = e.dataTransfer?.files?.[0];
        pickFile(f);
    };

    const onDragOver = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };
    const onDragLeave = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };

    const upload = async () => {
        if (!file) {
            setError("Please choose a file to upload.");
            return;
        }
        setBusy(true);
        setError(null);
        setMessage(null);
        setProgress(0);
        try {
            const fd = new FormData();
            fd.append("file", file);
            fd.append("product_id", productId);

            const res = await axios.post("/api/design-uploads", fd, {
                headers: { "Content-Type": "multipart/form-data", Accept: "application/json" },
                onUploadProgress: (evt) => {
                    if (!evt.total) return;
                    const pct = Math.round((evt.loaded * 100) / evt.total);
                    setProgress(pct);
                },
            });

            setMessage("Design uploaded. Our team will review the file and confirm.");
            onUploaded?.(res?.data || { ok: true });
        } catch (e) {
            setError(e?.response?.data?.message || "Upload failed. Please try again.");
        } finally {
            setBusy(false);
        }
    };

    const handleSelectMode = (key) => {
        setMode(key);
        if (key === "gallery") onOpenGallery?.();
        if (key === "hire") onHireDesigner?.();
    };

    return (
        <section aria-labelledby="select-design-title" className="tw-mt-6">
            <div
                id="select-design-title"
                className="tw-text-base tw-font-semibold tw-mb-2 tw-text-gray-700 dark:tw-text-gray-200"
            >
                Select a design option
            </div>

            {/* Card radios */}
            <div role="radiogroup" aria-label="Design options" className="tw-grid md:tw-grid-cols-3 tw-gap-2">
                {MODE_CARDS.map((c) => {
                    const selected = mode === c.key;
                    return (
                        <button
                            key={c.key}
                            type="button"
                            role="radio"
                            aria-checked={selected}
                            onClick={() => handleSelectMode(c.key)}
                            className={`tw-w-full tw-text-left tw-rounded-2xl border tw-p-4 hover:tw-shadow focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-offset-2 focus:tw-ring-[#f44032]
                ${selected ? "tw-border-[#f44032] tw-bg-[#f44032]/5" : "tw-border-gray-200 dark:tw-border-gray-800"}
              `}
                        >
                            <div className="tw-flex tw-items-start tw-gap-3">
                                <span className="tw-rounded-xl tw-bg-white tw-border tw-border-gray-200 dark:tw-bg-gray-900 dark:tw-border-gray-800 tw-p-2">
                                    <Icon icon={c.icon} className="tw-text-2xl tw-text-[#f44032]" />
                                </span>
                                <div className="tw-flex-1 tw-min-w-0">
                                    <div className="tw-font-semibold" title={c.title}>{c.title}</div>
                                    <div className="tw-text-xs tw-text-gray-500 tw-w-full" title={
                                        c.key === "upload" ? c.sub(maxSizeMb) : c.key === "gallery" ? c.sub(designsCount) : c.sub()
                                    }>
                                        {c.key === "upload" ? c.sub(maxSizeMb) : c.key === "gallery" ? c.sub(designsCount) : c.sub()}
                                    </div>
                                </div>
                                {selected ? (
                                    <Icon icon="mdi:check-circle" className="tw-text-xl tw-text-[#f44032]" aria-hidden />
                                ) : (
                                    <span className="tw-w-5 tw-h-5 tw-rounded-full tw-border tw-border-gray-300 dark:tw-border-gray-700" aria-hidden />
                                )}
                            </div>
                        </button>
                    );
                })}
            </div>

            {/* Upload panel */}
            {mode === "upload" && (
                <div className="tw-mt-3 tw-rounded-2xl tw-border tw-border-gray-200 dark:tw-border-gray-800 tw-bg-white dark:tw-bg-gray-900 tw-p-4">
                    {/* Dropzone */}
                    <div
                        onDrop={onDrop}
                        onDragOver={onDragOver}
                        onDragLeave={onDragLeave}
                        className={`tw-rounded-2xl tw-border tw-border-dashed tw-p-5 tw-text-center tw-transition
              ${isDragging ? "tw-border-[#f44032] tw-bg-[#f44032]/5" : "tw-border-gray-300 dark:tw-border-gray-700"}
            `}
                    >
                        <Icon icon="mdi:tray-arrow-up" className="tw-text-3xl tw-mx-auto tw-mb-2 tw-text-gray-500" />
                        <div className="tw-text-sm tw-text-gray-700 dark:tw-text-gray-200">
                            Drag & drop your file here, or
                        </div>
                        <div className="tw-mt-2">
                            <label className="tw-inline-flex tw-items-center tw-gap-2 tw-cursor-pointer tw-rounded-2xl tw-border tw-border-gray-200 dark:tw-border-gray-700 tw-bg-white dark:tw-bg-gray-900 tw-px-4 tw-py-2 hover:tw-bg-gray-50 dark:hover:tw-bg-gray-800">
                                <Icon icon="mdi:file-upload-outline" />
                                <span className="tw-text-sm tw-font-medium">Browse files</span>
                                <input
                                    ref={inputRef}
                                    type="file"
                                    accept={accept}
                                    onChange={onPickFile}
                                    className="tw-hidden"
                                />
                            </label>
                        </div>

                        <div className="tw-mt-2 tw-text-[11px] tw-text-gray-500">
                            Allowed: PDF, AI, EPS, PSD, SVG, PNG, JPG • Max {maxSizeMb}MB
                        </div>
                    </div>

                    {/* Selected file pill + preview */}
                    {file && (
                        <div className="tw-mt-4 tw-flex tw-items-center tw-justify-between tw-gap-3 tw-flex-wrap">
                            <div className="tw-flex tw-items-center tw-gap-3 tw-min-w-0">
                                {/* Preview if image */}
                                {isImage(file.name) ? (
                                    <img
                                        src={URL.createObjectURL(file)}
                                        alt="Preview"
                                        className="tw-w-12 tw-h-12 tw-object-cover tw-rounded-xl tw-border tw-border-gray-200 dark:tw-border-gray-700"
                                    />
                                ) : (
                                    <div className="tw-grid tw-place-items-center tw-w-12 tw-h-12 tw-rounded-xl tw-border tw-border-gray-200 dark:tw-border-gray-700">
                                        <Icon icon="mdi:file-outline" className="tw-text-xl tw-text-gray-500" />
                                    </div>
                                )}

                                <div className="tw-min-w-0">
                                    <div className="tw-text-sm tw-font-medium tw-truncate max-[320px]:tw-max-w-[120px] sm:tw-max-w-[280px]">
                                        {file.name}
                                    </div>
                                    <div className="tw-text-xs tw-text-gray-500">
                                        {bytesToMb(file.size)} MB • {file.type || "unknown type"}
                                    </div>
                                </div>
                            </div>

                            <div className="tw-flex tw-items-center tw-gap-2">
                                <button
                                    type="button"
                                    onClick={clearState}
                                    className="tw-inline-flex tw-items-center tw-gap-1 tw-text-xs tw-rounded-xl tw-border tw-border-gray-200 dark:tw-border-gray-700 tw-px-3 tw-py-1.5 hover:tw-bg-gray-50 dark:hover:tw-bg-gray-800"
                                >
                                    <Icon icon="mdi:close-circle-outline" className="tw-text-sm" />
                                    Remove
                                </button>

                                <button
                                    type="button"
                                    onClick={upload}
                                    disabled={busy}
                                    className={`tw-inline-flex tw-items-center tw-gap-2 tw-text-sm tw-font-semibold tw-rounded-2xl tw-px-4 tw-py-2
                    ${busy ? "tw-bg-gray-300 tw-text-gray-600" : "tw-bg-[#f44032] tw-text-white hover:tw-scale-[1.01]"}
                  `}
                                >
                                    <Icon icon="mdi:upload" />
                                    {busy ? "Uploading..." : "Upload"}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Progress bar */}
                    {busy && (
                        <div className="tw-mt-3">
                            <div className="tw-w-full tw-h-2 tw-rounded-full tw-bg-gray-200 dark:tw-bg-gray-800 tw-overflow-hidden">
                                <div
                                    className="tw-h-full tw-bg-[#f44032] tw-rounded-full tw-transition-[width] tw-duration-200"
                                    style={{ width: `${progress}%` }}
                                />
                            </div>
                            <div className="tw-text-xs tw-text-gray-500 tw-mt-1">{progress}%</div>
                        </div>
                    )}

                    {/* Notices */}
                    {message && (
                        <div className="tw-mt-3 tw-rounded-xl tw-border tw-border-emerald-300 tw-bg-emerald-50 tw-text-emerald-900 tw-p-3 tw-text-sm">
                            {message}
                        </div>
                    )}
                    {error && (
                        <div className="tw-mt-3 tw-rounded-xl tw-border tw-border-rose-300 tw-bg-rose-50 tw-text-rose-900 tw-p-3 tw-text-sm">
                            {error}
                        </div>
                    )}

                    {/* Microcopy */}
                    <p className="tw-text-[11px] tw-text-gray-500 tw-mt-3">
                        Tip: Vector files (AI/EPS/PDF) or high-resolution images give the best results. We’ll verify size, bleed, and colors before printing.
                    </p>
                </div>
            )}
        </section>
    );
}
