import React from "react";

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

export type DragHandler = () => {
  reset: () => void;
  start: (e: TouchEvent, touch: Touch) => void;
  move: (e: TouchEvent, touch: Touch) => void;
  end: (e: TouchEvent) => void;
};
export function useDragEvent({ dragHandler }: { dragHandler: DragHandler }) {
  React.useEffect(() => {
    const handler = dragHandler();
    function touchstart(e: TouchEvent) {
      if (e.touches.length !== 1) {
        handler.reset();
        return;
      }
      const [touch] = e.touches;
      handler.start(e, touch);
    }
    function touchmove(e: TouchEvent) {
      if (e.touches.length !== 1) {
        handler.reset();
        return;
      }
      const [touch] = e.touches;
      handler.move(e, touch);
    }
    function touchend(e: TouchEvent) {
      handler.end(e);
      handler.reset();
    }
    window.addEventListener("touchstart", touchstart, { passive: false });
    window.addEventListener("touchmove", touchmove, { passive: false });
    window.addEventListener("touchend", touchend, { passive: false });
    return () => {
      window.removeEventListener("touchstart", touchstart);
      window.removeEventListener("touchmove", touchmove);
      window.removeEventListener("touchend", touchend);
    };
  }, [dragHandler]);
}

export function useTransformsManager() {
  // it's typed as a string, but isn't actually
  type Transform = string;
  type Saved = { computed: Transform; style: Transform };
  const wmapRef = React.useRef(new WeakMap<HTMLElement, Saved>());
  const drag = React.useCallback(
    (element: HTMLElement, transform: Transform) => {
      const wmap = wmapRef.current;
      const saved = wmap.get(element);
      let original = saved?.computed ?? "";
      if (!saved) {
        original = getComputedStyle(element).transform;
        wmap.set(element, {
          computed: original,
          style: element.style.transform,
        });
      }
      if (original === "none") {
        element.style.transform = transform;
      } else {
        element.style.transform = original;
        element.style.transform += transform;
      }
    },
    [],
  );
  const dragReset = React.useCallback((element: HTMLElement) => {
    const wmap = wmapRef.current;
    const saved = wmap.get(element);
    if (saved) {
      element.style.transform = saved.style;
    }
    wmap.delete(element);
  }, []);
  return React.useMemo(
    () => ({
      drag,
      dragReset,
    }),
    [drag, dragReset],
  );
}
