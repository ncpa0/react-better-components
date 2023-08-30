import {
  act,
  fireEvent,
  render,
  waitFor,
} from "@testing-library/react";
import React from "react";
import { BetterComponent, State } from "../src/index";
import { ComponentModule } from "../src/modules/component-module";

type ButtonProps = {
  onClick?: () => void;
  onLabelChange?: (label: string) => void;
};

class Button extends BetterComponent<ButtonProps> {
  private label = this.$state("Click Me");
  private className = this.$state("btn btn-primary");

  constructor(props: ButtonProps) {
    super(props);

    this.$effect(() => {
      this.props.onLabelChange?.(this.label.get());
    }, [this.label]);
  }

  handleClick = () => {
    this.label.set("Clicked");
    this.props.onClick?.();
  };

  render() {
    return (
      <button
        data-testid="comp-btn"
        className={this.className.get()}
        onClick={this.handleClick}
      >
        {this.label}
      </button>
    );
  }
}

class Store<T> extends EventTarget {
  constructor(private state: T) {
    super();
  }

  get = () => {
    return this.state;
  };

  set = (state: T) => {
    this.state = state;
    this.dispatchEvent(new Event("change"));
  };

  subscribe = (callback: () => void) => {
    this.addEventListener("change", callback);

    return () => {
      this.removeEventListener("change", callback);
    };
  };
}

describe("BetterComponent", () => {
  it("should render the component", async () => {
    const app = render(
      <div>
        <Button />
      </div>,
    );

    expect(app.asFragment()).toMatchSnapshot();
  });

  it("should trigger the effects", async () => {
    const onBtnLabelChange = jest.fn();

    const app = render(
      <div>
        <Button
          onClick={() => {}}
          onLabelChange={onBtnLabelChange}
        />
      </div>,
    );

    const button = await app.findByTestId("comp-btn");

    expect(button).toBeDefined();
    expect(button.textContent).toBe("Click Me");
    expect(button.className).toBe("btn btn-primary");

    fireEvent.click(button);

    await waitFor(async () => {
      const button = await app.findByTestId("comp-btn");
      expect(button.textContent).toBe("Clicked");
      expect(onBtnLabelChange).toHaveBeenCalledWith("Clicked");
    });
  });

  it("should correctly handle reducer states", async () => {
    class NumberReducer {
      increment(state: number) {
        return state + 1;
      }

      decrement(state: number) {
        return state - 1;
      }

      multiply(state: number, payload: number) {
        return state * payload;
      }
    }

    const onCounterChange = jest.fn();

    class Counter extends BetterComponent {
      c = this.$reducer(0, NumberReducer);

      constructor(props: {}) {
        super(props);

        this.$effect(() => {
          onCounterChange(this.c.get());
        }, [this.c]);
      }

      render() {
        return (
          <div>
            <button
              data-testid="inc-btn"
              onClick={() => {
                this.c.increment();
              }}
            >
              Increment
            </button>
            <button
              data-testid="dec-btn"
              onClick={() => {
                this.c.decrement();
              }}
            >
              Decrement
            </button>
            <button
              data-testid="mul-btn"
              onClick={() => {
                this.c.multiply(2);
              }}
            >
              Multiply
            </button>
            <div data-testid="counter-out">{this.c}</div>
          </div>
        );
      }
    }

    const App = () => {
      return (
        <>
          <Counter />
        </>
      );
    };

    const rendered = render(<App />);

    const getCurrentCounter = () => {
      return rendered.getByTestId("counter-out").textContent;
    };

    const clickIncrement = () => {
      fireEvent.click(rendered.getByTestId("inc-btn"));
    };

    const clickDecrement = () => {
      fireEvent.click(rendered.getByTestId("dec-btn"));
    };

    const clickMultiply = () => {
      fireEvent.click(rendered.getByTestId("mul-btn"));
    };

    expect(getCurrentCounter()).toBe("0");

    clickIncrement();

    await waitFor(() => {
      expect(getCurrentCounter()).toBe("1");
    });

    clickIncrement();

    await waitFor(() => {
      expect(getCurrentCounter()).toBe("2");
    });

    act(() => {
      clickIncrement();
      clickIncrement();
      clickIncrement();
    });

    await waitFor(() => {
      expect(getCurrentCounter()).toBe("5");
    });

    clickDecrement();

    await waitFor(() => {
      expect(getCurrentCounter()).toBe("4");
    });

    clickMultiply();

    await waitFor(() => {
      expect(getCurrentCounter()).toBe("8");
    });

    expect(onCounterChange).toHaveBeenCalledTimes(6);
    expect(onCounterChange.mock.calls).toEqual([
      [0],
      [1],
      [2],
      [5],
      [4],
      [8],
    ]);
  });

  describe("$effect", () => {
    it("should not trigger when changed props is not a dependency", () => {
      type Props = {
        value: number;
      };

      const onEffect = jest.fn();

      class Counter extends BetterComponent<Props> {
        constructor(props: Props) {
          super(props);

          this.$effect(onEffect, []);
        }

        render() {
          return <div>{this.props.value}</div>;
        }
      }

      const rendered = render(<Counter value={0} />);

      expect(onEffect).toHaveBeenCalledTimes(1);

      rendered.rerender(<Counter value={1} />);

      expect(onEffect).toHaveBeenCalledTimes(1);
    });

    it("should trigger when changed props is a dependency", () => {
      type Props = {
        value: number;
      };

      const onEffect = jest.fn();

      class Counter extends BetterComponent<Props> {
        constructor(props: Props) {
          super(props);

          this.$effect(onEffect, [this.depend.value]);
        }

        render() {
          return <div>{this.props.value}</div>;
        }
      }

      const rendered = render(<Counter value={0} />);

      expect(onEffect).toHaveBeenCalledTimes(1);

      rendered.rerender(<Counter value={1} />);

      expect(onEffect).toHaveBeenCalledTimes(2);
    });
  });

  describe("$computed", () => {
    it("should produce a computed readonly state", async () => {
      type Props = {
        value: number;
      };

      class MyComponent extends BetterComponent<Props> {
        intValue = this.$state(0);
        comp;

        constructor(props: Props) {
          super(props);

          this.comp = this.$computed(() => {
            return (
              this.intValue.get().toString() +
              "-" +
              this.props.value.toString()
            );
          }, [this.intValue, this.depend.value]);
        }

        handleClick = () => {
          this.intValue.set((c) => c + 1);
        };

        render() {
          return (
            <div>
              <div data-testid="out">{this.comp}</div>
              <button
                data-testid="increment-state"
                onClick={this.handleClick}
              >
                Click
              </button>
            </div>
          );
        }
      }

      const rendered = render(<MyComponent value={0} />);

      expect(rendered.getByTestId("out").textContent).toBe("0-0");

      fireEvent.click(rendered.getByTestId("increment-state"));

      await waitFor(() => {
        expect(rendered.getByTestId("out").textContent).toBe("1-0");
      });

      rendered.rerender(<MyComponent value={4} />);

      expect(rendered.getByTestId("out").textContent).toBe("1-4");
    });
  });

  describe("$mod", () => {
    it("should be able to manage state", () => {
      class Module extends ComponentModule {
        value = this.$state("abcd-4");

        constructor(params: any) {
          super(params);
        }

        setString(value: string) {
          this.value.set(value + "-" + value.length);
        }

        renderLabel() {
          return <span data-testid="mod-out">{this.value}</span>;
        }
      }

      class MyComponent extends BetterComponent {
        myState = this.$state("Hello");
        module = this.$mod(Module);

        render() {
          return (
            <div>
              <div data-testid="main-out">{this.myState}</div>
              {this.module.renderLabel()}
              <button
                data-testid="set-string"
                onClick={() => {
                  this.module.setString("World");
                }}
              >
                Set String
              </button>
            </div>
          );
        }
      }

      const rendered = render(<MyComponent />);

      expect(rendered.getByTestId("main-out").textContent).toBe(
        "Hello",
      );
      expect(rendered.getByTestId("mod-out").textContent).toBe(
        "abcd-4",
      );

      fireEvent.click(rendered.getByTestId("set-string"));

      expect(rendered.getByTestId("main-out").textContent).toBe(
        "Hello",
      );
      expect(rendered.getByTestId("mod-out").textContent).toBe(
        "World-5",
      );
    });

    it("should be able to create effects", () => {
      const onEffect = jest.fn();

      class Module extends ComponentModule {
        value = this.$state(0);

        constructor(params: any) {
          super(params);

          this.$effect(onEffect, [this.value]);
        }

        increment2() {
          this.value.set((v) => v + 2);
        }
      }

      class MyComponent extends BetterComponent {
        module = this.$mod(Module);

        render() {
          return (
            <div>
              <button
                data-testid="increment2"
                onClick={() => {
                  this.module.increment2();
                }}
              >
                Increment
              </button>
            </div>
          );
        }
      }

      const rendered = render(<MyComponent />);

      expect(onEffect).toHaveBeenCalledTimes(1);

      fireEvent.click(rendered.getByTestId("increment2"));

      expect(onEffect).toHaveBeenCalledTimes(2);
    });

    it("should be able to read the props and args", () => {
      type Props = {
        value: number;
      };

      type Args = [State<string>];

      const onPropChange = jest.fn();
      const onArgChange = jest.fn();

      class Module extends ComponentModule<Args, Props> {
        constructor(param: any) {
          super(param);

          const [label] = this.args;

          expect(label.get()).toBe("Hello");
          expect(this.props).toMatchObject({ value: 0 });

          this.$effect(onArgChange, [label]);
          this.$effect(onPropChange, [this.depend.value]);
        }

        out() {
          const [label] = this.args;

          return (
            <div>
              <span data-testid="mod-out-1">{label}</span>
              <span data-testid="mod-out-2">{this.props.value}</span>
            </div>
          );
        }
      }

      class MyComponent extends BetterComponent<Props> {
        label = this.$state("Hello");
        module = this.$mod(Module, this.label);

        changeLabel = () => {
          this.label.set("World");
        };

        render() {
          return (
            <div>
              {this.module.out()}
              <button
                data-testid="change-label"
                onClick={this.changeLabel}
              >
                Change Label
              </button>
            </div>
          );
        }
      }

      const rendered = render(<MyComponent value={0} />);

      expect(onArgChange).toHaveBeenCalledTimes(1);
      expect(onPropChange).toHaveBeenCalledTimes(1);
      expect(rendered.getByTestId("mod-out-1").textContent).toBe(
        "Hello",
      );
      expect(rendered.getByTestId("mod-out-2").textContent).toBe("0");

      fireEvent.click(rendered.getByTestId("change-label"));

      expect(onArgChange).toHaveBeenCalledTimes(2);
      expect(onPropChange).toHaveBeenCalledTimes(1);
      expect(rendered.getByTestId("mod-out-1").textContent).toBe(
        "World",
      );
      expect(rendered.getByTestId("mod-out-2").textContent).toBe("0");

      rendered.rerender(<MyComponent value={34} />);

      expect(onArgChange).toHaveBeenCalledTimes(2);
      expect(onPropChange).toHaveBeenCalledTimes(2);
      expect(rendered.getByTestId("mod-out-1").textContent).toBe(
        "World",
      );
      expect(rendered.getByTestId("mod-out-2").textContent).toBe(
        "34",
      );
    });
  });

  describe("$externalStore", () => {
    it("should be able to update with the external store", () => {
      const store = new Store("Hello");

      class MyComponent extends BetterComponent {
        label = this.$externalStore(store.subscribe, store.get);

        render() {
          return <div data-testid="out">{this.label}</div>;
        }
      }

      const rendered = render(<MyComponent />);

      expect(rendered.getByTestId("out").textContent).toBe("Hello");

      act(() => {
        store.set("World");
      });

      expect(rendered.getByTestId("out").textContent).toBe("World");
    });

    it("correctly produces computed values", () => {
      const store = new Store(1);
      const store2 = new Store(-1);

      class MyComponent extends BetterComponent {
        s1 = this.$externalStore(store.subscribe, store.get);
        s2 = this.$externalStore(store2.subscribe, store2.get);

        comp = this.$computed(() => {
          return `(${this.s1.get()}):(${this.s2.get()})`;
        }, [this.s1, this.s2]);

        render() {
          return <div data-testid="out">{this.comp}</div>;
        }
      }

      const rendered = render(<MyComponent />);

      expect(rendered.getByTestId("out").textContent).toBe(
        "(1):(-1)",
      );

      act(() => {
        store.set(2);
      });

      expect(rendered.getByTestId("out").textContent).toBe(
        "(2):(-1)",
      );

      act(() => {
        store2.set(-2);
      });

      expect(rendered.getByTestId("out").textContent).toBe(
        "(2):(-2)",
      );
    });
  });
});
