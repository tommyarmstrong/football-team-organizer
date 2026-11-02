/**
 * PostgREST returns an embedded to-one relation as an object, but the
 * generated types and some query shapes describe it as an array. Normalise
 * either shape to the single related row (or null).
 */
export function one<T>(value: T | readonly T[] | null | undefined): T | null {
  if (value == null) return null;
  if (Array.isArray(value)) return (value[0] as T | undefined) ?? null;
  return value as T;
}
