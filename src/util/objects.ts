/**
 * Represents a possibly deeply-nested JavaScript object.
 *
 * This type requires that all properties are either subtrees (compliant with the same type),
 * or leaf nodes (which are required to be of type TLeaf).
 */
export type DeepTree<TLeaf> = {
  [x: string]: TLeaf | DeepTree<TLeaf>;
};

/**
 * Increments the property located in `obj` by following the access path indicated by `accessors`.
 *
 * If the property, or any object above it in the access path, does not exist, it will be created and
 * initialised to `1` when this function is called.
 *
 * @example
 * ```js
 * const myObj = {};
 * deepIncrement(myObj, 'this', 'is', 'deep');
 * // myObj => { this: { is: { deep: 1 } } }
 * ```
 */
export const deepIncrement = (
  obj: DeepTree<number>,
  ...accessors: string[]
) => {
  deepAdd(obj, 1, ...accessors);
};

/**
 * Adds `incrementBy` to the property located in `obj` by following the access path indicated by `accessors`.
 *
 * If the property, or any object above it in the access path, does not exist, it will be created and
 * initialised to `0 + incrementBy` when this function is called.
 *
 * @example
 * ```js
 * const myObj = {};
 * deepAdd(myObj, 25, 'this', 'is', 'deep');
 * // myObj => { this: { is: { deep: 25 } } }
 * ```
 */
export const deepAdd = (
  obj: DeepTree<number>,
  incrementBy: number,
  ...accessors: string[]
) => {
  getDeepPropertyAccessor(obj, ...accessors).write(
    (x) => (x ?? 0) + incrementBy
  );
};

/**
 * Returns the value of the property located in `obj` by following the access path indicated by `accessors`.
 * @example
 * ```js
 * const myObj = { this: { is: { deep: 'hello' } } };
 * getDeepProperty(myObj, 'this', 'is', 'deep')
 * // => 'hello'
 * ```
 */
export const getDeepProperty = <TLeaf>(
  obj: DeepTree<TLeaf>,
  ...accessors: string[]
) => getDeepPropertyAccessor(obj, ...accessors).read();

/**
 * Transforms the value of the property located in `obj` by following the access path indicated by `accessors`,
 * by applying the result of `transformationFunction` when executed.
 *
 * The transformation function is provided with the
 * original value of the property (if it exists), or `undefined`, if the property has not previously been defined.
 *
 * If the property, or any object above it in the access path, does not exist, it will be created upon first write.
 *
 * This function returns the new value of the property.
 * @example
 * ```js
 * const myObj = { this: { is: { deep: 'hello' } } };
 * transformDeepProperty(myObj, v => v + ' world!', 'this', 'is', 'deep')
 * // => 'hello world!'
 * ```
 */
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

/**
 * Returns an accessor interface that allows the caller to read and write the value of a deep property of `obj`,
 * that is found by following the path indicated by `accessors`.
 *
 * If the property, or any object above it in the access path, does not exist, it will be created upon first write.
 *
 * This function returns the new value of the property.
 * @example
 * ```js
 * const myObj = { this: { is: { deep: 'hello' } } };
 * const accessor = getDeepPropertyAccessor(myObj, 'this', 'is', 'deep');
 * const value = accessor.read();
 * // value => 'hello'
 * const newValue = accessor.write(v => v + ' world!')
 * // newValue (and also now, accessor.read()) => 'hello world!'
 * ```
 */
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
