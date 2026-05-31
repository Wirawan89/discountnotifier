"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

type Feedback = {
  id: number;
  senderType: string;
  name?: string | null;
  email?: string | null;
  subject: string;
  message: string;
  status: string;
  source: string;
  createdAt: string;
};

const statuses = ["all", "new", "reviewing", "resolved", "archived"];

export default function FeedbackPage() {
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [counts, setCounts] = useState<Array<{ status: string; count: number }>>([]);
  const [status, setStatus] = useState("all");
  const [loading, setLoading] = useState(true);

  const fetchFeedback = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/feedback?status=${status}`);
      if (response.ok) {
        const data = await response.json();
        setFeedback(data.feedback || []);
        setCounts(data.counts || []);
      }
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => {
    fetchFeedback();
  }, [fetchFeedback]);

  const updateStatus = async (id: number, nextStatus: string) => {
    const response = await fetch("/api/admin/feedback", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status: nextStatus }),
    });

    if (response.ok) {
      fetchFeedback();
    }
  };

  const countByStatus = useMemo(() => {
    return new Map(counts.map((item) => [item.status, item.count]));
  }, [counts]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Feedback</h1>
        <p className="mt-1 text-sm text-gray-500">
          Review feedback from users, business owners, and visitor forms.
        </p>
      </div>

      <div className="rounded-lg bg-white p-5 shadow">
        <div className="flex flex-wrap gap-2">
          {statuses.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setStatus(item)}
              className={`rounded-full px-4 py-2 text-sm font-medium ${
                status === item
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {item === "all" ? "All" : item}
              {item !== "all" && (
                <span className="ml-2 rounded-full bg-white/30 px-2 py-0.5 text-xs">
                  {countByStatus.get(item) || 0}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <section className="rounded-lg bg-white shadow">
        {loading ? (
          <div className="flex h-48 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600" />
          </div>
        ) : feedback.length === 0 ? (
          <div className="p-8 text-sm text-gray-400">
            No feedback found. The API endpoint is ready at <span className="font-mono">/api/feedback</span> for future user and business forms.
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {feedback.map((item) => (
              <article key={item.id} className="p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-semibold text-gray-900">{item.subject}</h2>
                      <span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700">
                        {item.senderType}
                      </span>
                      <span className="rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700">
                        {item.status}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-gray-500">
                      {[item.name, item.email].filter(Boolean).join(" · ") || "Anonymous"} · {new Date(item.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <select
                    value={item.status}
                    onChange={(event) => updateStatus(item.id, event.target.value)}
                    className="rounded-md border border-gray-300 px-3 py-2 text-sm"
                  >
                    <option value="new">New</option>
                    <option value="reviewing">Reviewing</option>
                    <option value="resolved">Resolved</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
                <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-gray-700">{item.message}</p>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
