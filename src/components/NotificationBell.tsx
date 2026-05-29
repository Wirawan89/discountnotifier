"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";

interface Notification {
  id: number;
  title: string;
  message: string;
  type: string;
  read: boolean;
  createdAt: string;
}

interface VerifiedStore {
  id: number;
  name: string;
  url: string;
  suburb: string;
  city?: string | null;
  category: {
    id: number;
    name: string;
  };
  discounts: {
    id: number;
    title: string;
    description?: string | null;
    startDate: string;
    endDate: string;
    eCatalog?: string[];
  }[];
}

interface NotificationResponse {
  notifications: Notification[];
  verifiedStores: VerifiedStore[];
  verifiedOfferCount: number;
  interestCategoryIds: number[];
  interestCategoryNames: string[];
}

export default function NotificationBell() {
  const { data: session } = useSession();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [verifiedStores, setVerifiedStores] = useState<VerifiedStore[]>([]);
  const [verifiedOfferCount, setVerifiedOfferCount] = useState(0);
  const [interestCategoryNames, setInterestCategoryNames] = useState<string[]>([]);
  const [hasInterestCategories, setHasInterestCategories] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const unreadCount = notifications.filter(n => !n.read).length;
  const badgeCount = verifiedOfferCount || unreadCount;

  useEffect(() => {
    if (session?.user) {
      fetchNotifications();
    }
  }, [session]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/notifications");
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data)) {
          setNotifications(data);
          setVerifiedStores([]);
          setVerifiedOfferCount(0);
          setInterestCategoryNames([]);
          setHasInterestCategories(true);
        } else {
          const notificationData = data as NotificationResponse;
          setNotifications(notificationData.notifications || []);
          setVerifiedStores(notificationData.verifiedStores || []);
          setVerifiedOfferCount(notificationData.verifiedOfferCount || 0);
          setInterestCategoryNames(notificationData.interestCategoryNames || []);
          setHasInterestCategories((notificationData.interestCategoryIds || []).length > 0);
        }
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: number) => {
    try {
      const response = await fetch("/api/notifications", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ notificationId }),
      });

      if (response.ok) {
        setNotifications(prev =>
          prev.map(n =>
            n.id === notificationId ? { ...n, read: true } : n
          )
        );
      }
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return "Just now";
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 48) return "Yesterday";
    return date.toLocaleDateString();
  };

  const getVisitUrl = (store: VerifiedStore) => {
    const offerUrl = store.discounts[0]?.eCatalog?.find((url) => /^https?:\/\//i.test(url));

    return offerUrl || store.url;
  };

  if (!session?.user) {
    return null;
  }

  return (
    <div className="relative">
      <button
        onClick={() => {
          const nextIsOpen = !isOpen;
          setIsOpen(nextIsOpen);
          if (nextIsOpen) {
            fetchNotifications();
          }
        }}
        className="relative p-2 text-gray-600 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-full"
        aria-label="Open notifications"
      >
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-5 5v-5zM10.5 3.75a6 6 0 0 1 6 6v4.5l2.25 2.25a1.5 1.5 0 0 1-1.5 2.25h-13.5a1.5 1.5 0 0 1-1.5-2.25L6 14.25V9.75a6 6 0 0 1 6-6z"
          />
        </svg>
        {badgeCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-semibold rounded-full min-w-5 h-5 px-1 flex items-center justify-center">
            {badgeCount > 99 ? "99+" : badgeCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="fixed inset-x-4 top-16 mt-0 bg-white rounded-lg shadow-lg border border-gray-200 z-50 sm:absolute sm:inset-x-auto sm:right-0 sm:top-auto sm:mt-2 sm:w-96">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Verified Offers</h3>
                <p className="mt-1 text-xs text-gray-500">
                  {interestCategoryNames.length > 0
                    ? interestCategoryNames.join(", ")
                    : "Based on your category interests"}
                </p>
              </div>
              {verifiedOfferCount > 0 && (
                <span className="rounded-full bg-red-100 px-2 py-1 text-xs font-semibold text-red-700">
                  {verifiedOfferCount}
                </span>
              )}
            </div>
          </div>
          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center text-gray-500">
                Loading...
              </div>
            ) : !hasInterestCategories ? (
              <div className="p-4 text-center text-gray-500">
                Select category interests in your preferences to see matching stores here.
              </div>
            ) : verifiedStores.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                No verified offers for your selected categories right now.
              </div>
            ) : (
              verifiedStores.map((store) => {
                const firstDiscount = store.discounts[0];

                return (
                  <div
                    key={store.id}
                    className="p-4 border-b border-gray-100 hover:bg-gray-50"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <h4 className="truncate text-sm font-semibold text-gray-900">
                          {store.name}
                        </h4>
                        <p className="mt-1 text-xs text-gray-500">
                          {store.category.name} - {store.suburb}
                        </p>
                        <p className="mt-2 text-sm font-medium text-red-600">
                          {firstDiscount?.title || "Happening Now..."}
                        </p>
                        <p className="mt-1 text-xs text-gray-500">Happening Now...</p>
                      </div>
                      <a
                        href={getVisitUrl(store)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="shrink-0 rounded-md border border-blue-200 bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 hover:bg-blue-100"
                      >
                        Visit
                      </a>
                    </div>
                  </div>
                );
              })
            )}

            {verifiedOfferCount > verifiedStores.length && (
              <div className="border-b border-gray-100 px-4 py-3 text-center text-xs text-gray-500">
                Showing {verifiedStores.length} of {verifiedOfferCount} matching stores.
              </div>
            )}

            {notifications.length > 0 && (
              <div className="border-t border-gray-200">
                <div className="px-4 py-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Account Notifications
                </div>
                {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer ${
                    !notification.read ? "bg-blue-50" : ""
                  }`}
                  onClick={() => markAsRead(notification.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-gray-900">
                        {notification.title}
                      </h4>
                      <p className="text-sm text-gray-600 mt-1">
                        {notification.message}
                      </p>
                      <p className="text-xs text-gray-400 mt-2">
                        {formatDate(notification.createdAt)}
                      </p>
                    </div>
                    {!notification.read && (
                      <div className="w-2 h-2 bg-blue-500 rounded-full ml-2 mt-1"></div>
                    )}
                  </div>
                </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
} 
