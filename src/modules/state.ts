import type { LifecycleEvents } from "./lifecycle";

const isSetter = <T>(
  v: T | ((prev: T) => T),
): v is (prev: T) => T => {
  return typeof v === "function";
};

export class State<T> {
  public constructor(
    private lifecycle: LifecycleEvents,
    private name: string,
    private getState: () => Record<string, any>,
    private setState: (
      state:
        | Record<string, any>
        | ((prev: Record<string, any>) => Record<string, any>),
    ) => void,
    initialValue?: T,
  ) {
    this.name = `_state${name}`;

    this.lifecycle.onUnmount(() => {
      this.set = () => {};
    });

    this.getState()[this.name] = initialValue;
  }

  public get(): T {
    return this.getState()[this.name];
  }

  public set(value: T | ((prev: T) => T)): void {
    if (isSetter(value)) {
      this.setState((prevState) => {
        return {
          [this.name]: value(prevState[this.name]),
        };
      });
    } else {
      this.setState({
        [this.name]: value,
      });
    }
  }

  [Symbol.iterator](): Iterator<any> {
    const self = this;
    return (function* () {
      yield String(self.get());
      return;
    })();
  }
}
