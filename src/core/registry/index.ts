import type { ComponentRegistryEntry } from '@/core/types/registry'

const registry = new Map<string, ComponentRegistryEntry>()

/**
 * Register a component entry into the registry.
 */
export function registerComponent(entry: ComponentRegistryEntry): void {
  registry.set(entry.type, entry)
}

/**
 * Get a component entry by type.
 */
export function getComponent(type: string): ComponentRegistryEntry | undefined {
  return registry.get(type)
}

/**
 * Get all registered component entries.
 */
export function getAllComponents(): ComponentRegistryEntry[] {
  return Array.from(registry.values())
}

/**
 * Check if a component type is registered.
 */
export function hasComponent(type: string): boolean {
  return registry.has(type)
}

// Auto-register built-in components
import { containerComponent } from './builtins/container'
import { textComponent } from './builtins/text'
import { buttonComponent } from './builtins/button'
import { sectionComponent } from './builtins/section'

registerComponent(containerComponent)
registerComponent(textComponent)
registerComponent(buttonComponent)
registerComponent(sectionComponent)
