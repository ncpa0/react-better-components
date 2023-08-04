import type { ReactNode } from "react";
import React from "react";
import { Effect } from "./modules/effect";
import { LifecycleEvents } from "./modules/lifecycle";
import type { PublicOf, Reducer } from "./modules/reducer";
import { createReducerState } from "./modules/reducer";
import { State } from "./modules/state";

export abstract class BetterComponent<
  P extends object = {},
> extends React.Component<P> {
  public state: Record<string, any> = {};

  private _nextStateId = 1;
  private _lifecycle = new LifecycleEvents();

  constructor(props: Readonly<P> | P) {
    super(props);

    const injectedContexts = Object.entries(props).filter(([k]) =>
      k.startsWith("__ctx_"),
    );

    for (let i = 0; i < injectedContexts.length; i++) {
      const [key, value] = injectedContexts[i]!;
      const fieldName = key.slice("__ctx_".length);

      Object.defineProperty(this, fieldName, {
        configurable: true,
        enumerable: true,
        value: value,
      });

      let lastCtxValue = value;
      this._lifecycle.onUpdate(() => {
        // @ts-expect-error
        const currentCtxValue = this.props[key];
        if (currentCtxValue !== lastCtxValue) {
          Object.defineProperty(this, fieldName, {
            configurable: true,
            enumerable: true,
            value: currentCtxValue,
          });
          this.forceUpdate();
        }
        lastCtxValue = currentCtxValue;
      });
    }
  }

  public componentDidMount(): void {
    this._lifecycle.mount();
  }

  public componentDidUpdate(): void {
    this._lifecycle.update();
  }

  public componentWillUnmount(): void {
    this._lifecycle.unmount();
  }

  protected $state<T>(initialValue: T | (() => T)): State<T>;
  protected $state<T = undefined>(): State<T | undefined>;
  protected $state<T>(initialValue?: T) {
    return new State(
      this._lifecycle,
      String(this._nextStateId++),
      () => this.state,
      (s) => this.setState(s),
      initialValue,
    );
  }

  protected $reducer<A extends object, T = undefined>(
    actionsClass: new () => A,
  ): Reducer<T, A>;
  protected $reducer<A extends object, T>(
    initialValue: T,
    actionsClass: new () => A,
  ): Reducer<T, A>;
  protected $reducer(...args: any[]) {
    const initialValue = args.length === 1 ? undefined : args[0];
    const actionsClass = args.length === 1 ? args[0] : args[1];

    return createReducerState(
      this._lifecycle,
      String(this._nextStateId++),
      () => this.state,
      (s) => this.setState(s),
      actionsClass,
      initialValue,
    );
  }

  protected $effect(
    callback: () => void | (() => void),
    deps?: PublicOf<State<any>>[],
  ) {
    return new Effect(this._lifecycle, callback, deps?.slice());
  }

  abstract render(): ReactNode;
}
