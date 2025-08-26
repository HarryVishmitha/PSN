import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";

export default function CalendarMini() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const from = new Date(); from.setDate(1);
  const to = new Date(); to.setMonth(to.getMonth()+1); to.setDate(0);

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
        const url = `/admin/api/widgets/calendar?from=${from.toISOString().slice(0,10)}&to=${to.toISOString().slice(0,10)}`;
        const { data } = await secureGet(url, { signal: ac.signal });
        setItems(data?.data?.items || []);
      } catch (e) {} finally { setLoading(false); }
    })();
    return () => ac.abort();
  }, [secureGet]);

  if (loading) return <div className="tw-h-28 tw-animate-pulse tw-bg-gray-100 dark:tw-bg-gray-800 tw-rounded-xl" />;

  return (
    <ul className="list-group">
      {items.map((ev) => (
        <li key={ev.id} className="list-group-item">
          <strong>{ev.title}</strong>
          <div className="tw-text-xs tw-text-gray-500">
            {new Date(ev.start_at).toLocaleString()}
            {ev.end_at ? ` → ${new Date(ev.end_at).toLocaleString()}` : ""}
            {ev.location ? ` • ${ev.location}` : ""}
          </div>
        </li>
      ))}
      {items.length === 0 && <li className="list-group-item">No events in this period.</li>}
    </ul>
  );
}
