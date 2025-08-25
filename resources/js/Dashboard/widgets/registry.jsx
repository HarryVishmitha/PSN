import SalesChart from "@/Dashboard/widgets/SalesChart";
import RecentActivity from "@/Dashboard/widgets/RecentActivity";
import CustomersTable from "@/Dashboard/widgets/CustomersTable";
import TaskList from "@/Dashboard/widgets/TaskList";
import CalendarMini from "@/Dashboard/widgets/CalendarMini";

import TopProducts from "@/Dashboard/widgets/TopProducts";
import CategoryBreakdown from "@/Dashboard/widgets/CategoryBreakdown";
import LowStock from "@/Dashboard/widgets/LowStock";
import PaymentsByMethod from "@/Dashboard/widgets/PaymentsByMethod";
import Refunds from "@/Dashboard/widgets/Refunds";
import ShipmentsStatus from "@/Dashboard/widgets/ShipmentsStatus";

export const WIDGETS = [
  { key:"sales",     title:"Sales Chart",        component:SalesChart,       previewIcon:"mdi:finance" },
  { key:"top_products", title:"Top Products",    component:TopProducts,      previewIcon:"mdi:star-box-outline" },
  { key:"category_breakdown", title:"Category Revenue", component:CategoryBreakdown, previewIcon:"mdi:chart-arc" },
  { key:"payments_methods", title:"Payments by Method", component:PaymentsByMethod, previewIcon:"mdi:credit-card-outline" },
  { key:"refunds",   title:"Refunds",            component:Refunds,          previewIcon:"mdi:cash-refund" },
  { key:"shipments", title:"Shipments Status",   component:ShipmentsStatus,  previewIcon:"mdi:truck-delivery-outline" },
  { key:"low_stock", title:"Low Stock",          component:LowStock,         previewIcon:"mdi:alert-decagram-outline" },
  { key:"customers", title:"Active Customers",   component:CustomersTable,   previewIcon:"mdi:account-group" },
  { key:"activity",  title:"Recent Activity",    component:RecentActivity,   previewIcon:"mdi:history" },
  { key:"tasks",     title:"Task List",          component:TaskList,         previewIcon:"mdi:check-circle-outline" },
  { key:"calendar",  title:"Calendar (Mini)",    component:CalendarMini,     previewIcon:"mdi:calendar-month" },
];

export const WIDGET_MAP = Object.fromEntries(WIDGETS.map(w=>[w.key,w]));
