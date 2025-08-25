import React, { useEffect, useMemo, useState, useCallback } from "react";
import axios from "axios";
import { Head } from "@inertiajs/react";
import CookiesV from "@/Components/CookieConsent";
import AdminDashboard from "../../Layouts/AdminDashboard";
import Breadcrumb from "@/Components/Breadcrumb";
import Meta from "@/Components/Metaheads";
import MetricCard from "@/Components/MetricCard";
import { Icon } from "@iconify/react";

// ✅ Advanced bottom-section pieces
import DashboardWidgetsGrid from "@/Dashboard/DashboardWidgetsGrid";
import WidgetGallery from "@/Dashboard/WidgetGallery";
import WidgetSettingsPanel from "@/Dashboard/WidgetSettingsPanel";
import { WIDGET_MAP } from "@/Dashboard/widgets/registry.jsx";

const TinySpark = ({ points = [] }) => {
  const max = Math.max(1, ...points);
  const svgPoints =
    points.length > 1
      ? points.map((v, i) => `${(i / (points.length - 1)) * 100},${100 - (v / max) * 100}`).join(" ")
      : `0,100 100,100`;
  return (
    <svg viewBox="0 0 100 100" width="120" height="40" preserveAspectRatio="none">
      <polyline fill="none" stroke="currentColor" strokeWidth="3" points={svgPoints} />
    </svg>
  );
};

const GALLERY_ID = "widgetGalleryModal";
const SETTINGS_ID = "widgetSettingsCanvas";

const Dashboard = ({ userDetails }) => {
  // ---------------- Top metrics (unchanged secure hydrate) ----------------
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState({
    totalUsers: 0,
    adminUsers: 0,
    userUsers: 0,
    workingGroups: 0,
    dailyCustomers: 0,
    ordersToday: null,
    revenueToday: null,
    trends: { users: [], orders: [], revenue: [] },
  });
  const [error, setError] = useState(null);

  const breadcrumbs = useMemo(
    () => [
      { label: "Home", url: route("home"), icon: "fluent:home-48-regular" },
      { label: "Admin Dashboard", url: "", icon: null },
    ],
    []
  );

  const secureGet = useCallback(async (url, opts = {}) => {
    const csrf = document.querySelector('meta[name="csrf-token"]')?.content;
    const headers = {
      "X-Requested-With": "XMLHttpRequest",
      ...(csrf ? { "X-CSRF-TOKEN": csrf } : {}),
      ...opts.headers,
    };
    return axios.get(url, { withCredentials: true, headers, signal: opts.signal });
  }, []);

  const fetchTopMetrics = useCallback(
    async (signal) => {
      setLoading(true);
      setError(null);
      try {
        const { data } = await secureGet("/admin/api/dashboard/metrics", { signal });
        setMetrics(data?.data ?? {});
      } catch (e) {
        if (e.name !== "CanceledError" && e.name !== "AbortError") {
          setError(e?.response?.data?.message || "Failed to load metrics.");
        }
      } finally {
        setLoading(false);
      }
    },
    [secureGet]
  );

  useEffect(() => {
    const ac = new AbortController();
    fetchTopMetrics(ac.signal);
    return () => ac.abort();
  }, [fetchTopMetrics]);

  // ---------------- Bottom: drag/drop layout + gallery + per-widget settings ----------------
  const userId = userDetails?.id || "guest";
  const layoutKey = `printair.dashboard.layout:v1:${userId}`;

  // layout: [{ key, size: 'md'|'lg', settings: {} }]
  const [layout, setLayout] = useState([]);
  const [activeKey, setActiveKey] = useState(null);

  // load saved layout (or sensible defaults)
  useEffect(() => {
    try {
      const raw = localStorage.getItem(layoutKey);
      const parsed = raw ? JSON.parse(raw) : null;
      setLayout(
        Array.isArray(parsed)
          ? parsed
          : [
            { key: "sales", size: "lg", settings: { days: 7 } },
            { key: "tasks", size: "md", settings: {} },
            { key: "activity", size: "md", settings: {} },
          ]
      );
    } catch {
      setLayout([
        { key: "sales", size: "lg", settings: { days: 7 } },
        { key: "tasks", size: "md", settings: {} },
        { key: "activity", size: "md", settings: {} },
      ]);
    }
  }, [layoutKey]);

  // persist on change
  useEffect(() => {
    try {
      localStorage.setItem(layoutKey, JSON.stringify(layout));
    } catch { }
  }, [layout, layoutKey]);

  const currentKeys = useMemo(() => layout.map((w) => w.key), [layout]);

  const addWidget = (key) => {
    if (!WIDGET_MAP[key] || currentKeys.includes(key)) return;
    setLayout((prev) => [...prev, { key, size: "md", settings: {} }]);
  };

  const openSettings = (key) => {
    setActiveKey(key);
    const el = document.getElementById(SETTINGS_ID);
    if (el) new window.bootstrap.Offcanvas(el).show();
  };

  const saveSettings = (key, settings) => {
    setLayout((prev) => prev.map((w) => (w.key === key ? { ...w, settings } : w)));
  };

  return (
    <>
      <Head title="Admin Dashboard" />
      <Meta title="Admin Dashboard" description="Admin Dashboard" />
      <AdminDashboard userDetails={userDetails}>
        <Breadcrumb title="Panels" />

        {error && (
          <div className="alert alert-danger d-flex justify-content-between align-items-center">
            <span>{error}</span>
            <button className="btn btn-sm btn-light" onClick={() => fetchTopMetrics()}>
              Retry
            </button>
          </div>
        )}

        {/* ===================== TOP (fixed for all backend users) ===================== */}
        <div className="row row-cols-xxxl-5 row-cols-lg-3 row-cols-sm-2 row-cols-1 gy-4 tw-gap-y-6">
          <div className="col">
            <MetricCard
              label="Total Users"
              value={metrics.totalUsers}
              icon="gridicons:multiple-users"
              tone="cyan"
              subtitle="All registered accounts"
              loading={loading}
              rightNode={
                <div className="tw-text-cyan-600">
                  <TinySpark points={metrics.trends?.users || []} />
                </div>
              }
              delta={loading ? null : { value: 8, dir: "up" }}
            />
          </div>

          <div className="col">
            <MetricCard
              label="Admins"
              value={metrics.adminUsers}
              icon="mdi:shield-account"
              tone="violet"
              subtitle="Active admin accounts"
              loading={loading}
            />
          </div>

          <div className="col">
            <MetricCard
              label="Designers"
              value={metrics.designers}
              icon="mdi:account-tie"
              tone="amber"
              subtitle="Design staff"
              loading={loading}
            />
          </div>

          <div className="col">
            <MetricCard
              label="Working Groups"
              value={metrics.workingGroups}
              icon="mdi:account-group"
              tone="teal"
              subtitle="Available groups"
              loading={loading}
            />
          </div>

          <div className="col">
            <MetricCard
              label="Daily Active (Today)"
              value={metrics.dailyCustomers}
              icon="mdi:account-clock"
              tone="rose"
              subtitle="Unique active users"
              loading={loading}
              delta={loading ? null : { value: 4, dir: "up" }}
            />
          </div>

          {/* Optional business metrics */}
          <div className="col">
            <MetricCard
              label="Orders Today"
              value={metrics.ordersToday}
              icon="mdi:cart"
              tone="slate"
              subtitle="Placed within last 24h"
              loading={loading}
              rightNode={
                <div className="tw-text-slate-600">
                  <TinySpark points={metrics.trends?.orders || []} />
                </div>
              }
            />
          </div>

          <div className="col">
            <MetricCard
              label="Revenue Today"
              value={
                typeof metrics.revenueToday === "number"
                  ? `Rs ${metrics.revenueToday.toLocaleString()}`
                  : metrics.revenueToday ?? "-"
              }
              icon="mdi:cash-multiple"
              tone="slate"
              subtitle="Confirmed payments"
              loading={loading}
              rightNode={
                <div className="tw-text-slate-600">
                  <TinySpark points={metrics.trends?.revenue || []} />
                </div>
              }
            />
          </div>
        </div>
        {/* ===================== /TOP ===================== */}

        {/* ===================== BOTTOM (customizable) ===================== */}
        <div className="tw-mt-10">
          <div className="d-flex justify-content-between align-items-center tw-mb-4">
            <h6 className="tw-font-semibold tw-m-0">Site Overview</h6>

            <div className="d-flex tw-gap-2">
              {/* Quick presets */}
              <div className="btn-group">
                <button
                  className="btn btn-outline-secondary btn-sm"
                  onClick={() =>
                    setLayout([
                      { key: "sales", size: "lg", settings: { days: 7 } },
                      { key: "customers", size: "md", settings: {} },
                      { key: "activity", size: "md", settings: {} },
                    ])
                  }
                >
                  Preset: Analytics
                </button>
                <button
                  className="btn btn-outline-secondary btn-sm"
                  onClick={() =>
                    setLayout([
                      { key: "tasks", size: "md", settings: {} },
                      { key: "calendar", size: "lg", settings: {} },
                      { key: "activity", size: "md", settings: {} },
                    ])
                  }
                >
                  Preset: Team
                </button>
              </div>

              {/* FAB Add Widget */}
              <button
                className="btn btn-primary tw-rounded-full tw-flex tw-items-center tw-gap-2"
                data-bs-toggle="modal"
                data-bs-target={`#${GALLERY_ID}`}
              >
                <Icon icon="mdi:plus" className="tw-text-lg" />
                Add Widget
              </button>
            </div>
          </div>

          {/* Drag & drop grid */}
          <DashboardWidgetsGrid layout={layout} setLayout={setLayout} onOpenSettings={openSettings} />
        </div>
      </AdminDashboard>

      {/* Gallery modal (visual picker) */}
      <WidgetGallery modalId={GALLERY_ID} onAdd={addWidget} currentKeys={currentKeys} />

      {/* Per-widget settings offcanvas */}
      <WidgetSettingsPanel
        offcanvasId={SETTINGS_ID}
        activeKey={activeKey}
        initialSettings={layout.find((w) => w.key === activeKey)?.settings}
        onSave={saveSettings}
      />

      <CookiesV />
    </>
  );
};

export default Dashboard;
