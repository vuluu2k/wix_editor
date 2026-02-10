import { toRaw } from 'vue'

/**
 * Deep clone a value. Uses JSON serialization to safely handle
 * Vue reactive proxies (structuredClone fails on Proxy objects).
 */
export function cloneDeep<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}
