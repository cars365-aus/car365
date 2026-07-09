/** FAQ content — shared between the page UI and the FAQPage JSON-LD. */
export const faqs = [
  {
    category: "For Customers",
    questions: [
      {
        q: "How does Hire Car work?",
        a: "Hire Car is a marketplace connecting you with verified, independent car rental operators. You browse vehicles, send an enquiry directly to the vendor, and they will coordinate the booking, payment, and pickup details directly with you.",
      },
      {
        q: "Do I pay on the Hire Car website?",
        a: "No. Hire Car is a discovery platform. You do not pay any booking fees to us. All payments, deposits, and rental agreements are handled directly by the rental operator you choose.",
      },
      {
        q: "Are the rental companies trustworthy?",
        a: "Yes. Every vendor on our platform must pass our verification process. We check their Australian Business Number (ABN) and business details before they are allowed to list vehicles on the marketplace.",
      },
      {
        q: "What happens if I need to cancel my booking?",
        a: "Cancellation policies are set by each individual rental operator. When you make a booking, the vendor will provide their specific cancellation terms. You will need to contact the vendor directly to cancel or modify your reservation.",
      },
      {
        q: "Does the price include insurance?",
        a: "Insurance coverage varies by vendor. While basic coverage is typically included by law, excess amounts and optional coverages depend on the operator's specific policies. Always confirm insurance details directly with the vendor before finalizing your booking.",
      },
    ],
  },
  {
    category: "For Vendors",
    questions: [
      {
        q: "How much does it cost to list my fleet?",
        a: "We offer tiered subscription plans based on fleet size. The Starter plan is free ($0/month) for up to 10 vehicles. Growth and Pro plans include a 14-day free trial. We do not charge commissions on your bookings — you keep 100% of your rental revenue. See our Pricing page for details.",
      },
      {
        q: "How do I receive leads?",
        a: "When a customer enquires about your vehicle, you will receive an instant email notification. You can also view and respond to all leads directly in your Vendor Dashboard. Customers can optionally contact you via Phone or WhatsApp if you provide those details.",
      },
      {
        q: "How long does it take to get approved?",
        a: "After you complete the onboarding process and submit your ABN, our team reviews your application. Approval typically takes less than 24 hours during business days.",
      },
      {
        q: "Can I bulk upload my vehicles?",
        a: "Yes, our Pro and Enterprise plans include bulk upload capabilities and API access, allowing you to sync your fleet inventory directly with our platform.",
      },
    ],
  },
] as const;
