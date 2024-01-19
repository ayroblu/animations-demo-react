import React from "react";
import { globalResizeObserver } from "../global-resize-observer";

export function useForceUpdate() {
  const [, forceUpdate] = React.useReducer((x) => x + 1, 0);
  return forceUpdate;
}

export function useDimensions() {
  const height = document.body.clientHeight;
  const width = document.body.clientWidth;
  const forceUpdate = useForceUpdate();
  React.useEffect(() => {
    window.addEventListener("resize", forceUpdate);
  }, [forceUpdate]);
  return {
    width,
    height,
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
      refs.current[key] = ref;
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
