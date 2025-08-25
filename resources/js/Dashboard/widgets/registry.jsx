import React from "react";
import { Icon } from "@iconify/react";

// ——— Placeholders (replace with your real components later) ———
export const SalesChart = () => (
  <div className="tw-bg-white dark:tw-bg-gray-900 tw-rounded-xl tw-border tw-border-gray-200 dark:tw-border-gray-800 tw-p-4">
    <div className="tw-flex tw-items-center tw-gap-2 tw-mb-3">
      <Icon icon="mdi:finance" className="tw-text-xl" />
      <h6 className="tw-font-semibold tw-m-0">Sales (Last 7 days)</h6>
    </div>
    <div className="tw-text-sm tw-text-gray-500">Chart placeholder</div>
  </div>
);

export const TaskList = () => (
  <div className="tw-bg-white dark:tw-bg-gray-900 tw-rounded-xl tw-border tw-border-gray-200 dark:tw-border-gray-800 tw-p-4">
    <div className="tw-flex tw-items-center tw-gap-2 tw-mb-3">
      <Icon icon="mdi:check-circle-outline" className="tw-text-xl" />
      <h6 className="tw-font-semibold tw-m-0">My Tasks</h6>
    </div>
    <ul className="tw-text-sm tw-space-y-2 tw-text-gray-600 dark:tw-text-gray-300">
      <li>• Approve design proofs</li>
      <li>• Call supplier</li>
      <li>• Review quotations</li>
    </ul>
  </div>
);

export const CalendarMini = () => (
  <div className="tw-bg-white dark:tw-bg-gray-900 tw-rounded-xl tw-border tw-border-gray-200 dark:tw-border-gray-800 tw-p-4">
    <div className="tw-flex tw-items-center tw-gap-2 tw-mb-3">
      <Icon icon="mdi:calendar-month" className="tw-text-xl" />
      <h6 className="tw-font-semibold tw-m-0">Calendar</h6>
    </div>
    <div className="tw-text-sm tw-text-gray-500">Calendar placeholder</div>
  </div>
);

export const CustomersTable = () => (
  <div className="tw-bg-white dark:tw-bg-gray-900 tw-rounded-xl tw-border tw-border-gray-200 dark:tw-border-gray-800 tw-p-4">
    <div className="tw-flex tw-items-center tw-gap-2 tw-mb-3">
      <Icon icon="mdi:account-group" className="tw-text-xl" />
      <h6 className="tw-font-semibold tw-m-0">Active Customers</h6>
    </div>
    <div className="tw-text-sm tw-text-gray-500">Table placeholder</div>
  </div>
);

export const RecentActivity = () => (
  <div className="tw-bg-white dark:tw-bg-gray-900 tw-rounded-xl tw-border tw-border-gray-200 dark:tw-border-gray-800 tw-p-4">
    <div className="tw-flex tw-items-center tw-gap-2 tw-mb-3">
      <Icon icon="mdi:history" className="tw-text-xl" />
      <h6 className="tw-font-semibold tw-m-0">Recent Activity</h6>
    </div>
    <div className="tw-text-sm tw-text-gray-500">Logs placeholder</div>
  </div>
);

// ——— Registry ———
export const WIDGETS = [
  { key: "sales",    title: "Sales Chart",       component: SalesChart  },
  { key: "tasks",    title: "Task List",         component: TaskList    },
  { key: "calendar", title: "Calendar (Mini)",   component: CalendarMini},
  { key: "customers",title: "Active Customers",  component: CustomersTable},
  { key: "activity", title: "Recent Activity",   component: RecentActivity},
];

// quick map for renders
export const WIDGET_MAP = Object.fromEntries(WIDGETS.map(w => [w.key, w]));
