import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import Chart from "react-apexcharts"; // fallback handled below

export default function SalesChart({ settings }) {
  const [loading, setLoading] = useState(true);
  const [series, setSeries] = useState({ orders: [], revenue: [], labels: [] });
  const days = settings?.days || 7;

  const secureGet = useCallback(async (url, opts = {}) => {
    const csrf = document.querySelector('meta[name="csrf-token"]')?.content;
    const headers = { "X-Requested-With": "XMLHttpRequest", ...(csrf ? { "X-CSRF-TOKEN": csrf } : {}), ...opts.headers };
    return axios.get(url, { withCredentials: true, headers, signal: opts.signal });
  }, []);

  useEffect(() => {
    const ac = new AbortController();
    (async () => {
      setLoading(true);
      try {
        const { data } = await secureGet(`/admin/api/widgets/sales?days=${days}`, { signal: ac.signal });
        const d = data?.data ?? {};
        setSeries({ orders: d.orders || [], revenue: d.revenue || [], labels: d.labels || [] });
      } catch (e) { /* noop */ } finally { setLoading(false); }
    })();
    return () => ac.abort();
  }, [days, secureGet]);

  if (loading) {
    return <div className="tw-h-40 tw-animate-pulse tw-bg-gray-100 dark:tw-bg-gray-800 tw-rounded-xl" />;
  }

  const hasApex = !!Chart;
  if (!hasApex) {
    // tiny fallback if apex not installed
    return (
      <div className="tw-text-sm tw-text-gray-500">
        <div className="tw-mb-2">Orders: {series.orders.join(", ")}</div>
        <div>Revenue: {series.revenue.join(", ")}</div>
      </div>
    );
  }

  const options = {
    chart: { type: "line", toolbar: { show: false }, height: 240 },
    stroke: { width: [3, 3] },
    dataLabels: { enabled: false },
    xaxis: { categories: series.labels },
    yaxis: [{ title: { text: "Orders" } }, { opposite: true, title: { text: "Revenue" } }],
    legend: { position: "top" },
  };
  const s = [
    { name: "Orders", data: series.orders },
    { name: "Revenue", data: series.revenue },
  ];

  return <Chart options={options} series={s} type="line" height={240} />;
}
