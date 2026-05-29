"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Category {
  id: number;
  name: string;
}

type BusinessForm = {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  dob: string;
  abn: string;
  businessName: string;
  address: string;
  suburb: string;
  state: string;
  country: string;
  url: string;
  promotionUrl: string;
  categoryId: string;
  promotionMessage: string;
  promotionStartDate: string;
  promotionEndDate: string;
  membershipType: string;
  aiImageTextEnabled: boolean;
  aiImageTextPrompt: string;
  showcaseImages: string[];
  robotVerified: boolean;
};

type BusinessFormField = keyof BusinessForm;
type ValidationError = {
  field: BusinessFormField;
  message: string;
};

type StoreMatch = {
  id: number;
  name: string;
  url: string;
  suburb: string;
  city: string;
  country: string;
  category: Category;
  alreadyClaimed: boolean;
  claimedBy: string | null;
  score: number;
  reasons: string[];
};

const emptyImageSlots = Array.from({ length: 6 });
const MAX_PROMOTION_MESSAGE_LENGTH = 96;
const MAX_IMAGE_DIMENSION = 900;
const IMAGE_QUALITY = 0.68;
const australianStates = ["NSW", "VIC", "QLD", "WA", "SA", "TAS", "ACT", "NT"];
const inputClassName =
  "mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 bg-white rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm";

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

function normalizeBusinessUrl(value: string) {
  const trimmed = value.trim();
  if (!trimmed) {
    return "";
  }

  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function validateBusinessForm(formData: BusinessForm) {
  const errors: ValidationError[] = [];

  if (!isValidEmail(formData.email)) {
    errors.push({ field: "email", message: "Enter a valid email address." });
  }
  if (!formData.password.trim()) {
    errors.push({ field: "password", message: "Password is required." });
  }
  if (!formData.firstName.trim()) {
    errors.push({ field: "firstName", message: "First Name is required." });
  }
  if (!formData.lastName.trim()) {
    errors.push({ field: "lastName", message: "Last Name is required." });
  }
  if (!formData.dob) {
    errors.push({ field: "dob", message: "DOB is required." });
  }
  if (!formData.businessName.trim()) {
    errors.push({ field: "businessName", message: "Business Name is required." });
  }
  if (!formData.address.trim()) {
    errors.push({ field: "address", message: "Address is required." });
  }
  if (!formData.suburb.trim()) {
    errors.push({ field: "suburb", message: "City/Suburb is required." });
  }
  if (!formData.state.trim()) {
    errors.push({ field: "state", message: "State is required." });
  }
  if (!formData.country.trim()) {
    errors.push({ field: "country", message: "Country is required." });
  }
  if (!formData.url.trim()) {
    errors.push({ field: "url", message: "Business URL is required." });
  }
  if (formData.promotionUrl.trim()) {
    try {
      new URL(normalizeBusinessUrl(formData.promotionUrl));
    } catch (_error) {
      errors.push({ field: "promotionUrl", message: "Promotion URL must be a valid URL." });
    }
  }
  if (!formData.categoryId) {
    errors.push({ field: "categoryId", message: "Business Category is required." });
  }
  const hasPromotionInput = Boolean(
    formData.promotionMessage.trim() ||
    formData.promotionStartDate ||
    formData.promotionEndDate ||
    formData.promotionUrl.trim()
  );
  if (formData.promotionMessage.trim().length > MAX_PROMOTION_MESSAGE_LENGTH) {
    errors.push({
      field: "promotionMessage",
      message: `Promotion Message must be ${MAX_PROMOTION_MESSAGE_LENGTH} characters or less.`,
    });
  }
  if (hasPromotionInput && !formData.promotionMessage.trim()) {
    errors.push({ field: "promotionMessage", message: "Promotion Message is required when publishing a promotion." });
  }
  if (hasPromotionInput && !formData.promotionStartDate) {
    errors.push({ field: "promotionStartDate", message: "Promotion From date is required when publishing a promotion." });
  }
  if (hasPromotionInput && !formData.promotionEndDate) {
    errors.push({ field: "promotionEndDate", message: "Promotion To date is required when publishing a promotion." });
  }
  if (
    formData.promotionStartDate &&
    formData.promotionEndDate &&
    new Date(formData.promotionEndDate) < new Date(formData.promotionStartDate)
  ) {
    errors.push({
      field: "promotionEndDate",
      message: "Promotion To date must be after the From date.",
    });
  }
  if (!formData.robotVerified) {
    errors.push({ field: "robotVerified", message: "Tick the I'm not a robot verification." });
  }

  return errors;
}

export default function BusinessSignUpPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [formData, setFormData] = useState<BusinessForm>({
    email: "",
    password: "",
    firstName: "",
    lastName: "",
    dob: "",
    abn: "",
    businessName: "",
    address: "",
    suburb: "",
    state: "NSW",
    country: "Australia",
    url: "",
    promotionUrl: "",
    categoryId: "",
    promotionMessage: "",
    promotionStartDate: "",
    promotionEndDate: "",
    membershipType: "Silver",
    aiImageTextEnabled: false,
    aiImageTextPrompt: "",
    showcaseImages: [],
    robotVerified: false,
  });
  const [error, setError] = useState("");
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [loading, setLoading] = useState(false);
  const [storeMatches, setStoreMatches] = useState<StoreMatch[]>([]);
  const [selectedStoreMatchId, setSelectedStoreMatchId] = useState<number | null>(null);
  const [createNewStore, setCreateNewStore] = useState(false);
  const [matchSearchLoading, setMatchSearchLoading] = useState(false);
  const [matchSearchMessage, setMatchSearchMessage] = useState("");

  useEffect(() => {
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

    fetchCategories();
  }, []);

  const getFieldError = (field: BusinessFormField) =>
    validationErrors.find((validationError) => validationError.field === field)?.message;

  const renderFieldError = (field: BusinessFormField) => {
    const message = getFieldError(field);
    return message ? <p className="mt-1 text-xs font-medium text-red-600">{message}</p> : null;
  };

  const clearErrors = () => {
    setError("");
    setValidationErrors([]);
  };

  const resetStoreClaimState = () => {
    setStoreMatches([]);
    setSelectedStoreMatchId(null);
    setCreateNewStore(false);
    setMatchSearchMessage("");
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    clearErrors();
    if (["businessName", "url", "suburb", "country", "categoryId"].includes(name)) {
      resetStoreClaimState();
    }
    setFormData((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const findExistingStoreMatches = async () => {
    clearErrors();
    setMatchSearchMessage("");

    const normalizedUrl = normalizeBusinessUrl(formData.url);
    if (!formData.businessName.trim() && !normalizedUrl) {
      setMatchSearchMessage("Enter a business name or URL first.");
      return [];
    }

    setMatchSearchLoading(true);
    try {
      const params = new URLSearchParams({
        businessName: formData.businessName.trim(),
        url: normalizedUrl,
        suburb: formData.suburb.trim(),
        city: formData.suburb.trim(),
        country: formData.country.trim(),
        categoryId: formData.categoryId,
      });
      const response = await fetch(`/api/business/store-matches?${params.toString()}`);
      const data = await response.json();

      if (!response.ok) {
        setMatchSearchMessage(data.error || "Could not search existing stores.");
        return [];
      }

      const matches = Array.isArray(data.matches) ? data.matches : [];
      setStoreMatches(matches);
      setSelectedStoreMatchId(null);
      setCreateNewStore(matches.length === 0);
      setMatchSearchMessage(
        matches.length > 0
          ? "Possible existing stores found. Claim one or choose to create a new store."
          : "No matching store found. A new store will be created."
      );
      return matches;
    } catch (_error) {
      setMatchSearchMessage("Could not search existing stores. Please try again.");
      return [];
    } finally {
      setMatchSearchLoading(false);
    }
  };

  const selectStoreMatch = (match: StoreMatch) => {
    if (match.alreadyClaimed) {
      return;
    }

    clearErrors();
    setSelectedStoreMatchId(match.id);
    setCreateNewStore(false);
    setFormData((current) => ({
      ...current,
      businessName: current.businessName.trim() || match.name,
      url: match.url,
      suburb: match.suburb,
      country: match.country,
      categoryId: String(match.category.id),
    }));
  };

  const selectCreateNewStore = () => {
    clearErrors();
    setSelectedStoreMatchId(null);
    setCreateNewStore(true);
  };

  const handleImageChange = async (slotIndex: number, file?: File) => {
    if (!file) return;

    try {
      const compressedImage = await compressImage(file);
      setFormData((current) => {
        const showcaseImages = [...current.showcaseImages];
        showcaseImages[slotIndex] = compressedImage;
        return {
          ...current,
          showcaseImages: showcaseImages.filter(Boolean).slice(0, 6),
        };
      });
      clearErrors();
    } catch (_error) {
      setError("Image could not be uploaded. Please try a smaller image.");
    }
  };

  const removeImage = (slotIndex: number) => {
    setFormData((current) => ({
      ...current,
      showcaseImages: current.showcaseImages.filter((_, index) => index !== slotIndex),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const submittedFormData = {
      ...formData,
      url: normalizeBusinessUrl(formData.url),
      email: formData.email.trim().toLowerCase(),
      firstName: formData.firstName.trim(),
      lastName: formData.lastName.trim(),
      abn: formData.abn.trim(),
      businessName: formData.businessName.trim(),
      address: formData.address.trim(),
      suburb: formData.suburb.trim(),
      state: formData.state.trim(),
      country: formData.country.trim(),
      promotionMessage: formData.promotionMessage.trim(),
      promotionUrl: normalizeBusinessUrl(formData.promotionUrl),
    };

    const errors = validateBusinessForm(submittedFormData);
    if (errors.length > 0) {
      setError("");
      setValidationErrors(errors);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    if (!selectedStoreMatchId && !createNewStore) {
      const matches = await findExistingStoreMatches();
      if (matches.length > 0) {
        setError("Please confirm whether one of these existing stores is yours, or choose to create a new store.");
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }
    }

    setLoading(true);
    clearErrors();

    try {
      const response = await fetch("/api/business/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...submittedFormData,
          claimedStoreId: selectedStoreMatchId,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to create business account.");
        return;
      }

      router.push("/business/signin?message=Business account created. Please sign in.");
    } catch (_error) {
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Business Registration</h1>
            <p className="mt-1 text-sm text-gray-600">
              Promote your store across DiscountNotifier categories and showcase spaces.
            </p>
          </div>
          <Link
            href="/business/signin"
            className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Business Login
          </Link>
        </div>

        {validationErrors.length > 0 && (
          <div className="mb-5 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <p className="font-semibold">Please fix these before creating the account:</p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              {validationErrors.map((validationError) => (
                <li key={`${validationError.field}-${validationError.message}`}>
                  {validationError.message}
                </li>
              ))}
            </ul>
          </div>
        )}

        <form className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm sm:p-6" onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className={inputClassName}
                value={formData.email}
                onChange={handleChange}
              />
              {renderFieldError("email")}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                className={inputClassName}
                value={formData.password}
                onChange={handleChange}
              />
              {renderFieldError("password")}
            </div>

            <div>
              <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                First Name
              </label>
              <input
                id="firstName"
                name="firstName"
                type="text"
                autoComplete="given-name"
                required
                className={inputClassName}
                value={formData.firstName}
                onChange={handleChange}
              />
              {renderFieldError("firstName")}
            </div>

            <div>
              <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                Last Name
              </label>
              <input
                id="lastName"
                name="lastName"
                type="text"
                autoComplete="family-name"
                required
                className={inputClassName}
                value={formData.lastName}
                onChange={handleChange}
              />
              {renderFieldError("lastName")}
            </div>

            <div>
              <label htmlFor="dob" className="block text-sm font-medium text-gray-700">
                DOB
              </label>
              <input
                id="dob"
                name="dob"
                type="date"
                required
                className={inputClassName}
                value={formData.dob}
                onChange={handleChange}
              />
              {renderFieldError("dob")}
            </div>

            <div>
              <label htmlFor="businessName" className="block text-sm font-medium text-gray-700">
                Business Name
              </label>
              <input
                id="businessName"
                name="businessName"
                type="text"
                autoComplete="organization"
                required
                className={inputClassName}
                value={formData.businessName}
                onChange={handleChange}
              />
              {renderFieldError("businessName")}
            </div>

            <div>
              <label htmlFor="abn" className="block text-sm font-medium text-gray-700">
                ABN <span className="text-xs font-normal text-gray-500">(optional)</span>
              </label>
              <input
                id="abn"
                name="abn"
                type="text"
                inputMode="numeric"
                autoComplete="off"
                className={inputClassName}
                value={formData.abn}
                onChange={handleChange}
              />
            </div>

            <div className="md:col-span-2">
              <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                Address
              </label>
              <input
                id="address"
                name="address"
                type="text"
                autoComplete="street-address"
                required
                className={inputClassName}
                value={formData.address}
                onChange={handleChange}
              />
              {renderFieldError("address")}
            </div>

            <div>
              <label htmlFor="suburb" className="block text-sm font-medium text-gray-700">
                City/Suburb
              </label>
              <input
                id="suburb"
                name="suburb"
                type="text"
                autoComplete="address-level2"
                required
                className={inputClassName}
                value={formData.suburb}
                onChange={handleChange}
              />
              {renderFieldError("suburb")}
            </div>

            <div>
              <label htmlFor="state" className="block text-sm font-medium text-gray-700">
                State
              </label>
              <select
                id="state"
                name="state"
                required
                className={inputClassName}
                value={formData.state}
                onChange={handleChange}
              >
                {australianStates.map((state) => (
                  <option key={state} value={state}>
                    {state}
                  </option>
                ))}
              </select>
              {renderFieldError("state")}
            </div>

            <div>
              <label htmlFor="country" className="block text-sm font-medium text-gray-700">
                Country
              </label>
              <input
                id="country"
                name="country"
                type="text"
                autoComplete="country-name"
                required
                className={inputClassName}
                value={formData.country}
                onChange={handleChange}
              />
              {renderFieldError("country")}
            </div>

            <div>
              <label htmlFor="url" className="block text-sm font-medium text-gray-700">
                Business URL
              </label>
              <input
                id="url"
                name="url"
                type="url"
                autoComplete="url"
                required
                className={inputClassName}
                placeholder="https://example.com.au"
                value={formData.url}
                onChange={handleChange}
                onBlur={() =>
                  setFormData((current) => ({
                    ...current,
                    url: normalizeBusinessUrl(current.url),
                  }))
                }
              />
              {renderFieldError("url")}
            </div>

            <div>
              <label htmlFor="promotionUrl" className="block text-sm font-medium text-gray-700">
                Promotion URL <span className="text-xs font-normal text-gray-500">(optional)</span>
              </label>
              <input
                id="promotionUrl"
                name="promotionUrl"
                type="url"
                autoComplete="url"
                className={inputClassName}
                placeholder="https://example.com.au/specials"
                value={formData.promotionUrl}
                onChange={handleChange}
                onBlur={() =>
                  setFormData((current) => ({
                    ...current,
                    promotionUrl: normalizeBusinessUrl(current.promotionUrl),
                  }))
                }
              />
              {renderFieldError("promotionUrl")}
              <p className="mt-1 text-xs text-gray-500">
                Direct page for this offer, if different from the main website.
              </p>
            </div>

            <div>
              <label htmlFor="categoryId" className="block text-sm font-medium text-gray-700">
                Business Category
              </label>
              <select
                id="categoryId"
                name="categoryId"
                required
                className={inputClassName}
                value={formData.categoryId}
                onChange={handleChange}
              >
                <option value="">Select one category</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
              {renderFieldError("categoryId")}
            </div>

            <div className="md:col-span-2 rounded-lg border border-blue-100 bg-blue-50 p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-sm font-semibold text-blue-950">Existing Store Match</h2>
                  <p className="mt-1 text-xs text-blue-800">
                    Check whether this business already exists in DiscountNotifier before creating a new store.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={findExistingStoreMatches}
                  disabled={matchSearchLoading}
                  className="inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {matchSearchLoading ? "Checking..." : "Check Existing Store"}
                </button>
              </div>

              {matchSearchMessage && (
                <p className="mt-3 text-sm text-blue-900">{matchSearchMessage}</p>
              )}

              {storeMatches.length > 0 && (
                <div className="mt-4 grid gap-3">
                  {storeMatches.map((match) => {
                    const isSelected = selectedStoreMatchId === match.id;

                    return (
                      <button
                        key={match.id}
                        type="button"
                        onClick={() => selectStoreMatch(match)}
                        disabled={match.alreadyClaimed}
                        className={`rounded-lg border p-3 text-left transition-colors ${
                          isSelected
                            ? "border-blue-600 bg-white shadow-sm"
                            : "border-blue-200 bg-white/80 hover:border-blue-400"
                        } ${match.alreadyClaimed ? "cursor-not-allowed opacity-60" : ""}`}
                      >
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <div className="font-semibold text-gray-900">{match.name}</div>
                            <div className="mt-1 text-sm text-gray-600">
                              {match.suburb}, {match.city} · {match.category.name}
                            </div>
                            <div className="mt-1 break-all text-xs text-blue-700">{match.url}</div>
                            {match.reasons.length > 0 && (
                              <div className="mt-2 text-xs text-gray-500">
                                Matched by {match.reasons.join(", ")}
                              </div>
                            )}
                          </div>
                          <div className="shrink-0 rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
                            {match.alreadyClaimed ? "Already claimed" : isSelected ? "Selected" : "Claim"}
                          </div>
                        </div>
                      </button>
                    );
                  })}

                  <button
                    type="button"
                    onClick={selectCreateNewStore}
                    className={`rounded-lg border p-3 text-left text-sm transition-colors ${
                      createNewStore
                        ? "border-blue-600 bg-white font-semibold text-blue-900"
                        : "border-blue-200 bg-white/80 text-gray-700 hover:border-blue-400"
                    }`}
                  >
                    None of these are mine. Create a new store listing.
                  </button>
                </div>
              )}
            </div>

            <div>
              <label htmlFor="membershipType" className="block text-sm font-medium text-gray-700">
                Membership
              </label>
              <select
                id="membershipType"
                name="membershipType"
                className={inputClassName}
                value={formData.membershipType}
                onChange={handleChange}
              >
                <option value="Silver">Silver</option>
                <option value="Gold">Gold</option>
                <option value="Platinum">Platinum</option>
              </select>
            </div>

            <div>
              <label htmlFor="promotionMessage" className="block text-sm font-medium text-gray-700">
                Promotion Message <span className="text-xs font-normal text-gray-500">(optional)</span>
              </label>
              <input
                id="promotionMessage"
                name="promotionMessage"
                type="text"
                maxLength={MAX_PROMOTION_MESSAGE_LENGTH}
                className={inputClassName}
                value={formData.promotionMessage}
                onChange={handleChange}
              />
              {renderFieldError("promotionMessage")}
              <p className="mt-1 text-xs text-gray-500">
                {formData.promotionMessage.length}/{MAX_PROMOTION_MESSAGE_LENGTH} characters
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="promotionStartDate" className="block text-sm font-medium text-gray-700">
                  From <span className="text-xs font-normal text-gray-500">(optional)</span>
                </label>
                <input
                  id="promotionStartDate"
                  name="promotionStartDate"
                  type="date"
                  className={inputClassName}
                  value={formData.promotionStartDate}
                  onChange={handleChange}
                />
                {renderFieldError("promotionStartDate")}
              </div>
              <div>
                <label htmlFor="promotionEndDate" className="block text-sm font-medium text-gray-700">
                  To <span className="text-xs font-normal text-gray-500">(optional)</span>
                </label>
                <input
                  id="promotionEndDate"
                  name="promotionEndDate"
                  type="date"
                  className={inputClassName}
                  value={formData.promotionEndDate}
                  onChange={handleChange}
                />
                {renderFieldError("promotionEndDate")}
              </div>
            </div>
          </div>

          <div className="mt-6">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Showcase Images</h2>
              <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={formData.aiImageTextEnabled}
                  onChange={(e) =>
                    setFormData((current) => ({
                      ...current,
                      aiImageTextEnabled: e.target.checked,
                    }))
                  }
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                Add text on images using AI
              </label>
            </div>

            {formData.aiImageTextEnabled && (
              <textarea
                name="aiImageTextPrompt"
                value={formData.aiImageTextPrompt}
                onChange={handleChange}
                maxLength={120}
                rows={2}
                placeholder="Text or style request for AI image overlay"
                className="mt-3 w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            )}

            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
              {emptyImageSlots.map((_, index) => (
                <div
                  key={index}
                  className="relative aspect-square overflow-hidden rounded-lg border-2 border-dashed border-gray-300 bg-gray-50"
                >
                  {formData.showcaseImages[index] ? (
                    <>
                      <img
                        src={formData.showcaseImages[index]}
                        alt={`Showcase ${index + 1}`}
                        className="h-full w-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute right-2 top-2 rounded-full bg-white/90 px-2 py-1 text-xs font-medium text-gray-700 shadow"
                      >
                        Remove
                      </button>
                    </>
                  ) : (
                    <label className="flex h-full cursor-pointer flex-col items-center justify-center gap-2 px-3 text-center text-sm text-gray-500 hover:bg-blue-50">
                      <span className="text-2xl">+</span>
                      <span>Image {index + 1}</span>
                      <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        className="sr-only"
                        onChange={(e) => handleImageChange(index, e.target.files?.[0])}
                      />
                    </label>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 rounded-lg border border-gray-200 bg-gray-50 p-4">
            <label className="flex items-start gap-3 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={formData.robotVerified}
                onChange={(e) => {
                  clearErrors();
                  setFormData((current) => ({
                    ...current,
                    robotVerified: e.target.checked,
                  }));
                }}
                className="mt-0.5 h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span>I&apos;m not a robot and this is a real business website.</span>
            </label>
            {renderFieldError("robotVerified")}
          </div>

          {error && (
            <div className="mt-5 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Link
              href="/"
              className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center justify-center rounded-md bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Creating..." : "Create Business Account"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
