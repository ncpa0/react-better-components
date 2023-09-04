import type { Dependency } from "./effect";
import type { LifecycleEvents } from "./lifecycle";

export class Computed<T> {
  private _value!: T;
  private _lastKnownDepValues!: any[];

  public constructor(
    private readonly lifecycle: LifecycleEvents,
    private readonly forceRender: () => void,
    private readonly callback: () => T,
    private readonly deps?: Dependency[],
  ) {
    this._value = this.callback();

    if (deps == null) {
      this.lifecycle.onUpdate(this.recalculate);
    } else {
      this.subscribeToDeps(deps);
    }
  }

  private recalculate = () => {
    const nv = this.callback();

    if (!Object.is(nv, this._value)) {
      this._value = nv;
      this.forceRender();
    }
  };

  private handleDepUpdate = () => {
    let shouldRunCallback = false;

    const depsCount = this._lastKnownDepValues.length;
    for (let i = 0; i < depsCount; i++) {
      const value = this.deps![i]!.get();

      if (!Object.is(value, this._lastKnownDepValues[i])) {
        shouldRunCallback = true;
        this._lastKnownDepValues[i] = value;
      }
    }

    if (shouldRunCallback) {
      this.recalculate();
    }
  };

  private subscribeToDeps(deps: Dependency[]) {
    if (deps.length === 0) {
      return;
    }

    this._lastKnownDepValues = deps.map((d) => d.get());

    this.lifecycle.onUpdate(this.handleDepUpdate);
  }

  public get() {
    return this._value;
  }

  public [Symbol.iterator](): Iterator<any> {
    const self = this;
    return (function* () {
      yield String(self.get());
      return;
    })();
  }
}
