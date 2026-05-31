"use client";

import { useEffect, useState } from "react";

type Category = { id: number; name: string };

type ScheduledTask = {
  id: number;
  name: string;
  taskType: string;
  frequency: "daily" | "weekly" | "monthly" | string;
  timeOfDay: string;
  dayOfWeek?: number | null;
  dayOfMonth?: number | null;
  enabled: boolean;
  deepMode: boolean;
  maxPages: number;
  categoryId?: number | null;
  category?: Category | null;
  notes?: string | null;
  lastRunAt?: string | null;
  nextRunAt?: string | null;
  lastRunStatus?: string | null;
};

const taskLabels: Record<string, string> = {
  offers_reverify: "Overnight offers:reverify",
  deep_verify: "Deep Verify",
  new_store_discovery: "New Store Discovery",
};

const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function SchedulerPage() {
  const [tasks, setTasks] = useState<ScheduledTask[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetchScheduler();
  }, []);

  const fetchScheduler = async () => {
    const response = await fetch("/api/admin/scheduler");
    if (response.ok) {
      const data = await response.json();
      setTasks(data.tasks || []);
      setCategories(data.categories || []);
    }
  };

  const updateTask = (id: number, updates: Partial<ScheduledTask>) => {
    setTasks((currentTasks) =>
      currentTasks.map((task) => (task.id === id ? { ...task, ...updates } : task))
    );
  };

  const saveTask = async (task: ScheduledTask) => {
    setSavingId(task.id);
    setMessage("");

    try {
      const response = await fetch("/api/admin/scheduler", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(task),
      });

      if (response.ok) {
        const savedTask = await response.json();
        setTasks((currentTasks) =>
          currentTasks.map((currentTask) => (currentTask.id === savedTask.id ? savedTask : currentTask))
        );
        setMessage("Scheduler settings saved.");
      } else {
        const error = await response.json();
        setMessage(error.error || "Failed to save scheduler settings.");
      }
    } finally {
      setSavingId(null);
    }
  };

  const formatDate = (value?: string | null) => {
    if (!value) return "Not scheduled";
    return new Date(value).toLocaleString();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Scheduler</h1>
        <p className="mt-1 text-sm text-gray-500">
          Configure maintenance and discovery jobs. The page stores schedules; production execution should run from a backend worker or cron.
        </p>
      </div>

      {message && (
        <div className="rounded-md border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800">
          {message}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6">
        {tasks.map((task) => (
          <section key={task.id} className="rounded-lg bg-white p-5 shadow">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  {taskLabels[task.taskType] || task.name}
                </h2>
                <p className="mt-1 text-sm text-gray-500">{task.notes}</p>
                <div className="mt-2 flex flex-wrap gap-2 text-xs">
                  <span className={`rounded-full px-3 py-1 font-medium ${task.enabled ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-700"}`}>
                    {task.enabled ? "Enabled" : "Disabled"}
                  </span>
                  <span className="rounded-full bg-indigo-50 px-3 py-1 font-medium text-indigo-700">
                    {task.deepMode ? "Deep mode" : "Fast mode"}
                  </span>
                  <span className="rounded-full bg-yellow-50 px-3 py-1 font-medium text-yellow-800">
                    Max {task.maxPages} pages
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => saveTask(task)}
                disabled={savingId === task.id}
                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-blue-700 disabled:opacity-50"
              >
                {savingId === task.id ? "Saving..." : "Save"}
              </button>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
              <label className="text-sm font-medium text-gray-700">
                Task name
                <input
                  value={task.name}
                  onChange={(event) => updateTask(task.id, { name: event.target.value })}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm"
                />
              </label>

              <label className="text-sm font-medium text-gray-700">
                Frequency
                <select
                  value={task.frequency}
                  onChange={(event) => updateTask(task.id, { frequency: event.target.value })}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm"
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </label>

              <label className="text-sm font-medium text-gray-700">
                Time
                <input
                  type="time"
                  value={task.timeOfDay}
                  onChange={(event) => updateTask(task.id, { timeOfDay: event.target.value })}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm"
                />
              </label>

              <label className="text-sm font-medium text-gray-700">
                Category
                <select
                  value={task.categoryId || ""}
                  onChange={(event) => updateTask(task.id, { categoryId: event.target.value ? Number(event.target.value) : null })}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm"
                >
                  <option value="">All categories</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </label>

              {task.frequency === "weekly" && (
                <label className="text-sm font-medium text-gray-700">
                  Day of week
                  <select
                    value={task.dayOfWeek ?? 1}
                    onChange={(event) => updateTask(task.id, { dayOfWeek: Number(event.target.value) })}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm"
                  >
                    {days.map((day, index) => (
                      <option key={day} value={index}>
                        {day}
                      </option>
                    ))}
                  </select>
                </label>
              )}

              {task.frequency === "monthly" && (
                <label className="text-sm font-medium text-gray-700">
                  Day of month
                  <input
                    type="number"
                    min={1}
                    max={28}
                    value={task.dayOfMonth ?? 1}
                    onChange={(event) => updateTask(task.id, { dayOfMonth: Number(event.target.value) })}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm"
                  />
                </label>
              )}

              <label className="text-sm font-medium text-gray-700">
                Max pages
                <input
                  type="number"
                  min={1}
                  max={24}
                  value={task.maxPages}
                  onChange={(event) => updateTask(task.id, { maxPages: Number(event.target.value) })}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm"
                />
              </label>

              <div className="flex items-end gap-4">
                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={task.enabled}
                    onChange={(event) => updateTask(task.id, { enabled: event.target.checked })}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600"
                  />
                  Enabled
                </label>
                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={task.deepMode}
                    onChange={(event) => updateTask(task.id, { deepMode: event.target.checked })}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600"
                  />
                  Deep mode
                </label>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-4 text-sm text-gray-500 md:grid-cols-3">
              <div>Next run: <span className="font-medium text-gray-700">{formatDate(task.nextRunAt)}</span></div>
              <div>Last run: <span className="font-medium text-gray-700">{formatDate(task.lastRunAt)}</span></div>
              <div>Last status: <span className="font-medium text-gray-700">{task.lastRunStatus || "No run yet"}</span></div>
            </div>
          </section>
        ))}
      </div>

      <section className="rounded-lg border border-yellow-200 bg-yellow-50 p-5">
        <h2 className="text-lg font-semibold text-yellow-900">Recommended Setup</h2>
        <div className="mt-2 space-y-2 text-sm text-yellow-800">
          <p>Run overnight offers:reverify daily in deep mode because live-verified offers expire after 2 days.</p>
          <p>Run Deep Verify weekly for high-value categories or all categories when traffic is low.</p>
          <p>Run new store discovery monthly with a token budget and a review queue before publishing new stores.</p>
        </div>
      </section>
    </div>
  );
}
