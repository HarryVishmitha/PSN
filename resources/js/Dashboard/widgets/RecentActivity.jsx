import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";

export default function RecentActivity() {
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
        const { data } = await secureGet(`/admin/api/widgets/recent-activity?limit=20`, { signal: ac.signal });
        setItems(data?.data?.items || []);
      } catch (e) {} finally { setLoading(false); }
    })();
    return () => ac.abort();
  }, [secureGet]);

  if (loading) return <div className="tw-h-32 tw-animate-pulse tw-bg-gray-100 dark:tw-bg-gray-800 tw-rounded-xl" />;

  return (
    <ul className="list-group">
      {items.map((i) => (
        <li key={i.id} className="list-group-item d-flex justify-content-between align-items-center">
          <span className="tw-truncate">
            <strong>User #{i.user_id}</strong> — {i.action}
          </span>
          <span className="tw-text-xs tw-text-gray-500">{new Date(i.created_at).toLocaleString()}</span>
        </li>
      ))}
      {items.length === 0 && <li className="list-group-item">No recent activity.</li>}
    </ul>
  );
}
