export interface BlogTopic {
  key: string;
  title: string;
  categorySlug: string;
  primaryKeyword: string;
  citySlug?: string;
}

/** Curated rotating topics for the daily SEO blog bot. */
export const BLOG_TOPICS: BlogTopic[] = [
  { key: "road-trip-perth", title: "Best Road Trips from Perth for Car Hire Travellers", categorySlug: "road-trip-guides", primaryKeyword: "road trips from Perth", citySlug: "perth" },
  { key: "road-trip-sydney", title: "Top Weekend Road Trips from Sydney by Rental Car", categorySlug: "road-trip-guides", primaryKeyword: "road trips from Sydney", citySlug: "sydney" },
  { key: "road-trip-melbourne", title: "Scenic Drives and Road Trips from Melbourne", categorySlug: "road-trip-guides", primaryKeyword: "road trips from Melbourne", citySlug: "melbourne" },
  { key: "road-trip-brisbane", title: "Best Queensland Road Trips Starting in Brisbane", categorySlug: "road-trip-guides", primaryKeyword: "road trips from Brisbane", citySlug: "brisbane" },
  { key: "road-trip-adelaide", title: "Wine Country and Coastal Road Trips from Adelaide", categorySlug: "road-trip-guides", primaryKeyword: "road trips from Adelaide", citySlug: "adelaide" },
  { key: "road-trip-gold-coast", title: "Gold Coast to Hinterland Road Trip Ideas", categorySlug: "road-trip-guides", primaryKeyword: "Gold Coast road trip", citySlug: "gold-coast" },
  { key: "road-trip-cairns", title: "Tropical North Queensland Road Trips from Cairns", categorySlug: "road-trip-guides", primaryKeyword: "Cairns road trip", citySlug: "cairns" },
  { key: "road-trip-hobart", title: "Tasmania Road Trip Planner Starting in Hobart", categorySlug: "road-trip-guides", primaryKeyword: "Tasmania road trip", citySlug: "hobart" },
  { key: "hire-vs-rideshare-sydney", title: "Car Hire vs Rideshare in Sydney: Which Saves More?", categorySlug: "car-rental-tips", primaryKeyword: "car hire vs rideshare Sydney", citySlug: "sydney" },
  { key: "hire-vs-rideshare-melbourne", title: "When Car Hire Beats Rideshare in Melbourne", categorySlug: "car-rental-tips", primaryKeyword: "car hire Melbourne", citySlug: "melbourne" },
  { key: "first-time-car-hire-australia", title: "First-Time Car Hire in Australia: Complete Guide", categorySlug: "car-rental-tips", primaryKeyword: "first time car hire Australia" },
  { key: "car-hire-insurance-australia", title: "Understanding Car Hire Insurance in Australia", categorySlug: "car-rental-tips", primaryKeyword: "car hire insurance Australia" },
  { key: "one-way-car-hire-australia", title: "One-Way Car Hire in Australia: What to Know", categorySlug: "car-rental-tips", primaryKeyword: "one way car hire Australia" },
  { key: "airport-car-hire-tips", title: "Airport Car Hire Tips for Australian Travellers", categorySlug: "car-rental-tips", primaryKeyword: "airport car hire Australia" },
  { key: "long-term-car-hire", title: "Long-Term Car Hire: Flexible Options in Australia", categorySlug: "car-rental-tips", primaryKeyword: "long term car hire Australia" },
  { key: "cheap-car-hire-tips", title: "How to Find Cheap Car Hire in Australia", categorySlug: "car-rental-tips", primaryKeyword: "cheap car hire Australia" },
  { key: "sydney-car-hire-guide", title: "Sydney Car Hire Guide: CBD, Airport and Suburbs", categorySlug: "city-guides", primaryKeyword: "car hire Sydney", citySlug: "sydney" },
  { key: "melbourne-car-hire-guide", title: "Melbourne Car Hire Guide for Visitors and Locals", categorySlug: "city-guides", primaryKeyword: "car hire Melbourne", citySlug: "melbourne" },
  { key: "brisbane-car-hire-guide", title: "Brisbane Car Hire: Best Areas to Pick Up a Rental", categorySlug: "city-guides", primaryKeyword: "car hire Brisbane", citySlug: "brisbane" },
  { key: "perth-car-hire-guide", title: "Perth Car Hire Guide for WA Explorers", categorySlug: "city-guides", primaryKeyword: "car hire Perth", citySlug: "perth" },
  { key: "darwin-car-hire-guide", title: "Darwin Car Hire for Outback and Top End Trips", categorySlug: "city-guides", primaryKeyword: "car hire Darwin", citySlug: "darwin" },
  { key: "canberra-car-hire-guide", title: "Canberra Car Hire for Capital Territory Travel", categorySlug: "city-guides", primaryKeyword: "car hire Canberra", citySlug: "canberra" },
  { key: "driving-australia-highways", title: "Driving on Australian Highways: Safety and Etiquette", categorySlug: "driving-advice", primaryKeyword: "driving Australian highways" },
  { key: "outback-driving-tips", title: "Outback Driving Tips for Rental Car Travellers", categorySlug: "driving-advice", primaryKeyword: "outback driving Australia" },
  { key: "fuel-saving-rental-car", title: "Fuel-Saving Tips When Driving a Rental Car", categorySlug: "driving-advice", primaryKeyword: "fuel saving rental car" },
  { key: "parking-australia-cities", title: "City Parking Tips for Rental Car Drivers", categorySlug: "driving-advice", primaryKeyword: "parking rental car Australia" },
  { key: "toll-roads-australia", title: "Toll Roads in Australia: A Rental Car Driver's Guide", categorySlug: "driving-advice", primaryKeyword: "toll roads Australia rental car" },
  { key: "family-road-trip-checklist", title: "Family Road Trip Checklist for Car Hire Holidays", categorySlug: "travel-planning", primaryKeyword: "family road trip Australia" },
  { key: "business-travel-car-hire", title: "Business Travel Car Hire: Smart Booking Tips", categorySlug: "travel-planning", primaryKeyword: "business car hire Australia" },
  { key: "holiday-car-hire-planning", title: "Planning a Holiday Around Your Rental Car", categorySlug: "travel-planning", primaryKeyword: "holiday car hire planning" },
  { key: "best-suv-road-trips", title: "Why an SUV Is Perfect for Australian Road Trips", categorySlug: "vehicle-guides", primaryKeyword: "SUV hire Australia", citySlug: "perth" },
  { key: "people-mover-family-hire", title: "People Mover Hire for Large Family Holidays", categorySlug: "vehicle-guides", primaryKeyword: "people mover hire Australia" },
  { key: "ute-hire-weekend", title: "Ute Hire for Weekend Projects and Getaways", categorySlug: "vehicle-guides", primaryKeyword: "ute hire Australia" },
  { key: "luxury-car-hire-occasions", title: "Luxury Car Hire for Special Occasions in Australia", categorySlug: "vehicle-guides", primaryKeyword: "luxury car hire Australia" },
  { key: "van-hire-moving-travel", title: "Van Hire in Australia: Moving and Road Trip Uses", categorySlug: "vehicle-guides", primaryKeyword: "van hire Australia" },
  { key: "sedan-vs-suv-hire", title: "Sedan vs SUV: Choosing the Right Rental Car", categorySlug: "vehicle-guides", primaryKeyword: "sedan vs SUV car hire" },
  { key: "electric-hybrid-car-hire", title: "Electric and Hybrid Car Hire in Australia", categorySlug: "vehicle-guides", primaryKeyword: "hybrid car hire Australia" },
  { key: "pre-pickup-inspection", title: "What to Check Before Driving Away in a Rental Car", categorySlug: "car-rental-tips", primaryKeyword: "rental car inspection checklist" },
  { key: "returning-rental-car", title: "Returning a Rental Car: Avoid Extra Charges", categorySlug: "car-rental-tips", primaryKeyword: "returning rental car tips" },
  { key: "car-hire-age-requirements", title: "Age Requirements and Young Driver Car Hire in Australia", categorySlug: "car-rental-tips", primaryKeyword: "car hire age Australia" },
  { key: "compare-local-operators", title: "Why Comparing Local Car Hire Operators Saves Money", categorySlug: "car-rental-tips", primaryKeyword: "compare car hire operators Australia" },
  { key: "road-trip-great-ocean", title: "Great Ocean Road Trip: Car Hire Planning Guide", categorySlug: "road-trip-guides", primaryKeyword: "Great Ocean Road car hire", citySlug: "melbourne" },
  { key: "road-trip-blue-mountains", title: "Blue Mountains Day Trip by Rental Car from Sydney", categorySlug: "road-trip-guides", primaryKeyword: "Blue Mountains car hire", citySlug: "sydney" },
  { key: "road-trip-barossa", title: "Barossa Valley Wine Tour by Rental Car", categorySlug: "road-trip-guides", primaryKeyword: "Barossa Valley car hire", citySlug: "adelaide" },
  { key: "road-trip-sunshine-coast", title: "Sunshine Coast Road Trip from Brisbane", categorySlug: "road-trip-guides", primaryKeyword: "Sunshine Coast car hire", citySlug: "brisbane" },
  { key: "road-trip-south-west-wa", title: "South West WA Road Trip from Perth", categorySlug: "road-trip-guides", primaryKeyword: "South West WA car hire", citySlug: "perth" },
  { key: "winter-driving-australia", title: "Winter Driving Tips for Rental Cars in Australia", categorySlug: "driving-advice", primaryKeyword: "winter driving Australia" },
  { key: "summer-road-trip-safety", title: "Summer Road Trip Safety for Car Hire Travellers", categorySlug: "driving-advice", primaryKeyword: "summer road trip Australia" },
  { key: "pet-friendly-car-hire", title: "Travelling with Pets in a Rental Car in Australia", categorySlug: "travel-planning", primaryKeyword: "pet friendly car hire Australia" },
  { key: "regional-car-hire-benefits", title: "Benefits of Hiring from Regional Australian Operators", categorySlug: "car-rental-tips", primaryKeyword: "regional car hire Australia" },
];

/** Internal link targets for AI prompts. */
export function getInternalLinkSuggestions(): { href: string; label: string }[] {
  const cities = [
    "sydney", "melbourne", "brisbane", "perth", "adelaide",
    "gold-coast", "cairns", "darwin", "hobart", "canberra",
  ];
  const categories = ["sedan", "suv", "people-mover", "van", "ute", "luxury"];

  const links: { href: string; label: string }[] = [
    { href: "/search", label: "Browse rental cars" },
    { href: "/locations", label: "Car hire locations" },
    { href: "/pricing", label: "Pricing" },
  ];

  for (const city of cities) {
    links.push({ href: `/locations/${city}`, label: `Car hire in ${city.replace(/-/g, " ")}` });
  }
  for (const cat of categories) {
    links.push({ href: `/categories/${cat}`, label: `${cat.replace(/-/g, " ")} hire` });
  }

  return links;
}

export function pickNextTopic(recentTopicKeys: string[]): BlogTopic {
  const recent = new Set(recentTopicKeys);
  const unused = BLOG_TOPICS.filter((t) => !recent.has(t.key));
  const pool = unused.length > 0 ? unused : BLOG_TOPICS;
  const dayIndex = Math.floor(Date.now() / 86_400_000) % pool.length;
  return pool[dayIndex]!;
}
