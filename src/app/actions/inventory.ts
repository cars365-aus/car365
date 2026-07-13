"use server";

import { getModelsForMake } from "@/lib/data/inventory";

export async function fetchModels(makeSlug: string) {
  return await getModelsForMake(makeSlug);
}
