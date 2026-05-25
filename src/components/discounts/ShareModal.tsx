import type { ShareData } from "./types";

type ShareModalProps = {
  shareData: ShareData | null;
  onClose: () => void;
};

export default function ShareModal({ shareData, onClose }: ShareModalProps) {
  if (!shareData) return null;

  const handleShare = () => {
    const text = shareData.discount
      ? `Check out this amazing discount at ${shareData.store.name}: ${shareData.discount.title}`
      : `Check out ${shareData.store.name} in ${shareData.store.suburb}`;
    const url = shareData.store.url;

    if (navigator.share) {
      navigator.share({
        title: "DiscountNotifier",
        text,
        url,
      });
    } else {
      navigator.clipboard.writeText(`${text}\n${url}`);
      alert("Link copied to clipboard!");
    }

    onClose();
  };

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(shareData.store.url);
    alert("Store URL copied to clipboard!");
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold">Share {shareData.discount ? "Discount" : "Store"}</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-xl"
          >
            ×
          </button>
        </div>

        <div className="mb-4">
          <p className="font-medium">{shareData.store.name}</p>
          <p className="text-sm text-gray-600">📍 {shareData.store.suburb}</p>
          {shareData.discount && (
            <div className="mt-2 p-2 bg-red-50 rounded border-l-2 border-red-400">
              <p className="font-medium text-red-700 text-sm">{shareData.discount.title}</p>
              <p className="text-xs text-gray-600">{shareData.discount.description}</p>
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleShare}
            className="flex-1 bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition-colors"
          >
            Share
          </button>
          <button
            type="button"
            onClick={handleCopyUrl}
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
          >
            Copy URL
          </button>
        </div>
      </div>
    </div>
  );
}
