/** Basic typed-answer matching: ignores case, surrounding whitespace and punctuation. */
export function normalizeAnswer(s: string) {
  return s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\p{P}\p{S}]/gu, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function answersMatch(given: string, expected: string) {
  const g = normalizeAnswer(given);
  return g.length > 0 && g === normalizeAnswer(expected);
}

export function selectionsMatch(selected: Iterable<number>, expected: Iterable<number>) {
  const selectedSet = new Set(selected);
  const expectedSet = new Set(expected);
  return (
    selectedSet.size === expectedSet.size &&
    [...selectedSet].every((index) => expectedSet.has(index))
  );
}

export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
