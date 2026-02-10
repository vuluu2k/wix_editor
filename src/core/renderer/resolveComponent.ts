import { getComponent } from '@/core/registry'
import type { ComponentRegistryEntry } from '@/core/types/registry'

/**
 * Resolve a component registry entry by type string.
 * Returns undefined if the component type is not registered.
 */
export function resolveComponent(type: string): ComponentRegistryEntry | undefined {
  return getComponent(type)
}
