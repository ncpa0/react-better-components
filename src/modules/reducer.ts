import type { LifecycleEvents } from "./lifecycle";
import { State } from "./state";

export type ReducerActionsOf<T, C extends object> = {
  [K in keyof C as C[K] extends (state: T, ...args: any[]) => T
    ? K
    : never]: C[K];
};

export type PublicOf<T> = {
  [K in keyof T]: T[K];
};

type MappedAction<A> = A extends (
  state: any,
  ...args: infer Args
) => infer R
  ? (...args: Args) => R
  : never;

type MappedActions<A extends object> = {
  [K in keyof A]: MappedAction<A[K]>;
};

export type Reducer<T, A extends object> = PublicOf<State<T>> &
  MappedActions<ReducerActionsOf<T, A>>;

export const createReducerState = <T, A extends object>(
  lifecycle: LifecycleEvents,
  name: string,
  getState: () => Record<string, any>,
  setState: (
    state:
      | Record<string, any>
      | ((prev: Record<string, any>) => Record<string, any>),
  ) => void,
  actionsClass: new () => A,
  initialValue?: T,
): Reducer<T, A> => {
  const state = new State<T>(
    lifecycle,
    name,
    getState,
    setState,
    initialValue,
  );

  const actions = new actionsClass();

  const stateGetter = () => state.get();
  const stateSetter = (value: T | ((prev: T) => T)) =>
    state.set(value);
  const getIterator = () => state[Symbol.iterator]();

  return new Proxy(actions, {
    get(actions, key: any) {
      switch (key) {
        case "get":
          return stateGetter;
        case "set":
          return stateSetter;
        case Symbol.iterator:
          return getIterator;
      }

      return (...args: any[]) => {
        return state.set((currentValue) => {
          // @ts-expect-error
          return actions[key](currentValue, ...args);
        });
      };
    },
  }) as any;
};
