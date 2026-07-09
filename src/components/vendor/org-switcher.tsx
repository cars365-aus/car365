"use client";

import { useRouter } from "next/navigation";

export function OrgSwitcher({
  organizations,
  selectedOrgId,
  basePath,
}: {
  organizations: Array<{ id: string; name: string }>;
  selectedOrgId: string;
  basePath: string;
}) {
  const router = useRouter();

  if (organizations.length <= 1) return null;

  return (
    <select
      className="rounded-xl border border-input bg-background px-3 py-2 text-sm text-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/50 transition-all"
      value={selectedOrgId}
      onChange={(e) => {
        router.push(`${basePath}?org=${e.target.value}`);
      }}
    >
      {organizations.map((org) => (
        <option key={org.id} value={org.id}>
          {org.name}
        </option>
      ))}
    </select>
  );
}
