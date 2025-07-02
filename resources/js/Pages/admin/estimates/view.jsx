import React, { useState, useEffect, useRef } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import $ from 'jquery';
import 'datatables.net';
// import 'datatables.net-dt/css/jquery.dataTables.css';
import 'datatables.net-dt/js/dataTables.dataTables.js';
import AdminDashboard from '@/Layouts/AdminDashboard';
import Breadcrumb from '@/components/Breadcrumb';
import { Icon } from '@iconify/react';
import CookiesV from '@/Components/CookieConsent';
import Alert from '@/Components/Alert';
import Meta from '@/Components/Metaheads';

export default function EstimateView({ userDetails, estimates = { data: [] }, workingGroups = [] }) {
  const [alert, setAlert] = useState(null);

  return (
    <>
      <Head title="Estimates - Admin Dashboard" />
      <Meta title="Estimates - Admin Dashboard" description="Manage your estimates" />
      <AdminDashboard userDetails={userDetails}>
        <Breadcrumb title="Estimates" />
        {alert && <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} />}
        <div className="card h-100 p-0 radius-12">
          <div className="card-header border-bottom bg-base py-16 px-24 d-flex align-items-center flex-wrap gap-3 justify-content-between">
            <div className="tw-font-semibold tw-text-black dark:tw-text-white tw-text-2xl">Estimates</div>
            <div className="d-flex align-items-center flex-wrap gap-3">
              <span className="text-md fw-medium text-secondary-light mb-0">Show</span>
              <select
                name="per_page"
                className="form-select form-select-sm w-auto ps-12 py-6 radius-12 h-40-px"
              // value={data.per_page}
              // onChange={handleChange}
              >
                {[5, 10, 20, 25, 50, 100].map(n => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>

              <input
                type="text"
                name="search"
                className="bg-base h-40-px w-auto form-input ps-12"
                placeholder="Search"
              // value={data.search}
              // onChange={handleChange}
              />

              <select
                name="status"
                className="form-select form-select-sm w-auto ps-12 py-6 radius-12 h-40-px"
              // value={data.status}
              // onChange={handleChange}
              >
                <option value="">None</option>
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="expired">Expired</option>
              </select>

              <select
                name="working_group"
                className="form-select form-select-sm w-auto ps-12 py-6 radius-12 h-40-px"
                placeholder="Select Working Group"
              // value={data.status}
              // onChange={handleChange}
              >
                <option value="">None</option>
                {workingGroups.map(wg => (
                  <option key={wg.id} value={wg.id}>{wg.name}</option>
                ))}
              </select>

            </div>

            <Link
              href={route('admin.addEstimate')}
              className="btn btn-primary text-sm btn-sm px-12 py-12 radius-8 d-flex align-items-center gap-2"
            >
              <Icon icon="ic:baseline-plus" className="icon text-xl line-height-1" />
              Add New Estimates
            </Link>
          </div>
          <div className="card-body p-24">
                hi
          </div>
        </div>

      </AdminDashboard>
      <CookiesV />
    </>
  );
}
