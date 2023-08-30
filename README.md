# React Better Components

## Usage

```tsx
import { BetterComponent } from "react-better-components";

class BtnClickCounter extends BetterComponent {
  private counter = this.$state(0);

  private handleClick = () => {
    this.counter.set((c) => c + 1);
  };

  public render() {
    return (
      <div>
        <button onClick={this.handleClick}>
          Clicked {this.counter.get()} times
        </button>
      </div>
    );
  }
}
```

### Reducers

Reducer is a state coupled with functions for mutating it's state.

```tsx
import { BetterComponent } from "react-better-components";

class NumberReducer {
  public increment(state: number) {
    return state + 1;
  }

  public decrement(state: number) {
    return state - 1;
  }

  public add(state: number, amount: number) {
    return state + amount;
  }
}

class NumberView extends BetterComponent {
  private number = this.$reducer(0, NumberReducer);

  public render() {
    const increment = () => this.number.increment();
    const decrement = () => this.number.decrement();
    const addTen = () => this.number.add(10);
    return (
      <div>
        <button onClick={increment}>+1</button>
        <button onClick={decrement}>-1</button>
        <button onClick={addTen}>+10</button>
        <div>{this.number.get()}</div>
      </div>
    );
  }
}
```

### Computed Values

Computed values are values that are derived from other reactive values. Whenever it dependency changes, the
computed value will be re-calculated.

```tsx
import { BetterComponent } from "react-better-components";

type Props = {
  multiplyBy: number;
};

class MyComponent extends BetterComponent<Props> {
  private value = this.$state(0);

  private computedValue = this.$computed(() => {
    // This calculation will re-run whenever this.value or
    // this.props.multiplyBy changes.
    return this.value.get() * this.props.multiplyBy;
  }, [this.value, this.depends.multiplyBy]);

  public render() {
    return <div>{this.computedValue.get()}</div>;
  }
}
```

### Effects

Effects are functions that run when a reactive value changes.

```tsx
import { BetterComponent } from "react-better-components";

type Props = {
  value: number;
};

class MyComponent extends BetterComponent<Props> {
  private internalValue = this.$state(0);

  public constructor(props: Props) {
    super(props);

    this.$effect(() => {
      // This will run on mount and whenever this.props.value changes.
    }, [this.depends.value]);

    this.$effect(() => {
      // This will run on mount and whenever this.internalValue changes.
    }, [this.internalValue]);

    this.$effect(() => {
      // This will run on first mount
    }, []);

    this.$effect(() => {
      // This will run on every update
    });
  }

  public render() {
    return (
      <div>
        <div>{this.props.value}</div>
        <div>{this.internalValue.get()}</div>
      </div>
    );
  }
}
```

### External Stores

External stores are reactive values that are not owned by the component.

```tsx
import { BetterComponent } from "react-better-components";

// An example store
class Store<T> extends EventTarget {
  private state: T;

  public constructor(initialState: T) {
    super();
    this.state = initialState;
  }

  public set(v: T) {
    this.state = v;
    this.dispatchEvent(new Event("change"));
  }

  public get() {
    return this.state;
  }

  public subscribe(cb: () => void) {
    this.addEventListener("change", cb);
    return () => this.removeEventListener("change", cb);
  }
}

const store = new Store(1);

class MyComponent extends BetterComponent {
  private externalValue = this.$externalStore(
    (cb) => store.subscribe(cb),
    () => store.get(),
  );

  public render() {
    return <div>{this.externalValue.get()}</div>;
  }
}
```

### Composition (Component Modules)

Component Modules are a way to compose components from smaller classes that have the same API available to them as BetterComponents.

```tsx
import {
  BetterComponent,
  ComponentModule,
  Dependency,
} from "react-better-components";

/**
 * A component module that fetches data from a url. url can be any
 * reactive value, whenever it changes the data will be fetched
 * again.
 */
class UrlFetch extends ComponentModule<[Dependency<string>]> {
  public isLoading = this.$state(false);
  public result = this.$state(null);
  public error = this.$state(null);

  public constructor(params: any) {
    super(params);

    const [url] = this.args;

    this.$effect(() => {
      this.fetchFromUrl();
    }, [url]);
  }

  private fetchFromUrl() {
    const [url] = this.args;

    this.isLoading.set(true);

    fetch(url.get())
      .then((res) => res.json())
      .then((data) => {
        this.result.set(data);
        this.error.set(null);
        this.isLoading.set(false);
      })
      .catch((err) => {
        this.result.set(null);
        this.error.set(err);
        this.isLoading.set(false);
      });
  }
}

type Props = {
  url: string;
};

class MyComponent extends BetterComponent {
  private data = this.$mod(UrlFetch, this.depends.url);

  public render() {
    if (this.data.isLoading.get()) {
      return <div class="loader">Loading...</div>;
    }

    if (this.data.error.get()) {
      return (
        <div class="error-msg">Error: {this.data.error.get()}</div>
      );
    }

    return <div>{this.data.result}</div>;
  }
}
```
