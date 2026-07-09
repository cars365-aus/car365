export function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 72);
}

export function uniqueSlug(base: string) {
  const slug = slugify(base);
  const suffix = Math.random().toString(36).slice(2, 7);

  return `${slug || "item"}-${suffix}`;
}
