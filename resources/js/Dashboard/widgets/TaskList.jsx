import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";

export default function TaskList() {
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
        const { data } = await secureGet(`/admin/api/widgets/tasks?mine=1&limit=10`, { signal: ac.signal });
        setItems(data?.data?.items || []);
      } catch (e) {} finally { setLoading(false); }
    })();
    return () => ac.abort();
  }, [secureGet]);

  if (loading) return <div className="tw-h-28 tw-animate-pulse tw-bg-gray-100 dark:tw-bg-gray-800 tw-rounded-xl" />;

  return (
    <ul className="list-group">
      {items.map((t) => (
        <li key={t.id} className="list-group-item d-flex justify-content-between align-items-center">
          <span>{t.title}</span>
          <span className={`badge ${t.status === 'completed' ? 'bg-success' : 'bg-secondary'}`}>{t.status}</span>
        </li>
      ))}
      {items.length === 0 && <li className="list-group-item">No tasks found.</li>}
    </ul>
  );
}
