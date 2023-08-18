import {
  act,
  fireEvent,
  render,
  waitFor,
} from "@testing-library/react";
import React from "react";
import { BetterComponent } from "../src/index";

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

  describe("computed", () => {
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
});
