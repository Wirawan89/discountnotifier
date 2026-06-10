"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";

type Category = {
  id: number;
  name: string;
};

const initialForm = {
  storeName: "",
  address: "",
  city: "",
  suburb: "",
  postcode: "",
  state: "",
  country: "Australia",
  categoryId: "",
  comment: "",
};

export default function StoreSuggestionFeedback() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [form, setForm] = useState(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const isHiddenPage = pathname.startsWith("/admin");

  useEffect(() => {
    if (isHiddenPage) return;

    fetch("/api/categories")
      .then((response) => (response.ok ? response.json() : []))
      .then((data) => setCategories(Array.isArray(data) ? data : []))
      .catch(() => setCategories([]));
  }, [isHiddenPage]);

  const selectedCategory = useMemo(
    () => categories.find((category) => String(category.id) === form.categoryId),
    [categories, form.categoryId]
  );

  const updateField = (field: keyof typeof initialForm, value: string) => {
    setForm((current) => ({
      ...current,
      [field]: field === "comment" ? value.slice(0, 300) : value,
    }));
  };

  const resetAndClose = () => {
    setIsOpen(false);
    setMessage("");
    setForm(initialForm);
  };

  const submitFeedback = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setMessage("");

    const details = [
      `Suggested Store Name: ${form.storeName.trim()}`,
      `Preferred Category: ${selectedCategory?.name || "Not selected"}`,
      `Address: ${form.address.trim()}`,
      `City/Suburb: ${[form.city.trim(), form.suburb.trim()].filter(Boolean).join(" / ")}`,
      `Postcode: ${form.postcode.trim()}`,
      `State: ${form.state.trim()}`,
      `Country: ${form.country.trim()}`,
      "",
      "Feedback / Improvement:",
      form.comment.trim() || "No additional comment.",
    ].join("\n");

    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: `Store suggestion: ${form.storeName.trim()}`,
          message: details,
          source: "store_suggestion",
          categoryId: Number(form.categoryId),
        }),
      });

      if (response.ok) {
        setMessage("Thanks, we received your suggested store.");
        setForm(initialForm);
      } else {
        const data = await response.json();
        setMessage(data.error || "Unable to submit feedback right now.");
      }
    } catch (_error) {
      setMessage("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (isHiddenPage) {
    return null;
  }

  return (
    <div className="group relative">
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="relative inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/45 bg-white/35 text-amber-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.75),0_8px_20px_rgba(245,158,11,0.16)] ring-1 ring-amber-200/40 backdrop-blur-xl transition hover:scale-105 hover:bg-white/55 hover:text-amber-800 focus:outline-none focus:ring-2 focus:ring-amber-500 sm:h-10 sm:w-10"
        aria-label="Suggest a favorite shop"
        aria-describedby="store-suggestion-help"
      >
        <svg
          className="h-[18px] w-[18px] sm:h-5 sm:w-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.8}
            d="M8.5 18.5 4 20l1.2-4.1A7.5 7.5 0 1 1 8.5 18.5Z"
          />
        </svg>
      </button>
      <span
        id="store-suggestion-help"
        role="tooltip"
        className="pointer-events-none fixed bottom-20 left-1/2 z-[90] flex w-[min(16rem,calc(100vw-2rem))] -translate-x-1/2 items-start gap-2 rounded-[22px] rounded-br-md border border-emerald-200 bg-emerald-100 px-3 py-2 text-left text-[11px] font-medium leading-snug text-gray-900 opacity-0 shadow-lg transition-opacity duration-150 before:absolute before:-bottom-1.5 before:left-1/2 before:h-4 before:w-4 before:-translate-x-1/2 before:rotate-45 before:border-b before:border-r before:border-emerald-200 before:bg-emerald-100 group-hover:opacity-100 group-focus-within:opacity-100 group-active:opacity-100 sm:absolute sm:bottom-auto sm:left-auto sm:right-0 sm:top-12 sm:w-64 sm:translate-x-0 sm:before:-top-1.5 sm:before:bottom-auto sm:before:left-auto sm:before:right-3 sm:before:translate-x-0 sm:before:border-b-0 sm:before:border-r-0 sm:before:border-l sm:before:border-t"
      >
        <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-300 text-[11px] leading-none text-emerald-950">
          💬
        </span>
        <span>Can&apos;t find your favorite store? Click here.</span>
      </span>

      {isOpen && (
        <div
          className="fixed inset-0 z-[80] flex items-start justify-center bg-black/40 px-4 py-6 sm:items-center"
          onClick={resetAndClose}
        >
          <div
            className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 border-b border-gray-200 p-5">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Can&apos;t find your favorite shop?</h2>
                <p className="mt-1 text-sm text-gray-500">Tell us and we will review it for future store discovery.</p>
              </div>
              <button
                type="button"
                onClick={resetAndClose}
                className="rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                aria-label="Close feedback form"
              >
                x
              </button>
            </div>

            <form onSubmit={submitFeedback} className="space-y-4 p-5">
              <label className="block text-sm font-medium text-gray-700">
                Suggested Store Name
                <input
                  value={form.storeName}
                  onChange={(event) => updateField("storeName", event.target.value)}
                  required
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  placeholder="e.g. Your favourite cafe, shop, restaurant"
                />
              </label>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-sm font-medium text-gray-700 sm:col-span-2">
                  Address
                  <input
                    value={form.address}
                    onChange={(event) => updateField("address", event.target.value)}
                    required
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    placeholder="Street address"
                  />
                </label>

                <label className="block text-sm font-medium text-gray-700">
                  City
                  <input
                    value={form.city}
                    onChange={(event) => updateField("city", event.target.value)}
                    required
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </label>

                <label className="block text-sm font-medium text-gray-700">
                  Suburb
                  <input
                    value={form.suburb}
                    onChange={(event) => updateField("suburb", event.target.value)}
                    required
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </label>

                <label className="block text-sm font-medium text-gray-700">
                  Post Code
                  <input
                    value={form.postcode}
                    onChange={(event) => updateField("postcode", event.target.value)}
                    required
                    inputMode="numeric"
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </label>

                <label className="block text-sm font-medium text-gray-700">
                  State
                  <input
                    value={form.state}
                    onChange={(event) => updateField("state", event.target.value)}
                    required
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    placeholder="NSW"
                  />
                </label>

                <label className="block text-sm font-medium text-gray-700">
                  Country
                  <input
                    value={form.country}
                    onChange={(event) => updateField("country", event.target.value)}
                    required
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </label>

                <label className="block text-sm font-medium text-gray-700">
                  Preferred Category
                  <select
                    value={form.categoryId}
                    onChange={(event) => updateField("categoryId", event.target.value)}
                    required
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  >
                    <option value="">Select one category</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <label className="block text-sm font-medium text-gray-700">
                Feedback / Improvement
                <textarea
                  value={form.comment}
                  onChange={(event) => updateField("comment", event.target.value)}
                  maxLength={300}
                  rows={4}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  placeholder="Anything helpful, such as website, opening hours, or why we should add it."
                />
                <span className="mt-1 block text-xs text-gray-500">{form.comment.length}/300 characters</span>
              </label>

              {message && (
                <div className="rounded-md border border-blue-100 bg-blue-50 px-3 py-2 text-sm text-blue-800">
                  {message}
                </div>
              )}

              <div className="flex flex-col-reverse gap-3 border-t border-gray-100 pt-4 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={resetAndClose}
                  className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {submitting ? "Submitting..." : "Submit"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
