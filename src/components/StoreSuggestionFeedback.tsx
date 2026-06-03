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
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="group relative inline-flex h-9 w-9 items-center justify-center rounded-full border border-amber-200 bg-amber-50 text-amber-700 shadow-sm ring-1 ring-amber-100 transition hover:scale-105 hover:bg-amber-100 hover:text-amber-800 focus:outline-none focus:ring-2 focus:ring-amber-500 sm:h-10 sm:w-10"
        aria-label="Suggest a favorite shop"
        title="Can't find your favorite shop?? Tell us !"
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
        <span className="pointer-events-none absolute right-0 top-11 z-50 hidden w-56 rounded-md border border-gray-200 bg-white px-3 py-2 text-left text-xs font-medium leading-5 text-gray-800 shadow-lg group-hover:block sm:top-12">
          Can&apos;t find your favorite shop?? Tell us !
        </span>
      </button>

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
