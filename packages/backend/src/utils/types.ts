/**
 * 数值枚举转数组
 *
 * @example
 * ```ts
 * enum Enum {
 *  A,
 *  B,
 * }
 * const arr = enumToArray(Enum); // [0, 1]
 * ```
 */
export function enumToArray<T extends Record<string, any>>(e: T) {
  return Object.values(e).filter((v) => !isNaN(+v)) as T[keyof T][]
}

/**
 * never 断言
 */
export function assertNever(value: never): never {
  throw new Error(`Unexpected value: ${value}`)
}

/**
 * 深度可选
 */
export type DeepPartial<T> = {
  [P in keyof T]?: DeepPartial<T[P]>
}
