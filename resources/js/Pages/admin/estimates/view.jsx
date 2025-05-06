import React, { useState, useEffect } from 'react';
import { Head, router, Link } from '@inertiajs/react';
import AdminDashboard from '../../../Layouts/AdminDashboard';
import Breadcrumb from "@/components/Breadcrumb";
import { Icon } from "@iconify/react";
import CookiesV from '@/Components/CookieConsent';
import Alert from "@/Components/Alert";
import Meta from "@/Components/Metaheads";

const EstimateView = ({ userDetails, estimates, filters, workingGroups }) => {
  const [alert, setAlert] = useState(null);
  const [perPage, setPerPage] = useState(filters.per_page || 10);
  const [search, setSearch] = useState(filters.search || '');
  const [status, setStatus] = useState(filters.status || '');

  const applyFilters = () => {
    router.get(
      route('admin.estimates.index'),
      { per_page: perPage, search, status },
      { preserveState: true, replace: true }
    );
  };

  useEffect(() => {
    setPerPage(filters.per_page || 10);
    setSearch(filters.search || '');
    setStatus(filters.status || '');
  }, [filters]);

  return (
    <>
      <Head title="Estimates - Admin Dashboard" />
      <Meta
        title="Estimates - Admin Dashboard"
        description="Add, Accept, Edit, Delete, Expire, Confirm Estimates"
      />

      <AdminDashboard userDetails={userDetails}>
        <Breadcrumb title="Estimates" />
        {alert && <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} />}

        <div className="card">
          <div className="card-header d-flex flex-wrap align-items-center justify-content-between gap-3">
            <div className="d-flex flex-wrap align-items-center gap-3">
              <div className="d-flex align-items-center gap-2">
                <span>Show</span>
                <select
                  className="form-select form-select-sm w-auto"
                  value={perPage}
                  onChange={e => { setPerPage(e.target.value); applyFilters(); }}
                >
                  {[10,15,20].map(n => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
              </div>
              <div className="icon-field">
                <input
                  type="text"
                  className="form-control form-control-sm w-auto"
                  placeholder="Search"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && applyFilters()}
                />
                <span className="icon" onClick={applyFilters}>
                  <Icon icon="ion:search-outline" />
                </span>
              </div>
            </div>
            <div className="d-flex flex-wrap align-items-center gap-3">
              <select
                className="form-select form-select-sm w-auto"
                value={status}
                onChange={e => { setStatus(e.target.value); applyFilters(); }}
              >
                <option value="">Select Status</option>
                <option value="paid">Paid</option>
                <option value="pending">Pending</option>
              </select>
              <Link
                href='#'
                className="btn btn-sm btn-primary-600"
              >
                <i className="ri-add-line" /> New Estimate
              </Link>
            </div>
          </div>

          <div className="card-body">
            <table className="table bordered-table mb-0">
              <thead>
                <tr>
                  <th>
                    <div className="form-check style-check d-flex align-items-center">
                      <input className="form-check-input" type="checkbox" id="checkAll" />
                      <label className="form-check-label" htmlFor="checkAll">S.L</label>
                    </div>
                  </th>
                  <th>Estimate #</th>
                  <th>Name</th>
                  <th>Issued Date</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {estimates.data.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="text-center">No estimates found.</td>
                  </tr>
                ) : estimates.data.map((est, idx) => (
                  <tr key={est.id}>
                    <td>
                      <div className="form-check style-check d-flex align-items-center">
                        <input className="form-check-input" type="checkbox" id={`check${est.id}`} />
                        <label className="form-check-label" htmlFor={`check${est.id}`}>
                          {estimates.from + idx}
                        </label>
                      </div>
                    </td>
                    <td>
                      <Link href='#' className="text-primary-600">
                        {est.number}
                      </Link>
                    </td>
                    <td>
                      <div className="d-flex align-items-center">
                        <img
                          src={est.customer.avatar_url || '/images/default-avatar.png'}
                          alt=""
                          className="flex-shrink-0 me-12 radius-8"
                          width={32}
                          height={32}
                        />
                        <h6 className="text-md mb-0 fw-medium flex-grow-1">
                          {est.customer.name}
                        </h6>
                      </div>
                    </td>
                    <td>{new Date(est.issued_date).toLocaleDateString()}</td>
                    <td>${est.total.toFixed(2)}</td>
                    <td>
                      <span
                        className={`px-24 py-4 rounded-pill fw-medium text-sm ${
                          est.status === 'paid'
                            ? 'bg-success-focus text-success-main'
                            : 'bg-warning-focus text-warning-main'
                        }`}
                      >
                        {est.status.charAt(0).toUpperCase() + est.status.slice(1)}
                      </span>
                    </td>
                    <td>
                      <Link
                        href='#'
                        className="w-32-px h-32-px me-8 bg-primary-light text-primary-600 rounded-circle d-inline-flex align-items-center justify-content-center"
                      >
                        <Icon icon="iconamoon:eye-light" />
                      </Link>
                      <Link
                        href='#'
                        className="w-32-px h-32-px me-8 bg-success-focus text-success-main rounded-circle d-inline-flex align-items-center justify-content-center"
                      >
                        <Icon icon="lucide:edit" />
                      </Link>
                      <button
                        onClick={() => {
                          if (confirm('Are you sure?')) {
                            router.delete(route('admin.estimates.destroy', est.id));
                          }
                        }}
                        className="w-32-px h-32-px me-8 bg-danger-focus text-danger-main rounded-circle d-inline-flex align-items-center justify-content-center"
                      >
                        <Icon icon="mingcute:delete-2-line" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mt-24">
              <span>
                Showing {estimates.from} to {estimates.to} of {estimates.total} entries
              </span>
              <ul className="pagination d-flex flex-wrap align-items-center gap-2 justify-content-center">
                {estimates.prev_page_url && (
                  <li className="page-item">
                    <Link
                      className="page-link text-secondary-light fw-medium radius-4 border-0 px-10 py-10 d-flex align-items-center justify-content-center"
                      href={estimates.prev_page_url}
                    >
                      <Icon icon="ep:d-arrow-left" />
                    </Link>
                  </li>
                )}
                {Array.from({ length: estimates.last_page }, (_, i) => i + 1).map(page => (
                  <li className="page-item" key={page}>
                    <Link
                      className={`page-link fw-medium radius-4 border-0 px-10 py-10 d-flex align-items-center justify-content-center ${
                        page === estimates.current_page
                          ? 'bg-primary-600 text-white'
                          : 'bg-primary-50 text-secondary-light'
                      }`}
                      href='#'
                    >
                      {page}
                    </Link>
                  </li>
                ))}
                {estimates.next_page_url && (
                  <li className="page-item">
                    <Link
                      className="page-link text-secondary-light fw-medium radius-4 border-0 px-10 py-10 d-flex align-items-center justify-content-center"
                      href={estimates.next_page_url}
                    >
                      <Icon icon="ep:d-arrow-right" />
                    </Link>
                  </li>
                )}
              </ul>
            </div>
          </div>
        </div>
      </AdminDashboard>
      <CookiesV />
    </>
  );
};

export default EstimateView;
