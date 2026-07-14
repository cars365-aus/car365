import { notFound } from "next/navigation";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

type PolicySection = {
  heading: string;
  body: string[];
  bullets?: string[];
};

type Policy = {
  title: string;
  summary: string;
  sections: PolicySection[];
};

const updatedAt = "14 July 2026";

const policies: Record<string, Policy> = {
  terms: {
    title: "Terms of Service",
    summary:
      "These terms govern your use of the Cars365 website, where we advertise quality used vehicles for sale and invite you to enquire about them.",
    sections: [
      {
        heading: "About Cars365",
        body: [
          "Cars365 is a used-vehicle dealership. We list vehicles we hold or can source for sale, publish their details and pricing, and provide ways for you to contact us with an enquiry, finance request, trade-in request, or inspection booking.",
          "The website is an advertisement and an invitation to enquire. It is not an offer capable of acceptance, and submitting an enquiry does not create a contract of sale. A sale is formed only when we and the buyer agree the terms of that specific vehicle in writing.",
        ],
      },
      {
        heading: "Vehicle information and pricing",
        body: [
          "We take care to describe each vehicle accurately, including make, model, year, odometer, body type, fuel, transmission, and features. Occasionally details may contain errors or become out of date, and a vehicle may sell before a listing is removed.",
          "Advertised prices are in Australian dollars and may exclude government charges such as stamp duty, registration, and transfer fees unless stated otherwise. We may correct pricing or availability errors at any time before a sale is agreed.",
        ],
      },
      {
        heading: "Enquiries and finance",
        body: [
          "When you submit an enquiry you must provide accurate contact details. We use those details to respond to your request about the relevant vehicle and related services.",
          "Any finance repayment figures shown are indicative estimates only, are not an offer of finance, and are subject to lender approval, fees, and your circumstances. Trade-in figures are estimates only until we inspect your vehicle.",
        ],
      },
      {
        heading: "Australian Consumer Law",
        body: [
          "Nothing in these terms excludes, restricts, or modifies any consumer guarantee, right, or remedy that cannot lawfully be excluded under the Australian Consumer Law or other applicable law.",
          "Where we sell a vehicle to you, statutory guarantees and any applicable statutory warranty apply to that sale in addition to any warranty we expressly provide.",
        ],
      },
      {
        heading: "Acceptable use of the website",
        body: [
          "You must not use the website to break the law, submit false or spam enquiries, impersonate others, scrape data, bypass security controls, distribute malware, or interfere with its availability.",
        ],
      },
      {
        heading: "Service changes and liability",
        body: [
          "We may change, suspend, or discontinue parts of the website for maintenance, security, legal, or business reasons, and we do not guarantee uninterrupted availability.",
          "To the maximum extent permitted by law, our liability for your use of the website is limited to resupplying the affected service. This does not limit rights that cannot be excluded under the Australian Consumer Law.",
        ],
      },
      {
        heading: "Contact",
        body: [
          "Questions about these terms can be sent through our contact page. Please include your name, contact details, and enough information for us to identify the relevant vehicle or enquiry.",
        ],
      },
    ],
  },
  "privacy-policy": {
    title: "Privacy Policy",
    summary:
      "This policy explains how Cars365 collects, uses, discloses, stores, and protects personal information when you use our website and contact us about a vehicle.",
    sections: [
      {
        heading: "Personal information we collect",
        body: [
          "We collect information you provide directly when you enquire, request finance or a trade-in, book an inspection, or subscribe to updates, together with information generated automatically as you use the website.",
        ],
        bullets: [
          "Contact details you give us, such as your name, phone number, and email address.",
          "Enquiry details, such as the vehicle you are interested in, your message, finance or trade-in information you choose to share, and any photos you upload.",
          "Technical and security data, such as IP-derived identifiers, device and browser metadata, and anti-spam and rate-limit events.",
          "Records of our communications with you and the status of your enquiry in our system.",
        ],
      },
      {
        heading: "How we use information",
        body: [
          "We use personal information to respond to your enquiry, provide information about vehicles and related services, arrange finance or trade-in appraisals where you ask us to, complete a sale, provide support, and meet our legal obligations.",
          "With your consent, we may send you updates about new stock or offers. You can opt out of marketing at any time. We may also use aggregated or de-identified data to understand demand and improve the website.",
        ],
      },
      {
        heading: "Disclosure",
        body: [
          "We may share your details with service providers who help us operate, such as hosting, database, email, finance and insurance partners (only where you have asked us to arrange finance or a trade-in), analytics, and bot protection. They may use the information only to provide their service to us.",
          "We do not sell your personal information. We may disclose information where required or permitted by law.",
        ],
      },
      {
        heading: "Security and retention",
        body: [
          "We use technical and organisational controls such as role-based access, row-level security, audit logging, rate limiting, and encrypted transport to protect personal information.",
          "We keep personal information only for as long as needed to respond to your enquiry, complete any sale, meet legal and accounting obligations, and resolve disputes. Enquiry contact details are anonymised once they are no longer required.",
        ],
      },
      {
        heading: "Access, correction, and complaints",
        body: [
          "You may request access to or correction of the personal information we hold about you. We may need to verify your identity before acting on a request.",
          "If you believe we have mishandled your personal information, please contact us first so we can investigate. If the matter is unresolved, you may contact the Office of the Australian Information Commissioner.",
        ],
      },
    ],
  },
  disclaimer: {
    title: "Website Disclaimer",
    summary:
      "This disclaimer explains what to understand before relying on the vehicle information published on the Cars365 website.",
    sections: [
      {
        heading: "Vehicle listings",
        body: [
          "Vehicle listings are provided in good faith to help you decide whether to enquire. While we aim to keep details accurate and current, specifications, features, condition, pricing, and availability can change, and a vehicle may be sold before its listing is updated.",
          "Before committing to buy, please confirm the vehicle's price, on-road costs, condition, service history, and any warranty directly with our team and, where relevant, arrange your own inspection.",
        ],
      },
      {
        heading: "Estimates only",
        body: [
          "Finance repayment estimates and trade-in figures shown on the website are indicative only. They are not an offer, are subject to approval and inspection, and may differ from the final amount.",
        ],
      },
      {
        heading: "Consumer rights",
        body: [
          "This disclaimer does not limit any rights you have under the Australian Consumer Law or other laws that cannot be excluded. Where we supply a vehicle to you, we remain responsible for the legal obligations that apply to that sale.",
        ],
      },
    ],
  },
};

export async function generateStaticParams() {
  return Object.keys(policies).map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const policy = policies[slug];

  if (!policy) {
    return {};
  }

  return {
    title: policy.title,
    description: policy.summary,
  };
}

export default async function LegalPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const policy = policies[slug];

  if (!policy) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-muted">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
        <p className="text-sm font-semibold uppercase tracking-wide text-amber-600">
          Last updated {updatedAt}
        </p>
        <h1 className="mt-3 text-3xl font-semibold text-slate-950">{policy.title}</h1>
        <p className="mt-3 text-base leading-7 text-slate-600">{policy.summary}</p>

        <div className="mt-8 space-y-5">
          {policy.sections.map((section) => (
            <section key={section.heading} className="rounded-lg border border-border bg-card p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-950">{section.heading}</h2>
              <div className="mt-3 space-y-3 text-sm leading-6 text-muted-foreground">
                {section.body.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
                {section.bullets && (
                  <ul className="list-disc space-y-2 pl-5">
                    {section.bullets.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                )}
              </div>
            </section>
          ))}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
