/**
 * Deep object transforms
 */

export type DeepTree<TLeaf> = {
  [x: string]: TLeaf | DeepTree<TLeaf>;
};

export const deepIncrement = (
  obj: DeepTree<number>,
  ...accessors: string[]
) => {
  deepAdd(obj, 1, ...accessors);
};
export const deepAdd = (
  obj: DeepTree<number>,
  incrementBy: number,
  ...accessors: string[]
) => {
  getDeepPropertyAccessor(obj, ...accessors).write(
    (x) => (x ?? 0) + incrementBy
  );
};

export const getDeepProperty = <TLeaf>(
  obj: DeepTree<TLeaf>,
  ...accessors: string[]
) => getDeepPropertyAccessor(obj, ...accessors).read();

export const transformDeepProperty = <TLeaf>(
  obj: DeepTree<TLeaf>,
  transformationFunction: (value: TLeaf | undefined) => TLeaf | undefined,
  ...accessors: string[]
): TLeaf | undefined =>
  getDeepPropertyAccessor(obj, ...accessors).write(transformationFunction);

interface DeepPropertyAccessor<TLeaf> {
  read: () => TLeaf;
  write: (
    transformationFunction: (value: TLeaf | undefined) => TLeaf | undefined
  ) => TLeaf | undefined;
}

const getDeepPropertyAccessor = <TLeaf>(
  obj: DeepTree<TLeaf>,
  ...accessors: string[]
): DeepPropertyAccessor<TLeaf> => {
  let cur: DeepTree<TLeaf> = obj;
  for (let i = 0; i < accessors.length - 1; i++) {
    const accessor = accessors[i];
    if (!cur[accessor]) cur[accessor] = {};
    cur = cur[accessor];
  }
  const finalAccessor = accessors[accessors.length - 1];
  return {
    read: () => cur[finalAccessor] as TLeaf,
    write: (
      transformationFunction: (value: TLeaf | undefined) => TLeaf | undefined
    ): TLeaf | undefined => {
      const value = cur[finalAccessor];
      const transformed = transformationFunction(value as TLeaf);
      if (transformed === undefined) delete cur[finalAccessor];
      else cur[finalAccessor] = transformed;
      return cur[finalAccessor] as TLeaf | undefined;
    },
  };
};
