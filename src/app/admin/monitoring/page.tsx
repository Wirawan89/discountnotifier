"use client";

import { useEffect, useMemo, useState } from "react";

type MonitoringData = {
  range: string;
  summary: {
    totalUsers: number;
    totalBusinesses: number;
    totalStores: number;
    activeDiscounts: number;
    totalAccess: number;
    averageDailyVisits: number;
  };
  favoriteCategories: Array<{ categoryId: number; category: string; members: number }>;
  categoryVisits: Array<{ categoryId: number; category: string; visits: number }>;
  storeVisits: Array<{ storeId: number; store: string; suburb: string; city: string; category: string; visits: number }>;
  categoryTrend: Array<{ bucket: string; categories: Array<{ category: string; count: number }> }>;
  businessPromotionUsage: {
    created: number;
    updated: number;
    totalActivity: number;
  };
};

const rangeOptions = [
  { value: "day", label: "Daily" },
  { value: "week", label: "Weekly" },
  { value: "month", label: "Monthly" },
  { value: "year", label: "Yearly" },
];

function Bar({ value, max }: { value: number; max: number }) {
  const width = max > 0 ? Math.max(4, Math.round((value / max) * 100)) : 0;
  return (
    <div className="h-2 rounded bg-gray-100">
      <div className="h-2 rounded bg-blue-600" style={{ width: `${width}%` }} />
    </div>
  );
}

export default function MonitoringPage() {
  const [range, setRange] = useState("month");
  const [data, setData] = useState<MonitoringData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/admin/monitoring?range=${range}`);
        if (response.ok) {
          setData(await response.json());
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [range]);

  const maxFavorite = useMemo(
    () => Math.max(0, ...(data?.favoriteCategories.map((item) => item.members) || [])),
    [data]
  );
  const maxCategoryVisits = useMemo(
    () => Math.max(0, ...(data?.categoryVisits.map((item) => item.visits) || [])),
    [data]
  );
  const maxStoreVisits = useMemo(
    () => Math.max(0, ...(data?.storeVisits.map((item) => item.visits) || [])),
    [data]
  );

  if (loading && !data) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Monitoring & Statistics</h1>
          <p className="mt-1 text-sm text-gray-500">
            Track member interest, store visits, category trends, and business promotion activity.
          </p>
        </div>
        <label className="text-sm font-medium text-gray-700">
          Reporting view
          <select
            value={range}
            onChange={(event) => setRange(event.target.value)}
            className="mt-1 block rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
          >
            {rangeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {data && (
        <>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3 lg:grid-cols-6">
            {[
              ["Users", data.summary.totalUsers],
              ["Business Users", data.summary.totalBusinesses],
              ["Stores", data.summary.totalStores],
              ["Active Offers", data.summary.activeDiscounts],
              ["Visits", data.summary.totalAccess],
              ["Avg Daily", data.summary.averageDailyVisits],
            ].map(([label, value]) => (
              <div key={label} className="rounded-lg bg-white p-4 shadow">
                <div className="text-sm text-gray-500">{label}</div>
                <div className="mt-2 text-2xl font-semibold text-gray-900">{value}</div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <section className="rounded-lg bg-white p-5 shadow">
              <h2 className="text-lg font-semibold text-gray-900">Favourite Categories</h2>
              <p className="text-sm text-gray-500">Member preference selections from registration/profile.</p>
              <div className="mt-4 space-y-3">
                {data.favoriteCategories.length === 0 ? (
                  <p className="text-sm text-gray-400">No favourite category data yet.</p>
                ) : (
                  data.favoriteCategories.map((item) => (
                    <div key={item.categoryId}>
                      <div className="mb-1 flex justify-between text-sm">
                        <span className="font-medium text-gray-700">{item.category}</span>
                        <span className="text-gray-500">{item.members}</span>
                      </div>
                      <Bar value={item.members} max={maxFavorite} />
                    </div>
                  ))
                )}
              </div>
            </section>

            <section className="rounded-lg bg-white p-5 shadow">
              <h2 className="text-lg font-semibold text-gray-900">Category Visits</h2>
              <p className="text-sm text-gray-500">Visits from members clicking categories.</p>
              <div className="mt-4 space-y-3">
                {data.categoryVisits.length === 0 ? (
                  <p className="text-sm text-gray-400">Category visits will appear after members browse categories.</p>
                ) : (
                  data.categoryVisits.slice(0, 12).map((item) => (
                    <div key={item.categoryId}>
                      <div className="mb-1 flex justify-between text-sm">
                        <span className="font-medium text-gray-700">{item.category}</span>
                        <span className="text-gray-500">{item.visits}</span>
                      </div>
                      <Bar value={item.visits} max={maxCategoryVisits} />
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>

          <section className="rounded-lg bg-white p-5 shadow">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Store Visit Statistics</h2>
                <p className="text-sm text-gray-500">Daily, monthly, or yearly store visit ranking across all categories.</p>
              </div>
              <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
                Store click tracking enabled now
              </span>
            </div>
            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Store</th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Category</th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Location</th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Visits</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {data.storeVisits.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-6 text-sm text-gray-400">
                        Store visit data will appear after members click Visit Store.
                      </td>
                    </tr>
                  ) : (
                    data.storeVisits.map((item) => (
                      <tr key={`${item.storeId}-${item.store}`}>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">{item.store}</td>
                        <td className="px-4 py-3 text-sm text-gray-500">{item.category}</td>
                        <td className="px-4 py-3 text-sm text-gray-500">{[item.suburb, item.city].filter(Boolean).join(", ")}</td>
                        <td className="px-4 py-3 text-sm text-gray-700">
                          <div className="flex items-center gap-3">
                            <span className="w-10 font-medium">{item.visits}</span>
                            <div className="min-w-28 flex-1">
                              <Bar value={item.visits} max={maxStoreVisits} />
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <section className="rounded-lg bg-white p-5 shadow lg:col-span-2">
              <h2 className="text-lg font-semibold text-gray-900">Category Trend</h2>
              <p className="text-sm text-gray-500">Top category visits by reporting bucket.</p>
              <div className="mt-4 space-y-4">
                {data.categoryTrend.length === 0 ? (
                  <p className="text-sm text-gray-400">Trend data will appear as members browse.</p>
                ) : (
                  data.categoryTrend.slice(-12).map((bucket) => (
                    <div key={bucket.bucket} className="rounded-md border border-gray-200 p-3">
                      <div className="mb-2 text-sm font-semibold text-gray-800">{bucket.bucket}</div>
                      <div className="flex flex-wrap gap-2">
                        {bucket.categories.map((item) => (
                          <span key={`${bucket.bucket}-${item.category}`} className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-700">
                            {item.category}: {item.count}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>

            <section className="rounded-lg bg-white p-5 shadow">
              <h2 className="text-lg font-semibold text-gray-900">Business Promotion Usage</h2>
              <p className="text-sm text-gray-500">Promotion feature create/update activity.</p>
              <div className="mt-5 space-y-4">
                <div className="rounded-md bg-green-50 p-4">
                  <div className="text-sm text-green-700">New promotions</div>
                  <div className="mt-1 text-3xl font-semibold text-green-900">{data.businessPromotionUsage.created}</div>
                </div>
                <div className="rounded-md bg-indigo-50 p-4">
                  <div className="text-sm text-indigo-700">Promotion updates</div>
                  <div className="mt-1 text-3xl font-semibold text-indigo-900">{data.businessPromotionUsage.updated}</div>
                </div>
                <div className="rounded-md bg-gray-50 p-4">
                  <div className="text-sm text-gray-600">Total activity</div>
                  <div className="mt-1 text-3xl font-semibold text-gray-900">{data.businessPromotionUsage.totalActivity}</div>
                </div>
              </div>
            </section>
          </div>
        </>
      )}
    </div>
  );
}
