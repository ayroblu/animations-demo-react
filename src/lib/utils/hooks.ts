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
export function useDragEvent({
  dragHandler,
  getElement,
}: {
  dragHandler: DragHandler;
  getElement: () => HTMLElement;
}) {
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
    const element = getElement();
    element.addEventListener("touchstart", touchstart, { passive: false });
    element.addEventListener("touchmove", touchmove, { passive: false });
    element.addEventListener("touchend", touchend, { passive: false });
    return () => {
      element.removeEventListener("touchstart", touchstart);
      element.removeEventListener("touchmove", touchmove);
      element.removeEventListener("touchend", touchend);
    };
  }, [dragHandler, getElement]);
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
export function transitionWrapper(element: HTMLElement, func: () => void) {
  const originalTransition = element.style.transition;
  element.style.transition = "0.3s transform";
  const transitionend = () => {
    element.style.transition = originalTransition;
  };
  element.addEventListener("transitionend", transitionend, { once: true });
  requestAnimationFrame(() => {
    func();
  });
}
