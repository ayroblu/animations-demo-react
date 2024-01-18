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
  sourceRef: React.MutableRefObject<HTMLElement | null>,
  targetRef: React.MutableRefObject<(HTMLElement | null)[]>,
  callback: (source: HTMLElement, target: (HTMLElement | null)[]) => void,
) {
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
