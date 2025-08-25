import React, { useEffect, useMemo, useState, useCallback } from "react";
import axios from "axios";
import { Head } from "@inertiajs/react";
import CookiesV from "@/Components/CookieConsent";
import AdminDashboard from "../../Layouts/AdminDashboard";
import Breadcrumb from "@/Components/Breadcrumb";
import Meta from "@/Components/Metaheads";
import MetricCard from "@/Components/MetricCard";
import { Icon } from "@iconify/react";
import WidgetSettings from "@/Dashboard/WidgetSettings";
import { WIDGETS, WIDGET_MAP } from "@/Dashboard/widgets/registry.jsx";


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

const BOTTOM_OFFCANVAS_ID = "dashboardWidgetsOffcanvas";

const Dashboard = ({ userDetails }) => {
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

  const userId = userDetails?.id || null;
  const storageKey = useMemo(
    () => `printair.dashboard.widgets:v1:u${userId || "guest"}`,
    [userId]
  );
  const [widgetKeys, setWidgetKeys] = useState([]);

  // load saved selection on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      const parsed = raw ? JSON.parse(raw) : null;
      // default selection if empty — choose a few good ones
      setWidgetKeys(Array.isArray(parsed) ? parsed : ["sales", "tasks", "activity"]);
    } catch {
      setWidgetKeys(["sales", "tasks", "activity"]);
    }
  }, [storageKey]);

  // simple renderer
  const renderWidget = (key) => {
    const W = WIDGET_MAP[key]?.component;
    if (!W) return null;
    return <W />;
  };

  const breadcrumbs = useMemo(
    () => [
      { label: "Home", url: route("home"), icon: "fluent:home-48-regular" },
      { label: "Admin Dashboard", url: "", icon: null },
    ],
    []
  );

  // ——— SECURE DEFAULTS (per-request) ———
  const secureGet = useCallback(async (url, opts = {}) => {
    // Ensure CSRF + XHR header for Laravel
    const csrf = document.querySelector('meta[name="csrf-token"]')?.content;
    const headers = {
      "X-Requested-With": "XMLHttpRequest",
      ...(csrf ? { "X-CSRF-TOKEN": csrf } : {}),
      ...opts.headers,
    };
    return axios.get(url, { withCredentials: true, headers, signal: opts.signal });
  }, []);

  const fetchTopMetrics = useCallback(async (signal) => {
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
  }, [secureGet]);

  useEffect(() => {
    // render immediately, then hydrate
    const ac = new AbortController();
    fetchTopMetrics(ac.signal);
    return () => ac.abort();
  }, [fetchTopMetrics]);

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
      rightNode={<div className="tw-text-cyan-600"><TinySpark points={metrics.trends?.users || []} /></div>}
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
      rightNode={<div className="tw-text-slate-600"><TinySpark points={metrics.trends?.orders || []} /></div>}
    />
  </div>

  <div className="col">
    <MetricCard
      label="Revenue Today"
      value={
        typeof metrics.revenueToday === "number"
          ? `Rs ${metrics.revenueToday.toLocaleString()}`
          : (metrics.revenueToday ?? "-")
      }
      icon="mdi:cash-multiple"
      tone="slate"
      subtitle="Confirmed payments"
      loading={loading}
      rightNode={<div className="tw-text-slate-600"><TinySpark points={metrics.trends?.revenue || []} /></div>}
    />
  </div>
</div>
        {/* ===================== /TOP ===================== */}

        {/* Bottom customizable section comes next */}
        <div className="tw-mt-10">
          <div className="d-flex justify-content-between align-items-center tw-mb-4">
            <h5 className="tw-font-semibold tw-m-0">Your Custom Dashboard</h5>

            {/* Settings trigger (gear icon) */}
            <button
              className="btn btn-light tw-rounded-full tw-flex tw-items-center tw-gap-2"
              type="button"
              data-bs-toggle="offcanvas"
              data-bs-target={`#${BOTTOM_OFFCANVAS_ID}`}
              aria-controls={BOTTOM_OFFCANVAS_ID}
              title="Customize widgets"
            >
              <Icon icon="mdi:cog-outline" className="tw-text-lg" />
              Customize
            </button>
          </div>

          <div className="row gy-4">
            {widgetKeys.length === 0 ? (
              <div className="col-12">
                <div className="alert alert-info d-flex align-items-center justify-content-between">
                  <span>No widgets selected. Click “Customize” to add widgets.</span>
                  <button
                    className="btn btn-sm btn-primary"
                    data-bs-toggle="offcanvas"
                    data-bs-target={`#${BOTTOM_OFFCANVAS_ID}`}
                  >
                    Add Widgets
                  </button>
                </div>
              </div>
            ) : (
              widgetKeys.map((k) => (
                <div key={k} className="col-12 col-lg-6">
                  {renderWidget(k)}
                </div>
              ))
            )}
          </div>
        </div>
      </AdminDashboard>
      {/* Offcanvas settings */}
      <WidgetSettings
        userId={userId}
        currentKeys={widgetKeys}
        onSave={setWidgetKeys}
        offcanvasId={BOTTOM_OFFCANVAS_ID}
      />
      <CookiesV />
    </>
  );
};

export default Dashboard;
