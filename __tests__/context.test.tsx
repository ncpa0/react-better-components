import { fireEvent, render, waitFor } from "@testing-library/react";
import React, { ContextType } from "react";
import { MapContext } from "../src/context-decorator";
import { BetterComponent } from "../src/index";

describe("@MapContext", () => {
  it("should correctly map contexts", async () => {
    const MyContext = React.createContext({
      value: "foo",
      changeFoo: (to: string) => {},
    });

    @MapContext({ myCtx: MyContext })
    class MyComponent extends BetterComponent {
      declare myCtx: ContextType<typeof MyContext>;

      render() {
        return <div data-testid="output">{this.myCtx.value}</div>;
      }
    }

    class MyProvider extends BetterComponent<React.PropsWithChildren> {
      value = this.$state("bar");

      changeFoo = (to: string) => {
        this.value.set(to);
      };

      render(): React.ReactNode {
        return (
          <MyContext.Provider
            value={{
              value: this.value.get(),
              changeFoo: this.changeFoo,
            }}
          >
            {this.props.children}
          </MyContext.Provider>
        );
      }
    }

    const app = render(
      <div>
        <MyProvider>
          <MyComponent />
          <MyContext.Consumer>
            {(ctx) => (
              <button
                data-testid="change-ctx-val"
                onClick={() => ctx.changeFoo("baz")}
              >
                Change
              </button>
            )}
          </MyContext.Consumer>
        </MyProvider>
      </div>,
    );

    const myComponent = await app.findByTestId("output");
    const changeCtxValBtn = await app.findByTestId("change-ctx-val");

    expect(myComponent.textContent).toBe("bar");

    fireEvent.click(changeCtxValBtn);

    await waitFor(async () => {
      const myComponent = await app.findByTestId("output");
      expect(myComponent.textContent).toBe("baz");
    });
  });

  it("should correctly map multiple contexts", async () => {
    const FooContext = React.createContext({
      value: "foo",
      changeFoo: (to: string) => {},
    });

    const BarContext = React.createContext({
      value: "bar",
      changeBar: (to: string) => {},
    });

    @MapContext({
      fooCtx: FooContext,
      barCtx: BarContext,
    })
    class MyComponent extends BetterComponent {
      declare fooCtx: ContextType<typeof FooContext>;
      declare barCtx: ContextType<typeof BarContext>;

      render() {
        return (
          <div>
            <label data-testid="foo-out">{this.fooCtx.value}</label>
            <label data-testid="bar-out">{this.barCtx.value}</label>
          </div>
        );
      }
    }

    class FooProvider extends BetterComponent<React.PropsWithChildren> {
      value = this.$state("foo1");

      changeFoo = (to: string) => {
        this.value.set(to);
      };

      render(): React.ReactNode {
        return (
          <FooContext.Provider
            value={{
              value: this.value.get(),
              changeFoo: this.changeFoo,
            }}
          >
            {this.props.children}
          </FooContext.Provider>
        );
      }
    }

    class BarProvider extends BetterComponent<React.PropsWithChildren> {
      value = this.$state("bar1");

      changeBar = (to: string) => {
        this.value.set(to);
      };

      render(): React.ReactNode {
        return (
          <BarContext.Provider
            value={{
              value: this.value.get(),
              changeBar: this.changeBar,
            }}
          >
            {this.props.children}
          </BarContext.Provider>
        );
      }
    }

    const app = render(
      <div>
        <FooProvider>
          <BarProvider>
            <MyComponent />
            <FooContext.Consumer>
              {(ctx) => (
                <button
                  data-testid="change-foo-btn"
                  onClick={() => ctx.changeFoo("not a foo, frfr")}
                >
                  Change Foo
                </button>
              )}
            </FooContext.Consumer>
            <BarContext.Consumer>
              {(ctx) => (
                <button
                  data-testid="change-bar-btn"
                  onClick={() => ctx.changeBar("not a bar, frfr")}
                >
                  Change Bar
                </button>
              )}
            </BarContext.Consumer>
          </BarProvider>
        </FooProvider>
      </div>,
    );

    const fooOut = await app.findByTestId("foo-out");
    const barOut = await app.findByTestId("bar-out");

    expect(fooOut.textContent).toBe("foo1");
    expect(barOut.textContent).toBe("bar1");

    const changeFooBtn = await app.findByTestId("change-foo-btn");

    fireEvent.click(changeFooBtn);

    await waitFor(async () => {
      const fooOut = await app.findByTestId("foo-out");
      const barOut = await app.findByTestId("bar-out");

      expect(fooOut.textContent).toBe("not a foo, frfr");
      expect(barOut.textContent).toBe("bar1");
    });

    const changeBarBtn = await app.findByTestId("change-bar-btn");

    fireEvent.click(changeBarBtn);

    await waitFor(async () => {
      const fooOut = await app.findByTestId("foo-out");
      const barOut = await app.findByTestId("bar-out");

      expect(fooOut.textContent).toBe("not a foo, frfr");
      expect(barOut.textContent).toBe("not a bar, frfr");
    });
  });
});
