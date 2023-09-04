/* eslint-disable @typescript-eslint/no-unused-vars */
import React from "react";

export const MapContext =
  (context: Record<string, React.Context<any>>) =>
  (Component: any, _?: any) => {
    const ctxEntries = Object.entries(context);

    const getJsxElem = ctxEntries.reduce(
      (
        elem: (additionalProps: Record<string, any>) => JSX.Element,
        [name, ctx],
      ) => {
        return (additionalProps: Record<string, any>) => (
          <ctx.Consumer>
            {(ctxValue: any) => {
              additionalProps["__ctx_" + name] = ctxValue;
              return elem(additionalProps);
            }}
          </ctx.Consumer>
        );
      },
      (additionalProps: Record<string, any>) => (
        <Component {...additionalProps} />
      ),
    );

    return class ContextInjector extends React.Component {
      render() {
        return getJsxElem({ ...this.props });
      }
    } as any;
  };
