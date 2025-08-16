import React, { useMemo, useRef, useState, useCallback } from "react";
import { Icon } from "@iconify/react";
import axios from "axios";

const bytesToMb = (b) => (b / (1024 * 1024)).toFixed(2);

// Add "link" card
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
    {
        key: "link",
        icon: "mdi:link-variant",
        title: "Share a link",
        sub: () => "Google Drive / Dropbox / OneDrive / WeTransfer",
    },
];

export default function DesignSelector({
    productId,
    designsCount = 0,
    onOpenGallery,   // () => void
    onHireDesigner,  // () => void
    onUploaded,      // (payload) => void (optional) -- used for both uploads & links
    maxSizeMb = 25,
}) {
    const [mode, setMode] = useState(null); // 'upload' | 'gallery' | 'hire' | 'link'
    const [file, setFile] = useState(null);
    const [busy, setBusy] = useState(false);
    const [message, setMessage] = useState(null);
    const [error, setError] = useState(null);
    const [progress, setProgress] = useState(0);
    const [isDragging, setIsDragging] = useState(false);

    // link state
    const [linkUrl, setLinkUrl] = useState("");
    const [linkNote, setLinkNote] = useState("");

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

    const isImage = (name = "") => /\.(png|jpe?g|webp|gif)$/i.test(name.trim());

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

        let payload = null;

        try {
            const fd = new FormData();
            fd.append("file", file);
            fd.append("product_id", productId);

            const { data } = await axios.post("/api/design-uploads", fd, {
                headers: { "Content-Type": "multipart/form-data", Accept: "application/json" },
                onUploadProgress: (evt) => {
                    if (!evt.total) return;
                    setProgress(Math.round((evt.loaded * 100) / evt.total));
                },
                // optional but nice: treat only 5xx as errors
                validateStatus: (s) => s >= 200 && s < 500,
            });

            if (data?.ok) {
                payload = data;
                setMessage("Design uploaded. Our team will review the file and confirm.");
                // keep error null
            } else {
                setError(data?.message || "Upload failed. Please try again.");
            }
        } catch (e) {
            setError(e?.response?.data?.message || "Upload failed. Please try again.");
        } finally {
            setBusy(false);
        }

        // Call the hook OUTSIDE the try/catch so its errors don't show as upload errors
        if (payload && onUploaded) {
            Promise.resolve()
                .then(() => onUploaded(payload))
                .catch((hookErr) => console.warn("onUploaded hook error:", hookErr));
        }
    };


    // Simple URL validation + optional domain hinting
    const urlPattern = /^(https?:\/\/)[^\s/$.?#].[^\s]*$/i;
    const knownHosts = ["drive.google.com", "dropbox.com", "onedrive.live.com", "1drv.ms", "wetransfer.com"];

    const handleSubmitLink = async () => {
        setError(null);
        setMessage(null);

        const url = (linkUrl || "").trim();
        if (!urlPattern.test(url)) {
            setError("Please paste a valid URL (must start with http:// or https://).");
            return;
        }

        setBusy(true);
        let payload = null;

        try {
            const { data } = await axios.post(
                "/api/design-links",
                { product_id: productId, url, note: linkNote || null },
                { headers: { Accept: "application/json" }, validateStatus: (s) => s >= 200 && s < 500 }
            );

            if (data?.ok) {
                payload = data;
                setMessage("Link received. Make sure the file is publicly accessible.");
            } else {
                setError(data?.message || "Could not save the link. Please try again.");
            }
        } catch (e) {
            setError(e?.response?.data?.message || "Could not save the link. Please try again.");
        } finally {
            setBusy(false);
        }

        if (payload && onUploaded) {
            Promise.resolve()
                .then(() => onUploaded(payload))
                .catch((hookErr) => console.warn("onUploaded hook error:", hookErr));
        }
    };


    const handleSelectMode = (key) => {
        setMode(key);
        if (key === "gallery") onOpenGallery?.();
        if (key === "hire") {
            onUploaded?.({ ok: true, type: "hire" });
        }
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
            <div role="radiogroup" aria-label="Design options" className="tw-grid md:tw-grid-cols-2 tw-gap-2">
                {MODE_CARDS.map((c) => {
                    const selected = mode === c.key;
                    return (
                        <button
                            key={c.key}
                            type="button"
                            role="radio"
                            aria-checked={selected}
                            onClick={() => handleSelectMode(c.key)}
                            className={`tw-w-full tw-text-left tw-rounded-2xl border tw-p-4 tw-min-w-0 hover:tw-shadow
                focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-inset
                focus-visible:tw-ring-[#f44032] focus-visible:tw-ring-offset-2
                ${selected ? "tw-border-[#f44032] tw-bg-[#f44032]/5" : "tw-border-gray-200 dark:tw-border-gray-800"}
              `}
                        >
                            <div className="tw-flex tw-items-start tw-gap-3 tw-min-w-0">
                                <span className="tw-shrink-0 tw-rounded-xl tw-bg-white tw-border tw-border-gray-200 dark:tw-bg-gray-900 dark:tw-border-gray-800 tw-p-2">
                                    <Icon icon={c.icon} className="tw-text-2xl tw-text-[#f44032]" />
                                </span>
                                <div className="tw-flex-1 tw-min-w-0 tw-max-w-full">
                                    <div className="tw-font-semibold tw-text-sm tw-truncate tw-break-words" title={c.title}>
                                        {c.title}
                                    </div>
                                    <div
                                        className="tw-text-xs tw-text-gray-500 tw-mt-0.5 tw-line-clamp-2 tw-break-words"
                                        title={
                                            c.key === "upload"
                                                ? c.sub(maxSizeMb)
                                                : c.key === "gallery"
                                                    ? c.sub(designsCount)
                                                    : c.sub()
                                        }
                                    >
                                        {c.key === "upload"
                                            ? c.sub(maxSizeMb)
                                            : c.key === "gallery"
                                                ? c.sub(designsCount)
                                                : c.sub()}
                                    </div>
                                </div>
                                {selected ? (
                                    <Icon icon="mdi:check-circle" className="tw-text-xl tw-text-[#f44032] tw-shrink-0" aria-hidden />
                                ) : (
                                    <span className="tw-w-5 tw-h-5 tw-rounded-full tw-border tw-border-gray-300 dark:tw-border-gray-700 tw-shrink-0" aria-hidden />
                                )}
                            </div>
                        </button>
                    );
                })}
            </div>

            {/* Upload panel */}
            {mode === "upload" && (
                <div className="tw-mt-3 tw-rounded-2xl tw-border tw-border-gray-200 dark:tw-border-gray-800 tw-bg-white dark:tw-bg-gray-900 tw-p-4">
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

                    {file && (
                        <div className="tw-mt-4 tw-flex tw-items-center tw-justify-between tw-gap-3 tw-flex-wrap">
                            <div className="tw-flex tw-items-center tw-gap-3 tw-min-w-0">
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

                    {/* // Only show one banner visually */}
                    {message && !error && (
                        <div className="tw-mt-3 tw-rounded-xl tw-border tw-border-emerald-300 tw-bg-emerald-50 tw-text-emerald-900 tw-p-3 tw-text-sm">
                            {message}
                        </div>
                    )}
                    {error && !message && (
                        <div className="tw-mt-3 tw-rounded-xl tw-border tw-border-rose-300 tw-bg-rose-50 tw-text-rose-900 tw-p-3 tw-text-sm">
                            {error}
                        </div>
                    )}


                    <p className="tw-text-[11px] tw-text-gray-500 tw-mt-3">
                        Tip: Vector files (AI/EPS/PDF) or high-resolution images give the best results. We’ll verify size, bleed, and colors before printing.
                    </p>
                </div>
            )}

            {/* Share a link panel */}
            {mode === "link" && (
                <div className="tw-mt-3 tw-rounded-2xl tw-border tw-border-gray-200 dark:tw-border-gray-800 tw-bg-white dark:tw-bg-gray-900 tw-p-4">
                    <div className="tw-space-y-2">
                        <label className="tw-text-sm tw-font-medium">Paste your public file link</label>
                        <input
                            type="url"
                            value={linkUrl}
                            onChange={(e) => setLinkUrl(e.target.value)}
                            placeholder="https://drive.google.com/… or https://wetransfer.com/…"
                            className="tw-w-full tw-h-11 tw-rounded-xl tw-border tw-px-3 dark:tw-bg-gray-900 dark:tw-border-gray-700"
                            inputMode="url"
                            autoComplete="off"
                        />

                        <label className="tw-text-sm tw-font-medium">Notes (optional)</label>
                        <textarea
                            value={linkNote}
                            onChange={(e) => setLinkNote(e.target.value)}
                            rows={3}
                            placeholder="Any instructions (size, bleed, special finishing, etc.)"
                            className="tw-w-full tw-rounded-xl tw-border tw-px-3 tw-py-2 dark:tw-bg-gray-900 dark:tw-border-gray-700"
                        />

                        <div className="tw-flex tw-items-center tw-gap-2 tw-flex-wrap tw-text-xs tw-text-gray-500">
                            <span>Supported examples:</span>
                            {knownHosts.map((h) => (
                                <span
                                    key={h}
                                    className="tw-inline-flex tw-items-center tw-gap-1 tw-rounded-full tw-border tw-border-gray-200 dark:tw-border-gray-700 tw-px-2 tw-py-0.5"
                                >
                                    <Icon icon="mdi:link-variant" className="tw-text-sm tw-opacity-70" />
                                    {h}
                                </span>
                            ))}
                        </div>

                        <p className="tw-text-[11px] tw-text-gray-500">
                            Make sure the link is <span className="tw-font-medium">set to public / anyone with the link</span> so we can access the file.
                        </p>

                        <div className="tw-flex tw-items-center tw-gap-2 tw-pt-1">
                            <button
                                type="button"
                                onClick={handleSubmitLink}
                                disabled={busy}
                                className={`tw-inline-flex tw-items-center tw-gap-2 tw-rounded-2xl tw-px-4 tw-py-2 tw-font-semibold
                  ${busy ? "tw-bg-gray-300 tw-text-gray-600" : "tw-bg-[#f44032] tw-text-white hover:tw-scale-[1.01]"}
                `}
                            >
                                <Icon icon="mdi:check-circle-outline" />
                                {busy ? "Saving..." : "Save link"}
                            </button>

                            <button
                                type="button"
                                onClick={() => { setLinkUrl(""); setLinkNote(""); setError(null); setMessage(null); }}
                                className="tw-inline-flex tw-items-center tw-gap-1 tw-rounded-2xl tw-border tw-border-gray-200 dark:tw-border-gray-700 tw-px-3 tw-py-2 hover:tw-bg-gray-50 dark:hover:tw-bg-gray-800"
                            >
                                <Icon icon="mdi:close-circle-outline" />
                                Clear
                            </button>
                        </div>

                        {/* // Only show one banner visually */}
                        {message && !error && (
                            <div className="tw-mt-3 tw-rounded-xl tw-border tw-border-emerald-300 tw-bg-emerald-50 tw-text-emerald-900 tw-p-3 tw-text-sm">
                                {message}
                            </div>
                        )}
                        {error && !message && (
                            <div className="tw-mt-3 tw-rounded-xl tw-border tw-border-rose-300 tw-bg-rose-50 tw-text-rose-900 tw-p-3 tw-text-sm">
                                {error}
                            </div>
                        )}

                    </div>
                </div>
            )}
        </section>
    );
}
