import type { EffectDependency } from "./modules/effect";

/**
 * Creates a dependency from a component property that can be used in
 * an effect.
 *
 * @example
 *   this.$effect(() => {}, [pdep(() => this.props.label)]);
 */
export const pdep = <T>(getProp: () => T): EffectDependency<T> => {
  return {
    get: getProp,
  };
};
