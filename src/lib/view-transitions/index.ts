import React from "react";

type Deferred = ReturnType<typeof deferred>;
function deferred() {
  const result = {
    resolve: () => {},
    reject: () => {},
    promise: Promise.resolve(),
  };
  result.promise = new Promise<void>((resolve, reject) => {
    result.resolve = resolve;
    result.reject = reject;
  });
  return result;
}

export function useViewTransitions() {
  const deferredItemsRef: { current: Deferred[] } = React.useRef([]);
  const wrapInViewTransition = React.useCallback((func: () => void) => {
    const deferredItems = deferredItemsRef.current;
    if (!document.startViewTransition) {
      func();
    } else {
      document.startViewTransition(async () => {
        const def = deferred();
        deferredItems.push(def);
        func();
        await def.promise;
      });
    }
  }, []);
  React.useLayoutEffect(() => {
    const deferredItems = deferredItemsRef.current;
    if (deferredItems.length) {
      deferredItems.forEach((p) => {
        p.resolve();
      });
      deferredItemsRef.current = [];
    }
  });

  return {
    wrapInViewTransition,
  };
}

export function useNestedViewTransitions() {
  const deferredItemsRef: { current: Deferred[] } = React.useRef([]);
  const wrapInViewTransition = React.useCallback((func: () => void) => {
    const deferredItems = deferredItemsRef.current;
    if (!document.startViewTransition) {
      func();
    } else {
      document.startViewTransition(async () => {
        const def = deferred();
        deferredItems.push(def);
        func();
        await def.promise;
      });
    }
  }, []);
  React.useEffect(() => {
    const deferredItems = deferredItemsRef.current;
    if (deferredItems.length) {
      deferredItems.forEach((p) => {
        p.resolve();
      });
      deferredItemsRef.current = [];
    }
  });

  return {
    wrapInViewTransition,
  };
}
