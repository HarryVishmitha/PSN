import React from "react";
import { Icon } from "@iconify/react";

export default function WidgetCardFrame({
  title, onRemove, onSettings, size="md", onResize, children
}) {
  return (
    <div className="tw-bg-white dark:tw-bg-gray-900 tw-rounded-2xl tw-border tw-border-gray-200 dark:tw-border-gray-800 tw-shadow-sm hover:tw-shadow-md tw-transition tw-h-full tw-flex tw-flex-col">
      <div className="tw-flex tw-items-center tw-justify-between tw-px-4 tw-pt-3 tw-pb-2 tw-border-b tw-border-gray-100 dark:tw-border-gray-800">
        <h6 className="tw-font-semibold tw-m-0">{title}</h6>
        <div className="btn-group btn-group-sm">
          <button className="btn btn-light" title="Resize"
            onClick={() => onResize?.(size === "md" ? "lg" : "md")}>
            <Icon icon={size==="md" ? "mdi:arrow-expand-horizontal" : "mdi:arrow-collapse-horizontal"} />
          </button>
          <button className="btn btn-light" title="Settings" onClick={onSettings}>
            <Icon icon="mdi:cog-outline" />
          </button>
          <button className="btn btn-outline-danger" title="Remove" onClick={onRemove}>
            <Icon icon="mdi:close" />
          </button>
        </div>
      </div>
      <div className="tw-p-4 tw-flex-1">{children}</div>
    </div>
  );
}
