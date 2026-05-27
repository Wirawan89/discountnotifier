"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Category {
  id: number;
  name: string;
}

interface UserPreference {
  id: number;
  userId: number;
  emailNotifications: boolean;
  pushNotifications: boolean;
  favoriteCategories: number[];
  favoriteSuburbs: string[];
  notificationFrequency: string;
}

interface BusinessPreference {
  id: number;
  storeId: number | null;
  businessName: string;
  url: string;
  category: Category;
  promotionMessage: string;
  promotionStartDate: string;
  promotionEndDate: string;
  showcaseImages: string[];
  aiImageTextEnabled: boolean;
  aiImageTextPrompt: string;
  membershipType: string;
  status: string;
}

const emptyImageSlots = Array.from({ length: 6 });
const MAX_PROMOTION_MESSAGE_LENGTH = 96;
const MAX_IMAGE_DIMENSION = 900;
const IMAGE_QUALITY = 0.68;
const inputClassName =
  "mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-500 focus:border-green-500 focus:outline-none focus:ring-green-500";

function compressImage(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      const image = new Image();

      image.onload = () => {
        const scale = Math.min(
          1,
          MAX_IMAGE_DIMENSION / Math.max(image.width, image.height)
        );
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(image.width * scale));
        canvas.height = Math.max(1, Math.round(image.height * scale));

        const context = canvas.getContext("2d");
        if (!context) {
          reject(new Error("Image could not be processed"));
          return;
        }

        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", IMAGE_QUALITY));
      };

      image.onerror = () => reject(new Error("Image could not be loaded"));
      image.src = String(reader.result);
    };

    reader.onerror = () => reject(new Error("Image could not be read"));
    reader.readAsDataURL(file);
  });
}

export default function PreferencesPage() {
  const { status } = useSession();
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [preferences, setPreferences] = useState<UserPreference | null>(null);
  const [businessPreferences, setBusinessPreferences] = useState<BusinessPreference | null>(null);
  const [accountMode, setAccountMode] = useState<"user" | "business">("user");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (status === "loading") return;

    if (status === "unauthenticated") {
      router.push("/auth/signin");
      return;
    }

    loadPreferences();
  }, [status, router]);

  const fetchCategories = async () => {
    try {
      const response = await fetch("/api/categories");
      if (response.ok) {
        const data = await response.json();
        setCategories(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const fetchUserPreferences = async () => {
    const response = await fetch("/api/preferences");
    if (response.ok) {
      const data = await response.json();
      setPreferences(data);
      setAccountMode("user");
    }
  };

  const loadPreferences = async () => {
    setLoading(true);
    setMessage("");

    try {
      await fetchCategories();

      const businessResponse = await fetch("/api/business/preferences");
      if (businessResponse.ok) {
        const data = await businessResponse.json();
        setBusinessPreferences(data);
        setAccountMode("business");
        return;
      }

      await fetchUserPreferences();
    } catch (error) {
      console.error("Error fetching preferences:", error);
      setMessage("Failed to load preferences. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const savePreferences = async () => {
    if (!preferences) return;

    setSaving(true);
    setMessage("");

    try {
      const response = await fetch("/api/preferences", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(preferences),
      });

      if (response.ok) {
        setMessage("Preferences saved successfully!");
        setTimeout(() => setMessage(""), 3000);
      } else {
        setMessage("Failed to save preferences. Please try again.");
      }
    } catch (error) {
      console.error("Error saving preferences:", error);
      setMessage("Failed to save preferences. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const saveBusinessPreferences = async () => {
    if (!businessPreferences) return;

    setSaving(true);
    setMessage("");

    try {
      const response = await fetch("/api/business/preferences", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(businessPreferences),
      });
      const data = await response.json();

      if (response.ok) {
        setBusinessPreferences((current) =>
          current
            ? {
                ...current,
                ...data,
              }
            : current
        );
        setMessage("Business preferences saved successfully!");
        setTimeout(() => setMessage(""), 3000);
      } else {
        setMessage(data.error || "Failed to save business preferences. Please try again.");
      }
    } catch (error) {
      console.error("Error saving business preferences:", error);
      setMessage("Failed to save business preferences. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const toggleCategory = (categoryId: number) => {
    if (!preferences) return;

    const newFavoriteCategories = preferences.favoriteCategories.includes(categoryId)
      ? preferences.favoriteCategories.filter((id) => id !== categoryId)
      : [...preferences.favoriteCategories, categoryId];

    setPreferences({
      ...preferences,
      favoriteCategories: newFavoriteCategories,
    });
  };

  const addSuburb = (suburb: string) => {
    if (!preferences || !suburb.trim()) return;

    const trimmedSuburb = suburb.trim();
    if (!preferences.favoriteSuburbs.includes(trimmedSuburb)) {
      setPreferences({
        ...preferences,
        favoriteSuburbs: [...preferences.favoriteSuburbs, trimmedSuburb],
      });
    }
  };

  const removeSuburb = (suburb: string) => {
    if (!preferences) return;

    setPreferences({
      ...preferences,
      favoriteSuburbs: preferences.favoriteSuburbs.filter((favoriteSuburb) => favoriteSuburb !== suburb),
    });
  };

  const updateBusinessPreference = <Key extends keyof BusinessPreference>(
    key: Key,
    value: BusinessPreference[Key]
  ) => {
    setBusinessPreferences((current) =>
      current
        ? {
            ...current,
            [key]: value,
          }
        : current
    );
  };

  const handleBusinessImageChange = async (slotIndex: number, file?: File) => {
    if (!file || !businessPreferences) return;

    try {
      const compressedImage = await compressImage(file);
      const showcaseImages = [...businessPreferences.showcaseImages];
      showcaseImages[slotIndex] = compressedImage;
      updateBusinessPreference("showcaseImages", showcaseImages.filter(Boolean).slice(0, 6));
      setMessage("");
    } catch (_error) {
      setMessage("Image could not be uploaded. Please try a smaller image.");
    }
  };

  const removeBusinessImage = (slotIndex: number) => {
    if (!businessPreferences) return;

    updateBusinessPreference(
      "showcaseImages",
      businessPreferences.showcaseImages.filter((_, index) => index !== slotIndex)
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading preferences...</p>
        </div>
      </div>
    );
  }

  const renderMessage = () =>
    message ? (
      <div
        className={`mb-6 p-4 rounded-md ${
          message.includes("successfully")
            ? "bg-green-50 border border-green-200 text-green-800"
            : "bg-red-50 border border-red-200 text-red-800"
        }`}
      >
        {message}
      </div>
    ) : null;

  const renderHeader = (title: string, description: string) => (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{title}</h1>
        <p className="text-gray-600">{description}</p>
      </div>
      <Link
        href="/"
        className="inline-flex shrink-0 items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
      >
        Back to Home
      </Link>
    </div>
  );

  const renderBusinessPreferences = () => {
    if (!businessPreferences) return null;

    return (
      <div className="space-y-8">
        <div className="border-b border-gray-200 pb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Business Promotion</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700">Business Name</label>
              <input className={inputClassName} value={businessPreferences.businessName} disabled />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Business Category</label>
              <input className={inputClassName} value={businessPreferences.category.name} disabled />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Membership</label>
              <input className={inputClassName} value={businessPreferences.membershipType} disabled />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Status</label>
              <input className={inputClassName} value={businessPreferences.status} disabled />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700">Business URL</label>
              <input className={inputClassName} value={businessPreferences.url} disabled />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700">Promotion Message</label>
              <input
                className={inputClassName}
                maxLength={MAX_PROMOTION_MESSAGE_LENGTH}
                value={businessPreferences.promotionMessage}
                onChange={(event) => updateBusinessPreference("promotionMessage", event.target.value)}
              />
              <p className="mt-1 text-xs text-gray-500">
                {businessPreferences.promotionMessage.length}/{MAX_PROMOTION_MESSAGE_LENGTH} characters
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">From</label>
              <input
                type="date"
                className={inputClassName}
                value={businessPreferences.promotionStartDate}
                onChange={(event) => updateBusinessPreference("promotionStartDate", event.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">To</label>
              <input
                type="date"
                className={inputClassName}
                value={businessPreferences.promotionEndDate}
                onChange={(event) => updateBusinessPreference("promotionEndDate", event.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="border-b border-gray-200 pb-6">
          <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Showcase Images</h2>
              <p className="text-gray-600">Update the images shown in the Welcome showcase boxes.</p>
            </div>
            <label className="inline-flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={businessPreferences.aiImageTextEnabled}
                onChange={(event) => updateBusinessPreference("aiImageTextEnabled", event.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
              />
              Add text on images using AI
            </label>
          </div>

          {businessPreferences.aiImageTextEnabled && (
            <textarea
              value={businessPreferences.aiImageTextPrompt}
              onChange={(event) => updateBusinessPreference("aiImageTextPrompt", event.target.value)}
              maxLength={120}
              rows={3}
              placeholder="Text or style request for AI image overlay"
              className="mb-4 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-500 focus:border-green-500 focus:outline-none focus:ring-green-500"
            />
          )}

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {emptyImageSlots.map((_, index) => (
              <div
                key={index}
                className="relative aspect-square overflow-hidden rounded-lg border-2 border-dashed border-gray-300 bg-gray-50"
              >
                {businessPreferences.showcaseImages[index] ? (
                  <>
                    <img
                      src={businessPreferences.showcaseImages[index]}
                      alt={`Showcase ${index + 1}`}
                      className="h-full w-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removeBusinessImage(index)}
                      className="absolute right-2 top-2 rounded-full bg-white/90 px-2 py-1 text-xs font-medium text-gray-700 shadow"
                    >
                      Remove
                    </button>
                  </>
                ) : (
                  <label className="flex h-full cursor-pointer flex-col items-center justify-center gap-2 px-3 text-center text-sm text-gray-500 hover:bg-green-50">
                    <span className="text-2xl">+</span>
                    <span>Image {index + 1}</span>
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      className="sr-only"
                      onChange={(event) => handleBusinessImageChange(index, event.target.files?.[0])}
                    />
                  </label>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end">
          <button
            onClick={saveBusinessPreferences}
            disabled={saving}
            className="px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? "Saving..." : "Save Business Preferences"}
          </button>
        </div>
      </div>
    );
  };

  const renderUserPreferences = () => {
    if (!preferences) return null;

    return (
      <div className="space-y-8">
        <div className="border-b border-gray-200 pb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Email Notifications</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium text-gray-900">Email Notifications</h3>
                <p className="text-gray-600">Receive email alerts when new discounts are found in your favorite categories</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={preferences.emailNotifications}
                  onChange={(event) =>
                    setPreferences({
                      ...preferences,
                      emailNotifications: event.target.checked,
                    })
                  }
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium text-gray-900">Push Notifications</h3>
                <p className="text-gray-600">Receive browser notifications for new discounts</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={preferences.pushNotifications}
                  onChange={(event) =>
                    setPreferences({
                      ...preferences,
                      pushNotifications: event.target.checked,
                    })
                  }
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
              </label>
            </div>

            <div>
              <label className="block text-lg font-medium text-gray-900 mb-2">
                Notification Frequency
              </label>
              <select
                value={preferences.notificationFrequency}
                onChange={(event) =>
                  setPreferences({
                    ...preferences,
                    notificationFrequency: event.target.value,
                  })
                }
                className="block w-full max-w-xs px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
              >
                <option value="instant">Instant</option>
                <option value="daily">Daily Digest</option>
                <option value="weekly">Weekly Digest</option>
              </select>
              <p className="text-sm text-gray-600 mt-1">
                Choose how often you want to receive notifications
              </p>
            </div>
          </div>
        </div>

        <div className="border-b border-gray-200 pb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Favorite Categories</h2>
          <p className="text-gray-600 mb-4">
            Select the categories you&apos;re interested in to receive personalized discount notifications.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => toggleCategory(category.id)}
                className={`p-3 rounded-lg border-2 text-left transition-colors ${
                  preferences.favoriteCategories.includes(category.id)
                    ? "border-green-500 bg-green-50 text-green-800"
                    : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">{category.name}</span>
                  {preferences.favoriteCategories.includes(category.id) && (
                    <span className="text-green-600">✓</span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="border-b border-gray-200 pb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Favorite Suburbs</h2>
          <p className="text-gray-600 mb-4">
            Add suburbs you&apos;re interested in to get location-based discount notifications.
          </p>

          <div className="mb-4">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Enter suburb name"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    addSuburb(event.currentTarget.value);
                    event.currentTarget.value = "";
                  }
                }}
              />
              <button
                onClick={(event) => {
                  const input = event.currentTarget.previousElementSibling as HTMLInputElement;
                  addSuburb(input.value);
                  input.value = "";
                }}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
              >
                Add
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {preferences.favoriteSuburbs.map((suburb) => (
              <span
                key={suburb}
                className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800"
              >
                {suburb}
                <button
                  onClick={() => removeSuburb(suburb)}
                  className="ml-2 inline-flex items-center justify-center w-4 h-4 rounded-full text-green-600 hover:bg-green-200 focus:outline-none"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>

        <div className="flex justify-end">
          <button
            onClick={savePreferences}
            disabled={saving}
            className="px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? "Saving..." : "Save Preferences"}
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          {accountMode === "business"
            ? renderHeader(
                "Business Preferences",
                "Manage your live promotion, duration, showcase images, and AI image text options."
              )
            : renderHeader(
                "Preferences",
                "Manage your notification settings and favorite categories to get personalized discount alerts."
              )}

          {renderMessage()}
          {accountMode === "business" ? renderBusinessPreferences() : renderUserPreferences()}
        </div>
      </div>
    </div>
  );
}
