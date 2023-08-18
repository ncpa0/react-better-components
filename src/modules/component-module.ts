import type {
  BetterComponent,
  PropsAsDependencies,
} from "../better-component";
import { pdep } from "../pdep";
import type { Computed } from "./computed";
import type { Dependency } from "./effect";
import type { Reducer } from "./reducer";
import type { State } from "./state";

export type ComponentModuleParam = {
  setModule(mod: ComponentModule<any, any>): void;
};

export class ComponentModule<
  Args extends any[] = [],
  Props extends object = {},
> {
  private _main!: BetterComponent;

  readonly props!: Props;
  readonly args!: Args;

  /**
   * A proxy that can be used to get $effect dependencies for the
   * component props.
   *
   * @example
   *   class MyComponent extends BetterComponent<{
   *     label: string;
   *   }> {
   *     constructor(props) {
   *       super(props);
   *
   *       this.$effect(() => {
   *         console.log("Label changed:", this.props.label);
   *       }, [this.depend.label]);
   *     }
   *   }
   */
  protected depend: PropsAsDependencies<Props>;

  constructor(params: ComponentModuleParam) {
    params.setModule(this);

    this.depend = new Proxy(
      {},
      {
        get: (_: any, propName: string) => {
          return pdep(
            () =>
              this.props[propName as keyof (typeof this)["props"]],
          );
        },
      },
    );
  }

  public $state<T>(initialValue: T | (() => T)): State<T>;
  public $state<T = undefined>(): State<T | undefined>;
  public $state<T>(initialValue?: T) {
    return this._main.$state(initialValue);
  }

  public $reducer<A extends object, T = undefined>(
    actionsClass: new () => A,
  ): Reducer<T, A>;
  public $reducer<A extends object, T>(
    initialValue: T,
    actionsClass: new () => A,
  ): Reducer<T, A>;
  public $reducer(...args: any[]) {
    // @ts-expect-error
    return this._main.$reducer(...args);
  }

  public $effect(
    callback: () => void | (() => void),
    deps?: Dependency[],
  ) {
    return this._main.$effect(callback, deps);
  }

  public $computed<T>(
    callback: () => T,
    deps?: Dependency[],
  ): Computed<T> {
    return this._main.$computed(callback, deps);
  }

  public $mod<Args extends any[] = [], Props extends object = {}>(
    Module: new (
      params: ComponentModuleParam,
    ) => ComponentModule<Args, Props>,
    ...args: Args
  ): ComponentModule<Args, Props> {
    return this._main.$mod(Module, ...args);
  }
}
