/* eslint-disable @typescript-eslint/no-unused-vars */
import React from "react";

export const MapContext =
  (context: Record<string, React.Context<any>>) =>
  (Component: any, _: any) => {
    const ctxEntries = Object.entries(context);

    const getJsxElem = ctxEntries.reduce(
      (
        elem: (additionalProps: Record<string, any>) => JSX.Element,
        [name, ctx],
      ) => {
        return (additionalProps: Record<string, any>) =>
          React.createElement(
            ctx.Consumer,
            undefined,
            // @ts-expect-error
            (ctxValue: any) => {
              additionalProps["__ctx_" + name] = ctxValue;
              return elem(additionalProps);
            },
          );
      },
      (additionalProps: Record<string, any>) =>
        React.createElement(Component, additionalProps),
    );

    return class ContextInjector extends React.Component {
      render() {
        return getJsxElem({ ...this.props });
      }
    } as any;
  };
