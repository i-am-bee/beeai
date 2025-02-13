export const noop = () => {};

/**
 * Predicate that tests if input value is not null.
 *
 * @example
 * const arr: (string | null)[] = ...;
 * const filtered = arr.filter(isNotNull); // filtered is correctly narrowed to string[]
 *
 * @param value nullable value
 * @returns true if value is not null of undefined
 */
export function isNotNull<T>(value: T | null | undefined): value is T {
  return value != null;
}
