"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

/** Hero free-text search → forwards to the inventory listing. */
export function HeroSearch() {
  const router = useRouter();
  const [q, setQ] = useState("");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    router.push(q.trim() ? `/used-cars?q=${encodeURIComponent(q.trim())}` : "/used-cars");
  }

  return (
    <form onSubmit={submit} className="flex w-full max-w-xl items-center gap-2 rounded-xl bg-card p-2 shadow-lg">
      <div className="flex flex-1 items-center gap-2 pl-2">
        <Search className="size-5 text-muted-foreground" />
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search make, model or keyword…"
          aria-label="Search cars"
          className="w-full bg-transparent py-2 text-foreground outline-none placeholder:text-muted-foreground"
        />
      </div>
      <button type="submit" className="rounded-lg bg-primary px-5 py-2.5 font-semibold text-primary-foreground hover:bg-primary-hover">
        Search
      </button>
    </form>
  );
}
