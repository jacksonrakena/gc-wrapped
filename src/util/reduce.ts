export const groupBy = <TElement, TGroupKey extends string>(
  array: TElement[],
  groupKey: (e: TElement) => TGroupKey
) => {
  return array.reduce(
    (gMap: { [key: string]: TElement[] }, nextElement: TElement) => {
      const key = groupKey(nextElement);
      return { ...gMap, [key]: [...(gMap[key] ?? []), nextElement] };
    },
    {}
  );
};
