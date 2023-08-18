import type { LifecycleEvents } from "./lifecycle";

export type EffectDependency<T = unknown> = {
  get: () => T;
};

const noop = () => {};

export class Effect {
  private cleanupCb = noop;
  private lastKnownDepValues!: any[];

  public constructor(
    private readonly lifecycle: LifecycleEvents,
    private readonly callback: () => void | (() => void),
    private readonly deps?: EffectDependency[],
  ) {
    this.lifecycle.onMount(this.runCallback);

    if (deps == null) {
      this.lifecycle.onUpdate(this.runCallback);
    } else {
      this.subscribeToDeps(deps);
    }

    this.lifecycle.onUnmount(this.runCleanup);
  }

  private runCleanup = () => {
    this.cleanupCb();
    this.cleanupCb = noop;
  };

  private runCallback = () => {
    this.runCleanup();
    this.cleanupCb = this.callback() ?? noop;
  };

  private handleDepUpdate = () => {
    let shouldRunCallback = false;

    const depsCount = this.lastKnownDepValues.length;
    for (let i = 0; i < depsCount; i++) {
      const value = this.deps![i]!.get();

      if (!Object.is(value, this.lastKnownDepValues[i])) {
        shouldRunCallback = true;
        this.lastKnownDepValues[i] = value;
      }
    }

    if (shouldRunCallback) {
      this.runCallback();
    }
  };

  private subscribeToDeps(deps: EffectDependency[]) {
    if (deps.length === 0) {
      return;
    }

    this.lastKnownDepValues = deps.map((d) => d.get());

    this.lifecycle.onUpdate(this.handleDepUpdate);
  }

  public cancel(preventCleanup = false) {
    if (!preventCleanup) {
      this.runCleanup();
    }

    this.lifecycle.offMount(this.runCallback);
    this.lifecycle.offUpdate(this.runCallback);
    this.lifecycle.offUpdate(this.handleDepUpdate);
    this.lifecycle.offUnmount(this.runCleanup);
  }

  public forceUpdate() {
    this.runCallback();
  }
}
