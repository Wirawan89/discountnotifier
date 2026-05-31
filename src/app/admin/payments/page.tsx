"use client";

const membershipPlans = [
  {
    name: "Silver",
    audience: "Small local business",
    priority: "Standard showcase rotation",
    features: ["Business profile", "Promotion message", "Showcase images", "Basic analytics"],
  },
  {
    name: "Gold",
    audience: "Growing merchant",
    priority: "Higher showcase priority",
    features: ["Everything in Silver", "More showcase weight", "Promotion usage insights", "Priority verification"],
  },
  {
    name: "Platinum",
    audience: "High-value sponsor",
    priority: "Top showcase priority",
    features: ["Everything in Gold", "Top ticker priority", "Featured placement", "Early new category sponsorship"],
  },
];

export default function PaymentsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">CC Payment & Membership</h1>
        <p className="mt-1 text-sm text-gray-500">
          Future payment controls for user subscriptions, business membership, invoices, and card payments.
        </p>
      </div>

      <section className="rounded-lg bg-white p-5 shadow">
        <h2 className="text-lg font-semibold text-gray-900">Implementation Roadmap</h2>
        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
          {[
            ["1", "Choose provider", "Stripe is the practical default for cards, subscriptions, invoices, Apple Pay, and Google Pay."],
            ["2", "Create plans", "Map Silver, Gold, and Platinum to provider price IDs and keep membership type in the Business table."],
            ["3", "Webhook sync", "Use payment webhooks to update subscriptionStatus and membershipType automatically."],
          ].map(([step, title, text]) => (
            <div key={step} className="rounded-md border border-gray-200 p-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-sm font-semibold text-white">
                {step}
              </div>
              <h3 className="mt-3 font-semibold text-gray-900">{title}</h3>
              <p className="mt-1 text-sm text-gray-500">{text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-lg bg-white p-5 shadow">
        <h2 className="text-lg font-semibold text-gray-900">Business Membership Plans</h2>
        <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
          {membershipPlans.map((plan) => (
            <div key={plan.name} className="rounded-lg border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">{plan.name}</h3>
                <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">Future</span>
              </div>
              <p className="mt-2 text-sm text-gray-500">{plan.audience}</p>
              <p className="mt-2 text-sm font-medium text-blue-700">{plan.priority}</p>
              <ul className="mt-4 space-y-2 text-sm text-gray-600">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex gap-2">
                    <span className="text-green-600">✓</span>
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-lg border border-blue-200 bg-blue-50 p-5">
        <h2 className="text-lg font-semibold text-blue-900">Recommended Payment Fields</h2>
        <p className="mt-2 text-sm text-blue-800">
          Later we should add providerCustomerId, providerSubscriptionId, currentPeriodEnd,
          paymentStatus, invoiceUrl, and cancellation status. Keep card details inside the payment provider only.
        </p>
      </section>
    </div>
  );
}
