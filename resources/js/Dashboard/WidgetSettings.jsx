import React, { useEffect, useMemo, useState } from "react";
import { WIDGETS, WIDGET_MAP } from "@/Dashboard/widgets/registry.jsx";
import { Icon } from "@iconify/react";

export default function WidgetSettings({
  userId,
  currentKeys,
  onSave,
  offcanvasId = "dashboardWidgetsOffcanvas",
}) {
  const storageKey = useMemo(
    () => `printair.dashboard.widgets:v1:u${userId || "guest"}`,
    [userId]
  );
  const [selected, setSelected] = useState(currentKeys || []);

  useEffect(() => {
    setSelected(currentKeys || []);
  }, [currentKeys]);

  const toggleKey = (key) => {
    setSelected((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const move = (idx, dir) => {
    setSelected((prev) => {
      const next = [...prev];
      const ni = idx + dir;
      if (ni < 0 || ni >= next.length) return prev;
      [next[idx], next[ni]] = [next[ni], next[idx]];
      return next;
    });
  };

  const save = () => {
    localStorage.setItem(storageKey, JSON.stringify(selected));
    onSave(selected);
    // close offcanvas via Bootstrap data API if present
    const el = document.getElementById(offcanvasId);
    if (el && window.bootstrap?.Offcanvas.getInstance(el)) {
      window.bootstrap.Offcanvas.getInstance(el).hide();
    }
  };

  const reset = () => {
    localStorage.removeItem(storageKey);
    setSelected([]);
    onSave([]);
  };

  return (
    <div className="offcanvas offcanvas-end" tabIndex="-1" id={offcanvasId} aria-labelledby="widgetsLabel">
      <div className="offcanvas-header">
        <h5 id="widgetsLabel" className="tw-font-semibold tw-m-0">Customize Dashboard</h5>
        <button type="button" className="btn-close" data-bs-dismiss="offcanvas" aria-label="Close"/>
      </div>
      <div className="offcanvas-body tw-space-y-6">
        {/* Available widgets */}
        <div>
          <h6 className="tw-text-sm tw-font-semibold tw-mb-2">Available widgets</h6>
          <div className="tw-grid tw-grid-cols-1 sm:tw-grid-cols-2 tw-gap-3">
            {WIDGETS.map((w) => (
              <label key={w.key} className="tw-flex tw-items-center tw-gap-3 tw-rounded-xl tw-border tw-border-gray-200 dark:tw-border-gray-800 tw-px-3 tw-py-2 tw-cursor-pointer tw-bg-white dark:tw-bg-gray-900">
                <input
                  type="checkbox"
                  className="form-check-input tw-mt-0"
                  checked={selected.includes(w.key)}
                  onChange={() => toggleKey(w.key)}
                />
                <span className="tw-text-sm tw-font-medium">{w.title}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Order / Arrange */}
        <div>
          <h6 className="tw-text-sm tw-font-semibold tw-mb-2">Order</h6>
          {selected.length === 0 ? (
            <div className="tw-text-sm tw-text-gray-500">No widgets selected yet.</div>
          ) : (
            <ul className="list-group">
              {selected.map((key, idx) => {
                const title = WIDGETS.find(w => w.key === key)?.title || key;
                return (
                  <li key={key} className="list-group-item d-flex align-items-center justify-content-between">
                    <span className="tw-flex tw-items-center tw-gap-2">
                      <Icon icon="mdi:drag" className="tw-text-lg tw-text-gray-400" />
                      {title}
                    </span>
                    <span className="btn-group btn-group-sm">
                      <button className="btn btn-light" onClick={() => move(idx, -1)} disabled={idx===0} aria-label="Move up">
                        <Icon icon="mdi:arrow-up" />
                      </button>
                      <button className="btn btn-light" onClick={() => move(idx, +1)} disabled={idx===selected.length-1} aria-label="Move down">
                        <Icon icon="mdi:arrow-down" />
                      </button>
                      <button className="btn btn-outline-danger" onClick={() => toggleKey(key)} aria-label="Remove">
                        <Icon icon="mdi:close" />
                      </button>
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Actions */}
        <div className="d-flex justify-content-between">
          <button className="btn btn-outline-secondary" onClick={reset}>
            Reset
          </button>
          <button className="btn btn-primary" onClick={save}>
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
