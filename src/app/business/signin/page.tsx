"use client";

import Link from "next/link";
import { getProviders, signIn } from "next-auth/react";
import type { ClientSafeProvider } from "next-auth/react";
import { useEffect, useState } from "react";

export default function BusinessSignInPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<string | null>(null);
  const [providers, setProviders] = useState<Record<string, ClientSafeProvider>>({});
  const [loadingProviders, setLoadingProviders] = useState(true);
  const [message, setMessage] = useState("");
  const [robotVerified, setRobotVerified] = useState(false);

  useEffect(() => {
    setMessage(new URLSearchParams(window.location.search).get("message") || "");

    const loadProviders = async () => {
      try {
        const response = await fetch("/api/auth/providers");
        if (response.ok) {
          const providersData = await response.json();
          setProviders(providersData || {});
          return;
        }

        const providersData = await getProviders();
        setProviders(providersData || {});
      } catch (error) {
        console.error("Error loading providers:", error);
      } finally {
        setLoadingProviders(false);
      }
    };

    loadProviders();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!robotVerified) {
      setError("Please complete the I'm not a robot verification.");
      return;
    }

    setLoading(true);
    setError("");

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
      callbackUrl: "/",
    });

    if (result?.error) {
      setError("Invalid email or password");
      setLoading(false);
      return;
    }

    window.location.href = result?.url || "/";
  };

  const handleSocialSignIn = async (provider: "google" | "apple" | "facebook") => {
    if (!robotVerified) {
      setError("Please complete the I'm not a robot verification.");
      return;
    }

    setSocialLoading(provider);
    setError("");

    try {
      await signIn(provider, { callbackUrl: "/" });
    } catch (_error) {
      setError(`Failed to sign in with ${provider}`);
      setSocialLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-blue-100">
            <span className="text-2xl">🏪</span>
          </div>
          <h1 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in to your Business account
          </h1>
          <p className="mt-2 text-center text-sm text-gray-600">
            Or{" "}
            <Link href="/business/signup" className="font-medium text-blue-600 hover:text-blue-500">
              register your business
            </Link>
          </p>
        </div>

        {message && (
          <div className="rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            {message}
          </div>
        )}

        {loadingProviders ? (
          <div className="space-y-3">
            <div className="w-full h-10 bg-gray-200 rounded-md animate-pulse"></div>
            <div className="w-full h-10 bg-gray-200 rounded-md animate-pulse"></div>
          </div>
        ) : (
          <div className="space-y-3">
            <button
              type="button"
              onClick={() => providers.google && handleSocialSignIn("google")}
              disabled={!!socialLoading || !providers.google}
              className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {socialLoading === "google" ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-700 mr-2"></div>
              ) : (
                <span className="mr-2 font-bold text-blue-600">G</span>
              )}
              {providers.google ? "Continue with Google" : "Google not configured"}
            </button>

            <button
              type="button"
              onClick={() => providers.apple && handleSocialSignIn("apple")}
              disabled={!!socialLoading || !providers.apple}
              className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm bg-black text-sm font-medium text-white hover:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {socialLoading === "apple" ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              ) : (
                <span className="mr-2 font-bold">Apple</span>
              )}
              {providers.apple ? "Continue with Apple" : "Apple not configured"}
            </button>

            <button
              type="button"
              onClick={() => providers.facebook && handleSocialSignIn("facebook")}
              disabled={!!socialLoading || !providers.facebook}
              className="w-full flex items-center justify-center px-4 py-2 border border-blue-700 rounded-md shadow-sm bg-blue-700 text-sm font-medium text-white hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {socialLoading === "facebook" ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              ) : (
                <span className="mr-2 font-bold">f</span>
              )}
              {providers.facebook ? "Continue with Facebook" : "Facebook not configured"}
            </button>
          </div>
        )}

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-gray-50 text-gray-500">Or continue with</span>
          </div>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="business-email" className="sr-only">
                Email address
              </label>
              <input
                id="business-email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Email address"
              />
            </div>
            <div>
              <label htmlFor="business-password" className="sr-only">
                Password
              </label>
              <input
                id="business-password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Password"
              />
            </div>
          </div>

          <div className="rounded-md border border-gray-200 bg-white p-3">
            <label className="flex items-start gap-3 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={robotVerified}
                onChange={(e) => setRobotVerified(e.target.checked)}
                className="mt-0.5 h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span>I&apos;m not a robot</span>
            </label>
          </div>

          <div className="flex justify-end">
            <Link
              href="/auth/forgot-password"
              className="text-sm font-medium text-blue-600 hover:text-blue-500"
            >
              Forgot Password?
            </Link>
          </div>

          {error && (
            <div className="text-red-600 text-sm text-center">{error}</div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
