// Ours go after theirs on each event, and an event left with no hook is dropped.
export const withOurHooks = (
  theirs: Iterable<[string, object[]]>,
  ours: Record<string, object[]>,
): Record<string, object[]> => {
  const hooks = new Map(theirs);

  for (const [event, list] of Object.entries(ours)) {
    hooks.set(event, [...hooks.get(event) ?? [], ...list]);
  }

  const kept = [...hooks]
    .filter(([, list]) => {
      return list.length > 0;
    });

  return Object.fromEntries(kept);
};
