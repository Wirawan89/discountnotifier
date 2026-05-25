export default function HotDealsTicker() {
  return (
    <div className="bg-red-600 text-white py-2 overflow-hidden">
      <div className="w-full px-4">
        <div className="flex items-center">
          <span className="font-bold mr-4">🔥 HOT DEALS:</span>
          <div className="flex-1 overflow-hidden">
            <div className="animate-marquee whitespace-nowrap">
              <span className="mr-8">20% off at Sydney Cafe • 50% off Electronics at TechStore • Free Delivery at FashionHub • Buy 1 Get 1 at MusicGear</span>
              <span className="mr-8">20% off at Sydney Cafe • 50% off Electronics at TechStore • Free Delivery at FashionHub • Buy 1 Get 1 at MusicGear</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
