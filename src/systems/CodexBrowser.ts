/** Pure filtering keeps large weapon catalogs independent from the rendered window. */
export function filterCodexEntries<T extends { name: string; tags: readonly string[] }>(
  entries: readonly T[],
  query: string,
  selectedTags: readonly string[],
): T[] {
  const search = query.trim().normalize('NFKC').toLocaleLowerCase();
  return entries.filter(
    (e) => (!search || e.name.normalize('NFKC').toLocaleLowerCase().includes(search)) && selectedTags.every((tag) => e.tags.includes(tag)),
  );
}
