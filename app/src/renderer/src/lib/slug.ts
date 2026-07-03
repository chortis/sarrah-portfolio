export function slugify(input: string): string {
  const base = input
    .toLowerCase()
    .trim()
    .replace(/['"]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return base || 'item'
}

export function uniqueSlug(desired: string, existing: Set<string>): string {
  if (!existing.has(desired)) return desired
  let n = 2
  while (existing.has(`${desired}-${n}`)) n++
  return `${desired}-${n}`
}
