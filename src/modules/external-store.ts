import { useSyncExternalStore } from "react";
import type { BetterComponent } from "../better-component";

useSyncExternalStore;

export type ExternalStoreParam<T> = {
  setModule(mod: object): void;
  subscribe: (onStoreChange: () => void) => () => void;
  getSnapshot: () => T;
};

export class ExternalStore<T> {
  private _main!: BetterComponent;

  private getSnapshot: () => T;
  private value: T;

  constructor(params: ExternalStoreParam<T>) {
    params.setModule(this);

    this.getSnapshot = params.getSnapshot;
    this.value = this.getSnapshot();

    this._main.$effect(() => {
      const unsubscribe = params.subscribe(() => this.handleUpdate());
      return unsubscribe;
    }, []);
  }

  private handleUpdate() {
    const value = this.getSnapshot();
    if (value !== this.value) {
      this.value = value;
      this._main.forceUpdate();
    }
  }

  public get(): T {
    return this.value;
  }

  [Symbol.iterator](): Iterator<any> {
    const self = this;
    return (function* () {
      yield String(self.get());
      return;
    })();
  }
}
