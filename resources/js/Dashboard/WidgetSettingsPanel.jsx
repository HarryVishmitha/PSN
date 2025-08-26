import React, { useEffect, useState } from "react";
import { WIDGET_MAP } from "./widgets/registry";

export default function WidgetSettingsPanel({ offcanvasId="widgetSettingsCanvas", activeKey, initialSettings, onSave }) {
  const meta = activeKey ? WIDGET_MAP[activeKey] : null;
  const [local, setLocal] = useState(initialSettings || {});

  useEffect(() => {
    setLocal(initialSettings || {});
  }, [activeKey, initialSettings]);

  const set = (k, v) => setLocal(prev => ({ ...prev, [k]: v }));

  const save = () => {
    onSave?.(activeKey, local);
    const el = document.getElementById(offcanvasId);
    if (el && window.bootstrap?.Offcanvas.getInstance(el)) {
      window.bootstrap.Offcanvas.getInstance(el).hide();
    }
  };

  return (
    <div className="offcanvas offcanvas-end" tabIndex="-1" id={offcanvasId}>
      <div className="offcanvas-header">
        <h5 className="tw-font-semibold tw-m-0">Widget Settings {meta ? `— ${meta.title}` : ""}</h5>
        <button className="btn-close" data-bs-dismiss="offcanvas" />
      </div>
      <div className="offcanvas-body">
        {!meta ? (
          <div className="tw-text-sm tw-text-gray-500">Select a widget to configure.</div>
        ) : (
          <>
            {/* Example common setting: timeframe (days) */}
            <div className="mb-3">
              <label className="form-label">Timeframe (days)</label>
              <input type="number" min="1" max="90" className="form-control"
                value={local.days ?? 7} onChange={(e)=>set("days", Number(e.target.value||7))} />
              <div className="form-text">Used by Sales & any time‑based widgets.</div>
            </div>

            {/* Future: per‑widget custom fields here based on meta.key */}

            <div className="d-flex justify-content-end tw-gap-2">
              <button className="btn btn-light" data-bs-dismiss="offcanvas">Cancel</button>
              <button className="btn btn-primary" onClick={save}>Save</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
