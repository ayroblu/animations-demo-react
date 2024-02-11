import React from "react";

export function getTransformsManager(transformOrigin?: string) {
  // it's typed as a string, but may also be a "matrix"
  type Transform = string;
  type Saved = {
    computed: Transform;
    style: Transform;
  };
  const map = new Map<HTMLElement, Saved>();

  type Options = { transformOrigin?: string };
  function transformTo(
    element: HTMLElement,
    transform: Transform,
    options?: Options,
  ) {
    const saved = map.get(element);
    let original = saved?.computed ?? "";
    if (!saved) {
      original = getComputedStyle(element).transform;
      map.set(element, {
        computed: original,
        style: element.style.transform,
      });
    }
    ensureNoTransition(element);
    const localTransformOrigin = options?.transformOrigin ?? transformOrigin;
    if (localTransformOrigin) {
      // needed if we scale up and down
      element.style.transformOrigin = localTransformOrigin;
    }
    if (original === "none") {
      element.style.transform = transform;
    } else {
      element.style.transform = original;
      element.style.transform += transform;
    }
  }
  function transformReset(element: HTMLElement) {
    const saved = map.get(element);
    if (saved) {
      element.style.transform = saved.style;
      map.delete(element);
    }
  }
  return {
    transformTo,
    transformReset,
    getTransformedElements: () => map.keys(),
  };
}

const transitionMap = new WeakMap<HTMLElement, () => void>();
function withSingleTransition(
  element: HTMLElement,
  func: (cleanup: () => void) => () => void,
) {
  const dispose = transitionMap.get(element);
  dispose?.();

  const callback = func(() => {
    transitionMap.delete(element);
  });

  transitionMap.set(element, () => {
    callback();
  });
}
export function ensureNoTransition(element: HTMLElement) {
  const dispose = transitionMap.get(element);
  dispose?.();
}

export function transitionWrapper(
  element: HTMLElement,
  func: () => void,
  { transition, onEnd }: { transition?: string; onEnd?: () => void } = {},
) {
  withSingleTransition(element, (cleanup) => {
    const originalTransition = element.style.transition;
    element.style.transition = transition ?? "0.3s transform";
    const transitionend = () => {
      element.style.transition = originalTransition;
      cleanup();
      onEnd?.();
    };
    element.addEventListener("transitionend", transitionend, {
      once: true,
    });

    func();
    return () => {
      transitionend();
      element.removeEventListener("transitionend", transitionend);
    };
  });
}

export function useAnimationScrollListener(
  callback: () => { element: HTMLElement | null; onScroll: () => void },
) {
  const callbackRef = React.useRef(callback);
  callbackRef.current = callback;
  React.useEffect(() => {
    const callback = callbackRef.current;
    const { element: el, onScroll } = callback();
    if (!el) return;
    const element = el;
    // let timeoutId = 0;
    // let isScrolling = false;
    function handleScroll() {
      onScroll();
      // isScrolling = true;
      // cancelAnimationFrame(timeoutId);
      // timeoutId = requestAnimationFrame(() => {
      //   onScroll();
      //   if (isScrolling) {
      //     handleScroll();
      //   }
      // });
    }
    // function onScrollEnd() {
    //   isScrolling = false;
    // }
    element.addEventListener("scroll", handleScroll, { passive: true });
    // element.addEventListener("scrollend", onScrollEnd, { passive: true });
    return () => {
      element.removeEventListener("scroll", handleScroll);
      // element.removeEventListener("scrollend", onScrollEnd);
    };
  }, []);
}

export function manualTransitionTransform(
  func: () => void,
  durationMs: number,
  { onEnd }: { onEnd: () => void },
) {
  const startTime = Date.now();
  function handler() {
    if (Date.now() - startTime > durationMs) {
      onEnd();
      return;
    }
    requestAnimationFrame(() => {
      func();
      handler();
    });
  }
  handler();
}

type Resettable<T> = {
  resetAll: () => void;
  reset: (key: T) => void;
  set: (key: T, resetter: () => void) => void;
};
export function getResetable<T>(): Resettable<T> {
  const map = new Map<T, () => void>();
  function resetAll() {
    for (const [key, resetter] of map) {
      resetter();
      map.delete(key);
    }
  }
  function reset(key: T) {
    const resetter = map.get(key);
    if (resetter) {
      resetter();
      map.delete(key);
    }
  }
  function set(key: T, resetter: () => void) {
    map.set(key, resetter);
  }
  return {
    resetAll,
    reset,
    set,
  };
}
