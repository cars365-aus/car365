export const SEO_BASE_URL = "https://www.cars365.info";

export const THIN_PAGE_THRESHOLDS = {
  city: 5,
  cityCategory: 3,
  brand: 3,
  categoryNational: 10,
} as const;

/** Optional curated overrides for known cities (slug → meta). */
export const CITY_META_OVERRIDES: Record<
  string,
  { title: string; state: string; description: string }
> = {
  sydney: {
    title: "Sydney",
    state: "NSW",
    description:
      "Find cheap car hire in Sydney, NSW — compare vehicles from verified local operators in the CBD, North Shore, Western Suburbs and more.",
  },
  melbourne: {
    title: "Melbourne",
    state: "VIC",
    description:
      "Car hire in Melbourne, VIC. Browse rental cars from verified operators across the CBD, Bayside, Dandenong ranges and surrounding suburbs.",
  },
  brisbane: {
    title: "Brisbane",
    state: "QLD",
    description:
      "Rental cars in Brisbane, QLD — compare vehicles in the CBD, Southbank, Ipswich and nearby suburbs from trusted local operators.",
  },
  perth: {
    title: "Perth",
    state: "WA",
    description:
      "Car hire in Perth, WA. Compare vehicles near the CBD, Fremantle, Swan Valley and surrounding areas from verified operators.",
  },
  adelaide: {
    title: "Adelaide",
    state: "SA",
    description:
      "Find car hire in Adelaide, SA — browse vehicles across the city and Adelaide Hills from verified local rental companies.",
  },
  "gold-coast": {
    title: "Gold Coast",
    state: "QLD",
    description:
      "Car hire on the Gold Coast, QLD — compare vehicles near Surfers Paradise, Broadbeach, Coolangatta from local operators.",
  },
  cairns: {
    title: "Cairns",
    state: "QLD",
    description:
      "Car hire in Cairns, QLD — explore the Great Barrier Reef and Tropical North with vehicles from verified local operators.",
  },
  darwin: {
    title: "Darwin",
    state: "NT",
    description:
      "Car hire in Darwin, NT — discover the Top End and Kakadu with vehicles from trusted Northern Territory operators.",
  },
  hobart: {
    title: "Hobart",
    state: "TAS",
    description:
      "Car hire in Hobart, TAS — explore Tasmania with vehicles from verified Hobart operators, near the CBD and surrounds.",
  },
  canberra: {
    title: "Canberra",
    state: "ACT",
    description:
      "Car hire in Canberra, ACT — compare vehicles across the capital territory from verified local rental operators.",
  },
  newcastle: {
    title: "Newcastle",
    state: "NSW",
    description:
      "Car hire in Newcastle, NSW — browse vehicles near the Hunter Valley and Lake Macquarie from local operators.",
  },
  wollongong: {
    title: "Wollongong",
    state: "NSW",
    description:
      "Car hire in Wollongong, NSW — explore the Illawarra coast and escarpment with vehicles from local operators.",
  },
};
