"use client";

import { useEffect, useState } from "react";

type Category = { id: number; name: string };

type ScheduledTask = {
  id: number;
  name: string;
  taskType: string;
  frequency: "daily" | "weekly" | "monthly" | "quarterly" | string;
  timeOfDay: string;
  dayOfWeek?: number | null;
  dayOfMonth?: number | null;
  enabled: boolean;
  deepMode: boolean;
  maxPages: number;
  categoryId?: number | null;
  categoryIds?: number[];
  category?: Category | null;
  notes?: string | null;
  lastRunAt?: string | null;
  nextRunAt?: string | null;
  lastRunStatus?: string | null;
  lastRunMessage?: string | null;
};

type CronStatus = {
  installed: boolean;
  line?: string | null;
  defaultIntervalMinutes?: number;
};

const taskLabels: Record<string, string> = {
  offers_reverify: "Offers Reverify",
  deep_verify: "Deep Verify",
  new_store_discovery: "New Store Discovery",
  location_enrichment: "Location Enrichment",
  regional_seed: "Regional Seed",
};

const taskTypes = [
  { value: "offers_reverify", label: "Offers Reverify" },
  { value: "deep_verify", label: "Deep Verify" },
  { value: "location_enrichment", label: "Location Enrichment" },
  { value: "regional_seed", label: "Regional Seed" },
  { value: "new_store_discovery", label: "New Store Discovery" },
];

const regionalSeedCategories = [
  {
    name: "Dining & Beverages",
    regions: ["NSW", "VIC", "QLD", "WA", "SA", "TAS", "ACT", "NT"],
  },
  {
    name: "Food & Groceries",
    regions: ["NSW"],
  },
];

const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function blankTask(name: string): ScheduledTask {
  return {
    id: 0,
    name,
    taskType: "deep_verify",
    frequency: "monthly",
    timeOfDay: "03:00",
    dayOfMonth: 1,
    enabled: false,
    deepMode: true,
    maxPages: 12,
    categoryIds: [],
    notes: "",
  };
}

export default function SchedulerPage() {
  const [tasks, setTasks] = useState<ScheduledTask[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [editingId, setEditingId] = useState<number | "new" | null>(null);
  const [draftTask, setDraftTask] = useState<ScheduledTask | null>(null);
  const [savingId, setSavingId] = useState<number | "new" | null>(null);
  const [runningId, setRunningId] = useState<number | null>(null);
  const [cronStatus, setCronStatus] = useState<CronStatus | null>(null);
  const [cronInterval, setCronInterval] = useState(15);
  const [cronSaving, setCronSaving] = useState(false);
  const [regionalSeedCategory, setRegionalSeedCategory] = useState(regionalSeedCategories[0].name);
  const [regionalSeedRegions, setRegionalSeedRegions] = useState<string[]>([]);
  const [regionalSeedRunning, setRegionalSeedRunning] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetchScheduler();
    fetchCronStatus();
  }, []);

  const fetchScheduler = async () => {
    const response = await fetch("/api/admin/scheduler");
    if (response.ok) {
      const data = await response.json();
      setTasks(data.tasks || []);
      setCategories(data.categories || []);
    }
  };

  const fetchCronStatus = async () => {
    const response = await fetch("/api/admin/cron");
    if (response.ok) {
      const data = await response.json();
      setCronStatus(data);
      setCronInterval(data.defaultIntervalMinutes || 15);
    }
  };

  const selectedCategoryIds = (task: ScheduledTask) =>
    task.categoryIds && task.categoryIds.length > 0
      ? task.categoryIds
      : task.categoryId
        ? [task.categoryId]
        : [];

  const categorySummary = (task: ScheduledTask) => {
    const ids = selectedCategoryIds(task);
    if (ids.length === 0) return "All categories";
    if (ids.length === 1) return categories.find((category) => category.id === ids[0])?.name || "1 category";
    return `${ids.length} categories`;
  };

  const formatDate = (value?: string | null) => {
    if (!value) return "Not scheduled";
    return new Date(value).toLocaleString();
  };

  const startEdit = (task: ScheduledTask) => {
    setEditingId(task.id);
    setDraftTask({ ...task, categoryIds: selectedCategoryIds(task) });
    setMessage("");
  };

  const startCreate = () => {
    const usedNumbers = new Set(
      tasks
        .filter((task) => task.taskType === "deep_verify")
        .map((task) => Number(task.name.match(/^Deep Verify - (\d+)$/)?.[1]))
        .filter(Boolean)
    );
    let nextNumber = 1;
    while (usedNumbers.has(nextNumber)) nextNumber++;

    setEditingId("new");
    setDraftTask(blankTask(`Deep Verify - ${nextNumber}`));
    setMessage("");
  };

  const duplicateTask = (task: ScheduledTask) => {
    setEditingId("new");
    setDraftTask({
      ...task,
      id: 0,
      name: `${task.name} Copy`,
      enabled: false,
      categoryIds: selectedCategoryIds(task),
      nextRunAt: null,
      lastRunAt: null,
      lastRunStatus: null,
      lastRunMessage: null,
    });
    setMessage("");
  };

  const updateDraft = (updates: Partial<ScheduledTask>) => {
    setDraftTask((current) => (current ? { ...current, ...updates } : current));
  };

  const updateDraftCategoryIds = (categoryId: number, checked: boolean) => {
    if (!draftTask) return;

    const currentCategoryIds = selectedCategoryIds(draftTask);
    const nextCategoryIds = checked
      ? Array.from(new Set([...currentCategoryIds, categoryId]))
      : currentCategoryIds.filter((currentCategoryId) => currentCategoryId !== categoryId);

    updateDraft({
      categoryIds: nextCategoryIds,
      categoryId: nextCategoryIds.length === 1 ? nextCategoryIds[0] : null,
    });
  };

  const saveDraft = async () => {
    if (!draftTask) return;

    setSavingId(editingId);
    setMessage("");

    try {
      const isNew = editingId === "new";
      const response = await fetch("/api/admin/scheduler", {
        method: isNew ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draftTask),
      });
      const data = await response.json();

      if (response.ok) {
        setMessage(isNew ? "Scheduler entry created." : "Scheduler settings saved.");
        setEditingId(null);
        setDraftTask(null);
        await fetchScheduler();
      } else {
        setMessage(data.error || "Failed to save scheduler settings.");
      }
    } finally {
      setSavingId(null);
    }
  };

  const deleteTask = async (task: ScheduledTask) => {
    if (!window.confirm(`Delete ${task.name}?`)) return;

    setSavingId(task.id);
    setMessage("");

    try {
      const response = await fetch(`/api/admin/scheduler?id=${task.id}`, {
        method: "DELETE",
      });
      const data = await response.json();

      if (response.ok) {
        setMessage("Scheduler entry deleted.");
        await fetchScheduler();
      } else {
        setMessage(data.error || "Failed to delete scheduler entry.");
      }
    } finally {
      setSavingId(null);
    }
  };

  const runLocationEnrichment = async (task: ScheduledTask) => {
    setRunningId(task.id);
    setMessage("");

    try {
      const response = await fetch("/api/admin/location-enrichment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskId: task.id }),
      });
      const data = await response.json();

      if (response.ok) {
        setMessage(`${data.message} PID: ${data.pid}.`);
        await fetchScheduler();
      } else {
        setMessage(data.error || "Failed to start location enrichment.");
      }
    } finally {
      setRunningId(null);
    }
  };

  const installCron = async () => {
    setCronSaving(true);
    setMessage("");

    try {
      const response = await fetch("/api/admin/cron", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ intervalMinutes: cronInterval }),
      });
      const data = await response.json();

      if (response.ok) {
        setCronStatus(data);
        setMessage("Cron runner installed or updated.");
      } else {
        setMessage(data.error || "Failed to install cron runner.");
      }
    } finally {
      setCronSaving(false);
    }
  };

  const removeCron = async () => {
    setCronSaving(true);
    setMessage("");

    try {
      const response = await fetch("/api/admin/cron", { method: "DELETE" });
      const data = await response.json();

      if (response.ok) {
        setCronStatus(data);
        setMessage("Cron runner removed.");
      } else {
        setMessage(data.error || "Failed to remove cron runner.");
      }
    } finally {
      setCronSaving(false);
    }
  };

  const selectedRegionalSeedConfig =
    regionalSeedCategories.find((category) => category.name === regionalSeedCategory) || regionalSeedCategories[0];

  const toggleRegionalSeedRegion = (region: string, checked: boolean) => {
    setRegionalSeedRegions((current) =>
      checked ? Array.from(new Set([...current, region])) : current.filter((currentRegion) => currentRegion !== region)
    );
  };

  const updateRegionalSeedCategory = (categoryName: string) => {
    const nextConfig = regionalSeedCategories.find((category) => category.name === categoryName) || regionalSeedCategories[0];
    setRegionalSeedCategory(nextConfig.name);
    setRegionalSeedRegions((current) => current.filter((region) => nextConfig.regions.includes(region)));
  };

  const runRegionalSeed = async () => {
    setRegionalSeedRunning(true);
    setMessage("");

    try {
      const response = await fetch("/api/admin/regional-seed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          categoryName: regionalSeedCategory,
          regions: regionalSeedRegions,
        }),
      });
      const data = await response.json();

      if (response.ok) {
        setMessage(`${data.message} PID: ${data.pid}. Log: ${data.logPath}`);
      } else {
        setMessage(data.error || "Failed to start regional seed.");
      }
    } finally {
      setRegionalSeedRunning(false);
    }
  };

  const renderEditor = () => {
    if (!draftTask) return null;
    const ids = selectedCategoryIds(draftTask);

    return (
      <section className="rounded-lg border border-blue-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              {editingId === "new" ? "Add Scheduler" : "Edit Scheduler"}
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Create multiple entries for different category groups and frequencies.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                setEditingId(null);
                setDraftTask(null);
              }}
              className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={saveDraft}
              disabled={savingId === editingId}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-blue-700 disabled:opacity-50"
            >
              {savingId === editingId ? "Saving..." : "Save"}
            </button>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <label className="text-sm font-medium text-gray-700">
            Task name
            <input
              value={draftTask.name}
              onChange={(event) => updateDraft({ name: event.target.value })}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm"
            />
          </label>

          <label className="text-sm font-medium text-gray-700">
            Task type
            <select
              value={draftTask.taskType}
              onChange={(event) => updateDraft({ taskType: event.target.value })}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm"
            >
              {taskTypes.map((taskType) => (
                <option key={taskType.value} value={taskType.value}>
                  {taskType.label}
                </option>
              ))}
            </select>
          </label>

          <label className="text-sm font-medium text-gray-700">
            Frequency
            <select
              value={draftTask.frequency}
              onChange={(event) => updateDraft({ frequency: event.target.value })}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm"
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="quarterly">Quarterly</option>
            </select>
          </label>

          <label className="text-sm font-medium text-gray-700">
            Time
            <input
              type="time"
              value={draftTask.timeOfDay}
              onChange={(event) => updateDraft({ timeOfDay: event.target.value })}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm"
            />
          </label>

          {draftTask.frequency === "weekly" && (
            <label className="text-sm font-medium text-gray-700">
              Day of week
              <select
                value={draftTask.dayOfWeek ?? 1}
                onChange={(event) => updateDraft({ dayOfWeek: Number(event.target.value) })}
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

          {(draftTask.frequency === "monthly" || draftTask.frequency === "quarterly") && (
            <label className="text-sm font-medium text-gray-700">
              Day of month
              <input
                type="number"
                min={1}
                max={28}
                value={draftTask.dayOfMonth ?? 1}
                onChange={(event) => updateDraft({ dayOfMonth: Number(event.target.value) })}
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
              value={draftTask.maxPages}
              onChange={(event) => updateDraft({ maxPages: Number(event.target.value) })}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm"
            />
          </label>

          <div className="flex items-end gap-4">
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={draftTask.enabled}
                onChange={(event) => updateDraft({ enabled: event.target.checked })}
                className="h-4 w-4 rounded border-gray-300 text-blue-600"
              />
              Enabled
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={draftTask.deepMode}
                onChange={(event) => updateDraft({ deepMode: event.target.checked })}
                className="h-4 w-4 rounded border-gray-300 text-blue-600"
              />
              Deep mode
            </label>
          </div>

          <label className="text-sm font-medium text-gray-700 md:col-span-2 lg:col-span-4">
            Notes
            <input
              value={draftTask.notes || ""}
              onChange={(event) => updateDraft({ notes: event.target.value })}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm"
            />
          </label>

          <div className="text-sm font-medium text-gray-700 md:col-span-2 lg:col-span-4">
            Categories
            <div className="mt-1 max-h-48 overflow-y-auto rounded-md border border-gray-300 bg-white p-3 shadow-sm">
              <label className="mb-2 flex items-center gap-2 text-sm font-normal text-gray-700">
                <input
                  type="checkbox"
                  checked={ids.length === 0}
                  onChange={() => updateDraft({ categoryIds: [], categoryId: null })}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600"
                />
                All categories
              </label>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {categories.map((category) => (
                  <label key={category.id} className="flex items-center gap-2 text-sm font-normal text-gray-700">
                    <input
                      type="checkbox"
                      checked={ids.includes(category.id)}
                      onChange={(event) => updateDraftCategoryIds(category.id, event.target.checked)}
                      className="h-4 w-4 rounded border-gray-300 text-blue-600"
                    />
                    {category.name}
                  </label>
                ))}
              </div>
            </div>
            <p className="mt-1 text-xs font-normal text-gray-500">
              Leave all unchecked to target every category.
            </p>
          </div>
        </div>
      </section>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Scheduler</h1>
          <p className="mt-1 text-sm text-gray-500">
            Create focused maintenance schedules by task type, frequency, and category group.
          </p>
        </div>
        <button
          type="button"
          onClick={startCreate}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-blue-700"
        >
          + Add Scheduler
        </button>
      </div>

      {message && (
        <div className="rounded-md border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800">
          {message}
        </div>
      )}

      {renderEditor()}

      <section className="rounded-lg bg-white p-5 shadow">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Cron Runner</h2>
            <p className="mt-1 text-sm text-gray-500">
              Installs one local cron entry that checks enabled scheduler rows and runs due tasks.
            </p>
            <div className="mt-2 text-sm">
              <span className={`rounded-full px-3 py-1 text-xs font-medium ${cronStatus?.installed ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-700"}`}>
                {cronStatus?.installed ? "Installed" : "Not installed"}
              </span>
            </div>
            {cronStatus?.line && (
              <code className="mt-3 block break-all rounded-md bg-gray-50 p-3 text-xs text-gray-700">
                {cronStatus.line}
              </code>
            )}
            <div className="mt-4 rounded-md border border-gray-200 bg-gray-50 p-3 text-xs text-gray-600">
              <div className="font-semibold text-gray-800">Terminal commands</div>
              <div className="mt-2 space-y-1">
                <div><code>crontab -l</code> shows installed cron jobs.</div>
                <div><code>npm run setup:cron</code> prints the default cron lines.</div>
                <div><code>npm run admin:run-due</code> manually runs due scheduler tasks.</div>
                <div><code>crontab -e</code> lets you manually remove the DiscountNotifier marked block.</div>
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <label className="text-sm font-medium text-gray-700">
              Check every
              <select
                value={cronInterval}
                onChange={(event) => setCronInterval(Number(event.target.value))}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm"
              >
                <option value={5}>5 minutes</option>
                <option value={10}>10 minutes</option>
                <option value={15}>15 minutes</option>
                <option value={30}>30 minutes</option>
                <option value={60}>60 minutes</option>
              </select>
            </label>
            <button
              type="button"
              onClick={installCron}
              disabled={cronSaving}
              className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-emerald-700 disabled:opacity-50"
            >
              {cronSaving ? "Saving..." : cronStatus?.installed ? "Update Cron" : "Start Cron"}
            </button>
            {cronStatus?.installed && (
              <button
                type="button"
                onClick={removeCron}
                disabled={cronSaving}
                className="rounded-md border border-red-200 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
              >
                Stop Cron
              </button>
            )}
          </div>
        </div>
      </section>

      <section className="rounded-lg bg-white p-5 shadow">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Regional Seed Runner</h2>
            <p className="mt-1 text-sm text-gray-500">
              Manually seed all available regions or selected regions for supported categories.
            </p>
            <div className="mt-4 rounded-md border border-gray-200 bg-gray-50 p-3 text-xs text-gray-600">
              <div className="font-semibold text-gray-800">Command equivalent</div>
              <div className="mt-2">
                <code>npx tsx scripts/run-regional-seed.ts --category=&quot;{regionalSeedCategory}&quot;</code>
              </div>
            </div>
          </div>
          <div className="w-full space-y-4 lg:max-w-xl">
            <label className="block text-sm font-medium text-gray-700">
              Category
              <select
                value={regionalSeedCategory}
                onChange={(event) => updateRegionalSeedCategory(event.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm"
              >
                {regionalSeedCategories.map((category) => (
                  <option key={category.name} value={category.name}>
                    {category.name}
                  </option>
                ))}
              </select>
            </label>

            <div className="text-sm font-medium text-gray-700">
              Regions
              <div className="mt-1 rounded-md border border-gray-300 bg-white p-3 shadow-sm">
                <label className="mb-2 flex items-center gap-2 text-sm font-normal text-gray-700">
                  <input
                    type="checkbox"
                    checked={regionalSeedRegions.length === 0}
                    onChange={() => setRegionalSeedRegions([])}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600"
                  />
                  All available regions
                </label>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {selectedRegionalSeedConfig.regions.map((region) => (
                    <label key={region} className="flex items-center gap-2 text-sm font-normal text-gray-700">
                      <input
                        type="checkbox"
                        checked={regionalSeedRegions.includes(region)}
                        onChange={(event) => toggleRegionalSeedRegion(region, event.target.checked)}
                        className="h-4 w-4 rounded border-gray-300 text-blue-600"
                      />
                      {region}
                    </label>
                  ))}
                </div>
              </div>
              <p className="mt-1 text-xs font-normal text-gray-500">
                Leave all unchecked to run every script currently available for the category.
              </p>
            </div>

            <button
              type="button"
              onClick={runRegionalSeed}
              disabled={regionalSeedRunning}
              className="rounded-md bg-purple-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-purple-700 disabled:opacity-50"
            >
              {regionalSeedRunning ? "Starting..." : "Run Regional Seed"}
            </button>
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-lg bg-white shadow">
        <div className="grid grid-cols-12 gap-3 border-b bg-gray-50 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
          <div className="col-span-4">Schedule</div>
          <div className="col-span-2">Frequency</div>
          <div className="col-span-2">Categories</div>
          <div className="col-span-2">Next run</div>
          <div className="col-span-2 text-right">Actions</div>
        </div>

        <div className="divide-y divide-gray-100">
          {tasks.map((task) => (
            <div key={task.id} className="grid grid-cols-1 gap-3 px-4 py-4 text-sm md:grid-cols-12 md:items-center">
              <div className="md:col-span-4">
                <div className="font-semibold text-gray-900">{task.name}</div>
                <div className="mt-1 flex flex-wrap gap-2 text-xs">
                  <span className="rounded-full bg-gray-100 px-2 py-1 text-gray-700">
                    {taskLabels[task.taskType] || task.taskType}
                  </span>
                  <span className={`rounded-full px-2 py-1 ${task.enabled ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"}`}>
                    {task.enabled ? "Enabled" : "Disabled"}
                  </span>
                  <span className="rounded-full bg-indigo-50 px-2 py-1 text-indigo-700">
                    {task.deepMode ? "Deep" : "Fast"}
                  </span>
                  <span className="rounded-full bg-yellow-50 px-2 py-1 text-yellow-800">
                    {task.maxPages} pages
                  </span>
                </div>
              </div>
              <div className="text-gray-700 md:col-span-2">
                <div className="capitalize">{task.frequency}</div>
                <div className="text-xs text-gray-500">{task.timeOfDay}</div>
              </div>
              <div className="text-gray-700 md:col-span-2">{categorySummary(task)}</div>
              <div className="text-gray-700 md:col-span-2">
                <div>{formatDate(task.nextRunAt)}</div>
                <div className="text-xs text-gray-500">Last: {task.lastRunStatus || "No run yet"}</div>
              </div>
              <div className="flex flex-wrap justify-start gap-2 md:col-span-2 md:justify-end">
                {task.taskType === "location_enrichment" && (
                  <button
                    type="button"
                    onClick={() => runLocationEnrichment(task)}
                    disabled={runningId === task.id}
                    className="rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
                  >
                    {runningId === task.id ? "Starting" : "Run"}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => startEdit(task)}
                  className="rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => duplicateTask(task)}
                  className="rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                >
                  Duplicate
                </button>
                <button
                  type="button"
                  onClick={() => deleteTask(task)}
                  disabled={savingId === task.id}
                  className="rounded-md border border-red-200 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-lg border border-yellow-200 bg-yellow-50 p-5">
        <h2 className="text-lg font-semibold text-yellow-900">Recommended Setup</h2>
        <div className="mt-2 space-y-2 text-sm text-yellow-800">
          <p>Create separate schedules for different category groups, for example daily dining, monthly retail, and quarterly luxury.</p>
          <p>Run Deep Verify or Location Enrichment overnight for selected categories to keep the page responsive.</p>
          <p>For cron execution, run <code className="rounded bg-yellow-100 px-1">npm run admin:run-due</code> from the project folder.</p>
        </div>
      </section>
    </div>
  );
}
