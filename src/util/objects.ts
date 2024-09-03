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
  deep(obj, (x) => (x ?? 0) + incrementBy, ...accessors);
};

export const deep = <TLeaf>(
  obj: DeepTree<TLeaf>,
  transform: (original: TLeaf | undefined) => TLeaf,
  ...accessors: string[]
) => {
  let cur: DeepTree<TLeaf> = obj;
  for (let i = 0; i < accessors.length - 1; i++) {
    const accessor = accessors[i];
    if (!cur[accessor]) cur[accessor] = {};
    cur = cur[accessor];
  }
  cur[accessors[accessors.length - 1]] = transform(
    cur[accessors[accessors.length - 1]] as TLeaf
  );
};
