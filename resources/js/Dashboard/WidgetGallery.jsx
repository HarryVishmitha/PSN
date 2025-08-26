import React from "react";
import { WIDGETS } from "./widgets/registry";
import { Icon } from "@iconify/react";

export default function WidgetGallery({ modalId="widgetGalleryModal", onAdd, currentKeys=[] }) {
  return (
    <div className="modal fade" id={modalId} tabIndex="-1" aria-hidden="true">
      <div className="modal-dialog modal-lg modal-dialog-scrollable">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Add Widgets</h5>
            <button className="btn-close" data-bs-dismiss="modal" />
          </div>
          <div className="modal-body">
            <div className="tw-grid tw-grid-cols-1 sm:tw-grid-cols-2 tw-gap-4">
              {WIDGETS.map(w => {
                const added = currentKeys.includes(w.key);
                return (
                  <div key={w.key} className="tw-bg-white dark:tw-bg-gray-900 tw-rounded-xl tw-border tw-border-gray-200 dark:tw-border-gray-800 tw-p-4 tw-flex tw-flex-col">
                    <div className="tw-flex tw-items-center tw-gap-2 tw-mb-2">
                      <Icon icon={w.previewIcon} className="tw-text-xl" />
                      <h6 className="tw-font-semibold tw-m-0">{w.title}</h6>
                    </div>
                    <div className="tw-text-xs tw-text-gray-500 tw-mb-4">Preview & description…</div>
                    <div className="tw-mt-auto">
                      <button
                        className={`btn btn-sm ${added ? "btn-secondary" : "btn-primary"}`}
                        disabled={added}
                        onClick={() => onAdd(w.key)}
                        data-bs-dismiss="modal"
                      >
                        {added ? "Added" : "Add to Dashboard"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="modal-footer">
            <button className="btn btn-light" data-bs-dismiss="modal">Close</button>
          </div>
        </div>
      </div>
    </div>
  );
}
