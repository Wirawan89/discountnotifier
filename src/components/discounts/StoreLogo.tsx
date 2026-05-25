'use client';

import { useMemo, useState } from "react";

type StoreLogoProps = {
  name: string;
  url: string;
};

function getStoreOrigin(url: string): string | null {
  try {
    return new URL(/^https?:\/\//i.test(url) ? url : `https://${url}`).origin;
  } catch {
    return null;
  }
}

function getInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join("");
}

export default function StoreLogo({ name, url }: StoreLogoProps) {
  const [hasImageError, setHasImageError] = useState(false);
  const logoUrl = useMemo(() => {
    const origin = getStoreOrigin(url);

    if (!origin) {
      return null;
    }

    return `https://www.google.com/s2/favicons?domain_url=${encodeURIComponent(origin)}&sz=64`;
  }, [url]);
  const initials = getInitials(name) || "?";

  return (
    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md border border-gray-200 bg-gray-50 shadow-sm">
      {logoUrl && !hasImageError ? (
        <img
          src={logoUrl}
          alt={`${name} logo`}
          className="h-7 w-7 object-contain"
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={() => setHasImageError(true)}
        />
      ) : (
        <span className="text-xs font-bold text-gray-500">{initials}</span>
      )}
    </div>
  );
}
