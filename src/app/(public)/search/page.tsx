import { redirect } from "next/navigation";

/**
 * The dedicated /search route now forwards into the main inventory listing,
 * which owns filtering + free-text search over the used-car schema.
 */
export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q : "";
  redirect(q ? `/used-cars?q=${encodeURIComponent(q)}` : "/used-cars");
}
