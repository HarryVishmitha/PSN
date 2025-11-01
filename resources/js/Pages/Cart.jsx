// resources/js/Pages/cart.jsx
import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { Head, Link, router } from "@inertiajs/react";

// Layout
import Header from "@/Components/Header";
import CookieConsent from "@/Components/CookieConsent";
import Footer from "@/Components/Footer";
import Meta from "@/Components/Metaheads";
import Breadcrumb from "@/Components/BreadcrumbHome";

// UI
import { Icon } from "@iconify/react";
import AOS from "aos";
import "aos/dist/aos.css";

// Cart API
import {
    getCart,
    clearCart as apiClearCart,
    updateCartItem,
    removeCartItem,
    applyOffer,
    removeOffer,
    setShippingMethod,
    attachUpload,
    mergeGuestCartOnLogin,
    onCartUpdated,
    onCartError,
    addCartItem, // NEW: used when user picks multiple gallery designs for an existing line
} from "@/lib/cartApi";

// Extras
import axios from "axios";
import DesignSelector from "@/Components/DesignSelector";

/* ======================================================================
   Utilities
========================================================================*/
const formatMoney = (n) =>
    Number(n || 0).toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });

const useDebounce = (fn, delay = 450) => {
    const t = useRef(null);
    return (...args) => {
        if (t.current) clearTimeout(t.current);
        t.current = setTimeout(() => fn(...args), delay);
    };
};

// Fallback image
const IMG_FALLBACK = "/images/default.png";

// Fetch shipping methods (simple safe fetcher)
async function fetchShippingMethodsSafe() {
    try {
        const res = await fetch("/api/shipping-methods", {
            credentials: "include",
            headers: { Accept: "application/json" },
        });
        const data = await res.json();
        if (data?.ok && Array.isArray(data?.methods)) return data.methods;
    } catch (_) { }
    return [];
}

// Attempt to read product info from cart line, otherwise fall back to summaries endpoint
async function fetchProductSummaries(ids = []) {
    if (!ids?.length) return {};
    try {
        const qp = new URLSearchParams({ ids: ids.join(",") }).toString();
        const { data } = await axios.get(`/api/product-summaries?${qp}`, {
            headers: { Accept: "application/json" },
        });
        // expect: { ok: true, items: { [id]: { id, name, primary_image_url, meta_description } } }
        return data?.items || {};
    } catch (_) {
        return {};
    }
}

/* ======================================================================
   Light Modal + Confirm Modal
========================================================================*/
function ModalShell({ open, onClose, children, widthClass = "tw-max-w-2xl" }) {
    if (!open) return null;
    return (
        <div className="tw-fixed tw-inset-0 tw-z-50 tw-flex tw-items-center tw-justify-center">
            <div className="tw-absolute tw-inset-0 tw-bg-black/50" onClick={onClose} />
            <div className={`tw-relative tw-z-10 ${widthClass} tw-w-full tw-mx-4 tw-bg-white tw-rounded-2xl tw-shadow-xl tw-p-4`}>{children}</div>
        </div>
    );
}

function ConfirmModal({ open, title = "Are you sure?", subtitle, confirmText = "Confirm", cancelText = "Cancel", danger = false, busy = false, onConfirm, onClose }) {
    return (
        <ModalShell open={open} onClose={onClose} widthClass="tw-max-w-md">
            <div className="tw-flex tw-items-start tw-gap-3">
                <span className={`tw-p-2 tw-rounded-xl ${danger ? "tw-bg-rose-100 tw-text-rose-600" : "tw-bg-amber-100 tw-text-amber-700"}`}>
                    <Icon icon={danger ? "mdi:trash-can" : "mdi:alert-outline"} className="tw-text-2xl" />
                </span>
                <div className="tw-flex-1">
                    <h3 className="tw-font-semibold tw-text-gray-800">{title}</h3>
                    {subtitle && <p className="tw-text-sm tw-text-gray-600 tw-mt-1">{subtitle}</p>}
                    <div className="tw-flex tw-justify-end tw-gap-2 tw-mt-4">
                        <button onClick={onClose} className="tw-rounded-xl tw-border tw-border-gray-300 tw-px-4 tw-py-2 tw-text-sm">{cancelText}</button>
                        <button onClick={onConfirm} disabled={busy} className={`tw-rounded-xl tw-px-4 tw-py-2 tw-text-sm tw-text-white ${danger ? "tw-bg-rose-600 hover:tw-bg-rose-700" : "tw-bg-gray-900 hover:tw-bg-black"} disabled:tw-opacity-50`}>
                            {busy ? "Working…" : confirmText}
                        </button>
                    </div>
                </div>
            </div>
        </ModalShell>
    );
}

/* ======================================================================
   Toasts (unchanged)
========================================================================*/
function Toasts({ toasts, dismiss }) {
    return (
        <div className="tw-fixed tw-z-50 tw-right-4 tw-bottom-4 tw-flex tw-flex-col tw-gap-2">
            {toasts.map((t) => (
                <div key={t.id} className={`tw-min-w-[260px] tw-max-w-[340px] tw-rounded-xl tw-shadow-lg tw-p-3 tw-text-sm tw-flex tw-items-start tw-gap-2 ${t.type === "error" ? "tw-bg-rose-50 tw-text-rose-900 tw-border tw-border-rose-200" : "tw-bg-emerald-50 tw-text-emerald-900 tw-border tw-border-emerald-200"}`}>
                    <Icon icon={t.type === "error" ? "mdi:alert-circle" : "mdi:check-circle"} className="tw-text-xl" />
                    <div className="tw-flex-1">
                        <div className="tw-font-semibold">{t.title}</div>
                        {t.message && <div className="tw-mt-0.5">{t.message}</div>}
                    </div>
                    <button className="tw-opacity-70 hover:tw-opacity-100" onClick={() => dismiss(t.id)}>
                        <Icon icon="mdi:close" className="tw-text-lg" />
                    </button>
                </div>
            ))}
        </div>
    );
}

/* ======================================================================
   Product gallery modal (multi-select)
   – mirrors ProductDetails approach where multiple selected gallery
     designs create multiple cart lines
========================================================================*/
function DesignGalleryModal({ open, productId, initialSelected = [], onClose, onConfirm }) {
    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState(null);
    const [designs, setDesigns] = useState([]);
    const [selected, setSelected] = useState(() => new Set(initialSelected));

    const MasonryDesignCard = ({ d, isSelected, onClick }) => {
        return (
            <figure
                className={[
                    "tw-mb-4 tw-rounded-2xl tw-overflow-hidden tw-border tw-bg-white",
                    "tw-break-inside-avoid", // <-- masonry helper
                    isSelected
                        ? "tw-border-[#f44032] tw-ring-2 tw-ring-[#f44032]/30"
                        : "tw-border-gray-200 dark:tw-border-gray-800",
                ].join(" ")}
                title={d?.name || "Design"}
            >
                <img
                    src={d.image_url || IMG_FALLBACK}
                    alt={d.name || "Design"}
                    className="tw-w-full tw-h-auto tw-block"  // natural ratio
                    loading="lazy"
                />

                {/* Footer bar + select pill */}
                <figcaption className="tw-relative tw-p-2">
                    <div className="tw-absolute tw-bottom-2 tw-right-2">
                        <button
                            type="button"
                            onClick={onClick}
                            className={[
                                "tw-rounded-xl tw-px-3 tw-py-1.5 tw-text-xs tw-font-semibold tw-shadow",
                                isSelected ? "tw-bg-[#f44032] tw-text-white" : "tw-bg-white tw-border tw-border-gray-200",
                            ].join(" ")}
                        >
                            {isSelected ? "Selected" : "Select"}
                        </button>
                    </div>
                    <div className="tw-text-xs tw-text-gray-700 tw-pr-24 tw-truncate">{d?.name || "Design"}</div>
                </figcaption>
            </figure>
        );
    };

    const toggle = (id) => setSelected((prev) => {
        const n = new Set(prev);
        n.has(id) ? n.delete(id) : n.add(id);
        return n;
    });

    // helpers at top of file (near other utils)
    const unwrapDesigns = (payload) => {
        // accept many common API shapes
        if (!payload) return [];
        if (Array.isArray(payload)) return payload;
        if (Array.isArray(payload.data)) return payload.data;
        if (Array.isArray(payload.designs)) return payload.designs;
        if (Array.isArray(payload.items)) return payload.items;
        if (payload.data && Array.isArray(payload.data.data)) return payload.data.data;
        return [];
    };

    // inside DesignGalleryModal
    useEffect(() => {
        let cancelled = false;

        const run = async () => {
            if (!open) return;
            if (!productId) {
                setDesigns([]);
                setErr("Missing product id for gallery.");
                return;
            }

            setLoading(true);
            setErr(null);

            try {
                const res = await axios.get(`/api/products/${productId}/designs`, {
                    params: { per_page: 18 },
                    // keep Accept for Laravel/JSON; include cookies if your API needs auth
                    headers: { Accept: "application/json" },
                    withCredentials: true,
                    validateStatus: (s) => s >= 200 && s < 500, // we’ll inspect body/status
                });

                // Log what we got so you can inspect shapes in devtools
                console.debug("[Gallery] fetch designs", {
                    status: res.status,
                    productId,
                    raw: res.data,
                });

                // common soft errors
                if (res.status === 401 || res.status === 419) {
                    !cancelled && setErr("You’re not signed in (401/419). Please log in.");
                    !cancelled && setDesigns([]);
                    return;
                }
                if (res.status === 404) {
                    !cancelled && setErr("No designs found for this product (404).");
                    !cancelled && setDesigns([]);
                    return;
                }

                const list = unwrapDesigns(res.data).map((d) => ({
                    // normalize a few possible field names
                    id: d.id ?? d.design_id,
                    name: d.name ?? d.title ?? "Design",
                    image_url: d.image_url ?? d.image ?? d.thumbnail_url ?? null,
                    ...d,
                }));

                if (!cancelled) {
                    setDesigns(list);
                    if (!list.length) setErr("No designs available for this product.");
                }
            } catch (e) {
                console.error("[Gallery] designs error", e);
                if (!cancelled) {
                    setErr(
                        e?.response?.data?.message ||
                        e?.message ||
                        "Could not load designs."
                    );
                    setDesigns([]);
                }
            } finally {
                !cancelled && setLoading(false);
            }
        };

        run();
        return () => { cancelled = true; };
    }, [open, productId]);

    const confirm = () => onConfirm?.(Array.from(selected));

    return (
        <ModalShell open={open} onClose={onClose} widthClass="tw-max-w-[min(1100px,95vw)]">
            <div className="tw-sticky tw-top-2 tw-z-10 tw-bg-white tw-rounded-xl tw-pb-2">
                <div className="tw-flex tw-items-center tw-justify-between tw-mb-2">
                    <h3 className="tw-text-2xl tw-font-extrabold">Choose design(s)</h3>
                    <button onClick={onClose} className="tw-p-2 tw-rounded-xl tw-bg-gray-100">
                        <Icon icon="mdi:close" />
                    </button>
                </div>
            </div>
            {selected.size > 0 && (
                <div className="tw-text-xs tw-text-gray-600 tw-mt-2">
                    {selected.size} selected
                </div>
            )}
            {err && <div className="tw-mb-3 tw-text-sm tw-text-rose-600">{err}</div>}
            {!loading && !err && designs.length === 0 && (
                <div className="tw-text-sm tw-text-gray-500 tw-py-6 tw-text-center">
                    No designs for this product yet.
                </div>
            )}

            {loading ? (
                // Skeleton in masonry style (vary heights a bit)
                <div className="tw-columns-2 sm:tw-columns-3 lg:tw-columns-4 tw-gap-4">
                    {Array.from({ length: 10 }).map((_, i) => (
                        <div
                            key={i}
                            className="tw-mb-4 tw-rounded-2xl tw-animate-pulse tw-bg-gray-200"
                            style={{ height: 140 + (i % 3) * 40 }}
                        />
                    ))}
                </div>
            ) : (
                <div className="tw-columns-2 sm:tw-columns-3 lg:tw-columns-4 tw-gap-4">
                    {designs.map((d) => (
                        <MasonryDesignCard
                            key={d.id}
                            d={d}
                            isSelected={selected.has(d.id)}
                            onClick={() => toggle(d.id)}
                        />
                    ))}
                </div>
            )}
            <div className="tw-flex tw-justify-end tw-gap-2 tw-mt-4">
                <button onClick={onClose} className="tw-rounded-xl tw-border tw-border-gray-300 tw-px-4 tw-py-2 tw-text-sm">Cancel</button>
                <button onClick={confirm} className="tw-rounded-xl tw-bg-[#f44032] tw-text-white tw-px-4 tw-py-2 tw-text-sm">Use selected</button>
            </div>
        </ModalShell>
    );
}

/* ======================================================================
   Skeletons / Empty state
========================================================================*/
function LineSkeleton() {
    return (
        <div className="tw-flex tw-gap-3 tw-border tw-border-gray-200 tw-rounded-xl tw-p-3 tw-animate-pulse">
            <div className="tw-w-20 tw-h-20 tw-bg-gray-200 tw-rounded-lg" />
            <div className="tw-flex-1">
                <div className="tw-h-4 tw-bg-gray-200 tw-rounded tw-w-1/2" />
                <div className="tw-h-3 tw-bg-gray-200 tw-rounded tw-w-1/3 tw-mt-2" />
                <div className="tw-h-3 tw-bg-gray-200 tw-rounded tw-w-1/4 tw-mt-2" />
            </div>
        </div>
    );
}

function EmptyState() {
    return (
        <div className="tw-flex tw-flex-col tw-items-center tw-justify-center tw-text-center tw-py-16 tw-bg-gray-50 dark:tw-bg-gray-800 tw-rounded-xl">
            <Icon icon="tabler:shopping-cart-off" className="tw-text-gray-400 dark:tw-text-gray-500 tw-text-7xl tw-mb-4 tw-animate-pulse" />
            <h5 className="tw-text-xl tw-font-semibold tw-text-gray-700 dark:tw-text-gray-200">Your cart is empty!</h5>
            <p className="tw-text-gray-500 dark:tw-text-gray-400 tw-mt-2 tw-mb-4">Looks like you haven't added anything yet.</p>
            <Link href="/products/all" className="tw-inline-block tw-bg-[#f44032] tw-text-white tw-py-2 tw-px-6 tw-rounded-lg tw-shadow hover:tw-text-white hover:tw-bg-[#f44032]/90 transition">Browse Products</Link>
        </div>
    );
}

/* ======================================================================
   A single cart row
========================================================================*/
function CartRow({ line, onUpdate, onRemoveAsk, onAttachUpload, productInfo, openGalleryFor }) {
    const [qty, setQty] = useState(line.quantity ?? 1);
    const isRoll = (line.pricing_method || "").toLowerCase() === "roll";
    const [localSize, setLocalSize] = useState({
        size_unit: line.size_unit || (isRoll ? "ft" : null),
        width: line.width || "",
        height: line.height || "",
    });

    // NEW: reveal/hide selector and keep it controlled like on ProductDetails
    const [editingDesign, setEditingDesign] = useState(false);
    const [designSource, setDesignSource] = useState(null); // 'upload' | 'gallery' | 'link' | 'hire' | null

    useEffect(() => {
        setQty(line.quantity ?? 1);
        setLocalSize({
            size_unit: line.size_unit || (isRoll ? "ft" : null),
            width: line.width || "",
            height: line.height || "",
        });
        // reset selector state when the row identity changes
        setEditingDesign(false);
        setDesignSource(null);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [line.id]);

    const debouncedPush = useDebounce(onUpdate, 550);

    // Quantity
    const changeQty = (newQty) => {
        const q = Math.max(1, Number(newQty || 1));
        setQty(q);
        debouncedPush(line.id, { quantity: q });
    };

    // Sizes (roll)
    const changeSize = (field, value) => {
        const next = { ...localSize, [field]: value };
        setLocalSize(next);
        const payload = {};
        if (typeof next.size_unit === "string") payload.size_unit = next.size_unit;
        if (next.width !== "") payload.width = Number(next.width);
        if (next.height !== "") payload.height = Number(next.height);
        debouncedPush(line.id, payload);
    };

    // Option chips (unchanged)
    const optionBadges = useMemo(() => {
        const bag = line.options || {};
        const chips = [];
        if (bag && typeof bag === "object") {
            Object.entries(bag).forEach(([group, val]) => {
                if (val && typeof val === "object") {
                    const label = val.label || val.value || val.id || "";
                    if (label) chips.push(`${group}: ${label}`);
                    if (val.sub && typeof val.sub === "object") {
                        Object.entries(val.sub).forEach(([sg, sv]) => {
                            const subLabel = sv?.label || sv?.value || sv?.id || "";
                            if (subLabel) chips.push(`${sg}: ${subLabel}`);
                        });
                    }
                } else if (val) {
                    chips.push(`${group}: ${String(val)}`);
                }
            });
        }
        return chips;
    }, [line.options]);

    const info = productInfo[line.product_id] || {};
    const imageUrl = line.product_primary_image || info.primary_image_url || IMG_FALLBACK;
    const productName = line.product_name || info.name || `Product #${line.product_id}`;
    const metaDesc = (line.product_meta_description || info.meta_description || "").toString();

    const hasDesign = !!line.user_design_upload_id || !!line.design_id || !!line.hire_designer;

    // Attach upload/link to this cart line
    const handleUploaded = async (payload) => {
        const uploadId = payload?.upload_id || payload?.id;
        if (!uploadId) return;
        await onAttachUpload(line.id, uploadId);      // updates DB + refreshes cart
        try {
            await updateCartItem(line.id, {
                user_design_upload_id: uploadId,
                product_design_id: null,
                hire_designer: false,
            });
        } catch (_) { }
        setEditingDesign(false);                      // close panel after success
        // keep source to reflect last action (upload/link)
        setDesignSource(payload?.type === "link" ? "link" : "upload");
    };

    // Human readable design source
    const getDesignSourceLabel = () => {
        if (line.hire_designer) return "Hire a designer";

        const upload = line.user_design_upload;
        if (upload) {
            switch (upload.type) {
                case "file": return "Uploaded file";
                case "link": return "Shared link";
                case "hire": return "Need a designer";
                default: return "Custom design";
            }
        }
        if (line.design_id) return "Selected from gallery";
        return "No design selected";
    };

    // Best-effort preview URL
    const getDesignPreviewUrl = () => {
        if (line.hire_designer) return null; // hard stop for hire

        const upload = line.user_design_upload;
        // Never preview for link/hire
        if (upload?.type === "link" || upload?.type === "hire") return null;
        if (upload?.image_url) return upload.image_url;
        if (upload?.file_path) return `/storage/${upload.file_path}`; // adjust if your paths differ
        // Only show gallery image when there is no upload and not hiring
        if (!line.user_design_upload_id && !line.hire_designer && line.design?.image_url) {
            return line.design.image_url;
        }
        return null;
    };
    const designPreviewUrl = getDesignPreviewUrl();

    // If cart updates (user picked gallery or uploaded), auto-close the editor
    useEffect(() => {
        if (line.user_design_upload_id || line.design_id || line.hire_designer) {
            setEditingDesign(false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [line.user_design_upload_id, line.design_id, line.hire_designer]);

    return (
        <div className="tw-flex tw-gap-3 tw-border tw-border-gray-200 dark:tw-border-gray-800 tw-rounded-2xl tw-p-3 tw-bg-white">
            {/* Product thumb */}
            <div className="tw-relative tw-w-24 tw-h-24 tw-rounded-xl tw-overflow-hidden tw-bg-gray-100 tw-flex tw-items-center tw-justify-center">
                <img src={imageUrl || IMG_FALLBACK} alt={productName} className="tw-absolute tw-inset-0 tw-w-full tw-h-full tw-object-cover" />
            </div>

            <div className="tw-flex-1">
                <div className="tw-flex tw-items-start tw-justify-between tw-gap-3">
                    <div className="tw-min-w-0">
                        <h6 className="tw-font-semibold tw-text-gray-800 tw-truncate" title={productName}>{productName}</h6>

                        {optionBadges.length > 0 && (
                            <div className="tw-mt-1 tw-flex tw-flex-wrap tw-gap-1">
                                {optionBadges.map((t, i) => (
                                    <span key={i} className="tw-text-[11px] tw-px-2 tw-py-0.5 tw-rounded-full tw-bg-gray-100 tw-text-gray-700">{t}</span>
                                ))}
                            </div>
                        )}

                        {metaDesc && (
                            <p className="tw-mt-1 tw-text-xs tw-text-gray-500 tw-line-clamp-2" title={metaDesc}>{metaDesc}</p>
                        )}

                        {isRoll && (
                            <div className="tw-mt-1 tw-text-[12px] tw-text-gray-500">
                                {line.width && line.height ? <>Size: {line.width}×{line.height} {line.size_unit || "ft"}</> : <>Size not set</>}
                            </div>
                        )}

                        {/* Design status + actions */}
                        <div className="tw-flex tw-flex-col tw-gap-2 tw-mt-2">
                            <div className={`tw-inline-flex tw-items-center tw-gap-1 tw-self-start tw-text-xs tw-font-medium tw-rounded-full tw-px-2 tw-py-1 ${hasDesign ? "tw-bg-emerald-50 tw-text-emerald-700" : "tw-bg-amber-50 tw-text-amber-700"}`}>
                                <Icon icon={hasDesign ? "mdi:check-circle" : "mdi:alert"} />
                                {getDesignSourceLabel()}
                                {line.user_design_upload?.original_filename && (
                                    <span className="tw-ml-2 tw-truncate tw-max-w-[220px] tw-text-gray-600">({line.user_design_upload.original_filename})</span>
                                )}
                            </div>

                            {/* LARGE preview (keeps natural ratio) */}
                            {designPreviewUrl && (
                                <div className="tw-rounded-xl tw-overflow-hidden tw-border tw-border-gray-200 dark:tw-border-gray-800 tw-bg-white">
                                    <img
                                        src={designPreviewUrl}
                                        alt="Design preview"
                                        className="tw-w-full tw-h-auto tw-block"
                                        style={{ maxHeight: 320, objectFit: "contain" }}
                                    />
                                </div>
                            )}

                            {/* Primary action */}
                            <div className="tw-flex tw-items-center tw-gap-2">
                                <button
                                    type="button"
                                    onClick={() => setEditingDesign((s) => !s)}
                                    className="tw-text-xs tw-rounded-xl tw-border tw-border-gray-300 tw-px-2 tw-py-1 hover:tw-bg-gray-50"
                                >
                                    {editingDesign ? "Close design options" : (hasDesign ? "Change design" : "Choose a design")}
                                </button>
                            </div>

                            {/* Show DesignSelector only when user wants to edit; keep it CONTROLLED like ProductDetails */}
                            {editingDesign && (
                                <div className="tw-mt-2">
                                    <DesignSelector
                                        productId={line.product_id}
                                        designsCount={0}
                                        source={designSource}                                 // controlled
                                        onChangeSource={(src) => {
                                            setDesignSource(src);
                                            if (src === "gallery") {
                                                // open your gallery modal that returns IDs; your parent handles add/update
                                                openGalleryFor(line);
                                            }
                                        }}
                                        onOpenGallery={() => {
                                            setDesignSource("gallery");
                                            openGalleryFor(line);
                                        }}
                                        onHireDesigner={async () => {
                                            try {
                                                const { ok, message } = await updateCartItem(line.id, {
                                                    hire_designer: true,
                                                    product_design_id: null,
                                                    user_design_upload_id: null,
                                                });
                                                if (!ok) throw new Error(message || "Could not start hire request");
                                                setDesignSource("hire");
                                                setEditingDesign(false);
                                            } catch (e) {
                                                console.warn(e);
                                            }
                                        }}
                                        onUploaded={handleUploaded}                             // upload/link → attach & close
                                    />
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="tw-flex tw-items-center tw-gap-2">
                        <button
                            onClick={() => { setEditingDesign(true); setDesignSource("gallery"); openGalleryFor(line); }}
                            className="tw-text-sm tw-flex tw-items-center tw-gap-1 tw-px-2 tw-py-1 tw-rounded-md tw-border tw-border-gray-200 hover:tw-bg-gray-50"
                            title="Choose/change design"
                        >
                            <Icon icon="mdi:image-multiple-outline" />
                            Design
                        </button>
                        <button onClick={() => onRemoveAsk(line.id)} className="tw-text-gray-500 hover:tw-text-rose-600 tw-rounded-lg tw-p-1" aria-label="Remove" title="Remove from cart">
                            <Icon icon="mdi:trash-can-outline" className="tw-text-xl" />
                        </button>
                    </div>
                </div>

                {/* Controls */}
                <div className="tw-mt-3 tw-flex tw-flex-wrap tw-items-center tw-gap-3">
                    {/* Quantity */}
                    <div className="tw-inline-flex tw-items-stretch tw-h-10 tw-rounded-xl tw-border tw-overflow-hidden tw-bg-white">
                        <button type="button" onClick={() => changeQty(qty - 1)} aria-label="Decrease quantity" disabled={qty <= 1} className="tw-w-10 tw-grid tw-place-content-center hover:tw-bg-gray-50 disabled:tw-opacity-40">
                            <Icon icon="mdi:minus" />
                        </button>
                        <span aria-hidden className="tw-w-px tw-bg-gray-200" />
                        <input type="number" min="1" inputMode="numeric" value={qty} onChange={(e) => changeQty(e.target.value)} className="tw-w-16 tw-text-center tw-border-0 tw-outline-none tw-bg-transparent focus:tw-ring-0 tw-text-sm tw-font-medium" />
                        <span aria-hidden className="tw-w-px tw-bg-gray-200" />
                        <button type="button" onClick={() => changeQty(qty + 1)} aria-label="Increase quantity" className="tw-w-10 tw-grid tw-place-content-center hover:tw-bg-gray-50">
                            <Icon icon="mdi:plus" />
                        </button>
                    </div>

                    {/* Roll size editors */}
                    {isRoll && (
                        <>
                            <div className="tw-inline-flex tw-gap-2">
                                <input type="number" inputMode="decimal" min="0" step="0.1" placeholder="W" value={localSize.width} onChange={(e) => changeSize("width", e.target.value)} className="tw-h-10 tw-w-20 tw-border tw-rounded-xl tw-px-2" title="Width" />
                                <input type="number" inputMode="decimal" min="0" step="0.1" placeholder="H" value={localSize.height} onChange={(e) => changeSize("height", e.target.value)} className="tw-h-10 tw-w-20 tw-border tw-rounded-xl tw-px-2" title="Height" />
                            </div>

                            <div className="tw-inline-flex tw-h-10 tw-rounded-xl tw-border tw-overflow-hidden">
                                {["in", "ft"].map((u) => (
                                    <button key={u} type="button" onClick={() => changeSize("size_unit", u)} className={`tw-px-3 tw-text-sm ${localSize.size_unit === u ? "tw-bg-black tw-text-white" : "tw-bg-white"}`} title={`Unit: ${u}`}>
                                        {u}
                                    </button>
                                ))}
                            </div>
                        </>
                    )}

                    {/* Prices */}
                    <div className="tw-ml-auto tw-text-right">
                        <div className="tw-text-xs tw-text-gray-500">Unit</div>
                        <div className="tw-font-semibold">Rs. {formatMoney(line.unit_price)}</div>
                    </div>
                    <div className="tw-text-right">
                        <div className="tw-text-xs tw-text-gray-500">Subtotal</div>
                        <div className="tw-font-semibold">Rs. {formatMoney(line.subtotal)}</div>
                    </div>
                </div>
            </div>
        </div>
    );
}


/* ======================================================================
   Sidebar widgets
========================================================================*/
function PromoBox({ promo, setPromo, onApply, onRemove, busy, cart }) {
    const activeDiscounts = (cart?.adjustments || []).filter((a) => a.type === "discount" && a.code);

    return (
        <div className="tw-mb-4">
            <label htmlFor="promo" className="tw-text-sm tw-text-gray-600 tw-block tw-mb-1">Promo Code</label>
            <div className="tw-flex tw-gap-2">
                <input id="promo" type="text" value={promo} onChange={(e) => setPromo(e.target.value)} placeholder="Enter code" className="tw-flex-1 tw-border tw-border-gray-300 tw-rounded-md tw-px-3 tw-py-2 tw-text-sm" />
                <button onClick={onApply} disabled={busy || !promo} className="tw-bg-gray-900 tw-text-white tw-text-sm tw-px-3 tw-rounded-md disabled:tw-opacity-50">{busy ? "Applying…" : "Apply"}</button>
            </div>

            {activeDiscounts.map((a) => (
                <div key={a.id} className="tw-flex tw-items-center tw-justify-between tw-mt-2 tw-text-sm">
                    <span className="tw-text-emerald-700">Applied: {a.label || a.code}</span>
                    <button onClick={() => onRemove(a.code)} className="tw-text-rose-600 hover:tw-underline" disabled={busy} title="Remove code">Remove</button>
                </div>
            ))}
        </div>
    );
}

function ShippingSelector({ methods, currentMethodId, picking, onPick }) {
    if (!methods?.length) return null;
    return (
        <div className="tw-mb-4">
            <div className="tw-text-sm tw-font-medium tw-mb-1">Shipping</div>
            <div className="tw-space-y-2">
                {methods.map((m) => (
                    <label key={m.id} className="tw-flex tw-items-center tw-justify-between tw-border tw-rounded-lg tw-px-3 tw-py-2">
                        <div className="tw-flex tw-items-center tw-gap-2">
                            <input type="radio" name="ship" checked={currentMethodId === m.id} onChange={() => onPick(m.id)} disabled={picking} />
                            <span className="tw-text-sm">{m.name}</span>
                        </div>
                        <div className="tw-text-sm tw-font-semibold">Rs. {formatMoney(m.cost)}</div>
                    </label>
                ))}
            </div>
        </div>
    );
}

/* ======================================================================
   Main Page
========================================================================*/
export default function CartPage() {
    const [loading, setLoading] = useState(true);
    const [busy, setBusy] = useState(false);
    const [err, setErr] = useState(null);
    const [cart, setCart] = useState(null);

    const [promo, setPromo] = useState("");
    const [promoBusy, setPromoBusy] = useState(false);

    const [shipOptions, setShipOptions] = useState([]);
    const [shipBusy, setShipBusy] = useState(false);
    const [pickedShipId, setPickedShipId] = useState(null);

    // product info cache (name, primary image, meta description)
    const [productInfo, setProductInfo] = useState({});

    // Modal state
    const [confirm, setConfirm] = useState({ open: false });
    const [galleryFor, setGalleryFor] = useState(null); // the line object we are editing

    // toasts
    const [toasts, setToasts] = useState([]);
    const pushToast = (t) => {
        const id = crypto?.randomUUID?.() || String(Math.random());
        setToasts((prev) => [...prev, { id, ...t }]);
        setTimeout(() => setToasts((prev) => prev.filter((x) => x.id !== id)), 4500);
    };
    const dismissToast = (id) => setToasts((prev) => prev.filter((x) => x.id !== id));

    useEffect(() => {
        AOS.init({ duration: 700, once: true });
        // Only merge cart if user is authenticated - don't call this on every page load!
        // mergeGuestCartOnLogin().catch(() => { });

        const unSubUpd = onCartUpdated?.(({ cart: c }) => { if (c) setCart(c); });
        const unSubErr = onCartError?.(({ message }) => { pushToast({ type: "error", title: "Cart error", message }); });

        (async () => {
            try {
                setLoading(true);
                const { ok, cart: newCart, message } = await getCart();
                if (ok) setCart(newCart); else setErr(message || "Failed to load cart.");
            } catch (e) {
                setErr("Failed to load cart.");
            } finally {
                setLoading(false);
            }
            const methods = await fetchShippingMethodsSafe();
            setShipOptions(methods);
        })();

        return () => { unSubUpd && unSubUpd(); unSubErr && unSubErr(); };
    }, []);

    // hydrate selected shipping (if present in cart adjustments)
    useEffect(() => {
        const shipAdj = (cart?.adjustments || []).find((a) => a.type === "shipping");
        if (shipAdj?.meta?.shipping_method_id) setPickedShipId(shipAdj.meta.shipping_method_id);
    }, [cart?.adjustments]);

    // When cart changes, fetch missing product info in batch
    useEffect(() => {
        const ids = Array.from(new Set((cart?.items || []).map((i) => i.product_id)));
        const need = ids.filter((id) => !productInfo[id] || !productInfo[id].primary_image_url);
        if (!need.length) return;
        fetchProductSummaries(need).then((map) => {
            if (map && Object.keys(map).length) setProductInfo((prev) => ({ ...prev, ...map }));
        });
    }, [cart?.items]);

    const items = cart?.items || [];
    const totals = cart?.totals || { subtotal: 0, discount: 0, shipping: 0, tax: 0, total: 0 };

    // Check if cart contains any roll-based products
    const hasRollBasedProducts = useMemo(() => {
        return items.some(item => (item.pricing_method || "").toLowerCase() === "roll");
    }, [items]);

    /* ---------------- Actions ---------------- */
    const onUpdateLine = async (itemId, payload) => {
        try {
            const { ok, cart: newCart, message } = await updateCartItem(itemId, payload);
            if (ok) setCart(newCart);
            else {
                setErr(message || "Could not update item.");
                pushToast({ type: "error", title: "Update failed", message: message || "Could not update item" });
            }
        } catch (e) {
            setErr("Could not update item.");
            pushToast({ type: "error", title: "Update failed", message: "Could not update item" });
        }
    };

    const askRemoveLine = (itemId) => setConfirm({ open: true, danger: true, title: "Remove this item?", subtitle: "This action cannot be undone.", confirmText: "Remove", onConfirm: () => doRemoveLine(itemId) });
    const doRemoveLine = async (itemId) => {
        setConfirm((c) => ({ ...c, busy: true }));
        try {
            const { ok, cart: newCart, message } = await removeCartItem(itemId);
            if (ok) { setCart(newCart); pushToast({ type: "ok", title: "Removed item" }); }
            else { setErr(message || "Could not remove item."); pushToast({ type: "error", title: "Remove failed", message: message || "Could not remove item" }); }
        } catch {
            setErr("Could not remove item.");
            pushToast({ type: "error", title: "Remove failed", message: "Could not remove item" });
        } finally {
            setConfirm({ open: false });
        }
    };

    const onAttachUploadToLine = async (itemId, uploadId) => {
        try {
            const { ok, message } = await attachUpload(itemId, uploadId);
            if (!ok) pushToast({ type: "error", title: "Attach failed", message: message || "Could not attach upload" });
            else pushToast({ type: "ok", title: "Design attached" });
            // attachUpload internally calls getCart() and emits an update
        } catch {
            pushToast({ type: "error", title: "Attach failed", message: "Could not attach upload" });
        }
    };

    const askClearCart = () => setConfirm({ open: true, danger: true, title: "Clear the entire cart?", subtitle: "All items will be removed.", confirmText: "Clear cart", onConfirm: doClearCart });
    const doClearCart = async () => {
        setConfirm((c) => ({ ...c, busy: true }));
        try {
            const { ok, cart: newCart2 } = await apiClearCart();
            if (ok) { setCart(newCart2); pushToast({ type: "ok", title: "Cart cleared" }); }
        } catch {
            setErr("Could not clear cart.");
            pushToast({ type: "error", title: "Clear failed", message: "Could not clear cart" });
        } finally { setConfirm({ open: false }); }
    };

    const onApplyPromo = async () => {
        if (!promo) return;
        setPromoBusy(true);
        try {
            const { ok, cart: newCart, message } = await applyOffer(promo);
            if (ok) { setCart(newCart); setPromo(""); pushToast({ type: "ok", title: "Promo applied" }); }
            else pushToast({ type: "error", title: "Invalid code", message: message || "Could not apply code" });
        } catch { pushToast({ type: "error", title: "Apply failed", message: "Could not apply code" }); }
        finally { setPromoBusy(false); }
    };

    const onRemovePromo = async (code) => {
        setPromoBusy(true);
        try { const { ok, cart: newCart } = await removeOffer(code); if (ok) { setCart(newCart); pushToast({ type: "ok", title: "Promo removed" }); } }
        catch { pushToast({ type: "error", title: "Remove failed", message: "Could not remove code" }); }
        setPromoBusy(false);
    };

    const onChooseShipping = async (id) => {
        setShipBusy(true);
        try { const { ok, cart: newCart } = await setShippingMethod(id); if (ok) { setCart(newCart); setPickedShipId(id); pushToast({ type: "ok", title: "Shipping updated" }); } }
        catch { pushToast({ type: "error", title: "Shipping failed", message: "Could not set shipping" }); }
        setShipBusy(false);
    };

    // Open gallery picker modal for a line
    const openGalleryFor = (line) => setGalleryFor(line);
    const closeGallery = () => setGalleryFor(null);

    // When gallery picks come back
    const handleGalleryPicked = async (ids = []) => {
        const line = galleryFor; // snapshot
        setGalleryFor(null);
        if (!line) return;
        try {
            if (ids.length === 0) return;
            if (ids.length === 1) {
                // update current line
                await updateCartItem(line.id, {
                    product_design_id: ids[0],
                    user_design_upload_id: null,
                    hire_designer: false,
                });
            } else {
                // set the first on current line, others as new items (mimics ProductDetails behaviour)
                await updateCartItem(line.id, {
                    product_design_id: ids[0],
                    user_design_upload_id: null,
                    hire_designer: false,
                });
                for (let i = 1; i < ids.length; i++) {
                    const payload = {
                        product_id: line.product_id,
                        quantity: 1,
                        product_design_id: ids[i],
                    };
                    // carry over roll size
                    if (line.pricing_method === "roll") {
                        if (line.size_unit) payload.size_unit = line.size_unit;
                        if (line.width) payload.width = line.width;
                        if (line.height) payload.height = line.height;
                    }
                    // carry over options if your API supports it
                    if (line.options) payload.selected_options = line.options;
                    await addCartItem({
                        ...payload,
                        // safety: make new lines unambiguously "gallery"
                        user_design_upload_id: null,
                        hire_designer: false,
                    });
                }
            }
            pushToast({ type: "ok", title: `${ids.length} design${ids.length > 1 ? "s" : ""} applied` });
        } catch (e) {
            pushToast({ type: "error", title: "Design update failed", message: e?.response?.data?.message || e?.message || "Please try again" });
        }
    };

    const popularProducts = [
        { name: "X-Banners", slug: "x-banners" },
        { name: "Pull-Up Banners", slug: "pull-up-banners" },
        { name: "Custom T-Shirts", slug: "custom-t-shirts" },
        { name: "Business Cards", slug: "business-cards" },
        { name: "Poster Printing", slug: "poster-printing" },
    ];

    const showMobileBar = items.length > 0;

    return (
        <>
            <Head title="Cart" />
            <Meta title="Your Cart - Printair" description="Review and finalize your custom prints. Choose designs, confirm sizes, and proceed to secure checkout." />
            <Header />

            <div className="tw-container tw-mx-auto tw-px-4 tw-pt-4">
                <Breadcrumb />

                <section className="tw-py-6 tw-rounded-lg tw-mb-6">
                    <div className="tw-flex tw-items-center tw-justify-between tw-mb-3 tw-px-1">
                        <h5 className="tw-text-2xl tw-font-bold tw-text-[#f44032]">Shopping Cart</h5>
                        {items.length > 0 && (
                            <button onClick={askClearCart} disabled={busy} className="tw-text-sm tw-text-rose-600 hover:tw-underline disabled:tw-opacity-50">Clear cart</button>
                        )}
                    </div>

                    <div className="tw-grid tw-grid-cols-1 lg:tw-grid-cols-3 tw-gap-6">
                        {/* Left: items */}
                        <div className="lg:tw-col-span-2 tw-space-y-4" data-aos="fade-up">
                            {loading ? (
                                <>
                                    <LineSkeleton />
                                    <LineSkeleton />
                                </>
                            ) : items.length === 0 ? (
                                <EmptyState />
                            ) : (
                                items.map((line) => (
                                    <CartRow key={line.id} line={line} onUpdate={onUpdateLine} onRemoveAsk={askRemoveLine} onAttachUpload={onAttachUploadToLine} productInfo={productInfo} openGalleryFor={openGalleryFor} />
                                ))
                            )}
                        </div>

                        {/* Right: summary (sticky on desktop) */}
                        <aside className="tw-sticky tw-top-24 tw-self-start" data-aos="fade-left" data-aos-delay="60">
                            <div className="tw-bg-white tw-rounded-xl tw-shadow tw-p-4 tw-h-fit">
                                {/* FreeShippingProgress intentionally hidden for this stage */}
                                {/* <FreeShippingProgress subtotal={totals.subtotal} /> */}

                                <PromoBox promo={promo} setPromo={setPromo} onApply={onApplyPromo} onRemove={onRemovePromo} busy={promoBusy} cart={cart} />

                                <ShippingSelector methods={shipOptions} currentMethodId={pickedShipId} picking={shipBusy} onPick={onChooseShipping} />

                                {/* Totals */}
                                <div className="tw-space-y-2 tw-text-sm tw-mb-4">
                                    <div className="tw-flex tw-justify-between"><span className="tw-text-gray-500">Subtotal</span><span className="tw-text-gray-800">Rs. {formatMoney(totals.subtotal)}</span></div>
                                    <div className="tw-flex tw-justify-between"><span className="tw-text-gray-500">Discount</span><span className="tw-text-gray-800">- Rs. {formatMoney(totals.discount)}</span></div>
                                    <div className="tw-flex tw-justify-between"><span className="tw-text-gray-500">Shipping</span><span className="tw-text-gray-800">Rs. {formatMoney(totals.shipping)}</span></div>
                                    <div className="tw-flex tw-justify-between"><span className="tw-text-gray-500">Tax</span><span className="tw-text-gray-800">Rs. {formatMoney(totals.tax)}</span></div>
                                    <div className="tw-flex tw-justify-between tw-font-semibold tw-pt-2 tw-border-t"><span className="tw-text-gray-700">Total</span><span className="tw-text-primary tw-font-bold tw-text-base">Rs. {formatMoney(totals.total)}</span></div>
                                </div>

                                <button onClick={() => router.visit("/checkout")} disabled={items.length === 0} className="tw-w-full tw-text-center tw-bg-[#f44032] tw-text-white tw-py-3 tw-rounded-lg tw-font-medium disabled:tw-opacity-50" title={items.length === 0 ? "Add items to proceed" : "Place Order"}>
                                    Place Order
                                </button>

                                {hasRollBasedProducts && (
                                    <div className="tw-bg-blue-50 tw-border tw-border-blue-200 tw-rounded-lg tw-p-3 tw-mt-3">
                                        <div className="tw-flex tw-items-start tw-gap-2">
                                            <Icon icon="mdi:information-outline" className="tw-text-blue-600 tw-text-lg tw-mt-0.5 tw-flex-shrink-0" />
                                            <p className="tw-text-xs tw-text-blue-800 tw-leading-relaxed">
                                                Our team will review your order and contact you with a quotation and other details. Payment will be available after admin confirmation.
                                            </p>
                                        </div>
                                    </div>
                                )}

                                <p className="tw-text-xs tw-text-gray-400 tw-mt-3 tw-text-center">
                                    {hasRollBasedProducts ? "Order details will be confirmed by our team" : "Shipping & taxes calculated at checkout"}
                                </p>

                                <Link href="/products/all" className="tw-block tw-text-sm tw-text-center tw-mt-3 tw-py-2 tw-text-black tw-rounded-md tw-border tw-border-black hover:tw-bg-black hover:tw-text-white">Continue Shopping</Link>
                            </div>
                        </aside>
                    </div>

                    {err && (
                        <div className="tw-mt-4 tw-rounded-xl tw-border tw-border-amber-300 tw-bg-amber-50 tw-text-amber-900 tw-p-3 tw-text-sm">{err}</div>
                    )}
                </section>
            </div>

            {/* Mobile sticky checkout bar */}
            {showMobileBar && (
                <div className="lg:tw-hidden tw-fixed tw-bottom-0 tw-left-0 tw-right-0 tw-z-40 tw-bg-white tw-border-t tw-shadow-lg tw-px-4 tw-py-3">
                    <div className="tw-flex tw-items-center tw-justify-between">
                        <div className="tw-text-sm">
                            <div className="tw-text-gray-500">Total</div>
                            <div className="tw-text-lg tw-font-semibold">Rs. {formatMoney(totals.total)}</div>
                        </div>
                        <button onClick={() => router.visit("/checkout")} className="tw-inline-flex tw-items-center tw-gap-2 tw-bg-[#f44032] tw-text-white tw-px-4 tw-py-2 tw-rounded-xl">
                            <Icon icon="mdi:cart-check" />
                            Place Order
                        </button>
                    </div>
                    {hasRollBasedProducts && (
                        <div className="tw-mt-2 tw-text-xs tw-text-gray-600 tw-flex tw-items-center tw-gap-1">
                            <Icon icon="mdi:information-outline" className="tw-text-blue-600" />
                            <span>Our team will review and contact you with quotation details</span>
                        </div>
                    )}
                </div>
            )}

            <CookieConsent />
            <Footer popularProducts={popularProducts} />

            {/* Modals */}
            <ConfirmModal open={!!confirm.open} danger={!!confirm.danger} title={confirm.title} subtitle={confirm.subtitle} confirmText={confirm.confirmText} busy={!!confirm.busy} onConfirm={confirm.onConfirm} onClose={() => setConfirm({ open: false })} />

            <DesignGalleryModal open={!!galleryFor} productId={galleryFor?.product_id} onClose={closeGallery} onConfirm={handleGalleryPicked} />

            {/* Toasts */}
            <Toasts toasts={toasts} dismiss={dismissToast} />
        </>
    );
}
