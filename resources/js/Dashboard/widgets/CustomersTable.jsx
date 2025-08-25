import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";

export default function CustomersTable() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

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
        const { data } = await secureGet(`/admin/api/widgets/customers?limit=10`, { signal: ac.signal });
        setItems(data?.data?.items || []);
      } catch (e) {} finally { setLoading(false); }
    })();
    return () => ac.abort();
  }, [secureGet]);

  if (loading) return <div className="tw-h-40 tw-animate-pulse tw-bg-gray-100 dark:tw-bg-gray-800 tw-rounded-xl" />;

  return (
    <div className="table-responsive">
      <table className="table align-middle">
        <thead>
          <tr><th>Name</th><th>Email</th><th>Last seen</th></tr>
        </thead>
        <tbody>
          {items.map((u) => (
            <tr key={u.id}>
              <td>{u.name ?? `User #${u.id}`}</td>
              <td>{u.email}</td>
              <td><span className="tw-text-xs tw-text-gray-500">{new Date(u.last_seen).toLocaleString()}</span></td>
            </tr>
          ))}
          {items.length === 0 && (
            <tr><td colSpan="3" className="tw-text-sm tw-text-gray-500">No active customers.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
