import React from "react";
import { globalResizeObserver } from "../global-resize-observer";
import { getScrollParent } from ".";

export function useForceUpdate() {
  const [, forceUpdate] = React.useReducer((x) => x + 1, 0);
  return forceUpdate;
}

export function useDimensionsQuery<T>(
  callback: (params: { windowWidth: number; windowHeight: number }) => T,
): T {
  const forceUpdate = useForceUpdate();
  const valueRef = React.useRef<T>();
  valueRef.current = callback(getDimensions());
  const callbackRef = React.useRef(callback);
  callbackRef.current = callback;
  React.useEffect(() => {
    function resize() {
      const callback = callbackRef.current;
      const value = valueRef.current;
      const result = callback(getDimensions());
      if (value !== result) {
        forceUpdate();
      }
    }
    window.addEventListener("resize", resize);
    return () => {
      window.removeEventListener("resize", resize);
    };
  }, [forceUpdate]);

  return valueRef.current;
}

function getDimensions() {
  const windowHeight = document.documentElement.clientHeight;
  const windowWidth = document.documentElement.clientWidth;
  return {
    windowHeight,
    windowWidth,
  };
}

type ArrayRef = {
  onRef: (index: number) => (ref: HTMLElement | null) => void;
  refs: (HTMLElement | null)[];
};
export function useArrayRef(): ArrayRef {
  const refs = React.useRef<(HTMLElement | null)[]>([]);

  function onRef(key: number) {
    return (ref: HTMLElement | null) => {
      if (ref) {
        refs.current[key] = ref;
      }
    };
  }
  return {
    onRef,
    refs: refs.current,
  };
}

export function useSyncElements(
  sourceRef: React.RefObject<HTMLElement | null>,
  targetRef: React.RefObject<HTMLElement | null>,
  callback: (source: HTMLElement, target: HTMLElement) => void,
): void;
export function useSyncElements(
  sourceRef: React.RefObject<HTMLElement | null>,
  targetRef: React.RefObject<(HTMLElement | null)[]>,
  callback: (source: HTMLElement, target: (HTMLElement | null)[]) => void,
): void;
export function useSyncElements(
  sourceRef: React.RefObject<HTMLElement | null>,
  targetRef: React.RefObject<(HTMLElement | null)[] | (HTMLElement | null)>,
  callback: (
    source: HTMLElement,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    target: any,
    // TS Can't narrow callbacks for overloads
    // target: (HTMLElement | null)[] | HTMLElement,
  ) => void,
): void {
  const callbackRef = React.useRef(callback);
  callbackRef.current = callback;
  React.useEffect(() => {
    const source = sourceRef.current;
    const target = targetRef.current;
    if (!source || !target) {
      return;
    }
    const callback = callbackRef.current;

    callback(source, target);
    globalResizeObserver.observe(source, () => {
      callback(source, target);
    });
  }, [sourceRef, targetRef]);
}

export function useJoinRefs<T extends HTMLElement>(
  refs: React.ForwardedRef<T | null>[],
) {
  const stableRefs = React.useRef(refs);
  return React.useCallback((ref: T | null) => {
    for (const refItem of stableRefs.current) {
      if (refItem) {
        typeof refItem === "function" ? refItem(ref) : (refItem.current = ref);
      }
    }
  }, []);
}

type ResetParams = {
  getElement: () => HTMLElement | null;
  onReset: () => void;
};
export function useResetOnScrollOrTouch({ getElement, onReset }: ResetParams) {
  React.useEffect(() => {
    const el = getElement();
    if (!el) return;
    const element = el;
    const scrollElement = getScrollParent(element);
    function reset() {
      onReset();
      scrollElement.removeEventListener("touchmove", resetTouch, {
        capture: true,
      });
      scrollElement.removeEventListener("scroll", reset);
    }
    function resetTouch(e: Event) {
      if (e.target instanceof HTMLElement) {
        if (element?.contains(e.target)) return;
        reset();
      }
    }
    scrollElement.addEventListener("scroll", reset, { once: true });
    scrollElement.addEventListener("touchmove", resetTouch, { capture: true });
    return () => {
      scrollElement.removeEventListener("scroll", reset);
      scrollElement.removeEventListener("touchmove", resetTouch, {
        capture: true,
      });
    };
  }, [getElement, onReset]);
}
