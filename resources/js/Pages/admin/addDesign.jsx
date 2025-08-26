import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import PropTypes from "prop-types";
import axios from "axios";
import { Head } from "@inertiajs/react";
import AdminDashboard from "../../Layouts/AdminDashboard";
import Breadcrumb from "@/Components/Breadcrumb";
import { Icon } from "@iconify/react";
import CookiesV from "@/Components/CookieConsent";
import Alert from "@/Components/Alert";
import Meta from "@/Components/Metaheads";

/* -----------------------------------------
   Drag & Drop helper
----------------------------------------- */
function useFileDragDrop(onFilesDropped) {
  const [dragging, setDragging] = useState(false);

  const onDragEnter = useCallback((e) => {
    e.preventDefault();
    setDragging(true);
  }, []);

  const onDragOver = useCallback((e) => {
    e.preventDefault();
  }, []);

  const onDragLeave = useCallback((e) => {
    e.preventDefault();
    setDragging(false);
  }, []);

  const onDrop = useCallback(
    (e) => {
      e.preventDefault();
      setDragging(false);
      const droppedFiles = Array.from(e.dataTransfer.files || []);
      if (droppedFiles.length) onFilesDropped(droppedFiles);
    },
    [onFilesDropped]
  );

  return { dragging, onDragEnter, onDragOver, onDragLeave, onDrop };
}

/* -----------------------------------------
   Preview Card
----------------------------------------- */
function FilePreview({
  src,
  idx,
  status,
  progress,
  uploadedUrl,
  dim,
  onRemove,
  onImageLoad,
  onOpenLightbox,
}) {
  const ratio = dim ? `${dim.w}/${dim.h}` : "1/1";

  return (
    <div
      className="tw-relative tw-border tw-rounded-lg tw-overflow-hidden tw-flex-shrink-0 tw-flex-grow tw-bg-white dark:tw-bg-neutral-900 dark:tw-border-neutral-700"
      style={{
        aspectRatio: ratio,
        maxWidth: "250px",
        flex: "1 1 150px",
      }}
    >
      {/* Controls */}
      <div className="tw-absolute tw-top-1 tw-right-1 tw-z-10 tw-flex tw-gap-1">
        <button
          type="button"
          onClick={() => onOpenLightbox(idx)}
          className="tw-p-1 tw-bg-white dark:tw-bg-neutral-800 tw-rounded-full tw-shadow"
          aria-label={`Open image ${idx + 1}`}
          title="Zoom"
        >
          <Icon
            icon="material-symbols:zoom-in"
            className="tw-text-gray-700 dark:tw-text-gray-200"
          />
        </button>
        <button
          type="button"
          onClick={() => onRemove(idx)}
          className="tw-p-1 tw-bg-white dark:tw-bg-neutral-800 tw-rounded-full tw-shadow"
          aria-label={`Remove image ${idx + 1}`}
          title="Remove"
        >
          <Icon icon="radix-icons:cross-2" className="tw-text-red-600" />
        </button>
      </div>

      {/* Local preview */}
      <img
        src={src}
        alt={`Preview ${idx + 1}`}
        className="tw-w-full tw-h-full tw-object-contain"
        onLoad={(e) => {
          const { naturalWidth: w, naturalHeight: h } = e.target;
          onImageLoad(idx, { w, h });
        }}
        aria-hidden="true"
        onClick={() => onOpenLightbox(idx)}
        role="button"
      />

      {/* Progress Bar */}
      {status === "uploading" && (
        <div className="tw-absolute tw-bottom-0 tw-left-0 tw-w-full tw-bg-gray-200 dark:tw-bg-neutral-700 tw-rounded-full tw-overflow-hidden">
          <div
            className="tw-bg-blue-600 tw-text-xs tw-font-medium tw-text-blue-100 tw-text-center tw-p-0.5 tw-leading-none tw-rounded-full"
            style={{ width: `${progress}%` }}
            aria-valuenow={progress}
            aria-valuemin="0"
            aria-valuemax="100"
          >
            {progress}%
          </div>
        </div>
      )}

      {/* Status badges */}
      {status === "uploaded" && (
        <div className="tw-absolute tw-top-1 tw-left-1 tw-bg-green-100 dark:tw-bg-green-900/40 tw-text-green-800 dark:tw-text-green-300 tw-text-xs tw-px-2 tw-py-1 tw-rounded">
          Uploaded
        </div>
      )}
      {status === "error" && (
        <div className="tw-absolute tw-top-1 tw-left-1 tw-bg-red-100 dark:tw-bg-red-900/40 tw-text-red-800 dark:tw-text-red-300 tw-text-xs tw-px-2 tw-py-1 tw-rounded">
          Failed
        </div>
      )}

      {/* Remote (tiny) preview strip */}
      {status === "uploaded" && uploadedUrl && (
        <img
          src={uploadedUrl}
          alt="Uploaded preview"
          className="tw-w-full tw-mt-2 tw-border-t tw-object-contain dark:tw-border-neutral-700"
          style={{ maxHeight: "100px" }}
        />
      )}
    </div>
  );
}

FilePreview.propTypes = {
  src: PropTypes.string.isRequired,
  idx: PropTypes.number.isRequired,
  status: PropTypes.oneOf(["pending", "uploading", "uploaded", "error"])
    .isRequired,
  progress: PropTypes.number.isRequired,
  uploadedUrl: PropTypes.string,
  dim: PropTypes.shape({ w: PropTypes.number, h: PropTypes.number }),
  onRemove: PropTypes.func.isRequired,
  onImageLoad: PropTypes.func.isRequired,
  onOpenLightbox: PropTypes.func.isRequired,
};
FilePreview.defaultProps = {
  uploadedUrl: null,
  dim: null,
};

/* -----------------------------------------
   Utility helpers
----------------------------------------- */
const fmtBytes = (bytes) => {
  if (!bytes && bytes !== 0) return "-";
  const units = ["B", "KB", "MB", "GB"];
  let i = 0;
  let val = bytes;
  while (val >= 1024 && i < units.length - 1) {
    val /= 1024;
    i++;
  }
  return `${val.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
};

const etaFrom = (remainingBytes, speedBps) => {
  if (!speedBps || speedBps <= 0) return "-";
  const sec = Math.ceil(remainingBytes / speedBps);
  if (sec < 60) return `${sec}s`;
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}m ${s}s`;
};

/* -----------------------------------------
   Main component
----------------------------------------- */
const AddDesign = ({ userDetails, workingGroups }) => {
  // -------- Theme detection (light/dark) --------
  const [isDark, setIsDark] = useState(() => {
    if (typeof document !== "undefined") {
      return (
        document.documentElement.classList.contains("dark") ||
        window.matchMedia?.("(prefers-color-scheme: dark)").matches
      );
    }
    return false;
  });
  useEffect(() => {
    const mq = window.matchMedia?.("(prefers-color-scheme: dark)");
    const handle = () => {
      const docDark = document.documentElement.classList.contains("dark");
      setIsDark(docDark || mq?.matches);
    };
    mq?.addEventListener?.("change", handle);
    const obs = new MutationObserver(handle);
    obs.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => {
      mq?.removeEventListener?.("change", handle);
      obs.disconnect();
    };
  }, []);

  // -------- State Declarations --------
  const [alert, setAlert] = useState(null);
  const [errors, setErrors] = useState({});

  // Form data
  const [selectedGroup, setSelectedGroup] = useState("");
  const [selectedProduct, setSelectedProduct] = useState("");
  const [dimensions, setDimensions] = useState({ width: "", height: "" });

  // Access control
  const [accessType, setAccessType] = useState("working_group"); // 'public' | 'working_group' | 'restricted'
  const [restrictedUserIdsInput, setRestrictedUserIdsInput] = useState(""); // csv/spaced ids
  const parseRestrictedIds = useCallback(() => {
    return restrictedUserIdsInput
      .split(/[\s,]+/)
      .map((s) => s.trim())
      .filter(Boolean)
      .map((s) => Number(s))
      .filter((n) => Number.isInteger(n) && n > 0);
  }, [restrictedUserIdsInput]);

  // File upload
  const [files, setFiles] = useState([]); // File[]
  const [previews, setPreviews] = useState([]); // dataURL[]
  const [dims, setDims] = useState({}); // { idx: { w, h } }
  const [fileSizes, setFileSizes] = useState([]); // number[]

  // Upload state
  const [statuses, setStatuses] = useState([]); // 'pending'|'uploading'|'uploaded'|'error'
  const [progress, setProgress] = useState([]); // 0–100 per-file
  const [uploadedUrls, setUploadedUrls] = useState([]); // server preview urls

  // Queue control
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [concurrency, setConcurrency] = useState(2); // 2–3 is good on shared hosting
  const abortControllersRef = useRef({}); // key: file index → AbortController
  const startTimeRef = useRef(null);

  // Upload Summary expand/collapse
  const [summaryExpanded, setSummaryExpanded] = useState(false);

  // Lightbox
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  // Refs & constants
  const fileInputRef = useRef(null);
  const CHUNK_SIZE = 2 * 1024 * 1024; // 2MB chunks
  const MAX_FILE_COUNT = 25;
  const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500MB cap

  // -------- Derived Data --------
  const products = useMemo(() => {
    if (!selectedGroup) return [];
    const group = workingGroups.find((g) => String(g.id) === selectedGroup);
    return group?.products || [];
  }, [selectedGroup, workingGroups]);

  const totalBytes = useMemo(
    () => fileSizes.reduce((a, b) => a + (b || 0), 0),
    [fileSizes]
  );
  const uploadedBytes = useMemo(() => {
    return fileSizes.reduce((sum, size, i) => {
      const p = progress[i] || 0;
      return sum + Math.floor((size || 0) * (p / 100));
    }, 0);
  }, [fileSizes, progress]);

  const overallPct = useMemo(() => {
    if (!files.length) return 0;
    const sum = progress.reduce((a, b) => a + (b || 0), 0);
    return Math.round(sum / files.length);
  }, [files.length, progress]);

  const speedBps = useMemo(() => {
    if (!startTimeRef.current) return 0;
    const elapsed = (Date.now() - startTimeRef.current) / 1000;
    if (elapsed <= 0) return 0;
    return Math.floor(uploadedBytes / elapsed);
  }, [uploadedBytes]);

  const remainingBytes = Math.max(0, totalBytes - uploadedBytes);
  const etaText = etaFrom(remainingBytes, speedBps);

  // -------- Effects --------
  useEffect(() => {
    // Reset state arrays on files change
    setStatuses(files.map(() => "pending"));
    setProgress(files.map(() => 0));
    setUploadedUrls(files.map(() => null));
    setFileSizes(files.map((f) => f?.size || 0));

    // Build previews
    if (files.length === 0) {
      setPreviews([]);
    } else {
      const newPreviews = Array(files.length).fill(null);
      let loadedCount = 0;
      files.forEach((file, index) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          newPreviews[index] = e.target.result;
          loadedCount++;
          if (loadedCount === files.length) setPreviews(newPreviews);
        };
        reader.readAsDataURL(file);
      });
    }

    if (fileInputRef.current) fileInputRef.current.value = "";
  }, [files]);

  // -------- Handlers --------
  const removeImage = useCallback((idx) => {
    // If uploading, try to abort this index
    const controller = abortControllersRef.current[idx];
    if (controller) controller.abort();

    setFiles((prev) => prev.filter((_, i) => i !== idx));
    setStatuses((prev) => {
      const copy = [...prev];
      copy.splice(idx, 1);
      return copy;
    });
    setProgress((prev) => {
      const copy = [...prev];
      copy.splice(idx, 1);
      return copy;
    });
    setUploadedUrls((prev) => {
      const copy = [...prev];
      copy.splice(idx, 1);
      return copy;
    });
    setFileSizes((prev) => {
      const copy = [...prev];
      copy.splice(idx, 1);
      return copy;
    });
    setDims((prev) => {
      const newDims = {};
      Object.keys(prev)
        .map((k) => parseInt(k, 10))
        .filter((k) => k !== idx)
        .sort((a, b) => a - b)
        .forEach((oldKey) => {
          const newKey = oldKey < idx ? oldKey : oldKey - 1;
          newDims[newKey] = prev[oldKey];
        });
      return newDims;
    });
  }, []);

  const handleImageLoad = useCallback((idx, { w, h }) => {
    setDims((cur) => ({ ...cur, [idx]: { w, h } }));
  }, []);

  const handleGroupChange = useCallback((e) => {
    setSelectedGroup(e.target.value);
    setSelectedProduct("");
    setErrors((prev) => ({ ...prev, workingGroup: null }));
  }, []);

  const handleProductChange = useCallback((e) => {
    setSelectedProduct(e.target.value);
    setErrors((prev) => ({ ...prev, product: null }));
  }, []);

  const handleDimensionChange = useCallback((e) => {
    const { name, value } = e.target;
    setDimensions((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: null }));
  }, []);

  const validateFields = useCallback(() => {
    const errs = {};
    if (!selectedGroup) errs.workingGroup = "Please select a working group.";
    if (!selectedProduct) errs.product = "Please select a product.";
    if (!dimensions.width) errs.width = "Width is required.";
    else if (Number(dimensions.width) <= 0)
      errs.width = "Width must be greater than zero.";
    if (!dimensions.height) errs.height = "Height is required.";
    else if (Number(dimensions.height) <= 0)
      errs.height = "Height must be greater than zero.";
    if (files.length === 0) errs.files = "Please select at least one file.";
    if (accessType === "restricted" && parseRestrictedIds().length === 0) {
      errs.restricted = "Add at least one user ID for restricted access.";
    }
    return errs;
  }, [
    selectedGroup,
    selectedProduct,
    dimensions,
    files,
    accessType,
    parseRestrictedIds,
  ]);

  const updateFiles = useCallback(
    (newFiles) => {
      if (newFiles.length > MAX_FILE_COUNT) {
        setErrors((prev) => ({
          ...prev,
          files: `You can upload up to ${MAX_FILE_COUNT} files.`,
        }));
        return;
      }
      const valid = [];
      for (const f of newFiles) {
        if (!/\.jpe?g$/i.test(f.name) || !f.type.startsWith("image/jpeg")) {
          setErrors((prev) => ({ ...prev, files: "Only JPG files are allowed." }));
          return;
        }
        if (f.size > MAX_FILE_SIZE) {
          setErrors((prev) => ({
            ...prev,
            files: `Each file must be ≤ ${Math.round(
              MAX_FILE_SIZE / (1024 * 1024)
            )} MB.`,
          }));
          return;
        }
        valid.push(f);
      }
      setErrors((prev) => ({ ...prev, files: null }));
      setAlert(null);
      setFiles(valid);
      setDims({});
    },
    [MAX_FILE_COUNT, MAX_FILE_SIZE]
  );

  const handleFileChange = useCallback(
    (e) => {
      updateFiles(Array.from(e.target.files || []));
    },
    [updateFiles]
  );

  const { dragging, onDragEnter, onDragOver, onDragLeave, onDrop } =
    useFileDragDrop(updateFiles);

  // Lightbox
  const onOpenLightbox = useCallback((idx) => {
    setLightboxIndex(idx);
    setLightboxOpen(true);
  }, []);
  const onCloseLightbox = useCallback(() => setLightboxOpen(false), []);
  const lightboxSrc = previews[lightboxIndex] || uploadedUrls[lightboxIndex];

  // -------- Upload Core (chunked) --------
  async function uploadFileInChunks(file, idx) {
    const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
    const identifier = `${file.name.replace(/[^0-9a-z_\-\.]/gi, "")}-${file.size}`;
    let lastResponse = null;

    for (let chunkNumber = 1; chunkNumber <= totalChunks; chunkNumber++) {
      // Pause gate (checks between chunks)
      while (isPaused) {
        await new Promise((r) => setTimeout(r, 250));
      }

      const start = (chunkNumber - 1) * CHUNK_SIZE;
      const end = Math.min(file.size, start + CHUNK_SIZE);
      const blob = file.slice(start, end, file.type);

      const form = new FormData();
      form.append("working_group_id", selectedGroup);
      form.append("product_id", selectedProduct);
      form.append("width", dimensions.width);
      form.append("height", dimensions.height);
      form.append("access_type", accessType);
      if (accessType === "restricted") {
        parseRestrictedIds().forEach((id) =>
          form.append("restricted_user_ids[]", String(id))
        );
      }
      form.append("file", blob, file.name);

      // Pion/Resumable fields
      form.append("flowChunkNumber", chunkNumber);
      form.append("flowChunkSize", CHUNK_SIZE);
      form.append("flowCurrentChunkSize", blob.size);
      form.append("flowTotalSize", file.size);
      form.append("flowIdentifier", identifier);
      form.append("flowFilename", file.name);
      form.append("flowRelativePath", file.name);
      form.append("flowTotalChunks", totalChunks);

      // Compat fields
      form.append("resumableChunkNumber", chunkNumber);
      form.append("resumableChunkSize", CHUNK_SIZE);
      form.append("resumableCurrentChunkSize", blob.size);
      form.append("resumableTotalSize", file.size);
      form.append("resumableIdentifier", identifier);
      form.append("resumableFilename", file.name);
      form.append("resumableRelativePath", file.name);
      form.append("resumableTotalChunks", totalChunks);

      // Prepare abort controller
      const controller =
        abortControllersRef.current[idx] || new AbortController();
      abortControllersRef.current[idx] = controller;

      let response;
      try {
        response = await axios.post(route("admin.storeDesign"), form, {
          headers: {
            "X-CSRF-TOKEN":
              document
                .querySelector('meta[name="csrf-token"]')
                ?.getAttribute("content") || "",
          },
          signal: controller.signal,
          onUploadProgress: (ev) => {
            const pct = Math.round(((start + ev.loaded) / file.size) * 100);
            setProgress((prev) => {
              const copy = [...prev];
              copy[idx] = Math.max(copy[idx] || 0, pct);
              return copy;
            });
          },
          validateStatus: (s) => [200, 201, 202].includes(s),
        });
      } catch (err) {
        if (
          axios.isCancel?.(err) ||
          err?.name === "CanceledError" ||
          err?.message === "canceled"
        ) {
          // Canceled
          throw new Error("__CANCELED__");
        }
        throw err;
      }

      lastResponse = response;

      // Update for 202 progress returns
      if (response.status === 202) {
        const serverPct = Math.round(response.data?.done || 0);
        setProgress((prev) => {
          const copy = [...prev];
          copy[idx] = Math.max(copy[idx] || 0, serverPct);
          return copy;
        });
      }
    }

    return lastResponse;
  }

  // Concurrency queue
  const processUploads = useCallback(async () => {
    if (!files.length) return;

    setIsSubmitting(true);
    setAlert(null);
    startTimeRef.current = Date.now();
    const failedFiles = [];
    const queue = files.map((_, i) => i); // indices

    const runWorker = async () => {
      while (queue.length) {
        const idx = queue.shift();
        const f = files[idx];

        // Mark uploading
        setStatuses((prev) => {
          const copy = [...prev];
          copy[idx] = "uploading";
          return copy;
        });

        try {
          const res = await uploadFileInChunks(f, idx);

          if (res && (res.status === 201 || res.status === 200)) {
            const previewUrl =
              res.data?.preview?.url || res.data?.image_url || "";
            setStatuses((prev) => {
              const copy = [...prev];
              copy[idx] = "uploaded";
              return copy;
            });
            setUploadedUrls((prev) => {
              const copy = [...prev];
              copy[idx] = previewUrl;
              return copy;
            });
            setProgress((prev) => {
              const copy = [...prev];
              copy[idx] = 100;
              return copy;
            });
            if (res.data?.message) {
              setAlert({ type: "success", message: res.data.message });
            }
          } else {
            throw new Error("Unexpected server response");
          }
        } catch (err) {
          // Canceled uploads show as error but we denote differently in UI text
          const canceled = err?.message === "__CANCELED__";
          console.error("Upload error:", err);
          setStatuses((prev) => {
            const copy = [...prev];
            copy[idx] = "error";
            return copy;
          });
          failedFiles.push(f.name + (canceled ? " (canceled)" : ""));
        }
      }
    };

    // Launch N workers
    const workers = Array.from(
      { length: Math.max(1, concurrency) },
      () => runWorker()
    );
    await Promise.all(workers);

    // Wrap up
    if (failedFiles.length > 0) {
      const message =
        failedFiles.length > 1
          ? `Uploads failed for: ${failedFiles.join(", ")}.`
          : `Upload failed for ${failedFiles[0]}.`;
      setErrors((prev) => ({ ...prev, files: message }));
      setAlert({ type: "danger", message });
    } else {
      setAlert({
        type: "success",
        message: "All files uploaded successfully.",
      });
    }
    setIsSubmitting(false);
  }, [files, concurrency]); // eslint-disable-line

  // Submit handler
  const handleSubmit = useCallback(
    async (e) => {
      e?.preventDefault?.();
      const validationErrors = validateFields();
      if (Object.keys(validationErrors).length > 0) {
        setErrors(validationErrors);
        setAlert({ type: "danger", message: "Please fix the errors below." });
        return;
      }
      // Clear old controllers
      abortControllersRef.current = {};
      await processUploads();
    },
    [validateFields, processUploads]
  );

  // Toggle Pause/Resume + Cancel All
  const handleTogglePause = useCallback(() => {
    setIsPaused((prev) => {
      const next = !prev;
      setAlert({
        type: "info",
        message: next ? "Uploads paused." : "Uploads resumed.",
      });
      return next;
    });
  }, []);
  const handleCancelAll = useCallback(() => {
    Object.values(abortControllersRef.current || {}).forEach((c) => c?.abort?.());
    setAlert({
      type: "danger",
      message: "Uploads canceled.",
    });
  }, []);

  // Copy all URLs
  const handleCopyAll = useCallback(async () => {
    const urls = uploadedUrls.filter(Boolean);
    if (!urls.length) return;
    try {
      await navigator.clipboard.writeText(urls.join("\n"));
      setAlert({ type: "success", message: "Preview links copied to clipboard." });
    } catch (e) {
      setAlert({ type: "danger", message: "Failed to copy links." });
    }
  }, [uploadedUrls]);

  // -------- JSX --------
  return (
    <>
      <Head title="Add New Design - Admin Dashboard" />
      <Meta
        title="Add New Design - Admin Dashboard"
        description="Add New Design to the system"
      />

      <AdminDashboard userDetails={userDetails}>
        <Breadcrumb title="Add New Design" />

        {alert && (
          <Alert
            type={alert.type}
            message={alert.message}
            onClose={() => setAlert(null)}
          />
        )}

        {/* Two-pane layout */}
        <div className="tw-grid tw-grid-cols-1 lg:tw-grid-cols-2 tw-gap-6">
          {/* LEFT: Form & Dropzone */}
          <div className="card">
            <div className="card-body">
              {errors && Object.keys(errors).length > 0 && (
                <div
                  className="alert alert-danger tw-bg-danger-100 dark:tw-bg-red-900/20 tw-mb-3 tw-text-danger-600 dark:tw-text-red-300 tw-border-danger-600 tw-border-start-width-4-px tw-px-4 tw-py-3 d-flex"
                  role="alert"
                >
                  <ol className="tw-mb-0">
                    {Object.values(errors).map(
                      (error, i) => error && <li key={i}>{error}</li>
                    )}
                  </ol>
                </div>
              )}

              {/* Pre-flight tips */}
              <div className="alert alert-primary dark:tw-bg-blue-900/20 dark:tw-text-blue-200">
                <span className="tw-underline tw-font-medium">Heads up:</span>
                <ol className="tw-list-decimal tw-ml-5">
                  <li>
                    JPG only. Uploads create a <strong>watermarked preview</strong>
                    ; not for printing.
                  </li>
                  <li>
                    You can upload up to {MAX_FILE_COUNT} files (≤{" "}
                    {Math.round(MAX_FILE_SIZE / (1024 * 1024))} MB each).
                  </li>
                  <li>
                    Large files supported; progress and ETA will show during upload.
                  </li>
                </ol>
              </div>

              <form id="designUploadForm" onSubmit={handleSubmit} noValidate>
                {/* Working Group */}
                <div className="mb-3">
                  <label htmlFor="workingGroup" className="form-label">
                    Working group
                  </label>
                  <select
                    id="workingGroup"
                    name="workingGroup"
                    className={`form-select ${
                      errors.workingGroup ? "is-invalid" : ""
                    }`}
                    value={selectedGroup}
                    onChange={handleGroupChange}
                    aria-required="true"
                    aria-invalid={errors.workingGroup ? "true" : "false"}
                  >
                    <option value="">Select a working group</option>
                    {workingGroups.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.name}
                      </option>
                    ))}
                  </select>
                  {errors.workingGroup && (
                    <div className="invalid-feedback">{errors.workingGroup}</div>
                  )}
                </div>

                {/* Product */}
                <div className="mb-3">
                  <label htmlFor="product" className="form-label">
                    Product
                  </label>
                  <select
                    id="product"
                    name="product"
                    className={`form-select ${errors.product ? "is-invalid" : ""}`}
                    value={selectedProduct}
                    onChange={handleProductChange}
                    disabled={!selectedGroup || products.length === 0}
                    aria-required="true"
                    aria-invalid={errors.product ? "true" : "false"}
                  >
                    <option value="">
                      {!selectedGroup
                        ? "Select a working group first"
                        : "Select a product"}
                    </option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                  {errors.product && (
                    <div className="invalid-feedback">{errors.product}</div>
                  )}
                </div>

                {/* Dimensions */}
                <div className="mb-3">
                  <label htmlFor="width" className="form-label">
                    Dimensions (inches)
                  </label>
                  <div className="input-group">
                    <input
                      type="number"
                      id="width"
                      name="width"
                      value={dimensions.width}
                      onChange={handleDimensionChange}
                      className={`form-control ${errors.width ? "is-invalid" : ""}`}
                      placeholder="Width"
                      min="1"
                      aria-required="true"
                      aria-invalid={errors.width ? "true" : "false"}
                    />
                    <span className="input-group-text">×</span>
                    <input
                      type="number"
                      id="height"
                      name="height"
                      value={dimensions.height}
                      onChange={handleDimensionChange}
                      className={`form-control ${errors.height ? "is-invalid" : ""}`}
                      placeholder="Height"
                      min="1"
                      aria-required="true"
                      aria-invalid={errors.height ? "true" : "false"}
                    />
                  </div>
                  {errors.width && (
                    <div className="invalid-feedback tw-block">{errors.width}</div>
                  )}
                  {errors.height && (
                    <div className="invalid-feedback tw-block">{errors.height}</div>
                  )}
                </div>

                {/* Access Type */}
                <div className="mb-3">
                  <label htmlFor="accessType" className="form-label">
                    Access type
                  </label>
                  <select
                    id="accessType"
                    name="accessType"
                    className={`form-select ${errors.restricted ? "is-invalid" : ""}`}
                    value={accessType}
                    onChange={(e) => setAccessType(e.target.value)}
                  >
                    <option value="public">Public (visible to everyone)</option>
                    <option value="working_group">
                      Working Group (admin/staff only)
                    </option>
                    <option value="restricted">
                      Restricted (only specific users)
                    </option>
                  </select>
                  <small className="form-text text-muted dark:tw-text-gray-400">
                    Public → everyone; Working group → hidden from group end-users; Restricted → only listed users.
                  </small>

                  {accessType === "restricted" && (
                    <>
                      <small className="form-text text-muted dark:tw-text-gray-400">
                        Enter user IDs separated by commas or spaces (e.g.,{" "}
                        <code>12, 25 44</code>)
                      </small>
                      <input
                        type="text"
                        className={`form-control tw-mt-2 ${
                          errors.restricted ? "is-invalid" : ""
                        }`}
                        placeholder="User IDs (comma/space separated)"
                        value={restrictedUserIdsInput}
                        onChange={(e) => setRestrictedUserIdsInput(e.target.value)}
                      />
                      {errors.restricted && (
                        <div className="invalid-feedback tw-block">
                          {errors.restricted}
                        </div>
                      )}
                    </>
                  )}
                </div>

                {/* Dropzone */}
                <label htmlFor="file-input" className="tw-font-semibold tw-text-xl">
                  Upload Designs
                </label>
                <div className="d-flex tw-justify-between mb-2">
                  <div className="tw-text-sm">
                    Supported: JPG | Max files: {MAX_FILE_COUNT}
                  </div>
                  <div className="tw-text-sm">Selected: {files.length}</div>
                </div>
                {errors.files && <div className="text-danger mb-2">{errors.files}</div>}

                <div
                  className={`upload-image-wrapper d-flex align-items-center tw-gap-3 tw-mt-4 tw-p-3 tw-border-2 tw-rounded ${
                    dragging
                      ? "tw-bg-blue-50 tw-border-blue-400"
                      : "tw-bg-neutral-50 dark:tw-bg-neutral-800 tw-border-dashed tw-border-gray-300 dark:tw-border-neutral-600"
                  }`}
                  onDragEnter={onDragEnter}
                  onDragOver={onDragOver}
                  onDragLeave={onDragLeave}
                  onDrop={onDrop}
                  role="button"
                  tabIndex={0}
                  aria-label="Drag & drop files here or click to browse"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      fileInputRef.current?.click();
                    }
                  }}
                >
                  <label
                    htmlFor="file-input"
                    className="d-flex flex-column align-items-center justify-content-center w-100 h-100 m-0 cursor-pointer"
                  >
                    <Icon
                      icon="solar:camera-outline"
                      className="tw-text-xl tw-text-secondary-light"
                    />
                    <span className="fw-semibold text-secondary-light">
                      Drag & Drop or Browse Files
                    </span>
                  </label>
                  <input
                    id="file-input"
                    type="file"
                    accept=".jpg,.jpeg"
                    multiple
                    hidden
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    disabled={files.length >= MAX_FILE_COUNT || isSubmitting}
                  />
                </div>

                {/* Preview grid (first 20 with Show More) */}
                {previews.length > 0 && (
                  <>
                    <div className="d-flex tw-justify-between tw-items-center tw-mt-4">
                      <h6 className="tw-font-semibold tw-m-0">Local Previews</h6>
                      <small className="tw-text-gray-500 dark:tw-text-gray-400">
                        Click a thumbnail to zoom
                      </small>
                    </div>
                    <div className="d-flex flex-wrap tw-gap-3 tw-mt-3">
                      {previews.slice(0, 20).map((src, idx) => (
                        <FilePreview
                          key={idx}
                          src={src}
                          idx={idx}
                          status={statuses[idx]}
                          progress={progress[idx]}
                          uploadedUrl={uploadedUrls[idx]}
                          dim={dims[idx]}
                          onRemove={removeImage}
                          onImageLoad={handleImageLoad}
                          onOpenLightbox={onOpenLightbox}
                        />
                      ))}
                    </div>
                    {previews.length > 20 && (
                      <div className="tw-mt-2 tw-text-sm tw-text-gray-600 dark:tw-text-gray-400">
                        + {previews.length - 20} more selected (will upload too)
                      </div>
                    )}
                  </>
                )}

                {/* Submit */}
                <div className="tw-flex tw-items-center tw-gap-3 tw-mt-4">
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={isSubmitting || !files.length}
                  >
                    {isSubmitting && (
                      <span
                        className="spinner-border spinner-border-sm me-2"
                        role="status"
                      />
                    )}
                    Start Upload
                  </button>

                  {/* Concurrency control */}
                  <div className="tw-flex tw-items-center tw-gap-2">
                    <label className="tw-text-sm">Concurrency</label>
                    <select
                      className="form-select form-select-sm"
                      style={{ width: 90 }}
                      value={concurrency}
                      onChange={(e) => setConcurrency(Number(e.target.value))}
                      disabled={isSubmitting}
                    >
                      <option value={1}>1</option>
                      <option value={2}>2</option>
                      <option value={3}>3</option>
                      <option value={4}>4</option>
                    </select>
                  </div>
                </div>
              </form>
            </div>
          </div>

          {/* RIGHT: Upload Summary & Queue (compact by default, expandable) */}
          <div className={`${summaryExpanded ? "lg:tw-col-span-2" : ""}`}>
            <div className="card">
              <div className="card-body">
                {/* Header + Expand/Collapse */}
                <div className="tw-flex tw-items-center tw-justify-between tw-mb-2">
                  <div className="tw-flex tw-items-center tw-gap-2">
                    <h5 className="tw-font-semibold tw-m-0">Upload Summary</h5>
                    <span className="tw-text-xs tw-rounded tw-px-2 tw-py-0.5 tw-bg-gray-100 dark:tw-bg-neutral-800 tw-text-gray-600 dark:tw-text-gray-300">
                      {files.filter((_, i) => statuses[i] === "uploaded").length}/
                      {files.length} done
                    </span>
                  </div>
                  <div className="tw-flex tw-items-center tw-gap-2">
                    <div className="tw-hidden sm:tw-block tw-text-sm tw-text-gray-600 dark:tw-text-gray-300">
                      {fmtBytes(uploadedBytes)} / {fmtBytes(totalBytes)} •{" "}
                      {speedBps ? `${fmtBytes(speedBps)}/s` : "-/s"} • ETA {etaText}
                    </div>
                    <button
                      type="button"
                      className="btn btn-outline-secondary btn-sm tw-flex tw-items-center tw-gap-1"
                      onClick={() => setSummaryExpanded((v) => !v)}
                      title={summaryExpanded ? "Collapse panel" : "Expand panel"}
                    >
                      <Icon
                        icon={
                          summaryExpanded
                            ? "mdi:unfold-less-horizontal"
                            : "mdi:unfold-more-horizontal"
                        }
                      />
                      <span className="tw-hidden sm:tw-inline">
                        {summaryExpanded ? "Collapse" : "Expand"}
                      </span>
                    </button>
                  </div>
                </div>

                {/* Overall progress (always visible) */}
                <div className="tw-w-full tw-bg-gray-200 dark:tw-bg-neutral-700 tw-rounded-full tw-overflow-hidden tw-mb-3">
                  <div
                    className="tw-bg-blue-600 tw-text-xs tw-font-medium tw-text-blue-100 tw-text-center tw-p-0.5 tw-leading-none tw-rounded-full"
                    style={{ width: `${overallPct}%` }}
                  >
                    {overallPct}%
                  </div>
                </div>

                {/* Compact body */}
                {!summaryExpanded && (
                  <div className="tw-flex tw-items-center tw-gap-2 tw-text-sm tw-text-gray-600 dark:tw-text-gray-300">
                    <Icon icon="mdi:information-outline" />
                    Compact view. Use “Expand” to see per-file details.
                    <div className="tw-ml-auto tw-flex tw-gap-2">
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm tw-flex tw-items-center tw-gap-1"
                        onClick={handleTogglePause}
                        disabled={!isSubmitting}
                        title={isPaused ? "Resume all uploads" : "Pause all uploads"}
                      >
                        <Icon icon={isPaused ? "mdi:play" : "mdi:pause"} />
                        <span className="tw-hidden md:tw-inline">
                          {isPaused ? "Resume" : "Pause"}
                        </span>
                      </button>
                      <button
                        type="button"
                        className="btn btn-danger btn-sm tw-flex tw-items-center tw-gap-1"
                        onClick={handleCancelAll}
                        disabled={!isSubmitting}
                        title="Cancel all uploads"
                      >
                        <Icon icon="mdi:stop" />
                        <span className="tw-hidden md:tw-inline">Cancel</span>
                      </button>
                      <button
                        type="button"
                        className="btn btn-success btn-sm tw-flex tw-items-center tw-gap-1"
                        onClick={handleCopyAll}
                        disabled={!uploadedUrls.filter(Boolean).length}
                        title="Copy all uploaded preview links"
                      >
                        <Icon icon="mdi:content-copy" />
                        <span className="tw-hidden md:tw-inline">Copy links</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Expanded body: table + actions */}
                {summaryExpanded && (
                  <>
                    {/* Queue table */}
                    <div className="table-responsive tw-max-h-[420px] tw-overflow-auto tw-border tw-rounded dark:tw-border-neutral-700">
                      <table
                        className={`table table-sm align-middle mb-0 ${
                          isDark ? "table-dark" : ""
                        }`}
                      >
                        <thead className={isDark ? "" : "table-light"}>
                          <tr>
                            <th style={{ width: "40%" }}>File</th>
                            <th>Size</th>
                            <th style={{ width: "25%" }}>Progress</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {files.length === 0 && (
                            <tr>
                              <td
                                colSpan={4}
                                className="tw-text-center tw-text-gray-500 dark:tw-text-gray-400"
                              >
                                No files queued yet.
                              </td>
                            </tr>
                          )}
                          {files.map((f, i) => (
                            <tr key={i}>
                              <td className="tw-truncate" title={f.name}>
                                {f.name}
                              </td>
                              <td>{fmtBytes(f.size)}</td>
                              <td>
                                <div className="tw-w-full tw-bg-gray-200 dark:tw-bg-neutral-700 tw-rounded-full tw-overflow-hidden">
                                  <div
                                    className={`${
                                      statuses[i] === "error"
                                        ? "tw-bg-red-500"
                                        : statuses[i] === "uploaded"
                                        ? "tw-bg-green-600"
                                        : "tw-bg-blue-600"
                                    } tw-text-xs tw-font-medium tw-text-blue-100 tw-text-center tw-p-0.5 tw-leading-none tw-rounded-full`}
                                    style={{ width: `${progress[i] || 0}%` }}
                                  >
                                    {progress[i] || 0}%
                                  </div>
                                </div>
                              </td>
                              <td>
                                {statuses[i] === "pending" && (
                                  <span className="badge bg-secondary">Pending</span>
                                )}
                                {statuses[i] === "uploading" && (
                                  <span className="badge bg-primary">Uploading</span>
                                )}
                                {statuses[i] === "uploaded" && (
                                  <span className="badge bg-success">Uploaded</span>
                                )}
                                {statuses[i] === "error" && (
                                  <span className="badge bg-danger">Failed</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Actions */}
                    <div className="tw-flex tw-items-center tw-gap-2 tw-mt-3">
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm tw-flex tw-items-center tw-gap-1"
                        onClick={handleTogglePause}
                        disabled={!isSubmitting}
                        title={isPaused ? "Resume all uploads" : "Pause all uploads"}
                      >
                        <Icon
                          icon={isPaused ? "mdi:play" : "mdi:pause"}
                          className="tw-align-middle"
                        />
                        {isPaused ? "Resume all" : "Pause all"}
                      </button>

                      <button
                        type="button"
                        className="btn btn-danger btn-sm tw-flex tw-items-center tw-gap-1"
                        onClick={handleCancelAll}
                        disabled={!isSubmitting}
                        title="Cancel all uploads"
                      >
                        <Icon icon="mdi:stop" className="tw-align-middle" />
                        Cancel all
                      </button>

                      <button
                        type="button"
                        className="btn btn-success btn-sm tw-flex tw-items-center tw-gap-1 tw-ml-auto"
                        onClick={handleCopyAll}
                        disabled={!uploadedUrls.filter(Boolean).length}
                        title="Copy all uploaded preview links"
                      >
                        <Icon icon="mdi:content-copy" className="tw-align-middle" />
                        Copy all links
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Sticky footer bar during uploads / when files selected */}
        {(isSubmitting || files.length > 0) && (
          <div className="tw-fixed tw-bottom-3 tw-left-1/2 tw--translate-x-1/2 tw-z-40 tw-w-[95%] md:tw-w-[70%] lg:tw-w-[60%]">
            <div className="tw-bg-white dark:tw-bg-neutral-900 tw-border dark:tw-border-neutral-700 tw-rounded-xl tw-shadow-lg tw-p-3 tw-flex tw-items-center tw-gap-3">
              <Icon
                icon="mdi:cloud-upload"
                className="tw-text-2xl tw-text-blue-600"
              />
              <div className="tw-flex-1">
                <div className="tw-flex tw-justify-between tw-text-sm tw-mb-1 tw-text-gray-700 dark:tw-text-gray-200">
                  <span>
                    {files.filter((_, i) => statuses[i] === "uploaded").length}/
                    {files.length} uploaded
                  </span>
                  <span>
                    {fmtBytes(uploadedBytes)} / {fmtBytes(totalBytes)} •{" "}
                    {speedBps ? `${fmtBytes(speedBps)}/s` : "-/s"} • ETA {etaText}
                  </span>
                </div>
                <div className="tw-w-full tw-bg-gray-200 dark:tw-bg-neutral-700 tw-rounded-full tw-overflow-hidden">
                  <div
                    className="tw-bg-blue-600 tw-text-xs tw-font-medium tw-text-blue-100 tw-text-center tw-p-0.5 tw-leading-none tw-rounded-full"
                    style={{ width: `${overallPct}%` }}
                  >
                    {overallPct}%
                  </div>
                </div>
              </div>
              <div className="tw-flex tw-gap-2">
                <button
                  type="button"
                  className="btn btn-secondary btn-sm tw-flex tw-items-center tw-gap-1"
                  onClick={handleTogglePause}
                  disabled={!isSubmitting}
                  title={isPaused ? "Resume all uploads" : "Pause all uploads"}
                >
                  <Icon icon={isPaused ? "mdi:play" : "mdi:pause"} />
                  <span className="tw-hidden sm:tw-inline">
                    {isPaused ? "Resume" : "Pause"}
                  </span>
                </button>
                <button
                  type="button"
                  className="btn btn-danger btn-sm tw-flex tw-items-center tw-gap-1"
                  onClick={handleCancelAll}
                  disabled={!isSubmitting}
                  title="Cancel all uploads"
                >
                  <Icon icon="mdi:stop" />
                  <span className="tw-hidden sm:tw-inline">Cancel</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Simple Lightbox */}
        {lightboxOpen && (
          <div
            className="tw-fixed tw-inset-0 tw-bg-black/80 tw-flex tw-items-center tw-justify-center tw-z-50"
            onClick={onCloseLightbox}
            role="dialog"
            aria-modal="true"
          >
            <div
              className="tw-relative tw-max-w-[90vw] tw-max-h-[90vh] tw-bg-black"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                className="tw-absolute tw-top-2 tw-right-2 tw-p-2 tw-rounded-full tw-bg-white"
                onClick={onCloseLightbox}
                aria-label="Close"
              >
                <Icon icon="radix-icons:cross-2" />
              </button>
              <img
                src={lightboxSrc}
                alt="Preview"
                className="tw-max-w-[90vw] tw-max-h-[90vh] tw-object-contain"
              />
              <div className="tw-absolute tw-inset-y-0 tw-left-0 tw-flex tw-items-center">
                <button
                  className="tw-p-3 tw-bg-white/80 tw-rounded-r"
                  onClick={() =>
                    setLightboxIndex((i) => (i - 1 + previews.length) % previews.length)
                  }
                  aria-label="Previous"
                >
                  <Icon icon="mdi:chevron-left" />
                </button>
              </div>
              <div className="tw-absolute tw-inset-y-0 tw-right-0 tw-flex tw-items-center">
                <button
                  className="tw-p-3 tw-bg-white/80 tw-rounded-l"
                  onClick={() => setLightboxIndex((i) => (i + 1) % previews.length)}
                  aria-label="Next"
                >
                  <Icon icon="mdi:chevron-right" />
                </button>
              </div>
            </div>
          </div>
        )}
      </AdminDashboard>

      <CookiesV />
    </>
  );
};

AddDesign.propTypes = {
  userDetails: PropTypes.object.isRequired,
  workingGroups: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
      name: PropTypes.string.isRequired,
      products: PropTypes.arrayOf(
        PropTypes.shape({
          id: PropTypes.oneOfType([PropTypes.number, PropTypes.string])
            .isRequired,
          name: PropTypes.string.isRequired,
        })
      ),
    })
  ).isRequired,
};

export default AddDesign;
